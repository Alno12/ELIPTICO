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
    baseURL: "http://localhost:4174",
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
    /* Porta própria, diferente da do `npm run preview` do dia a dia, e sem
       reaproveitar servidor já de pé.

       Reaproveitar chegou a fazer a suíte aprovar uma validação que ainda nem
       tinha sido compilada, porque o servidor em execução servia o build
       anterior. Recusar o reaproveitamento resolveu isso, mas passou a impedir
       rodar os testes com um preview aberto. A porta separada resolve os dois:
       sempre compila o que está no disco, e nunca disputa a porta. */
    command: "npm run build && npm run preview -- --port 4174",
    url: "http://localhost:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
