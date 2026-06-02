import type { ProspectType } from './types';

const PACKS = `
- Pack Essentiel : fiche Google Business optimisée, photos professionnelles, référencement local
- Pack Pro : Pack Essentiel + gestion réseaux sociaux (Instagram/Facebook), contenu mensuel
- Pack Premium : Pack Pro + site vitrine, publicité Google Ads, bilan mensuel
`;

const EMAIL_TEMPLATES: Record<ProspectType, { subject: string; body: string }> = {
  producteur: {
    subject: '{company} — votre visibilité digitale mérite mieux',
    body: `Bonjour {name},

Je me permets de vous contacter au sujet de la visibilité en ligne de {company}.

Je m'appelle Kyllian, j'ai fondé HelpMe — j'accompagne les TPE et belles structures locales de la région toulousaine sur tout ce qui touche au digital. Je travaille déjà avec des acteurs de la scène locale (brasseurs artisanaux, bars à cocktails...) et je cherche activement de nouveaux secteurs comme le vôtre.

En regardant votre présence en ligne, j'ai vu plusieurs opportunités concrètes pour {company} — notamment sur Google, Instagram et Maps, là où vos clients vous cherchent déjà sans toujours vous trouver.

Ce que je propose :
${PACKS}
Tout est géré de mon côté, vous ne vous occupez de rien techniquement.

Seriez-vous disponible pour un échange de 15 minutes cette semaine ? Je vous ferai un retour honnête sur ce qu'on peut améliorer, sans engagement.

À bientôt,
Kyllian
Fondateur — HelpMe`,
  },
  'commerçant': {
    subject: '{company} à {city} — un potentiel digital sous-exploité',
    body: `Bonjour {name},

Je me permets de vous écrire au sujet de la visibilité en ligne de {company}.

Je m'appelle Kyllian, j'ai créé HelpMe pour accompagner les commerçants et TPE de la région toulousaine sur le digital. Je travaille déjà avec des acteurs locaux (brasseurs artisanaux, bars à cocktails...) et je cherche des nouveaux secteurs comme le vôtre — des projets avec du sens, pas des grandes chaînes.

Ce qui m'a poussé à vous contacter : {company} mérite clairement plus de visibilité. Vos clients potentiels vous cherchent sur Google et les réseaux, et aujourd'hui ils ne vous trouvent pas toujours facilement.

Ce que je mets en place :
${PACKS}
Tout est géré de mon côté, vous vous concentrez sur votre commerce.

Avez-vous 15 minutes cette semaine pour qu'on en parle ? Je vous ferai un audit gratuit de votre situation actuelle.

À bientôt,
Kyllian
Fondateur — HelpMe`,
  },
  artisan: {
    subject: 'Faire connaître {company} à {city} — j\'ai une idée',
    body: `Bonjour {name},

Je me permets de vous contacter concernant la visibilité de {company} en ligne.

Je m'appelle Kyllian, j'ai monté HelpMe pour accompagner les artisans et TPE de la région toulousaine sur le digital. Je travaille déjà avec des acteurs locaux (brasseurs, bars à cocktails...) et je cherche des artisans avec du vrai savoir-faire à mettre en avant — c'est clairement votre cas.

La plupart de vos futurs clients vous cherchent sur Google avant d'appeler. Mon rôle c'est de faire en sorte qu'ils trouvent {company} en premier, pas vos concurrents.

Ce que je propose :
${PACKS}
Tout géré de mon côté — vous vous concentrez sur votre métier.

Seriez-vous disponible 15 minutes cette semaine pour un audit gratuit ?

À bientôt,
Kyllian
Fondateur — HelpMe`,
  },
};

const SMS_TEMPLATES: Record<ProspectType, string> = {
  producteur: `Bonjour {name}, c'est Kyllian, fondateur de HelpMe. Je travaille avec des acteurs locaux toulousains et je cherche des projets comme le vôtre à mettre en avant sur Google et les réseaux. Dispo pour un appel rapide ? 📞`,
  'commerçant': `Bonjour {name}, c'est Kyllian de HelpMe — je travaille déjà avec des brasseurs, bars à cocktails de Toulouse et je cherche de nouveaux secteurs. Audit digital gratuit pour {company} ? Répondez OUI 😊`,
  artisan: `Bonjour {name}, c'est Kyllian, fondateur de HelpMe. Je mets en avant les artisans toulousains sur Google et les réseaux. Votre travail mérite d'être trouvé. Audit gratuit offert — dispo 10 min ? 📞`,
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
  producteur: `Bonjour, je m'appelle Kyllian, j'ai fondé HelpMe — une boîte que j'ai montée pour aider les producteurs et TPE de la région à être mieux visibles sur internet. Je vous contacte car j'ai vu {company} et j'ai trouvé votre projet vraiment intéressant. C'est bien {name} que j'ai en ligne ?`,
  'commerçant': `Bonjour, c'est Kyllian, je suis le fondateur de HelpMe — j'aide les commerçants et TPE de la région à se développer sur le digital. Je souhaitais échanger avec la personne qui gère {company} à {city}. C'est bien vous ?`,
  artisan: `Bonjour, je m'appelle Kyllian, j'ai créé HelpMe pour accompagner les artisans comme vous à être mieux trouvés sur Google. Je voulais parler avec {name} de {company} — c'est bien vous ?`,
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

// ── WhatsApp templates ─────────────────────────────────────────────────────────

const WHATSAPP_TEMPLATES: Record<ProspectType, string> = {
  producteur: `Salut 👋

C'est Kyllian, je suis du nord toulousain. J'ai monté *HelpMe* pour aider les TPE et beaux projets locaux à exister vraiment sur le digital.

Je travaille déjà avec des acteurs de la scène toulousaine — brasseurs artisanaux, bars à cocktails... et je cherche activement de nouveaux secteurs comme le vôtre 🌱

Je suis tombé sur *{company}* et franchement ça m'a parlé tout de suite. C'est exactement le genre de projet que j'aime porter — et pourtant on vous trouve à peine sur internet, dommage 😅

Google, Instagram, Maps... je m'occupe de tout pour que vos vrais clients vous trouvent enfin.

Vous seriez dispo 15 min cette semaine ? Juste pour voir ce qu'on peut faire ensemble 🙌

Kyllian — HelpMe`,

  'commerçant': `Salut 👋

C'est Kyllian, je suis du nord de Toulouse. J'ai créé *HelpMe* pour mettre en avant les bons projets locaux sur le digital.

Je bosse déjà avec des acteurs toulousains — brasseurs, bars à cocktails, artisans... et je cherche des nouveaux secteurs comme le vôtre ✨

Je suis passé sur *{company}* et j'ai trouvé ça vraiment chouette — c'est le genre d'enseigne que j'aime défendre, pas les grandes chaînes.

Les meilleurs commerces sont souvent les moins visibles en ligne. Je change ça : Google Business, réseaux sociaux, Maps — tout clé en main.

Vous avez 15 min cette semaine pour qu'on échange ? 🙌

Kyllian — HelpMe`,

  artisan: `Salut 👋

C'est Kyllian, je suis du nord toulousain. J'ai fondé *HelpMe* pour accompagner les TPE et artisans de la région sur le digital.

Je travaille déjà avec des acteurs locaux — brasseurs, bars à cocktails... et je cherche des artisans comme vous avec du vrai savoir-faire à mettre en avant 🔨

J'ai vu le travail de *{company}* et c'est du sérieux ✨ Ce genre de boulot mérite d'être trouvé facilement sur Google, pas d'être invisible.

Je m'occupe de tout : fiche Google, réseaux sociaux, photos pros — vous vous concentrez sur votre métier.

On peut échanger 15 min cette semaine ? Sans engagement, juste pour voir 🙌

Kyllian — HelpMe`,
};

// ── Message generator ──────────────────────────────────────────────────────────

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export function generateMessage(
  type: ProspectType,
  messageType: 'email' | 'sms' | 'whatsapp',
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

  if (messageType === 'whatsapp') {
    return { body: substitute(WHATSAPP_TEMPLATES[type] || WHATSAPP_TEMPLATES['commerçant'], vars) };
  }

  const tpl = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES['commerçant'];
  return {
    subject: substitute(tpl.subject, vars),
    body: substitute(tpl.body, vars),
  };
}
