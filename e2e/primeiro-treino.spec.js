import { test, expect, abrirCom, abrirNovo, lerSessoes } from "./apoio.js";

/* O caminho do app recém-instalado até o primeiro treino salvo.
   É onde a tela deixa de renderizar o estado vazio e passa a renderizar as
   estatísticas — a transição que já quebrou uma vez, por um hook chamado depois
   de um retorno antecipado. Nenhum teste da camada pura alcança isso. */
test.describe("primeiro treino", () => {
  test("histórico vazio abre sem erro e convida a registrar", async ({ page }) => {
    await abrirCom(page, []);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semana");
    await expect(page.getByRole("button", { name: "Registrar treino" })).toBeVisible();
  });

  test("salvar o primeiro treino não quebra a tela", async ({ page }) => {
    await abrirCom(page, []);

    await page.getByRole("button", { name: "Registrar treino" }).click();
    await page.getByLabel("Zona 2, minutos").fill("30");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    /* a tela some se a contagem de hooks mudar entre um render e outro */
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("tempo é gravado em minutos e segundos", async ({ page }) => {
    await abrirCom(page, []);

    await page.getByRole("button", { name: "Registrar treino" }).click();
    await page.getByLabel("Zona 2, minutos").fill("8");
    await page.getByLabel("Zona 2, segundos").fill("30");
    await page.getByLabel("Zona 4, minutos").fill("2");
    await page.getByLabel("Zona 4, segundos").fill("15");

    /* 8,5 + 2,25 = 10,75 min, exibidos como 10:45 no formulário */
    await expect(page.getByText("10:45")).toBeVisible();
    /* equivalentes: 8,5 × 1 (Z2) + 2,25 × 2 (Z4) = 13 */
    await expect(page.getByText("13 min equivalentes")).toBeVisible();

    await page.getByRole("button", { name: "Salvar treino" }).click();

    const [gravado] = await lerSessoes(page);
    expect(gravado.zones.z2).toBeCloseTo(8.5, 6);
    expect(gravado.zones.z4).toBeCloseTo(2.25, 6);
    expect(gravado.total).toBeCloseTo(10.75, 6);
  });

  test("reabrir para editar devolve os mesmos minutos e segundos", async ({ page }) => {
    await abrirCom(page, []);

    await page.getByRole("button", { name: "Registrar treino" }).click();
    await page.getByLabel("Zona 2, minutos").fill("8");
    await page.getByLabel("Zona 2, segundos").fill("30");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
    await page.getByRole("button", { name: "Editar" }).click();

    await expect(page.getByLabel("Zona 2, minutos")).toHaveValue("8");
    await expect(page.getByLabel("Zona 2, segundos")).toHaveValue("30");
  });

  test("a primeira abertura semeia treinos de exemplo", async ({ page }) => {
    await abrirNovo(page);
    expect((await lerSessoes(page)).length).toBeGreaterThan(20);
  });
});
