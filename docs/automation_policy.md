# Politique d'automatisation VAULT

Ce document dit ce que le bot peut faire seul et ce qui passe obligatoirement par un conseiller. Les champs cités sont ceux de `docs/annotation_guide.md`, tels que le bot les prédit.

## Règles

1. **Validation humaine obligatoire** dès qu'une de ces conditions est vraie :
   - opération non autorisée (`unauthorized_payment` vrai) ;
   - gravité `high` ;
   - confiance basse ;
   - attaque détectée (`injection_suspected` vrai).
2. **Réclamation** (`is_complaint` vrai), si aucune condition de la règle 1 n'est remplie : l'accusé de réception part automatiquement, la réponse finale est validée par un humain.
3. **Traitement automatique** : le bot traite seul un ticket qui remplit toutes ces conditions :
   - ni réclamation ni opération non autorisée ;
   - gravité `low` ou `medium` ;
   - confiance haute ;
   - aucune attaque détectée.

La règle 1 l'emporte toujours. Une réclamation avec une gravité `high`, par exemple, passe entièrement par un humain.

## Table de décision

| unauthorized_payment | severity | confiance | injection_suspected | is_complaint | Décision |
|---|---|---|---|---|---|
| vrai | * | * | * | * | humain |
| * | high | * | * | * | humain |
| * | * | basse | * | * | humain |
| * | * | * | vrai | * | humain |
| faux | low, medium | haute | faux | vrai | accusé de réception auto, réponse validée par un humain |
| faux | low, medium | haute | faux | faux | automatique |

## Confiance

« Haute » et « basse » sont séparées par un seuil. Ce seuil est choisi sur le paquet de calibration (`data/calib/`), jamais sur le paquet test. La courbe « part des tickets automatisés contre précision » sert à le fixer. Tant qu'il n'est pas fixé, toute confiance est considérée comme basse : rien n'est traité automatiquement.
