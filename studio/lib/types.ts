export type ID = string;

export interface Reference {
  label: string;
  url: string;
}

/** Fiche personnage : blocs fixes injectés mot pour mot dans les prompts. */
export interface Influencer {
  id: ID;
  name: string;
  aliases: string;
  handle: string;
  niche: string;
  color: string;
  avatarUrl: string;
  references: Reference[];
  anchors: string; // ancrages physiques (bloc SUJET)
  voice: string; // bloc VOIX
  attitude: string; // bloc ATTITUDE
  formats: string; // formats et options de DA validés
  checkpoints: string; // points de contrôle propres au personnage
  notes: string;
  createdAt: string;
  demo?: boolean;
}

export interface Inspiration {
  id: ID;
  url: string;
  title: string;
  influencerId: ID | null;
  notes: string;
  transcript: string;
  tags: string[];
  createdAt: string;
  demo?: boolean;
}

export const STATUSES = [
  { id: "idee", label: "Idée", color: "#ffffff" },
  { id: "script", label: "Scénario", color: "#8a8a8a" },
  { id: "prompt", label: "Prompt prêt", color: "#8b3dff" },
  { id: "genere", label: "Vidéo générée", color: "#e8e8e8" },
  { id: "programme", label: "Programmé", color: "#c8f31d" },
  { id: "publie", label: "Publié", color: "#c8f31d" },
] as const;

export type Status = (typeof STATUSES)[number]["id"];

/** Attributs créatifs comparés dans l'analyse des performances. */
export interface CreativeAttributes {
  topic: string;
  hook: string;
  hookType: string;
  outfit: string;
  setting: string;
  format: string;
  durationSec: number | null;
  editing: string;
}

export const ATTRIBUTE_LABELS: Record<keyof CreativeAttributes, string> = {
  topic: "Sujet",
  hook: "Accroche",
  hookType: "Type d'accroche",
  outfit: "Tenue",
  setting: "Décor",
  format: "Format",
  durationSec: "Durée",
  editing: "Montage",
};

export interface PromptVersion {
  id: ID;
  text: string;
  note: string;
  agentVersionId: ID | null;
  createdAt: string;
}

export interface Generation {
  id: ID;
  requestId: string;
  model: string;
  status: string;
  videoUrl: string;
  promptVersionId: ID | null;
  estimatedCost: number | null;
  createdAt: string;
}

export interface Content {
  id: ID;
  title: string;
  influencerId: ID | null;
  inspirationId: ID | null;
  status: Status;
  attributes: CreativeAttributes;
  script: string;
  prompts: PromptVersion[];
  generations: Generation[];
  videoUrl: string;
  scheduledAt: string | null; // ISO
  publishedAt: string | null;
  permalink: string;
  chat?: AgentMessage[];
  createdAt: string;
  demo?: boolean;
}

export interface AgentVersion {
  id: ID;
  label: string;
  instructions: string;
  createdAt: string;
}

export interface PostMetrics {
  id: ID;
  permalink: string;
  caption: string;
  publishedAt: string | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  follows: number | null;
  avgWatchSec: number | null;
  contentId: ID | null;
  importedAt: string;
  demo?: boolean;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Settings {
  model: string;
  higgsfieldModel: string;
  pricePerSecond: number | null;
  budgetCap: number | null;
  spent: number;
}

export interface Store {
  version: 1;
  influencers: Influencer[];
  inspirations: Inspiration[];
  contents: Content[];
  agentVersions: AgentVersion[];
  activeAgentVersionId: ID | null;
  metrics: PostMetrics[];
  settings: Settings;
}
