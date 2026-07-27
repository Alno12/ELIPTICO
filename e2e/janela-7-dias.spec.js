import { test, expect, abrirCom, treino, diaDaSemana } from "./apoio.js";

/* A janela dos últimos 7 dias fica presa a hoje. O card acima dela navega por
   semanas; este não pode acompanhar, senão passa a dizer "últimos 7 dias" sobre
   um intervalo de meses atrás. */
const diasAtras = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

test.describe("card dos últimos 7 dias", () => {
  test("soma a janela que termina hoje, e não a semana do calendário", async ({ page }) => {
    /* 5 dias atrás e 8 dias atrás: só o primeiro entra */
    await abrirCom(page, [treino(diasAtras(5), { z2: 30 }), treino(diasAtras(8), { z2: 99 })]);

    const card = page.getByTestId("janela-7");
    await expect(card).toContainText("30");
    await expect(card).not.toContainText("129");
  });

  test("compara com os 7 dias anteriores", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z2: 40 }), treino(diasAtras(9), { z2: 10 })]);

    /* 40 agora contra 10 antes: sobe 30 */
    await expect(page.getByTestId("janela-7")).toContainText("↑ 30");
  });

  test("não se mexe ao navegar para semanas anteriores", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(1), { z2: 25 }), treino(diaDaSemana(3, 2), { z2: 80 })]);

    const antes = await page.getByTestId("janela-7").innerText();
    await page.getByRole("button", { name: "Semana anterior" }).click();
    await page.getByRole("button", { name: "Semana anterior" }).click();

    /* o card de cima mudou de semana */
    await expect(page.getByTestId("semana-rotulo")).not.toHaveText("Esta semana");
    expect(await page.getByTestId("janela-7").innerText(), "a janela seguiu as setas").toBe(antes);
  });

  test("aparece logo abaixo do card da semana", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(1), { z2: 25 })]);

    const ordem = await page.evaluate(() => {
      const alvo = document.querySelector('[data-testid="janela-7"]');
      const semana = document.querySelector('[data-testid="semana-minutos"]');
      const zonas = document.querySelector('[data-testid="quadros-semana"]');
      const pos = (a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? "antes" : "depois";
      return { semanaVsJanela: pos(semana, alvo), janelaVsQuadros: pos(alvo, zonas) };
    });
    expect(ordem.semanaVsJanela, "a janela deve vir depois do card da semana").toBe("antes");
    expect(ordem.janelaVsQuadros, "e antes dos quadros da semana").toBe("antes");
  });

  test("histórico vazio não quebra o card", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(40), { z2: 30 })]);
    await expect(page.getByTestId("janela-7")).toContainText("0");
  });
});
