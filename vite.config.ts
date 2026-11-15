import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site under /sahakar-nyaya/
export default defineConfig({
  base: "/sahakar-nyaya/",
  plugins: [react()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 700,
  },
});
