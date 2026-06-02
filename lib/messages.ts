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
  producteur: `Bonjour, c'est Kyllian, je suis du nord de Toulouse, je travaille avec des producteurs et petites structures locales sur la partie digitale. Je vous appelle car je suis tombé sur {company} et ça m'a vraiment parlé. C'est bien {name} que j'ai en ligne ?`,
  'commerçant': `Bonjour, c'est Kyllian, je suis du nord de Toulouse. Je travaille avec des commerçants et TPE locaux sur tout ce qui touche au digital. Je vous appelle car j'ai vu {company} et j'ai trouvé ça vraiment bien. C'est vous qui gérez ?`,
  artisan: `Bonjour, c'est Kyllian, je suis du nord de Toulouse. J'accompagne des artisans et TPE de la région sur la partie digitale. Je vous appelle car j'ai vu le travail de {company} et ça m'a vraiment impressionné. C'est bien {name} ?`,
};

const ACCROCHE: Record<ProspectType, string> = {
  producteur: `Super ! Je vous appelle juste pour voir si on pourrait se retrouver 20-30 minutes, en physique, sur votre site ou autour de Toulouse. Pas pour vous vendre quoi que ce soit — juste pour vous montrer ce que je fais concrètement et voir si ça peut vous servir. Vous seriez dispo cette semaine ou la semaine prochaine ?`,
  'commerçant': `Parfait ! Je vous appelle simplement pour qu'on se retrouve en physique, 20-30 minutes, chez vous ou autour de Toulouse. L'idée c'est juste de se rencontrer, voir ce que vous faites de près et vous montrer comment je travaille. Vous auriez un créneau cette semaine ?`,
  artisan: `Super ! Je vous contacte juste pour qu'on puisse se voir, 20-30 minutes, sur votre atelier ou quelque part autour de Toulouse. Je préfère toujours rencontrer les gens avant tout — voir votre travail en vrai, vous expliquer ce que je fais. Vous seriez dispo cette semaine ?`,
};

const OBJECTIONS: Record<ProspectType, string> = {
  producteur: `Objections courantes :

💬 "C'est quoi exactement ce que vous faites ?"
→ "Je préfère vous le montrer en vrai plutôt que l'expliquer au téléphone — c'est beaucoup plus parlant. C'est pour ça que je vous propose qu'on se voie."

💬 "J'ai pas trop le temps"
→ "Je vous prends 20 minutes max, pas plus. Et je me déplace chez vous si c'est plus simple."

💬 "J'ai déjà quelqu'un pour ça"
→ "Pas de souci, je viens juste en curieux. Ça peut toujours être intéressant de voir ce qui se fait."

💬 "Envoyez-moi un email d'abord"
→ "Je peux le faire, mais honnêtement une rencontre de 20 minutes vaut mieux que 10 emails. Je me déplace, c'est moi qui me bouge."`,
  'commerçant': `Objections courantes :

💬 "C'est quoi exactement ?"
→ "Je préfère vous montrer en vrai plutôt qu'expliquer au téléphone. Juste 20 minutes chez vous, c'est tout."

💬 "J'ai pas le temps"
→ "20 minutes, je me déplace, et on voit ensemble ce que ça peut donner pour {company}. Vous choisissez le créneau."

💬 "J'ai déjà quelqu'un"
→ "C'est bien ! Je viens juste en curieux, même pour voir ce que vous avez mis en place. Ça m'intéresse aussi."

💬 "Envoyez un devis d'abord"
→ "Je travaille pas comme ça — je préfère qu'on se voie, comprendre votre situation, et après je vous fais quelque chose de personnalisé."`,
  artisan: `Objections courantes :

💬 "Vous faites quoi exactement ?"
→ "Je préfère vous montrer en vrai — 20 minutes chez vous et c'est beaucoup plus clair qu'une explication au téléphone."

💬 "J'ai pas le temps"
→ "Je me déplace, 20 minutes max. Vous dites quand, je m'adapte."

💬 "J'ai pas besoin de ça"
→ "C'est possible ! Mais je viens juste voir votre travail de toute façon, ça m'intéresse vraiment. Et après on voit ensemble si ça a du sens."

💬 "Envoyez-moi quelque chose par écrit"
→ "Je préfère d'abord vous voir pour comprendre ce que vous faites. Comme ça ce que je vous envoie sera vraiment adapté à vous."`,
};

const CLOSING: Record<ProspectType, string> = {
  producteur: `"Parfait {name} ! Vous seriez plutôt dispo en début de semaine ou en fin de semaine ?
[ Attendre la réponse — proposer deux créneaux précis ]

Parfait, on se retrouve le [jour] à [heure] chez vous à {city}. Je confirme ça par SMS.

À très vite !"`,
  'commerçant': `"Super {name} ! Vous préférez en semaine ou le week-end ?
[ Attendre la réponse ]

Nickel, je passe chez {company} le [jour] à [heure]. Je vous envoie un SMS pour confirmer.

À très vite !"`,
  artisan: `"Parfait ! Je peux passer à {city} — vous seriez plutôt dispo le matin ou l'après-midi ?
[ Attendre la réponse ]

C'est noté, le [jour] à [heure]. Je confirme par SMS.

À bientôt {name} !"`,
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
      tip: 'Souriez en parlant, ça s\'entend. Attendez qu\'ils confirment leur identité avant de continuer.',
    },
    {
      id: 'accroche',
      label: 'Objectif : RDV physique',
      icon: '🎯',
      color: 'border-purple-500/40 bg-purple-500/5',
      content: sub(ACCROCHE[t]),
      tip: 'Allez droit au but — vous voulez juste vous rencontrer. Pas de pitch au téléphone.',
    },
    {
      id: 'objections',
      label: 'Si ça résiste',
      icon: '🛡️',
      color: 'border-orange-500/40 bg-orange-500/5',
      content: sub(OBJECTIONS[t]),
      tip: 'Ne défendez jamais. Ramenez toujours à la rencontre physique, courte et sans pression.',
    },
    {
      id: 'closing',
      label: 'Fixer le créneau',
      icon: '📅',
      color: 'border-brand-blue/40 bg-brand-blue/5',
      content: sub(CLOSING[t]),
      tip: 'Proposez deux créneaux précis. Une fois le oui obtenu, raccrochez vite — avant qu\'ils changent d\'avis !',
    },
  ];
}

// ── WhatsApp templates ─────────────────────────────────────────────────────────

const WHATSAPP_TEMPLATES: Record<ProspectType, string> = {
  producteur: `Salut 👋

C'est Kyllian, je suis du nord toulousain (Bruguières). J'ai monté ma boîte HelpMe pour aider les TPE et beaux projets locaux à exister vraiment sur le digital.

Je travaille déjà avec des acteurs de la scène toulousaine, brasseurs artisanaux, bars... et je cherche activement de nouveaux secteurs comme le vôtre 🌱

Je suis tombé sur {company} et franchement ça m'a parlé tout de suite. C'est exactement le genre de projet que j'aime porter !

Google, Instagram, Maps... je m'occupe de tout pour que vos vrais clients vous trouvent enfin.

Vous seriez dispo 5 min cette semaine pour un appel ou même se rencontrer ? Juste pour voir ce qu'on peut faire ensemble 🙌

Kyllian
HelpMe`,

  'commerçant': `Salut 👋

C'est Kyllian, je suis du nord toulousain (Bruguières). J'ai monté ma boîte HelpMe pour aider les TPE et beaux projets locaux à exister vraiment sur le digital.

Je travaille déjà avec des acteurs de la scène toulousaine, brasseurs artisanaux, bars... et je cherche activement de nouveaux secteurs comme le vôtre ✨

Je suis tombé sur {company} et franchement ça m'a parlé tout de suite. C'est exactement le genre de projet que j'aime porter !

Google, Instagram, Maps... je m'occupe de tout pour que vos vrais clients vous trouvent enfin.

Vous seriez dispo 5 min cette semaine pour un appel ou même se rencontrer ? Juste pour voir ce qu'on peut faire ensemble 🙌

Kyllian
HelpMe`,

  artisan: `Salut 👋

C'est Kyllian, je suis du nord toulousain (Bruguières). J'ai monté ma boîte HelpMe pour aider les TPE et beaux projets locaux à exister vraiment sur le digital.

Je travaille déjà avec des acteurs de la scène toulousaine, brasseurs artisanaux, bars... et je cherche des artisans avec du vrai savoir-faire à mettre en avant 🔨

Je suis tombé sur {company} et franchement ça m'a parlé tout de suite. C'est exactement le genre de projet que j'aime porter !

Google, Instagram, Maps... je m'occupe de tout pour que vos vrais clients vous trouvent enfin.

Vous seriez dispo 5 min cette semaine pour un appel ou même se rencontrer ? Juste pour voir ce qu'on peut faire ensemble 🙌

Kyllian
HelpMe`,
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
