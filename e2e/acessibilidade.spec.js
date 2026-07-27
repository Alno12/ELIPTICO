import { test, expect, abrirCom, treino, diaDaSemana } from "./apoio.js";

/* Calcula a razão de contraste do WCAG 2.1 a partir das cores realmente
   computadas na página, não das constantes do código: é o que o olho recebe. */
const RAZAO = `(() => {
  const canal = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  const rgb = (s) => s.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const opaco = (el) => {
    let n = el;
    while (n) {
      const c = getComputedStyle(n).backgroundColor;
      const p = c.match(/[\\d.]+/g);
      if (p && (p.length < 4 || Number(p[3]) > 0)) return rgb(c);
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  return (el) => {
    const a = lum(rgb(getComputedStyle(el).color));
    const b = lum(opaco(el));
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  };
})()`;

const historico = () => [
  treino(diaDaSemana(0, 0), { z1: 8, z2: 30 }, { avgHr: 140, maxHr: 165, rpe: 6 }),
  treino(diaDaSemana(1, 2), { z1: 10, z3: 6, z4: 12 }, { avgHr: 152, maxHr: 178, rpe: 8 }),
];

test.describe("contraste do texto", () => {
  /* Regressão: o texto de apoio ficava em 3,44:1, abaixo do mínimo de 4,5:1 do
     WCAG AA — os números que somem ao olhar a tela no sol.

     A checagem cobre a paleta NEUTRA, que é a que foi corrigida. As cores de
     destaque (verde, laranja, vermelho) reprovam por conta própria e estão
     registradas como item 2.5 do MELHORIAS.md: escurecê-las muda a aparência do
     app de forma visível e é decisão de produto, não de correção. São separadas
     aqui pela saturação, já que a neutra tem canais quase iguais. */
  test("todo texto neutro atinge o mínimo do WCAG AA", async ({ page }) => {
    await abrirCom(page, historico());

    const reprovados = await page.evaluate((fonte) => {
      const razao = eval(fonte);
      const canais = (s) =>
        s
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
      const neutra = (s) => {
        const c = canais(s);
        return Math.max(...c) - Math.min(...c) < 20;
      };
      /* fundo efetivo: o primeiro ancestral com cor de fundo opaca */
      const fundoDe = (el) => {
        let n = el;
        while (n) {
          const c = getComputedStyle(n).backgroundColor;
          const p = c.match(/[\d.]+/g);
          if (p && (p.length < 4 || Number(p[3]) > 0)) return canais(c);
          n = n.parentElement;
        }
        return [255, 255, 255];
      };
      const ruins = [];
      for (const el of document.querySelectorAll("div, span, p, strong, h1")) {
        if (!el.textContent?.trim()) continue;
        if (el.querySelector("div, span, p, strong, h1")) continue; // só folhas de texto
        const cs = getComputedStyle(el);
        /* Fora do escopo: texto sobre selo colorido (números de zona, dia de hoje)
           e texto nas cores de destaque. Os dois casos são o item 2.5. */
        if (!neutra(cs.color)) continue;
        const bg = fundoDe(el);
        if (Math.max(...bg) - Math.min(...bg) > 20) continue;
        const px = parseFloat(cs.fontSize);
        const peso = Number(cs.fontWeight) || 400;
        const grande = px >= 24 || (px >= 18.66 && peso >= 700);
        const minimo = grande ? 3.0 : 4.5;
        const r = razao(el);
        if (r < minimo) {
          ruins.push(`"${el.textContent.trim().slice(0, 20)}" ${r.toFixed(2)}:1 (min ${minimo})`);
        }
      }
      return ruins;
    }, RAZAO);

    expect(reprovados, `texto neutro abaixo do mínimo: ${reprovados.join(" | ")}`).toEqual([]);
  });

  test("a cor de texto secundário está acima de 4,5:1 sobre os dois fundos", async ({ page }) => {
    await abrirCom(page, historico());
    const medido = await page.evaluate((fonte) => {
      const razao = eval(fonte);
      const alvo = [...document.querySelectorAll("div")].find(
        (e) => e.textContent?.trim() === "Esta semana" && !e.querySelector("div"),
      );
      return alvo ? razao(alvo) : null;
    }, RAZAO);
    expect(medido).not.toBeNull();
    expect(medido).toBeGreaterThanOrEqual(4.5);
  });
});

test.describe("marcação acessível", () => {
  /* aria-current={boolean} produzia aria-current="false", que não é valor válido */
  test("a aba selecionada usa aria-current válido", async ({ page }) => {
    await abrirCom(page, historico());

    const valores = await page.$$eval("[aria-current]", (els) =>
      els.map((e) => e.getAttribute("aria-current")),
    );
    expect(valores).toEqual(["page"]);
    expect(valores).not.toContain("false");
  });

  test("os campos do formulário têm nome acessível", async ({ page }) => {
    await abrirCom(page, historico());
    await page.getByRole("button", { name: "Registrar treino" }).click();

    const semNome = await page.$$eval("input, textarea", (els) =>
      els
        .filter((e) => e.type !== "file" && e.type !== "hidden")
        .filter((e) => !e.getAttribute("aria-label") && !e.labels?.length)
        .map((e) => `${e.tagName}[${e.type || "texto"}]`),
    );
    expect(semNome).toEqual([]);
  });
});
