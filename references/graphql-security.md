# graphql-security.md

GraphQL n'est pas "moins sûr" que REST, mais il **déplace** les points de contrôle. Le vrai risque n'est pas la présence d'un endpoint `/graphql`; c'est le fait qu'un client peut choisir **la forme, la profondeur, le coût et parfois les propriétés exactes** de la requête. Les contrôles doivent donc être pensés autour de quatre questions :

1. **Qui peut appeler quoi ?**  
   AuthN/AuthZ sur l'objet, le champ et l'action.
2. **Quelle quantité de travail la requête déclenche-t-elle ?**  
   Depth limit, complexity budget, alias/batching caps, fan-out backend.
3. **Que révèle l'API sur elle-même ?**  
   Introspection, suggestions de champs, messages d'erreur, IDs globaux.
4. **Comment l'API sort du modèle request/response classique ?**  
   Upload multipart, persisted queries, subscriptions WebSocket, N+1, telemetry.

---

## Baseline minimum

- AuthN forte au niveau transport.
- AuthZ **au niveau objet** et **au niveau propriété**.  
  Un resolver qui "retourne l'objet si l'utilisateur est connecté" n'est pas suffisant.
- Limites **de profondeur** et **de complexité/cost**.
- Limites **de volume** : taille de document, nombre d'aliases, nombre d'opérations par lot, taille de réponse.
- Introspection **désactivée en production** pour les clients non privilégiés.
- Télémetrie par opération : nom, profondeur, coût, alias count, backend calls, latency, erreurs, principal, tenant.
- Persisted queries **allowlistées** pour les surfaces publiques quand c'est possible.
- Erreurs **masquées** côté client, détaillées seulement côté logs internes.

---

## 1) Depth limit

La profondeur limite les arbres du style :

```graphql
query {
  me {
    manager {
      manager {
        manager {
          reports {
            manager {
              reports {
                id
              }
            }
          }
        }
      }
    }
  }
}
```

### Recommandation

- Public API : profondeur max **6 à 8** pour commencer.
- API interne / BFF : **8 à 12** si la télémétrie montre des besoins réels.
- Exclure les champs triviaux du coût, **pas** de la profondeur, sauf justification.
- Appliquer la règle avant exécution.

### À ne pas faire

- Se contenter d'un rate limit HTTP "par requête".
- Autoriser une profondeur élevée sans complexity budget.
- Exempter tout un client mobile sans métriques par opération.

---

## 2) Complexity analysis (cost-based)

La profondeur seule ne voit pas les requêtes "plates" mais très coûteuses :

```graphql
query SearchEverything {
  users(first: 1000) { edges { node { id email roles teams { id name } } } }
  invoices(first: 1000) { edges { node { id amount customer { id tier } } } }
  projects(first: 1000) { edges { node { id repo ciRuns(first: 100) { id status } } } }
}
```

### Modèle pratique

Définir un **coût** par champ :

- scalaire simple : `1`
- relation 1->1 : `2`
- connexion paginée : `base + multiplicateur * first`
- champs qui frappent un backend cher : coût majoré
- champs "admin", "search", "export" : coût majoré + cap serveur

Exemple simple :

```text
total_cost =
  somme(des coûts des champs)
  + somme(des multiplicateurs de pagination)
  + surcharge sur les champs à fan-out backend
```

### Recommandation

- Fixer un **budget global** par opération, par exemple `300` ou `500`.
- Ajouter un **budget par rôle** si certains clients sont internes.
- Logger le coût calculé pour chaque opération.
- Refuser les requêtes sans nom d'opération en prod si vous dépendez de métriques fines.

### À ne pas faire

- Autoriser `first: 1000` partout parce que "le client en a besoin".
- Compter seulement les nœuds GraphQL sans regarder le fan-out SQL/HTTP réel.
- Réserver le cost analysis au gateway sans feedback sur les resolvers coûteux.

---

## 3) Persisted queries / APQ

Il faut distinguer deux mécanismes :

### APQ (Automatic Persisted Queries)

- But principal : **performance**.
- Le client envoie un **hash SHA-256**.
- Si le serveur ne connaît pas ce hash, le client renvoie ensuite la requête complète.
- Très utile pour réduire la taille des requêtes et améliorer le cache CDN.

### Persisted queries allowlistées

- But principal : **sécurité + stabilité**.
- Seules les requêtes connues, versionnées et publiées dans un manifeste sont acceptées.
- Beaucoup plus fort contre la découverte opportuniste, le batching arbitraire et les requêtes "handcrafted".

### Recommandation

- **Surface publique / mobile / web grand public** : privilégier l'**allowlist**.
- **Surface interne** : APQ possible, mais garder depth/complexity/rate limits.
- Ne pas vendre APQ comme un contrôle de sécurité en soi.

### Anti-pattern

- "On a APQ, donc on peut laisser l'introspection et les batch requests".
- "On allowliste les requêtes, donc on n'a plus besoin d'AuthZ au niveau champ".

---

## 4) Introspection en production

L'introspection n'est pas une vulnérabilité en soi, mais elle :

- accélère la cartographie par un attaquant,
- révèle les types, relations, mutations admin et noms de champs,
- augmente l'efficacité des attaques de fuzzing et BOLA/BOPLA.

### Recommandation

- **Désactiver en prod** pour les clients non privilégiés.
- Si vous devez la garder :
  - restreindre aux admin/dev internes,
  - loguer les appels,
  - exiger un client ID approuvé ou une origine de confiance.

### Anti-pattern

- Laisser GraphiQL / Playground en prod "car il faut bien débugger".
- Confondre désactivation de l'IDE et désactivation de l'introspection.

---

## 5) Batching attacks

Si votre serveur accepte un tableau d'opérations dans une même requête HTTP, un attaquant peut :

- contourner un rate limit compté "par requête",
- mélanger de petites requêtes d'énumération,
- amplifier l'impact CPU/mémoire.

### Recommandation

- Désactiver le batching si vous n'en avez pas besoin.
- Sinon :
  - caper le nombre d'opérations par lot,
  - appliquer le coût **sur l'ensemble du batch**,
  - compter le batch comme **N opérations** pour le rate limiting.

---

## 6) Alias-based DoS

Exemple :

```graphql
query {
  a1: search(q: "x") { id }
  a2: search(q: "x") { id }
  a3: search(q: "x") { id }
  # ...
  a500: search(q: "x") { id }
}
```

Un rate limit naïf voit "une requête". Le backend voit potentiellement **500 exécutions**.

### Recommandation

- Caper le **nombre d'aliases**.
- Intégrer `alias_count` dans le coût.
- Rejeter les documents avec trop de tokens ou de champs répétés.

---

## 7) Field suggestions leak

Beaucoup de serveurs répondent :

> Cannot query field `usrs`. Did you mean `users`?

C'est très utile pour un développeur, et très utile aussi pour un attaquant en phase de cartographie.

### Recommandation

- Désactiver les suggestions en production si le framework le permet.
- Sinon, masquer les détails côté client via un error presenter / formatter.
- Ne jamais renvoyer la stack interne ou les noms de types admin.

---

## 8) IDOR via node IDs (Relay)

Relay et les global IDs ne suppriment **pas** le risque d'IDOR/BOLA.  
Un ID global n'est qu'un autre identifiant. Même s'il est base64-encodé, il reste souvent :

- prévisible,
- rejouable,
- ou facilement collectable depuis l'UI.

### Recommandation

- Contrôler l'accès **dans le resolver de l'objet**, pas seulement dans le parent.
- Vérifier `tenant_id`, ownership, relation métier, état de l'objet.
- Imposer des caps de pagination sur les connexions Relay.
- Logger les `node(id:)` et les IDs décodés côté serveur.

### Anti-pattern

- "Le global ID n'est pas séquentiel, donc ce n'est pas de l'IDOR."
- Contrôle d'accès au niveau liste, mais pas au niveau `node(id:)`.

---

## 9) N+1 abuse

Le N+1 n'est pas qu'un problème de perf accidentelle. C'est aussi une surface d'abus :

- un client peut forcer un fan-out énorme,
- provoquer de la saturation SQL/HTTP,
- exploiter des champs apparemment innocents mais très chers.

### Recommandation

- Utiliser des dataloaders / batch resolvers.
- Instrumenter `resolver_count`, `db.query.count`, `downstream_call_count`.
- Ajouter un coût spécifique aux champs qui fan-outent.
- Mettre un plafond serveur sur `first`, `last`, `limit`.

---

## 10) Error masking

En prod, le client ne doit pas recevoir :

- stack trace,
- nom de table,
- message SQL,
- détails d'upstream,
- noms de types/resolvers internes.

### Recommandation

- Répondre avec un message générique.
- Mettre un code stable côté `extensions.code` si besoin.
- Conserver le détail complet en logs/traces corrélés.

### Anti-pattern

- Réutiliser tel quel `err.Error()` depuis l'ORM ou l'upstream.
- Faire dépendre le comportement client d'un message d'erreur non stable.

---

## 11) File upload via multipart spec

Le **meilleur** modèle pour les fichiers reste :

1. mutation pour demander une URL signée,
2. upload direct vers storage,
3. mutation de confirmation avec métadonnées serveur.

### Pourquoi éviter le multipart GraphQL natif ?

- surface CSRF/browser plus subtile,
- backpressure plus difficile,
- parsing plus risqué,
- mélange de logique API et de transport fichier,
- validation et scanning souvent oubliés.

### Si vous devez accepter le multipart GraphQL

- limiter **taille**, **type MIME**, **nombre de fichiers**,
- scanner antivirus / malware,
- renommer côté serveur,
- interdire les noms/path fournis par le client,
- isoler le stockage,
- exiger protection CSRF adaptée,
- ne jamais faire confiance au `Content-Type` seul.

---

## 12) Subscription auth (WebSocket upgrade)

Les subscriptions cassent l'illusion "un token vérifié par requête HTTP suffit".

### Points de contrôle

- Auth au moment du **WebSocket upgrade** ou du `connection_init`.
- Contexte d'autorisation injecté dans la subscription.
- Revalidation si token expiré ou refresh nécessaire.
- Vérification **à chaque événement** si le droit dépend de l'objet/tenant.
- `CheckOrigin` / origin allowlist strict.
- Quotas de connexions simultanées et de subscriptions par socket.

### Anti-pattern

- Vérifier seulement la présence d'un token, pas sa validité.
- Faire l'AuthZ au moment de la souscription, puis pousser des événements sans re-filtrage.
- Accepter toute origine WebSocket.

---

## Apollo Server (Node) — exemples

### 1. Base sécurisée : introspection off, erreurs masquées, CSRF, depth limit

```ts
import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";

const server = new ApolloServer({
  schema,
  introspection: false, // prod
  hideSchemaDetailsFromClientErrors: true,
  csrfPrevention: true,
  validationRules: [
    depthLimit(8),
  ],
  formatError(formattedError) {
    // Garder le détail dans les logs; renvoyer un message stable au client.
    return {
      message: "Request rejected",
      extensions: {
        code: formattedError.extensions?.code ?? "GRAPHQL_ERROR",
      },
    };
  },
});
```

### 2. Complexity rule (cost-based)

```ts
import { ApolloServer } from "@apollo/server";
import { createComplexityRule, simpleEstimator, fieldExtensionsEstimator } from "graphql-query-complexity";
import depthLimit from "graphql-depth-limit";

const complexityRule = createComplexityRule({
  maximumComplexity: 400,
  estimators: [
    fieldExtensionsEstimator(),
    simpleEstimator({ defaultComplexity: 1 }),
  ],
  onComplete: (complexity: number) => {
    console.log("graphql_complexity", { complexity });
  },
});

const server = new ApolloServer({
  schema,
  introspection: false,
  hideSchemaDetailsFromClientErrors: true,
  csrfPrevention: true,
  validationRules: [depthLimit(8), complexityRule],
});
```

> Astuce : pour les champs chers, déclarez un coût via une extension de schéma ou un registre côté serveur, puis majorer les connexions paginées.

### 3. Persisted queries allowlistées

```ts
import crypto from "node:crypto";
import express from "express";

const app = express();
app.use(express.json());

const allowlist = new Set([
  // SHA-256 d'opérations normalisées et publiées
  "7b3f6e4c2f5d6a4f6b1d54b9f3f5a4e9c7f3b1d8a9c4e2f6d1b3c5a7e9f1d2c3",
]);

app.use("/graphql", (req, res, next) => {
  const hash = req.body?.extensions?.persistedQuery?.sha256Hash;
  if (!hash || !allowlist.has(hash)) {
    return res.status(403).json({
      errors: [{ message: "Unknown persisted query" }],
    });
  }
  next();
});
```

### 4. Upload : préférer URL signée ; si multipart obligé, l'entourer sévèrement

```ts
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { graphqlUploadExpress, GraphQLUpload } from "graphql-upload";

const app = express();
app.use(graphqlUploadExpress({
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 2,
}));

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Upload: GraphQLUpload,
    Mutation: {
      async uploadAvatar(_: unknown, { file }: any, ctx: MyContext) {
        if (!ctx.principal) throw new Error("Unauthorized");

        const upload = await file;
        if (!["image/png", "image/jpeg"].includes(upload.mimetype)) {
          throw new Error("Unsupported media type");
        }

        // Ne pas utiliser le nom fourni par le client comme chemin final.
        const safeObjectKey = `avatars/${ctx.principal.userId}/${crypto.randomUUID()}`;
        // stream -> AV scan -> object storage
        return { ok: true, objectKey: safeObjectKey };
      },
    },
  },
  csrfPrevention: true,
});
```

### 5. Subscription auth via `graphql-ws`

```ts
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

useServer(
  {
    schema,
    onConnect: async (ctx) => {
      const auth = String(ctx.connectionParams?.authorization ?? "");
      if (!auth) throw new Error("Unauthorized");
    },
    context: async (ctx) => {
      const auth = String(ctx.connectionParams?.authorization ?? "");
      const principal = await verifyBearer(auth);
      if (!principal) throw new Error("Unauthorized");
      return { principal };
    },
  },
  wsServer,
);
```

**À ajouter en vrai** : allowlist d'origines, quotas par socket, revalidation du token avant push d'événements sensibles.

---

## Strawberry (Python) — exemples

> Les exemples ci-dessous montrent surtout la structure des contrôles. Adaptez l'intégration (ASGI, FastAPI, Django, etc.) à votre stack.

### 1. Désactiver IDE, introspection et field suggestions

```python
import strawberry
from strawberry.schema.config import StrawberryConfig
from strawberry.extensions import AddValidationRules
from graphql.validation import NoSchemaIntrospectionCustomRule

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

schema = strawberry.Schema(
    query=Query,
    config=StrawberryConfig(
        disable_field_suggestions=True,
        relay_max_results=50,
    ),
    extensions=[
        AddValidationRules([NoSchemaIntrospectionCustomRule]),
        # Ajoutez ici vos règles depth / alias / token caps
    ],
)
```

### 2. Intégration FastAPI avec contexte d'auth

```python
from fastapi import FastAPI, Request, WebSocket
from strawberry.fastapi import GraphQLRouter

async def get_context(request: Request | WebSocket):
    auth = request.headers.get("authorization", "")
    principal = await verify_bearer(auth)
    if not principal:
        raise Exception("Unauthorized")
    return {"principal": principal}

graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphql_ide=None,                 # pas d'IDE en prod
    multipart_uploads_enabled=False,  # garder False par défaut
)

app = FastAPI()
app.include_router(graphql_app, prefix="/graphql")
```

### 3. Mutation avec AuthZ objet / propriété

```python
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def update_user_role(self, info, user_id: strawberry.ID, role: str) -> bool:
        principal = info.context["principal"]
        if not principal.is_admin:
            raise Exception("Forbidden")

        if role not in {"viewer", "editor", "admin"}:
            raise Exception("Invalid role")

        await user_service.update_role(user_id=user_id, role=role, actor_id=principal.user_id)
        return True
```

### 4. Upload : préférence pour URL signée, sinon encadrer très fort

```python
# Modèle recommandé
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_upload_url(self, info, filename: str, content_type: str) -> str:
        principal = info.context["principal"]
        if not principal:
            raise Exception("Unauthorized")
        if content_type not in {"image/png", "image/jpeg"}:
            raise Exception("Unsupported media type")

        return await object_store.create_signed_upload_url(
            owner_id=principal.user_id,
            content_type=content_type,
            ttl_seconds=300,
        )
```

### 5. Notes Strawberry spécifiques

- `graphql_ide=None` en production.
- `multipart_uploads_enabled=False` par défaut : gardez ce choix tant que possible.
- `disable_field_suggestions=True` réduit la fuite d'information de type "Did you mean...".
- `relay_max_results` doit être serré pour empêcher les connexions trop larges.
- Ajoutez des extensions/règles pour :
  - profondeur,
  - nombre d'aliases,
  - nombre de tokens,
  - taille de document.

---

## gqlgen (Go) — exemples

### 1. Serveur minimal sans introspection en prod + complexity limit

```go
package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

type principalKey struct{}

func main() {
	srv := handler.New(executableSchema)

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	srv.Use(extension.FixedComplexityLimit(400))

	if os.Getenv("ENV") != "production" {
		srv.Use(extension.Introspection{})
	}

	srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error {
		err := graphql.DefaultErrorPresenter(ctx, e)
		err.Message = "Request rejected"
		return err
	})

	srv.SetRecoverFunc(func(ctx context.Context, err interface{}) error {
		return gqlerror.Errorf("Internal server error")
	})

	http.Handle("/graphql", srv)
	http.ListenAndServe(":8080", nil)
}
```

### 2. Subscription auth au `connection_init` + origin allowlist

```go
srv.AddTransport(transport.Websocket{
	KeepAlivePingInterval: 15 * time.Second,
	Upgrader: websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return r.Header.Get("Origin") == "https://app.example.com"
		},
	},
	InitFunc: func(ctx context.Context, initPayload transport.InitPayload) (context.Context, error) {
		token := initPayload.Authorization()
		if token == "" {
			return nil, errors.New("missing authorization")
		}

		principal, err := verifyBearer(token)
		if err != nil {
			return nil, errors.New("unauthorized")
		}

		return context.WithValue(ctx, principalKey{}, principal), nil
	},
})
```

### 3. Upload via multipart spec : bornes mémoire et taille

```yaml
# gqlgen.yml
uploadMaxSize: 10485760   # 10 MiB
uploadMaxMemory: 1048576  # 1 MiB en mémoire avant spill to disk
```

### 4. Resolver avec contrôle d'accès objet

```go
func (r *queryResolver) Invoice(ctx context.Context, id string) (*model.Invoice, error) {
	principal, _ := ctx.Value(principalKey{}).(*Principal)
	if principal == nil {
		return nil, errors.New("unauthorized")
	}

	invoice, err := r.invoiceStore.ByID(ctx, id)
	if err != nil {
		return nil, errors.New("not found")
	}

	if invoice.TenantID != principal.TenantID && !principal.IsAdmin {
		return nil, errors.New("forbidden")
	}

	return invoice, nil
}
```

---

## Contrôles complémentaires à prévoir côté gateway / edge

- Rate limit par :
  - IP,
  - utilisateur,
  - client ID,
  - operation name,
  - coût cumulé.
- Rejet des documents anonymes ou trop gros.
- Taille max de body.
- Quotas distincts pour mutations, subscriptions et requêtes coûteuses.
- Journalisation de :
  - `operation_name`,
  - `principal`,
  - `tenant`,
  - `depth`,
  - `complexity`,
  - `alias_count`,
  - `resolver_count`,
  - `db_query_count`,
  - `persisted_query_hash`,
  - `status_code`,
  - `error_code`.

---

## Checklist de revue hostile

| Contrôle | Ce qu'il faut voir | Red flag |
|---|---|---|
| Depth limit | Règle active en prod | seulement en staging |
| Complexity budget | coût max + logs | aucune télémétrie par opération |
| Persisted queries | manifeste versionné / allowlist | APQ seule vendue comme sécurité |
| Introspection | désactivée ou restreinte | GraphiQL/Playground exposé en prod |
| Alias / batching | caps explicites | batch libre et non compté |
| AuthZ objet | vérification dans chaque resolver sensible | contrôle seulement au parent |
| AuthZ propriété | whitelist/guards de champs sensibles | `roles`, `ssn`, `apiKeys` sortent au client standard |
| Error masking | presenter/formatter | `err.Error()` renvoyé tel quel |
| Upload | URL signée ou bornes strictes | multipart sans AV, sans CSRF, sans caps |
| Subscriptions | Auth au handshake + revalidation | token lu une fois puis oublié |
| Relay/node IDs | vérification ownership/tenant | confiance dans l'opacité base64 |
| N+1 | dataloaders + métriques | fan-out backend non mesuré |

---

## CWE mapping

| Sujet | CWE principal | Notes |
|---|---|---|
| IDOR / BOLA | CWE-639 | Authorization Bypass Through User-Controlled Key |
| BOPLA / surexposition de champs | CWE-200 / CWE-863 | exposition de données + authz insuffisante |
| Mass assignment | CWE-915 | modification de propriétés dynamiques non contrôlée |
| JWT `alg=none` / confusion de claims | CWE-345 / CWE-347 | authenticité / signature mal vérifiées |
| SSRF | CWE-918 | Server-Side Request Forgery |
| Alias DoS / batching / N+1 abuse | CWE-400 | Uncontrolled Resource Consumption |
| Introspection / suggestions / erreurs bavardes | CWE-200 / CWE-209 | divulgation d'information |
| Upload multipart mal encadré | CWE-434 | upload de type dangereux ; compléter avec contrôles CSRF |
| Subscription auth insuffisante | CWE-306 / CWE-862 | fonction critique non suffisamment authentifiée/autorisée |

---

## Mapping OWASP API Security Top 10 (2023)

| GraphQL risk | OWASP API Top 10 |
|---|---|
| IDOR via `node(id:)`, objets REST/GraphQL voisins | API1: Broken Object Level Authorization |
| JWT faible, subscription auth faible | API2: Broken Authentication |
| Sensitive field overfetch, mass assignment | API3: Broken Object Property Level Authorization |
| Depth/complexity/batching/alias/N+1 abuse | API4: Unrestricted Resource Consumption |
| Introspection, field suggestions, GraphiQL en prod, erreurs détaillées | API8: Security Misconfiguration |
| SSRF via fetchers / webhooks / URL import | API7: Server-Side Request Forgery |
| Flows de login exposés au credential stuffing | API6: Unrestricted Access to Sensitive Business Flows |

---

## Règles simples de design

- **AuthN/AuthZ partout où l'objet redevient adressable**.
- **Ce qui est coûteux doit être mesuré, puis borné**.
- **Ce qui aide le développeur en prod aide aussi l'attaquant**.
- **Un hash (APQ) n'est pas une allowlist**.
- **Base64 n'est pas une autorisation**.
- **Une subscription n'est pas une requête HTTP longue : c'est un canal vivant**.