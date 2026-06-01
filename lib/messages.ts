import type { ProspectType } from './types';

const PACKS = `
- Pack Essentiel : fiche Google Business optimisée, photos professionnelles, référencement local
- Pack Pro : Pack Essentiel + gestion réseaux sociaux (Instagram/Facebook), contenu mensuel
- Pack Premium : Pack Pro + site vitrine, publicité Google Ads, bilan mensuel
`;

const EMAIL_TEMPLATES: Record<ProspectType, { subject: string; body: string }> = {
  producteur: {
    subject: 'Boostez la visibilité de {company} avec HelpMe',
    body: `Bonjour {name},

Je me permets de vous contacter au sujet de la visibilité en ligne de {company} à {city}.

Chez HelpMe, nous accompagnons les producteurs locaux avec des packs clé en main pour être trouvés par vos clients :
${PACKS}
En tant que producteur, vos clients cherchent vos produits directement sur Google et les réseaux sociaux. Nos packs vous permettent d'être visible là où ils cherchent, sans vous soucier de la technique.

Seriez-vous disponible pour un échange de 15 minutes cette semaine afin que je vous présente ce qu'on pourrait faire pour {company} ?

Cordialement,
L'équipe HelpMe`,
  },
  'commerçant': {
    subject: 'Développez votre clientèle locale avec HelpMe — {company}',
    body: `Bonjour {name},

J'ai remarqué que {company} à {city} mérite une meilleure visibilité en ligne pour attirer plus de clients locaux.

HelpMe propose des packs visibilité clé en main adaptés aux commerçants :
${PACKS}
Nos clients commerçants voient en moyenne +40% de visites en magasin dans les 3 mois suivant le démarrage. Tout est géré par notre équipe, vous n'avez rien à faire techniquement.

Je serais ravi(e) de vous présenter un audit gratuit de votre visibilité actuelle. Avez-vous 15 minutes cette semaine ?

Cordialement,
L'équipe HelpMe`,
  },
  artisan: {
    subject: 'Trouvez plus de clients à {city} — HelpMe pour {company}',
    body: `Bonjour {name},

Je me permets de vous contacter concernant la visibilité en ligne de {company} à {city}.

Chez HelpMe, nous aidons les artisans à être trouvés facilement sur Google par des clients proches de chez eux :
${PACKS}
La plupart de vos futurs clients vous cherchent sur Google avant d'appeler. Nos packs vous permettent d'apparaître en premier, de collecter des avis et de vous démarquer sans effort de votre part.

Seriez-vous disponible 15 minutes cette semaine pour un audit gratuit de votre présence en ligne ?

Cordialement,
L'équipe HelpMe`,
  },
};

const SMS_TEMPLATES: Record<ProspectType, string> = {
  producteur: `Bonjour {name}, je suis de l'équipe HelpMe. On aide les producteurs comme vous à être trouvés sur Google et les réseaux. Dispo pour un appel rapide ? 📞`,
  'commerçant': `Bonjour {name}, HelpMe propose des packs visibilité clé en main pour les commerçants de {city}. Intéressé(e) par un audit gratuit ? Répondez OUI 😊`,
  artisan: `Bonjour {name}, HelpMe aide les artisans à {city} à être trouvés sur Google. Audit gratuit offert. Dispo pour un appel de 10 min ? 📞`,
};

// ── Script téléphonique ────────────────────────────────────────────────────────

export interface PhoneScriptStep {
  id: string;
  label: string;
  icon: string;
  color: string;
  content: string;
  tip?: string;
}

const INTRO: Record<ProspectType, string> = {
  producteur: `Bonjour, je suis [Votre prénom] de l'agence HelpMe à Toulouse. Je vous contacte car on accompagne les producteurs locaux comme {company} à développer leur visibilité sur internet. Est-ce que vous êtes {name} ?`,
  'commerçant': `Bonjour, je suis [Votre prénom] de l'agence HelpMe à Toulouse. On travaille avec des commerçants de {city} pour les aider à attirer plus de clients locaux. Je souhaitais échanger avec la personne qui gère {company}, c'est bien vous ?`,
  artisan: `Bonjour, je suis [Votre prénom] de l'agence HelpMe à Toulouse. On accompagne des artisans comme vous à {city} pour qu'ils soient mieux trouvés sur Google. Je souhaitais parler avec {name} de {company}, c'est bien vous ?`,
};

const ACCROCHE: Record<ProspectType, string> = {
  producteur: `Super ! Je vous appelle car beaucoup de vos clients potentiels cherchent des producteurs locaux directement sur Google, et j'ai regardé votre présence en ligne — il y a clairement des opportunités pour {company}. J'aurais besoin de 2 minutes pour vous poser quelques questions, vous avez un instant ?`,
  'commerçant': `Parfait ! Je vous appelle car on voit que les commerces à {city} qui ont une bonne présence en ligne font jusqu'à 40% de visites en plus. J'ai regardé rapidement {company} et il y a des choses simples à mettre en place. Vous avez 2 minutes ?`,
  artisan: `Super ! Je vous contacte car on voit que de nombreux clients cherchent des artisans sur Google avant d'appeler, et la plupart des artisans à {city} ne sont pas encore bien positionnés. C'est une vraie opportunité pour {company}. Vous avez 2 minutes ?`,
};

const DECOUVERTE: Record<ProspectType, string> = {
  producteur: `Quelques questions rapides :
→ "Est-ce que vos clients vous trouvent facilement sur internet aujourd'hui ?"
→ "Vous avez une fiche Google Business ? Elle est à jour avec vos horaires et produits ?"
→ "Est-ce que vous êtes présent sur Instagram ou Facebook pour montrer votre production ?"
→ "D'où viennent principalement vos nouveaux clients en ce moment ?"

[ Écoutez attentivement et notez les manques. ]`,
  'commerçant': `Quelques questions rapides :
→ "Si un nouveau client cherche '{category}' sur Google à {city}, il vous trouve facilement ?"
→ "Vous avez des avis Google ? Combien à peu près ?"
→ "Vous avez un site internet ou une page Facebook active ?"
→ "Aujourd'hui vos nouveaux clients, ils vous trouvent comment ?"

[ Chaque "non" ou "je sais pas" est un levier à activer. ]`,
  artisan: `Quelques questions rapides :
→ "Quand quelqu'un cherche un {category} à {city} sur Google, vous apparaissez ?"
→ "Vous avez une fiche Google Business ? Elle a des avis clients ?"
→ "Est-ce que vous avez un site ou une page Facebook ?"
→ "Comment vos clients vous trouvent en ce moment — bouche à oreille surtout ?"

[ Notez les points de faiblesse pour personnaliser votre pitch. ]`,
};

const PITCH: Record<ProspectType, string> = {
  producteur: `"Très bien, justement c'est exactement ce qu'on règle chez HelpMe. On a 3 formules adaptées aux producteurs :

🟢 Pack Essentiel — On optimise votre fiche Google, on fait des photos pro de vos produits et on vous positionne dans les recherches locales. À partir de 149€/mois.

🔵 Pack Pro — En plus, on gère vos réseaux sociaux (Instagram & Facebook), on crée du contenu sur votre production chaque mois. À partir de 249€/mois.

⭐ Pack Premium — Le tout + un site vitrine, de la pub Google Ads et un bilan mensuel. À partir de 399€/mois.

Tout est clé en main, vous n'avez rien à gérer. Nos clients producteurs voient leurs premières demandes en ligne en moins d'un mois."`,
  'commerçant': `"C'est exactement pour ça que je vous appelle. Chez HelpMe on a des packs conçus pour les commerçants :

🟢 Pack Essentiel — Fiche Google optimisée, photos pro de votre commerce, référencement local. À partir de 149€/mois.

🔵 Pack Pro — En plus on gère vos réseaux sociaux et on crée du contenu mensuel pour votre enseigne. À partir de 249€/mois.

⭐ Pack Premium — Le tout + site vitrine, pub Google Ads et bilan mensuel. À partir de 399€/mois.

On travaille déjà avec des commerçants à {city}, ils ont vu +40% de trafic en boutique. Et vous ne gérez rien, on s'occupe de tout."`,
  artisan: `"C'est exactement ce qu'on résout. Chez HelpMe on accompagne les artisans comme vous :

🟢 Pack Essentiel — Fiche Google complète avec photos pro, positionnement dans les recherches de votre zone. À partir de 149€/mois.

🔵 Pack Pro — En plus, gestion de vos réseaux sociaux et publications mensuelles de vos réalisations. À partir de 249€/mois.

⭐ Pack Premium — Le tout + site vitrine pour présenter vos chantiers, pub Google Ads ciblée, bilan mensuel. À partir de 399€/mois.

Résultat : vos clients vous trouvent avant vos concurrents. Et vous n'avez rien à gérer côté communication."`,
};

const OBJECTIONS: Record<ProspectType, string> = {
  producteur: `Objections fréquentes :

💬 "C'est trop cher"
→ "Je comprends. Dites-moi, si vous gagnez 3 ou 4 nouveaux clients réguliers grâce à ça, c'est rentabilisé en combien de temps ? On commence par le Pack Essentiel à 149€, sans engagement."

💬 "J'ai pas le temps de m'en occuper"
→ "C'est justement pourquoi on existe — vous n'avez rien à faire. On gère tout, vous vous occupez de votre production."

💬 "Je passe déjà par le bouche-à-oreille, ça suffit"
→ "Le bouche-à-oreille c'est excellent, mais vos clients en parlent aussi sur Google. Si votre fiche n'est pas là, vous ratez ces recommandations numériques."

💬 "J'ai déjà quelqu'un pour ça"
→ "D'accord, et est-ce que vous êtes satisfait des résultats ? Je vous propose juste un audit gratuit pour voir s'il y a des points à améliorer, sans engagement."`,
  'commerçant': `Objections fréquentes :

💬 "C'est trop cher"
→ "Je comprends. Si on vous amène 5 nouveaux clients par mois grâce à Google, ça couvre largement les 149€. Et on peut commencer petit avec le Pack Essentiel sans engagement."

💬 "J'ai pas de temps"
→ "Justement — vous ne faites rien. On gère tout de A à Z : photos, rédaction, publication. Votre seul rôle c'est de valider ce qu'on produit."

💬 "Internet c'est pas pour moi"
→ "Vos clients sont sur internet, même s'ils ne vous le disent pas. 80% des gens regardent Google avant d'entrer dans un magasin. Si vous n'êtes pas là, c'est votre concurrent qu'ils appellent."

💬 "Je réfléchis"
→ "Bien sûr ! Pour ne pas partir dans le vide, on vous propose un audit gratuit de votre visibilité actuelle — ça prend 20 minutes et vous repartez avec des recommandations concrètes."`,
  artisan: `Objections fréquentes :

💬 "J'ai déjà assez de travail"
→ "C'est une excellente position ! Mais quand votre carnet se libère, vos clients seront là grâce à votre visibilité Google. Mieux vaut anticiper que chercher en urgence."

💬 "C'est trop cher"
→ "Un seul chantier trouvé via Google couvre souvent plusieurs mois d'abonnement. Et on commence à 149€ sans engagement."

💬 "J'ai pas de site, c'est compliqué"
→ "Pas du tout — on part de zéro avec vous. La fiche Google seule suffit pour commencer à être trouvé."

💬 "Je vais en parler à ma femme / mon associé"
→ "Bien sûr ! Et pour vous aider à en parler, je vous envoie notre présentation par email. Je peux aussi faire un audit gratuit pour montrer concrètement ce qui manque."`,
};

const CLOSING: Record<ProspectType, string> = {
  producteur: `"Très bien {name}, ce que je vous propose c'est qu'on se retrouve 20 minutes — en visio ou à {city} si vous préférez — pour vous montrer concrètement ce qu'on ferait pour {company}. C'est gratuit et sans engagement.

Est-ce que vous seriez disponible cette semaine, plutôt en début de semaine ou en fin de semaine ?
[ Proposez deux créneaux précis, ex: mardi à 10h ou jeudi à 14h ]

Parfait ! Je vous envoie une confirmation par SMS avec le lien de visio. Et si jamais vous avez des questions avant, mon numéro c'est le [votre numéro]. À très vite {name} !"`,
  'commerçant': `"Parfait {name} ! Ce que je vous propose c'est un audit gratuit de 20 minutes — je regarde votre présence en ligne en direct avec vous et je vous montre ce qu'on peut améliorer. Sans engagement.

Vous seriez dispo cette semaine ? Plutôt le matin ou l'après-midi ?
[ Proposez deux créneaux précis ]

Super ! Je vous confirme ça par SMS. Et n'hésitez pas à m'appeler directement si vous avez des questions : [votre numéro]. À très vite !"`,
  artisan: `"Super {name} ! Je vous propose un audit gratuit de 20 minutes par téléphone ou en visio — on regarde ensemble votre visibilité Google et je vous explique ce qu'on ferait concrètement pour {company}. Sans aucun engagement.

Cette semaine vous êtes disponible ? Le matin ou l'après-midi ?
[ Proposez deux créneaux précis ]

Parfait ! Je vous envoie la confirmation par SMS. Mon numéro direct c'est [votre numéro] si besoin. À bientôt {name} !"`,
};

export function generatePhoneScript(
  type: ProspectType,
  name: string,
  company: string,
  city: string,
  category: string
): PhoneScriptStep[] {
  const t = EMAIL_TEMPLATES[type] ? type : 'commerçant';
  const vars: Record<string, string> = {
    name: name || 'vous',
    company: company || 'votre entreprise',
    city: city || 'votre ville',
    category: category || 'votre activité',
  };
  const sub = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`);

  return [
    {
      id: 'intro',
      label: 'Introduction',
      icon: '👋',
      color: 'border-blue-500/40 bg-blue-500/5',
      content: sub(INTRO[t]),
      tip: 'Souriez en parlant — ça s\'entend au téléphone. Attendez confirmation avant de continuer.',
    },
    {
      id: 'accroche',
      label: 'Accroche',
      icon: '🎯',
      color: 'border-purple-500/40 bg-purple-500/5',
      content: sub(ACCROCHE[t]),
      tip: 'Si la personne est pressée : "Je peux vous rappeler quand vous voulez, quand est-ce le mieux ?"',
    },
    {
      id: 'decouverte',
      label: 'Découverte des besoins',
      icon: '🔍',
      color: 'border-yellow-500/40 bg-yellow-500/5',
      content: sub(DECOUVERTE[t]),
      tip: 'Écoutez plus que vous ne parlez. Chaque "non" est une opportunité.',
    },
    {
      id: 'pitch',
      label: 'Présentation de l\'offre',
      icon: '💼',
      color: 'border-green-500/40 bg-green-500/5',
      content: sub(PITCH[t]),
      tip: 'Adaptez le pack selon ce que vous avez découvert. Ne proposez pas tout d\'un coup.',
    },
    {
      id: 'objections',
      label: 'Gestion des objections',
      icon: '🛡️',
      color: 'border-orange-500/40 bg-orange-500/5',
      content: sub(OBJECTIONS[t]),
      tip: 'Ne défendez jamais, reformulez et retournez avec une question ou un bénéfice.',
    },
    {
      id: 'closing',
      label: 'Prise de RDV',
      icon: '📅',
      color: 'border-brand-blue/40 bg-brand-blue/5',
      content: sub(CLOSING[t]),
      tip: 'Proposez TOUJOURS deux créneaux précis — jamais "quand vous voulez".',
    },
  ];
}

// ── Message generator ──────────────────────────────────────────────────────────

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export function generateMessage(
  type: ProspectType,
  messageType: 'email' | 'sms',
  name: string,
  company: string,
  city: string
): { subject?: string; body: string } {
  const vars = {
    name: name || 'vous',
    company: company || 'votre entreprise',
    city: city || 'votre ville',
  };

  if (messageType === 'sms') {
    return { body: substitute(SMS_TEMPLATES[type] || SMS_TEMPLATES['commerçant'], vars) };
  }

  const tpl = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES['commerçant'];
  return {
    subject: substitute(tpl.subject, vars),
    body: substitute(tpl.body, vars),
  };
}
