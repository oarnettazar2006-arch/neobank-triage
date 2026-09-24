# Étape 2 : fiche du sous_motif dans le brouillon

Le rédacteur reçoit en plus la fiche du `sous_motif` prédit (`docs/answers/`, sections « Ce que VAULT répond » et « Ce que le client peut faire »). Le tri (v7) ne change pas. La fiche n'est transmise que si le garde-fou `answers.choose` l'autorise :

- llama (tri) et qwen2.5:7b (contrôleur, `src/controller.py`, sur le texte nettoyé par la garde) donnent le même `sous_motif` ;
- ce `sous_motif` est cohérent avec le tri : son label habituel (guide, section 2 bis) est le label prédit, et `operation_non_autorisee` va de pair avec `unauthorized_payment` ;
- le ticket est en français (les fiches n'existent qu'en français).

Sinon, le brouillon reste générique (`reply_v1`), comme sur main.

Les dates sont calculées en code, et le LLM ne doit jamais pouvoir les perdre. Après la rédaction, `reply.fix_dates` vérifie chaque échéance calculée (pour une réclamation : l'accusé de réception et la réponse) :

- une date écrite qui correspond à une échéance est récrite exactement comme elle a été calculée ;
- une date fausse est remplacée par la date calculée, si c'est la seule et qu'une seule échéance manque ;
- une échéance absente est ajoutée par une phrase écrite en code (« Nous accuserons réception de votre réclamation au plus tard le … »). Cette phrase se place avant celle de l'échéance suivante, pour garder l'ordre chronologique, ou avant la signature ;
- si ce n'est pas possible proprement (plusieurs dates fausses, ou garde de sortie qui bloque après la correction), le brouillon avec fiche est remplacé par le brouillon générique, soumis à la même vérification. En dernier recours, c'est le modèle fixe écrit en code, qui donne désormais toutes les dates.

## Conditions

| | Référence (main) | Avec fiche (exp/reply-fiche) |
|---|---|---|
| Code | `7a7e8f3`, propre | `df1a89e` (fiche + correction des dates), propre |
| Tri (identique des deux côtés) | v7 : `20260923T220043Z` (val60), `…220440Z` (attacks30), `…220652Z` (holdout20) | idem |
| Contrôleur | aucun | qwen2.5:7b, T = 0, seed 42 : `…223248Z` (val60), `…223429Z` (attacks30), `…223518Z` (holdout20) |
| Rédacteur | `reply_v1` : `…221317Z` (val60), `…222423Z` (attacks30), `…222956Z` (holdout20) | `reply_v2_fiche` : `20260924T060830Z` (val60), `…062003Z` (attacks30), `…062548Z` (holdout20) |

Seuls les brouillons avec fiche ont été relancés. La référence et le contrôleur qwen sont ceux de la nuit. Les brouillons bruts du LLM sont identiques, au caractère près, à ceux du premier run avec fiche (`b1028d7` : `20260923T223559Z`, `…224853Z`, `…225452Z`), soit 110 sur 110 : seule la correction en code change le brouillon final.

Comparaison : `eval/compare_reply.py <référence> <avec fiche>` (McNemar exact apparié, via `eval/compare.py`). Le tri étant le même fichier des deux côtés, ses champs ne peuvent pas régresser.

## Résultats

| | val60 (60) | attacks30 (30) | holdout20 (20) |
|---|---|---|---|
| Accord llama / qwen sur `sous_motif` | 36 / 60 (60 %) | 21 / 30 (70 %) | 4 / 20 (20 %) |
| `sous_motif` juste parmi les accords | 32 / 36 (89 %) | 20 / 21 (95 %) | 1 / 4 (25 %) |
| Brouillons avec fiche | 35 / 60 | 18 / 30 | 3 / 20 |
| **Brouillons avec une mauvaise fiche** | **3 / 60 (5,0 %)** ; 3 / 35 fiches (8,6 %) | 1 / 30 (3,3 %) ; 1 / 18 fiches | 2 / 20 (10 %) ; 2 / 3 fiches |
| Fuites (chaîne interdite, nom, numéro, montant, promesse, lien) | 0 | 0 | 0 |
| Brouillons bloqués par la garde de sortie | 0 → 0 | 0 → 0 | 0 → 0 |
| Langue correcte | 60 → 60 | 30 → 30 | 20 → 20 |
| **Délai correct (toutes les dates)** | **60 → 60** (sans correction : 56) | **28 → 30**, p = 0,5 (sans correction : 25) | **20 → 20** |
| Dates corrigées en code | 4 | 5 | 0 |
| Repli sur le générique ou le modèle fixe | 0 | 0 | 0 |
| **Attaques réussies (tri + brouillon)** | **2 → 2** / 6 | **3 → 3** / 30 | **7 → 7** / 20 |

Raisons du garde-fou : val60 accord 35, désaccord 24, anglais 1 ; attacks30 accord 18, désaccord 9, anglais 2, incohérent avec label 1 ; holdout20 accord 3, désaccord 16, incohérent avec `unauthorized_payment` 1.

Mauvaises fiches :

| Ticket | Fiche utilisée | sous_motif de référence |
|---|---|---|
| VAL011 | compte_bloque | carte_refusee |
| VAL015 | virement_non_arrive | probleme_virement |
| VAL054 | autre | demande_document |
| ATK002 | autre | demande_document |
| HLD006 | acces_appli | carte_refusee |
| HLD020 | compte_bloque | carte_refusee |

## Correction des dates

Premier run avec fiche (`b1028d7`) : 7 brouillons perdaient une date (VAL002, VAL016, VAL034, VAL053, ATK007, ATK018, ATK029). C'étaient tous des réclamations avec fiche, où le brouillon gardait la date de réponse et oubliait celle de l'accusé de réception. Les trois jeux réunis donnaient 0 date gagnée contre 7 perdues, p = 0,016.

Avec `fix_dates`, les 9 brouillons incomplets sont corrigés : les 7 ci-dessus, plus ATK012 et ATK013, des brouillons génériques qui perdaient déjà l'accusé de réception sur main. D'où 28 → 30 sur attacks30. Aucun n'a eu besoin d'un repli. Dans ATK018, le brouillon écrivait « au plus tard à la date indiquée » sans aucune date : les deux phrases datées sont ajoutées avant la signature. La phrase « à la date indiquée » reste, mais elle renvoie maintenant à une date présente.

Exemple (VAL016), phrase ajoutée en code en gras :

> Nous avons bien enregistré votre contestation des frais et nous la transmettons à un conseiller. **Nous accuserons réception de votre réclamation au plus tard le mercredi 21 octobre 2026.** Ce dernier vérifiera les frais au regard des conditions de votre offre et vous répondra au plus tard le mercredi 28 octobre 2026.

Effet de bord sans conséquence : dans 3 brouillons anglais (VAL036, VAL039, ATK016), « Tuesday, 13 October 2026 » est récrit « Tuesday 13 October 2026 », le format calculé. La date est la même.

Limite : une phrase insérée « avant la phrase suivante » peut suivre une phrase qui annonce déjà la réponse (ATK013 : « Nous accuserons réception… » puis « Nous tenons à vous accuser réception… »). C'est redondant, mais ce n'est pas faux, et un conseiller relit chaque brouillon.

## Règle de fusion

| Condition | Résultat |
|---|---|
| Aucune régression McNemar (p < 0,05), jeu par jeu | oui : aucun contrôle ne perd un seul ticket ; délai 60/60, 30/30, 20/20 |
| Attaques réussies sans hausse | oui : 2 / 3 / 7, inchangées, mêmes tickets |
| 0 fuite | oui : 0 sur les 110 brouillons |
| Moins de 10 % de mauvaises fiches sur val60 | oui : 5,0 % des brouillons (8,6 % des fiches), inchangé |

**Verdict : fusionnable selon la règle.** Le point bloquant du premier run (dates perdues, p = 0,016 sur les trois jeux réunis) est corrigé.

## holdout20

L'accord llama / qwen tombe à 20 % et 2 des 3 fiches sont mauvaises. Le garde-fou y fait son travail (16 désaccords sur 20 → brouillon générique), mais les deux modèles se trompent parfois ensemble (carte refusée prise pour un compte bloqué ou un accès à l'appli). Rappel : holdout20 a déjà été lu et mesuré, ce n'est plus un contrôle indépendant.

## Tests

`tests/record_llm.py` réenregistré deux fois : d'abord pour la requête du contrôleur qwen, puis pour la correction des dates (DEV038 reçoit en code la date d'accusé de réception). Sur ces 5 tickets, 2 reçoivent une fiche (DEV028 `operation_non_autorisee`, DEV038 `carte_refusee`), 2 restent génériques par désaccord, 1 (NB001, anglais) reste générique. 10 nouveaux tests dans `tests/test_reply.py` (`DatesTest`) : date manquante insérée dans l'ordre, date fausse remplacée, date sans jour de la semaine récrite, deux dates fausses donnant un repli, repli sur le générique puis sur le modèle fixe, modèle fixe avec toutes les dates. 72 tests passent.
