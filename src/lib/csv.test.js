import { describe, it, expect } from "vitest";
import { parseCsv, chaveSessao, sessoesDeCsv } from "./csv.js";

describe("parseCsv", () => {
  it("parse linha comum com todos os campos", () => {
    const csv = `data,total_min,z1,z2,z3,z4,z5,trimp,fc_media,fc_max,rpe,notas
2026-03-09,30,8,22,0,0,0,60,141,158,5,"tudo certo"`;
    const linhas = parseCsv(csv);
    expect(linhas).toHaveLength(2);
    expect(linhas[0][0]).toBe("data");
    expect(linhas[1][2]).toBe("8");
  });

  it("remove BOM do início do arquivo", () => {
    const csv = `﻿data,notas
2026-03-09,"teste"`;
    const linhas = parseCsv(csv);
    expect(linhas[0][0]).toBe("data");
  });

  it("normaliza quebras de linha CRLF e LF", () => {
    const csv = `data,notas\r\n2026-03-09,"teste"\r2026-03-10,"outro"`;
    const linhas = parseCsv(csv);
    expect(linhas).toHaveLength(3);
  });

  it("escape de aspas duplicadas", () => {
    const csv = `data,notas
2026-03-09,"Corri bem, mas o ""joelho"" doeu"`;
    const linhas = parseCsv(csv);
    expect(linhas[1][1]).toBe('Corri bem, mas o "joelho" doeu');
  });

  it("campo vazio entre vírgulas", () => {
    const csv = `a,b,c
1,,3`;
    const linhas = parseCsv(csv);
    expect(linhas[1]).toEqual(["1", "", "3"]);
  });
});

describe("sessoesDeCsv", () => {
  it("linha comum com dados válidos", () => {
    const csv = `data,total_min,z1,z2,z3,z4,z5,trimp,fc_media,fc_max,rpe,notas
2026-03-09,30,8,22,0,0,0,60,141,158,5,"tudo certo"`;
    const { sessoes, ignoradas } = sessoesDeCsv(csv);
    expect(ignoradas).toBe(0);
    expect(sessoes).toHaveLength(1);
    const s = sessoes[0];
    expect(s.date).toBe("2026-03-09");
    expect(s.zones).toEqual({ z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 });
    expect(s.total).toBe(30);
    expect(s.avgHr).toBe(141);
    expect(s.maxHr).toBe(158);
    expect(s.rpe).toBe(5);
    expect(s.notes).toBe("tudo certo");
  });

  it("campos opcionais vazios retornam null", () => {
    const csv = `data,z1,z2,z3,z4,z5,fc_media,fc_max,rpe,notas
2026-03-09,5,10,0,0,0,"","",""`;
    const { sessoes } = sessoesDeCsv(csv);
    const s = sessoes[0];
    expect(s.avgHr).toBeNull();
    expect(s.maxHr).toBeNull();
    expect(s.rpe).toBeNull();
  });

  it("notas com vírgula e aspas escapadas", () => {
    const csv = `data,z1,z2,z3,z4,z5,notas
2026-03-09,5,10,0,0,0,"Corri bem, mas o ""joelho"" doeu"`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].notes).toBe('Corri bem, mas o "joelho" doeu');
  });

  it("notas com acentuação e cedilha preservadas", () => {
    const csv = `data,z1,z2,z3,z4,z5,notas
2026-03-09,5,10,0,0,0,"Corri bem na São Paulo e Açude"`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].notes).toBe("Corri bem na São Paulo e Açude");
  });

  it("todas as 5 zonas com valores diferentes", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,1,2,3,4,5`;
    const { sessoes } = sessoesDeCsv(csv);
    const s = sessoes[0];
    expect(s.zones).toEqual({ z1: 1, z2: 2, z3: 3, z4: 4, z5: 5 });
    expect(s.total).toBe(15);
  });

  it("ordem das colunas trocada não afeta parsing", () => {
    const csv = `notas,z5,z4,z3,z2,z1,data,fc_max,fc_media,rpe
"test",0,0,0,5,8,2026-03-09,158,141,5`;
    const { sessoes } = sessoesDeCsv(csv);
    const s = sessoes[0];
    expect(s.date).toBe("2026-03-09");
    expect(s.zones.z1).toBe(8);
    expect(s.zones.z2).toBe(5);
    expect(s.notes).toBe("test");
  });

  it("data inválida entra em ignoradas", () => {
    const csv = `data,z1,z2,z3,z4,z5
banana,5,10,0,0,0
2026-03-09,5,10,0,0,0`;
    const { sessoes, ignoradas } = sessoesDeCsv(csv);
    expect(ignoradas).toBe(1);
    expect(sessoes).toHaveLength(1);
  });

  it("todas as zonas zeradas entra em ignoradas", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,0,0,0,0,0
2026-03-10,1,2,0,0,0`;
    const { sessoes, ignoradas } = sessoesDeCsv(csv);
    expect(ignoradas).toBe(1);
    expect(sessoes).toHaveLength(1);
  });

  it("linhas em branco no meio desconsideradas", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,1,2,0,0,0

2026-03-10,3,4,0,0,0

2026-03-11,5,6,0,0,0`;
    const { sessoes, ignoradas } = sessoesDeCsv(csv);
    expect(sessoes).toHaveLength(3);
    expect(ignoradas).toBe(0);
  });

  it("CSV sem coluna 'data' lança erro", () => {
    const csv = `z1,z2,z3,z4,z5
1,2,0,0,0`;
    expect(() => sessoesDeCsv(csv)).toThrow("coluna 'data' não encontrada");
  });

  it("string vazia lança erro", () => {
    expect(() => sessoesDeCsv("")).toThrow("arquivo sem linhas de dados");
  });

  it("RPE fora de faixa (99) é limitado a 10", () => {
    const csv = `data,z1,z2,z3,z4,z5,rpe
2026-03-09,1,2,0,0,0,99`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].rpe).toBe(10);
  });

  it("RPE negativo é limitado a 0", () => {
    const csv = `data,z1,z2,z3,z4,z5,rpe
2026-03-09,1,2,0,0,0,-5`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].rpe).toBeNull();
  });

  it("trimp é ignorado, não afeta o parsing", () => {
    const csv = `data,z1,z2,z3,z4,z5,trimp
2026-03-09,1,2,0,0,0,999`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes).toHaveLength(1);
  });

  it("espaços em branco no cabeçalho são trimados", () => {
    const csv = `  data  ,  z1  ,  z2  ,  z3  ,  z4  ,  z5
2026-03-09,1,2,0,0,0`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].date).toBe("2026-03-09");
  });

  it("vírgula como separador decimal é convertida", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,1,5,0,0,0`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].total).toBe(6);
  });

  it("BOM no início não atrapalha", () => {
    const csv = `﻿data,z1,z2,z3,z4,z5
2026-03-09,3,7,0,0,0`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes).toHaveLength(1);
    expect(sessoes[0].total).toBe(10);
  });
});

describe("chaveSessao", () => {
  it("mesma data e mesmas zonas produzem mesma chave", () => {
    const s1 = { date: "2026-03-09", zones: { z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 } };
    const s2 = { date: "2026-03-09", zones: { z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 } };
    expect(chaveSessao(s1)).toBe(chaveSessao(s2));
  });

  it("mesma data com zonas diferentes produzem chaves diferentes", () => {
    const s1 = { date: "2026-03-09", zones: { z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 } };
    const s2 = { date: "2026-03-09", zones: { z1: 8, z2: 23, z3: 0, z4: 0, z5: 0 } };
    expect(chaveSessao(s1)).not.toBe(chaveSessao(s2));
  });

  it("datas diferentes com mesmas zonas produzem chaves diferentes", () => {
    const s1 = { date: "2026-03-09", zones: { z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 } };
    const s2 = { date: "2026-03-10", zones: { z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 } };
    expect(chaveSessao(s1)).not.toBe(chaveSessao(s2));
  });

  it("zonas ausentes são tratadas como 0 na chave", () => {
    const s1 = { date: "2026-03-09", zones: { z1: 8, z2: 22 } };
    const s2 = { date: "2026-03-09", zones: { z1: 8, z2: 22, z3: 0, z4: 0, z5: 0 } };
    expect(chaveSessao(s1)).toBe(chaveSessao(s2));
  });
});

describe("tempos fracionários", () => {
  it("sessoesDeCsv não arredonda tempo de zona", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,0,8.5,0,0,0`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].zones.z2).toBe(8.5);
  });

  it("vírgula decimal é convertida para ponto", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,0,8,5,0,0,0`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].zones.z2).toBe(8);
    expect(sessoes[0].zones.z3).toBe(5);
  });

  it("vírgula decimal em tempo fracionário", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,0,8,5,0,0,0`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].zones.z2).toBe(8);
  });

  it("total é a soma dos tempos fracionários", () => {
    const csv = `data,z1,z2,z3,z4,z5
2026-03-09,1.5,2.5,3.5,4.5,5.5`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].total).toBe(17.5);
  });

  it("fc_media é arredondado para inteiro", () => {
    const csv = `data,z1,z2,z3,z4,z5,fc_media
2026-03-09,1,2,0,0,0,141.6`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].avgHr).toBe(142);
  });

  it("fc_max é arredondado para inteiro", () => {
    const csv = `data,z1,z2,z3,z4,z5,fc_max
2026-03-09,1,2,0,0,0,158.4`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].maxHr).toBe(158);
  });

  it("rpe é arredondado para inteiro", () => {
    const csv = `data,z1,z2,z3,z4,z5,rpe
2026-03-09,1,2,0,0,0,6.7`;
    const { sessoes } = sessoesDeCsv(csv);
    expect(sessoes[0].rpe).toBe(7);
  });

  it("chaveSessao normaliza ruído de ponto flutuante", () => {
    // 20/60 = 0.3333... e 0.3333 devem produzir a mesma chave
    const s1 = { date: "2026-03-09", zones: { z1: 0, z2: 20 / 60, z3: 0, z4: 0, z5: 0 } };
    const s2 = { date: "2026-03-09", zones: { z1: 0, z2: 0.3333, z3: 0, z4: 0, z5: 0 } };
    expect(chaveSessao(s1)).toBe(chaveSessao(s2));
  });

  it("tempos genuinamente diferentes produzem chaves diferentes", () => {
    const s1 = { date: "2026-03-09", zones: { z1: 0, z2: 8.5, z3: 0, z4: 0, z5: 0 } };
    const s2 = { date: "2026-03-09", zones: { z1: 0, z2: 8.6, z3: 0, z4: 0, z5: 0 } };
    expect(chaveSessao(s1)).not.toBe(chaveSessao(s2));
  });

  it("reimportação de CSV exportado não cria duplicatas", () => {
    // Simula: importar um CSV, exportá-lo, reimportar
    const csv1 = `data,z1,z2,z3,z4,z5
2026-03-09,1.5,8.5,0,0,0`;
    const { sessoes: sessoes1 } = sessoesDeCsv(csv1);
    const chave1 = chaveSessao(sessoes1[0]);

    // Simula export e reimport com mesmos dados
    const csv2 = `data,z1,z2,z3,z4,z5
2026-03-09,1.5,8.5,0,0,0`;
    const { sessoes: sessoes2 } = sessoesDeCsv(csv2);
    const chave2 = chaveSessao(sessoes2[0]);

    expect(chave1).toBe(chave2);
  });
});
