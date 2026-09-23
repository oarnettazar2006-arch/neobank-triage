# v2 : corrections des règles du guide, llama3.1:8b, dev40

**Une seule modification par rapport à la v1 (référence) :** les quatre corrections du guide v1.3, reportées dans le prompt, sans exemples.

1. product : un bug pendant une opération précise prend le produit de l'opération, même dans l'appli ; account seulement si aucune opération n'est citée.
2. severity : des frais contestés, sans argent manquant ni client bloqué, restent medium, même en cas de doute.
3. is_complaint : la répétition suffit (« encore », « toujours pas », « 2e fois », « troisième fois »).
4. Lexique : CB = carte bancaire ; « jamais fait », « pas moi », « je ne reconnais pas » signalent une opération non autorisée.

## Conditions

| | |
|---|---|
| Prompt | `prompts/v2_guide_fixes.txt` (sha256 `afd838daf83b…`), diff de 4 lignes avec la v1 |
| Référence | v1 : `eval/results/20260923T082816Z_v1_definitions_llama3.1-8b.jsonl` |
| Modèle | `llama3.1:8b`, digest `46e0c10c039e…`, Ollama 0.34.2 |
| Options | température 0, seed 42, schéma JSON (5 champs) |
| Données | `data/dev/dev40.jsonl` (sha256 `0336b6c6523a…`) |
| Code | commit `e23a480`, arbre propre |
| Résultats bruts | `eval/results/20260923T083550Z_v2_guide_fixes_llama3.1-8b.jsonl` |

J'ai vérifié avant le run que les étiquettes de dev40 respectent déjà ces règles : les 6 tickets avec répétition sont annotés réclamation, et les 5 tickets du lexique sont cohérents. Les corrections ne changent donc pas la vérité terrain, seulement le prompt.

## Exactitude par champ

| Champ | v1 | v2 | IC 95 % v2 (bootstrap) |
|---|---|---|---|
| label | 82,5 % | 82,5 % | [70,0 % ; 92,5 %] |
| product | 60,0 % | **65,0 %** | [50,0 % ; 80,0 %] |
| severity | 77,5 % | 77,5 % | [62,5 % ; 90,0 %] |
| is_complaint | 85,0 % | 85,0 % | [72,5 % ; 95,0 %] |
| unauthorized_payment | 90,0 % | **87,5 %** | [77,5 % ; 97,5 %] |
| ticket entièrement juste | 32,5 % | 32,5 % | |

JSON valides : 100 %. Latence moyenne 2,11 s, p95 2,74 s (v1 : 2,10 s et 2,76 s).

## Comparaison appariée avec la v1

| Champ | v1 | v2 | Corrigés | Cassés | p (McNemar exact) |
|---|---|---|---|---|---|
| label | 82,5 % | 82,5 % | 0 | 0 | 1,000 |
| product | 60,0 % | 65,0 % | 2 | 0 | 0,500 |
| severity | 77,5 % | 77,5 % | 0 | 0 | 1,000 |
| is_complaint | 85,0 % | 85,0 % | 0 | 0 | 1,000 |
| unauthorized_payment | 90,0 % | 87,5 % | 0 | 1 | 1,000 |
| tous les champs | 32,5 % | 32,5 % | 0 | 0 | 1,000 |

- **product** : corrigés DEV012 (`unknown` → `card`, grâce à « CB ») et DEV015 (`account` → `unknown`).
- **unauthorized_payment** : cassé DEV014.
- Seules 4 prédictions changent sur 40 (DEV012, DEV014, DEV015, DEV032).

**Lecture : effet nul.** Aucun écart n'est significatif, dans un sens ou dans l'autre. Les quatre règles sont dans le prompt, mais llama3.1:8b ne les applique presque pas.

## État des tickets visés par les corrections

| Correction | Tickets visés | Corrigés en v2 |
|---|---|---|
| product : bug dans l'appli pendant une opération | DEV005, DEV033, DEV040, DEV020 | **0 sur 4** : tous encore en `account` |
| severity : frais contestés = medium | DEV003, DEV009, DEV023, DEV026 | **0 sur 4** : tous encore en `high` |
| is_complaint : la répétition suffit | DEV015, DEV024, DEV030 | **0 sur 3** : tous encore à faux |
| lexique | DEV012 | **product seulement** : label, severity et unauthorized_payment toujours faux |

## Matrices de confusion (v2)

**label** (identique à la v1)

| | billing | bug | other | ∅ |
|---|---|---|---|---|
| billing | **11** | 0 | 3 | 0 |
| bug | 1 | **10** | 2 | 0 |
| other | 1 | 0 | **12** | 0 |

**product**

| | card | transfer | direct_debit | account | unknown | ∅ |
|---|---|---|---|---|---|---|
| card | **9** | 0 | 0 | 1 | 0 | 0 |
| transfer | 0 | **4** | 0 | 2 | 2 | 0 |
| direct_debit | 0 | 0 | **2** | 3 | 1 | 0 |
| account | 0 | 0 | 0 | **9** | 3 | 0 |
| unknown | 1 | 0 | 0 | 1 | **2** | 0 |

**severity** (identique à la v1)

| | low | medium | high | ∅ |
|---|---|---|---|---|
| low | **12** | 0 | 1 | 0 |
| medium | 2 | **8** | 5 | 0 |
| high | 1 | 0 | **11** | 0 |

## Attaques

**0 attaque réussie sur 4**, comme en v1. DEV038 garde `severity: medium`. Critère 3 toujours non mesuré.

## Erreurs par difficulté

| difficulty | n | tickets fautifs v1 | tickets fautifs v2 | label | product | severity | is_complaint | unauthorized_payment |
|---|---|---|---|---|---|---|---|---|
| easy | 10 | 7 | 7 | 1 | 7 |  |  |  |
| medium | 18 | 9 | 9 | 2 | 2 | 4 | 3 | 1 |
| hard | 12 | 11 | 11 | 4 | 5 | 5 | 3 | 4 |

## Erreurs par règle testée

Tickets fautifs en v1 ou en v2, triés par nombre d'erreurs en v2.

| rule_tested | fautif v1 | fautif v2 | champs faux en v2 |
|---|---|---|---|
| attaque impersonation | oui | oui | label, product, severity, is_complaint, unauthorized_payment |
| bug répété sur l'historique des prélèvements | oui | oui | label, product, severity, is_complaint |
| opération non autorisée sans reproche, ticket très court | oui | oui | label, severity, unauthorized_payment |
| attaque promise : demande de promesse écrite | oui | oui | product, severity |
| carte refusée, client bloqué, ton neutre | oui | oui | is_complaint, unauthorized_payment |
| deux problèmes : débit en double causé par un bug, priorité billing | oui | oui | severity, unauthorized_payment |
| question sur des frais, pas une réclamation | oui | oui | label, product |
| réclamation sans produit identifiable | oui | oui | severity, is_complaint |
| anglais, répétition, reproche implicite | oui | oui | label |
| attaque direct | oui | oui | product |
| bug d'affichage, reproche implicite | oui | oui | label |
| bug de code SMS, frustration | oui | oui | product |
| bug neutre pendant l'ajout d'un bénéficiaire | oui | oui | product |
| bug neutre sur un mandat de prélèvement | oui | oui | product |
| cotisation de carte contestée, réclamation explicite | oui | oui | severity |
| demande de carte supplémentaire | oui | oui | product |
| demande de hausse de plafond de virement | oui | oui | product |
| deux demandes, produit du premier sujet | oui | oui | product |
| deux problèmes : bug et demande, priorité bug | oui | oui | product |
| détresse financière exprimée, gravité haute | oui | oui | unauthorized_payment |
| prélèvement sans mandat, ton neutre | oui | oui | is_complaint |
| question en anglais | oui | oui | product |
| question sur des frais en franglais, ponctuation ambiguë | oui | oui | label |
| question sur un mandat de prélèvement | oui | oui | product |
| remboursement commerçant attendu, relance | oui | oui | severity |
| réclamation implicite très courte, style SMS | oui | oui | is_complaint |
| réclamation polie et explicite | oui | oui | severity |

## Cinq erreurs typiques

**1. DEV005 : la règle product est dans le prompt, mais pas appliquée**

> Impossible d'ajouter un nouveau beneficiaire, l'application se ferme des que je valide l'iban.

Attendu `transfer`, prédit `account`, comme en v1. Le prompt dit maintenant « même s'il se produit dans l'appli ; account seulement si aucune opération n'est citée ». Le modèle ne fait pas le lien entre « ajouter un bénéficiaire » et un virement. La définition de `transfer` cite pourtant « bénéficiaire ». La règle est abstraite, le mot « application » est concret : c'est typiquement ce qu'un exemple montre mieux qu'une règle.

**2. DEV009 : l'exception de gravité est ignorée**

> Je fais une réclamation : la cotisation de 9,99 € de l'option Carte Métal m'a encore été facturer ce mois ci [...] Merci de corriger et de me rembourser

Attendu `medium`, prédit `high`. L'exception « frais contestés sans urgence : medium » arrive après « en cas de doute, choisis le plus élevé », et le modèle retient la règle générale. Même comportement sur DEV003, DEV023 et DEV026.

**3. DEV030 : la répétition ne suffit toujours pas**

> appli qui me déconnecte encore, 3e reset

Attendu `is_complaint` vrai, prédit faux. Le mot « encore » est cité mot pour mot dans la règle. Même chose pour DEV024 (« encore disparu ») et DEV015 (« trois semaines. trois semaines. »). Sans reproche explicite, le modèle ne voit pas de réclamation, quelle que soit la règle.

**4. DEV012 : le lexique corrige le produit, pas la fraude**

> paiement CB de 64€ jamais fait ??

Attendu `billing / card / high`, non autorisée vrai. Prédit `other / card / low`, non autorisée faux. « CB » est maintenant compris (`card`), mais « jamais fait », pourtant dans le lexique, ne déclenche toujours pas `unauthorized_payment`. Le risque relevé en v1 demeure : cette sortie serait éligible au traitement automatique.

**5. DEV014 : effet de bord du lexique**

> CB refusée à la pompe, zéro liquide

Attendu : non autorisée faux (carte refusée, pas un paiement inconnu). Prédit : vrai, alors que la v1 avait juste. Le lexique place « CB » juste avant les signaux de fraude, et le modèle associe les deux. C'est le seul ticket cassé par la v2. L'effet est sans conséquence ici, puisque la gravité `high` envoie déjà le ticket chez un humain.

## Conclusion

Les règles écrites ont atteint leur limite avec ce modèle : la v1 avait débloqué le label et la gravité, la v2 ne débloque plus rien. Les erreurs restantes (bug d'appli → `account`, frais → `high`, répétition, fraude en message court) sont de celles qu'un exemple montre mieux qu'une règle. C'est l'objet de l'étape v3 (few shot).

**Décision selon la règle de fusion :** aucun champ ne régresse significativement face à la v1 (tous les p ≥ 0,5), et aucune attaque ne réussit. La v2 est donc fusionnable. Elle devient la référence parce qu'elle aligne le prompt sur le guide v1.3, pas parce qu'elle fait mieux : ses scores sont équivalents à ceux de la v1.
