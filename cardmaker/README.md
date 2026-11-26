# Holocarte — générateur de cartes à collectionner IA

Nom de travail (`lib/brand.ts`) : à remplacer une fois la marque choisie et vérifiée.

## Ce que fait la V1

- **Deux cadres originaux** : *Créature* (PV, 9 éléments, stades, pouvoir, attaques, faiblesse/résistance/repli) et *Arcane* (fantasy : coût en gemmes, ligne de type, capacités, ATQ/DEF). Formes, symboles et éléments sont propres au site : ils reprennent les codes du genre sans copier un jeu existant.
- **Illustration** : import d'une photo ou génération IA via Higgsfield (clés côté serveur). Les noms de licences connues sont refusés dans les descriptions.
- **Effet holo** animé au survol, et en option dans l'export.
- **Export PNG HD** 1260 × 1760 px (format carte 63 × 88 mm).
- **SEO** : pages par niche (`/generateur/[slug]`, définies dans `lib/niches.ts`), `sitemap.xml`, `robots.txt`, `public/llms.txt`.

## Lancer en local

```bash
cd cardmaker
cp .env.example .env.local   # renseigner HF_API_KEY et HF_API_SECRET
npm install
npm run dev
```

Sans clés Higgsfield, tout fonctionne sauf la génération d'illustration.

## Déployer sur Vercel

Importer le dépôt avec **Root Directory = `cardmaker`**, puis ajouter les variables de `.env.example`.

## Limites et suite

- Pas encore de comptes ni de paiement : la génération est limitée par IP et par jour (`FREE_GENERATIONS_PER_DAY`, compteur en mémoire, donc approximatif). Prochaine étape : comptes + crédits Stripe.
- La carte en cours est gardée dans le navigateur (localStorage).
- Le format d'image envoyé à Higgsfield (`aspect_ratio` 16:9 ou 4:3) est à confirmer sur la page du modèle choisi (`CARD_IMAGE_MODEL`).
