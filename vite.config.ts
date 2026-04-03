import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/awana-labs/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    visualizer({
      filename: "stats.html",
      template: "treemap",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("i18next")) return "i18n";
            if (id.includes("react-dom") || id.includes("react-router"))
              return "react-vendor";
            // lucide-react is NOT lumped into one chunk — specific icon
            // imports are tree-shaken inline, and the full `icons` map
            // (via dynamic import of all-icons.ts) gets its own chunk.
          }
        },
      },
    },
  },
  preview: {
    headers: {
      // Immutable cache for hashed assets (1 year)
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  },
}));
