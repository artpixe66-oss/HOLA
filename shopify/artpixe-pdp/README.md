# Template fiche produit Artpixe

Template Shopify pour les fiches de portraits personnalisés, conçu à partir de l'audit de la fiche
« Affiche Wanted One Piece ». Il fonctionne avec le thème Kalles actuel, sans modifier ses fichiers :
il ajoute uniquement des sections, un snippet, deux assets et un template alternatif.

## Contenu

| Fichier | Rôle |
| --- | --- |
| `templates/product.apx-pdp.json` | Template alternatif, pré-rempli avec le contenu One Piece |
| `templates/product.onepiecesolo.json` | Fiche One Piece actuelle avec la nouvelle zone d'achat (voir plus bas) |
| `sections/apx-product-main.liquid` | Galerie, zone d'achat, configurateur en étapes, barre fixe mobile |
| `sections/apx-product-tabs.liquid` | Onglets Kalles « Description » et « Nos avis clients » sous la fiche |
| `sections/apx-page-nav.liquid` | Barre de navigation entre les sections, défilement, FAQ et texte long repliés |
| `assets/apx-sections.css`, `assets/apx-sections.js` | Design et navigation des sections sous la fiche (aucun texte modifié) |
| `sections/apx-product-reviews.liquid` | Avis Loox (widget ou blocs d'application) |
| `sections/apx-product-steps.liquid` | « Comment ça marche » |
| `sections/apx-product-features.liquid` | Arguments, garanties, comparatif (utilisée deux fois) |
| `sections/apx-product-formats.liquid` | Formats comparés, prix « dès » calculé depuis les variantes |
| `sections/apx-product-faq.liquid` | FAQ et balisage FAQPage |
| `sections/apx-product-crosssell.liquid` | Autres univers, prix réels |
| `sections/apx-product-about.liquid` | Description du produit, visible et indexable |
| `sections/apx-product-final-cta.liquid` | Rappel final |
| `snippets/apx-product-schema.liquid` | Données structurées Product (prix, disponibilité, note Loox) |
| `snippets/apx-variant-picker.liquid` | Choix des options : pastilles, cartes de format avec prix, icône, badge |
| `snippets/apx-feature-cards.liquid` | Cartes avantages (à côté des photos sur ordinateur, sous le bouton sur mobile) |
| `snippets/apx-icon.liquid` | Icônes |
| `assets/apx-product.css` | Styles, mobile d'abord, couleurs en variables |
| `assets/apx-product.js` | Configurateur, prix dynamiques, messages datés, galerie, barre fixe |

## Installer et tester

1. Les fichiers sont déjà copiés dans le thème non publié « Artpixe PDP v2 (brouillon) ».
   Pour une autre copie : Boutique en ligne > Thèmes > Modifier le code, puis créer chaque fichier.
2. Aperçu sans rien assigner : ouvrir l'aperçu du thème brouillon puis ajouter `?view=apx-pdp` à l'URL d'une fiche,
   par exemple `/products/portrait-personnalise-one-piece?view=apx-pdp`.
3. Personnaliser dans l'éditeur de thème du brouillon : Produits > « apx-pdp ».
4. Assigner le template à un produit (fiche produit > Modèle de thème > `apx-pdp`) seulement après validation.
   Tant que le thème brouillon n'est pas publié, rien ne change pour les visiteurs.

## Fiche portrait sur tous les portraits personnalisés

La zone produit des portraits est rendue par `snippets/apx-portrait.liquid`, appelé depuis la section Kalles
`main-product` pour les modèles listés (`apx_portraits` en haut du correctif, voir `kalles/main-product.patch`) :
One Piece, Naruto, Demon Slayer, Portrait manga, Dragon Ball Z, le modèle partagé `one-piece-a-b` (8 fiches),
cartoon, pop culture, Simpsons, Rick et Morty, LEGO, carte Pokémon, couple, Bleach, animaux et Netflix.
Les modèles JSON ne changent pas : chaque univers garde ses sections (FAQ, textes SEO, onglets, Instagram).

- Jusqu'au bouton : badges d'avis, titre, accroche, prix, 1. nombre de personnes (ou d'animaux), 2. format en cartes,
  3. champs de personnalisation, 4. photos (UploadKit, « pas encore la photo »), notes, bouton qui mène au paiement.
- Formats : les cartes Displate passent en premier. Le Displate est présélectionné (sauf lien `?variant=`), mis en
  avant (bordure et halo, badge « Recommandé », « Offre spéciale » pendant l'offre) ; « Premium » doré sur le Displate
  avec cadre, « Choix éco » vert sur le fichier HD, pas de badge sur l'affiche A3 (coûts logistiques).
  Les deux cartes Displate indiquent la taille vendue : 32 × 45 cm (Displate M).
- Nombre de personnes : de 1 à 10 sur tous les portraits sauf les animaux (1 à 3). Au-delà de 7 pastilles,
  elles se rangent en deux lignes égales sur mobile.
- Champs : ceux des blocs Kalles « properties » du modèle, avec les mêmes noms de propriétés de commande et la même
  logique de visibilité (`snippets/apx-portrait-field.liquid`). Les champs courts vont à l'étape 3, les textes longs
  après les photos. One Piece (champ prime) garde « Nom sur l'affiche » et « Prime (฿) ».
- Applications placées avant le formulaire Kalles (UploadKit) : dans l'étape photos. Loox y est ignoré (la note
  Loox est déjà dans les badges).
- Blocs placés après le formulaire : sous le bouton, code inchangé. Les 4 cartes avantages Kalles sont remplacées
  par celles de la fiche (à côté des photos sur ordinateur) ; avis clients et « Pourquoi Artpixe » sont réunis dans un cadre.
- Onglets Description / Avis, sections du modèle et données structurées Product : ceux de Kalles, inchangés.
- Barre de navigation : liens trouvés dans la page (avis, comment ça marche, autres univers, FAQ, guide).
- Textes traduits dans le code selon la langue de la boutique : fr, en, es, de, it, nl. Les noms des propriétés
  de commande restent en français pour l'atelier. Les libellés propres à un modèle (ex. champs de la carte Pokémon)
  restent ceux du bloc Kalles.

Le correctif Kalles (`kalles/main-product.patch`) ajoute un bloc au début de `sections/main-product.liquid` et ferme
le `if` après la zone produit Kalles ; la barre d'achat fixe Kalles est désactivée sur ces fiches (la fiche a la sienne).
Pour l'appliquer à une autre copie du thème : `patch sections/main-product.liquid kalles/main-product.patch`.
Le fichier Kalles complet n'est pas dans ce dépôt (thème sous licence).

Pour publier : ajouter les snippets `apx-portrait`, `apx-portrait-field`, `apx-icon`,
les assets `apx-product.css`, `apx-product.js`, `apx-sections.css`, `apx-sections.js`, appliquer le correctif à
`sections/main-product.liquid`, puis ajouter les fichiers de l'offre (`../artpixe-polish`).

### Anciens modèles passés à la mise en page One Piece (28 octobre 2026)

Le thème « Artpixe PDP v2 » a été publié le 28 octobre. Ces changements et la correction One Piece ci-dessous sont dans
sa copie « Artpixe PDP v3 (brouillon) », à publier à son tour (Shopify n'autorise pas l'écriture sur le thème en ligne).

Correction : le champ « prime » est présent dans tous les modèles mais limité à One Piece par sa visibilité. La fiche
vérifie maintenant cette visibilité (mode `probe` de `apx-portrait-field`) ; avant, les autres portraits reprenaient
les textes de l'affiche Wanted (« Nom sur l'affiche », « MONKEY D. LUFFY »).

`one-piece-a-b` (8 fiches manga), `page-produit-pop-culture` (4), `cartoone` (3) et `netflix` ont la mise en page
du modèle One Piece, avec leurs textes d'origine :
- sous le bouton : carrousel « Ce que disent nos clients » et cadre « Pourquoi Artpixe » (titre par famille ; nombre
  d'avis et note lus dans Loox). Le widget Loox, « Garanties & avantages » et Instagram de la zone produit sont désactivés ;
- en bas : « Comment ça marche » (textes de l'ancien bloc, sans balisage HowTo comme avant), « Autres univers »
  (fiches de la collection, prix « dès » lus dans Shopify), FAQ (mêmes questions, même JSON-LD ; Netflix sans JSON-LD
  comme avant). Fil d'Ariane visible, bandeau d'icônes, trait, carrousel de collection et diaporama vide : désactivés.
Rien n'est supprimé : les blocs et sections retirés sont désactivés et se réactivent dans l'éditeur.

Les modèles récents (One Piece, Naruto, DBZ, Demon Slayer, Bleach, manga, Simpsons, LEGO, Rick et Morty, couple)
affichent dans « Autres univers » le prix « dès » réel lu dans Shopify au lieu d'un prix écrit à la main (19,90 €).

`templates/product.onepiecesolo.json` est le modèle One Piece d'origine (27 octobre 2026), remis dans le brouillon :
la fiche portrait s'y applique comme aux autres. L'ancienne conversion (section `apx-product-main`) reste disponible
dans l'historique git.

## La zone d'achat

Dans l'ordre du template One Piece (tout se réordonne dans l'éditeur) :
badges Trustpilot et Loox, titre, accroche, prix (avec l'économie seulement pendant une vraie promotion),
1. nombre de personnes (pastilles), 2. format (cartes avec prix réel, icône, badge),
3. nom, prime et style, 4. photos (UploadKit + « pas encore la photo »), notes au graphiste,
bouton « Commander mon portrait » avec le prix, avantages, carrousel photos Loox, livraison.

Réglages utiles :
- **Style des étapes** (section) : compact sur une ligne, ou encadré comme les anciens blocs Artpixe.
- **Disposition** (bloc « Choix des options ») : une étape par option, ou toutes les options dans une seule étape.
- **Afficher les cartes en premier** : met le format avant le nombre de personnes.
- **Carte d'option** : nom affiché, icône ou vignette (photo du format ou du décor), badge, couleur (standard, vert, doré).
- **Cartes avantages** : à côté des photos ou dans la zone d'achat.

## Ce qui protège le référencement

- **Même URL, même H1.** Le H1 est le titre du produit (bloc « Titre », limité à un). Aucune autre section ne produit de H1.
- **Même méta-titre et méta-description.** Ils viennent toujours des champs SEO du produit, via `layout/theme.liquid`.
- **URL canonique inchangée.** Le paramètre `?variant=` ajouté au changement d'option ne modifie pas la balise canonique.
- **Contenu rendu côté serveur.** Titres, textes, prix, FAQ et description sont dans le HTML initial. Le JavaScript ne fait qu'améliorer.
- **Hiérarchie de titres propre.** H1 pour le produit, H2 par section, H3 pour les éléments. Les étapes du configurateur sont des légendes de formulaire, pas des titres.
- **Données structurées exactes.** `apx-product-schema` génère Product avec une offre par variante et la note Loox réelle.
  Il remplace celui de la section Kalles `main-product`, qui n'est pas utilisée ici : pas de doublon.
  Le fil d'Ariane reste produit par `snippets/artpixe-seo-schema.liquid`.
- **FAQ sans doublon.** Si le produit a le métachamp `artpixe.faq`, la section l'affiche et ne génère pas de balisage
  (le thème le fait déjà). Sinon, elle génère FAQPage à partir des questions affichées : le texte et le balisage ne peuvent pas diverger.
- **Pas de texte caché, pas de chiffres écrits à la main.** Notes, nombres d'avis et prix « dès » sont lus dans Shopify et Loox.
- **Images optimisées.** Première image chargée en priorité, les autres en différé, dimensions fixées pour éviter les décalages.
- **Description conservée.** La section « Description » affiche `product.description` : le texte SEO existant reste indexé.

## Adapter sans casser le SEO

À faire librement :
- Modifier tous les textes, réordonner ou masquer les blocs et sections dans l'éditeur.
- Changer les couleurs (réglages de la section principale).
- Ajouter des cartes d'option, des champs, des questions de FAQ, des étapes.
- Relier un réglage texte à un métachamp (« Connecter une source dynamique ») pour qu'un seul template serve tous les univers.

À éviter :
- Ajouter un H1 dans la description du produit ou dans un bloc texte.
- Désactiver « Générer les données structurées Product » sans autre source de balisage.
- Écrire une note, un nombre d'avis ou un prix à la main dans un texte.
- Mettre un prix barré (« prix avant réduction ») hors d'une vraie promotion datée.
- Mettre des textes en `display:none` pour le référencement.

## Un template pour tous les univers

Le configurateur lit les options du produit : il fonctionne pour toute fiche qui a les options
« Nombre de personnes » et « Version ». Pour Naruto, Demon Slayer ou Dragon Ball Z :
1. Dupliquer le template dans l'éditeur, ou relier les textes spécifiques (accroche, exemples, styles) à des métachamps.
2. Renseigner le métachamp `artpixe.faq` du produit pour une FAQ propre à l'univers.
3. Adapter les choix du bloc « Style » (ou le retirer).

## À valider avant publication

Ces éléments sont désactivés ou neutres par défaut, parce qu'ils engagent la boutique :
- Les messages datés de Noël (blocs « Message daté », désactivés) : dates à fixer selon la capacité réelle.
- Les questions FAQ « changer de format après l'aperçu » et « affiche abîmée » (désactivées) : à activer seulement si ces règles sont appliquées.
- « Fichier HD offert avec toute impression » : retiré des textes tant que l'offre n'est pas en place.
- Fiches portraits : le Displate est présélectionné et recommandé, l'affiche A3 n'a plus de badge. Ne pas écrire « Le plus choisi »
  sur le Displate tant que les ventes ne le confirment pas.
- Les dimensions du Displate dans la section Formats (« À préciser »).
- Les délais (« aperçu sous 24-48 h ouvrées ») et la définition des retouches.

## Points techniques à tester dans l'aperçu

- Chaque combinaison personnes × format ajoute la bonne variante au bon prix.
- Le bloc UploadKit attache bien les photos à la commande.
- Les propriétés « Pseudo(s) », « Montant de la prime ฿ », « Style », « Demandes particulières » et « Photo » apparaissent dans la commande.
- Un lien `?variant=` (Google Shopping) garde la variante demandée.
- La barre fixe mobile apparaît sous le configurateur et ramène au configurateur.

Section « Artpixe · Fiche produit » : le formulaire ne contient que le sélecteur de variante. Les champs, le bouton et les blocs
d'application s'y rattachent par l'attribut HTML `form`, ce qui évite les formulaires imbriqués. Sans JavaScript, le sélecteur de
variante reste visible et la commande fonctionne.

Fiche portrait (`apx-portrait`) : le formulaire englobe toute la zone d'achat, du sélecteur de variante au bouton, avec le bloc
UploadKit à l'intérieur (`display: contents`, la mise en page ne change pas). UploadKit ajoute les photos au formulaire produit
qui entoure son bloc : avec le bloc hors du formulaire (version du 28 octobre 2026), les photos n'arrivaient plus dans les
commandes. Le bouton ajoute au panier par `/cart/add.js` puis ouvre le paiement, comme l'ancienne fiche Kalles ; sans `fetch`,
le formulaire part normalement (`return_to` = paiement). La validation du navigateur est coupée quand le script tourne
(les champs de la fiche restent vérifiés par le script) pour qu'un champ interne à une application ne bloque pas le bouton.
Correction copiée le 30 octobre 2026 dans « Artpixe PDP v4 - photos UploadKit (brouillon) », copie du thème en ligne v3, à publier.

## Vérifier le code

```bash
npm install @shopify/theme-check-node
```

Puis lancer `themeCheckRun` sur un dossier de thème contenant ces fichiers. La version livrée passe Theme Check sans erreur.
