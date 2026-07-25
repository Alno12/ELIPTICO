process.env.TZ = "America/Sao_Paulo";

import { describe, it, expect, beforeEach } from "vitest";
import { pad2, iso, dayjs, daysAgo, diffDias, mondayOf, longDate, shortDate, DIAS_CURTO, DIAS_NOME } from "./datas.js";

describe("pad2", () => {
  it("adiciona zero à esquerda em números de um dígito", () => {
    expect(pad2(5)).toBe("05");
  });

  it("não adiciona zero em números de dois dígitos", () => {
    expect(pad2(12)).toBe("12");
  });

  it("funciona com string", () => {
    expect(pad2("3")).toBe("03");
  });
});

describe("iso", () => {
  it("formata data no formato YYYY-MM-DD", () => {
    const d = new Date(2026, 2, 9); // 2026-03-09
    expect(iso(d)).toBe("2026-03-09");
  });

  it("adiciona zero à esquerda em mês de um dígito", () => {
    const d = new Date(2026, 0, 5); // 2026-01-05
    expect(iso(d)).toBe("2026-01-05");
  });

  it("adiciona zero à esquerda em dia de um dígito", () => {
    const d = new Date(2026, 11, 3); // 2026-12-03
    expect(iso(d)).toBe("2026-12-03");
  });

  it("usa fuso LOCAL, não UTC", () => {
    // 2026-07-25T01:30:00Z é 2026-07-24 às 22:30 em UTC-3
    // A função iso() deve usar getDate() local, não UTC
    const d = new Date("2026-07-25T01:30:00Z");
    // Em São Paulo (UTC-3), isso é 2026-07-24 22:30
    const resultado = iso(d);
    expect(resultado).toBe("2026-07-24");
  });

  it("iso(daysAgo(0)) é hoje", () => {
    const today = iso(daysAgo(0));
    const now = iso(new Date());
    // Ambas convenções devem concordar sobre o dia local
    expect(today).toBe(now);
  });
});

describe("dayjs", () => {
  it("parse de string YYYY-MM-DD retorna Date com 12:00:00 local", () => {
    const d = dayjs("2026-03-09");
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // 0-indexed
    expect(d.getDate()).toBe(9);
    expect(d.getHours()).toBe(12);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it("getDate() local é 9 para entrada '2026-03-09'", () => {
    const d = dayjs("2026-03-09");
    expect(d.getDate()).toBe(9);
  });
});

describe("daysAgo", () => {
  it("daysAgo(0) retorna Data com 12:00:00 local hoje", () => {
    const d = daysAgo(0);
    expect(d.getHours()).toBe(12);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it("daysAgo(0) equivale a iso(new Date())", () => {
    const d0 = iso(daysAgo(0));
    const now = iso(new Date());
    expect(d0).toBe(now);
  });

  it("daysAgo(7) é 7 dias antes de daysAgo(0) segundo diffDias", () => {
    const d0 = daysAgo(0);
    const d7 = daysAgo(7);
    const diff = diffDias(iso(d7), iso(d0));
    expect(diff).toBe(7);
  });

  it("daysAgo(1) é ontem", () => {
    const yesterday = daysAgo(1);
    const today = daysAgo(0);
    const diff = Math.floor((today - yesterday) / (24 * 60 * 60 * 1000));
    expect(diff).toBe(1);
  });
});

describe("diffDias", () => {
  it("diffDias('2026-03-01', '2026-03-09') === 8", () => {
    expect(diffDias("2026-03-01", "2026-03-09")).toBe(8);
  });

  it("ordem invertida dá -8", () => {
    expect(diffDias("2026-03-09", "2026-03-01")).toBe(-8);
  });

  it("datas iguais dão 0", () => {
    expect(diffDias("2026-03-09", "2026-03-09")).toBe(0);
  });

  it("atravessa mudança de horário com número inteiro de dias", () => {
    // Brasil tem mudança de horário no domingo de outubro
    // Vamos usar datas que atravessam a mudança
    // 2026-10-18 para 2026-10-25 (dois domingos)
    const diff = diffDias("2026-10-18", "2026-10-25");
    expect(Number.isInteger(diff)).toBe(true);
    expect(diff).toBe(7);
  });

  it("calcula diferença em número inteiro de dias", () => {
    const diff = diffDias("2026-01-01", "2026-01-31");
    expect(diff).toBe(30);
  });
});

describe("mondayOf", () => {
  it("retorna segunda-feira (getDay() === 1) para a semana", () => {
    // Semana de 2026-03-09 a 2026-03-15
    // 2026-03-09 é segunda-feira
    const monday = mondayOf(new Date(2026, 2, 9));
    expect(monday.getDay()).toBe(1);
  });

  it("retorna mesma segunda para todos os 7 dias da mesma semana", () => {
    const dates = [9, 10, 11, 12, 13, 14, 15]; // seg a dom
    const mondays = dates.map(d => iso(mondayOf(new Date(2026, 2, d))));
    expect(mondays.length).toBe(7);
    expect(new Set(mondays).size).toBe(1);
    expect(mondays[0]).toBe("2026-03-09");
  });

  it("de uma segunda-feira retorna ela mesma", () => {
    const d = new Date(2026, 2, 9); // 2026-03-09, que é segunda-feira
    const monday = mondayOf(d);
    expect(iso(monday)).toBe("2026-03-09");
    expect(monday.getDay()).toBe(1);
  });

  it("de uma quinta-feira retorna a segunda anterior", () => {
    const d = new Date(2026, 2, 12); // 2026-03-12, quinta-feira
    const monday = mondayOf(d);
    expect(monday.getDay()).toBe(1);
    expect(iso(monday)).toBe("2026-03-09");
  });

  it("de um domingo retorna a segunda da mesma semana", () => {
    const d = new Date(2026, 2, 15); // 2026-03-15, domingo
    const monday = mondayOf(d);
    expect(monday.getDay()).toBe(1);
    expect(iso(monday)).toBe("2026-03-09");
  });

  it("mantém horário em 12:00:00 local", () => {
    const d = new Date(2026, 2, 15);
    const monday = mondayOf(d);
    expect(monday.getHours()).toBe(12);
    expect(monday.getMinutes()).toBe(0);
    expect(monday.getSeconds()).toBe(0);
  });
});

describe("longDate", () => {
  it("formata com weekday completo, dia e mês por extenso em pt-BR", () => {
    const result = longDate("2026-03-09");
    expect(result).toContain("09");
    expect(result).toContain("março");
  });

  it("primeira letra maiúscula", () => {
    const result = longDate("2026-03-09");
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});

describe("shortDate", () => {
  it("formata com weekday curto, dia e mês curto em pt-BR", () => {
    const result = shortDate("2026-03-09");
    expect(result).toContain("09");
    expect(result).toMatch(/[a-z]{3}/i);
  });

  it("remove pontos do formato de mês curto", () => {
    const result = shortDate("2026-03-09");
    expect(result).not.toContain(".");
  });

  it("primeira letra maiúscula", () => {
    const result = shortDate("2026-03-09");
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});

describe("DIAS_CURTO", () => {
  it("é array com 7 elementos para os dias da semana", () => {
    expect(DIAS_CURTO).toHaveLength(7);
  });

  it("primeira posição é domingo", () => {
    expect(DIAS_CURTO[0]).toBe("D");
  });

  it("segunda posição é segunda", () => {
    expect(DIAS_CURTO[1]).toBe("S");
  });
});

describe("DIAS_NOME", () => {
  it("é array com 7 elementos para os dias da semana", () => {
    expect(DIAS_NOME).toHaveLength(7);
  });

  it("primeira posição é domingo", () => {
    expect(DIAS_NOME[0]).toBe("domingo");
  });

  it("segunda posição é segunda", () => {
    expect(DIAS_NOME[1]).toBe("segunda");
  });

  it("contém nomes com acentuação", () => {
    expect(DIAS_NOME).toContain("terça");
    expect(DIAS_NOME).toContain("quarta");
    expect(DIAS_NOME).toContain("quinta");
    expect(DIAS_NOME).toContain("sábado");
  });
});
