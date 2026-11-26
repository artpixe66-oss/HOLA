import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le dépôt contient plusieurs applications : cette racine est celle de cardmaker.
  turbopack: { root: __dirname },
};

export default nextConfig;
