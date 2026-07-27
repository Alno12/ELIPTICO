import { test, expect, abrirCom, lerSessoes } from "./apoio.js";

/* Regressão: o formulário aceitava qualquer número de FC. Um 1500 digitado por
   engano fazia o percentual da reserva cardíaca exibir 590% e achatava o
   gráfico de eficiência contra a base. */
test.describe("faixa da frequência cardíaca", () => {
  const preencherTreino = async (page) => {
    await page.getByRole("button", { name: "Registrar treino" }).click();
    await page.getByLabel("Zona 2, minutos").fill("30");
  };

  test("recusa FC absurda em vez de gravar", async ({ page }) => {
    await abrirCom(page, []);
    await preencherTreino(page);
    await page.getByLabel(/FC média/).fill("1500");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    await expect(page.getByText(/frequência cardíaca deve ficar entre/i)).toBeVisible();
    expect(await lerSessoes(page)).toHaveLength(0);
  });

  test("recusa FC abaixo do mínimo", async ({ page }) => {
    await abrirCom(page, []);
    await preencherTreino(page);
    await page.getByLabel(/FC máxima/).fill("3");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    await expect(page.getByText(/frequência cardíaca deve ficar entre/i)).toBeVisible();
  });

  test("aceita FC plausível", async ({ page }) => {
    await abrirCom(page, []);
    await preencherTreino(page);
    await page.getByLabel(/FC média/).fill("142");
    await page.getByLabel(/FC máxima/).fill("171");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    const [gravado] = await lerSessoes(page);
    expect(gravado.avgHr).toBe(142);
    expect(gravado.maxHr).toBe(171);
  });

  test("recusa esforço percebido fora de 1 a 10", async ({ page }) => {
    await abrirCom(page, []);
    await preencherTreino(page);
    await page.getByLabel(/Esforço percebido/).fill("99");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    await expect(page.getByText(/esforço percebido vai de 1 a 10/i)).toBeVisible();
  });

  /* A normalização acontece na leitura, em memória: o valor absurdo continua no
     armazenamento mas nunca chega às telas. "FC máxima registrada" some dos
     Recordes justamente porque não há mais nenhum valor plausível. */
  test("FC absurda já gravada não chega às telas", async ({ page }) => {
    await abrirCom(page, [
      { id: "x", date: "2026-07-20", zones: { z2: 30 }, avgHr: 1500, maxHr: 2000 },
    ]);
    await expect(page.getByText("FC máxima registrada")).toHaveCount(0);
    await expect(page.getByText(/1500|2000/)).toHaveCount(0);
  });

  test("FC plausível já gravada aparece nos recordes", async ({ page }) => {
    await abrirCom(page, [
      { id: "x", date: "2026-07-20", zones: { z2: 30 }, avgHr: 142, maxHr: 171 },
    ]);
    await expect(page.getByText("FC máxima registrada")).toBeVisible();
    await expect(page.getByText("171 bpm")).toBeVisible();
  });
});
