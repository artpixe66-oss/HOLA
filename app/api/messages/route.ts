import { NextRequest, NextResponse } from 'next/server';
import type { ProspectType } from '@/lib/types';

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
};

const SMS_TEMPLATES: Record<ProspectType, string> = {
  producteur: `Bonjour {name}, je suis de l'équipe HelpMe. On aide les producteurs comme vous à être trouvés sur Google et les réseaux. Dispo pour un appel rapide ? 📞`,
  'commerçant': `Bonjour {name}, HelpMe propose des packs visibilité clé en main pour les commerçants de {city}. Intéressé(e) par un audit gratuit ? Répondez OUI 😊`,
};

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export async function POST(req: NextRequest) {
  try {
    const { type, messageType, name, company, city } = await req.json() as {
      type: ProspectType;
      messageType: 'email' | 'sms';
      name: string;
      company: string;
      city: string;
    };

    const vars = { name: name || 'vous', company: company || 'votre entreprise', city: city || 'votre ville' };

    if (messageType === 'sms') {
      return NextResponse.json({ body: substitute(SMS_TEMPLATES[type] || SMS_TEMPLATES['commerçant'], vars) });
    }

    const tpl = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES['commerçant'];
    return NextResponse.json({
      subject: substitute(tpl.subject, vars),
      body: substitute(tpl.body, vars),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
