import { test, expect, abrirCom, abrirNovo, lerSessoes, treino, diaDaSemana } from "./apoio.js";

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
    await page.getByLabel("Zona 2, tempo").pressSequentially("3000");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    /* a tela some se a contagem de hooks mudar entre um render e outro */
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("tempo é gravado em minutos e segundos", async ({ page }) => {
    await abrirCom(page, []);

    await page.getByRole("button", { name: "Registrar treino" }).click();
    /* um número só por zona, digitado seguido: 830 é 8:30 */
    await page.getByLabel("Zona 2, tempo").pressSequentially("830");
    await page.getByLabel("Zona 4, tempo").pressSequentially("215");

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

  test("reabrir para editar devolve o mesmo tempo", async ({ page }) => {
    await abrirCom(page, []);

    await page.getByRole("button", { name: "Registrar treino" }).click();
    await page.getByLabel("Zona 2, tempo").pressSequentially("830");
    await page.getByRole("button", { name: "Salvar treino" }).click();

    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
    await page.getByRole("button", { name: "Editar" }).click();

    await expect(page.getByLabel("Zona 2, tempo")).toHaveValue("8:30");
  });

  /* O ponto da mudança: um número seguido, sem pular de campo no meio. Cada
     algarismo empurra os anteriores para a esquerda. */
  test("digitar 1205 de uma vez vira 12:05", async ({ page }) => {
    await abrirCom(page, []);
    await page.getByRole("button", { name: "Registrar treino" }).click();

    const campo = page.getByLabel("Zona 2, tempo");
    const vistos = [];
    for (const d of "1205") {
      await campo.pressSequentially(d);
      vistos.push(await campo.inputValue());
    }
    expect(vistos).toEqual(["0:01", "0:12", "1:20", "12:05"]);

    await page.getByRole("button", { name: "Salvar treino" }).click();
    const [gravado] = await lerSessoes(page);
    expect(gravado.zones.z2).toBeCloseTo(12 + 5 / 60, 6);
  });

  test("apagar um algarismo faz o tempo deslizar de volta", async ({ page }) => {
    await abrirCom(page, []);
    await page.getByRole("button", { name: "Registrar treino" }).click();

    const campo = page.getByLabel("Zona 2, tempo");
    await campo.pressSequentially("1205");
    await campo.press("Backspace");
    await expect(campo).toHaveValue("1:20");
  });

  /* A nota saiu da tela de registro, mas a de um treino já gravado não pode
     sumir só porque ele foi reaberto para editar. */
  test("editar um treino não apaga a nota que ele já tinha", async ({ page }) => {
    await abrirCom(page, [treino(diaDaSemana(0, 1), { z2: 30 }, { notes: "puxado" })]);

    await expect(page.getByRole("textbox", { name: "Notas do treino" })).toHaveCount(0);

    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    const [gravado] = await lerSessoes(page);
    expect(gravado.notes, "a nota foi perdida ao editar").toBe("puxado");
  });

  test("a primeira abertura semeia treinos de exemplo", async ({ page }) => {
    await abrirNovo(page);
    expect((await lerSessoes(page)).length).toBeGreaterThan(20);
  });
});
