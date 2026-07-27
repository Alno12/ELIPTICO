import { describe, it, expect } from "vitest";
import { normalizarSessao, normalizarSessoes, dataValida } from "./sessoes.js";

const boa = {
  id: "s-1",
  date: "2026-07-20",
  zones: { z1: 8, z2: 30, z3: 0, z4: 4, z5: 0 },
  total: 42,
  avgHr: 141,
  maxHr: 168,
  rpe: 6,
  notes: "tudo certo",
};

describe("registros que devem ser consertados", () => {
  /* Regressão do defeito que deixava a tela em branco: uma sessão sem `zones`
     fazia calcularStats acessar x.zones.z1 e derrubar a árvore inteira. */
  it("sessão sem o campo zones é descartada, não propaga", () => {
    const { date, ...semZonas } = { ...boa, zones: undefined, date: boa.date };
    expect(normalizarSessao({ ...semZonas, date })).toBeNull();
  });

  it("zona faltando é preenchida com zero, sem virar NaN", () => {
    const s = normalizarSessao({ ...boa, zones: { z2: 30 } });
    expect(s.zones).toEqual({ z1: 0, z2: 30, z3: 0, z4: 0, z5: 0 });
    expect(Object.values(s.zones).every(Number.isFinite)).toBe(true);
  });

  it("valores de zona inválidos viram zero", () => {
    const s = normalizarSessao({
      ...boa,
      zones: { z1: "abc", z2: 30, z3: null, z4: -5, z5: NaN },
    });
    expect(s.zones).toEqual({ z1: 0, z2: 30, z3: 0, z4: 0, z5: 0 });
    expect(s.total).toBe(30);
  });

  it("tempo fracionário é preservado", () => {
    const s = normalizarSessao({ ...boa, zones: { z2: 8.5, z4: 2.25 } });
    expect(s.zones.z2).toBeCloseTo(8.5, 6);
    expect(s.total).toBeCloseTo(10.75, 6);
  });

  it("bpm e esforço inválidos viram nulo em vez de NaN", () => {
    const s = normalizarSessao({ ...boa, avgHr: "x", maxHr: null, rpe: -3 });
    expect(s.avgHr).toBeNull();
    expect(s.maxHr).toBeNull();
    expect(s.rpe).toBeNull();
  });

  it("notas ausentes ou de outro tipo viram texto vazio", () => {
    expect(normalizarSessao({ ...boa, notes: undefined }).notes).toBe("");
    expect(normalizarSessao({ ...boa, notes: 42 }).notes).toBe("");
  });

  it("registro sem id ganha um id derivado da data e do tempo", () => {
    const s = normalizarSessao({ ...boa, id: undefined });
    expect(typeof s.id).toBe("string");
    expect(s.id.length).toBeGreaterThan(0);
  });
});

describe("total é derivado das zonas", () => {
  /* Regressão: `total` era gravado à parte e lido como verdade, então um valor
     divergente das zonas aparecia na tela como se fosse real. */
  it("total gravado em desacordo com as zonas é recalculado", () => {
    const s = normalizarSessao({ ...boa, total: 9999 });
    expect(s.total).toBe(42);
  });

  it("total ausente é calculado", () => {
    const s = normalizarSessao({ ...boa, total: undefined });
    expect(s.total).toBe(42);
  });
});

describe("registros irrecuperáveis são descartados", () => {
  it.each([
    ["null", null],
    ["texto", "não sou um treino"],
    ["número", 42],
    ["array", []],
    ["objeto vazio", {}],
    ["sem data", { ...boa, date: undefined }],
    ["data em formato errado", { ...boa, date: "20/07/2026" }],
    ["data inexistente", { ...boa, date: "2026-13-45" }],
    ["todas as zonas zeradas", { ...boa, zones: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 } }],
  ])("descarta: %s", (_rotulo, entrada) => {
    expect(normalizarSessao(entrada)).toBeNull();
  });
});

describe("normalização da lista inteira", () => {
  it("separa o que serve do que foi descartado", () => {
    const { sessoes, descartadas } = normalizarSessoes([
      boa,
      null,
      { ...boa, date: "2026-07-21", zones: { z2: 20 } },
      { ...boa, date: "lixo" },
    ]);
    expect(sessoes).toHaveLength(2);
    expect(descartadas).toBe(2);
  });

  it("entrada que não é lista devolve vazio sem lançar erro", () => {
    for (const entrada of [null, undefined, "x", 42, {}]) {
      expect(normalizarSessoes(entrada)).toEqual({ sessoes: [], descartadas: 0 });
    }
  });

  it("uma lista já íntegra passa sem alteração de conteúdo", () => {
    const { sessoes, descartadas } = normalizarSessoes([boa]);
    expect(descartadas).toBe(0);
    expect(sessoes[0].zones).toEqual(boa.zones);
    expect(sessoes[0].total).toBe(42);
    expect(sessoes[0].notes).toBe("tudo certo");
  });
});

describe("dataValida", () => {
  it("aceita datas reais no formato do app", () => {
    expect(dataValida("2026-07-20")).toBe(true);
    expect(dataValida("2024-02-29")).toBe(true);
  });

  it("recusa formato errado, data inexistente e não-texto", () => {
    for (const d of ["20/07/2026", "2026-7-20", "2026-13-01", "", null, 20260720]) {
      expect(dataValida(d)).toBe(false);
    }
  });
});
