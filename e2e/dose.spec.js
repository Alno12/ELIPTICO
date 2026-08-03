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

/* A leitura por arraste, no mesmo gesto do gráfico de zonas da aba Tendências. */
test.describe("arrastar a curva da dose", () => {
  const arrastarPara = async (page, fracao) => {
    const svg = page.locator('[data-testid="dose"] ~ svg').first();
    /* centraliza o gráfico na tela: abaixo da dobra ele fica sob a barra de abas,
       e o ponteiro acerta a barra em vez do gráfico */
    await svg.evaluate((el) => {
      const r = document.querySelector('[data-rolagem="app"]');
      r.scrollTop += el.getBoundingClientRect().top - r.clientHeight / 2;
    });
    await page.waitForTimeout(120);
    const b = await svg.boundingBox();
    await page.mouse.move(b.x + b.width * fracao, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * fracao + 2, b.y + b.height / 2, { steps: 3 });
    return svg;
  };

  test("arrastar mostra a dose e a data do dia sob o dedo", async ({ page }) => {
    /* 200 equivalentes há 20 dias: a janela fica alta lá atrás e zerada agora */
    await abrirCom(page, [treino(diasAtras(20), { z2: 200 })]);

    const card = page.getByTestId("dose");
    await expect(card, "em repouso mostra a janela de hoje").toContainText("0");

    await arrastarPara(page, 0.4);
    await expect(card).toContainText("nos 7 dias até");
    await expect(card).toContainText("200");
  });

  test("soltar o dedo devolve o card ao dia de hoje", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(20), { z2: 200 })]);
    await arrastarPara(page, 0.4);
    await expect(page.getByTestId("dose")).toContainText("nos 7 dias até");

    await page.mouse.up();
    await expect(page.getByTestId("dose")).not.toContainText("nos 7 dias até");
  });

  test("o gesto vertical continua rolando a página", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z2: 60 })]);
    const svg = page.locator('[data-testid="dose"] ~ svg').first();
    /* sem `pan-y` o arraste vertical sobre o gráfico prenderia a rolagem */
    expect(await svg.evaluate((el) => getComputedStyle(el).touchAction)).toBe("pan-y");
  });

  test("os dias acima da meta ficam verdes, e só eles", async ({ page }) => {
    /* 200 equivalentes há 2 dias: hoje, ontem e anteontem acima da meta */
    await abrirCom(page, [treino(diasAtras(2), { z2: 200 })]);
    const faixas = await page.locator('[data-testid="dose"] ~ svg clipPath rect').count();
    expect(faixas, "uma faixa verde por dia acima da meta").toBe(3);
  });

  test("sem nenhum dia acima da meta não há faixa verde", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z2: 20 })]);
    expect(await page.locator('[data-testid="dose"] ~ svg clipPath rect').count()).toBe(0);
  });
});
