# Studio — influenceuses IA

Application personnelle pour piloter plusieurs influenceuses IA sur Instagram :
veille → idée → accroche → prompt → génération → publication → stats → amélioration.

## Les écrans

| Écran | Rôle |
|---|---|
| Aujourd'hui | Publication du jour et sa check-list, paquet de publication à copier, 3 prochaines actions, tests A/B en cours, objectif de la semaine |
| Influenceuses | Fiche de chaque personnage (ancrages physiques, VOIX, ATTITUDE, détails POV, formats, points de contrôle) et photos de référence |
| Inspirations | Veille rangée en collections (Cette semaine, Carrousels, Inspiration, Émotion, Valeur, Divertissement), capture rapide depuis le téléphone |
| Studio | Fiche créative, labo d'accroches (5 accroches, test A/B), agent créatif avec Mode viral, versions du prompt, génération Higgsfield |
| Carrousels | Storyboard depuis un brief ou un carrousel existant (captures), prompt de chaque photo, légende, génération |
| Bibliothèque / Calendrier | Toutes les créations ; programmation par glisser-déposer |
| Performances | Synthèse, comparaison par attribut, tests A/B, publications, import (Instagram automatique, CSV, saisie) |
| Revue | Ce qui a marché / à retester / à arrêter, puis plan de la semaine proposé par l'agent |
| Agent & réglages | Instructions versionnées (v2 « mode viral » par défaut), méthode carrousel, listes de valeurs, branchements, sauvegarde |

## Lancer en local

Prérequis : Node.js 20.9 ou plus récent, Git.

```bash
git clone https://github.com/artpixe66-oss/HOLA.git
cd HOLA/studio
npm install
cp .env.example .env.local   # sous Windows : copy .env.example .env.local
npm run dev                  # puis http://localhost:3000
```

Mise à jour : `git pull` dans `HOLA`, puis `npm install` dans `studio`.

## Variables d'environnement (`.env.local` en local, Settings → Environment Variables sur Vercel)

| Variable | À quoi elle sert | Sans elle |
|---|---|---|
| `APP_PASSWORD` | Mot de passe de l'application | Application ouverte (normal en local) |
| `BLOB_READ_WRITE_TOKEN` | Sauvegarde en ligne, photos, renouvellement des jetons Instagram | Données dans le navigateur uniquement |
| `ANTHROPIC_API_KEY` | Agent Claude directement dans l'app | Boutons « Copier pour Claude.ai » puis coller la réponse |
| `HF_API_KEY`, `HF_API_SECRET` | Génération vidéo et image Higgsfield | Générer sur le site Higgsfield |
| `HF_BASE` | Autre adresse d'API Higgsfield si 404 | `https://platform.higgsfield.ai` |
| `IG_TOKEN_<NOM>` | Stats Instagram automatiques, un jeton par compte pro | Import CSV ou saisie manuelle |

En local, copier le `BLOB_READ_WRITE_TOKEN` de Vercel fait partager les mêmes données entre
les deux versions (la dernière modification enregistrée gagne : ne pas travailler sur les deux en même temps).
Pour transférer sans Blob : Agent & réglages → Données → Exporter, puis Restaurer.

Vérification : Agent & réglages → Branchements → Vérifier.

## Ce qui ne marche qu'en ligne

- La capture depuis le menu Partager (application installée sur Android, adresse https).
- L'accès depuis le téléphone.

## Comment l'analyse sépare un vrai résultat d'une variation

Chaque publication est rapportée à la médiane des vues du compte. Un groupe (format, accroche,
tenue, créneau…) n'est « signal solide » qu'avec au moins 4 posts et un test de signe à p ≤ 0,11 ;
sinon c'est une piste « à confirmer ». Un test A/B ne donne un gagnant qu'avec 20 % d'écart de vues
sans que la rétention dise le contraire, et une tendance par type d'accroche qu'à partir de 3 tests.

## Organisation du code

- `app/` : les écrans et les routes API (`api/agent`, `api/structured`, `api/carousel`,
  `api/higgsfield`, `api/instagram`, `api/state`, `api/upload`, `api/health`, `api/login`)
- `lib/store.ts` : données (navigateur + synchronisation Blob), `lib/analytics.ts` : stats,
  `lib/hookTests.ts` : tests A/B, `lib/today.ts` : écran Aujourd'hui, `lib/instagram.ts` : API Instagram
- `lib/seed/` : instructions de l'agent (v1, v2 mode viral), méthode carrousel, fiche Giulia
- `proxy.ts` : mot de passe

## Limites connues

- Pas de récupération de vidéos d'autres comptes à partir d'un lien (bloqué par Instagram) :
  joindre le fichier, ou brancher un service comme Apify.
- Les paramètres envoyés à Higgsfield et les noms de statistiques Instagram n'ont pas encore été
  validés sur les vraies API : en cas d'erreur, le message s'affiche dans l'application.
