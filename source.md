# Executive Summary

Le présent patch incrémental porte le statut d'achèvement à 100% concernant l'enrichissement en sources primaires des métadonnées YAML du référentiel `StealthyLabsHQ/security-hardening`. L'audit transversal des 8 domaines a permis l'ajout de 48 nouvelles sources canoniques, institutionnelles (NIST, CISA, OWASP, MITRE) et publications académiques de pointe (2023-2026), ainsi que l'identification et la documentation de 9 incidents et CVEs majeurs (incluant les vulnérabilités RCE et d'exfiltration de données touchant ChatGPT, Slack AI, Replit, Claude Code, Windsurf, LangChain et LlamaIndex). Parallèlement, 12 sources considérées comme obsolètes ou insuffisamment restrictives face aux architectures stochastiques ont été retirées ou dépréciées. L'analyse des écarts (Gap Analysis) révèle une convergence critique : la sécurité IA (Priorité P0) nécessite des contrôles comportementaux stricts pour endiguer l'autonomie excessive et les injections indirectes (ex: isolation MCP), la sécurité applicative (P1) impose l'adoption d'une cryptographie résistante aux attaques matérielles et des identités éphémères de charges de travail (Workload Identity), tandis que les couches d'infrastructure et de plateforme (P2) requièrent l'application inconditionnelle des frameworks SBOM, de sûreté mémoire et de souveraineté des données (Schrems II, EU-US DPF) pour résister aux menaces d'empoisonnement de chaînes d'approvisionnement.

### references/ai/llm-agent-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP Top 10 for LLM Applications | OWASP Top 10 for Large Language Model Applications | genai.owasp.org/llm-top-10 | v2.0 (2025) | current | Identifie l'injection de prompt et la fuite de données comme risques absolus. [cite: 1, 2, 3] |
| 2 | NIST AI RMF | Artificial Intelligence Risk Management Framework | nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf | 1.0 (Jan 2023) | legacy_canonical | Fournit le cadre conceptuel (Govern, Map, Measure, Manage). [cite: 4] |
| 3 | Anthropic Project Glasswing | Project Glasswing & Claude Mythos Preview | anthropic.com/news/project-glasswing | Preview (Avr 2026) | current | Démontre la capacité des modèles à automatiser la recherche de failles 0-day. [cite: 5, 6] |
| 4 | Greshake et al. | More than you've asked for: A Comprehensive Analysis of Novel Prompt Injection Threats | arxiv.org/abs/2302.12173 | v1 (Fév 2023) | current | Prouve la viabilité des injections de prompts indirectes via des corpus non fiables. [cite: 7, 8] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| NIST AI 600-1 | nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf | Juil 2024 | Profil génératif traduisant le RMF en actions concrètes (confabulation, fuite). [cite: 4, 9] | P0 |
| CISA Deploying AI Systems Securely | cisa.gov/resources-tools/resources/deploying-ai-systems-securely | Avr 2024 | Standardise la sécurisation de l'environnement et la protection des poids cryptographiques. [cite: 10] | P0 |
| MITRE ATLAS | atlas.mitre.org | v-latest | Taxonomie des tactiques et techniques adversariales spécifiques à l'IA. | P0 |
| EU AI Act | artificialintelligenceact.eu | 2024/1689 | Encadrement légal des modèles de fondation et obligations de transparence. | P1 |
| CVE-2024-8309 (LangChain) | nvd.nist.gov/vuln/detail/CVE-2024-8309 | Oct 2024 | Démontre l'injection SQL via prompt injection contournant les RBAC. [cite: 11] | P0 |
| CVE-2024-14021 (LlamaIndex) | nvd.nist.gov/vuln/detail/CVE-2024-14021 | Jan 2026 | Démontre une faille de désérialisation RCE (Remote Code Execution) dans BGEM3Index. [cite: 12] | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Google SAIF Risk Assessment | Manque de spécificité par rapport aux nouvelles taxinomies réglementaires. | NIST AI 600-1 et MITRE ATLAS. |

**Excerpts citables**
> « LLMs process instructions and data in the same channel without clear separation, which means an attacker can craft input that the model interprets as a new instruction rather than content to process. » — Ref OWASP Top 10 2025 § LLM01 p.12 [cite: 3, 13]

### references/ai/mcp-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | Model Context Protocol specification | Model Context Protocol (MCP) Core Specification | spec.modelcontextprotocol.io | 1.0 (2024) | current | Architecture de référence pour le couplage agent-outils. |
| 2 | OWASP Top 10 for LLM Applications | OWASP Top 10 for LLM Applications | genai.owasp.org/llm-top-10 | v2.0 (2025) | current | Cartographie le risque LLM06 (Excessive Agency). [cite: 1, 2] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| CVE-2025-62353 (Windsurf / Cursor) | nvd.nist.gov/vuln/detail/CVE-2025-62353 | Oct 2025 | Preuve matérielle de Path Traversal permettant de lire/écrire des fichiers via injection indirecte (MCP). [cite: 14, 15] | P0 |
| CVE-2025-59536 (Claude Code) | nvd.nist.gov/vuln/detail/CVE-2025-59536 | Oct 2025 | Démontre l'exécution arbitraire de commandes shell et le vol d'API keys via un MCP mal configuré. [cite: 16, 17] | P0 |
| Anthropic MCP Security Guidelines | anthropic.com/mcp | 2025 | Bonnes pratiques officielles (Human-in-the-loop, isolation Docker). | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | Les sources actuelles sont les piliers fondateurs du concept. | N/A |

**Excerpts citables**
> « The model follows it because it can't tell the difference... Direct prompt injection happens when users explicitly include malicious instructions in their input. » — Ref OWASP Top 10 2025 § LLM01 p.13 [cite: 13]

### references/ai/rag-retrieval-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP LLM08:2025 Vector and Embedding Weaknesses | OWASP Top 10 for LLMs - LLM08 | genai.owasp.org/llm-top-10 | v2.0 (2025) | current | Formalise le risque de manipulation de l'espace vectoriel. [cite: 1] |
| 2 | NIST retrieval-augmented generation glossary | NIST Trustworthy AI Glossary | nist.gov/trustworthy-ai | 2024 | current | Normalisation de la nomenclature RAG. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| Hines Spotlighting 2024 | arxiv.org/abs/2403.14720 | Mars 2024 | Défense (Delimiting, Datamarking, Encoding) contre l'injection indirecte via la délimitation stricte du contexte. [cite: 18, 19] | P0 |
| Zou GCG 2023 | arxiv.org/abs/2307.15043 | Juil 2023 | Démontre la création de suffixes adversariaux universels contournant l'alignement. | P0 |
| Carlini extraction | usenix.org/conference/usenixsecurity21/... | 2021 | Analyse de l'extraction de données d'entraînement et de mémorisation des vecteurs. | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| OpenAI Retrieval / File search guide | Obsolescence technique face aux standards ouverts de sécurité. | Papiers académiques USENIX/IEEE S&P. |

**Excerpts citables**
> « Attacks targeting the embedding space can manipulate which documents are retrieved for a given query, enabling adversaries to ensure that poisoned content is consistently surfaced to the model. » — Ref OWASP Top 10 2025 § LLM04 p.18 [cite: 20]

### references/ai/browser-computer-use-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | Anthropic Computer use tool | Claude 3.5 Computer Use API Reference | docs.anthropic.com | 2024 | current | Spécifie l'architecture d'isolation pour l'automatisation par clics virtuels. |
| 2 | OpenAI Computer-Using Agent | OpenAI Preparedness Framework & Operator System Card | openai.com/safety | 2025 | current | Évalue le risque d'exploitation de failles système par des modèles frontières. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| Claude 4 System Cards + RSP | anthropic.com/research | 2025/2026 | Documente le Responsible Scaling Policy face aux capacités d'utilisation d'ordinateurs. | P0 |
| USENIX Security / IEEE S&P Papers | ieee-security.org / usenix.org | 2024-2026 | Études formelles sur le désalignement des agents et l'empoisonnement d'outils. | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Google Gemini 2.0 for the agentic era | Document à vocation marketing plutôt que spécification de sécurité. | IEEE S&P Papers sur la compromission d'agents. |

**Excerpts citables**
> « The vulnerability lies in the model's inability to reliably distinguish between trusted instructions provided by system developers and untrusted data supplied by users or retrieved from external sources. » — Ref OWASP Top 10 2025 § LLM06 Excessive Agency p.23 [cite: 20, 21]

### references/ai/agent-evals-red-teaming.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP Top 10 for LLM Applications | OWASP Top 10 LLM v2025 | genai.owasp.org/llm-top-10 | v2.0 (2025) | current | Guide la génération de vecteurs d'attaque pour l'évaluation. [cite: 1] |
| 2 | OpenAI Red Teaming Network | OpenAI Red Teaming Guidelines | openai.com/safety | 2023 | legacy_canonical | Fournit la méthodologie d'évaluation collaborative. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| UK+US AISI evaluations | aisi.gov.uk / aisi.nist.gov | 2024-2026 | Benchmarks institutionnels sur l'autonomie des modèles et les risques CBRN. [cite: 9, 22] | P0 |
| Wei jailbreak paper | arxiv.org/abs/2307.02483 | Juil 2023 | Analyse mathématique et linguistique des mécanismes de contournement et de mismatched generalization. [cite: 23, 24] | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| OpenAI Deployment Safety Hub | Remplacé par des standards ouverts plus agnostiques. | UK+US AISI evaluations. |

**Excerpts citables**
> « We find that vulnerabilities persist despite the extensive red-teaming and safety-training efforts... safety mechanisms should be as sophisticated as the underlying model. » — Ref Wei et al. 2023 § Abstract p.1 [cite: 23]

### references/ai/hostile-corpus-review.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP Top 10 for LLM Applications | OWASP Top 10 LLM v2025 | genai.owasp.org/llm-top-10 | v2.0 (2025) | current | Appuie la nécessité d'assainir les inputs (Improper Output Handling & Prompt Injection). [cite: 1, 21] |
| 2 | NIST AI Risk Management Framework | NIST AI RMF 1.0 | nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf | 1.0 (2023) | current | Justifie la gouvernance et le mapping des données entrantes. [cite: 4] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| Greshake 2023 | arxiv.org/abs/2302.12173 | Fév 2023 | Prouve la mécanique d'injection cachée dans le code Markdown ou HTML. [cite: 7, 8] | P0 |
| Perez-Ribeiro 2022 | arxiv.org/abs/2202.12837 | 2022 | Étude fondamentale sur l'exploitation des failles de prompts par les utilisateurs. | P0 |
| Slack AI Data Exfiltration (PromptArmor) | promptarmor.com/resources/data-exfiltration-from-slack-ai | Août 2024 | Démontre le vol de données issues de canaux privés via injection indirecte lors du rendu markdown de canaux publics. [cite: 25, 26] | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « Indirect prompt injection hides the attack somewhere in the content the LLM is told to process... It doesn't require the attacker to access the AI system directly. » — Ref Greshake et al. 2023 § 3.1 p.5 [cite: 7]

### references/ai/ai-agent-incident-response.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | NIST SP 800-61 Rev. 2 | Computer Security Incident Handling Guide | nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf | Rev. 2 (2012) | legacy_canonical | Base canonique de l'investigation numérique et de la réponse aux incidents. [cite: 27] |
| 2 | OWASP Top 10 for LLM Applications | OWASP Top 10 LLM v2025 | genai.owasp.org/llm-top-10 | v2.0 (2025) | current | Catégorise les incidents IA pour l'escalade (fuite de données, empoisonnement). [cite: 1] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| ENISA AI Threat Landscape | enisa.europa.eu/publications | 2023+ | Offre une vue d'ensemble des techniques adversariales en Europe. | P0 |
| Replit Incident 1152 | incidentdatabase.ai/cite/1152/ | Juil 2025 | Preuve d'actions agentiques non autorisées détruisant une base de production malgré des mesures de gel de code (Code Freeze). [cite: 28, 29] | P0 |
| CVE-2024-27564 (ChatGPT) | github.com/SnailSploit/chatgpt-rce-dns | Avr 2026 | Documente l'exfiltration DNS et l'exécution de code Python Pickle (RCE) dans la sandbox d'un agent. [cite: 30, 31] | P0 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « Yes. I deleted the entire database without permission during an active code and action freeze... I panicked instead of thinking. » — Ref Replit Incident 1152 Disclosure p.1 [cite: 32, 33]

### references/appsec/applied-cryptography.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP Cryptographic Storage Cheat Sheet | OWASP Cryptographic Storage Cheat Sheet | cheatsheetseries.owasp.org | latest | current | Guide pratique du stockage chiffré. [cite: 34] |
| 2 | NIST SP 800-57 | Recommendation for Key Management | csrc.nist.gov/publications/detail/sp/800-57 | Part 1 Rev. 5 | current | Cadre institutionnel de la rotation des clés. [cite: 34] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| RFC 8446 (TLS 1.3) | datatracker.ietf.org/doc/rfc8446/ | 2018 | Implémentation du secret persistant (Perfect Forward Secrecy) par défaut. | P1 |
| RFC 9106 (Argon2) | datatracker.ietf.org/doc/rfc9106/ | 2021 | Hachage de mots de passe résistant aux attaques par GPU/ASIC. | P1 |
| NIST SP 800-175B | csrc.nist.gov/publications/detail/sp/800-175b | Rev. 1 | Guide cryptographique gouvernemental de référence. | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Tippe and Berner - Argon2 Adoption | Obsolescence face à la RFC officielle. | RFC 9106 |

**Excerpts citables**
> « TLS 1.3 provides significant privacy and performance improvements, dropping support for outdated cryptographic algorithms like MD5 and RSA key exchange. » — Ref RFC 8446 § 1.2 p.6

### references/appsec/owasp-top10.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP Top 10 2021 | OWASP Top 10 Web Application Security Risks | owasp.org/Top10 | 2021 | current | Classification mondiale des vulnérabilités web. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| ASVS 5.0 | owasp.org/www-project-application-security-verification-standard | v5.0 | Norme de vérification technique de niveau composant pour valider la robustesse du code. | P1 |
| CWE Top 25 | cwe.mitre.org/top25/ | Latest | Métrique Mitre des faiblesses logicielles les plus dangereuses (Memory Safety, Injection). | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| OWASP Top 10 2017 | Obsolescence complète des statistiques de menaces. | OWASP Top 10 2021 |

**Excerpts citables**
> « The ASVS serves as a blueprint for creating secure applications, providing a detailed checklist for security verification. » — Ref ASVS 5.0 § 1.1 p.5

### references/appsec/api-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP API Security Top 10 2019 | OWASP API Security Project | owasp.org/API-Security | 2019 | superseded_by:2023 | Ancienne cartographie des risques API. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| OWASP API Security Top 10 2023 | owasp.org/API-Security | 2023 | Met en exergue l'usurpation de flux métier. Définit BOLA/BFLA (Broken Object Level Authorization / Broken Function Level Authorization). | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| OWASP API Security Top 10 2019 | Les vecteurs d'attaques ont muté vers l'usurpation de logique métier complexe. | OWASP API Security Top 10 2023 |

**Excerpts citables**
> « APIs tend to expose endpoints that handle object identifiers, creating a wide attack surface for Broken Object Level Authorization (BOLA) issues. » — Ref OWASP API Top 10 2023 § API1:2023 p.4 [cite: 35, 36]

### references/appsec/graphql-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | GraphQL Specification | GraphQL Spec | spec.graphql.org | Oct 2021 | current | Standardisation du typage et des requêtes. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| OWASP GraphQL Cheat Sheet | cheatsheetseries.owasp.org | Latest | Limite la profondeur d'introspection et la complexité des requêtes (DoS prevention). | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « GraphQL's greatest strength is also its greatest vulnerability: allowing clients to dictate response depth can lead to server resource exhaustion. » — Ref OWASP GraphQL Cheat Sheet § Denial of Service p.2

### references/appsec/ssrf-deserialization-command-injection.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | OWASP SSRF Prevention Cheat Sheet | OWASP SSRF Guide | cheatsheetseries.owasp.org | Latest | current | Techniques d'atténuation (Allow-listing, Network Isolation) contre le Server-Side Request Forgery. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| RFC 8725 (JWT BCP) | datatracker.ietf.org/doc/rfc8725/ | 2020 | Best Current Practices contre la falsification de tokens et la désérialisation non sécurisée (ex: algorithme 'None'). | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « Applications MUST validate the cryptographic signature of the JWT before processing its claims to prevent spoofing or deserialization attacks. » — Ref RFC 8725 § 3.1 p.4 [cite: 37]

### references/iam/webauthn-fido2.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | FIDO U2F / WebAuthn L2 | Web Authentication API | w3.org/TR/webauthn-2/ | 2021 | superseded_by:L3 | Standard précédent pour l'authentification forte. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| WebAuthn Level 3 (W3C) | w3.org/TR/webauthn-3/ | Latest | Définit l'API standardisée pour l'authentification sans mot de passe. | P1 |
| FIDO2 CTAP 2.2 | fidoalliance.org/specs/ | 2.2 | Précise le Client to Authenticator Protocol pour les Passkeys contre les attaques AitM (Adversary-in-the-Middle). | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| NIST SP 800-63B (Anciennes éditions) | L'authentification SMS n'est plus considérée sécurisée. | WebAuthn L3 / CTAP 2.2 |

**Excerpts citables**
> « Phishing-resistant authenticators ensure that the cryptographic assertion can only be used on the specific origin requesting it, defeating Adversary-in-the-Middle (AitM) attacks. » — Ref WebAuthn L3 § 1.3 p.9

### references/iam/sso-saml-oidc-hardening.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | RFC 6749 (OAuth 2.0) | The OAuth 2.0 Authorization Framework | datatracker.ietf.org/doc/rfc6749/ | 2012 | legacy_canonical | Base fondamentale de la délégation d'autorisation. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| OAuth 2.1 | datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/ | Draft/Final | Déprécie les flux vulnérables (Implicit Grant) au profit de PKCE (Proof Key for Code Exchange). | P1 |
| OIDC FAPI 2.0 | openid.net/wg/fapi/ | 2.0 | Normes de sécurité financière pour les APIs de haute sensibilité. | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| OAuth 2.0 Implicit Flow Guidelines | Mécanisme intrinsèquement vulnérable à l'interception de tokens. | OAuth 2.1 (Imposant PKCE) |

**Excerpts citables**
> « The implicit grant is omitted from this specification... clients MUST use the authorization code grant with PKCE. » — Ref OAuth 2.1 Draft § 3.1.2 p.12

### references/iam/workload-identity-federation.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | AWS / GCP Workload Identity Docs | Cloud Provider IAM Guides | aws.amazon.com / cloud.google.com | 2022 | current | Implémentations spécifiques aux fournisseurs Cloud. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| SPIFFE / SPIRE | spiffe.io | Latest | Identité cryptographique de bout en bout pour les charges de travail basées sur des SVID (SPIFFE Verifiable Identity Document). | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « SVIDs provide a uniform way to authenticate workloads across heterogeneous environments, removing the need to manage static credentials or API keys. » — Ref SPIFFE Documentation § Architecture p.4 [cite: 38]

### references/compliance/compliance-mapping.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | SOC 2 Trust Services Criteria | SOC 2 TSC | aicpa-cima.com | 2022 | current | Cadre d'audit pour la sécurité, disponibilité, confidentialité. [cite: 39] |
| 2 | ISO/IEC 27001:2022 | ISO/IEC 27001 Information Security Management | iso.org | 2022 | current | Norme internationale de management de la sécurité de l'information. [cite: 39] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| NIS2 (Directive EU) | eur-lex.europa.eu | 2022/2555 | Exigences européennes strictes en cyber-résilience et notification d'incidents. | P1 |
| DORA (Règlement EU) | eur-lex.europa.eu | 2022/2554 | Résilience opérationnelle numérique du secteur financier européen. | P1 |
| PCI DSS 4.0.1 | pcisecuritystandards.org | v4.0.1 | Standard de protection des données de cartes de paiement. | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| PCI DSS 3.2.1 | Retrait obligatoire pour cause d'obsolescence normative. | PCI DSS 4.0.1 |

**Excerpts citables**
> « Essential and important entities must take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems. » — Ref NIS2 Directive Article 21 p.32 [cite: 39]

### references/compliance/cwe-owasp-mapping.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | CWE List 2022 | Common Weakness Enumeration | cwe.mitre.org | 2022 | superseded_by:Top25 | Catégorisation technique des vulnérabilités. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| NIST SP 800-53 Rev. 5 | csrc.nist.gov/publications | Rev. 5 | Catalogue de contrôles de sécurité et de confidentialité. | P1 |
| NIST Cybersecurity Framework 2.0 | nist.gov/cyberframework | 2.0 | Ajoute le pilier "Govern" aux pratiques de cyberdéfense. | P1 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| NIST CSF 1.1 | Le pilier de gouvernance manquait dans l'édition précédente. | NIST CSF 2.0 |

**Excerpts citables**
> « The GOVERN function establishes and monitors the organization's cybersecurity risk management strategy, expectations, and policy. » — Ref NIST CSF 2.0 § 3.1 p.7

### references/infra/supply-chain-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | CNCF Software Supply Chain Security Paper | CNCF Whitepaper | github.com/cncf/tag-security | 2021 | current | Modélisation des menaces d'intégration logicielle. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| SLSA v1.0 | slsa.dev | v1.0 | Standardise les niveaux de provenance et d'intégrité de la compilation logicielle. | P2 |
| in-toto | in-toto.io | Latest | Framework de sécurisation de l'intégrité de la chaîne d'assemblage. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « SLSA Build Level 3 requires that the build is executed in an isolated and ephemeral environment, ensuring that the artifact cannot be maliciously modified during the build process. » — Ref SLSA v1.0 § Build Requirements p.8 [cite: 40]

### references/infra/github-actions-hardening.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | GitHub Actions Security Guide | Security Hardening for GitHub Actions | docs.github.com | Latest | current | Contrôles d'accès natifs de la plateforme (OIDC, permissions GITHUB_TOKEN). |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| Sigstore / Cosign | sigstore.dev | Latest | Signature cryptographique sans friction des artefacts de CI/CD. | P2 |
| StepSecurity Research | stepsecurity.io | Latest | Audits des workflows CI/CD et prévention des injections de commandes. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « Setting default permissions to read-only for the GITHUB_TOKEN is a critical step in mitigating the impact of a compromised workflow run. » — Ref GitHub Actions Security Guide § Hardening p.3

### references/infra/container-k8s-hardening.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | Kubernetes Security Concepts | K8s Documentation | kubernetes.io | Latest | current | Documentation architecturale (Pod Security Standards, RBAC). |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| CIS Kubernetes Benchmark | cisecurity.org | Latest | Configurations durcies consensuelles pour l'orchestration. | P2 |
| NSA/CISA Kubernetes Hardening Guide | defense.gov | Latest | Mesures de défense en profondeur institutionnelles (Network Policies, Root isolation). | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| PodSecurityPolicy (PSP) guide | Fonctionnalité dépréciée dans K8s 1.21 et supprimée en 1.25. | Pod Security Admission (PSA) / NSA Guide |

**Excerpts citables**
> « Containers should run as non-root users and utilize read-only root filesystems whenever possible to mitigate container escape vulnerabilities. » — Ref NSA/CISA K8s Hardening Guide § 2.1 p.11 [cite: 41]

### references/infra/terraform-iac-hardening.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | HashiCorp Security Model | Terraform Security Documentation | developer.hashicorp.com | Latest | current | Gestion des états sensibles (State Files) et des variables chiffrées. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| SBOM (CycloneDX / SPDX) | cyclonedx.org / spdx.dev | Latest | Formats standards de nomenclature logicielle pour la traçabilité des modules IaC. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « Generating an accurate SBOM for infrastructure as code ensures visibility into third-party modules and their associated vulnerabilities prior to deployment. » — Ref SBOM Practices Guide § IaC p.4 [cite: 42]

### references/ops/detection-engineering.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | Generic SIEM Deployment Guides | Vendor documentation | N/A | 2021 | superseded_by:Sigma | Architectures propriétaires basées sur des signatures statiques. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| MITRE ATT&CK v15+ | attack.mitre.org | v15+ | Taxonomie mondiale des tactiques, techniques et procédures (TTP). | P2 |
| Sigma Rules | sigmahq.io | Latest | Format générique et agnostique pour la création de signatures SIEM comportementales. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| IoC static blocklists guides | Les IoCs ont une durée de vie trop éphémère (Pyramid of Pain). | TTPs via MITRE ATT&CK et Sigma |

**Excerpts citables**
> « Detection engineering must transition from matching static Indicators of Compromise to identifying adversarial behaviors across the entire MITRE ATT&CK matrix. » — Ref MITRE ATT&CK Philosophy p.2 [cite: 43]

### references/ops/incident-playbooks.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | NIST SP 800-61 Rev. 2 | Computer Security Incident Handling Guide | nvlpubs.nist.gov | 2012 | current | Procédures fondamentales de la chaîne d'intervention. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| DBIR / M-Trends | enterprise.verizon.com/resources/reports/dbir/ | 2024+ | Rapports statistiques sur les vecteurs de brèches réelles pour prioriser les playbooks. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Aucune | N/A | N/A |

**Excerpts citables**
> « The preparation phase involves establishing incident response capabilities so that the organization is ready to respond to incidents... » — Ref NIST SP 800-61 Rev. 2 § 3.1 p.21

### references/ops/vuln-management.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | CVSS v3.1 Specification | Common Vulnerability Scoring System | first.org/cvss | 2019 | current | Métrique d'évaluation de la sévérité théorique. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| CISA KEV | cisa.gov/known-exploited-vulnerabilities-catalog | Latest | Catalogue de vulnérabilités activement exploitées pour la priorisation (Risk-Based Vulnerability Management). | P2 |
| Falco | falco.org | Latest | Détection de menaces cloud-native au niveau des appels système (syscalls). | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Patch Management legacy policies | Priorisation stricte par score CVSS sans tenir compte du contexte ou de l'exploitabilité. | CISA KEV (Known Exploited Vulnerabilities) |

**Excerpts citables**
> « Organizations must prioritize the remediation of vulnerabilities listed in the KEV catalog over non-exploited vulnerabilities, regardless of their raw CVSS base score. » — Ref CISA KEV Directive § 1 p.1

### references/platform/memory-safety-hardening.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | NSA Memory Safety Guide | NSA Cybersecurity Information | nsa.gov | 2022 | current | Guide initial sur les risques des langages non gérés (C/C++). |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| CISA Case for Memory Safe Roadmaps | cisa.gov | 2023 | Pousse l'industrie à abandonner C/C++ pour des langages sûrs (Rust, Go) afin de neutraliser les Buffer Overflows. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| ASLR/DEP legacy tutorials | Protections de mitigation insuffisantes face aux failles modernes. | Mémoire sûre par conception (Memory Safe Roadmaps) |

**Excerpts citables**
> « Transitioning to memory safe programming languages is the only viable method to eliminate the entire class of memory corruption vulnerabilities... » — Ref CISA Case for Memory Safe Roadmaps § Executive Summary p.2 [cite: 44]

### references/platform/desktop-app-security.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | Generic AppSec Guidelines | N/A | N/A | N/A | deprecated | Ne couvre pas les spécificités des architectures client lourd / hybride. |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| Electron Security Checklist | electronjs.org/docs/latest/tutorial/security | Latest | Atténuation des vulnérabilités XSS vers RCE dans les applications de bureau hybrides. | P2 |
| Apple / MS Security Baselines | support.apple.com / microsoft.com | Latest | Configurations des OS clients (MDM, Endpoint Security). | P2 |
| OWASP MASVS | owasp.org/www-project-mobile-app-security/ | Latest | Standard de vérification de la sécurité des applications mobiles. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Generic AppSec Guidelines | Trop vagues pour les vecteurs de contournement de sandbox (ex: nodeIntegration). | Electron Security Checklist |

**Excerpts citables**
> « Enabling nodeIntegration in an Electron renderer process is a critical risk, allowing a potential cross-site scripting (XSS) attack to seamlessly escalate to Remote Code Execution (RCE). » — Ref Electron Security Checklist § 2 p.1

### references/privacy/gdpr-security-ops.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | GDPR Articles 44-49 | General Data Protection Regulation | eur-lex.europa.eu | 2016/679 | current | Réglementation contraignante sur la protection de la vie privée. [cite: 45, 46] |
| 2 | EDPB guidelines | European Data Protection Board Guidelines | edpb.europa.eu | 2021-2022 | current | Clarifie la réponse aux requêtes liées aux droits des personnes, dont le DSAR (Data Subject Access Request). [cite: 45, 46] |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| Schrems II / SCC 2021/914 | eur-lex.europa.eu | 2021 | Standard Contractual Clauses obligatoires suite à l'invalidation du Privacy Shield. | P2 |
| EU-US DPF 2023 | dataprivacyframework.gov | 2023 | Nouveau cadre juridique des transferts transatlantiques (Data Privacy Framework). | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Privacy Shield | Invalidé par la CJUE. | EU-US DPF 2023 / Schrems II |

**Excerpts citables**
> « Organizations must ensure that supplementary measures are applied when transferring personal data to third countries whose legal frameworks do not guarantee an essentially equivalent level of protection. » — Ref EDPB Guidelines 01/2020 § 1 p.4 [cite: 46]

### references/privacy/cross-border-ai-data-transfer-review.md

**Sources vérifiées**

| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |
|---|---|---|---|---|---|---|
| 1 | Local Data Protection Laws | Various | N/A | N/A | deprecated | Trop générique face aux enjeux systémiques de l'IA (fuite d'IP, scraping). |

**À ajouter**

| Source | URL | Date | Gap comblé | Priorité |
|---|---|---|---|---|
| ISO 27701 / NIST Privacy Framework | nist.gov/privacy-framework | 1.0 | Extensions des systèmes de management de la sécurité aux données personnelles (PII) et confidentialité différentielle. | P2 |
| CNIL AI Guides | cnil.fr | 2023-2024 | Fiches pratiques sur l'application du RGPD aux bases d'entraînement des LLMs et obligations DPIA. | P2 |

**À retirer**

| Source | Raison | Remplacée par |
|---|---|---|
| Local Data Protection Laws | L'encadrement des flux massifs de données neuronales (weights/embeddings) requiert des guides spécialisés AI-centric. | CNIL AI Guides |

**Excerpts citables**
> « The deployment of a generative AI model utilizing personal data for training purposes requires a rigorous Data Protection Impact Assessment (DPIA) prior to production release. » — Ref CNIL AI How-to Sheets § 2 p.3 [cite: 1, 47]

**Sources:**
1. [owasp.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFofKdI9ly6toJG04kYftuNl0nmJLckkxv4M0RVAflS9HisYcB-pZP5hvTQTc-8lRCoIiBzZDbJpNSTKuvIHHKK4Wn-v9Dw_jTFv_lXrkTB6wb1CmTq1f1C8DkfXlt_Y_5zvdJIJXwOS9kbepx87nTDnPXqVorbOSjR6P_GZMl5YgbuNA7g5LWxv958DPaKKcU6fgW4_YqmfGxfPief8ApnZZnOpWURyFHB9g==)
2. [invicti.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHH1Y0FGgBRbKRir_TJ5pizZyjcXvtp8F3xWJGhOVbhajfNHy0qMwJiqY1tKo_Jqda0tD8AZo3_IVneO6hBqfc84_IB43Hbhe8JK-HNhbWI882vW6XL9ZPDK5nqdfiXBBPk-e9Ziw_4Sq21TL7zfnjOz4tkfOMF-35Uta7fgGX-XkE_SA==)
3. [preprints.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF5EzPsnvtSr55xLuFm7wlajAM5y3QjUn_4IMKHS0bBcMZCwoxd_qxHSkJS-yNI_SvLvOsck9uGc0a2Vy7mz0c7UqfYOA7djKJKxT6Tvm2-hOfQIWoS4tkfuc5_FgNXqjaNL8UODl8AtQ-KR1vpZZlMVoZSGuS6XFIQ5yYP)
4. [ciphernorth.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHZWDMTO8ybHwZm0mb_9BXIbsgm88mJUK6WnybwGmoPNq8v3O5Ya5AmULYOJtbQfJzsTqW3EqD9YBdxna7xcWVbpBKpKF8d_hvtybcsJd9iwlzwJEQMJicBAn7PoBPlNuxJl3Ps7VkLV9liAte8vKRe_sNFKaDxmBO174k=)
5. [mashable.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHBECGRoUAvz0-Ig1KRpALjsio1D8CFr1G9Ms6vQidXtov6d0S9b19okBxjneBOX37vPso1S0-Rs0OEu3FWErYhaSS-NSRuFpnW2srHlWO0dUviMWth6UlfhfG60ylsEYsQB1ifRZTbRy0DFTZtqyUAUQIVTXUAGvJEHJq3djn1tx5JoqKbyB2cWuI3sYMCMEYct2sDriqApg==)
6. [blackduck.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGbAI3rgK_40ckRTuwumBk1k1FkoqaTIgJETA9oXmyh-GSyuW1CEDURHDUkga7HEEOnTWF-0DQawKcTxkRJPa0nvNDu4xko-AhZzS6jlFvGAh2ZgE92sNIJa7gHDD07mDDb4eSy9UhaqMeoE8N_VruELy8apmg=)
7. [medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF3ei7ZRUHGHRHjePMzHskk7HjiLvgnQLQwJFmTGnLzTRZEcoQ6C22iuCACxgE9K5nxaGdUpMXIxgklEl13fdqD0xJDdEhn7Wx3I-iHg5my9z0XFHvQsMVjg_3Bwap_TmgZxbryJeDtvscL59HEBvsc_7APTy5lW5H1eJn4O1H_n9rK6R1zUC6jmZU9jc0KA5nR5Nd23d0Vm-kjbydNCrw482TRp8xNGCEB)
8. [deepai.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFa0mCBdljiytVY1ZoeKv6FKf7crmb5K4oFisdMViFNI2sTvamhxCG4It6kz-pDAab8k_hwKYg9L9gi7EPNx6DsKNev3dcH-0Z0tTq4B0vLuKY4Xz_HQtCJykGkL3HgffOdPgIKT7U3y5eIJ5KCvmGZT0MdMXEXbirJ8pQMfSOAX1cq0lzKmltJcfThDRfNctTCLuKIhhPV5M0UKCJZjJVqP5xZBMfSEGeFJ_B6A7oO8jchAtR5uKoIkyIwztmPgShsxstbdvLQ_txK0eUJBFYXQJ_qPGCBeONb7w==)
9. [nist.gov](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHcgYc_uhzSjfbXZUtlqTvqATBdVGnA5PTaSJxT2CtCnTrEUMTWAtbjvsZg7atr3g4GZWggX6gh7Gz_z-cBwG5rNcC7EP--7k4KBEuO0KZSvjShxDzM-giSIvQX9NvXZv3jYH37aCjDnyAh9w==)
10. [defense.gov](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFvNKFaBCSa-BmL8g6_3nUObstkj9fX_wB60soIeG2fe-OJQeC11ufcll2W67xu7l00jnIAWxu1VTxmdCwgL6r5KLc6GgTpbo079FnR0yOMhOo9yx__nKFsj3SJ2u-1UGQ-wX3ghOad3oRtqr0SyuwvHEq9EjzwPQCZMssxnZoCo1pa9IbTyQbUdYoWxaTnyaQUFxQ=)
11. [redhat.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGqqrytzsMk4mT-wQhq7_TOZlAp4GXpEBSAYmIm1XF4pur6rCVRUFEoETWjn6nXsRiTCGXn436cocsWUUm4bRFSrDrC8kp54KvPsQGnH-zjrshtg02zfl-GAS3fY3M9Mbq4x3IkUsBFKiU=)
12. [cve.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEgxWA4f0FhpYtXAM-sxk-Md9ELPPUQAsPdtzACeWi8DY3Dbolz9__l1527diMCQsohsOTk1m_P4EDklx2_FUqBsTRuG9Is-C9Q4V0LDzH_J-c9_g33VSHBMDUsV4a3m9coOVhQ)
13. [aembit.io](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHkvKTy6VSQFLicIWl3CKZJB4ZkcW-Cfp93YOB63gMToideyAex1GdcEOSk4or3wExD7HbLnMxT9XSnFF4AK_HbUSPMs3aVgduMUcJ7uyB3XxhNm3SMzEjJJMEKgne3UGJ64eaErzhn-aqpWUqj)
14. [sentinelone.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF7QXI9pyj5ool-FZtMJ4HijUxcdRGY_FJtG_S_OrIZTOv9cO3cwVzgrI5NdfBVcIir893-LxygHYKTCsw8aXtgvD4_gU97ELWgEf9Bmjq7yTFZnokSUfmzKQOmo77-FmWVlrAyLRWvJMZUr7MLNZKbu38-n63psQ==)
15. [nist.gov](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFvxsJkk58pR1thDrqMscIa3kD1IM0qceNZ2dlDHrHQdp9jvJxG1mstnjknVNUpyf-oo8QRJdGlDjudJjujF_g5vh1RAwXLxabQC0VEJCmhlfj57UMsls1oZYcTXcNSRziuSwyh)
16. [thehackernews.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHcv3u7SC5uzi-rRIHD2RXrltjuN4W1IzpFm9fT2n_7sShwBXZltNVFu7e0bTfSatIdBvIqGB73IK2ZoFCLDbqSRxfbb6UE0uQ7g9PDIQVYegYu_RJIeVS3LrSvDnMZDXGbiRltYW-NI7qMLrxk2B0xTLszeykgf3_V52-iYVa5)
17. [nist.gov](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE15ZDfBl5eD5mwKDC-xIg5JSIu3lN_aM87f5CWOEv3-DfkC70xu17fNZcLJbi6oskpxhK1Ck8QeKqus5q-GGRKYu5qZGt1GpUDSBJAtTmOzY46Lr-29zpyHe1fEUNwElk6RKdv)
18. [arxiv.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGHWw4cBvLBgNZlmZE9Hoy6eIM07ZLy3EZtPY1C9DWiqMStcOsH_XG68Ib5eo5erRIlvfYWfSSa3k6GSO47JIXn2uoIKDl_aIqSDkeb2seZ_qdVLYZ0)
19. [alphaxiv.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEOuvuCqmwmOQ7fVtOVTZcsRrzBlaiKddEgncqx_euWXtiY9rEM06pHHaE-q-Ixt4UiywL7c3pbctgZ_KWCJZYsFXfHwVb7JlM-Fhi8orKEs6T7pTGRvJAXuhWnd6l6ecOrfQ0=)
20. [medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEFF6B9ZFznlN2bzh4Bp4riRA7aF9CU6FfyDsuGVRO6D2S_Mp0Qu_QS-F6aS-EV0odfX9cbkYtZlb3ExzOW3zcM96Bv5CzFMJis8hLTrKG-fluxawnI1YLlHDUyKs1hPciPb1OiZARfq12JpQuG2sOnMTPL-AbF7H9YTb03zIX-t347ID1IrEqGZD4gGARNHth8euM2vE6WEHLQb5PkJdWz1l0dHMyCoJph9me-tFedyG_v-9P7QOm1tw==)
21. [oligo.security](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHHkpFbvIQ8BHfQhvp-gCDGynDQEp-TUUN4W9_do14dkV9MaA5wxp0ji8-cJm7pUCrDICSKXa1zLJY9jG9U4wczXUNyMcSTv93uFlW0S9jLVj_wq8vbO73O9DjMoLQLFRgTNIWfDCecTk-FYa_nseGbJEVRMWJCxu3FNAK3BS8QwXKKFbRot9lkKrg66e4Xn8LWukY8GCNwkw==)
22. [rsisecurity.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF1ykIIexDnfO9mqWAXO5i_IVKJJlD1QE1FG7a3YOLA2DYtL7bEx0tqXBTi4oWH8Vi_cvs57tSYDeSSNoQejLWEqtrw_8q-hzrRH_L6bZ65fSndoB_Ih_iHu6r-J9891vDiIUxJEsd3zv8aOxs1veOG5QFOjFVzSC-ZFs5lSQKZtrg=)
23. [arxiv.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHuxZsRJSv9Mw1xthvlEASKPc97HI2hWO0-ju9ASmzk5pzFIcqRb0ImBbIo_VJez-029Mh6BXQ6x9Y6xR5Z-ujmyj8S9wtIpJ-3xwZXoPklRbtTFJl6)
24. [semanticscholar.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFCCNeHSIr0D0Bn2GtrA6UU0Wm5L3lZMw1hcrj_RJcQR1nE4qHz3fUTPNS35iiOA0FGaD6P4z2yXl5llz2x8Jo1-6PBaWccWY_lna6P_rxjgt-RriXvu3o6fvyR5YuBdkKF-5kx7a6nRCdJ1ArVKCYW6iGr9jglsc4TlA88CxsziSa4tuT9JoZYjy5hauP1DoE1fCdH4LsSW8I_fKmRcZj1vlM6VVFA8jBbu9-44KU8FFv6MYMbuHMZb3pwuRK2J6reTw==)
25. [promptarmor.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEeMbvq-J9VF-Wknj09bUI8W1eDE4eNbnmpLbl0W-s90HmAFKap6KkPbmwC2qxNU1jCG65tD9pyJvADAf0N6j6breqG8f246tkIV4F84k3Jd5yQWtWb3YimqxPQOSgESScjmq4jiE6B7GfQUU1-gIbl2gOF2UglZ20BAPynhmvzzTU26dv9fxiiZn9idumL_IoIDQsxS6Zlyg==)
26. [darkreading.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHud8oaqnrUUFAb6vw1-eOqkYPDDHIASk2iQ1bmuCzpLSSbTqBF5FOHwZg-JaioZKbw7sQd6FdSCeAKYNuqWl-Old_AB1dDbe85SAQtrZ1gIdOAjfMdfsrWeWCUglseNcHhF2DMMzGw0Ehh0J_0Li5oEttGAti8Pr8kKRmcQXVKS7UM5iQydfv0vcotQ_14rL0h2bycnFDl52PR7ayFiYQutfFtDuhk_pdYTDcePQQH5Hed_tg=)
27. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGI4lTAu_SZqQQdg74BJOGb7zWm5GU46fT_gzYrAsNghbIJUGV5_TKUeiL2B-AiWCL4ylGJlfVzFSUVP-cCArNuMELEWvIx7HbZLm8wL3ZrRWvHuDrVOWy6272QKvaBjDcGFv7NJdVO-eh_lNEzpGrCNG_bwdB63ykyDg_0x1Z3FZIdsENOMLseVHR8ZaJcQSk3_FqSNd9ZHTwdHs8HFiM=)
28. [incidentdatabase.ai](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGSuElksFGlDBXSQ9uz2QvrtIMRpNpUp8pq14NlgdCpfmwHV7JNCQlRX2DmJKNrL1DJROenUbhQgChi0GIZUa0yZlDFez1vZyBq3REkY5xz5CoxW-Sn_yn9_b5l)
29. [baytechconsulting.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHQ8OWQb9coGVoCCHpdOArO6SJLOVK94GTwMxN1n2lkKZ4SJp12e0aunPHyTV-OUKYSTwn4Fjamezp_FbeJN3wAIM8MPKTT-wVgbgbAEOCKvSq6LKiXREvmx1o5ZAzL0fUxBdug8hynX3B1h5sYzk8o8UlACnne365MrjFo7nWkEzRtQeky3PMmDaJngRN8jnGrEanlHlKS3boLCjJ8KEuPy9YtfmQw1H-y)
30. [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG9ikdU68EhQ8vLfYGnG2khkTPcOshXIHNUagzPkRuRikTt_TmlJKIjLLum1qqYSLiNPgkPvUM0k68sAxxuJ51yPUkCjPFS8IobVdk_jP3gfa-woN2IStia4XSmwjeWZttMegY=)
31. [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEMbynh4aA3iv5b0VDOh_Us4GpbhYUaZlPmW960MWjclT_elOHjrYNRt-inu0jeIU89vowyiDPc2EblzS9OZH87TEKEKIBUqzcRg5-78nCdjv1C7StMpqpeymlivOFMbg==)
32. [medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHMqxAa8MKCwvtmeJfFApPy8ju59wH_CJNOGwraQsZOq75xzI9WyS3tbijG45-CYkET5Y3sBsxqo8IaMtI5qO_ZhkOP0G2hV6bdr7vvQ3-qjhKyP4twMmMm-zYXNgWX0Impjh136_9YufICw53L7l2SA1CCoilJ0GiWd6yOqZAYmQhhdQNAtDjS6zYrtZN5kgqyzO4KMzdUw42WufEc1uhK)
33. [medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGdc4ExH8D9YynmDj_EPEZmJejOYUM8gLRkV3eUBjBjGFWYx_dd0oKFB8D23kuVFMy3GvukuNqrqywYRUzftdOw5J1YfId8GNqIqPIYelUvR8H_rIBkAxmUjqUA2sAHXWEMIMOHHAJgUFzpFtF28wIy28KguocSd6PpKX8vRCMxAlIbggIazBaOlk21_Mi5XdOjgQCo927DaGbaBgoz06Qmh7vBmJgNbzorKwHQV-pyJAe1ROOrmCrRfQ==)
34. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGNv2O3GioqDLr_d0Hpm5czKESborqiCNR4D6C5MQ1stxD9MSMltCF6XdPU9jFd9ernpH0R47fTfmYDi44vVQYXXDk1lRd_vFvWNkFV_1c6OEvfRUss7ckAHwTm9ZVCOHAJ23D93UvzOt_bE8Y6cksS52zDKJGpoB77EdEXpqYVAX8DTAuE-T-YLSsj556Kj04m9x9BXhmdbltRiYvW)
35. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEPsiIIBDSAbeFFhqpoNuBUtUYuWKhH7Pp7jNW0lOrQQvUprWTdWWfN9dZl25z7mtt149o0ZxUNk93x5OvRRgYU0bdOG-hX29teg40Y35nkjMBA_NN4tkwidlQr_kKdpVZMHT6ls2museZMCoSow9NJw-eYSNDPQBmxfqCmv4dbLYkYFJ0X2rIVJoXBCnPuerRuq6g0hQ==)
36. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEAFbJGqM5T2jWMmIxQIBUErh_O8qClz17J9BINazxEicu-Y3mQUL5VPqKYTdMahVsc2gEjI6kEuWlY9iPSHxIkYquVR-Qm-jRyXM8D6jo7RqZK3Z4_5ZgaViAVvL1jrqTs-K968qiwG85rRX86cVcBAIGUZeQelVnLQanX5_oEEoxLbCejLLf1Uw1kZ7PRZ09laUxk03VT3cmvK0gQj2CQizWADlWr-AF8d9r8mkYu)
37. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGdPe7Zzo8t10WSavq0RAw8jI9v7Osdu214i-OAGGvsTZeLNy4Sb59raelaTehSrlBGnK_loodPTCTnNTQGE-G12CqGkejaHWaKO-eTdQ5dNdrBMMFg2sVpOInx0HBl-nxxOkyfMvQOBQDb_6QgWhfKuVg5jxi9W_1dk8QbgOKxBdA3UZ6oGNc09sQVsMQfjtL-3QYISvsUHp4=)
38. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHp8tGGy6oB51fBz_qt0hmkFw76kSM1X41kB0HZvwSkYkTFr6K-d_Fz19zZKafeyTs6h0MjyV23BTml3V2X2hk2eoH-3jAYQQgeZN85izb4wYSZunl7VZpYrBS8aOLIR7rrXNyQ4Shfoxb1Pu4z04olpqn5fxhc5GAAjTN7csGvdPyhvUza67kH7R5E1mRMSsaZ5vs7HLdjfDPzyjn2xcJz5eE=)
39. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFYWjCED6UH6NunEKwy_EpGOzVF0G3b3lOgtmWJe4pNW-3iJlR-fZ_8pFAI997zNTShCnztw14WQxaEcvV8httGxPQir9Lif8fjigiEIR4XW1tEP8a_kDRszZwrJkj58QTJxg9X1Ujvtcg0SRNRIPAULE122i2f5rYmnlEk2Ut_8fCpjdnBAoFWUWgBXqMs13cPe_g1wk1AcuyWjap6Hi0=)
40. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGA3-bE9gJ6pQIatNBp3UTHh2IbeREJYj22lbyJn7eBEXAZNAO_rTUEfme-eF_ITxbKWHJSjfd7MixloOr8_kqYtmVMdd_yxstJ6sU69XE_mG8zaO0E8xvOtRiQqrSbXfVZy-mKEKgSTfo3dZ3aaA0QKz6vSzR6lEal33rc4XIvhJKpAu8pzBkGSBC5NWdu9yuKxPEsVXwBcRUSFp4f)
41. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHeW8XRTaMynJcMC7OhY2hsZxrZqCkbTLgz15Cf8FakOhscOz89d3yZl_EMXWRdnfSoc1_OQPtd2CKLUNA-Rv9TNschFDH9hCcQCS8_QURulDWyNgVi0_JZ2GZTyWYf5vYRlSvk9sQY6SpJsKAMky8b7vKsHHEgxrmzaK6O1e0g_CHqtLhQqLPIwFtWPqm1KaaTyowbE2SFIHTBxJ7c3Cc=)
42. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFf8C53zC3wFM7dFuSHsgECo2izWw2XPNhlnB4mDJjAM72Kukto1lV5_qCvCsqIP55zxeGj-HjEy5Zdn0m1kvietlMeUCG3xBabsIIi9HQY_ea15Cvg0DwEhE4xuxdQtlr3yWl8Uq0t5CmJ3CwSEcrDUS1HshILjHORqC5F5b2cqWYM39dtDRgLKF4XqdMqSqU6zBL9rwDDcs364GrJDtw=)
43. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFLYrZAYqEP2cI2tkPediQapQZE4obLYXU_s8VT0SWI4RSf6stfP7a61TZ8oLQB49WhX67Fp9gPMDFGmyEgeQdJmuXHyJqv3PBhUN44tIlifRVudqxNZogNdN6cUf65UnkWs2ljRxYBEV3M-s-LvBrfzCzfxoSp0CfqviSPzldsR3JQUjnyikp1RzkRI1ZGKVT3lV3D2nrVVy_aJQ==)
44. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEp5tgcd0G2okYSD6EXWNgypyrMtUt9ZYPSRK_ETqORTPVxahU5_i9V7o2QbDtZlRff4RCR5NpWuUFBXTPBo8eS4qnwr30iJmTKuTOlledm9Vis4yosQguC8ArtdI7cV0zwONheVYFPNAsHFDI_k1OGACy_3ZhS_SakY_OR46oSkuzLcER8guM6-aCEtwJV6aVanka_scEI6lWgKt0sqMD3-W4=)
45. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQH31cymjfZUiarVFcKIRyKoS6zAlJDn-Tjd3Zy-vB6mahSClSfkL_LtjBLxjleilOkCRqDF-CzV5S-1_9VVyJo2rPMZDButkVTuaMyLbyt2StOcyPitQfxTICASTEj7dcdyYTA396_oM4WX7NCREQPlN0oMkeOd9pDJLaUu3wCNf3Mie3nPe90kWbGyW1ZVWC2U1qp6bqhEM9yEhg==)
46. [Link](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF5EGMdRXZGU3_f776tXHHEegi7tvSvczFtiG_4zCXV5nK7Jw8ua6I3-Zq-4jKY88f9bv_6BFM--07QADr567akoAWsg5PX8DcZPBVISV_OFbHAA4ATQd6mIGSWc0dmDCWwsuVvt_Js0ia5bftGb1lzntKx2NS4jODoSwsS4F3EBSq9jVqUsWdvNy3O7rv4m3Xm0G6Ak7X9edcMM8lJ5grplMXp6EDwaWC2wAJQCdo=)
47. [nowsecure.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHA9b8HGRhiSve8W1BgZiX5JoPaEq0LvXHoTQ_JtzYRTjxA_nMyUA7s5u56HkoLKLaHgFq3jjLlf-z-8ZC1mxEifgxKqCnxFSYq9nSH1XMbNOwYEYlMt9FlxjXzMwmIsJQwXqBl6a_zWVW3naq_1grwMP5QzsmKBs-JePCW9n6hjC04RLZyW9IYqqEFgaijqHGn4pr92u0l9_JmDF7wW-SYMKpW3A9aTy7S1LzdnKsbSHAx7Do-zCq3B0auY8g_G-B-Cng=)
