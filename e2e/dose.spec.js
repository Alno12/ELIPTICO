import { test, expect, abrirCom, treino } from "./apoio.js";

/* A dose dos últimos 7 dias contra a meta. A meta de 150 min equivalentes é uma
   dose semanal, não um evento de calendário — o card existe para mostrar isso
   como um nível a sustentar, e não como uma caixa que zera na segunda-feira. */
const diasAtras = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

test.describe("card da dose dos últimos 7 dias", () => {
  test("mostra os minutos equivalentes da janela contra a meta", async ({ page }) => {
    /* z2 vale 1x e z4 vale 2x: 40 + 10×2 = 60 equivalentes */
    await abrirCom(page, [treino(diasAtras(2), { z2: 40, z4: 10 })]);

    const dose = page.getByTestId("dose");
    await expect(dose).toContainText("60");
    await expect(dose).toContainText("de 150 min equivalentes");
  });

  test("um treino de 8 dias atrás está fora da dose", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z2: 30 }), treino(diasAtras(8), { z2: 99 })]);
    await expect(page.getByTestId("dose")).toContainText("30");
    await expect(page.getByTestId("dose")).not.toContainText("129");
  });

  test("fica abaixo do card dos últimos 7 dias", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(1), { z2: 40 })]);
    const ordem = await page.evaluate(() => {
      const janela = document.querySelector('[data-testid="janela-7"]');
      const dose = document.querySelector('[data-testid="dose"]');
      const quadros = document.querySelector('[data-testid="quadros-semana"]');
      const antes = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { janelaAntes: antes(janela, dose), doseAntes: antes(dose, quadros) };
    });
    expect(ordem.janelaAntes, "a dose deve vir depois do card dos últimos 7 dias").toBe(true);
    expect(ordem.doseAntes, "e antes dos quadros da semana").toBe(true);
  });

  test("a curva tem trinta dias e termina em hoje", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(3), { z2: 45 })]);
    const rotulo = await page.evaluate(() =>
      document
        .querySelector('[data-testid="dose"]')
        .parentElement.querySelector("svg")
        ?.getAttribute("aria-label"),
    );
    expect(rotulo).toContain("30 dias");
    expect(rotulo).toContain("meta de 150");
  });

  test("conta quantos dos últimos 30 dias ficaram acima da meta", async ({ page }) => {
    /* 200 equivalentes há 2 dias: a janela fica acima de 150 em 7 dias seguidos,
       mas só 3 deles já aconteceram (hoje, ontem e anteontem) */
    await abrirCom(page, [treino(diasAtras(2), { z2: 200 })]);
    await expect(page.getByText(/dos últimos 30 dias acima da meta/)).toBeVisible();
    await expect(page.getByTestId("dose").locator("..")).toContainText("3 dos últimos 30 dias");
  });

  test("histórico sem treinos recentes não quebra o card", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(60), { z2: 40 })]);
    await expect(page.getByTestId("dose")).toContainText("0");
    await expect(page.getByText(/0 dos últimos 30 dias acima da meta/)).toBeVisible();
  });
});
