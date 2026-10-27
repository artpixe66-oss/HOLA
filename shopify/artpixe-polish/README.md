# Mise en forme de la zone d'achat Artpixe

Couche de présentation pour les fiches portraits existantes (template `product.onepiecesolo`).
Elle **ne change aucun contenu** : mêmes blocs, mêmes textes, mêmes options, même ordre.
Elle ne touche qu'aux espacements, tailles de texte, contrastes et à la disposition.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `assets/apx-polish.css` | Les règles de mise en forme |
| `snippets/apx-polish.liquid` | Charge la feuille uniquement sur les templates listés |

## Ce qui change à l'écran

- Blocs espacés de 14 px au lieu de 20 px : la page est plus courte et le bouton remonte.
- Étapes « Vos photos » et « Choisissez les options » : numéro et titre sur une ligne, séparés par un filet, au lieu de grandes cartes.
- Cartes de format : descriptions en 11,5 px au lieu de 10 px, plus contrastées.
- Nombre de personnes : libellé lisible, valeur choisie en orange, pastilles carrées plus faciles à toucher.
- Le libellé Kalles « Version : Digital » est masqué : il répétait celui des cartes de format juste au-dessus.
- Champs : libellés en 13 px, « Prénom(s) ou Pseudo(s) » et « Montant de la prime » côte à côte,
  texte saisi en 16 px (l'iPhone ne zoome plus quand on touche un champ).
- Badges Trustpilot / Loox un peu plus lisibles sur mobile, cartes avantages sur une seule ligne.

## Installation

1. Ajouter `assets/apx-polish.css` et `snippets/apx-polish.liquid` au thème.
2. Ajouter cette ligne dans le `<head>` de `layout/theme.liquid` (par exemple juste avant `</head>`) :

   ```liquid
   {%- render 'apx-polish' -%}
   ```

   Dans le thème brouillon « Artpixe PDP v2 (brouillon) », la ligne est à la fin de `snippets/meta-tags.liquid`,
   qui est déjà rendu dans le `<head>`.

3. Pour l'appliquer à d'autres fiches, ajouter leur suffixe de template dans `snippets/apx-polish.liquid` :
   `'onepiecesolo,narutosolo,dbzsolo'`.

Aucun impact SEO : pas de texte ajouté ou retiré, pas de changement de titres, d'URL ou de balisage.
