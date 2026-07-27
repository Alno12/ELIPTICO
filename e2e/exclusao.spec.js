import { test, expect, abrirCom, treino, diaDaSemana, lerSessoes } from "./apoio.js";

/* Regressão: o botão Excluir apagava na hora, sem confirmação e sem volta. Um
   toque errado numa lista densa perdia o registro para sempre. */
test.describe("desfazer exclusão", () => {
  const dois = () => [treino(diaDaSemana(0, 0), { z2: 30 }), treino(diaDaSemana(0, 2), { z2: 45 })];

  /* desde o PR da confirmação, excluir tem dois passos: pedir e confirmar.
     A cobertura da própria confirmação está em dialogos.spec.js. */
  const excluirPrimeiro = async (page) => {
    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
    await page.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  };

  test("o desfazer devolve o treino excluído", async ({ page }) => {
    await abrirCom(page, dois());
    await excluirPrimeiro(page);

    await expect(page.getByText("Treino excluído")).toBeVisible();
    expect(await lerSessoes(page)).toHaveLength(1);

    await page.getByRole("button", { name: "Desfazer" }).click();

    await expect(page.getByText("Treino restaurado")).toBeVisible();
    expect(await lerSessoes(page)).toHaveLength(2);
  });

  test("sem desfazer, a exclusão vale", async ({ page }) => {
    await abrirCom(page, dois());
    await excluirPrimeiro(page);
    await expect(page.getByRole("button", { name: "Desfazer" })).toBeVisible();

    /* o aviso some sozinho; o treino não volta */
    await expect(page.getByText("Treino excluído")).toBeHidden({ timeout: 10_000 });
    expect(await lerSessoes(page)).toHaveLength(1);
  });

  test("desfazer o último treino devolve também o histórico ao estado anterior", async ({
    page,
  }) => {
    await abrirCom(page, [treino(diaDaSemana(0, 0), { z2: 30 })]);
    await excluirPrimeiro(page);
    expect(await lerSessoes(page)).toHaveLength(0);

    await page.getByRole("button", { name: "Desfazer" }).click();

    expect(await lerSessoes(page)).toHaveLength(1);
    await page.getByRole("button", { name: "Semana", exact: true }).click();
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
  });
});
