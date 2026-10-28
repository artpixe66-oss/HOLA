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

## Offre Displate (jusqu'au 7 décembre 2026)

Fichiers : `snippets/apx-offer-displate.liquid`, `assets/apx-offer.js`, `assets/apx-offer.css`.
Chargés par `apx-polish.liquid` sur les mêmes templates. Le script fonctionne avec la fiche Kalles actuelle
(sélecteur `#apx-fmt`) comme avec la nouvelle zone d'achat (section « Artpixe · Fiche produit »).

Sur la page :
- un encadré « Offre spéciale Displate » remplace le bandeau « livraison offerte » sous le bouton ;
- son interrupteur fait passer le portrait en Displate pour la différence de prix réelle avec le format choisi
  (« +20,00 € » depuis l'affiche A3). Sur les fiches portraits, le Displate est le format présélectionné : l'interrupteur
  est donc activé à l'arrivée, avec le prix du Displate affiché partout ; le désactiver passe à l'affiche A3 ;
- la liste commence par « Impression sur métal HD » (19,90 € barré ; c'est ce que paie le supplément) ;
- une fois activé, il débloque trois cadeaux, chacun sur une ligne avec sa valeur barrée : livraison express
  offerte (3,90 €), commande prioritaire offerte (4,90 €), version digitale HD offerte (19,90 €). Les valeurs se
  règlent dans `perks` (`"value"`, ou `"[hd]"` pour le prix réel du fichier HD seul) ;
- le désactiver revient au format choisi avant ; choisir une carte Displate l'active aussi ;
- le badge de la carte Displate devient « Offre spéciale » ;
- un compte à rebours « Fin de l'offre dans … » apparaît les 14 derniers jours (`countdownDays`), avant la date seule.
  Il vise la vraie date de fin : le même pour tous, il ne redémarre pas ; les secondes s'affichent le dernier jour ;
- la propriété de commande « Offre Displate : Livraison express offerte + commande prioritaire + version digitale HD
  offerte » est ajoutée : elle apparaît dans le panier, au paiement et dans la commande, pour que l'atelier traite la
  commande en priorité et envoie le fichier HD.

La date de fin se règle en haut de `snippets/apx-offer-displate.liquid` (`offer_end`). Après cette date,
rien ne s'affiche plus, même si la page vient du cache, et le bandeau « livraison offerte » revient.

Livraison : le profil d'expédition « Offre Displate – express offerte (jusqu'au 7 déc.) »
(Paramètres > Expédition et livraison) contient les 552 variantes Displate et Displate avec cadre de tous les
portraits personnalisés : livraison rapide assurée
offerte partout (France, UE, International, Reste du monde), Bpost offert en Belgique. Les livraisons standard
gratuites (Colissimo, « Standard 2 à 4 jours ouvrables ») y sont reprises sous le même nom que dans le profil
général : dans un panier qui mélange un Displate et un autre article, Shopify additionne les tarifs de même nom,
donc aucune option ne disparaît. **Le supprimer le 8 décembre** : les variantes reviennent au profil général.
