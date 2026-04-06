import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("react-router")) return "router-vendor";
          if (id.includes("recharts")) return "charts-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("html5-qrcode")) return "scanner-vendor";
          if (id.includes("html2canvas")) return "html2canvas-vendor";
          if (id.includes("jspdf")) return "jspdf-vendor";
          if (id.includes("dompurify")) return "purify-vendor";
          if (
            id.includes("sonner") ||
            id.includes("cmdk") ||
            id.includes("embla-carousel-react") ||
            id.includes("vaul") ||
            id.includes("react-day-picker") ||
            id.includes("zod") ||
            id.includes("input-otp") ||
            id.includes("next-themes") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge")
          ) return "ui-utils-vendor";
          if (id.includes("date-fns")) return "date-vendor";
          return "vendor";
        },
      },
    },
  },
}));