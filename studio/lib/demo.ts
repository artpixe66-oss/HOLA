import type { Content, PostMetrics, Store } from "./types";
import { emptyAttributes, newContent, now, uid } from "./store";

// Données d'exemple, marquées demo: true pour pouvoir les retirer d'un clic.
const SAMPLES = [
  { title: "Serviette rose oubliée", topic: "Vanne coquine", hookType: "Situation du quotidien", hook: "T'as oublié ta serviette rose !", outfit: "Ensemble sport moka", setting: "Salle de sport", format: "Vanne à chute", d: 9, views: 184000, day: -26, h: 19 },
  { title: "Livraison au mauvais étage", topic: "Vanne coquine", hookType: "Situation du quotidien", hook: "C'est toi qui as commandé… ça ?", outfit: "Jean + débardeur", setting: "Cage d'escalier", format: "Vanne à chute", d: 8, views: 142000, day: -22, h: 20 },
  { title: "Pas une dix sur dix", topic: "Drague face caméra", hookType: "Question directe", hook: "Tu me mettrais combien sur dix ?", outfit: "Robe noire", setting: "Voiture", format: "Face caméra", d: 7, views: 96000, day: -19, h: 13 },
  { title: "Clés rapportées", topic: "Vanne coquine", hookType: "Situation du quotidien", hook: "Tu cherches pas quelque chose ?", outfit: "Ensemble sport moka", setting: "Parking", format: "Vanne à chute", d: 10, views: 131000, day: -15, h: 18 },
  { title: "Routine du matin", topic: "Lifestyle", hookType: "Texte à l'écran", hook: "Ma routine en 7 secondes", outfit: "Pyjama satin", setting: "Chambre", format: "Montage rapide", d: 14, views: 38000, day: -12, h: 8 },
  { title: "Essayage tenues soirée", topic: "Mode", hookType: "Texte à l'écran", hook: "Laquelle pour ce soir ?", outfit: "Trois robes", setting: "Chambre", format: "Montage rapide", d: 18, views: 45000, day: -9, h: 12 },
  { title: "Message vocal", topic: "Drague face caméra", hookType: "Question directe", hook: "Je t'envoie un vocal ou je te le dis en face ?", outfit: "Chemise blanche", setting: "Balcon", format: "Face caméra", d: 8, views: 88000, day: -6, h: 21 },
  { title: "Café renversé", topic: "Vanne coquine", hookType: "Situation du quotidien", hook: "Pardon, c'était ton café ?", outfit: "Jean + débardeur", setting: "Café", format: "Vanne à chute", d: 9, views: 156000, day: -3, h: 19 },
];

export function demoData(influencerId: string | null): { contents: Content[]; metrics: PostMetrics[] } {
  const contents: Content[] = [];
  const metrics: PostMetrics[] = [];
  SAMPLES.forEach((s, i) => {
    const date = new Date();
    date.setDate(date.getDate() + s.day);
    date.setHours(s.h, 0, 0, 0);
    const permalink = `https://www.instagram.com/reel/EXEMPLE${i + 1}/`;
    const c = newContent({
      title: s.title,
      influencerId,
      status: "publie",
      attributes: { ...emptyAttributes(), topic: s.topic, hook: s.hook, hookType: s.hookType, outfit: s.outfit, setting: s.setting, format: s.format, durationSec: s.d, editing: s.format === "Montage rapide" ? "Coupes rapides" : "Plan unique" },
      publishedAt: date.toISOString(),
      permalink,
      demo: true,
    });
    contents.push(c);
    const reach = Math.round(s.views * 0.72);
    const saveRate = s.topic === "Vanne coquine" ? 0.021 : 0.009;
    metrics.push({
      id: uid(),
      permalink,
      caption: s.title,
      publishedAt: date.toISOString(),
      views: s.views,
      reach,
      likes: Math.round(reach * 0.061),
      comments: Math.round(reach * 0.004),
      shares: Math.round(reach * (s.topic === "Vanne coquine" ? 0.018 : 0.006)),
      saves: Math.round(reach * saveRate),
      follows: Math.round(reach * 0.0021),
      avgWatchSec: Math.round(s.d * 0.7 * 10) / 10,
      contentId: c.id,
      importedAt: now(),
      demo: true,
    });
  });
  // Deux contenus à venir pour remplir le calendrier
  [2, 5].forEach((offset, i) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    date.setHours(19, 0, 0, 0);
    contents.push(
      newContent({
        title: i ? "Parapluie prêté" : "Ticket de caisse",
        influencerId,
        status: i ? "prompt" : "programme",
        attributes: { ...emptyAttributes(), topic: "Vanne coquine", hookType: "Situation du quotidien", format: "Vanne à chute", durationSec: 9 },
        scheduledAt: date.toISOString(),
        demo: true,
      }),
    );
  });
  return { contents, metrics };
}

export function withDemo(s: Store): Store {
  const { contents, metrics } = demoData(s.influencers[0]?.id ?? null);
  return { ...s, contents: [...contents, ...s.contents], metrics: [...metrics, ...s.metrics] };
}

export function withoutDemo(s: Store): Store {
  return {
    ...s,
    contents: s.contents.filter((c) => !c.demo),
    metrics: s.metrics.filter((m) => !m.demo),
  };
}
