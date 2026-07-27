import { test as base, expect } from "@playwright/test";

/* ---------- datas ancoradas na semana corrente ---------- */

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* segunda-feira de `n` semanas atrás; n = 0 é a semana corrente */
export function segundaDe(n = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - n * 7);
  return d;
}

/* dia `offset` da semana de `n` semanas atrás (0 = segunda) */
export function diaDaSemana(n, offset) {
  const d = segundaDe(n);
  d.setDate(d.getDate() + offset);
  return d;
}

/* ---------- construção de treinos ---------- */

const ZERO = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

/* `zonas` em minutos decimais, ex.: { z2: 8.5 } são 8 min 30 s */
export function treino(data, zonas, extra = {}) {
  const zones = { ...ZERO, ...zonas };
  const total = Object.values(zones).reduce((a, b) => a + b, 0);
  return {
    id: `t-${iso(data)}-${total}-${Math.random().toString(36).slice(2, 7)}`,
    date: iso(data),
    zones,
    total,
    avgHr: null,
    maxHr: null,
    rpe: null,
    notes: "",
    ...extra,
  };
}

/* ---------- abertura do app ---------- */

const KEY_SESSOES = "eliptico:v5:sessoes";
const KEY_CFG = "eliptico:v5:config";

/* Abre o app com um histórico já gravado. `demoLimpo: true` impede a semeadura
   dos treinos de exemplo, para o teste controlar exatamente o que existe. */
export async function abrirCom(page, sessoes = [], cfg = {}) {
  await page.addInitScript(
    ([s, c, kS, kC]) => {
      localStorage.setItem(kS, JSON.stringify(s));
      localStorage.setItem(kC, JSON.stringify({ demoLimpo: true, ...c }));
    },
    [sessoes, cfg, KEY_SESSOES, KEY_CFG],
  );
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).first().waitFor();
}

/* Abre o app como um usuário que nunca o usou: sem nada no armazenamento. */
export async function abrirNovo(page) {
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).first().waitFor();
}

export const lerSessoes = (page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]"), KEY_SESSOES);

export const lerCfg = (page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), KEY_CFG);

/* ---------- teste com vigilância de erros ---------- */

/* Qualquer erro de runtime ou no console reprova o teste, mesmo que as asserções
   passem. Foi assim que apareceu a violação das regras de hooks: a tela quebrava
   sem que nenhuma asserção de conteúdo notasse. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const erros = [];
    page.on("pageerror", (e) => erros.push(`pageerror: ${e.message.split("\n")[0]}`));
    page.on("console", (m) => {
      if (m.type() === "error") erros.push(`console: ${m.text()}`);
    });
    await use(page);
    expect(erros, "o app não deve registrar erros de runtime").toEqual([]);
  },
});

export { expect };
