import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// GitHub Pages serves the site under /sahakar-nyaya/
export default defineConfig({
  base: "/sahakar-nyaya/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "./src") },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 700,
  },
});
