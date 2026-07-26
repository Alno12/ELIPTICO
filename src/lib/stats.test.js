import { describe, it, expect } from "vitest";
import { calcularStats, escala, escalaFacil } from "./stats.js";
import { iso, mondayOf } from "./datas.js";

const CFG = {
  maxHr: 193, restHr: 65, method: "hrr", weeklyGoal: 150,
  vo2max: 41.8, demoLimpo: true,
};

const sessao = (date, min = 60) => ({
  id: `s-${date}-${min}`,
  date,
  zones: { z1: 0, z2: min, z3: 0, z4: 0, z5: 0 },
  total: min,
  avgHr: 140, maxHr: 150, rpe: 5, notes: "",
});

/* segunda-feira de `n` semanas atrás; n = 0 é a semana corrente */
function segundaHa(n) {
  const d = mondayOf(new Date());
  d.setDate(d.getDate() - n * 7);
  return d;
}

/* Histórico com uma sessão na segunda-feira de cada semana.
   Sempre na segunda para nunca cair em data futura, seja hoje que dia for.
   `vazias` é um conjunto de índices (0 = semana corrente) a deixar sem treino. */
function historico(semanas, { min = 60, vazias = [] } = {}) {
  const out = [];
  for (let i = semanas - 1; i >= 0; i--) {
    if (vazias.includes(i)) continue;
    out.push(sessao(iso(segundaHa(i)), min));
  }
  return out;
}

describe("casos de contorno", () => {
  it("devolve null sem sessões", () => {
    expect(calcularStats([], CFG)).toBeNull();
  });

  it("aguenta uma única sessão sem quebrar", () => {
    const st = calcularStats([sessao(iso(segundaHa(0)))], CFG);
    expect(st.total).toBe(1);
    expect(st.streak).toBe(1);
    expect(st.maiorStreak).toBe(1);
    expect(Number.isFinite(st.mediaDur)).toBe(true);
  });
});

describe("sequências de semanas", () => {
  it("percorre todo o histórico, sem saturar na janela de exibição", () => {
    const st = calcularStats(historico(104), CFG);
    expect(st.streak).toBe(104);
    expect(st.maiorStreak).toBe(104);
  });

  it("semana corrente ainda vazia não quebra a sequência", () => {
    const st = calcularStats(historico(30, { vazias: [0] }), CFG);
    expect(st.streak).toBe(29);
  });

  it("semana vazia no meio quebra a sequência atual mas preserva o recorde", () => {
    /* 40 semanas: as 25 mais antigas com treino, 1 vazia, as 14 mais recentes com treino */
    const st = calcularStats(historico(40, { vazias: [14] }), CFG);
    expect(st.streak).toBe(14);
    expect(st.maiorStreak).toBe(25);
  });

  it("duas semanas vazias no fim zeram a sequência atual", () => {
    const st = calcularStats(historico(20, { vazias: [0, 1] }), CFG);
    expect(st.streak).toBe(0);
    expect(st.maiorStreak).toBe(18);
  });
});

describe("série semanal começa no primeiro treino", () => {
  it("não cria semanas anteriores ao primeiro registro", () => {
    const st = calcularStats(historico(3), CFG);
    expect(st.weeks).toHaveLength(3);
    expect(st.weeks[0].start).toBe(iso(segundaHa(2)));
  });

  it("uma única semana de histórico produz uma única entrada", () => {
    const st = calcularStats(historico(1), CFG);
    expect(st.weeks).toHaveLength(1);
    expect(st.weeks[0].start).toBe(iso(segundaHa(0)));
  });

  it("histórico longo mantém o recorte de 17 semanas para os gráficos", () => {
    const st = calcularStats(historico(40), CFG);
    expect(st.weeks).toHaveLength(17);
    expect(st.weeks[0].start).toBe(iso(segundaHa(16)));
  });
});

describe("plano de treino removido", () => {
  it("não expõe mais métricas de aderência", () => {
    const st = calcularStats(historico(4), CFG);
    expect(st.planoPrev).toBeUndefined();
    expect(st.planoFeito).toBeUndefined();
  });

  it("os dias da semana não carregam treino planejado", () => {
    const st = calcularStats(historico(4), CFG);
    expect(st.semanaAtual.every((d) => d.plano === undefined)).toBe(true);
  });
});

describe("perfil por dia da semana", () => {
  /* Regressão do defeito em que o numerador somava todo o histórico e o
     denominador saturava em 17 semanas, inflando a média conforme o histórico crescia. */
  it("média por dia da semana não infla com histórico longo", () => {
    const st = calcularStats(historico(104), CFG);
    const segunda = st.perfilDia[1];
    expect(segunda.sessoes).toBe(104);
    expect(segunda.media).toBeCloseTo(60, 1);
  });

  it("média por dia da semana bate com histórico curto", () => {
    const st = calcularStats(historico(8), CFG);
    expect(st.perfilDia[1].media).toBeCloseTo(60, 1);
  });

  it("dias sem treino ficam zerados", () => {
    const st = calcularStats(historico(104), CFG);
    expect(st.perfilDia[3].total).toBe(0);
    expect(st.perfilDia[3].media).toBe(0);
  });
});

describe("agregados e recordes cobrem todo o histórico", () => {
  it("conta todas as semanas fechadas, não só as da janela", () => {
    const st = calcularStats(historico(104, { min: 200 }), CFG);
    /* 104 semanas com treino; a corrente ainda não fechou */
    expect(st.totalCompletas).toBe(103);
    expect(st.semanasNaMeta).toBe(103);
  });

  it("semanas abaixo da meta não são contadas", () => {
    const st = calcularStats(historico(104, { min: 60 }), CFG);
    expect(st.totalCompletas).toBe(103);
    expect(st.semanasNaMeta).toBe(0);
  });

  it("maior semana encontra um pico muito além das últimas 17 semanas", () => {
    const ses = historico(104);
    ses.push(sessao(iso(segundaHa(60)), 300));
    const st = calcularStats(ses, CFG);
    expect(st.recordes.maiorSemana.minutos).toBe(360);
    expect(st.recordes.maiorSemana.start).toBe(iso(segundaHa(60)));
  });

  it("média semanal usa todo o histórico", () => {
    const st = calcularStats(historico(104), CFG);
    expect(st.mediaSemanal).toBeCloseTo(60, 1);
    expect(st.sessoesPorSemana).toBeCloseTo(1, 1);
  });

  it("média semanal reflete variação fora da janela de 17 semanas", () => {
    /* 60 min nas 100 semanas antigas, 600 min nas 4 recentes.
       Uma média que só olhasse as últimas 17 semanas ficaria bem acima da real. */
    const ses = [
      ...historico(104).slice(0, 100),
      ...[3, 2, 1, 0].map((i) => sessao(iso(segundaHa(i)), 600)),
    ];
    const st = calcularStats(ses, CFG);
    expect(st.mediaSemanal).toBeLessThan(150);
  });
});

describe("escalas de faixa", () => {
  it("razão aguda/crônica classifica pelas faixas usuais", () => {
    expect(escala(0.5, [0.8, 1.3, 1.5])).toBe("baixo");
    expect(escala(1.0, [0.8, 1.3, 1.5])).toBe("bom");
    expect(escala(1.4, [0.8, 1.3, 1.5])).toBe("atencao");
    expect(escala(1.8, [0.8, 1.3, 1.5])).toBe("alto");
  });

  it("monotonia usa a escala invertida", () => {
    expect(escala(1.0, [1.3, 2, 2.5], true)).toBe("bom");
    expect(escala(2.8, [1.3, 2, 2.5], true)).toBe("alto");
  });

  /* Regressão: 75-101% caía em "atencao" enquanto a leitura chamava >=75% de boa base. */
  it("tempo fácil concorda com o corte de 75% usado nas leituras", () => {
    expect(escalaFacil(74.9)).toBe("atencao");
    expect(escalaFacil(75)).toBe("bom");
    expect(escalaFacil(81)).toBe("bom");
    expect(escalaFacil(100)).toBe("bom");
  });
});

describe("carga e zonas", () => {
  it("TRIMP pondera cada zona pelo seu peso", () => {
    const s = {
      id: "x", date: iso(segundaHa(0)),
      zones: { z1: 10, z2: 10, z3: 10, z4: 10, z5: 10 },
      total: 50, avgHr: null, maxHr: null, rpe: null, notes: "",
    };
    const st = calcularStats([s], CFG);
    expect(st.cargaTotal).toBe(10 * (1 + 2 + 3 + 4 + 5));
  });

  it("proporção de tempo fácil soma Z1 e Z2", () => {
    const s = {
      id: "x", date: iso(segundaHa(0)),
      zones: { z1: 40, z2: 40, z3: 20, z4: 0, z5: 0 },
      total: 100, avgHr: null, maxHr: null, rpe: null, notes: "",
    };
    expect(calcularStats([s], CFG).polar).toBeCloseTo(80, 1);
  });
});
