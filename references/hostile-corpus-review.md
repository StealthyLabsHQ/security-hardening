# hostile-corpus-review.md

> **Blocked by missing corpus in this session**
>
> Vous avez demandé un audit critique de **35 fichiers de `references/`**, au format :
>
> `fichier:ligne -> problème -> proposition de fix`
>
> Dans cette session, le dépôt et les uploads annoncés ne sont pas visibles côté exécution. Je ne peux donc pas produire honnêtement des constats **ligne par ligne** sans inventer des preuves.
>
> Ce fichier sert de **rapport de blocage + grille de revue hostile** à remplir dès que le corpus réel est monté.

## Output format attendu

| Severity | File:line | Problem | Proposed fix |
|---|---|---|---|
| Critical | `references/example.md:L42-L57` | Exemple de contrôle cassé ou obsolète | Remplacer par la configuration / la version / le pattern correct |
| High | `references/example.md:L60-L82` | Advice contradictoire ou dangereux en prod | Réécrire avec préconditions, limites et contre-exemples |
| Medium | `references/example.md:L90-L101` | Code qui compile mais ne tient pas en prod | Ajouter configuration, tests, erreur handling, telemetry |
| Low | `references/example.md:L110-L118` | Terminologie ou version ambigüe | Mettre à jour la référence, préciser version et statut |

## Checklist de revue hostile

### Obsolescence / versions
- versions de frameworks EOL ou proches EOL,
- exemples Apollo Server v2/v3 encore présentés comme "normaux",
- références à bibliothèques abandonnées,
- références à algorithmes ou paramètres trop faibles,
- docs de navigateurs/API présentant encore des features dépréciées comme recommandées.

### Faux sentiment de sécurité
- bcrypt avec cost trop bas,
- JWT sans contraintes `aud` / `iss` / rotation de clés,
- "désactiver l'introspection suffit" comme message de sécurité GraphQL,
- CSP permissive avec `'unsafe-inline'`,
- CORS wildcard + credentials,
- "base64" ou opaque IDs traités comme contrôle d'autorisation.

### Contradictions entre fichiers
- un document recommande APQ, un autre laisse la requête arbitraire,
- un document recommande headers stricts incompatibles avec un autre exemple frontend,
- un document exige MFA partout, un autre donne des exemples de service accounts persistants sans rotation,
- un document prône uploads directs, un autre montre multipart sans CSRF.

### Code qui compile mais casse en prod
- secret hardcodé,
- absence de timeout, retries, circuit breaking,
- absence de limites mémoire / taille / pagination,
- manque de logging corrélé,
- absence de validation des inputs ou des claims,
- absence de contrôle d'accès par tenant/objet/propriété.

### Outils / patterns abandonnés
- bibliothèques non maintenues,
- exemples reposant sur fonctionnalités supprimées,
- références à headers legacy comme protection principale,
- workflows GitHub Actions non pinés par SHA.

## Priorisation suggérée

1. **Critical**  
   Vulnérabilité exploitable ou conseil activement dangereux.
2. **High**  
   Contrôle incomplet ou trompeur susceptible de mener à une faille.
3. **Medium**  
   Conseil correct en labo mais insuffisant en production.
4. **Low**  
   Dette documentaire, terminologie, clarté, versioning.

## Ce qu'il faudra faire dès que le corpus est visible

1. Lister les 35 fichiers réellement présents.
2. Extraire les snippets de code et les recommandations normatives.
3. Vérifier :
   - versions,
   - maintien des dépendances,
   - cohérence inter-documents,
   - sécurité réelle en prod,
   - état des outils cités.
4. Produire le tableau final **max 50 issues**, trié par sévérité, avec références `fichier:ligne`.

## Règle de qualité

Aucune ligne ne doit être écrite sans preuve locale :
- snippet exact,
- ligne ou plage de lignes,
- proposition de fix concrète et actionnable.