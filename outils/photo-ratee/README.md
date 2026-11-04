# Photo Ratée

Petit logiciel local pour dégrader des photos : prise en mouvement, photo de nuit, pixelisée, vieux téléphone, compressée…

## Lancer

Double-cliquez sur `photo-ratee.html`. Il s'ouvre dans votre navigateur (Chrome, Edge, Firefox ou Safari récents).

- Rien à installer, et ça marche sans internet.
- Les photos ne quittent jamais votre ordinateur : tout le calcul se fait dans le navigateur.
- Le fichier exporté ne contient plus les métadonnées d'origine (EXIF, GPS, modèle d'appareil).

## Utilisation

1. Glissez une ou plusieurs photos dans la fenêtre (ou cliquez sur « Ajouter des photos »).
2. Choisissez un préréglage, puis ajustez les curseurs si besoin.
   Le curseur « Intensité du filtre » (0 à 200 %) atténue ou renforce tous les effets d'un coup.
3. Glissez sur l'image pour comparer l'original et le résultat.
4. « Exporter cette photo » enregistre la photo affichée en pleine résolution.
   Avec plusieurs photos, « Tout exporter (.zip) » les traite toutes avec les mêmes réglages.

« Nouveau tirage » change le hasard du grain et du tremblement. « Varier légèrement chaque photo »
donne à chaque photo d'une série un angle, un bruit et une exposition un peu différents.
Vos propres réglages s'enregistrent avec le bouton « Enregistrer » sous les préréglages.

## Étalonnage d'après une autre photo

Le bloc « Étalonnage » reprend les couleurs et l'ambiance d'une photo de référence :
luminosité et contraste, couleur générale, et teintes propres aux ombres et aux hautes lumières
(par exemple ombres bleutées et lumières orangées).

Pour harmoniser une série :

1. Ajoutez toutes les photos de la série.
2. Affichez celle dont les couleurs vous plaisent, puis cliquez sur « Utiliser la photo affichée ».
   Vous pouvez aussi prendre une photo extérieure avec « Choisir une photo de référence ».
3. Réglez la force (80 % par défaut), puis « Tout exporter (.zip) ».

L'étalonnage est appliqué avant les effets (bougé, nuit, grain…), qui s'ajoutent par-dessus.
La référence reste enregistrée dans le navigateur d'une séance à l'autre.

## Préréglages

| Préréglage | Effet |
| --- | --- |
| Prise en mouvement | Flou de bougé, léger tremblement, horizon penché |
| Nuit | Sous-exposée, grain et taches de couleur, halos autour des lampes |
| Nuit + bougé | Pose longue à main levée |
| Flash de nuit | Flash dur, coins très sombres |
| Pixelisé | Gros pixels et JPG abîmé |
| Vieux téléphone | Petit capteur, netteté forcée, franges colorées |
| Repartagée 3 fois | Recompressée comme une photo envoyée plusieurs fois par messagerie |
| Mise au point ratée | Flou général |
| Webcam | Image de visio, terne et bruitée |

## Réglages disponibles

- **Mouvement** : flou de mouvement et sa direction, tremblement de la main, horizon penché.
- **Lumière** : exposition, contraste, saturation, température, teinte, halos lumineux, coins assombris.
- **Bruit** : grain, taches de couleur, taille du grain.
- **Netteté et optique** : mise au point ratée, netteté forcée, franges colorées.
- **Résolution** : baisse de définition (en gardant ou non la taille d'origine), pixelisation.
- **Compression** : qualité JPG et nombre de repartages.

Les photos HEIC de l'iPhone ne sont lues que par Safari. Dans les autres navigateurs, convertissez-les d'abord en JPG.
