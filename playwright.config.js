import { defineConfig, devices } from "@playwright/test";

/* O app é um PWA de celular: os testes rodam num viewport de telefone, com toque,
   contra o build de produção — é nele que o service worker existe e que os defeitos
   de compilação apareceriam. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],

  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "celular",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 402, height: 874 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
