import { test, expect, abrirCom, treino, diaDaSemana, iso } from "./apoio.js";

/* A seção de zonas 4 e 5 na aba Tendências.

   O que ela tem de próprio é separar Z4 e Z5 de Z3: o card "Proporção de
   intensidade", logo acima, mede Z3+ e mistura ritmo forte com limiar. Os testes
   abaixo cobrem justamente a fronteira — Z3 não pode vazar para cá — e a leitura
   que só esta seção faz, a de que uma fatia pequena do relógio ocupa uma fatia
   grande da carga. */

const diasAtras = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

const irAoForte = async (page) => {
  await page.getByRole("button", { name: "Tendências", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tendências");
};

/* rola a seção para o meio do rolador; sem isso os cards de baixo ficam fora da
   viewport ou sob a barra de abas */
const rolarAte = async (page, texto) => {
  const alvo = page.getByText(texto, { exact: true }).first();
  await alvo.evaluate((el) => {
    const r = document.querySelector('[data-rolagem="app"]');
    r.scrollTop += el.getBoundingClientRect().top - 120;
  });
  await page.waitForTimeout(120);
};

test.describe("trabalho forte", () => {
  test("os minutos de Z4 e Z5 dos últimos 7 dias aparecem no topo da seção", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z1: 10, z2: 30, z4: 8, z5: 3 })]);
    await irAoForte(page);
    await rolarAte(page, "Trabalho forte");

    await expect(page.getByText("Minutos em Z4 e Z5, semana a semana")).toBeVisible();
    /* 8 + 3 = 11 min fortes, e a legenda reparte entre as duas zonas */
    await expect(page.getByText("min nos últimos 7 dias")).toBeVisible();
    await expect(page.getByText("Z4 · Limiar")).toBeVisible();
    await expect(page.getByText("Z5 · Máximo")).toBeVisible();
  });

  test("Z3 não entra na conta do trabalho forte", async ({ page }) => {
    /* 40 min de Z3 e nada de Z4/Z5: a seção tem de dizer que não há trabalho forte */
    await abrirCom(page, [treino(diasAtras(2), { z1: 10, z2: 20, z3: 40 })]);
    await irAoForte(page);
    await expect(page.getByText("Zonas 4 e 5")).toBeVisible();
    await expect(page.getByText(/ainda não registrou nenhum minuto em Z4/)).toBeVisible();
    await expect(page.getByText("Trabalho forte")).toHaveCount(0);
  });

  test("a carga pesa mais que o relógio, e o card mostra o quanto", async ({ page }) => {
    /* 10 min de Z2 e 10 de Z4 nos últimos 7 dias: 50% do tempo, mas 40 de 60
       TRIMP — 66,7% da carga, ou 1,3× o peso no relógio */
    await abrirCom(page, [treino(diasAtras(1), { z2: 10, z4: 10 })]);
    await irAoForte(page);
    await page.getByRole("button", { name: "7 D" }).click();
    await rolarAte(page, "Peso na carga");

    await expect(page.getByText("1,3×")).toBeVisible();
    await expect(page.getByText("Do seu tempo total")).toBeVisible();
    await expect(page.getByText("50%", { exact: true })).toBeVisible();
    await expect(page.getByText("Da sua carga total")).toBeVisible();
    await expect(page.getByText("67%", { exact: true })).toBeVisible();
    await expect(page.getByText("10 de 20 min")).toBeVisible();
    await expect(page.getByText("40 de 60 TRIMP")).toBeVisible();
  });

  test("o seletor de período move o card de peso na carga", async ({ page }) => {
    /* forte só há 40 dias: invisível em 30 dias, presente em 90 */
    await abrirCom(page, [
      treino(diasAtras(40), { z2: 10, z4: 10 }),
      treino(diasAtras(2), { z2: 30 }),
    ]);
    await irAoForte(page);
    await page.getByRole("button", { name: "30 D" }).click();
    await rolarAte(page, "Peso na carga");
    await expect(page.getByText(/Nenhum minuto em Z4 ou Z5 nesta janela/)).toBeVisible();

    await page.getByRole("button", { name: "90 D" }).click();
    await rolarAte(page, "Peso na carga");
    await expect(page.getByText(/Nenhum minuto em Z4 ou Z5 nesta janela/)).toHaveCount(0);
    await expect(page.getByText("Do seu tempo total")).toBeVisible();
  });

  test("o espaçamento entre estímulos conta dias, não sessões", async ({ page }) => {
    /* dois treinos fortes no MESMO dia contam como um estímulo só */
    await abrirCom(page, [
      treino(diasAtras(6), { z2: 20, z4: 10 }),
      treino(diasAtras(2), { z2: 20, z4: 10 }),
      treino(diasAtras(2), { z2: 20, z4: 8 }),
    ]);
    await irAoForte(page);
    await rolarAte(page, "Recuperação entre estímulos");

    await expect(page.getByText("Sessões fortes", { exact: true })).toBeVisible();
    /* 2 dias fortes, intervalo de 4 dias, nenhum par em dias seguidos */
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("4,0 d")).toBeVisible();
    await expect(page.getByText("Dias seguidos", { exact: true })).toBeVisible();
  });

  test("dias fortes emendados aparecem na contagem de dias seguidos", async ({ page }) => {
    await abrirCom(page, [
      treino(diasAtras(5), { z2: 20, z4: 10 }),
      treino(diasAtras(4), { z2: 20, z4: 10 }),
    ]);
    await irAoForte(page);
    await rolarAte(page, "Recuperação entre estímulos");
    await expect(page.getByText("1,0 d")).toBeVisible();
  });

  test("a tira desenha um traço por dia da janela", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(3), { z2: 20, z4: 10 })]);
    await irAoForte(page);
    const tracos = await page.evaluate(() => {
      const svg = [...document.querySelectorAll("svg")].find(
        (el) => el.querySelectorAll('rect[rx="2.4"]').length > 0,
      );
      return svg ? svg.querySelectorAll("rect").length : 0;
    });
    expect(tracos, "35 dias, um retângulo cada").toBe(35);
  });

  test("as sessões fortes recentes listam o corte entre Z4 e Z5", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(3), { z1: 5, z2: 20, z4: 9, z5: 4 })]);
    await irAoForte(page);
    await rolarAte(page, "Sessões fortes recentes");
    await expect(page.getByText("Z4 9 min · Z5 4 min · 38 min no total")).toBeVisible();
    await expect(page.getByText("13 min").first()).toBeVisible();
  });

  test("um treino abaixo do corte não vira sessão forte", async ({ page }) => {
    /* 2 min de Z4 é o fim de uma subida, não um estímulo procurado */
    await abrirCom(page, [treino(diasAtras(3), { z2: 30, z4: 2 })]);
    await irAoForte(page);
    await rolarAte(page, "Recuperação entre estímulos");
    await expect(page.getByText("Sessões fortes recentes")).toHaveCount(0);
  });

  test("sem nenhum Z4 ou Z5 a seção não desenha quatro cards vazios", async ({ page }) => {
    await abrirCom(page, [treino(diasAtras(2), { z1: 10, z2: 40 })]);
    await irAoForte(page);
    await expect(page.getByText(/ainda não registrou nenhum minuto em Z4/)).toBeVisible();
    for (const t of ["Trabalho forte", "Peso na carga", "Recuperação entre estímulos"]) {
      await expect(page.getByText(t, { exact: true })).toHaveCount(0);
    }
  });

  test("a seção fica entre Proporção de intensidade e Perfil semanal", async ({ page }) => {
    await abrirCom(page, [treino(diaDaSemana(0, 1), { z1: 10, z2: 30, z4: 8, z5: 2 })]);
    await irAoForte(page);
    const ordem = await page.evaluate(() => {
      const alvos = [
        "Proporção de intensidade",
        "Trabalho forte",
        "Peso na carga",
        "Recuperação entre estímulos",
        "Sessões fortes recentes",
        "Perfil semanal",
      ];
      const todos = [...document.querySelectorAll("*")].filter(
        (el) => el.children.length === 0 && alvos.includes(el.textContent.trim()),
      );
      return todos.map((el) => el.textContent.trim());
    });
    expect(ordem).toEqual([
      "Proporção de intensidade",
      "Trabalho forte",
      "Peso na carga",
      "Recuperação entre estímulos",
      "Sessões fortes recentes",
      "Perfil semanal",
    ]);
  });
});

/* guarda contra o dia em que `iso` deixar de ser usado por aqui */
test("as datas do apoio continuam no formato do armazenamento", () => {
  expect(iso(diasAtras(0))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
