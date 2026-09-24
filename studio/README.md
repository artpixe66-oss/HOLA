# Studio — influenceuses IA

Application personnelle pour piloter plusieurs influenceuses IA :
inspiration → scénario → prompt → génération → publication → mesure → amélioration.

## Espaces

| Page | Rôle |
|---|---|
| Tableau de bord | Production en cours, programme de la semaine, détail d'une création, répartition par statut, enseignements des stats |
| Influenceuses | Fiche de chaque personnage : ancrages physiques, VOIX, ATTITUDE, formats validés, points de contrôle, références visuelles. Giulia est préremplie depuis le skill `reverse-video-prompt` |
| Inspirations | Reels à décortiquer (lien, observations, transcription), transformables en création |
| Studio | Fiche créative (sujet, accroche, tenue, décor, format, durée, montage), agent Claude, versions du prompt, lancement Higgsfield |
| Bibliothèque | Toutes les créations et leurs résultats |
| Calendrier | Programmation par glisser-déposer, heure proposée d'après les meilleures publications |
| Performances | Import CSV Meta Business Suite ou saisie manuelle, comparaison par attribut, recommandations |
| Agent & réglages | Instructions de l'agent versionnées (import d'un `SKILL.md`), modèle, tarif et plafond Higgsfield, sauvegarde |

## Comment l'analyse distingue un vrai résultat d'une variation

Chaque publication est rapportée à la médiane des vues du compte (×1). Pour chaque
valeur d'attribut (ex. format « Vanne à chute »), on regarde la médiane de ses posts
et combien battent la médiane du compte. Un écart ne devient **signal solide**
qu'avec au moins 4 posts et un test de signe à p ≤ 0,11 ; sinon c'est une piste
**à confirmer**, et l'application propose de refaire un contenu en ne changeant
que cet élément. Ces enseignements sont envoyés à l'agent avec leur niveau de confiance.

## Lancer en local

```bash
cd studio
cp .env.example .env.local   # renseigner les clés
npm install
npm run dev
```

## Déployer sur Vercel

Importer le dépôt, **Root Directory = `studio`**, puis ajouter les variables
d'environnement `ANTHROPIC_API_KEY`, `HF_API_KEY`, `HF_API_SECRET` (et `HF_BASE`
si l'API renvoie 404 sur `platform.higgsfield.ai`).

## Limites de cette première version

- Les données sont stockées dans le navigateur (localStorage). Exporter une
  sauvegarde depuis « Agent & réglages » ; une base de données viendra ensuite.
- Pas de connexion automatique à Instagram : import CSV ou saisie manuelle.
- L'agent n'exécute pas les scripts Python du skill (mesures d'image,
  transcription) : colle leurs résultats dans l'inspiration.
- L'appel Higgsfield suit la doc du skill (`prompt`, `duration`, `resolution`,
  `aspect_ratio`, `image_url`, `seed`) : à vérifier sur la page du modèle.
