import { test, expect, abrirCom, treino, diaDaSemana } from "./apoio.js";

const historico = () => [
  treino(diaDaSemana(0, 0), { z1: 8, z2: 30 }, { avgHr: 140, maxHr: 165, rpe: 6 }),
  treino(diaDaSemana(1, 2), { z1: 10, z3: 6, z4: 12 }, { avgHr: 152, maxHr: 178, rpe: 8 }),
  treino(diaDaSemana(2, 4), { z1: 8, z2: 28 }, { avgHr: 138, maxHr: 160, rpe: 5 }),
];

test.describe("as quatro abas", () => {
  for (const aba of ["Semana", "Tendências", "Análise", "Histórico"]) {
    test(`a aba ${aba} renderiza sem erro`, async ({ page }) => {
      await abrirCom(page, historico());
      await page.getByRole("button", { name: aba, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(aba);
    });
  }
});

test.describe("PWA", () => {
  test("o manifest é servido e é válido", async ({ page, request }) => {
    await abrirCom(page, historico());
    const r = await request.get("/manifest.webmanifest");
    expect(r.ok()).toBeTruthy();
    const m = await r.json();
    expect(m.name).toBeTruthy();
    expect(m.display).toBe("standalone");
    expect(m.icons.length).toBeGreaterThan(0);
  });

  test("o service worker registra", async ({ page }) => {
    await abrirCom(page, historico());
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== undefined, null, {
      timeout: 10_000,
    });
    const registrado = await page.evaluate(async () => {
      const rs = await navigator.serviceWorker.getRegistrations();
      return rs.length > 0;
    });
    expect(registrado).toBe(true);
  });
});
