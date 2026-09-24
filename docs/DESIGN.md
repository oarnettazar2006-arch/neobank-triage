# DESIGN.md : référence visuelle de VAULT (v2)

> Une vraie banque : des surfaces pleines, beaucoup d'espace, un seul bleu, et des chiffres qui ne bougent pas.

Ce fichier est la seule référence visuelle du site VAULT. Il couvre deux surfaces :

- **l'espace client**, en desktop et en mobile : l'accueil (livré), puis le chat et le suivi d'une demande (à venir) ;
- **la console conseiller**, en desktop : la file des tickets, le détail, le brouillon à valider, les tickets suspects.

Stack : Vite, React, TypeScript, Tailwind v4 dans `site/`, API FastAPI plus tard, tout en local. Aucune décision n'est laissée au développeur : si un cas manque, il se règle ici, pas dans le code.

Sommaire : 0. Direction · 1. Références · 2. Jetons · 3. Typographie · 4. Verre · 5. Composants · 6. Écrans · 7. États · 8. Mouvement · 9. Textes et données · 10. Contrats de données · 11. Garde-fous · 12. Révisions

---

## 0. Direction

**Lecture du brief :** une application bancaire grand public, pour des clients habitués à Revolut ou Qonto, dans un registre calme et digne de confiance, à la manière d'apple.com. Il faut qu'on se croie sur une vraie néobanque, pas devant une maquette.

**Principes :**

1. **Surfaces pleines.** Fond gris-bleu très clair, blocs blancs à grand rayon, ombre à peine visible. Pas de matière décorative.
2. **Beaucoup d'espace.** On aère plutôt que d'ajouter des filets : les groupes se séparent par le vide.
3. **Une seule couleur d'accent : le bleu glacier du logo.** Elle marque l'action principale, les liens, l'élément actif de la navigation et les crédits. Rien d'autre n'est coloré.
4. **La hiérarchie vient de la taille et de la graisse**, jamais des effets : pas de dégradé, de lueur ni de texture.
5. **Thème clair par défaut, thème sombre soigné** : les deux sont conçus et testés, avec la même hiérarchie.
6. **Le verre n'existe que sur la barre de navigation et sur le bouton du chat** (section 4).

| | Espace client | Console conseiller |
|---|---|---|
| Modèle | app web Revolut et Qonto pour la structure, apple.com pour la typographie et l'espace | Revolut Business : densité, rigueur |
| Matière | surfaces pleines ; verre léger sur la navigation et le bouton du chat | surfaces pleines, filets fins, zéro verre |
| Densité | aérée : cibles de 40 à 48 px, gouttière de 20 px (mobile) et 40 px (desktop) | dense : lignes de 40 px, texte de 13 px |

---

## 1. Références

**Identité, tirée des images Gemini** (`docs/design/refs/`, `docs/design/logo/`) : on garde **le logo goutte, le marine et le bleu glacier**. On abandonne leur matière (verre bulle, reflets, or) : elle faisait maquette.

**Structure** (observée, jamais copiée) :

| Référence | Ce qu'on reprend |
|---|---|
| App web Revolut | Le solde en tête, en grand, avec les centimes plus petits. Les actions rapides juste dessous. Les opérations groupées par jour, avec une icône ronde par catégorie. La navigation en bas sur mobile. |
| App web Qonto | La barre latérale sobre du desktop, avec l'utilisateur en bas. Les blocs blancs à grand rayon sur fond gris. Le vocabulaire français (« Opérations », « Tout voir »). |
| apple.com | La barre du haut en verre léger (flou et saturation, aucun reflet). Une typographie serrée, en graisse 600, avec une approche négative sur les grandes tailles. L'espace comme séparateur. |

Des captures de ces sites ont servi pendant la conception. Elles ne sont **pas** dans le dépôt, et aucun élément de marque (logo, couleur, police, illustration) n'en est repris. Les applications web de Revolut et de Qonto demandent un compte : la structure retenue vient de leurs parcours publics et de l'usage courant.

---

## 2. Jetons

### 2.1 Couleurs

Variables CSS dans `site/src/index.css`, exposées à Tailwind sous les mêmes noms. Aucune couleur n'est écrite ailleurs.

| Jeton | Clair | Sombre | Rôle |
|---|---|---|---|
| `--bg` | `#F5F7FA` | `#070C1A` (marine) | fond de page |
| `--surface` | `#FFFFFF` | `#0F1628` | blocs, barre latérale, panneaux |
| `--surface-2` | `#EEF2F6` | `#172036` | puits d'icônes, survol, bandeau de démo |
| `--line` | `#E3E8EF` | `#1E2940` | filets (rares) |
| `--text` | `#0B1226` | `#EDF2F7` | texte principal |
| `--text-2` | `#5A6478` | `#98A3B6` | texte secondaire |
| `--accent` | `#16729E` (glacier profond) | `#46B3DB` (glacier du logo) | action principale, liens, navigation active, crédits |
| `--on-accent` | `#FFFFFF` | `#051021` | texte sur l'accent |
| `--danger` | `#C4303A` | `#FF8A80` | erreurs seulement, toujours avec une icône et un texte |
| `--carte` | `#0C1A33` | `#13254A` (+ filet blanc à 8 %) | la carte VAULT |

Le marine et le glacier viennent de la planche du logo. Le glacier du logo (`#46B3DB`) ne passe pas le AA en clair, où il faut sa version profonde `#16729E`, de même teinte.

### 2.2 Contrastes (WCAG 2.1 AA : 4,5:1 pour le texte, 3:1 pour les grands textes et les éléments d'interface)

| Paire | Clair | Sombre |
|---|---|---|
| Texte sur fond | 17,34 | 17,32 |
| Texte secondaire sur surface | 5,95 | 7,08 |
| Texte secondaire sur fond | 5,54 | 7,66 |
| Texte secondaire sur `--surface-2` | 5,29 | 6,36 |
| Accent (texte, lien, crédit) sur surface | 5,34 | 7,49 |
| Accent sur fond | 4,97 | 8,11 |
| Accent (icône) sur `--surface-2` | 4,74 | 6,74 |
| `--on-accent` sur accent (bouton principal) | 5,34 | 7,92 |
| Texte de la carte sur `--carte` | 15,32 | 13,34 |
| Texte secondaire de la carte sur `--carte` | 7,84 | 6,83 |

### 2.3 Thème

Choix mémorisé (`localStorage`, clé `vault:theme`), sinon préférence du système, sinon **clair**. Un bouton soleil ou lune dans la barre du haut bascule le thème. Le script de `index.html` pose `data-theme` avant le premier rendu : pas de flash.

### 2.4 Rayons (une seule règle)

- **Blocs** : 20 px (`--radius-bloc`).
- **Tout élément interactif** : pilule (rayon complet). Cela vaut pour les boutons, la navigation active, « Geler » et le bouton du chat.
- **Puits d'icônes et avatars** : cercles.
- **Carte VAULT** : 18 px, ratio ISO 7810 (1,586). La vignette mobile est à 6 px.

### 2.5 Espacements et grille

Base de 4 px. Gouttière de 20 px en mobile et 40 px en desktop.

**Desktop, à partir de 1024 px :**
- barre latérale de 248 px ;
- contenu limité à 1 120 px et centré, en deux colonnes : `minmax(0, 1fr)` et 360 px, avec 48 px d'écart ;
- 40 px entre deux blocs ;
- la carte occupe deux rangées de la grille, pour que les opérations suivent directement le solde.

**Mobile :** une colonne (`minmax(0, 1fr)`, jamais `auto`, sinon les montants insécables font déborder la page à 320 px), 40 px entre deux blocs.

### 2.6 Ombres

Presque aucune.
- **`--ombre-1`** : l'ombre des blocs. En clair, deux ombres à 3 et 4 % ; en sombre, un simple filet blanc à 3 %.
- **`--ombre-flottante`** : réservée à ce qui flotte, c'est-à-dire la carte VAULT, le bouton du chat et le panneau du chat.

---

## 3. Typographie

**Une seule famille : Geist** (variable, 100 à 900), auto-hébergée avec `@fontsource-variable/geist`. Pile de secours : `system-ui, -apple-system, "Segoe UI", sans-serif`.

**Pourquoi Geist :**

- **Ce qu'on cherche :** l'effet d'apple.com. SF Pro n'est pas licenciable pour le web, et Geist en a les proportions : une grotesque neutre, serrée, nette dès 13 px.
- **Les chiffres :** de **vrais chiffres tabulaires**. Vérifié dans le navigateur : « 1111 » et « 0000 » mesurent tous deux 36 px. Les montants s'alignent en colonne, et le solde ne bouge pas quand il change.
- **Pourquoi pas Inter :** c'est la police de l'app web de Revolut ; on aurait l'air d'une copie.
- **Pourquoi pas Manrope** (v1) : elle est trop ronde pour des montants, et fait « startup » plutôt que banque.
- **Licence :** Geist est sous licence libre (OFL) et tout tourne en local.

**Échelle** (px ; interlignage ; graisse) :

| Rôle | Mobile | Desktop | Graisse | Approche |
|---|---|---|---|---|
| Solde | 44 / 44 | 56 / 56 | 600 | −0,035 em |
| Centimes et symbole du solde | 0,55 em | 0,55 em | 600, `--text-2` | −0,02 em |
| Montant fort (résumé du mois) | 24 / 32 | 24 / 32 | 600 | −0,02 em |
| Titre de bloc | 19 / 26 | 19 / 26 | 600 | −0,01 em |
| Titre de barre | 17 | 17 | 600 | 0 |
| Corps, libellés, montants de liste | 15 / 22 | 15 / 22 | 400 ; 500 pour les libellés et les montants | 0 |
| Petit : sous-lignes, jours, légendes | 13 / 18 | 13 / 18 | 400 ou 500 | 0 |
| Navigation du bas | 12 | | 500 | 0 |

**Règles :**

- **Tous les montants sont en chiffres tabulaires** (classe `.montant`, qui interdit aussi la coupure). Cela inclut le solde, les opérations, le résumé, l'IBAN, les chiffres et l'expiration de la carte.
- Casse de phrase partout. Aucun libellé en capitales, sauf le mot VAULT.
- Pas de texte sous 12 px. Les tailles sont en `rem` : elles suivent le réglage du système.
- Aucun tiret cadratin ni demi-cadratin dans l'interface (test automatique).
- Le mot VAULT est composé en Geist 600, approche +0,08 em, à côté de la goutte détourée (`site/public/marque/`, extraite par `docs/design/logo/extraire_goutte.py`), en attendant le logo SVG.

---

## 4. Verre

**Deux usages, et aucun autre :**

1. **La barre de navigation** : la barre du haut (desktop et mobile) et la navigation du bas (mobile).
2. **Le bouton du chat**, en bas à droite.

**Recette** (classe `.verre`), celle d'apple.com : un fond de la couleur de la page à 70 ou 72 % d'opacité, puis `backdrop-filter: saturate(180%) blur(20px)`, puis un filet d'1 px (`--verre-bord`) sur le bord qui touche le contenu. Il n'y a pas de reflet, pas de liseré, pas de lueur.

**Repli** : avec `prefers-reduced-transparency: reduce`, le fond devient `--bg`, opaque, sans flou.

---

## 5. Composants

### 5.1 Client

| Composant | Spécification |
|---|---|
| **Bandeau de démo** | 32 px, `--surface-2`, 13 px `--text-2`, icône info : « Démo, données fictives ». Tout en haut, non collant. |
| **Barre du haut** | 64 px, en verre, collante. En desktop : le titre de la page à gauche (17/600), le thème et les notifications à droite. En mobile : le logo à gauche, puis le thème, les notifications et les initiales. |
| **Barre latérale** (desktop) | 248 px, `--surface`, filet droit. Logo en haut. Cinq entrées : Accueil, Comptes, Cartes, Paiements, Aide, en pilules de 40 px avec icône de 20 px. L'entrée active a un fond accent à 10 %, un texte accent et une icône pleine. En bas : les initiales, le nom et « Compte personnel ». |
| **Navigation du bas** (mobile) | 64 px plus la zone sûre, en verre, avec les mêmes cinq entrées : icône de 22 px et libellé de 12 px. L'entrée active est en accent, icône pleine. |
| **Solde** | « Compte courant » en 15/500 `--text-2`, puis le solde (section 3) et l'IBAN masqué en 13 px. |
| **Actions rapides** | Virement, Ajouter de l'argent, Carte. En desktop : pilules de 44 px, « Ajouter de l'argent » pleine en accent (l'action principale, une seule par écran), les deux autres en surface avec un filet. En mobile : cercles de 48 px avec le libellé dessous, « Ajouter » en accent plein et les autres en accent à 10 %. Le libellé court « Ajouter » garde le libellé complet en `aria-label`. |
| **Opérations** | Un bloc intitulé « Opérations », avec « Tout voir » en accent. Les jours sont écrits en 13/500 `--text-2`. Les lignes, en lien, comprennent : un puits rond de 40 px avec l'icône de catégorie, le libellé en 15/500, une sous-ligne en 13 px (détail, sinon catégorie, puis « à 08:12 »), et le montant à droite en 15/500 tabulaire. Un débit s'affiche en `--text` avec un vrai signe moins ; un crédit en accent avec un « + ». Aucun filet entre les lignes. |
| **Carte VAULT** | En desktop, la carte entière : marine plein ; goutte et VAULT en haut à gauche ; pictogramme sans contact en haut à droite ; titulaire et « •••• 7310 » en bas à gauche ; « Débit » et l'expiration en bas à droite. Dessous : le nom, l'état et le bouton « Geler ». En mobile, une ligne dans un bloc : vignette de 64 × 40, nom, « •••• 7310, active » et « Geler ». |
| **Résumé du mois** | Un bloc « Septembre ». Il montre « Dépensé » et « Reçu » en 24/600 tabulaire (le reçu en accent), puis les « Principaux postes » : trois lignes avec icône, catégorie et montant. Pas de barre de progression. |
| **Bouton du chat** | Cercle en verre de 48 px (mobile, au-dessus de la navigation) ou 56 px (desktop, à 32 px des bords), icône bulle, avec l'ombre flottante. `aria-label` « Ouvrir l'assistance ». |
| **Panneau du chat** | Un `<dialog>` modal : feuille en bas sur mobile (72 % de la hauteur), tiroir de 420 px à droite en desktop. En-tête « Assistance » et bouton de fermeture. Le corps est le fil du chat (section 6.2). Le voile est marine à 32 %, et Échap ferme le panneau. |

### 5.2 Console

Elle ne change pas de principe : dense, rigoureuse, sans verre. Elle reprend les jetons v2 : `--surface`, `--line`, `--text-2`, et l'accent pour l'action principale et la file active.

| Composant | Spécification |
|---|---|
| **Barre latérale** | 232 px. Les files, chacune avec son compteur tabulaire : « À traiter », « Échéance proche », « Suspects », « Traités ». |
| **Tableau** | Colonnes : Reçu le, Cas, Motif, Sous-motif, Gravité, Échéance, Statut. En-têtes en 12/500 `--text-2`, lignes de 40 px avec un filet `--line`. Une ligne suspecte a un fond `--danger` à 8 % et une icône bouclier. |
| **Badges** | 12/500, sur un fond à 12 % de leur couleur. Gravité haute et échéance proche : `--danger`. Fiche utilisée : accent. |
| **Boutons** | 32 px. Principal en accent. Destructif (« Rejeter ») : texte et filet `--danger`, toujours séparé des autres boutons par 24 px. |
| **Éditeur de brouillon** | Une zone de texte simple en 15/24. |

**Rendu du texte d'un ticket (sécurité) :** `dangerouslySetInnerHTML` est interdit (règle ESLint `react/no-danger`, en erreur) et aucun HTML reçu n'est interprété. Les passages retirés par la garde d'entrée arrivent en segments et sont rendus en nœuds texte séparés, dans un `<mark>` : fond `--danger` à 12 %, soulignement pointillé.

### 5.3 Icônes

Phosphor (`@phosphor-icons/react`), graisse Regular, version pleine pour l'entrée de navigation active. 20 px en général, 18 px dans les puits d'opérations, 16 px dans les petits boutons. Une icône seule a toujours un `aria-label`. Pas d'émoji, pas d'icône dessinée à la main.

| Catégorie | Icône |
|---|---|
| Courses | ShoppingCart |
| Transports | Train |
| Santé | FirstAidKit |
| Abonnements | ArrowsClockwise |
| Restaurants | ForkKnife |
| Loisirs | Ticket |
| Virements | ArrowsLeftRight |
| Énergie | Lightning |
| Logement | House |
| Revenus | Briefcase |

---

## 6. Écrans

### 6.1 Accueil client (livré)

Desktop (1440 px), `(…)` = pilule, `○` = puits d'icône, `◎` = bouton du chat :

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ ◈ VAULT    │                 Démo, données fictives                       │ bandeau
│            ├──────────────────────────────────────────────────────────────┤
│ (Accueil)  │ Accueil                                    thème  notif.     │ verre
│  Comptes   │                                                              │
│  Cartes    │ Compte courant                         ┌──────────────────┐  │
│  Paiements │ 2 318,46 €                             │ ◈ VAULT       sc │  │ carte
│  Aide      │ FR76 •••• •••• 0427                    │ Élise Roussel    │  │
│            │ (Virement) (Ajouter de l'argent) (Carte)│ •••• 7310  09/29 │  │
│            │ ┌ Opérations ───────── Tout voir ┐    └──────────────────┘  │
│            │ │ Aujourd'hui                     │    Carte VAULT  (Geler) │
│            │ │ ○ Boulangerie du Marché  −4,60 €│    ┌ Septembre ───────┐ │
│            │ │ ○ Uber                  −14,20 €│    │ Dépensé   Reçu    │ │
│            │ │ Hier                            │    │ 1 417,91  +45,00  │ │
│ ÉR Élise   │ │ …                               │    │ Principaux postes │ │
└────────────┴──────────────────────────────────────────────────────── (◎) ┘
```

(`sc` : pictogramme sans contact.)

Mobile (390 px) : dans l'ordre, le bandeau ; la barre du haut (logo, thème, notifications, initiales) ; le solde ; les actions en cercles ; la carte en ligne ; les opérations ; le résumé du mois. La navigation du bas est fixe, et le bouton du chat est posé au-dessus. Il n'y a pas de cadre de téléphone.

Captures de référence : `docs/design/captures/v2/` (desktop 1440 × 900, pleine page, avec le chat ouvert ; mobile 390 × 844 en haut et après défilement, avec le chat ouvert ; en clair et en sombre).

### 6.2 Chat (livré)

Surfaces pleines, pas de verre : bulles de VAULT en `--surface-2`, bulles du client en accent, champ en pilule (2 000 caractères au plus, comme l'API), bouton d'envoi rond en accent. Le fil est un `role="log"` annoncé poliment.

1. Le client envoie son message : `POST /chat` crée le ticket (statut « Reçue ») et répond tout de suite.
2. Pendant le tri, une bulle « Nous analysons votre demande ».
3. Puis le **message fixe écrit par l'API** (`api/suivi.py`) : « Votre demande est enregistrée sous la référence X. Nos experts l'examinent. », plus les dates d'accusé de réception et de réponse pour une réclamation. Un ticket suspect reçoit le même message.

Le client ne voit jamais le brouillon du bot : il est réservé au conseiller (`GET /tickets`). Pas encore de réponse directe du bot. Si le suivi ne répond plus, le chat garde le message de base renvoyé à la création.

### 6.3 Suivi d'une demande (à venir)

Écran à refaire en v2 (le pilote v1 est abandonné). Les décisions métier restent valables : sections 9 et 10.

### 6.4 Console

**Tri d'un lot (livré, `/console`)** : barre latérale de 232 px (logo, « Tri d'un lot », lots récents, retour à l'espace client) ; en tête, deux blocs côte à côte, « Déposer un CSV » et « Écrire un ticket » ; puis le lot : progression (une barre fonctionnelle de 4 px, pas décorative) et « Arrêter » en destructif ; quatre chiffres clés ; les graphiques ; le tableau des tickets avec ses filtres et l'export.

**Graphiques** (sans bibliothèque, `site/src/console/graphiques.tsx`) : chaque graphique est un bloc avec un titre (15/600), une phrase qui dit ce qu'il mesure, des axes nommés et une phrase « À retenir » en pied, calculée à partir des mêmes chiffres. Barres horizontales de 16 px, bout arrondi à 4 px, en accent ; valeur au bout de la barre ; graduations rondes et filets `--line`. Cartes de chaleur et matrices : une case par couple, avec son nombre ; teinte accent dont l'opacité suit la valeur ; erreurs des matrices en `--danger`, avec une légende. Ordre des valeurs : celui du schéma, jamais un tri par valeur. Infobulle native au survol de chaque barre et de chaque case.

Captures de référence : `docs/design/captures/console/` (desktop 1440 × 900 en clair et en sombre, aperçu, tri en cours, ticket écrit ; mobile 390 px ; `pipeline-*.png` pour l'onglet Pipeline, `brouillons-*.png` pour la vue Brouillons).

**Prompts (livré, `/console/prompts`)** : deuxième entrée de la barre latérale ; sur mobile, deux onglets en tête. De haut en bas : la frise v0 à v7 (pastille pleine si la version change le prompt de tri, anneau sinon ; trois colonnes changement, pourquoi, effet mesuré) ; la précision par version en petits multiples, un graphique par champ, une seule teinte, axes 0 à 100 % et v0 à v7, étiquettes directes au départ et à l'arrivée seulement, bande `--surface-2` sur v5 et v6 (prompt de tri inchangé), point creux quand la mesure est reprise de la version d'avant ; un sélecteur de jeu au-dessus, jamais deux jeux dans une série, une version non mesurée reste un trou ; « Voir les chiffres » donne le tableau. La note finale test100 est à part : deux barres par champ, v0 en neutre (`--text-2` à 45 %) et v7 en accent, avec légende et p de McNemar. Le comparateur : deux listes, texte en police à chasse fixe, rendu comme du texte ; lignes ajoutées sur fond accent, supprimées sur fond `--danger`, mots changés surlignés plus fort (`<ins>`, `<del>`), signes + et − pour ne pas dépendre de la couleur ; suites identiques repliées. Chaque commande Git est copiable.

**Pipeline (livré, `/console?lot=…&ticket=n`)** : un clic sur le texte d'un ticket du tableau (icône flux, qui passe en accent au survol) remplace l'analyse et le tableau par la trace du ticket ; « Retour au lot » ramène au tableau, l'adresse garde le ticket ouvert. Un ticket écrit s'ouvre directement sur son pipeline. Six blocs numérotés, dans l'ordre du bot : garde d'entrée, tri, contrôleur, rédacteur, garde de sortie, délais. En tête de chaque bloc : une pastille ronde de 28 px avec le rang (accent plein une fois l'étape faite, `--surface-2` sinon), le titre en 15/600, ce qui a tourné (modèle ou fichier de code) en police à chasse fixe sur `--surface-2`, et la durée mesurée à droite. Dessous, deux colonnes, « Entre » et « Sort » (étiquettes 11/600 en capitales espacées, `--text-2`), séparées par un filet ; l'une sous l'autre sur mobile. Les prompts et les réponses sont en police à chasse fixe 12 px dans une boîte `--surface-2` qui défile (220 ou 360 px au plus) et s'ouvre sur le passage marqué : le ticket inséré dans le prompt sur fond accent à 14 %, les passages retirés par la garde en `<mark>` comme en 5.2. Le rédacteur commence par un encadré accent à 8 % avec une icône œil barré : il ne voit pas le ticket ; si la vérification trouvait une suite de mots du ticket dans son prompt, l'encadré passerait en `--danger`. La garde de sortie est une liste de vérifications, chacune avec une icône et un mot (« Passe », « Violation », « Sans objet ») pour ne pas dépendre de la couleur. Un lot sans brouillon affiche une phrase dans les blocs 4 et 5, sans boîte vide. Tout texte venu d'un ticket ou d'un modèle est rendu en nœuds texte.

**Brouillons (livré, `/console/brouillons`)** : troisième entrée de la barre latérale. En tête, deux graphiques : décisions sur les brouillons (validés sans modification, validés après modification, rejetés, en attente) et corrections du tri par champ, avec « Exporter les corrections (CSV) » ; le lot reprend les mêmes graphiques dans son analyse (« Validation par le conseiller »). Dessous, la file et le détail côte à côte en desktop large (détail de 460 px, collant), l'un sous l'autre sinon. La file est un tableau dense : ticket (identifiant, première ligne du texte, origine : lot et rang, ou chat et heure), catégorie, produit, gravité (haute en badge `--danger`), sous-motif, réclamation (badge accent), échéance (date courte, puis jours ouvrés restants ; proche, au sens relatif de la section 9, ou dépassée en `--danger` avec une icône et un mot). Ordre : réclamations d'abord, puis échéance la plus proche, puis gravité. Ligne choisie sur fond accent à 8 % ; ligne suspecte sur fond `--danger` à 8 %, avec bouclier et badge « Suspect ». Le détail : identifiant et badges, origine et échéance, lien « Voir sa trace dans Pipeline » ; le ticket du client (passages retirés par la garde en `<mark>`, 5.2) ; trois listes pour corriger catégorie, produit et gravité (valeur du bot marquée « (bot) », champ corrigé cerclé d'accent et « · corrigé ») ; la fiche utilisée ou la raison de son absence ; le brouillon dans une zone de texte, avec « Revenir au brouillon du bot » dès qu'il est modifié. Un texte modifié repasse la garde de sortie 400 ms après la dernière frappe : ses alertes s'affichent dans un encadré `--danger` à 8 % avec une icône, sans bloquer l'envoi. Ticket suspect : la case « J'ai relu le ticket signalé » est obligatoire pour valider. « Valider et envoyer » en accent ; « Rejeter » en destructif, à 24 px, ouvre un encadré `--danger` avec un motif obligatoire (liste fermée, « Autre » demande une précision) et « Confirmer le rejet ». **Rejeter le brouillon ne rejette pas la demande** : le ticket reste dans la file avec le badge neutre « Réponse à rédiger » (fond `--surface-2`) ; son détail rappelle le rejet (date et motif) sur `--surface-2`, garde le brouillon du bot dans « Voir le brouillon rejeté », ouvre une zone de texte vide « Réponse du conseiller » et n'offre plus que « Envoyer la réponse ». Les listes de correction montrent la valeur retenue par le conseiller, celle du bot restant marquée « (bot) ». Après une décision, une phrase de confirmation et le ticket suivant de la file. Lot trié sans brouillon : « Générer les brouillons » sous la progression du lot.

La liste et le détail gardent la structure du v1 : une file à gauche ; un tableau dense ; un détail en trois colonnes (ticket, tri, brouillon) ; la case « J'ai relu le ticket signalé » obligatoire avant de valider un ticket suspect ; « Rejeter » séparé des autres boutons, avec une confirmation.

---

## 7. États

| État | Espace client | Console |
|---|---|---|
| **Chargement** | Des squelettes statiques qui ont la forme exacte du contenu : blocs `--surface-2`, rayons identiques, sans scintillement. | 5 lignes squelettes de 40 px. |
| **Vide** | « Aucune opération pour l'instant. », centré dans le bloc des opérations, en `--text-2`. | « Aucun ticket dans cette file. » |
| **Erreur** | Dans le bloc concerné : icône d'alerte `--danger`, « Le service ne répond pas. Réessayez dans un instant. », puis la pilule « Réessayer ». Les autres blocs restent affichés. | Bandeau dans le panneau concerné, avec « Réessayer ». |
| **Carte gelée** | « Gelée » à la place de « Active », et le bouton devient « Dégeler ». | |
| **Ticket suspect** | Rien de visible pour le client. | Ligne marquée, bandeau dans le détail, passages retirés surlignés, relecture obligatoire. |

L'accueil lit l'API et affiche les trois états. Le compte en erreur n'a qu'un bloc d'erreur, à la place du solde.

---

## 8. Mouvement

Le mouvement sert de retour d'action, jamais de décor.

- **Appui** : tout élément pressable descend à `scale(0.97)` en 160 ms (`cubic-bezier(0.23, 1, 0.32, 1)`).
- **Survol** (pointeur fin seulement) : fondu de fond de 150 ms.
- **Panneau du chat** : entrée par le bas (mobile) ou par la droite (desktop), en 320 ms avec la courbe de tiroir `cubic-bezier(0.32, 0.72, 0, 1)`. La sortie est immédiate.
- Rien d'autre : pas d'apparition au défilement, pas de compteur qui défile, pas de squelette qui scintille.
- **`prefers-reduced-motion: reduce`** : ni enfoncement ni glissement ; le panneau apparaît directement.

---

## 9. Textes et données

- **Vouvoiement**, phrases courtes, verbes d'action sur les boutons (« Virement », « Ajouter de l'argent », « Geler », « Tout voir »), sans flèche dans le texte.
- **Montants** : format français par `Intl.NumberFormat('fr-FR', { currency: 'EUR' })`, avec une espace fine insécable avant l'euro (« 2 318,46 € »). Un débit prend le vrai signe moins U+2212 (« −32,85 € »), un crédit un « + » explicite, en accent. Les montants arrivent en **centimes entiers** : aucun calcul en virgule flottante.
- **Dates** : elles arrivent **déjà rédigées** par l'API (« Aujourd'hui », « Hier », « Mardi 22 septembre ») ; le front ne calcule aucune date (règle ESLint qui interdit `Date`). Les heures s'écrivent « à 08:12 ».
- **Données de démo** : un client, une carte, un IBAN et un employeur inventés. Les enseignes (Monoprix, SNCF Connect, Free Mobile…) sont celles d'un vrai relevé français, en texte seul, sans logo. Le bandeau « Démo, données fictives » est toujours visible.
- **Jamais de promesse d'argent** (remboursement, geste commercial) ni de délai qui ne vient pas du code.
- **Côté client, pas de jargon interne** : pas de `sous_motif`, de « fiche » ni de « garde ».

**Décisions métier du suivi (Oscar, 2026-09-24), conservées pour l'écran à venir :**

- statuts client : « Reçue », « En cours d'examen », « Réponse envoyée » ; un brouillon rejeté par le conseiller fait passer le ticket à « En cours d'examen » (le rejet vise le brouillon, jamais la demande du client), sa validation à « Réponse envoyée » ;
- échéance proche (révisé le 24/09/2026) : **relative au délai**. Elle est proche quand il reste 20 % du délai ou moins, en jours ouvrés comptés de la réception à l'échéance, avec un minimum d'un jour ouvré : 1 jour restant sur 2, 2 sur 10, 3 sur 15, 8 sur un délai de 2 mois. Seuil appliqué par l'API (`delai`, avec `jours_ouvres_restants` et `jours_ouvres_total`) ; l'ancienne règle fixe (2 jours ouvrés) mettait toute question neuve en « proche » dès sa réception ;
- échéance dépassée : visible par le client, avec l'action « Saisir le médiateur » (coordonnées fournies par l'API) ;
- « Accusé de réception envoyé » seulement si l'API donne `envoye_le`, sinon « au plus tard le … » ;
- progression, jours ouvrés restants et dates : toujours fournis par l'API.

| Code interne (`cas`) | Libellé client |
|---|---|
| `reclamation` | Réclamation |
| `operation_non_autorisee` | Opération non autorisée |
| `signalement` | Signalement |
| `question` | Question |

---

## 10. Contrats de données

### 10.1 Accueil (`site/src/donnees/types.ts`)

| Champ | Exemple |
|---|---|
| `client` | `{ prenom: "Élise", nom: "Roussel", initiales: "ÉR" }` |
| `compte` | `{ nom: "Compte courant", iban_masque: "FR76 •••• •••• 0427", solde: 231846 }` (centimes) |
| `carte` | `{ nom, derniers_chiffres: "7310", titulaire, expiration: "09/29", etat: "active" \| "gelee" }` |
| `mois` | `{ libelle: "Septembre", depenses: 141791, revenus: 4500, categories: [{ categorie, montant }] }` |
| `jours` | `[{ libelle: "Aujourd'hui", operations: [{ id, libelle, categorie, montant: -460, detail?, heure? }] }]` |

Le résumé du mois est fourni par l'API. Un test vérifie que les données de démo sont cohérentes : la somme exacte des opérations de septembre.

### 10.2 Suivi (pour l'écran à venir)

`reference`, `cas`, `statut`, `recu_le { iso, texte, court }`, `echeances [{ kind, iso, texte, court, atteinte, position, envoye_le }]`, `progression`, `jours_ouvres_restants`, `delai` (`normal` / `proche` / `depasse`), `reponse_envoyee_le`, `mediateur { nom, adresse, site }`. Les dates sont calculées par `src/deadlines.py`.

---

## 11. Garde-fous

**À faire :**

1. Une seule action principale par écran, en accent plein.
2. Tous les montants en chiffres tabulaires.
3. Toutes les couleurs par les jetons de la section 2.
4. Le verre seulement sur la navigation et le bouton du chat.
5. Tester les deux thèmes, à 1440, 390 et 320 px (aucun défilement horizontal), avant chaque fusion de front.
6. Le texte d'un ticket rendu comme texte ; les passages retirés rendus en segments.

**À ne jamais faire :**

1. De la matière décorative : verre bulle, reflets, lueurs, dégradés, textures, or.
2. Une deuxième couleur d'accent, ou le vert et le rouge « bancaires » pour les crédits et les débits.
3. Des montants à chiffres proportionnels, ou calculés en virgule flottante.
4. Une date calculée dans le front.
5. Un cadre de téléphone autour de l'interface.
6. Des libellés en capitales, des tirets cadratins, des émojis.
7. Un élément de marque d'une autre banque : logo, couleur, police, illustration.
8. Des barres de progression décoratives dans les résumés.
9. `dangerouslySetInnerHTML`.

---

## 12. Révisions

| Date | Version | Décision |
|---|---|---|
| 2026-09-22 | v1 | Verre limité à trois usages, champagne sur la date légale, Manrope. |
| 2026-09-24 | v1.1 | Oscar : plus d'or (glace à la place), verre liquide sur la carte de suivi. |
| 2026-09-24 | v1.2 | Oscar : verre sur tout élément interactif, composant Glass, page `/specimen` (PR #31). |
| 2026-09-24 | **v2** | Oscar : la PR #31 fait maquette de téléphone en verre bulle, générique. Elle est fermée sans fusion. Nouvelle direction : **surfaces pleines, espace, un seul accent glacier, verre seulement sur la navigation et le chat, thème clair par défaut**. Structure inspirée des apps web Revolut et Qonto et d'apple.com. Police **Geist** (chiffres tabulaires). Premier écran : l'accueil client sur données fictives. Le composant Glass, `/specimen` et l'écran pilote sont supprimés. |
| 2026-09-24 | v2.1 | API branchée (PR « feat/api-chat ») : accueil sur `GET /compte` et `GET /operations` avec états chargement, vide et erreur ; chat relié au vrai pipeline, message fixe au client. |
| 2026-09-24 | v2.2 | Console, PR 1 « Tri d'un lot » : deux entrées (CSV ou ticket écrit), progression en direct, analyse et métriques, graphiques faits main avec titre, axes, libellés et phrase à retenir. Jeton `--danger-rgb` ajouté pour les fonds teintés. |
| 2026-09-24 | v2.3 | Console, PR 2 « Prompts » : frise v0 à v7, précision par version en petits multiples (un jeu à la fois), note finale test100 à part, comparateur de prompts, commandes Git. |
| 2026-09-24 | v2.4 | Console, PR 3 « Pipeline » : trace d'un ticket en six blocs (entre, sort, durée), enregistrée pendant le lot ; trois exemples en un clic dans « Écrire un ticket » (réclamation implicite tirée de val60, tentative d'injection, limite du bot), qui lance aussi le rédacteur. |
| 2026-09-24 | v2.5 | Console, PR 4 « Brouillons » : file des brouillons à valider (lots et chat) triée par urgence, détail avec corrections, garde de sortie relancée sur le texte modifié, validation et rejet motivé ; chiffres de validation dans l'analyse du lot ; génération des brouillons d'un lot lancé sans. |
| 2026-09-24 | v2.6 | Oscar : rejeter un brouillon ne rejette pas la demande (« Réponse à rédiger », statut client « En cours d'examen ») ; échéance proche relative, à 20 % du délai restant, au moins un jour ouvré. |
