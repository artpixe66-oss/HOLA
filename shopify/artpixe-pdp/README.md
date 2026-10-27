# Template fiche produit Artpixe

Template Shopify pour les fiches de portraits personnalisés, conçu à partir de l'audit de la fiche
« Affiche Wanted One Piece ». Il fonctionne avec le thème Kalles actuel, sans modifier ses fichiers :
il ajoute uniquement des sections, un snippet, deux assets et un template alternatif.

## Contenu

| Fichier | Rôle |
| --- | --- |
| `templates/product.apx-pdp.json` | Template alternatif, pré-rempli avec le contenu One Piece |
| `sections/apx-product-main.liquid` | Galerie, zone d'achat, configurateur en étapes, barre fixe mobile |
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
- Le badge « Le plus choisi » sur l'affiche A3 : vrai d'après les ventes des 12 derniers mois, à revoir si la répartition change.
- Les dimensions du Displate dans la section Formats (« À préciser »).
- Les délais (« aperçu sous 24-48 h ouvrées ») et la définition des retouches.

## Points techniques à tester dans l'aperçu

- Chaque combinaison personnes × format ajoute la bonne variante au bon prix.
- Le bloc UploadKit attache bien les photos à la commande.
- Les propriétés « Pseudo(s) », « Montant de la prime ฿ », « Style », « Demandes particulières » et « Photo » apparaissent dans la commande.
- Un lien `?variant=` (Google Shopping) garde la variante demandée.
- La barre fixe mobile apparaît sous le configurateur et ramène au configurateur.

Le formulaire ne contient que le sélecteur de variante. Les champs, le bouton et les blocs d'application s'y rattachent par
l'attribut HTML `form`, ce qui évite les formulaires imbriqués. Sans JavaScript, le sélecteur de variante reste visible et la commande fonctionne.

## Vérifier le code

```bash
npm install @shopify/theme-check-node
```

Puis lancer `themeCheckRun` sur un dossier de thème contenant ces fichiers. La version livrée passe Theme Check sans erreur.
