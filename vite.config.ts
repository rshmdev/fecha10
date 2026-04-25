import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import optimizeLocales from "@react-aria/optimize-locales-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      ...optimizeLocales.vite({
        locales: ["pt-BR", "en-US"],
      }),
      enforce: "pre",
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
