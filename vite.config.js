import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  test: {
    /* só a camada pura: os arquivos de e2/ são do Playwright e rodam por `npm run e2e` */
    include: ["src/**/*.test.js"],
  },
});
