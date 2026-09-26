import type { MetadataRoute } from "next";

// Rend l'application installable ; share_target la fait apparaître dans le menu Partager
// (Android, application installée depuis Chrome).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Studio — influenceuses IA",
    short_name: "Studio",
    description: "Inspiration, création, publication et performances des influenceuses IA",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/inspirations/nouvelle",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
