import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Local dev proxy — when VITE_API_URL is not set, proxies /api/* to
  // localhost:8000 so you can run frontend and backend side by side without
  // hitting CORS errors. In production (Vercel) this block is ignored and
  // VITE_API_URL takes over via the environment variable.
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
