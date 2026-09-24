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
| Matière | **le verre est le langage de tout élément interactif** (boutons, chips, champs, bulles, pastilles, cartes, curseur) ; seuls les textes longs restent sur une surface calme | surfaces opaques, filets fins, zéro verre |
| Thème par défaut | sombre (fond abysse, comme toutes les références) | clair (journées de travail longues) |
| Autre thème | clair, suit `prefers-color-scheme` | sombre, suit `prefers-color-scheme` |
| Densité | aérée : cibles de 44 px minimum, gouttière de 20 px | dense : lignes de tableau de 40 px, texte de 13 px |
| Audace | des gouttes, pas des plaques : du verre épais comme de l'eau, lumière sur les bords | aucune |

**Élément signature : le bloc du délai.** La date légale dans une grande pilule de verre, comme le montant de la réf. 05 « Send Money », en glace et en graisse fine. Dessous, le rail du délai est un tube de verre où roule une bille (réf. 01 « Daily Limit »). Les étapes suivent en capsules empilées (réf. 03). Toutes les pièces sortent d'un seul composant, `Glass` (section 4.3), montré à côté des références sur la page `/specimen` (section 4.6).

Niveau d'interaction (skill web-design) : **L1**, statique et soigné. Une seule animation côté client, aucune côté console (section 8).

---

## 1. Références

Fichiers : `docs/design/refs/` (7 écrans) et `docs/design/logo/vault-logo-planche.jpg` (planche du logo). Ces images ont été générées par Gemini. Elles contiennent du texte déformé, des effets de verre impossibles en CSS et des contenus hors sujet (crypto, montants). On en prend les principes, pas les défauts.

| Fichier | Ce qu'on retient | Ce qu'on rejette |
|---|---|---|
| `ref-01-centre-de-controle.jpg` | Le fond navy en dégradé avec un vignettage doux. La **perle de verre** du curseur « Daily Limit », qui devient la perle du rail de la carte de suivi. Le reflet fin sur le bord haut des pilules. | Tout en verre : plus aucune hiérarchie. Des libellés gris de 11 px sur le verre, illisibles. Une grille de tuiles identiques. Les devises et le bitcoin. |
| `ref-02-chat-support.jpg` | Les bulles du bot en verre, avec le symbole du logo. Les suggestions en pilules sous la conversation. Le champ de saisie en capsule. L'en-tête avec le logo centré. | Le texte déformé (« I smoke your message »). Les bulles imbriquées dans d'autres bulles. La lueur dorée *dans* le verre, impossible en CSS. Des bulles utilisateur trop proches de celles du bot. Des pilules qui débordent de l'écran. Un bouton d'envoi en forme de goutte, qui détourne le logo. |
| `ref-03-notifications.jpg` | La preuve que le verre n'existe que sur un **fond vivant** : les pilules ne sont belles que sur le bokeh de la ville. L'horodatage discret en haut à droite. | Un titre doré de 28 px sur le verre clair : contraste insuffisant, et plus d'or du tout. Les montants (« €1,200.00 ») : le support n'en affiche jamais. Les photos de personnes. Les pilules hors du cadre. Les fautes (« Monnday »). |
| `ref-04-cartes.jpg` | Le **liseré bicolore** sur le bord des cartes : c'est le bord de la goutte du logo, repris par le liseré de tout le verre (section 4.3). On garde le bleu et on remplace l'or par la glace. Les lignes pleine largeur avec une icône dans un cercle. | Les cartes irisées empilées, avec du violet absent du logo. La perspective 3D. Le métal brossé. Les numéros de carte. |
| `ref-05-envoi.jpg` | **Une seule grande valeur centrée dans une capsule de verre** : on garde la mise en scène, mais la valeur devient la date légale au lieu d'un montant. L'action principale en capsule pleine largeur, en bas. Le champ de sélection opaque, qui confirme que les formulaires sont opaques. | Les décimales dorées : de la mise en valeur d'argent. Le pictogramme Face ID. Les avatars photo. |
| `ref-06-detail-transaction.jpg` | Une carte principale qui porte les faits clés, avec des petites icônes alignées sur une colonne. | La vue isométrique inclinée. La carte géographique. Le logo Apple (une vraie marque). Les montants en double. Des bords de verre de 12 px d'épaisseur, impossibles à rendre. |
| `ref-07-accueil-solde.jpg` | La barre d'onglets en verre, avec l'onglet actif dans une perle. Les lignes de liste opaques à filet fin : du calme. Un petit libellé en casse de phrase au-dessus du grand chiffre. | Les décimales dorées. La crypto. La grille de 4 boutons identiques. Les pilules géantes « Pay » et « More » posées hors du téléphone, pour la décoration. |
| `logo/vault-logo-planche.jpg` | **La palette, mesurée au pixel** (section 2). Le mot-symbole en capitales larges et géométriques. Le symbole goutte + V. Les deux déclinaisons, sur fond sombre et sur fond clair. | Le logo est une **image JPEG, pas un vecteur** : il faut une version SVG avant la mise en ligne (section 10). La goutte en verre 3D est illisible sous 32 px : il faut aussi une version plate monochrome. Sur le panneau central, le « VAULT » blanc a un contour biseauté parasite. |


### 1.1 Cinq traits à reprendre par référence

Relevés le 2026-09-24 en rouvrant chaque image, avec des pixels mesurés quand un trait est une couleur. Le pilote s'en sert comme d'une grille de critique : chaque capture est posée à côté de la référence la plus proche (`docs/design/captures/pilote/comparaisons/`).

| Référence | Cinq traits |
|---|---|
| **01, centre de contrôle** | 1. Le fond va d'un marine `#091028` en bas à gauche à une ardoise claire `#4E6271` en haut à droite : c'est ce fond lumineux qui rend le verre visible. 2. Les capsules ont un bord épais et lumineux, plus blanc en haut, bleuté à gauche. 3. Le curseur « Daily Limit » est un **tube de verre** dans lequel roule une **bille** avec un point de lumière en haut à gauche. 4. Le verre « actif » (Freeze Card) s'entoure d'une lueur glacier `#86C7DC`. 5. Les libellés sont en graisse régulière, blanc cassé, sans capitales. |
| **02, chat** | 1. Le bord des bulles est un liseré glacé `#C6E6F3`. 2. Un reflet blanc épais épouse le bord haut de chaque bulle. 3. Le corps de la bulle reste sombre et transparent : la lumière est sur les bords. 4. Le logo centré dans l'en-tête, suivi du nom en graisse régulière. 5. Les suggestions sont des capsules plus petites, de même matière. |
| **03, notifications** | 1. Le verre bombé : un croissant clair en haut, un bord bas éclairé par réfraction. 2. L'ombre portée est profonde et floue, et laisse voir le fond sous l'objet. 3. Les objets de verre flottent au-dessus des objets opaques, plus plats et plus sombres. 4. L'horodatage est discret, en `--text-2`, aligné en haut à droite. 5. Le grand chiffre de l'heure est en graisse légère, pas en gras. |
| **04, cartes** | 1. Le liseré bicolore d'une carte : bleu d'un côté, clair de l'autre. 2. Une vague de lumière diagonale traverse le verre. 3. Les rangées de contrôle sont des capsules pleine largeur, avec une icône dans un cercle de verre. 4. Le titre de section « Card Controls » est en 20 px régulier, sans petit titre en capitales. 5. L'intérieur des cartes garde la couleur du fond derrière. |
| **05, envoi** | 1. **Une grande valeur centrée dans une capsule de verre épaisse**, avec un reflet `#E3F6F9` sur le bord haut. 2. Le champ opaque « Euro Account » : un fond sombre, un filet clair, un reflet d'1 px en haut. 3. Le titre de l'écran est centré, en `--text-2` régulier. 4. Des marges latérales régulières d'environ 16 à 20 px. 5. L'action principale en capsule pleine largeur, en bas. |
| **06, détail** | 1. Une carte principale qui porte les faits clés, avec des icônes alignées en colonne. 2. Des bords de verre très lumineux sur les quatre côtés. 3. L'intérieur est sombre et lisible : du texte blanc sur un verre teinté par le fond. 4. Une hiérarchie en trois niveaux : titre, grande valeur, puis métadonnées en `--text-2`. 5. Les boutons secondaires sont des capsules de verre plus petites, sous la carte. |
| **07, accueil** | 1. Un petit libellé gris au-dessus du grand chiffre. 2. Des lignes de liste opaques, arrondies, avec un filet clair : du calme sous le verre. 3. Le logo et son mot, centrés en haut, sans barre visible. 4. La barre d'onglets en verre, avec l'onglet actif dans une perle. 5. Une densité régulière : des blocs de 56 à 64 px séparés de 12 px. |

**Direction d'Oscar (2026-09-24, troisième itération), qui prime sur le tableau :**

1. **Des gouttes, pas des plaques.** Pilules à rayon complet pour les boutons, chips et champs ; cartes à grand rayon. Du volume visible, comme de l'eau épaisse.
2. **La lumière sur les bords.** Croissant blanc flou le long du bord haut, liseré bleuté à gauche, liseré nacré à droite, bord bas légèrement éclairé, halo externe doux. Le centre reste sombre et transparent.
3. **Le fond.** Dégradé vertical marine profond dans l'écran. En desktop, l'écran mobile est posé au centre, sur le dégradé ardoise des références.
4. **Une typographie légère.** Grands chiffres et dates en graisse fine, titres en graisse régulière.
5. **Des pastilles rondes en verre** pour les icônes.
6. **Le curseur « Daily Limit »** : tube de verre et bille, pour le rail du délai.
7. **Pas d'or.** Tout reflet ou chiffre doré des références devient blanc nacré (`#EAF5F2`, mesuré sur la goutte du logo) ou glacier.

Ce qu'on **ne** reprend **pas**, en plus du tableau ci-dessus : l'or et le champagne (montants, « Security Alert », décimales). Ils mettent l'argent en valeur, et le client n'en veut pas (décision d'Oscar du 2026-09-24, section 12).

---

## 2. Tokens

### 2.1 Couleurs

Six couleurs nommées, plus le blanc et le noir purs. Chaque couleur a une valeur par thème. Les quatre premières sont mesurées sur la planche du logo (moyenne de zone, ou pixels les plus saturés de la goutte). La glace est mesurée sur les références et le logo. Le vermillon vient du brief : états d'erreur et tickets suspects.

| Nom | Sombre | Clair | Origine | Rôle |
|---|---|---|---|---|
| **abysse** | `#050A22` | `#050A22` | fond du logo, panneau gauche, en bas | fond sombre ; **texte principal en thème clair** |
| **ardoise** | `#15253E` | `#15253E` | fond du logo, panneau gauche, en haut | surfaces opaques sombres, repli du verre, console sombre |
| **givre** | `#E8F3F7` | `#E8F3F7` | panneau clair de la planche | fond clair (client et console) |
| **glacier** | `#46B3DB` | `#296788` (glacier profond) | bleu de la goutte (pixels saturés, moyenne) | action principale, lien, focus, bulle du client, remplissage du rail |
| **glace** | `#C6E6F3` | `#174A63` (glace profonde) | liseré des bulles de verre (réf. 02, `#C6E6F3`) et reflets clairs de la goutte du logo (`#EAF5F2`, `#48CFEF`) ; la version profonde garde la teinte (≈ 200°), assombrie pour le AA | **uniquement** la date légale, le liseré de la carte de suivi et la bille du rail |
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
| `--legal` | glace `#C6E6F3` | glace profonde `#174A63` |
| `--danger` | vermillon `#FF8A80` | vermillon `#C4303A` |
| `--line` (filet décoratif) | blanc à 10 % | ardoise à 14 % |
| `--line-strong` (bord de champ, 3:1) | blanc à 35 % (`#677182` sur ardoise) | ardoise à 50 % (`#8A929E`) |
| `--row-selected` (console) | glacier à 18 % sur ardoise (`#1E3F5A`) | glacier à 14 % sur blanc (`#E5F4FA`) |
| `--row-suspect` (console) | vermillon à 12 % sur ardoise (`#313146`) | vermillon à 8 % sur blanc (`#FAEEEF`) |

Chaque couleur a aussi sa version `-rgb` (par exemple `--accent-rgb: 70 179 219`), pour les `rgba()`.

**Règles de couleur :**

- Le glacier ne sert jamais de texte sur le verre sombre (2,9:1 mesuré) : on utilise le blanc.
- La glace colore la date légale ; en transparence, elle sert aussi aux reflets du verre (bord bas, épaisseur) et au corps de la bille. Jamais sur un bouton, un montant ou un titre.
- **Aucun or, aucun champagne**, nulle part (décision d'Oscar du 2026-09-24).
- Le vermillon est toujours accompagné d'une icône et d'un texte. La couleur seule ne porte jamais un sens.
- Aucune couleur n'est écrite en dur dans un composant : on passe toujours par les variables.

### 2.2 Contrastes vérifiés (WCAG 2.1, seuil AA = 4,5:1 pour le texte, 3:1 pour les grands textes et les éléments d'interface)

**Hypothèse du pire cas pour le verre.** On prend la zone la plus claire du fond vivant, le halo glacier à son opacité maximale, puis on compose le remplissage du verre par-dessus. Le flou ne peut qu'adoucir ce fond : la valeur réelle est égale ou meilleure.

| Paire | Ratio | Verdict |
|---|---|---|
| Blanc sur verre sombre (halo 30 %, remplissage 10 % → `#3A617C`) | **6,60** | AA |
| Blanc à 80 % sur verre sombre | **4,91** | AA |
| Glace sur verre sombre (mesurée dans le navigateur, pire pixel sous la date) | **7,62** | AAA |
| Glacier sur verre sombre | 2,90 | **interdit comme texte** |
| Vermillon clair sur verre sombre | 2,89 | **interdit** : les erreurs vont sur une surface opaque |
| Abysse sur verre clair (halo 40 %, remplissage 60 % → `#D7EEF6`) | **16,29** | AAA |
| Abysse à 72 % sur verre clair | **7,43** | AAA |
| Glacier profond sur verre clair | **5,16** | AA |
| Glace profonde sur verre clair (mesurée, pire pixel) | **9,03** | AAA |
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

**Mesure dans le navigateur (pilote, 2026-09-24, verre partout).** Les contrastes sont vérifiés sur les captures elles-mêmes. On masque le texte de l'écran, on lit les pixels du verre sous chaque ligne visible, et on garde le pire pixel. Pires valeurs, tous états confondus :

- **Thème sombre :** texte principal 4,90, secondaire 5,09, date 4,61.
- **Thème clair :** texte principal 12,39, secondaire 7,61, date 8,65.

Le verre sombre est la zone la plus serrée : plus il est lumineux, plus il ressemble aux références, et moins le texte blanc contraste. Trois réglages l'ont ramené au-dessus de 4,5 :

- le texte secondaire sur verre passe à 86 % de blanc ;
- la caustique et le volume bas sont limités à 12 % et 10 % ;
- une capsule de trois lignes met toute sa phrase en blanc plein, sans détail secondaire.

Toute nouvelle valeur de `--g-*` se mesure de la même façon avant fusion.

### 2.3 Rayons

| Token | Valeur | Usage |
|---|---|---|
| `--r-signature` | 32 px | forme `carte` de `Glass` |
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
| Marge intérieure de la grande pilule de la date | 24 px en vertical, 40 px en horizontal |
| Écart entre deux blocs d'un écran client | 32 px |
| Gouttière de la console | 24 px |
| Ligne de tableau de la console | 40 px de haut, 12 px en horizontal |
| Largeur de la barre latérale de la console | 232 px |
| Cible tactile minimale | 44 × 44 px, 8 px entre deux cibles |

### 2.5 Ombres

L'ombre est toujours du noir pur à faible opacité, jamais une couleur teintée. La seule exception est le halo glacier du verre (`--g-halo`), qui est une lumière, pas une ombre.

| Token | Valeur | Usage |
|---|---|---|
| `--g-halo`, `--g-ombre` | voir 2.6 | tout le verre client |
| surface calme client | filet `--surface-bord` + reflet intérieur d'1 px en haut, sans ombre | textes longs : « Ce qui va se passer », feuille du médiateur, message d'erreur (réf. 05) |
| `--shadow-pop` | `0 4px 16px rgba(0,0,0,.12)` | popovers et menus de la console, seulement |
| aucune | | panneaux, tableaux, cartes de la console : un filet `--line` suffit |

### 2.6 Verre

Jetons de `site/src/composants/glass.css`, lus par le composant `Glass` (section 4.3). Les bords et reflets sont en pixels : une pilule de 44 px et une carte de 200 px ont le même bord.

| Jeton | Sombre | Clair | Couche |
|---|---|---|---|
| `--g-corps` | blanc à 11 % | blanc à 42 % | corps laiteux, translucide |
| `--g-centre` | abysse à 7 % | transparent | le centre reste sombre |
| `--g-volume-haut` / `--g-volume-bas` | blanc 12 % / glace 10 % | blanc 35 % / 30 % | volume : le verre s'épaissit vers le bas |
| `--g-teinte-g` / `--g-teinte-d` | glacier 20 % / nacre 16 % | glacier 16 % / nacre 30 % | teinte des bouts : bleuté à gauche, nacré à droite |
| `--g-caustique` | blanc 12 % | blanc 50 % | vague claire en bas à droite |
| `--g-eclat` | blanc 60 % | blanc 80 % | trait spéculaire fin en haut à droite |
| `--g-saturation`, `--g-lumiere` | 130 %, 1,06 | 150 %, 1,04 | le fond saturé et éclairé à travers le verre |
| `--g-bord-haut` | blanc 55 % | blanc 100 % | reflet spéculaire du bord haut (1 px, puis 7 px flous) |
| `--g-bord-bas` | blanc 70 % | blanc 90 % | bord bas éclairé |
| `--g-epaisseur` | glace 34 % | blanc 70 % | bande floue de 5 px le long du bord : l'épaisseur |
| `--g-lueur-g` / `--g-lueur-d` | glacier 80 % / nacre 60 % | glacier 55 % / blanc 90 % | ombres intérieures latérales |
| `--g-refraction` | glace 45 % | blanc 80 % | lumière réfractée sur le bas |
| `--g-lisere-*` | haut blanc 60 %, bas glace 55 %, gauche glacier 80 %, droite nacre 70 % | blancs, gauche glacier 80 % | liseré dégradé de 1 px |
| `--g-croissant` | blanc 34 % | blanc 95 % | croissant flou sous le bord haut |
| `--g-halo` / `--g-ombre` | glacier 35 % / noir 55 % | glacier 35 % / ardoise 30 % | halo externe doux et ombre portée |
| `--glass-fallback` | ardoise | blanc | repli opaque (section 4.4) |
| `--text-2-glass` | blanc 86 % | abysse 72 % | texte secondaire sur le verre |

Nacre : `--nacre-rgb: 234 245 242` (`#EAF5F2`), le point le plus clair de la goutte du logo. Elle remplace tout reflet doré des références.

---

## 3. Typographie

**Une seule famille : Manrope** (variable, graisses 200 à 800), auto-hébergée avec le paquet `@fontsource-variable/manrope`. Aucun appel à Google Fonts : tout tourne en local. Pile de secours : `Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`. Chargement en `font-display: swap`.

**Pourquoi Manrope, face au logo :**

- Le mot-symbole VAULT est une linéale géométrique large : un V ouvert, un U rond, un A à sommet plat. Manrope partage ces proportions larges et ces terminaisons droites. Le texte prolonge donc le logo au lieu de le contredire.
- Elle a des **chiffres tabulaires** (`font-variant-numeric: tabular-nums`) : les dates et les références ne bougent pas d'une ligne à l'autre.
- Elle reste lisible à 13 px, dans la console dense.
- ui-ux-pro-max proposait IBM Plex Sans ; voir la section 12 pour le choix contraire.

Le mot « VAULT » est composé en Manrope 700 à côté de la goutte du logo (PNG détouré, section 10) tant que le SVG n'existe pas.

**Échelle, espace client** (tailles en px ; interlignage en px) :

| Rôle | Taille / interligne | Graisse | Approche | Usage |
|---|---|---|---|---|
| Date légale | 34 / 40 | **300** | −0,5 px | pilule de la date, seule |
| Titre d'écran | 28 / 34 | **400** | −0,3 px | « Votre demande » |
| Titre de bloc | 20 / 26 | **400** | 0 | « Étapes », « Ce qui va se passer » |
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
- **Typographie légère côté client** (réf. 03 et 05) : les grands chiffres et les dates sont en graisse fine (300), les titres en graisse régulière (400). Le 500 reste pour les libellés courts dans le verre.
- Chiffres tabulaires pour les références, les compteurs et les dates **en colonne** (tableaux de la console). Les dates **dans une phrase** et la date légale gardent les chiffres proportionnels : en tabulaire, le « 1 » laisse un vide visible (« jeudi 1 7 septembre »), relevé sur les captures du pilote.
- Deux graisses par écran au plus, en plus du corps en 400.
- Aucun dégradé ni ombre sur le texte (règle de décoration du texte du skill web-design : style sobre, donc aucun effet).
- Pas de texte sous 12 px. Le corps du client respecte le réglage de taille du système : les tailles sont exprimées en `rem`.

---

## 4. Le verre (client)

### 4.1 Où va le verre

**Côté client, le verre est le langage de tout élément interactif** : boutons, chips, champ de saisie, bulles du chat, pastilles d'icônes, cartes, curseur et tube du délai, ainsi que les capsules des étapes. Les pastilles et la bille sont posées sur une autre pièce de verre : c'est un seul objet (une capsule et son icône, un tube et sa bille), pas du verre empilé au hasard.

### 4.2 Où il ne va pas

- **Les textes longs** (plus de deux lignes à 390 px, hors capsule d'étape) : surface calme `.surface`, opaque, filet clair et reflet d'1 px (réf. 05). Exemples : « Ce qui va se passer », la feuille du médiateur, le message d'erreur.
- **La console conseiller** : aucun verre, rien ne change (sections 5.3, 6.4, 6.5).
- Le texte d'erreur lui-même, qui reste sur une surface calme ; seule l'action « Réessayer » est en verre.

### 4.3 Recette : le composant `Glass`

`site/src/composants/Glass.tsx` et `glass.css`. Une seule recette, six formes : `pilule` (rayon complet : boutons, chips, champs, capsules), `carte` (32 px), `bulle` (24 px), `pastille` (ronde, pour les icônes), `tube` (le rail) et `bille`. Le ton `accent` renforce le glacier dans le corps et le halo ; il est réservé à l'action principale de l'écran.

Les couches, du fond vers l'avant :

1. **Corps translucide** : `--g-corps`, avec `backdrop-filter: blur(16px) saturate(--g-saturation) brightness(--g-lumiere)`.
2. **Centre sombre** : une ellipse `--g-centre` au milieu. La lumière est sur les bords.
3. **Volume** : dégradé vertical `--g-volume-haut` → transparent → `--g-volume-bas`.
4. **Teinte des bouts** : `--g-teinte-g` (glacier) à gauche, `--g-teinte-d` (nacre) à droite.
5. **Caustique et éclat** : vague claire en bas à droite, trait spéculaire fin en haut à droite.
6. **Ombres intérieures** (`box-shadow` inset) : bord haut spéculaire, bande spéculaire floue de 7 px, bord bas éclairé, bande d'épaisseur de 5 px tout autour, lueur glacier à gauche, lueur nacrée à droite, réfraction en bas.
7. **Liseré dégradé** (`::before`, 1 px, masque `exclude`) : blanc en haut, glace en bas, glacier à gauche, nacre à droite.
8. **Croissant** (`::after`) : un dôme blanc flou sous le bord haut, plus fort à gauche, sans bord net.
9. **Halo et ombre** : `0 0 24px -6px --g-halo` et `0 16px 32px -10px --g-ombre`.

Le verre est rogné (`overflow: clip`) : le croissant ne dépasse jamais aux bouts arrondis. La **bille** a sa propre recette (sphère) : point de lumière en haut à gauche, bord plus clair, lumière réfractée en bas, flou de 3 px.

Interaction : fondu de fond de 120 ms au survol et à l'appui, sans déplacement ni changement d'échelle (section 8). Le focus clavier reste l'anneau `--accent` de 2 px.

### 4.4 Replis

- **Transparence réduite** (`prefers-reduced-transparency: reduce`) : `--glass-fallback` opaque, sans flou ni croissant, avec un filet.
- **Contraste élevé** (`prefers-contrast: more`) : `--glass-fallback`, filet `--line-strong`, ni liseré ni croissant ; le texte secondaire passe à 100 %.
- **Navigateur sans `backdrop-filter`** : `--glass-fallback`.

Ces trois préférences ne sont pas émulables par agent-browser : elles sont écrites, mais n'ont pas été vues rendues (à vérifier sur un appareil).

### 4.5 Fonds

- **L'écran** (`.ecran`) : dégradé vertical marine, mesuré sur les références (`#1E3045` en haut, `#0E1830` à 38 %, `#070D22` en bas), avec un halo glacier à 16 % centré en haut. En clair : blanc, givre, puis `#D6E8F0`.
- **Le bureau** (desktop, à partir de 640 px) : l'écran mobile de 390 × 844 px est posé au centre, avec un rayon de 52 px, un cadre de 9 px (`--bezel`) et son propre défilement, sur le dégradé ardoise des références (`#4E6271` → `#1E3045` → `#091028`).
- **L'en-tête** n'a aucune barre visible : la goutte et le mot VAULT au centre, le retour dans une pastille de verre, un simple flou pour ce qui défile dessous.

### 4.6 Spécimen

La page **`/specimen`** montre chaque variante de `Glass` à côté du recadrage de la référence qui l'inspire (`site/public/specimen/`) : pilule (réf. 07, Pay), grande valeur (réf. 05), carte (réf. 04), bulle (réf. 02), pastille (réf. 07), chips et champ (réf. 02), tube et bille (réf. 01), capsules empilées (réf. 03). Toute modification de `glass.css` se juge d'abord sur cette page, avant les écrans. Les passes sont archivées dans `docs/design/captures/pilote/specimen/`.

---

## 5. Composants

Tous les éléments interactifs ont cinq états : repos, survol, appui, focus, désactivé. Le focus est un anneau de 2 px en `--accent`, décalé de 2 px, visible au clavier seulement (`:focus-visible`).

### 5.1 Client

Tout élément interactif est un `Glass` (section 4.3). Cible tactile de 44 px au moins.

| Composant | Forme | Détail |
|---|---|---|
| **Action principale** (une par écran) | `pilule`, ton `accent`, 56 px, pleine largeur | icône Phosphor à gauche, libellé 15/500 : « Écrire au support » |
| **Action secondaire** | `pilule`, 48 px | « Saisir le médiateur », « Réessayer », « Fermer » |
| **Retour** | `pastille`, 44 px | chevron, `aria-label="Retour"` |
| **Pastille d'icône** | `pastille`, 44 à 48 px | icône Phosphor de 20 px au centre |
| **Suggestion** (chatbot) | `pilule`, 40 px | 15/400 |
| **Champ de saisie** | `pilule`, 48 px, avec une `pastille` d'envoi en ton `accent` | le bouton d'envoi est rond, pas en goutte |
| **Bulle du bot** | `bulle`, 80 % de la largeur au plus | goutte du logo de 20 px et « VAULT » en `--text-2` |
| **Bulle du client** | surface glacier opaque, texte abysse | inchangée |
| **Carte** | `carte`, rayon 32 px | pour un résumé cliquable |
| **Ligne de demande** (accueil) | `pilule` avec pastille | comme les étapes du suivi |

### 5.2 Bloc du délai (signature)

De haut en bas :

1. **La date dans une grande pilule** (réf. 05) : « Réponse au plus tard le » en 15/400 `--text-2`, puis la date légale en 34/300 `--legal` (glace), sur deux lignes voulues, « jeudi 31 » et « décembre 2026 ». Le tout est centré.
2. **Le nom du repère intermédiaire**, au-dessus du tube : « Accusé de réception, 17 nov. », aligné sur l'anneau.
3. **Le tube** (réf. 01) : un `Glass` de forme `tube`, 48 px. Il contient :
   - un canal de 8 px, dont la partie parcourue est remplie en glacier par un `scaleX` ;
   - l'anneau de l'accusé, de 10 px, plein si l'API donne `envoye_le` ;
   - la **bille** de 44 px à la position `progression`. Elle roule entre 22 px du bord gauche et 22 px du bord droit.
4. Sous le tube, en 13/500 : « Reçue le 2 nov. » et « Échéance 31 déc. ».
5. **Les étapes, en capsules empilées** (réf. 03), sous le titre « Étapes ». Chaque capsule est une `pilule` avec sa `pastille` d'icône, un titre en 15/500 et un détail en 13/400. Dans l'ordre :
   - l'échéance proche ou dépassée, s'il y a lieu ;
   - l'accusé de réception ;
   - le statut, avec la date d'envoi de la réponse si elle existe.
6. **Actions en pilules** : « Saisir le médiateur » (échéance dépassée seulement), puis « Écrire au support » en action principale.

La référence du ticket passe sous le sous-titre, en 13/400 et chiffres tabulaires : « Réf. VLT-2026-004127 ».

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
│▓ Question · Réponse envoyée      ›▓│
│▓ Envoyée le lundi 12 octobre 2026▓│
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

Mobile (voir `docs/design/captures/pilote/`). `(…)` = pilule de verre, `(◯)` = pastille, `▓` = surface calme :

```
┌───────────────────────────────────┐
│ (‹)          ◈ VAULT              │  pastille retour, goutte + mot
│                                   │
│ Votre demande                     │  titre 28/400
│ Réclamation reçue le lundi        │  légende --text-2
│ 2 novembre 2026                   │
│ Réf. VLT-2026-004127              │
│                                   │
│ (     Réponse au plus tard le   ) │  grande pilule (réf. 05)
│ (          jeudi 31             ) │  date 34/300, glace
│ (        décembre 2026          ) │
│                                   │
│   Accusé de réception, 17 nov.    │  nom du repère
│ (━━━━━○━━━━━●───────────────────) │  tube, anneau, bille (réf. 01)
│ Reçue le 2 nov.  Échéance 31 déc. │
│                                   │
│ Étapes                            │  titre 20/400
│ ((◯) Accusé de réception envoyé ) │  capsules empilées (réf. 03)
│ (    le lundi 9 novembre 2026   ) │
│ ((◯) En cours d'examen          ) │
│                                   │
│ Ce qui va se passer               │
│ ▓ Un conseiller examine votre   ▓ │  surface calme (texte long)
│ ▓ réclamation et vous répond…   ▓ │
│                                   │
│ (      Écrire au support        ) │  pilule accent, icône bulle
└───────────────────────────────────┘
```

Desktop : le même écran de 390 × 844, posé au centre du bureau ardoise (section 4.5).

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
| **Chargement** | Squelettes **statiques**, sans scintillement : des blocs `--text` à 7 % qui ont la forme exacte du contenu, posés dans les vraies formes de verre (grande pilule, tube, deux capsules) : rien ne saute à l'arrivée. Réponse du bot en attente : une bulle de verre avec « VAULT rédige… » en `--text-2`, sans points animés. Le bouton d'envoi est désactivé pendant l'envoi. | Lignes squelettes statiques (5 lignes de 40 px). Un bouton en cours d'action garde sa largeur, affiche « Validation… » et reste désactivé. |
| **Erreur** | Sur une surface calme : icône d'alerte, « Le service ne répond pas. Réessayez dans un instant. », puis la pilule de verre « Réessayer ». Dans le chatbot, un message non envoyé garde son texte, et « Réessayer l'envoi » apparaît sous la bulle. | Bandeau opaque en haut du panneau concerné : filet gauche `--danger`, message, bouton « Réessayer ». Les données déjà affichées restent visibles. |
| **Ticket suspect** | **Rien de visible pour le client.** On ne lui signale jamais une injection supposée. | Ligne `--row-suspect` avec l'icône bouclier, dans la file « Suspects » ; bandeau dans le détail ; passages retirés surlignés ; case de relecture obligatoire avant de valider (section 6.5). |
| **Délai proche de l'échéance** | Quand l'API renvoie `delai: "proche"` (2 jours ouvrés restants ou moins) : la date reste en glace, et une capsule « Échéance dans 2 jours ouvrés », avec une pastille horloge, s'ajoute en tête des étapes. Avec 1 jour : « Échéance dans 1 jour ouvré » ; avec 0 : « Échéance aujourd'hui ». Pas de rouge côté client : le client n'a rien à faire, on ne l'alarme pas. | Badge vermillon « Échéance proche » ; le ticket entre aussi dans la file « Échéance proche ». |
| **Échéance dépassée** | Tube plein, bille au bout. Une capsule en tête des étapes dit, d'un seul tenant et en `--text` : « Échéance dépassée le jeudi 31 décembre 2026. Un conseiller traite votre demande. », avec une pastille d'alerte. Après « Ce qui va se passer » : « Vous pouvez aussi saisir le médiateur de VAULT. C'est gratuit. », puis la pilule « Saisir le médiateur » (voir ci-dessous). C'est le seul cas où cette action apparaît. | Badge vermillon « Échéance dépassée » ; le ticket passe en tête de la file « À traiter ». |

**Statuts du client** (trois valeurs, fournies par l'API) : « Reçue », « En cours d'examen », « Réponse envoyée ». Chacun a une icône Phosphor (tray, hourglass, check) en plus du texte.

**« Ce qui va se passer »** (surface opaque sous la carte), selon l'état. « votre réclamation » devient « votre demande » pour les autres cas.

| État | Texte |
|---|---|
| Reçue | « Votre réclamation est enregistrée. Un conseiller va l'examiner et vous répondra au plus tard à la date indiquée. » |
| En cours d'examen | « Un conseiller examine votre réclamation et vous répond au plus tard à la date indiquée. » |
| Échéance dépassée | « Un conseiller examine votre réclamation. Vous recevrez sa réponse par écrit. » (« au plus tard à la date indiquée » serait faux) |
| Réponse envoyée | « Notre réponse vous a été envoyée par écrit. Si votre situation n'est pas réglée, écrivez-nous. » |

**Jalons sous le rail :** l'accusé de réception s'affiche « Accusé de réception envoyé / le lundi 9 novembre 2026 » **seulement si l'API fournit `envoye_le`**. Sinon, même quand l'échéance de l'accusé est passée, il s'affiche « Accusé de réception / au plus tard le … », avec l'icône cercle vide. On n'affirme jamais un envoi que l'API ne confirme pas.

**Saisir le médiateur** (échéance dépassée seulement) : le bouton ouvre une feuille opaque, pas en verre, car c'est un texte long. Elle affiche, dans cet ordre :

1. le titre « Saisir le médiateur » ;
2. « Le médiateur examine gratuitement votre litige avec VAULT, de façon indépendante. Vous pouvez le saisir parce que le délai de réponse est dépassé. » ;
3. le nom et les coordonnées du médiateur, fournis par l'API (`mediateur.nom`, `mediateur.adresse`, `mediateur.site`), rendus comme du texte. Aucune coordonnée n'est écrite en dur dans le front ;
4. « Indiquez la référence de votre demande : VLT-… », avec la vraie référence ;
5. le bouton secondaire « Fermer ».

Aucun bouton de la feuille n’envoie quoi que ce soit : le client saisit le médiateur lui-même. La feuille apparaît sans animation (section 8), avec un voile `rgba(0,0,0,.48)` derrière elle.

---

## 8. Mouvement

**Côté client, un seul moment animé : l'apparition du bloc du délai** (pilule de la date et tube), au premier affichage de l'écran de suivi.

- Le bloc passe d'une opacité de 0 à 1, et monte de 12 px à 0. Durée : 420 ms, courbe `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Le remplissage du tube et la bille partent de la date de réception et vont jusqu'à leur position. Durée : 600 ms, départ 120 ms après la carte, même courbe.
- On n'anime que `opacity` et `transform`, jamais la largeur : le remplissage du rail est un `scaleX` avec `transform-origin: left`.
- L'animation joue une fois par ticket et par session. Revenir sur l'écran ne la rejoue pas.
- Elle est interruptible : un défilement ou un appui l'arrête à l'état final.

**Tout le reste est immobile.** Pas d'apparition au défilement, pas de parallaxe, pas de fond animé, pas de squelette qui scintille, pas de points de saisie animés.

**Retour d'interaction :** les changements d'état (survol, appui, focus) passent en fondu de couleur en 120 ms. Ce n'est pas une animation décorative : c'est un retour d'état, sans aucun déplacement ni changement d'échelle.

**Console :** aucune animation. Seul le fondu de couleur de 120 ms sur les états est autorisé.

**`prefers-reduced-motion: reduce` :** le bloc du délai apparaît directement à son état final, tube rempli, sans déplacement. Seul reste un fondu d'opacité de 150 ms. Les fondus de couleur des états sont conservés.

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
2. Les composants `Glass` (six formes, trois replis), `TubeDelai`, `Ecran` (écran et bureau), `BarreNavigation`, `Logo`, `VueSuivi` (bloc du délai, étapes, actions), `FeuilleMediateur`, `EtatChargement` et `EtatErreur`, plus la page `/specimen` (section 4.6).
3. L'écran `/suivi/:reference` avec ses états : chargement, chargé, erreur, échéance proche, échéance dépassée (avec la feuille « Saisir le médiateur »), deux échéances (réclamation). Pour la démo, `/suivi/demo-chargement` reste en chargement et `/suivi/demo-erreur` échoue.
4. **Les données viennent d'un fichier de maquette** (`site/src/api/maquettes.ts`, typé par `site/src/api/contrat.ts`), qui a exactement la forme du contrat ci-dessous. Ses dates ont été calculées avec `src/deadlines.py`. L'API FastAPI est une PR à part.

**Contrat de données** (tout vient de l'API ; le front ne calcule ni date, ni jours ouvrés) :

| Champ | Exemple |
|---|---|
| `reference` | `"VLT-2026-004127"` |
| `cas` | `"reclamation"` |
| `statut` | `"en_cours"` (`recue`, `en_cours`, `reponse_envoyee`) |
| `mediateur` | `{ "nom": "…", "adresse": "…", "site": "…" }` si `delai` vaut `"depasse"`, sinon `null` |
| `recu_le` | `{ "iso": "2026-11-02", "texte": "lundi 2 novembre 2026", "court": "2 nov." }` |
| `echeances` | `[{ "kind": "accuse_reception", "iso": "2026-11-17", "texte": "mardi 17 novembre 2026", "court": "17 nov.", "atteinte": true, "position": 0.244, "envoye_le": { "iso": "2026-11-09", "texte": "lundi 9 novembre 2026", "court": "9 nov." } }, { "kind": "reponse", "iso": "2026-12-31", "texte": "jeudi 31 décembre 2026", "court": "31 déc.", "atteinte": false, "position": 1, "envoye_le": null }]` |
| `progression` | `0.488` (jours ouvrés écoulés / jours ouvrés totaux, calculé par `src/deadlines.py`) |
| `jours_ouvres_restants` | `21` |
| `delai` | `"normal"`, `"proche"` (2 jours ouvrés ou moins) ou `"depasse"` : le seuil est appliqué par l'API, pas par le front |
| `reponse_envoyee_le` | `{ "iso", "texte", "court" }` quand le statut est `reponse_envoyee`, sinon `null` |

Ajouts du pilote, parce que le front ne peut rien calculer : `court` (le jalon du rail, « 2 nov. »), `position` (la place de l'anneau de l'accusé sur le rail), `envoye_le` (la date d'envoi réelle de l'accusé, `null` tant qu'elle n'est pas connue), `delai` (le seuil de 2 jours ouvrés reste côté API) et `reponse_envoyee_le` (la date d'envoi de la réponse). Les textes de date écrivent « 1er » pour le premier du mois.

**Logo :** le SVG n'existe pas encore. L'en-tête affiche la **goutte détourée** en PNG 2x (`site/public/marque/`) à côté du mot « VAULT » en Manrope 700, 17 px, approche +0,02 em.
- **Deux fichiers**, extraits de la planche du logo : `vault-goutte@2x.png` vient du panneau sombre (alpha additif, fond estimé par une surface quadratique) ; `vault-goutte-clair@2x.png` vient du panneau clair.
- **Sans or :** les tons chauds de la goutte y sont ramenés en nacre.
- **Outil :** `docs/design/logo/extraire_goutte.py` (numpy, scipy, Pillow ; ce n'est pas un outil du bot).
- Le SVG reste une tâche à part.

**Critères d'acceptation :**

- À 375 px et à 320 px : aucun défilement horizontal, cibles de 44 px au moins.
- Contrastes de la section 2.2 vérifiés dans le navigateur, sur les deux thèmes : mesurés sur les pixels réels du verre, sous chaque ligne de texte visible.
- Le repli opaque s'active avec la transparence réduite, avec un navigateur sans `backdrop-filter` et en contraste élevé.
- Avec `prefers-reduced-motion`, le bloc du délai apparaît sans déplacement.
- `dangerouslySetInnerHTML` est absent du code : une règle ESLint `react/no-danger` en erreur le vérifie (avec `innerHTML` et `outerHTML` interdits).
- Aucune date n'est calculée côté front : les tests du composant n'utilisent que les champs du contrat, et ESLint interdit l'objet global `Date` dans `site/`.
- Captures de référence : `docs/design/captures/pilote/`, à 390 × 844, dans les deux thèmes et pour chaque état ; chacune est posée à côté de la référence la plus proche dans `comparaisons/`.

---

## 11. Garde-fous

**À faire :**

1. Un seul bouton principal par écran.
2. Tout élément interactif du client en `Glass`, jamais en verre bricolé à la main ; les textes longs sur une surface calme.
3. La date légale, et elle seule parmi les textes, en glace, en graisse fine.
4. Chaque couleur de sens (vermillon) accompagnée d'une icône et d'un texte.
5. Toutes les couleurs passent par les variables de la section 2.
6. Chiffres tabulaires pour les références et les dates en colonne.
7. Le texte d'un ticket rendu comme texte, les passages retirés rendus en segments.
8. Tester les deux thèmes et les trois replis du verre avant chaque fusion de front, et juger toute retouche de `glass.css` sur `/specimen`.

**À ne jamais faire** (les clichés visés par le brief, plus ceux qu'on repère dans les références) :

1. Des libellés en capitales, ou avec une approche élargie.
2. Des cartes identiques en grille, pour les demandes, les compteurs ou les actions : on utilise des listes et des lignes.
3. Des flèches dans les boutons (« Continuer → »).
4. Un noir teinté à la place du noir : le fond est abysse, une couleur du logo ; le noir pur ne sert qu'aux ombres et aux voiles.
5. Du verre sur un texte long ou dans la console. Du verre posé sur du verre, sauf les pièces d'un même objet (pastille dans sa capsule, bille dans son tube).
6. Des dégradés, hors de deux endroits : les fonds (section 4.5) et la matière du verre (section 4.3).
7. Des montants, des avatars photo, de la crypto ou des logos de vraies marques.
8. Un délai écrit en dur, ou calculé dans le front.
9. Une animation autre que l'apparition du bloc du délai.
10. Des émojis à la place d'icônes.
11. De l'or ou du champagne, sous quelque forme que ce soit.
12. Des plaques : un bouton ou une carte à petits rayons, sans volume ni lumière sur les bords.

---

## 12. Révisions

Le plan de départ, relu contre le brief. Chaque choix qui ressemblait à un réflexe par défaut a été remplacé :

| # | Plan de départ | Décision | Pourquoi |
|---|---|---|---|
| 1 | IBM Plex Sans, proposée par ui-ux-pro-max pour une banque | **Manrope** | Plex est une linéale humaniste « corporate » : ses formes contredisent les capitales larges et géométriques du mot-symbole. Manrope les prolonge et a des chiffres tabulaires. |
| 2 | Inter pour le corps | **Aucune seconde famille** | Inter est le choix par défaut de toute interface générée. Une seule famille suffit, et le logo est un fichier, pas une police. |
| 3 | Or sur les montants et les chiffres clés, comme dans les références | **Champagne réservé à la date légale**, puis **glace** (décision d'Oscar ci-dessous) | Le brief place l'audace sur le délai légal. Dans les références, l'or met l'argent en valeur, ce que le support ne fait jamais. |
| 4 | Verre sur toutes les surfaces client, comme dans les références 01 et 07 | **Verre limité à 3 usages** (abandonné le 2026-09-24 : le verre devient le langage de tout élément interactif, voir plus bas) | Dans les références, tout est en verre et plus rien ne ressort. La carte de suivi ne se détache que si le reste est calme. |
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

**Décisions d'Oscar, 2026-09-24 :**

| Point | Décision |
|---|---|
| Statuts du client | « Reçue », « En cours d'examen », « Réponse envoyée » (au lieu de « Répondue », moins naturel) |
| Seuil « échéance proche » | 2 jours ouvrés restants, calculés par l'API |
| Échéance dépassée visible par le client | Oui, par honnêteté, avec une action : saisir le médiateur (section 7) |
| Champs calculés | Dates, progression et jours ouvrés restants viennent de l'API, jamais du front |
| Logo | SVG plus tard ; Manrope suffit pour le pilote |

**Décisions d'Oscar, 2026-09-24, après le premier pilote (PR #31) :**

| Point | Décision |
|---|---|
| Or | Plus aucun or ni champagne. La date légale passe en **glace** (`#C6E6F3`, profonde `#174A63` en clair), mesurée sur le liseré des bulles de la réf. 02 et sur les reflets de la goutte du logo. |
| Verre | Vrai verre liquide : épaisseur visible, reflet spéculaire marqué sur le bord haut, légère ombre intérieure, fond saturé à travers le verre. Le fond vivant devient lumineux, avec les couleurs mesurées des références. |
| Ressemblance | Le pilote doit ressembler beaucoup plus aux références : cinq traits par référence (section 1.1), et une comparaison côte à côte à chaque passe. |
| Textes | Plus de point médian dans le sous-titre. « Accusé de réception envoyé » seulement avec `envoye_le`. Le repère intermédiaire du rail est nommé. |

**Direction d'Oscar, 2026-09-24, troisième itération (le rendu restait générique) :**

| Point | Décision |
|---|---|
| Verre | Il n'est plus limité à trois usages : c'est le langage de tout élément interactif du client. Les textes longs restent sur une surface calme. La console ne change pas. |
| Matière | Des gouttes, pas des plaques. La lumière est sur les bords (croissant, liseré bleuté à gauche et nacré à droite, bord bas éclairé, halo), le centre reste sombre. Un seul composant `Glass`, jugé sur `/specimen` à côté des références. |
| Écran | La date dans une grande pilule, le rail en tube avec bille, les étapes en capsules empilées, les actions en pilules. |
| Fond | Dégradé vertical marine dans l'écran ; en desktop, l'écran est posé sur le dégradé ardoise. |
| Typographie | Dates et grands chiffres en 300, titres en 400. |
| Logo | Goutte détourée en PNG 2x dans l'en-tête, avec VAULT ; SVG plus tard. |
| CI | `npm test` s'ajoute au job front. |

Note sur les clichés : les deux skills autorisés (web-design et ui-ux-pro-max) ne contiennent pas de liste de clichés formelle. La liste de la section 11 reprend les quatre exemples du brief, les anti-modèles d'ui-ux-pro-max (émojis, couleur seule, dégradés « IA ») et les défauts repérés dans les références.
