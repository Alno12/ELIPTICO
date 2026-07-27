import { test, expect, abrirCom, treino } from "./apoio.js";

/* datas fixas, para o teste não depender de que dia é hoje */
const emDia = (aaaammdd, min) => {
  const d = new Date(`${aaaammdd}T12:00:00`);
  return treino(d, { z2: min });
};

const tresMeses = () => [
  emDia("2026-07-20", 30),
  emDia("2026-07-05", 40),
  emDia("2026-06-15", 50),
  emDia("2026-05-10", 60),
];

/* Proposta 5: o histórico crescia sem limite — seis telas de rolagem com quatro
   meses de uso, e nunca parava de crescer. Agora mostra um mês por vez. */
test.describe("navegação por mês no histórico", () => {
  const abrir = async (page, dados = tresMeses()) => {
    await abrirCom(page, dados);
    await page.getByRole("button", { name: "Histórico", exact: true }).click();
  };

  test("abre no mês mais recente e mostra só ele", async ({ page }) => {
    await abrir(page);

    await expect(page.getByTestId("mes-rotulo")).toHaveText("Julho de 2026");
    await expect(page.getByText("70 min · 2 treinos")).toBeVisible();
    /* os treinos de junho e maio não devem estar na tela */
    await expect(page.getByText("15 de jun")).toHaveCount(0);
    await expect(page.getByText("10 de mai")).toHaveCount(0);
  });

  test("a seta anterior recua um mês", async ({ page }) => {
    await abrir(page);
    await page.getByRole("button", { name: "Mês anterior" }).click();

    await expect(page.getByTestId("mes-rotulo")).toHaveText("Junho de 2026");
    await expect(page.getByText("50 min · 1 treino")).toBeVisible();
  });

  test("as setas travam nos extremos", async ({ page }) => {
    await abrir(page);
    const anterior = page.getByRole("button", { name: "Mês anterior" });
    const proximo = page.getByRole("button", { name: "Próximo mês" });

    await expect(proximo).toBeDisabled();
    await anterior.click();
    await expect(proximo).toBeEnabled();
    await anterior.click();
    await expect(page.getByTestId("mes-rotulo")).toHaveText("Maio de 2026");
    await expect(anterior).toBeDisabled();
  });

  /* Regressão: a tela agrupava por mês mas nunca ordenava dentro do grupo, e
     confiava na ordem em que os treinos vinham do armazenamento. */
  test("os treinos do mês saem em ordem decrescente de data", async ({ page }) => {
    /* de propósito fora de ordem, como viria de um armazenamento não ordenado */
    await abrir(page, [emDia("2026-07-05", 40), emDia("2026-07-27", 10), emDia("2026-07-20", 30)]);

    const datas = await page.locator("button").filter({ hasText: "TRIMP" }).allInnerTexts();
    const dias = datas.map((t) => Number(t.match(/(\d{2}) de jul/)[1]));
    expect(dias, "a lista deve vir do mais recente para o mais antigo").toEqual([27, 20, 5]);
  });

  test("excluir o último treino do mês cai para o mês seguinte que existe", async ({ page }) => {
    await abrir(page, [emDia("2026-07-20", 30), emDia("2026-06-15", 50)]);
    await expect(page.getByTestId("mes-rotulo")).toHaveText("Julho de 2026");

    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
    await page.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByTestId("mes-rotulo")).toHaveText("Junho de 2026");
  });

  test("com um mês só, as duas setas ficam desabilitadas", async ({ page }) => {
    await abrir(page, [emDia("2026-07-20", 30)]);
    await expect(page.getByRole("button", { name: "Mês anterior" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Próximo mês" })).toBeDisabled();
  });
});
