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
  producteur: `Bonjour {name}, c'est Kyllian de HelpMe. Je fais des audits digitaux gratuits chez les producteurs locaux — je me déplace, 20 min, sans engagement. Ça vous intéresse ? 📞`,
  'commerçant': `Bonjour {name}, c'est Kyllian de HelpMe. Je propose des audits gratuits pour les commerçants de la région — je viens chez vous, 20 min, pour voir ce qu'on peut améliorer sur votre visibilité. Dispo cette semaine ? 😊`,
  artisan: `Bonjour {name}, c'est Kyllian de HelpMe. J'offre des audits digitaux gratuits aux artisans de la région — je me déplace chez vous, 20 min, sans engagement. Ça vous intéresse ? 📞`,
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
  producteur: `Bonjour, je me présente Kyllian. J'habite dans le nord Toulousain et j'accompagne des producteurs et petites entreprises locales à mieux se faire connaître sur internet.

Je suis tombé sur {company} en regardant ce qui se faisait dans le coin, et j'ai trouvé votre activité vraiment sympa. Je me suis dit que ce serait plus simple de vous appeler directement.

Est-ce que vous auriez deux petites minutes pour échanger ?

S'ils répondent "Oui, dites-moi" :
Merci. Aujourd'hui, vous avez déjà quelqu'un qui vous accompagne sur votre visibilité en ligne, ou c'est quelque chose que vous gérez vous-même quand vous avez le temps ?`,
  'commerçant': `Bonjour, je me présente Kyllian. J'habite dans le nord Toulousain et j'accompagne des commerçants et petites entreprises locales à mieux se faire connaître sur internet.

Je suis tombé sur {company} en regardant ce qui se faisait dans le coin, et j'ai trouvé votre activité vraiment sympa. Je me suis dit que ce serait plus simple de vous appeler directement.

Est-ce que vous auriez deux petites minutes pour échanger ?

S'ils répondent "Oui, dites-moi" :
Merci. Aujourd'hui, vous avez déjà quelqu'un qui vous accompagne sur votre visibilité en ligne, ou c'est quelque chose que vous gérez vous-même quand vous avez le temps ?`,
  artisan: `Bonjour, je me présente Kyllian. J'habite dans le nord Toulousain et j'accompagne des artisans et petites entreprises locales à mieux se faire connaître sur internet.

Je suis tombé sur {company} en regardant ce qui se faisait dans le coin, et j'ai trouvé votre travail vraiment sympa. Je me suis dit que ce serait plus simple de vous appeler directement.

Est-ce que vous auriez deux petites minutes pour échanger ?

S'ils répondent "Oui, dites-moi" :
Merci. Aujourd'hui, vous avez déjà quelqu'un qui vous accompagne sur votre visibilité en ligne, ou c'est quelque chose que vous gérez vous-même quand vous avez le temps ?`,
};

const ACCROCHE: Record<ProspectType, string> = {
  producteur: `Super ! Je vous appelle pour vous proposer un audit gratuit — je viens chez vous, on regarde ensemble votre présence en ligne en 20-30 minutes et je vous dis exactement ce qui manque. Pas d'engagement, pas de vente, juste un regard neuf sur votre visibilité. Vous seriez dispo cette semaine ou la semaine prochaine ?`,
  'commerçant': `Parfait ! Je vous propose un audit gratuit — je passe chez vous, 20-30 minutes, on regarde ensemble votre présence sur Google, les réseaux, Maps... et je vous dis ce qu'on peut améliorer. C'est gratuit, sans engagement. Vous auriez un créneau cette semaine ?`,
  artisan: `Super ! Je vous propose un audit gratuit — je me déplace chez vous ou sur votre chantier, 20-30 minutes, on regarde ensemble votre visibilité en ligne et je vous dis concrètement ce qui peut changer. Zéro engagement. Vous seriez dispo cette semaine ?`,
};

const OBJECTIONS: Record<ProspectType, string> = {
  producteur: `Objections courantes :

💬 "C'est quoi exactement cet audit ?"
→ "Je viens chez vous, on regarde votre fiche Google, vos réseaux, comment on vous trouve — et je vous dis ce qui manque. Ça prend 20 minutes, c'est gratuit et sans aucune obligation."

💬 "J'ai pas trop le temps"
→ "Je me déplace chez vous, 20 minutes max. Vous choisissez le créneau."

💬 "J'ai déjà quelqu'un pour ça"
→ "Pas de souci ! L'audit est gratuit de toute façon — même pour avoir un deuxième avis, ça peut être utile."

💬 "Envoyez-moi un email d'abord"
→ "Je préfère d'abord vous rencontrer — l'audit en vrai est beaucoup plus utile qu'un email générique. Et c'est moi qui me déplace."`,
  'commerçant': `Objections courantes :

💬 "C'est quoi cet audit ?"
→ "Je viens chez vous, 20 minutes, on regarde ensemble comment vous apparaissez sur Google et les réseaux. Je vous dis ce qui manque. C'est gratuit, sans aucun engagement."

💬 "J'ai pas le temps"
→ "20 minutes, je me déplace, vous choisissez le créneau. Même un samedi matin si c'est plus simple."

💬 "J'ai déjà quelqu'un"
→ "C'est bien ! L'audit est gratuit de toute façon, même pour avoir un autre regard sur ce qui est déjà en place."

💬 "Envoyez un devis d'abord"
→ "L'audit c'est justement pour ça — sans le voir en vrai, je ne peux pas vous faire quelque chose de sérieux. Et c'est gratuit."`,
  artisan: `Objections courantes :

💬 "C'est quoi un audit ?"
→ "Je viens vous voir, 20 minutes, on regarde comment vous apparaissez sur Google quand quelqu'un cherche votre métier dans la région. Je vous dis ce qu'on peut améliorer. Gratuit, sans engagement."

💬 "J'ai pas le temps"
→ "Je me déplace chez vous, 20 minutes. Vous dites quand, je m'adapte."

💬 "J'ai pas besoin de ça"
→ "C'est possible ! Mais l'audit est gratuit — au pire vous saurez exactement où vous en êtes, et c'est déjà utile."

💬 "Envoyez quelque chose par écrit"
→ "Je préfère d'abord voir votre situation en vrai pour que ce que je vous envoie soit vraiment pertinent. Et ça ne vous coûte rien."`,
};

const CLOSING: Record<ProspectType, string> = {
  producteur: `"Parfait {name} ! Vous seriez plutôt dispo en début de semaine ou en fin de semaine ?
[ Attendre la réponse — proposer deux créneaux précis ]

Nickel, je viens faire l'audit le [jour] à [heure] chez vous à {city}. Je confirme par SMS.

À très vite !"`,
  'commerçant': `"Super {name} ! Vous préférez en semaine ou le week-end ?
[ Attendre la réponse ]

C'est noté, je passe faire l'audit chez {company} le [jour] à [heure]. SMS de confirmation dans la foulée.

À très vite !"`,
  artisan: `"Parfait ! Je peux venir à {city} — vous seriez plutôt dispo le matin ou l'après-midi ?
[ Attendre la réponse ]

C'est noté, audit le [jour] à [heure]. Je confirme par SMS.

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

Je vous propose un audit gratuit, je me déplace chez vous, 20-30 min, pour regarder ensemble votre visibilité en ligne et vous dire exactement ce qui manque. Zéro engagement.

Vous seriez dispo cette semaine ? 🙌

Kyllian
HelpMe`,

  'commerçant': `Salut 👋

C'est Kyllian, je suis du nord toulousain (Bruguières). J'ai monté ma boîte HelpMe pour aider les TPE et beaux projets locaux à exister vraiment sur le digital.

Je travaille déjà avec des acteurs de la scène toulousaine, brasseurs artisanaux, bars... et je cherche activement de nouveaux secteurs comme le vôtre ✨

Je suis tombé sur {company} et franchement ça m'a parlé tout de suite. C'est exactement le genre de projet que j'aime porter !

Je vous propose un audit gratuit, je me déplace chez vous, 20-30 min, pour regarder ensemble votre visibilité en ligne et vous dire exactement ce qui manque. Zéro engagement.

Vous seriez dispo cette semaine ? 🙌

Kyllian
HelpMe`,

  artisan: `Salut 👋

C'est Kyllian, je suis du nord toulousain (Bruguières). J'ai monté ma boîte HelpMe pour aider les TPE et beaux projets locaux à exister vraiment sur le digital.

Je travaille déjà avec des acteurs de la scène toulousaine, brasseurs artisanaux, bars... et je cherche des artisans avec du vrai savoir-faire à mettre en avant 🔨

Je suis tombé sur {company} et franchement ça m'a parlé tout de suite. C'est exactement le genre de projet que j'aime porter !

Je vous propose un audit gratuit, je me déplace chez vous, 20-30 min, pour regarder ensemble votre visibilité en ligne et vous dire exactement ce qui manque. Zéro engagement.

Vous seriez dispo cette semaine ? 🙌

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
