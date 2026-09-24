# DESIGN.md : référence visuelle de VAULT

> Du verre calme autour d'une seule date qui compte : celle que le code a calculée.

Ce fichier est la seule référence visuelle du site VAULT. Il couvre deux surfaces :

- **l'espace client**, sur mobile d'abord : un chatbot qui crée un ticket, puis une page de suivi avec le statut et le délai légal ;
- **la console conseiller**, sur desktop : la file des tickets, le détail, le brouillon à valider, les tickets suspects.

Stack cible : Vite, React, TypeScript, Tailwind, API FastAPI, tout en local. Aucune décision n'est laissée au développeur : si un cas manque, il se règle en modifiant ce fichier, pas dans le code.

Sommaire : 0. Direction · 1. Références · 2. Tokens · 3. Typographie · 4. Verre · 5. Composants · 6. Wireframes · 7. États · 8. Mouvement · 9. Ton des textes · 10. Écran pilote · 11. Garde-fous · 12. Révisions

---

## 0. Direction

| | Espace client | Console conseiller |
|---|---|---|
| Modèle | Apple Liquid Glass (iOS 26) | Revolut Business : densité, rigueur |
| Matière | verre sur fond vivant, 3 usages seulement | surfaces opaques, filets fins, zéro verre |
| Thème par défaut | sombre (fond abysse, comme toutes les références) | clair (journées de travail longues) |
| Autre thème | clair, suit `prefers-color-scheme` | sombre, suit `prefers-color-scheme` |
| Densité | aérée : cibles de 44 px minimum, gouttière de 20 px | dense : lignes de tableau de 40 px, texte de 13 px |
| Audace | **une seule : la carte de suivi du délai légal** | aucune |

**Élément signature : la carte de suivi.** C'est le seul endroit où l'on ose. La date légale y est affichée en grand, en champagne. Une perle de verre, reprise de la goutte du logo, avance sur un rail entre la réception du ticket et l'échéance. Le liseré de la carte passe du glacier au champagne, comme le bord de la goutte du logo. Tout le reste du site est calme : pas de dégradé, pas d'effet, pas de couleur d'accent superflue.

Niveau d'interaction (skill web-design) : **L1**, statique et soigné. Une seule animation côté client, aucune côté console (section 8).

---

## 1. Références

Fichiers : `docs/design/refs/` (7 écrans) et `docs/design/logo/vault-logo-planche.jpg` (planche du logo). Ces images ont été générées par Gemini. Elles contiennent du texte déformé, des effets de verre impossibles en CSS et des contenus hors sujet (crypto, montants). On en prend les principes, pas les défauts.

| Fichier | Ce qu'on retient | Ce qu'on rejette |
|---|---|---|
| `ref-01-centre-de-controle.jpg` | Le fond navy en dégradé avec un vignettage doux. La **perle de verre** du curseur « Daily Limit », qui devient la perle du rail de la carte de suivi. Le reflet fin sur le bord haut des pilules. | Tout en verre : plus aucune hiérarchie. Des libellés gris de 11 px sur le verre, illisibles. Une grille de tuiles identiques. Les devises et le bitcoin. |
| `ref-02-chat-support.jpg` | Les bulles du bot en verre, avec le symbole du logo. Les suggestions en pilules sous la conversation. Le champ de saisie en capsule. L'en-tête avec le logo centré. | Le texte déformé (« I smoke your message »). Les bulles imbriquées dans d'autres bulles. La lueur dorée *dans* le verre, impossible en CSS. Des bulles utilisateur trop proches de celles du bot. Des pilules qui débordent de l'écran. Un bouton d'envoi en forme de goutte, qui détourne le logo. |
| `ref-03-notifications.jpg` | La preuve que le verre n'existe que sur un **fond vivant** : les pilules ne sont belles que sur le bokeh de la ville. L'horodatage discret en haut à droite. | Un titre champagne de 28 px sur le verre clair : contraste insuffisant. Les montants (« €1,200.00 ») : le support n'en affiche jamais. Les photos de personnes. Les pilules hors du cadre. Les fautes (« Monnday »). |
| `ref-04-cartes.jpg` | Le **liseré bicolore** (bleu d'un côté, or de l'autre) sur le bord des cartes : c'est le bord de la goutte du logo, réservé à la carte de suivi. Les lignes pleine largeur avec une icône dans un cercle. | Les cartes irisées empilées, avec du violet absent du logo. La perspective 3D. Le métal brossé. Les numéros de carte. |
| `ref-05-envoi.jpg` | **Une seule grande valeur centrée dans une capsule de verre** : on garde la mise en scène, mais la valeur devient la date légale au lieu d'un montant. L'action principale en capsule pleine largeur, en bas. Le champ de sélection opaque, qui confirme que les formulaires sont opaques. | Les décimales dorées : de la mise en valeur d'argent. Le pictogramme Face ID. Les avatars photo. |
| `ref-06-detail-transaction.jpg` | Une carte principale qui porte les faits clés, avec des petites icônes alignées sur une colonne. | La vue isométrique inclinée. La carte géographique. Le logo Apple (une vraie marque). Les montants en double. Des bords de verre de 12 px d'épaisseur, impossibles à rendre. |
| `ref-07-accueil-solde.jpg` | La barre d'onglets en verre, avec l'onglet actif dans une perle. Les lignes de liste opaques à filet fin : du calme. Un petit libellé en casse de phrase au-dessus du grand chiffre. | Les décimales dorées. La crypto. La grille de 4 boutons identiques. Les pilules géantes « Pay » et « More » posées hors du téléphone, pour la décoration. |
| `logo/vault-logo-planche.jpg` | **La palette, mesurée au pixel** (section 2). Le mot-symbole en capitales larges et géométriques. Le symbole goutte + V. Les deux déclinaisons, sur fond sombre et sur fond clair. | Le logo est une **image JPEG, pas un vecteur** : il faut une version SVG avant la mise en ligne (section 10). La goutte en verre 3D est illisible sous 32 px : il faut aussi une version plate monochrome. Sur le panneau central, le « VAULT » blanc a un contour biseauté parasite. |

---

## 2. Tokens

### 2.1 Couleurs

Six couleurs nommées, plus le blanc et le noir purs. Chaque couleur a une valeur par thème. Les cinq premières sont mesurées sur la planche du logo (moyenne de zone, ou pixels les plus saturés de la goutte). La sixième, vermillon, vient du brief : états d'erreur et tickets suspects.

| Nom | Sombre | Clair | Origine | Rôle |
|---|---|---|---|---|
| **abysse** | `#050A22` | `#050A22` | fond du logo, panneau gauche, en bas | fond sombre ; **texte principal en thème clair** |
| **ardoise** | `#15253E` | `#15253E` | fond du logo, panneau gauche, en haut | surfaces opaques sombres, repli du verre, console sombre |
| **givre** | `#E8F3F7` | `#E8F3F7` | panneau clair de la planche | fond clair (client et console) |
| **glacier** | `#46B3DB` | `#296788` (glacier profond) | bleu de la goutte (pixels saturés, moyenne) | action principale, lien, focus, bulle du client, remplissage du rail |
| **champagne** | `#E6D4B3` | `#7A5C24` (champagne profond) | reflet doré du bord de la goutte | **uniquement** la date légale et le liseré de la carte de suivi |
| **vermillon** | `#FF8A80` | `#C4303A` | brief (erreurs, tickets suspects) | erreur, ticket suspect, échéance proche ou dépassée |
| blanc | `#FFFFFF` | `#FFFFFF` | reflets et mot-symbole sur fond sombre | texte sur fond sombre, surfaces de la console claire |
| noir | `#000000` | `#000000` | | ombres et voiles seulement, toujours en `rgba(0,0,0,…)` |

Pourquoi abysse et pas du noir : c'est la couleur du fond du logo, une couleur de marque, et non un noir « adouci ». Le vrai noir existe, mais seulement dans les ombres et les voiles. Il n'y a aucun gris neutre dans le système : les textes secondaires sont le texte principal à opacité réduite (ci-dessous).

**Variables CSS** (noms imposés, définis dans `:root` et `[data-theme="dark"]`, exposés à Tailwind sous les mêmes noms) :

| Variable | Sombre | Clair |
|---|---|---|
| `--bg` | abysse | givre |
| `--surface` (opaque) | ardoise | blanc |
| `--text` | blanc | abysse |
| `--text-2` (secondaire) | blanc à 72 % (80 % sur verre) | abysse à 64 % (72 % sur verre) |
| `--accent` | glacier `#46B3DB` | glacier profond `#296788` |
| `--on-accent` (texte sur bouton accent) | abysse | blanc |
| `--legal` | champagne `#E6D4B3` | champagne profond `#7A5C24` |
| `--danger` | vermillon `#FF8A80` | vermillon `#C4303A` |
| `--line` (filet décoratif) | blanc à 10 % | ardoise à 14 % |
| `--line-strong` (bord de champ, 3:1) | blanc à 35 % (`#677182` sur ardoise) | ardoise à 50 % (`#8A929E`) |
| `--row-selected` (console) | glacier à 18 % sur ardoise (`#1E3F5A`) | glacier à 14 % sur blanc (`#E5F4FA`) |
| `--row-suspect` (console) | vermillon à 12 % sur ardoise (`#313146`) | vermillon à 8 % sur blanc (`#FAEEEF`) |

Chaque couleur a aussi sa version `-rgb` (par exemple `--accent-rgb: 70 179 219`), pour les `rgba()`.

**Règles de couleur :**

- Le glacier ne sert jamais de texte sur le verre sombre (2,9:1 mesuré) : on utilise le blanc.
- Le champagne n'apparaît qu'à deux endroits : la date légale et le liseré de la carte de suivi. Jamais sur un bouton, un montant ou un titre.
- Le vermillon est toujours accompagné d'une icône et d'un texte. La couleur seule ne porte jamais un sens.
- Aucune couleur n'est écrite en dur dans un composant : on passe toujours par les variables.

### 2.2 Contrastes vérifiés (WCAG 2.1, seuil AA = 4,5:1 pour le texte, 3:1 pour les grands textes et les éléments d'interface)

**Hypothèse du pire cas pour le verre.** On prend la zone la plus claire du fond vivant, le halo glacier à son opacité maximale, puis on compose le remplissage du verre par-dessus. Le flou ne peut qu'adoucir ce fond : la valeur réelle est égale ou meilleure.

| Paire | Ratio | Verdict |
|---|---|---|
| Blanc sur verre sombre (halo 30 %, remplissage 10 % → `#3A617C`) | **6,60** | AA |
| Blanc à 80 % sur verre sombre | **4,91** | AA |
| Champagne sur verre sombre | **4,54** | AA (on l'utilise quand même à 17 px ou plus) |
| Glacier sur verre sombre | 2,90 | **interdit comme texte** |
| Vermillon clair sur verre sombre | 2,89 | **interdit** : les erreurs vont sur une surface opaque |
| Abysse sur verre clair (halo 40 %, remplissage 60 % → `#D7EEF6`) | **16,29** | AAA |
| Abysse à 72 % sur verre clair | **7,43** | AAA |
| Glacier profond sur verre clair | **5,16** | AA |
| Champagne profond sur verre clair | **5,16** | AA |
| Vermillon `#C4303A` sur verre clair | **4,55** | AA |
| Abysse sur bouton glacier | **8,14** | AAA |
| Blanc sur bouton glacier profond | **6,19** | AA |
| Blanc sur ardoise (repli opaque sombre) | **15,37** | AAA |
| Blanc à 72 % sur ardoise | **8,59** | AAA |
| Abysse à 64 % sur blanc (secondaire de la console claire) | **6,03** | AA |
| Abysse à 64 % sur givre | **5,34** | AA |
| Blanc à 64 % sur ardoise (secondaire de la console sombre) | **7,09** | AAA |
| Vermillon `#C4303A` sur blanc / sur givre | **5,48 / 4,85** | AA |
| Vermillon `#FF8A80` sur ardoise | **6,73** | AA |
| Glacier profond sur givre (anneau de focus, thème clair) | **5,49** | ≥ 3:1 |
| Glacier sur abysse (anneau de focus, thème sombre) | **8,14** | ≥ 3:1 |
| Bord de champ `--line-strong` clair sur blanc / sombre sur ardoise | **3,14 / 3,13** | ≥ 3:1 |
| Abysse sur ligne suspecte, thème clair / blanc sur ligne suspecte, thème sombre | **17,34 / 12,65** | AAA |

Ces valeurs imposent des limites au fond vivant : **halo glacier à 30 % au plus en sombre, 40 % au plus en clair**. Au-delà, on sort des mesures ci-dessus.

### 2.3 Rayons

| Token | Valeur | Usage |
|---|---|---|
| `--r-signature` | 28 px | carte de suivi, seule |
| `--r-glass` | 20 px | bulles du chatbot, feuilles |
| `--r-pill` | 999 px | boutons client, suggestions, barre de navigation, champ de saisie |
| `--r-control` | 12 px | champs de formulaire client |
| `--r-panel` | 8 px | panneaux et popovers de la console |
| `--r-input` | 6 px | champs et boutons de la console |
| `--r-badge` | 4 px | badges de la console |

Les rayons client sont larges et continus, comme sur iOS. Ceux de la console sont serrés, comme chez Revolut : une surface de travail n'a pas besoin de rondeur.

### 2.4 Espacements

Base de 4 px. Échelle : `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`.

| Contexte | Valeur |
|---|---|
| Gouttière mobile | 20 px |
| Colonne client à partir de 768 px | 560 px de large au plus, centrée |
| Marge intérieure d'une bulle | 12 px en vertical, 16 px en horizontal |
| Marge intérieure de la carte de suivi | 24 px |
| Écart entre deux blocs d'un écran client | 32 px |
| Gouttière de la console | 24 px |
| Ligne de tableau de la console | 40 px de haut, 12 px en horizontal |
| Largeur de la barre latérale de la console | 232 px |
| Cible tactile minimale | 44 × 44 px, 8 px entre deux cibles |

### 2.5 Ombres

L'ombre est toujours du noir pur à faible opacité, jamais une couleur teintée.

| Token | Valeur | Usage |
|---|---|---|
| `--shadow-glass` (sombre) | `0 8px 24px rgba(0,0,0,.28)` | verre client |
| `--shadow-glass` (clair) | `0 8px 24px rgba(0,0,0,.10)` | verre client |
| `--shadow-signature` | `0 16px 40px rgba(0,0,0,.32)` en sombre, `.14` en clair | carte de suivi |
| `--shadow-pop` | `0 4px 16px rgba(0,0,0,.12)` | popovers et menus de la console, seulement |
| aucune | | panneaux, tableaux, cartes de la console : un filet `--line` suffit |

### 2.6 Verre

| Token | Sombre | Clair |
|---|---|---|
| `--glass-fill` | `rgba(255,255,255,.10)` | `rgba(255,255,255,.60)` |
| `--glass-blur` (navigation, carte de suivi) | 20 px | 20 px |
| `--glass-blur-sm` (bulles, nombreuses et qui défilent) | 12 px | 12 px |
| `--glass-saturate` | 180 % | 160 % |
| `--glass-border` | 1 px `rgba(255,255,255,.22)` | 1 px `rgba(255,255,255,.70)` |
| `--glass-specular` (reflet du bord haut) | ombre intérieure `0 1px 0 rgba(255,255,255,.35)` | ombre intérieure `0 1px 0 rgba(255,255,255,.90)` |
| `--glass-shade` (ombre du bord bas) | ombre intérieure `0 -1px 0 rgba(0,0,0,.12)` | ombre intérieure `0 -1px 0 rgba(0,0,0,.06)` |
| Repli opaque | ardoise + bord `rgba(255,255,255,.12)` | blanc + bord ardoise à 14 % |

---

## 3. Typographie

**Une seule famille : Manrope** (variable, graisses 200 à 800), auto-hébergée avec le paquet `@fontsource-variable/manrope`. Aucun appel à Google Fonts : tout tourne en local. Pile de secours : `Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`. Chargement en `font-display: swap`.

**Pourquoi Manrope, face au logo :**

- Le mot-symbole VAULT est une linéale géométrique large : un V ouvert, un U rond, un A à sommet plat. Manrope partage ces proportions larges et ces terminaisons droites. Le texte prolonge donc le logo au lieu de le contredire.
- Elle a des **chiffres tabulaires** (`font-variant-numeric: tabular-nums`) : les dates et les références ne bougent pas d'une ligne à l'autre.
- Elle reste lisible à 13 px, dans la console dense.
- ui-ux-pro-max proposait IBM Plex Sans ; voir la section 12 pour le choix contraire.

Le mot « VAULT » n'est **jamais composé en Manrope** à la place du logo, sauf pendant l'écran pilote, tant que le SVG n'existe pas (section 10).

**Échelle, espace client** (tailles en px ; interlignage en px) :

| Rôle | Taille / interligne | Graisse | Approche | Usage |
|---|---|---|---|---|
| Date légale | 34 / 40 | 600 | −0,5 px | carte de suivi, seule |
| Titre d'écran | 28 / 34 | 700 | −0,3 px | « Votre demande » |
| Titre de bloc | 20 / 26 | 600 | 0 | « Ce qui va se passer » |
| Corps | 17 / 24 | 400 | 0 | messages, textes |
| Libellé | 15 / 20 | 500 | 0 | boutons, statuts |
| Légende | 13 / 18 | 500 | 0 | horodatages, référence |

**Échelle, console :**

| Rôle | Taille / interligne | Graisse | Usage |
|---|---|---|---|
| Titre de page | 20 / 28 | 600 | « File des tickets » |
| Titre de panneau | 15 / 22 | 600 | « Brouillon de réponse » |
| Texte de ticket | 15 / 24 | 400 | le texte du client, lu attentivement |
| Tableau et interface | 13 / 18 | 400, 500 pour l'accent | cellules, boutons |
| Légende | 12 / 16 | 500 | en-têtes de colonnes, métadonnées |

**Règles :**

- Casse de phrase partout. **Aucun libellé en capitales**, aucune approche élargie sur un libellé.
- Chiffres tabulaires pour les dates, les références et les compteurs.
- Deux graisses par écran au plus, en plus du corps en 400.
- Aucun dégradé ni ombre sur le texte (règle de décoration du texte du skill web-design : style sobre, donc aucun effet).
- Pas de texte sous 12 px. Le corps du client respecte le réglage de taille du système : les tailles sont exprimées en `rem`.

---

## 4. Règles du verre

### 4.1 Où le verre est autorisé

Trois usages, et aucun autre :

1. **La navigation client** : la barre du haut, qui porte le retour et le logo.
2. **Les bulles du bot** dans le chatbot (celles du client sont opaques, en glacier).
3. **La carte de suivi** du ticket.

### 4.2 Où il est interdit

- **Toute la console conseiller.**
- **Les textes longs** : une bulle du bot qui dépasse 4 lignes à 375 px passe en surface opaque ardoise (ou blanche en thème clair). Le verre sert au court.
- **Les formulaires** : champs, sélecteurs, cases à cocher. Ils restent opaques.
- Les messages d'erreur, qui vont toujours sur une surface opaque.
- Tout verre posé sur un autre verre.

### 4.3 Technique CSS

Une surface de verre combine, dans cet ordre :

1. `background: var(--glass-fill)` ;
2. `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))`, avec le préfixe `-webkit-` pour Safari ;
3. `border: var(--glass-border)` ;
4. `box-shadow` qui empile `--glass-specular` (bord haut lumineux), `--glass-shade` (bord bas) et `--shadow-glass`.

**Le fond vivant est obligatoire derrière le verre** (leçon de la référence 03) : sans lui, le verre n'est qu'un gris terne. C'est un calque fixe, statique, jamais animé :

- **Thème sombre :** un dégradé linéaire à 160° d'abysse vers ardoise. Par-dessus, un halo radial glacier à 30 % au plus, de 420 px de diamètre, centré en haut à gauche (15 %, 10 %). Un second halo identique est centré derrière la carte de suivi, sur l'écran de suivi seulement.
- **Thème clair :** givre en fond, avec les mêmes halos en glacier à 40 % au plus.
- Le fond vivant ne défile pas : `position: fixed`. On ne floute pas une zone qui défile en entier.

**Réfraction SVG** (`feDisplacementMap` en `backdrop-filter: url(#…)`) : **elle n'est pas dans la v1.** Si elle est ajoutée un jour, ce sera sur la carte de suivi seulement, derrière un test `CSS.supports`, avec repli automatique sur le flou standard. Sa prise en charge varie beaucoup selon les navigateurs.

### 4.4 Replis

- **Préférence « transparence réduite » :** avec `@media (prefers-reduced-transparency: reduce)`, chaque surface de verre prend son repli opaque (section 2.6), sans flou.
- **Navigateur sans `backdrop-filter` :** avec `@supports not (backdrop-filter: blur(1px))` (en testant aussi la version `-webkit-`), même repli opaque.
- **Contraste élevé :** avec `@media (prefers-contrast: more)`, repli opaque, et le texte secondaire passe à 100 %.

La prise en charge de ces préférences varie selon les navigateurs, d'où ce triple repli. Les contrastes du repli sont mesurés en section 2.2 : blanc sur ardoise, 15,37.

---

## 5. Composants

Tous les éléments interactifs ont cinq états : repos, survol, appui, focus, désactivé. Le focus est un anneau de 2 px en `--accent`, décalé de 2 px, visible au clavier seulement (`:focus-visible`).

### 5.1 Client

| Composant | Repos | Survol / appui | Désactivé |
|---|---|---|---|
| **Bouton principal** (un par écran) | capsule pleine largeur de 52 px, fond `--accent`, texte `--on-accent` en 15/500 | survol : fond éclairci de 8 % ; appui : assombri de 8 % | opacité de 40 %, `aria-disabled`, pas de curseur main |
| **Bouton secondaire** | capsule de 44 px, fond transparent, filet `--line-strong`, texte `--text` | survol : fond `--text` à 6 % ; appui : 10 % | opacité de 40 % |
| **Suggestion** (chatbot) | capsule de 36 px de haut avec une zone tactile de 44 px, en verre `--glass-blur-sm`, texte 15/500 | appui : remplissage de verre +6 % | |
| **Bulle du bot** | verre, `--r-glass`, 80 % de la largeur au plus, symbole du logo de 20 px en haut à gauche | pas d'interaction | |
| **Bulle du client** | opaque, fond glacier, texte abysse (8,14:1), `--r-glass` ; coin bas droit à 6 px | pas d'interaction | |
| **Champ de saisie** | capsule opaque `--surface` de 52 px, filet `--line-strong`, bouton d'envoi rond de 44 px en `--accent` à droite | focus : anneau `--accent` | envoi désactivé tant que le champ est vide |
| **Barre de navigation** | verre, 56 px plus la zone sûre du haut ; retour de 44 px à gauche, logo au centre | | |
| **Ligne de demande** (accueil) | pleine largeur, opaque `--surface`, filet `--line` entre les lignes, pas de carte : statut, date légale en `--legal`, chevron discret | appui : fond `--text` à 6 % | |

### 5.2 Carte de suivi (signature)

Dans l'ordre, de haut en bas :

1. **La date légale**, en 34/600 et en `--legal` (champagne). C'est la plus grande taille du site.
2. Juste au-dessus, son libellé en 15/500 `--text-2`, par exemple « Réponse au plus tard le ».
3. **Le rail :** une ligne de 4 px en `--line`, qui va de la date de réception (à gauche) à la date d'échéance (à droite). Sa partie parcourue est remplie en `--accent`.
4. **La perle :** un disque de verre de 20 px, qui reprend la goutte du logo et le curseur de la référence 01. Elle se place à la proportion de jours ouvrés écoulés, **fournie par l'API** : le front ne calcule jamais de date.
5. Sous le rail, les deux jalons en 13/500 : « Reçue le … » et l'échéance.
6. Si le cas a deux échéances (réclamation : accusé de réception puis réponse), l'accusé de réception est un **second repère** sur le rail, un anneau de 8 px, et sa ligne s'affiche sous le rail.
7. **Le liseré :** un bord de 1 px en dégradé conique, du glacier (à gauche) au champagne (à droite), comme le bord de la goutte du logo. Il est posé par-dessus le filet de verre, et c'est **le seul dégradé du site**.
8. En bas : le statut (section 7) et la référence du ticket en 13/500, chiffres tabulaires.

Rayon de 28 px, flou de 20 px, ombre `--shadow-signature`.

### 5.3 Console

| Composant | Spécification |
|---|---|
| **Barre latérale** | 232 px, fond `--surface`, filet droit `--line`. Elle liste les files, chacune avec son compteur en chiffres tabulaires aligné à droite : « À traiter », « Échéance proche », « Suspects », « Traités ». File active : fond `--row-selected`, texte en 500. |
| **Tableau** | Colonnes : Reçu le · Cas · Motif · Sous-motif · Gravité · Échéance · Statut. En-têtes en 12/500 `--text-2`, casse de phrase, sans capitales. Lignes de 40 px avec un filet `--line`. Ligne survolée : fond `--text` à 4 %. Ligne sélectionnée : `--row-selected`. Ligne suspecte : `--row-suspect`, avec une icône bouclier en vermillon dans la première colonne. |
| **Badges** | `--r-badge`, 12/500, remplissage de la couleur à 12 % et texte de la couleur pleine. Gravité haute : vermillon ; échéance proche : vermillon ; fiche utilisée : glacier. Gravité basse et moyenne : pas de badge, du texte seul. |
| **Boutons** | 32 px de haut, `--r-input`. Principal : fond `--accent`, texte `--on-accent`. Secondaire : filet `--line-strong`. Destructif (« Rejeter ») : texte `--danger`, filet `--danger`, et **toujours séparé** des autres boutons par un espace de 24 px. |
| **Champ et sélecteur** | 32 px, `--r-input`, filet `--line-strong` (3,1:1), fond `--surface`. |
| **Panneau** | `--surface`, filet `--line`, `--r-panel`, marge intérieure de 16 px, sans ombre. |
| **Éditeur de brouillon** | Zone de texte simple, en 15/24, qui s'agrandit avec le contenu. Pas d'éditeur riche. |

**Rendu du texte d'un ticket (règle de sécurité) :** `dangerouslySetInnerHTML` est interdit, et aucun HTML reçu n'est interprété. Le texte du client s'affiche comme du texte React. Les passages que la garde d'entrée a retirés arrivent de l'API sous forme de segments, chacun avec une plage de caractères. Le front les rend comme des nœuds texte séparés, chacun dans un `<mark>` stylé : fond `--danger` à 12 %, soulignement pointillé `--danger`. On ne concatène jamais de HTML.

### 5.4 Icônes

Phosphor, graisse Regular, en SVG. 20 px côté client, 16 px dans la console. Aucune émoji. Une icône seule a toujours un `aria-label`.

---

## 6. Wireframes

Conventions : `░` pour le verre, `█` pour un plein en `--accent`, `▓` pour une surface opaque. La largeur mobile représente 375 px. Les textes des wireframes sont les vrais textes, à reprendre tels quels.

### 6.1 Accueil client

Mobile (375 px) :

```
┌───────────────────────────────────┐
│░░ ‹         [VAULT]            ░░│  barre de navigation, en verre
├───────────────────────────────────┤
│                                   │
│ Bonjour                           │  titre d'écran 28/700
│ Une question, un problème ?       │  corps, --text-2
│ Écrivez-nous, nous suivons        │
│ chaque demande avec vous.         │
│                                   │
│ ███████████████████████████████   │
│ ██   Écrire au support        ██  │  bouton principal
│ ███████████████████████████████   │
│                                   │
│ Vos demandes                      │  titre de bloc 20/600
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Réclamation · En cours          ›▓│  ligne de demande (pas de carte)
│▓ Réponse au plus tard le         ▓│
│▓ jeudi 31 décembre 2026          ▓│  date en --legal
│▓─────────────────────────────────▓│
│▓ Question · Répondue             ›▓│
│▓ Répondue le lundi 12 octobre 2026▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└───────────────────────────────────┘
```

Desktop (1440 px) : la même colonne de 560 px, centrée, sur le fond vivant en plein écran. Pas de seconde colonne ni de barre latérale côté client.

```
┌───────────────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [VAULT] ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                ┌──────────── 560 px ────────────┐                     │
│                │ Bonjour                        │                     │
│                │ Une question, un problème ? …  │                     │
│                │ [ Écrire au support ]          │  bouton de 320 px,  │
│                │                                │  aligné à gauche    │
│                │ Vos demandes                   │                     │
│                │ ▓ lignes de demande ▓▓▓▓▓▓▓▓▓▓ │                     │
│                └────────────────────────────────┘                     │
└───────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chatbot

Mobile :

```
┌───────────────────────────────────┐
│░░ ‹       Support VAULT        ░░│
├───────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░        │  bulle du bot, en verre
│ ░ ◈ Bonjour. Décrivez votre     ░ │  ◈ = symbole du logo, 20 px
│ ░ situation en quelques phrases.░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│                                   │
│          ████████████████████████ │  bulle du client, glacier opaque
│          █ Ma carte est refusée █ │  (texte du client, rendu comme texte)
│          █ depuis hier.         █ │
│          ████████████████████████ │
│                                   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│ ░ ◈ Votre demande est          ░  │
│ ░ enregistrée.                 ░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │  bouton principal : ouvre le suivi
│ ▓ Suivre ma demande           ▓   │
│                                   │
│ (░Ma carte est refusée░) (░Un vi… │  suggestions, avant le premier message
├───────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (█➤) │  champ de saisie + envoi
└───────────────────────────────────┘
```

- Les suggestions n'apparaissent qu'avant le premier message du client. Il y en a trois : « Ma carte est refusée », « Un virement n'est pas arrivé », « Je conteste un prélèvement ». Elles défilent horizontalement si elles débordent, sans sortir de la gouttière.
- Le champ de saisie reste collé en bas, au-dessus de la zone sûre. La liste des messages réserve sa hauteur en marge basse.

Desktop : la colonne de 560 px, avec le champ de saisie collé en bas de la colonne.

### 6.3 Suivi de ticket (écran pilote)

Mobile :

```
┌───────────────────────────────────┐
│░░ ‹         [VAULT]            ░░│
├───────────────────────────────────┤
│ Votre demande                     │  titre d'écran
│ Réclamation · reçue le            │  légende --text-2
│ lundi 2 novembre 2026             │
│                                   │
│ ╭░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╮  │  carte de suivi, liseré glacier → champagne
│ ░ Réponse au plus tard le       ░ │  libellé 15/500
│ ░ jeudi 31 décembre 2026        ░ │  DATE 34/600, --legal
│ ░                               ░ │
│ ░ ━━━━━━━○━━━━●───────────────  ░ │  rail : ━ parcouru (glacier), ○ accusé
│ ░ 2 nov.                 31 déc. ░ │  de réception, ● perle de verre
│ ░                               ░ │
│ ░ ✓ Accusé de réception envoyé  ░ │  jalon passé
│ ░   le lundi 16 novembre 2026   ░ │
│ ░                               ░ │
│ ░ Statut : en cours d'examen    ░ │
│ ░ Réf. VLT-2026-004127          ░ │  13/500, chiffres tabulaires
│ ╰░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╯  │
│                                   │
│ Ce qui va se passer               │  titre de bloc (surface opaque)
│ ▓ Un conseiller examine votre    ▓│
│ ▓ réclamation et vous répond au  ▓│
│ ▓ plus tard à la date indiquée.  ▓│
│                                   │
│ [ Écrire au support ]             │  bouton secondaire
└───────────────────────────────────┘
```

Desktop : la même colonne de 560 px. La carte garde sa hauteur mobile, sans étirement.

### 6.4 Console : liste

Desktop (1440 px) :

```
┌──────────────────┬──────────────────────────────────────────────────────────────────────────┐
│ [VAULT] Console  │ File des tickets                            [ Rechercher une référence ] │
│                  │                                                                          │
│ À traiter     42 │ Reçu le      Cas              Motif   Sous-motif        Gravité  Échéance          Statut      │
│ Échéance proche 3│ ──────────────────────────────────────────────────────────────────────── │
│ Suspects       2 │ 24/09 09:12  Réclamation      bug     carte_refusee     Haute    ▮ 28/09 · 2 j   À traiter   │
│ Traités      118 │ ⛨ 24/09 08:55 Question        other   autre             Basse    06/10 · 8 j     À traiter   │  ligne suspecte
│                  │ 23/09 17:40  Opération n. a.  billing operation_non_a…  Haute    25/09 · 1 j     En cours    │
│                  │ …                                                                        │
│                  │                                                   1–42 sur 42 · ‹ ›      │
│ ──────────────── │                                                                          │
│ Conseiller : C.  │                                                                          │
└──────────────────┴──────────────────────────────────────────────────────────────────────────┘
```

- « ▮ » est le badge vermillon « Échéance proche ». « ⛨ » est l'icône bouclier des tickets suspects. « 2 j » donne les jours ouvrés restants, fournis par l'API.
- Tri par défaut : échéance la plus proche d'abord.

Mobile (< 1024 px) : la console reste utilisable, mais elle n'est pas optimisée. La barre latérale devient un sélecteur de file en haut, et chaque ligne devient un bloc de deux lignes : cas, échéance et statut, puis motif et sous-motif en `--text-2`.

```
┌───────────────────────────────────┐
│ [VAULT] Console   [À traiter ▾]   │
├───────────────────────────────────┤
│ Réclamation · ▮ 28/09 · 2 j      ›│
│ bug · carte_refusee · Haute       │
│───────────────────────────────────│
│ ⛨ Question · 06/10 · 8 j         ›│
│ other · autre · Basse             │
└───────────────────────────────────┘
```

### 6.5 Console : détail

Desktop, en trois colonnes : 440 px pour le ticket, 320 px pour le tri, le reste pour le brouillon.

```
┌──────────────────┬──────────────────────────┬────────────────────┬───────────────────────────────┐
│ (barre latérale) │ ‹ File   VLT-2026-004127 │ Tri                │ Brouillon de réponse          │
│                  │                          │                    │                               │
│                  │ ▓ Ticket signalé comme   │ Cas  Réclamation   │ ┌───────────────────────────┐ │
│                  │ ▓ suspect : la garde a   │ Motif [bug     ▾]  │ │ Bonjour, nous avons bien  │ │
│                  │ ▓ retiré 1 passage.      │ Sous-motif         │ │ reçu votre réclamation…   │ │
│                  │                          │ [carte_refusee ▾]  │ │ … au plus tard le jeudi   │ │
│                  │ Reçu le 24/09 à 09:12    │ Produit [card  ▾]  │ │ 31 décembre 2026.         │ │
│                  │ Canal : email            │ Gravité [Haute ▾]  │ └───────────────────────────┘ │
│                  │                          │ Réclamation  [✓]   │ Fiche : carte_refusee         │
│                  │ Texte du client          │ Paiement non       │ (tri et contrôleur d'accord)  │
│                  │ Ma carte est refusée     │ autorisé     [ ]   │ Dates : ajoutées par le code  │
│                  │ depuis hier. [IGNORE…]   │                    │                               │
│                  │ (passage retiré, surligné)│ Échéances         │ [ ] J'ai relu le ticket      │
│                  │                          │ Accusé : 16/11     │     signalé                   │
│                  │                          │ Réponse : 31/12    │ [Valider le brouillon] [Modifier] │
│                  │                          │                    │                  [Rejeter]    │
└──────────────────┴──────────────────────────┴────────────────────┴───────────────────────────────┘
```

- Le bandeau « Ticket signalé comme suspect » n'apparaît que pour un ticket suspect. Il est opaque : fond `--row-suspect`, filet gauche de 3 px en `--danger`, icône bouclier.
- La case « J'ai relu le ticket signalé » n'existe que pour un ticket suspect. Tant qu'elle n'est pas cochée, « Valider le brouillon » reste désactivé.
- « Rejeter » est séparé des autres boutons par 24 px, et demande une confirmation.

Mobile : les trois colonnes s'empilent dans l'ordre ticket, tri, brouillon. Les boutons du brouillon restent collés en bas.

---

## 7. États

| État | Espace client | Console |
|---|---|---|
| **Vide** | Accueil sans demande : le bloc « Vos demandes » affiche « Aucune demande pour l'instant. », suivi du bouton « Écrire au support ». Aucune illustration. | File vide : « Aucun ticket dans cette file. », sur une ligne centrée dans le tableau, en 13/400 `--text-2`. |
| **Chargement** | Squelettes **statiques**, sans scintillement : des blocs `--text` à 6 % qui ont la forme exacte du contenu (carte de suivi : rectangle de 28 px de rayon, 3 lignes). Réponse du bot en attente : une bulle de verre avec « VAULT rédige… » en `--text-2`, sans points animés. Le bouton d'envoi est désactivé pendant l'envoi. | Lignes squelettes statiques (5 lignes de 40 px). Un bouton en cours d'action garde sa largeur, affiche « Validation… » et reste désactivé. |
| **Erreur** | Sur une surface opaque (jamais sur le verre) : icône d'alerte, « Le service ne répond pas. Réessayez dans un instant. », bouton secondaire « Réessayer ». Dans le chatbot, un message non envoyé garde son texte, et « Réessayer l'envoi » apparaît sous la bulle. | Bandeau opaque en haut du panneau concerné : filet gauche `--danger`, message, bouton « Réessayer ». Les données déjà affichées restent visibles. |
| **Ticket suspect** | **Rien de visible pour le client.** On ne lui signale jamais une injection supposée. | Ligne `--row-suspect` avec l'icône bouclier, dans la file « Suspects » ; bandeau dans le détail ; passages retirés surlignés ; case de relecture obligatoire avant de valider (section 6.5). |
| **Délai proche de l'échéance** | À 2 jours ouvrés restants ou moins (valeur donnée par l'API) : la carte de suivi garde la date en champagne, et une ligne « Échéance dans 2 jours ouvrés » s'ajoute sous le rail, avec une icône horloge. Pas de rouge côté client : le client n'a rien à faire, on ne l'alarme pas. | Badge vermillon « Échéance proche » ; le ticket entre aussi dans la file « Échéance proche ». |
| **Échéance dépassée** | Rail plein. La ligne sous le rail devient « Échéance dépassée le jeudi 31 décembre 2026. Un conseiller traite votre demande. », avec icône et texte en `--text`. | Badge vermillon « Échéance dépassée » ; le ticket passe en tête de la file « À traiter ». |

**Statuts du client** (trois valeurs, fournies par l'API) : « Reçue », « En cours d'examen », « Répondue ». Chacun a une icône Phosphor (tray, hourglass, check) en plus du texte.

---

## 8. Mouvement

**Côté client, un seul moment animé : l'apparition de la carte de suivi**, au premier affichage de l'écran de suivi.

- La carte passe d'une opacité de 0 à 1, et monte de 12 px à 0. Durée : 420 ms, courbe `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Le remplissage du rail et la perle partent de la date de réception et vont jusqu'à leur position. Durée : 600 ms, départ 120 ms après la carte, même courbe.
- On n'anime que `opacity` et `transform`, jamais la largeur : le remplissage du rail est un `scaleX` avec `transform-origin: left`.
- L'animation joue une fois par ticket et par session. Revenir sur l'écran ne la rejoue pas.
- Elle est interruptible : un défilement ou un appui l'arrête à l'état final.

**Tout le reste est immobile.** Pas d'apparition au défilement, pas de parallaxe, pas de fond animé, pas de squelette qui scintille, pas de points de saisie animés.

**Retour d'interaction :** les changements d'état (survol, appui, focus) passent en fondu de couleur en 120 ms. Ce n'est pas une animation décorative : c'est un retour d'état, sans aucun déplacement ni changement d'échelle.

**Console :** aucune animation. Seul le fondu de couleur de 120 ms sur les états est autorisé.

**`prefers-reduced-motion: reduce` :** la carte de suivi apparaît directement à son état final, rail rempli, sans déplacement. Seul reste un fondu d'opacité de 150 ms. Les fondus de couleur des états sont conservés.

---

## 9. Ton des textes

- **Vouvoiement**, partout, sans exception.
- **Phrases courtes** : une idée par phrase, 20 mots au plus.
- **Boutons à verbe d'action**, sans flèche ni ponctuation : « Écrire au support », « Envoyer », « Suivre ma demande », « Réessayer », « Valider le brouillon », « Modifier », « Rejeter ». Jamais « OK », « Continuer → » ou « En savoir plus ».
- **Jamais de promesse d'argent** : pas de remboursement, de dédommagement, de geste commercial, de montant. La garde de sortie des brouillons applique déjà cette règle (`src/output_guard.py`), et l'interface la respecte aussi.
- **Jamais de délai qui ne vient pas du code** : pas de « sous 24 h », « rapidement » ou « très vite ». Une date affichée vient toujours de l'API, qui la calcule dans `src/deadlines.py`. Elle s'écrit comme dans les brouillons : jour, quantième, mois et année en toutes lettres (« jeudi 31 décembre 2026 ») côté client, en format court `31/12` dans le tableau de la console.
- **Libellés en casse de phrase** : « Échéance proche », jamais « ÉCHÉANCE PROCHE ».
- **Messages d'erreur** : ce qui se passe, puis ce qu'il faut faire. « Le service ne répond pas. Réessayez dans un instant. »
- **Côté client, pas de jargon interne** : on n'affiche ni `sous_motif`, ni « fiche », ni « garde ». Côté console, on affiche les valeurs exactes du schéma (`carte_refusee`), car le conseiller les corrige.

| Code interne (`cas`) | Libellé client |
|---|---|
| `reclamation` | Réclamation |
| `operation_non_autorisee` | Opération non autorisée |
| `signalement` | Signalement |
| `question` | Question |

---

## 10. Écran pilote : suivi de ticket, sur mobile

C'est ce que la prochaine PR construit en premier, et rien d'autre.

**Pourquoi celui-ci :** il porte l'élément signature, il affiche des dates calculées par le code, et il ne dépend pas encore du chatbot.

**Périmètre :**

1. Le squelette Vite + React + TypeScript + Tailwind dans `site/`, avec les tokens de la section 2 sous forme de variables CSS reliées à Tailwind, et Manrope auto-hébergée.
2. Les composants `FondVivant`, `SurfaceVerre` (avec ses trois replis), `BarreNavigation`, `CarteSuivi` (le rail, la perle, les jalons, le liseré) et `EtatChargement`, `EtatErreur`.
3. L'écran `/suivi/:reference` avec ses états : chargement, chargé, erreur, échéance proche, échéance dépassée, deux échéances (réclamation).
4. **Les données viennent d'un fichier de maquette JSON**, qui a exactement la forme du contrat ci-dessous. L'API FastAPI est une PR à part.

**Contrat de données** (tout vient de l'API ; le front ne calcule ni date, ni jours ouvrés) :

| Champ | Exemple |
|---|---|
| `reference` | `"VLT-2026-004127"` |
| `cas` | `"reclamation"` |
| `statut` | `"en_cours"` (`recue`, `en_cours`, `repondue`) |
| `recu_le` | `{ "iso": "2026-11-02", "texte": "lundi 2 novembre 2026" }` |
| `echeances` | `[{ "kind": "accuse_reception", "iso": "2026-11-16", "texte": "lundi 16 novembre 2026", "atteinte": true }, { "kind": "reponse", "iso": "2026-12-31", "texte": "jeudi 31 décembre 2026", "atteinte": false }]` |
| `progression` | `0.42` (jours ouvrés écoulés / jours ouvrés totaux, calculé par `src/deadlines.py`) |
| `jours_ouvres_restants` | `31` |

**Logo :** le SVG n'existe pas encore. Pour le pilote, la barre affiche le mot « VAULT » en Manrope 700, 17 px, approche de +0,02 em, en `--text`, sans le symbole. Le remplacer par le SVG est une tâche à part, une fois le vecteur livré.

**Critères d'acceptation :**

- À 375 px et à 320 px : aucun défilement horizontal, cibles de 44 px au moins.
- Contrastes de la section 2.2 vérifiés dans le navigateur, sur les deux thèmes, avec le halo à sa valeur maximale.
- Le repli opaque s'active avec la transparence réduite, avec un navigateur sans `backdrop-filter` et en contraste élevé.
- Avec `prefers-reduced-motion`, la carte apparaît sans déplacement.
- `dangerouslySetInnerHTML` est absent du code : une règle ESLint `react/no-danger` en erreur le vérifie.
- Aucune date n'est calculée côté front : les tests du composant n'utilisent que les champs du contrat.

---

## 11. Garde-fous

**À faire :**

1. Un seul bouton principal par écran.
2. Le verre uniquement dans les trois usages de la section 4.1, et toujours sur le fond vivant.
3. La date légale, et elle seule, en champagne.
4. Chaque couleur de sens (vermillon) accompagnée d'une icône et d'un texte.
5. Toutes les couleurs passent par les variables de la section 2.
6. Chiffres tabulaires pour les dates et les références.
7. Le texte d'un ticket rendu comme texte, les passages retirés rendus en segments.
8. Tester les deux thèmes et les trois replis du verre avant chaque fusion de front.

**À ne jamais faire** (les clichés visés par le brief, plus ceux qu'on repère dans les références) :

1. Des libellés en capitales, ou avec une approche élargie.
2. Des cartes identiques en grille, pour les demandes, les compteurs ou les actions : on utilise des listes et des lignes.
3. Des flèches dans les boutons (« Continuer → »).
4. Un noir teinté à la place du noir : le fond est abysse, une couleur du logo ; le noir pur ne sert qu'aux ombres et aux voiles.
5. Du verre sur du verre, sur un formulaire, sur un texte long ou dans la console.
6. Des dégradés, sauf le liseré de la carte de suivi.
7. Des montants, des avatars photo, de la crypto ou des logos de vraies marques.
8. Un délai écrit en dur, ou calculé dans le front.
9. Une animation autre que l'apparition de la carte de suivi.
10. Des émojis à la place d'icônes.

---

## 12. Révisions

Le plan de départ, relu contre le brief. Chaque choix qui ressemblait à un réflexe par défaut a été remplacé :

| # | Plan de départ | Décision | Pourquoi |
|---|---|---|---|
| 1 | IBM Plex Sans, proposée par ui-ux-pro-max pour une banque | **Manrope** | Plex est une linéale humaniste « corporate » : ses formes contredisent les capitales larges et géométriques du mot-symbole. Manrope les prolonge et a des chiffres tabulaires. |
| 2 | Inter pour le corps | **Aucune seconde famille** | Inter est le choix par défaut de toute interface générée. Une seule famille suffit, et le logo est un fichier, pas une police. |
| 3 | Or sur les montants et les chiffres clés, comme dans les références | **Champagne réservé à la date légale** | Le brief place l'audace sur le délai légal. Dans les références, l'or met l'argent en valeur, ce que le support ne fait jamais. |
| 4 | Verre sur toutes les surfaces client, comme dans les références 01 et 07 | **Verre limité à 3 usages** | Dans les références, tout est en verre et plus rien ne ressort. La carte de suivi ne se détache que si le reste est calme. |
| 5 | Texte en « noir doux » `#0B0F1A` | **Abysse, la couleur du logo** | Un noir teinté inventé est un cliché. Abysse est mesurée sur le logo ; le noir pur reste pour les ombres. |
| 6 | Glacier comme couleur de texte et de lien sur le verre sombre | **Blanc seulement sur le verre sombre** | Contraste mesuré à 2,90:1 : échec AA. |
| 7 | Anneau de progression circulaire autour de la date | **Rail horizontal avec une perle de verre** | L'anneau est le motif par défaut des tableaux de bord. Le rail reprend la perle de la référence 01 et la goutte du logo, et montre les deux échéances d'une réclamation. |
| 8 | Petit titre en capitales « STATUT » au-dessus de chaque bloc | **Casse de phrase, sans petit titre** | Cliché cité par le brief. |
| 9 | Squelettes qui scintillent et trois points animés dans le chatbot | **Squelettes statiques et « VAULT rédige… »** | Le brief ne permet qu'un seul moment animé côté client. |
| 10 | Trois cartes de statistiques en haut de la console | **Compteurs dans la barre latérale** | Des cartes identiques sont un cliché, et un compteur à côté de sa file dit la même chose en une ligne. |
| 11 | Boutons « Continuer → » et « Voir le détail → » | **Verbes d'action sans flèche** | Cliché cité par le brief. |
| 12 | Polices depuis Google Fonts | **Manrope auto-hébergée** | Tout tourne en local ; aucune requête externe. |
| 13 | Halo de fond animé en lente dérive | **Fond vivant statique** | Une animation décorative de plus, et un flou recalculé en permanence. |
| 14 | Bandeau « Ticket suspect » visible par le client | **Rien côté client** | Accuser un client d'injection n'est ni utile, ni sûr. |

Note sur les clichés : les deux skills autorisés (web-design et ui-ux-pro-max) ne contiennent pas de liste de clichés formelle. La liste de la section 11 reprend les quatre exemples du brief, les anti-modèles d'ui-ux-pro-max (émojis, couleur seule, dégradés « IA ») et les défauts repérés dans les références.
