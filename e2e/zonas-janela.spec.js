import { test, expect, abrirCom, treino, diaDaSemana } from "./apoio.js";

/* A distribuição por zona da janela móvel, irmã da que já existe para a semana
   do calendário. Mesma leitura, janela diferente — e é a diferença que importa:
   numa segunda-feira a do calendário mostra um dia e esta mostra sete. */
const diasAtras = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

test.describe("distribuição por zona nos últimos 7 dias", () => {
  test("mostra a proporção de cada zona na janela", async ({ page }) => {
    /* 30 min em Z2 e 10 em Z4: 75% e 25% */
    await abrirCom(page, [treino(diasAtras(2), { z2: 30, z4: 10 })]);

    const card = page.getByTestId("zonas-janela");
    await expect(card).toContainText("75%");
    await expect(card).toContainText("25%");
    await expect(card).toContainText("30 min");
    await expect(card).toContainText("10 min");
  });

  test("um treino de 8 dias atrás fica de fora", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z2: 40 }), treino(diasAtras(8), { z5: 40 })]);
    const card = page.getByTestId("zonas-janela");
    /* só Z2 na janela: 100% dela, e nada em Z5 */
    await expect(card).toContainText("100%");
    await expect(card.getByText("40 min")).toHaveCount(1);
  });

  test("fica entre a dose e a distribuição da semana", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(1), { z2: 30 })]);
    const ordem = await page.evaluate(() => {
      const dose = document.querySelector('[data-testid="dose"]');
      const janela = document.querySelector('[data-testid="zonas-janela"]');
      const quadros = document.querySelector('[data-testid="quadros-semana"]');
      const antes = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { doseAntes: antes(dose, janela), janelaAntes: antes(janela, quadros) };
    });
    expect(ordem.doseAntes, "deve vir depois do card da dose").toBe(true);
    expect(ordem.janelaAntes, "e antes dos quadros da semana").toBe(true);
  });

  test("não se mexe ao navegar para semanas anteriores", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(1), { z2: 25 }), treino(diaDaSemana(3, 2), { z5: 80 })]);
    const antes = await page.getByTestId("zonas-janela").innerText();

    await page.getByRole("button", { name: "Semana anterior" }).click();
    await page.getByRole("button", { name: "Semana anterior" }).click();
    await expect(page.getByTestId("semana-rotulo")).not.toHaveText("Esta semana");

    expect(await page.getByTestId("zonas-janela").innerText(), "seguiu as setas").toBe(antes);
  });

  test("janela sem treino mostra o aviso, e não zeros", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(40), { z2: 30 })]);
    await expect(page.getByTestId("zonas-janela")).toContainText(
      "Nenhum treino nos últimos 7 dias",
    );
  });

  test("a porcentagem sai das zonas, não dos minutos gravados", async ({ page }) => {
    /* `total` divergente do somatório das zonas: a normalização deriva o total
       das zonas, e o denominador daqui tem de vir da mesma fonte */
    await abrirCom(page, [
      {
        id: "t",
        date: `${diasAtras(1).getFullYear()}-${String(diasAtras(1).getMonth() + 1).padStart(2, "0")}-${String(diasAtras(1).getDate()).padStart(2, "0")}`,
        zones: { z1: 0, z2: 20, z3: 0, z4: 0, z5: 0 },
        total: 9999,
        avgHr: null,
        maxHr: null,
        rpe: null,
        notes: "",
      },
    ]);
    await expect(page.getByTestId("zonas-janela")).toContainText("100%");
  });
});
