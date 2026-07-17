import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
      "next/link": path.resolve(__dirname, "shims/next-link.tsx"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../standalone-dist"),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
