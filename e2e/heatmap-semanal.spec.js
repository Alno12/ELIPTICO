import { test, expect, abrirCom, treino, diaDaSemana } from "./apoio.js";

/* A carga de cada semana sob a grade do mapa de calor.

   A grade responde "em que dias você treinou" e some com a intensidade: um dia
   puxado e um dia leve viram dois quadrados verdes parecidos. A barra e o número
   devolvem essa dimensão. */

/* `rect[rx="4.2"]` é a célula de dia: identifica o mapa sem depender de texto,
   que muda conforme o mês em que a suíte roda. */
const mapa = (page) => page.locator('svg:has(rect[rx="4.2"])').first();

const irAoMapa = async (page) => {
  const alvo = page.getByText("Últimas 15 semanas");
  await alvo.evaluate((el) => {
    const r = document.querySelector('[data-rolagem="app"]');
    r.scrollTop += el.getBoundingClientRect().top - 80;
  });
  await page.waitForTimeout(120);
};

test.describe("carga semanal no mapa de calor", () => {
  test("mostra um número por semana, quinze ao todo", async ({ page }) => {
    await abrirCom(page, [treino(diaDaSemana(2, 1), { z2: 30, z4: 5 })]);
    /* z2 30×2 + z4 5×4 = 80 TRIMP na semana de 2 semanas atrás */
    const svg = mapa(page);
    await expect(svg.getByText("80", { exact: true })).toHaveCount(1);
  });

  test("semana sem treino aparece como traço, não como zero", async ({ page }) => {
    await abrirCom(page, [treino(diaDaSemana(2, 1), { z2: 30 })]);
    const svg = mapa(page);
    /* 14 semanas vazias e 1 com treino */
    await expect(svg.getByText("—", { exact: true })).toHaveCount(14);
  });

  test("a barra é proporcional à carga da semana", async ({ page }) => {
    await abrirCom(page, [
      treino(diaDaSemana(3, 1), { z2: 10 }),
      treino(diaDaSemana(1, 1), { z2: 40 }),
    ]);
    const alturas = await page.evaluate(() => {
      const svg = document.querySelector('svg:has(rect[rx="4.2"])');
      return [...svg.querySelectorAll('rect[rx="1.6"]')].map((r) => +r.getAttribute("height"));
    });
    expect(alturas, "duas semanas com carga, duas barras").toHaveLength(2);
    /* 80 TRIMP contra 20: a barra maior tem de ser bem mais alta */
    expect(alturas[1] / alturas[0]).toBeGreaterThan(3);
  });

  test("a semana mais leve ainda desenha barra visível", async ({ page }) => {
    await abrirCom(page, [
      treino(diaDaSemana(3, 1), { z2: 2 }),
      treino(diaDaSemana(1, 1), { z2: 200 }),
    ]);
    const alturas = await page.evaluate(() => {
      const svg = document.querySelector('svg:has(rect[rx="4.2"])');
      return [...svg.querySelectorAll('rect[rx="1.6"]')].map((r) => +r.getAttribute("height"));
    });
    /* sem piso, 4 TRIMP contra 400 daria uma barra de 0,13 px — invisível */
    expect(Math.min(...alturas), "a semana leve não pode sumir").toBeGreaterThanOrEqual(1.5);
  });

  test("tocar num dia destaca a semana dele", async ({ page }) => {
    await abrirCom(page, [treino(diaDaSemana(2, 1), { z2: 30 })]);
    await irAoMapa(page);

    const svg = mapa(page);
    const antes = await svg.getByText("60", { exact: true }).getAttribute("font-weight");
    expect(antes, "em repouso nenhuma semana está em destaque").toBe("400");

    /* o quadrado do dia com treino */
    await page.evaluate(() => {
      const svg = document.querySelector('svg:has(rect[rx="4.2"])');
      const cheio = [...svg.querySelectorAll('rect[rx="4.2"]')].find((r) =>
        (r.getAttribute("fill") || "").startsWith("rgba(48,209,88"),
      );
      cheio.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await expect(svg.getByText("60", { exact: true })).toHaveAttribute("font-weight", "700");
  });
});
