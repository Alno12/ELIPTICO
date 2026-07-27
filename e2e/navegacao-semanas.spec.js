import { test, expect, abrirCom, treino, diaDaSemana } from "./apoio.js";

/* Histórico curto e com valores distintos por semana, para dar para afirmar
   qual semana está na tela olhando só o número. */
const historico = () => [
  treino(diaDaSemana(0, 0), { z2: 60 }),
  treino(diaDaSemana(1, 0), { z2: 90 }),
  treino(diaDaSemana(2, 0), { z2: 30 }),
];

test.describe("navegação entre semanas", () => {
  test("começa na semana corrente, sem como avançar", async ({ page }) => {
    await abrirCom(page, historico());

    await expect(page.getByTestId("semana-rotulo")).toHaveText("Esta semana");
    await expect(page.getByTestId("semana-minutos")).toHaveText("60");
    await expect(page.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Semana anterior" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Hoje" })).toHaveCount(0);
  });

  test("voltar uma semana muda os números da aba inteira", async ({ page }) => {
    await abrirCom(page, historico());
    await page.getByRole("button", { name: "Semana anterior" }).click();

    await expect(page.getByTestId("semana-minutos")).toHaveText("90");
    await expect(page.getByTestId("semana-rotulo")).not.toHaveText("Esta semana");
    /* o quadro de minutos acompanha o card do topo */
    await expect(page.getByText("90", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Próxima semana" })).toBeEnabled();
  });

  test("o botão Hoje devolve para a semana corrente", async ({ page }) => {
    await abrirCom(page, historico());
    await page.getByRole("button", { name: "Semana anterior" }).click();
    await expect(page.getByRole("button", { name: "Hoje" })).toBeVisible();

    await page.getByRole("button", { name: "Hoje" }).click();

    await expect(page.getByTestId("semana-rotulo")).toHaveText("Esta semana");
    await expect(page.getByTestId("semana-minutos")).toHaveText("60");
  });

  test("a seta de voltar trava na semana do primeiro treino", async ({ page }) => {
    await abrirCom(page, historico());
    const anterior = page.getByRole("button", { name: "Semana anterior" });

    await anterior.click();
    await anterior.click();
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
    await expect(anterior).toBeDisabled();
  });

  /* Regressão: as props da animação de transição eram espalhadas por cima de um
     elemento que já tinha `style`, sobrescrevendo o layout. A grade de duas
     colunas virava uma coluna só, de forma permanente e sem erro nenhum. */
  test("a grade dos quadros continua em duas colunas depois da transição", async ({ page }) => {
    await abrirCom(page, historico());
    await page.getByRole("button", { name: "Semana anterior" }).click();
    await expect(page.getByTestId("semana-minutos")).toHaveText("90");

    const grade = await page.getByTestId("quadros-semana").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { display: cs.display, colunas: cs.gridTemplateColumns.split(" ").length };
    });
    expect(grade.display).toBe("grid");
    expect(grade.colunas).toBe(2);
  });

  test("a meta da semana em exibição mostra valor e não só percentual", async ({ page }) => {
    await abrirCom(page, historico(), { weeklyGoal: 150 });
    await expect(page.getByTestId("semana-meta")).toHaveText(/60 de 150 min equivalentes/);
  });
});
