# LinkedIn Skills — pack installé

Source : https://github.com/sergebulaev/linkedin-skills (MIT, Serge Bulaev)
Version : plugin `1.0.32` — commit amont `e99034f` (2026-09-06)

## Emplacement

Les skills sont installés au niveau **projet**, dans `.claude/` :

```
.claude/
├── skills/                  # les 11 skills (auto-découverts par Claude Code)
│   ├── linkedin-post-writer/
│   ├── linkedin-comment-drafter/
│   ├── linkedin-reply-handler/
│   ├── linkedin-humanizer/
│   ├── linkedin-hook-extractor/
│   ├── linkedin-content-planner/
│   ├── linkedin-thread-monitor/
│   ├── linkedin-engager-analytics/
│   ├── linkedin-profile-optimizer/
│   ├── linkedin-employee-advocacy/
│   └── linkedin-repurposer/
├── references/              # base partagée : hook-formulas, voice-rules, founder-topics…
├── lib/                     # helpers Python (url_parser, publora_client, apify_client…)
├── scripts/                 # post_comment.py, schedule_post.py
└── linkedin-skills/         # cette doc + README amont + LICENSE + requirements
```

La hiérarchie n'est pas arbitraire : chaque `SKILL.md` cite ses sources en relatif
(`../../references/hook-formulas.md`). Depuis `.claude/skills/<nom>/`, cela résout
vers `.claude/references/`. Déplacer `references/`, `lib/` ou `scripts/` casse ces liens.

## Portée

- **Ce projet** : les skills sont disponibles dans toute session Claude Code ouverte
  sur ce dépôt, dès le clone.
- **Tous les projets** : deux options, à faire une fois côté compte/machine —
  - claude.ai → **Skills** → *Add from GitHub* → `sergebulaev/linkedin-skills` (se synchronise
    dans toutes les sessions, y compris web) ;
  - en local : `git clone https://github.com/sergebulaev/linkedin-skills.git` puis recopier
    `skills/*` dans `~/.claude/skills/` et `references/`, `lib/`, `scripts/` dans `~/.claude/`.

## Déclenchement automatique

Chaque skill porte une `description` en frontmatter qui sert de règle de routage.
Aucune commande à taper : formuler la demande suffit.

| Demande | Skill activé |
|---|---|
| « écris un post LinkedIn sur X » | `linkedin-post-writer` |
| « commente ce post » + URL | `linkedin-comment-drafter` |
| « réponds à ce commentaire » + URL de commentaire | `linkedin-reply-handler` |
| « humanise / audite ce brouillon » | `linkedin-humanizer` |
| « quel hook utilise ce post viral ? » | `linkedin-hook-extractor` |
| « planifie ma semaine LinkedIn » | `linkedin-content-planner` |
| « quels fils ont eu une réponse ? » | `linkedin-thread-monitor` |
| « qui a aimé / commenté mon post ? » | `linkedin-engager-analytics` |
| « optimise mon profil / mon titre » | `linkedin-profile-optimizer` |
| « lance un programme advocacy pour l'équipe » | `linkedin-employee-advocacy` |
| « transforme cette vidéo / ce tweet en post » | `linkedin-repurposer` |

## Clés API (facultatives)

Le pack rédige et vérifie sans aucune clé. Elles ne servent qu'aux actions distantes :

- `PUBLORA_API_KEY` — publier / programmer posts, commentaires et réponses ;
- `APIFY_TOKEN` — `linkedin-thread-monitor` et `linkedin-engager-analytics` (sans lui,
  ces deux skills basculent en mode « colle la liste toi-même »).

Variables complètes : `env.example.txt`. Dépendances Python des scripts :
`requirements.txt` (`requests`, `python-dotenv`) — à installer seulement si tu publies
via Publora.

## Mise à jour

```bash
git clone --depth 1 https://github.com/sergebulaev/linkedin-skills.git /tmp/ls-upstream
rsync -a --delete /tmp/ls-upstream/skills/     .claude/skills/
rsync -a --delete /tmp/ls-upstream/references/ .claude/references/
rsync -a --delete /tmp/ls-upstream/lib/        .claude/lib/
rsync -a --delete /tmp/ls-upstream/scripts/    .claude/scripts/
```
