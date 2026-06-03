# Récapitulatif Session Artpixe — 03 juin 2026

---

## 1. AUDIT GOOGLE ADS — RÉSULTATS CLÉS

### Performance historique (par trimestre)

| Période | Dépenses | Conversions | Valeur Conv. | ROAS | CPA |
|---------|----------|-------------|--------------|------|-----|
| Q4 2023 | €761 | ~0 | €0 | 0 | ∞ |
| Q1 2024 | €1 376 | ~0 | €0 | 0 | ∞ |
| Q2 2024 | €1 193 | 10 | €507 | 0.42 | €119 |
| Q3 2024 | €1 418 | 28 | €1 512 | 1.07 | €50 |
| Q4 2024 | €1 043 | 40 | €2 280 | 2.19 | €26 |
| Q1 2025 | €1 076 | 27 | €1 782 | 1.66 | €40 |
| Q2 2025 | €730 | 22 | €1 188 | 1.63 | €33 |
| Q3 2025 | €539 | 24 | €1 488 | 2.76 | €22 |
| Q4 2025 | €410 | 26 | €1 558 | 3.80 | €16 |
| Q1 2026 | €193 | 31 | €2 139 | **11.08** ⚠️ | €6 |

**Anomalie Q1 2026** : ROAS 11.08 est suspect. Cause probable = action de conversion dupliquée (micro-conversion comme "ajout panier" comptabilisée comme achat primaire). Vérifier dans Google Ads → Outils → Conversions → historique des modifications.

### Problèmes de tracking identifiés

- **Q4 2023 / Q1 2024** : Tracking complètement cassé → €2 137 dépensés sans aucune conversion attribuée
- **Valeurs de conversion à €0,92** détectées → une action secondaire est probablement définie comme primaire
- **Consent Mode v2** : statut inconnu, à vérifier dans GTM
- **Enhanced Conversions** : non confirmé actif

### Mots-clés gaspilleurs identifiés (€2 253 de dépenses sans conversions)

| Terme | Dépenses | Conv. | Action |
|-------|----------|-------|--------|
| cartoon-portrait | €103 | 0 | Exclure |
| portrait animé personnalisé | €150 | 0 | Exclure |
| portrait personnalisé manga | €89 | 0 | Exclure |
| dessin animé personnalisé | €76 | 0 | Exclure |
| carte pokémon | €34 | 0 | Exclure |
| transformer photo en manga gratuit | €16 | 0 | Exclure |
| pokemon | €25 | 0 | Exclure |
| + 216 autres termes | ~€1 760 | 0 | Exclure |

---

## 2. AUDIT SEO / SEARCH CONSOLE

### Tendance organique (artpixe.com)

| Période | Clics/mois | Impressions/mois | CTR | Position moy. |
|---------|-----------|-----------------|-----|---------------|
| Fév 2025 | ~1 408 | ~35 000 | 4.0% | 18 |
| Mai 2026 | ~273 | ~12 000 | 2.3% | 28 |
| **Variation** | **-81%** | **-66%** | **-1.7pt** | **-10 pos** |

**Conclusion** : Déclin organique sévère et progressif depuis 16 mois. Causes probables : concurrence accrue sur les requêtes portrait personnalisé, manque de contenu, pas de stratégie de netlinking, handles de produits sous-optimaux.

---

## 3. OPTIMISATIONS SHOPIFY RÉALISÉES

### Produits modifiés (handles, tags, types, SEO)

#### Catégorie Manga/Anime (8 produits)

| Produit | Ancien handle | Nouveau handle | Modifications |
|---------|--------------|----------------|---------------|
| One Piece Wanted | `portrait-wanted-one-piece` | ✅ déjà correct | Tags + metafields SEO |
| Naruto | `portrait-naruto-personnalise` | ✅ déjà correct | Tags + SEO |
| Dragon Ball Z | `portrait-dbz-personnalise` | ✅ déjà correct | Tags + SEO |
| Demon Slayer | `portrait-demon-slayer-personnalise` | ✅ déjà correct | Tags + SEO |
| Fairy Tail | `portrait-fairy-tail-personnalise` | ✅ déjà correct | Tags + SEO |
| Attaque des Titans | `portrait-aot-personnalise` | ✅ déjà correct | Tags + SEO |
| Studio Ghibli | `portrait-ghibli-personnalise` | ✅ déjà correct | Tags corrigés (tag "One Piece" supprimé ⚠️) |
| Jujutsu Kaisen | `portrait-jjk-personnalise` | ✅ déjà correct | Tags + SEO |

#### Catégorie Cartoon (6 produits)

| Produit | Ancien handle | Nouveau handle | Modifications |
|---------|--------------|----------------|---------------|
| Simpson | `portrait-cartoon-personnalise-les-simpson` | `portrait-simpson-personnalise` | ✅ Handle + SEO |
| Rick & Morty | `portrait-cartoon-personnalise-rick-morty` | `portrait-rick-et-morty-personnalise` | ✅ Handle + SEO |
| Tim Burton | `portrait-cartoon-personnalise-tim-burton` | `portrait-tim-burton-personnalise` | ✅ Handle + SEO |
| American Dad | `portrait-cartoon-personnalise-family-guys` | `portrait-american-dad-personnalise` | ✅ Handle + SEO |
| Futurama | `portrait-futurama-personnalise` | ✅ déjà correct | Tags + SEO |
| Bob's Burgers | `portrait-bobs-burgers-personnalise` | ✅ déjà correct | Tags + SEO |

#### Catégorie Pop Culture (6 produits)

| Produit | Ancien handle | Nouveau handle | Modifications |
|---------|--------------|----------------|---------------|
| Harry Potter | `portrait-manga-personnalise-harry-potter` | `portrait-harry-potter-personnalise` | ✅ Handle + SEO |
| Carte Pokémon | `portrait-personnalise-pokemon` | `carte-pokemon-personnalisee` | ✅ Handle + SEO |
| GTA | `portrait-personnalise-gta` | `portrait-gta-personnalise` | ✅ Handle + SEO + productType corrigé |
| Stranger Things | `portrait-stranger-things-personnalise` | ✅ déjà correct | Tags + SEO |
| Marvel | `portrait-marvel-personnalise` | ✅ déjà correct | Tags + SEO |
| Disney | `portrait-disney-personnalise` | ✅ déjà correct | Tags + SEO |

#### Autres produits optimisés

- Portrait Couple Personnalisé — tags + SEO
- Portrait Famille Personnalisé — tags + SEO
- Portrait Bébé/Naissance — tags + SEO
- Portrait Chien/Chat — tags + SEO
- Portrait Mariage — tags + SEO
- Affiche Minimaliste — tags + SEO

### Taxonomie de tags standardisée

```
portrait-personnalise, [univers spécifique], cadeau-personnalise,
cadeau-anniversaire, cadeau-noel, idee-cadeau, fait-main,
illustration-personnalisee, [catégorie: manga / cartoon / pop-culture / couple / famille]
```

---

## 4. FICHIER 301 REDIRECTIONS

**Fichier** : `/home/user/HOLA/redirections-301-artpixe.csv`

**Comment importer dans Shopify :**
1. Boutique en ligne → Navigation → Redirections d'URL
2. Bouton "Importer" (en haut à droite)
3. Sélectionner le fichier CSV
4. Confirmer l'import

**Contenu du fichier (13 règles) :**

```
/products/portrait-cartoon-personnalise-les-simpson → /products/portrait-simpson-personnalise
/products/portrait-cartoon-personnalise-rick-morty → /products/portrait-rick-et-morty-personnalise
/products/portrait-cartoon-personnalise-tim-burton → /products/portrait-tim-burton-personnalise
/products/portrait-cartoon-personnalise-family-guys → /products/portrait-american-dad-personnalise
/products/portrait-manga-personnalise-harry-potter → /products/portrait-harry-potter-personnalise
/products/portrait-personnalise-pokemon → /products/carte-pokemon-personnalisee
/products/portrait-personnalise-gta → /products/portrait-gta-personnalise
+ 6 redirections depuis /collections/.../products/...
```

---

## 5. RECHERCHE DE MOTS-CLÉS — CARTE POKÉMON PERSONNALISÉE

### Mots-clés cibles (intention commerciale confirmée)

| Mot-clé | Volume/mois | CPC | Intention | Priorité |
|---------|------------|-----|-----------|----------|
| carte pokémon personnalisée | 1 600 | €0,38 | Achat | ⭐⭐⭐ |
| carte pokemon personnalisable | 1 583 | €0,41 | Achat | ⭐⭐⭐ |
| carte pokémon custom | 590 | €0,52 | Achat | ⭐⭐ |
| fausse carte pokémon personnalisée | 320 | €0,44 | Achat | ⭐⭐ |
| carte pokemon avec photo | 210 | €0,35 | Achat | ⭐⭐ |
| créer sa carte pokémon personnalisée | 170 | €0,28 | Achat | ⭐ |

**Volume total cible** : ~4 473 recherches/mois avec intention d'achat

### ⚠️ Mots-clés à exclure (intention DIY/gratuit = 90% du volume)

```
transformer photo en carte pokémon gratuit, créer carte pokémon gratuit,
générateur carte pokémon, faire sa carte pokémon, créer carte pokémon en ligne,
pokémon go, carte pokémon rare, acheter carte pokémon, prix carte pokémon,
carte pokémon ex/gx/vmax, pokémon tcg, carte pokémon originale
```

### Structure campagne recommandée

**Campagne** : [S] Carte Pokémon Personnalisée — FR  
**Budget** : €5/jour  
**Enchère** : CPC max €0,80 (Maximiser les clics en phase de lancement)  
**Réseau** : Recherche uniquement (pas Display)

**Groupe d'annonces 1 — Exact**
- [carte pokémon personnalisée]
- [carte pokemon personnalisable]
- [carte pokémon custom]

**Groupe d'annonces 2 — Phrase**
- "carte pokémon personnalisée"
- "carte pokemon avec photo"
- "créer carte pokémon personnalisée"

**Angle publicitaire clé** :
> "Pas un générateur gratuit — une vraie carte Pokémon unique créée à partir de ta photo"

**Titre 1** : Carte Pokémon Personnalisée  
**Titre 2** : Créée à partir de ta Photo  
**Titre 3** : Livraison rapide · Qualité pro  
**Description** : Offre une vraie carte Pokémon unique avec ton visage. Illustrateur professionnel, pas un générateur. Commandez en 2 min.

### Données historiques (sans campagne dédiée)

- 15 conversions déjà générées sur ce produit
- CPA moyen : < €3
- Conclusion : énorme potentiel avec campagne dédiée + page optimisée

---

## 6. STRATÉGIE GOOGLE ADS — PLAN DE RELAUNCH

### Campagnes à créer (dans l'ordre de priorité)

#### Semaine 1 — Actions immédiates

| Campagne | Type | Budget/jour | Mots-clés cibles | Objectif |
|----------|------|-------------|-----------------|----------|
| [S] Brand — Artpixe — FR | Search | €3 | [artpixe], [artpixe.com] | Protéger la marque |
| [S] One Piece Wanted — FR | Search | €8 | [portrait wanted one piece], [affiche wanted one piece] | Best-seller |
| [S] Cadeau Manga Personnalisé — FR | Search | €6 | [cadeau manga personnalisé], [idée cadeau manga] | Volume |
| [S] Carte Pokémon Personnalisée — FR | Search | €5 | [carte pokémon personnalisée], [carte pokemon custom] | Nouveau |

**Total semaine 1** : €22/jour → €660/mois

#### Semaine 2–4 — Extension

| Campagne | Type | Budget/jour | Timing |
|----------|------|-------------|--------|
| [S] Portrait Simpson Personnalisé — FR | Search | €5 | Après validation sem. 1 |
| [S] Portrait Naruto Personnalisé — FR | Search | €5 | Après validation sem. 1 |
| [S] Cadeau Personnalisé — FR (générique) | Search | €8 | Après 2 semaines de données |
| [PMAX] Catalogue Artpixe — FR | Perf. Max | €15 | Après tracking vérifié |

#### Campagnes existantes à modifier

| Campagne | Action | Nouveau budget |
|----------|--------|----------------|
| [SEARCH] One Piece Exact — FR | Augmenter budget | €8/jour |
| Search ǁ Retargeting | Augmenter budget | €4/jour |
| Campagnes à ROAS 0 (>30 jours sans conv.) | Mettre en veille | — |

### Négatifs globaux à ajouter (liste de compte)

```
gratuit, free, gratis, tuto, tutoriel, comment faire, faire soi-même,
DIY, générateur, logiciel, application, app, télécharger, download,
pdf, template, modèle, imprimer soi-même, créer gratuitement,
dessin animé gratuit, dessin personnage gratuit, apprendre, formation,
cours, YouTube, Instagram, Pinterest, forum, reddit, avis, test,
comparatif, concurrent [noms concurrents], emploi, recrutement, stage
```

---

## 7. PLAN D'ACTION PRIORITAIRE

### 🔴 URGENT — Aujourd'hui / Cette semaine (toi uniquement)

- [ ] **Vérifier les actions de conversion** dans Google Ads → Outils → Conversions
  - Une seule action primaire : "Achat" avec valeur réelle
  - Toutes les autres (ajout panier, page vue) → secondaires ou désactivées
  - Vérifier l'historique des modifications → identifier la date de l'anomalie Q1 2026

- [ ] **Importer les 301 redirections** (`redirections-301-artpixe.csv`)
  - Shopify → Boutique en ligne → Navigation → Redirections d'URL → Importer

- [ ] **Vérifier Consent Mode v2** dans GTM
  - Tous les tags Google Ads doivent avoir le mode de consentement configuré
  - Signal `ad_storage` et `analytics_storage` requis

- [ ] **Créer la liste de négatifs globaux** dans Google Ads (voir section 6)

- [ ] **Créer campagne Brand** [S] Brand — Artpixe — FR (€3/jour)

### 🟠 IMPORTANT — Dans les 7 jours

- [ ] **Créer campagnes One Piece + Cadeau Manga + Carte Pokémon** (voir structures section 6)
- [ ] **Tester le tunnel d'achat sur mobile** (iPhone + Android)
  - Vérifier que l'upload photo fonctionne facilement
  - Vérifier que les frais de livraison sont visibles avant le checkout
- [ ] **Augmenter budget** [SEARCH] One Piece Exact → €8/jour
- [ ] **Augmenter budget** Search ǁ Retargeting → €4/jour
- [ ] **Ajouter la liste de négatifs** aux campagnes actives

### 🟡 OPTIMISATION — Dans les 30 jours

- [ ] **SEO meta tags** pour les bestsellers manga (One Piece, Naruto, DBZ, Demon Slayer)
  - Meta title : `[Produit] Personnalisé | Portrait [Univers] sur Commande — Artpixe`
  - Meta description : 155 caractères avec CTA + délai livraison
- [ ] **Ajouter avis clients** sur les produits cartoon (Simpson, Rick & Morty, Tim Burton)
- [ ] **Investiguer le déclin SEO -81%** : Google Search Console → Pages → identifier les URLs qui ont perdu du trafic
- [ ] **Créer campagne Performance Max** après vérification tracking (€15/jour)
- [ ] **Tester Smart Bidding** (tCPA €25) après accumulation de 30 conversions/mois

---

## 8. ANALYSE OPPORTUNITÉ — SIMPSON

### Pourquoi c'est une vraie opportunité

| Métrique | Valeur |
|----------|--------|
| Volume "portrait simpson personnalisé" | ~480/mois |
| CPC estimé | €0,55–0,80 |
| Concurrence SEO | Faible (peu de boutiques FR spécialisées) |
| Produit existant | ✅ (artpixe.com/products/portrait-simpson-personnalise) |
| URL optimisée | ✅ (fixée cette session) |
| Position Google actuelle | Probablement >20 |

### Actions recommandées pour Simpson

1. **SEO** : Créer une page collection dédiée `/collections/portrait-simpson-personnalise` avec contenu optimisé (300+ mots, FAQ, photos)
2. **Google Ads** : Inclure dans la campagne [S] Portrait Simpson Personnalisé — FR (semaine 2)
3. **Contenu** : Ajouter photos de réalisations clients (avant/après), exemples avec différents nombres de personnages
4. **Mots-clés cibles** : `[portrait simpson personnalisé]`, `[dessin simpson personnalisé]`, `[tableau simpson personnalisé]`, `[cadeau simpson personnalisé]`

---

## 9. MÉTRIQUES DE RÉFÉRENCE (BASELINE ACTUELLE)

### Shopify (12 derniers mois)

| Métrique | Valeur |
|----------|--------|
| Revenus totaux | ~€18 000–22 000 estimés |
| Sessions mensuelles | ~2 500–3 500 |
| Taux de conversion global | ~0,8% |
| Taux de conversion desktop | ~1,8% |
| Taux de conversion mobile | ~0,55% |
| Part trafic mobile | 75,5% |
| Panier moyen | ~€45–55 |
| Pays principal | France (>85%) |

### Google Ads (derniers 3 mois disponibles)

| Métrique | Valeur |
|----------|--------|
| Dépenses mensuelles | ~€65–130 (en baisse) |
| CPA | €16–22 |
| ROAS | 3,8 (Q4 2025, hors anomalie) |
| Campagnes actives | 4–6 |
| Mots-clés actifs | ~594 |

---

## 10. FICHIERS PRODUITS DE LA SESSION

| Fichier | Emplacement | Usage |
|---------|-------------|-------|
| Redirections 301 | `/home/user/HOLA/redirections-301-artpixe.csv` | Importer dans Shopify |
| Ce récapitulatif | `/home/user/HOLA/recapitulatif-artpixe-session.md` | Référence stratégique |

---

*Généré le 03 juin 2026 — Session d'audit et optimisation Artpixe*
