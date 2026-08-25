import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend contains no business logic; it talks to the LAN server API.
// In dev, proxy /api and the WS to the server so there's no CORS dance.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true, ws: true },
    },
  },
});
