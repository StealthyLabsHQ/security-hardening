# browser-security-modern.md

Ce document complète `secure-headers.md`. L'idée n'est pas d'empiler des headers "au hasard", mais de traiter des attaques qui passent **après** les défenses classiques :

- DOM XSS dans des sinks modernes,
- cross-origin leaks et confusion de contexte,
- abus des subresources tierces,
- permissions browser trop larges,
- surfaces WebSocket / Worker / WASM / SharedArrayBuffer,
- politiques d'isolation mal comprises.

---

## 1) Trusted Types

`Trusted Types` durcit les **DOM injection sinks** (`innerHTML`, `insertAdjacentHTML`, `srcdoc`, certains sinks de script/URL, etc.) en imposant que l'entrée passe par une **policy** explicite.

### CSP minimale

```http
Content-Security-Policy:
  require-trusted-types-for 'script';
  trusted-types app-sanitize;
```

### Pattern recommandé

- Une policy **unique** ou très peu de policies nommées.
- Une fonction de transformation qui :
  - assainit le HTML,
  - refuse les URLs/scripts non approuvés,
  - centralise les exceptions.
- Déploiement d'abord en **report-only** si le front est ancien.

### Exemple

```js
if (typeof trustedTypes === "undefined") {
  // tinyfill: garde le même chemin de code dans les navigateurs sans enforcement
  trustedTypes = { createPolicy: (_name, rules) => rules };
}

const policy = trustedTypes.createPolicy("app-sanitize", {
  createHTML: (input) => DOMPurify.sanitize(input),
});

const trustedHTML = policy.createHTML(userSuppliedHtml);
document.querySelector("#content").innerHTML = trustedHTML;
```

### Ce que Trusted Types ne fait pas

- ne remplace pas une vraie sanitization,
- ne corrige pas un backend qui renvoie du HTML dangereux,
- ne protège pas un code legacy si vous gardez des échappatoires partout.

### À éviter

- plusieurs policies "temporairement" permissives qui deviennent permanentes,
- policy "default" qui retourne presque n'importe quoi,
- conserver `'unsafe-inline'` et croire que TT compense tout.

---

## 2) Sanitizer API

La `Sanitizer API` fournit une sanitization native browser pour certains cas d'usage DOM.

### Quand l'utiliser

- **progressive enhancement**,
- surfaces contrôlées de rendu HTML enrichi,
- expérimentations où vous voulez éviter une dépendance JS lourde.

### Quand ne pas en dépendre seule

- flotte navigateur hétérogène,
- besoin de comportement identique partout,
- besoin d'une politique de sanitization très contrôlée.

### Exemple

```js
const sanitizer = new Sanitizer();
const safe = Document.parseHTMLUnsafe(untrustedHtml, { sanitizer });
document.querySelector("#preview").replaceChildren(...safe.body.childNodes);
```

### Position pratique

- Gardez **DOMPurify** (ou équivalent) comme base portable.
- Utilisez Sanitizer API comme optimisation / amélioration progressive.
- Si vous combinez avec Trusted Types, faites produire un `TrustedHTML` via votre policy.

---

## 3) COEP / COOP / CORP en pratique

Ces trois headers servent à isoler correctement votre document et ses sous-ressources.

### Cas concret : SharedArrayBuffer

Si vous voulez `SharedArrayBuffer`, WebAssembly threads ou un profil d'isolation fort, il vous faut généralement :

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

et des subresources compatibles (CORS ou CORP).

### Rôles

- **COOP** (`Cross-Origin-Opener-Policy`)  
  Isole la page des autres contexts d'ouverture pour éviter certains partages de process/context.
- **COEP** (`Cross-Origin-Embedder-Policy`)  
  Interdit d'embarquer des ressources cross-origin qui ne sont pas explicitement partageables.
- **CORP** (`Cross-Origin-Resource-Policy`)  
  Déclare côté ressource si elle peut être chargée cross-origin.

### Exemple typique

Page principale :

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

JS/wasm/font servi par votre CDN :

```http
Cross-Origin-Resource-Policy: same-site
```

### Piège classique

Vous activez COEP/COOP et soudain :

- un script analytics tiers ne charge plus,
- une police externe casse,
- une iframe de paiement ne fonctionne plus,
- `window.crossOriginIsolated` reste `false`.

### Méthode de déploiement

1. Inventorier **toutes** les subresources et iframes.
2. Décider ce qui doit être self-hosted.
3. Faire corriger CORS/CORP sur les ressources nécessaires.
4. Tester `window.crossOriginIsolated === true`.
5. Déployer par environnement avec monitoring.

### `credentialless`

`Cross-Origin-Embedder-Policy: credentialless` peut aider certains scénarios, mais il faut tester finement la compatibilité des navigateurs et le comportement attendu des requêtes sans credentials.

---

## 4) Fetch Metadata (`Sec-Fetch-*`)

Les headers `Sec-Fetch-Site`, `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, `Sec-Fetch-User` donnent au serveur le **contexte d'origine** et d'usage de la requête.

### Très utile pour

- CSRF,
- XSSI / XS-Leaks,
- endpoints admin,
- endpoints qui ne devraient jamais être appelés cross-site.

### Politique simple

- autoriser :
  - `same-origin`,
  - `same-site` si vos sous-domaines sont de confiance,
  - `none` (navigation directe, bookmark, barre d'adresse),
  - `GET + navigate` pour les pages publiques ;
- bloquer par défaut les écritures cross-site (`POST`, `PUT`, `PATCH`, `DELETE`) sur les endpoints sensibles.

### Pseudo-code

```js
function isAllowed(req) {
  const site = req.headers["sec-fetch-site"] || "";
  const mode = req.headers["sec-fetch-mode"] || "";

  if (site === "same-origin" || site === "none") return true;
  if (site === "same-site" && req.path.startsWith("/public/")) return true;
  if (req.method === "GET" && mode === "navigate") return true;

  return false;
}
```

### Important

- Ajouter `Vary: Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest`.
- Prévoir une allowlist explicite pour les vraies API CORS publiques.
- Ne pas remplacer CSRF tokens par Fetch Metadata seul sur les flux les plus sensibles.

---

## 5) Subresource Integrity (SRI) avec hash pinning

SRI protège contre la compromission ou la corruption d'une ressource tierce ou CDN.

### Exemple

```html
<script
  src="https://cdn.example.net/app.v123.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>
```

### Bonnes pratiques

- Pinner **chaque version** d'asset.
- Générer les hashes dans le pipeline CI/CD.
- Stocker un manifeste versionné.
- Éviter les URLs "toujours la même ressource" si le contenu bouge sans changer le hash/version.
- Self-host si l'asset est critique et rarement mis à jour.

### Pièges

- Sur une ressource cross-origin, SRI suppose aussi un comportement CORS correct.
- Un tag loader/script manager peut casser votre modèle de pinning si les assets changent hors pipeline.
- Un hash qui change souvent sans gouvernance devient un simple bruit opérationnel.

### Hash pinning pragmatique

- assets critiques et stables : **hash pinning strict**,
- analytics non critiques : idéalement self-host ou au minimum version explicite + revue fournisseur,
- jamais de "charge un script distant mutable et on verra".

---

## 6) Permissions Policy détaillée

`Permissions-Policy` contrôle quelles APIs sensibles sont utilisables par votre document et ses iframes.

### Header de départ

```http
Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=(),
  payment=(),
  usb=(),
  serial=()
```

### Lecture rapide

- `()` = personne n'a accès.
- `(self)` = seulement votre origine.
- `("https://widget.example")` = délégation explicite à une origine.

### Directives courantes à traiter explicitement

- `camera`
- `microphone`
- `geolocation`
- `payment`
- `usb`
- `serial`

### Exemple avec délégation ciblée à une iframe de confiance

```http
Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=(self),
  payment=("https://payments.example"),
  usb=(),
  serial=()
```

### Anti-pattern

- Ne rien définir et laisser les defaults du navigateur.
- Déléguer trop large à toutes les iframes d'un domaine parent.
- Oublier de revoir la policy après ajout d'un SDK ou d'un widget tiers.

---

## 7) CSP nonce vs hash : compromis

| Approche | Quand l'utiliser | Avantages | Inconvénients |
|---|---|---|---|
| **Nonce** | HTML dynamique SSR, scripts inline générés par le serveur | flexible, compatible avec contenu inline qui change à chaque réponse | doit être **aléatoire par réponse**, injecté partout correctement, attention au cache |
| **Hash** | snippets inline stables, bootstrap minimal, pages très statiques | pas de valeur aléatoire par réponse, plus simple à auditer sur du statique | casse dès que le contenu inline change, maintenance plus lourde sur HTML dynamique |

### Règles simples

- Si vous pouvez, **supprimez l'inline**.
- Sinon, préférez :
  - **nonce** pour le HTML dynamique,
  - **hash** pour les snippets stables.
- Évitez `'unsafe-inline'`.
- Si vous utilisez `strict-dynamic`, soyez très clair sur ce qui est bootstrapé et par qui.

---

## 8) Origin-Agent-Cluster (OAC)

```http
Origin-Agent-Cluster: ?1
```

OAC demande que l'origine soit isolée dans un **origin-keyed agent cluster**.

### Ce que ça apporte

- meilleure isolation de performance/mémoire entre origines,
- moins de partage implicite avec des pages same-site mais cross-origin,
- utile quand une origine héberge des traitements lourds.

### Ce que ça n'est pas

- **pas** une frontière de sécurité forte à elle seule,
- **pas** un remplacement de COOP/COEP/CORP.

### Règle importante

Déployez OAC sur **toutes** les pages de l'origine, ou sur **aucune**.  
Le comportement est plus prédictible ainsi.

---

## 9) Document-Policy

`Document-Policy` est utile pour **faire respecter ou reporter** certains comportements documentaires (ex. interdire `document.write`, signaler certains usages problématiques).

### Position pratique

- considérer cette feature comme **expérimentale / draft**,
- utile surtout en laboratoire ou sur une flotte navigateur bien contrôlée,
- ne pas en faire un contrôle critique unique.

### Exemple conceptuel

```http
Document-Policy: document-write=?0
```

### Bon usage

- rapporter l'usage de patterns legacy que vous voulez éliminer,
- sécuriser progressivement un front historique.

### Mauvais usage

- croire que cela remplace CSP, Trusted Types ou une vraie refonte du code legacy.

---

## 10) Attribution Reporting

L'Attribution Reporting API a un intérêt produit/mesure pub, pas un vrai rôle défensif applicatif. En plus, la technologie est désormais **dépréciée** côté documentation moderne.

### Recommandation

- **Ne pas adopter** pour du greenfield sécurité.
- Si vous l'avez déjà :
  - l'isoler derrière un flag,
  - documenter le besoin business,
  - prévoir sa sortie.

---

## Tableau synthétique : feature -> attaque mitigée -> support browser

> **Lecture** : cette table est volontairement qualitative. Vérifiez la compatibilité exacte sur votre flotte réelle avant activation globale.

| Feature | Attaque / risque mitigé | Support browser (pratique 2026) |
|---|---|---|
| Trusted Types | DOM XSS, injection dans les sinks HTML/script/URL | disponible sur les dernières versions majeures ; vérifier la flotte legacy |
| Sanitizer API | injection HTML dans quelques flows de rendu | disponibilité limitée ; à traiter comme progressive enhancement |
| COOP + COEP + CORP | XS-Leaks, confusion de contexte, prérequis pour SharedArrayBuffer/cross-origin isolation | support moderne, mais compatibilité forte à tester avec assets tiers |
| Fetch Metadata | CSRF, XSSI, XS-Leaks, appels cross-site inattendus | largement exploitable sur navigateurs modernes, avec variations selon les headers |
| Subresource Integrity | compromission d'asset CDN / tiers | largement supporté |
| Permissions Policy | abus d'APIs sensibles (camera, mic, geolocation, payment, USB, serial) | support mixte / disponibilité limitée selon directives |
| Origin-Agent-Cluster | meilleure isolation de process/contexte et moindre interférence same-site cross-origin | support moderne utile, mais à valider sur la flotte cible |
| Document-Policy | réduction/reporting de patterns documentaires legacy | expérimental / draft |
| Attribution Reporting | aucun gain sécurité défensif direct | déprécié ; éviter pour les nouveaux déploiements |

---

## Drop-in headers Nginx (complément à `secure-headers.md`)

> **Important** : le nonce doit être généré **par réponse**, côté application ou composant capable de produire un aléa cryptographiquement fort. Le placeholder `$csp_nonce` ci-dessous est intentionnel.

```nginx
# Baseline complémentaire moderne
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Resource-Policy "same-site" always;
add_header Origin-Agent-Cluster "?1" always;

add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Content-Type-Options "nosniff" always;

# CSP moderne: à fusionner avec votre CSP existante
add_header Content-Security-Policy "
  default-src 'self';
  base-uri 'none';
  object-src 'none';
  frame-ancestors 'none';
  script-src 'self' 'nonce-$csp_nonce' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https:;
  require-trusted-types-for 'script';
  trusted-types app-sanitize
" always;
```

### Variantes utiles

- Si vous dépendez de tiers non compatibles, commencez par **ne pas activer COEP** partout.
- Si vous avez besoin d'iframes cross-origin, testez précisément l'effet de `COOP: same-origin`.
- Si votre app est très statique, remplacez les nonces par des **hashes CSP**.

---

## Cloudflare Workers : headers + Fetch Metadata guard

```js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Guard Fetch Metadata pour les endpoints sensibles
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/account")) {
      const site = request.headers.get("sec-fetch-site") || "";
      const mode = request.headers.get("sec-fetch-mode") || "";

      const allowed =
        site === "same-origin" ||
        site === "none" ||
        (request.method === "GET" && mode === "navigate");

      if (!allowed) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    const response = await fetch(request);
    const headers = new Headers(response.headers);

    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Resource-Policy", "same-site");
    headers.set("Origin-Agent-Cluster", "?1");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.append("Vary", "Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest");

    // Exemple: CSP sans nonce. Pour une vraie app SSR, injecter un nonce côté origin.
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
      "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; " +
      "connect-src 'self' https:; require-trusted-types-for 'script'; trusted-types app-sanitize"
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
```

---

## Déploiement progressif recommandé

1. **Mesurer avant de bloquer** : CSP report-only, inventaire des subresources, logs Fetch Metadata.
2. **Réduire les permissions** : camera/microphone/geolocation/payment/usb/serial à `()`.
3. **Activer Trusted Types** sur les surfaces les plus exposées au HTML.
4. **Tester cross-origin isolation** si vous avez besoin de SAB/WASM threads.
5. **Pinner les assets tiers** avec SRI.
6. **Mettre OAC** de façon homogène sur l'origine.
7. **Traiter Document-Policy et Attribution Reporting** comme non prioritaires / avancés.

---

## Raccourcis utiles

- **Trusted Types** : pour arrêter les DOM XSS modernes.
- **Sanitizer API** : bonus, pas socle universel.
- **COOP/COEP/CORP** : pour isoler correctement les contexts et débloquer SAB.
- **Fetch Metadata** : pour filtrer les appels cross-site absurdes.
- **SRI** : pour ne pas faire confiance aveuglément aux tiers.
- **Permissions Policy** : pour fermer les APIs sensibles par défaut.
- **OAC** : pour isoler l'origine plus proprement.
- **Document-Policy** : expérimental, utile pour chasser le legacy.
- **Attribution Reporting** : déprécié, hors trajectoire défensive.