import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy uniquement pour le développement local
    // En production, Traefik route /api/* directement vers le backend
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});

