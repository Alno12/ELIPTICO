import { describe, it, expect } from "vitest";
import { calcularStats, escala, escalaFacil, montarSemana, montarJanela, curvaDose } from "./stats.js";
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
    expect(montarSemana(historico(4), 0).dias.every((d) => d.plano === undefined)).toBe(true);
  });
});

describe("visão de uma semana", () => {
  it("offset 0 é a semana corrente e contém hoje", () => {
    const sem = montarSemana(historico(4), 0);
    expect(sem.dias).toHaveLength(7);
    expect(sem.inicio).toBe(iso(segundaHa(0)));
    expect(sem.dias.filter((d) => d.hoje)).toHaveLength(1);
  });

  it("offset recua uma semana por unidade", () => {
    const ses = historico(4);
    expect(montarSemana(ses, 1).inicio).toBe(iso(segundaHa(1)));
    expect(montarSemana(ses, 3).inicio).toBe(iso(segundaHa(3)));
  });

  it("agrega minutos, carga, equivalentes e sessões da semana", () => {
    /* 60 min em Z2 na segunda de cada semana: carga 120, equivalentes 60 */
    const sem = montarSemana(historico(4), 0);
    expect(sem.minutos).toBe(60);
    expect(sem.carga).toBe(120);
    expect(sem.equiv).toBe(60);
    expect(sem.sessoes).toBe(1);
  });

  it("semana sem treino vem zerada, não nula", () => {
    const sem = montarSemana(historico(4, { vazias: [0] }), 0);
    expect(sem.minutos).toBe(0);
    expect(sem.sessoes).toBe(0);
    expect(sem.dias).toHaveLength(7);
  });

  it("distribuição por zona da semana soma os dias", () => {
    const sem = montarSemana(historico(4), 0);
    expect(sem.zonas.z2).toBe(60);
    expect(sem.grand).toBe(60);
  });

  it("dias futuros da semana corrente são marcados", () => {
    const sem = montarSemana(historico(4), 0);
    const hojeIdx = sem.dias.findIndex((d) => d.hoje);
    expect(sem.dias.slice(0, hojeIdx + 1).every((d) => !d.futuro)).toBe(true);
    expect(sem.dias.slice(hojeIdx + 1).every((d) => d.futuro)).toBe(true);
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

describe("consistência conta as semanas paradas", () => {
  /* Regressão: as médias dividiam só pelas semanas em que houve treino, o que media
     a intensidade de quem aparece em vez da consistência de quem treina. */
  const paradaNoFim = () => historico(15, { vazias: [0, 1, 2, 3, 4] });

  it("média de minutos por semana divide por todas as semanas fechadas", () => {
    const st = calcularStats(paradaNoFim(), CFG);
    /* 10 semanas de 60 min em 15 semanas de histórico; a corrente não fechou */
    expect(st.totalCompletas).toBe(14);
    expect(st.mediaSemanal).toBeCloseTo(600 / 14, 1);
  });

  it("média de treinos por semana divide por todas as semanas fechadas", () => {
    const st = calcularStats(paradaNoFim(), CFG);
    expect(st.sessoesPorSemana).toBeCloseTo(10 / 14, 2);
  });

  it("semanas na meta contam as paradas no denominador", () => {
    /* 200 min em Z2 valem 200 min equivalentes, acima da meta de 150 */
    const st = calcularStats(historico(15, { min: 200, vazias: [0, 1, 2, 3, 4] }), CFG);
    expect(st.semanasNaMeta).toBe(10);
    expect(st.totalCompletas).toBe(14);
  });

  it("a meta é medida em minutos equivalentes, não em minutos brutos", () => {
    /* 100 min em Z4 = 100 brutos, mas 200 equivalentes: bate a meta de 150 */
    const emZ4 = historico(6).map((x) => ({
      ...x, zones: { z1: 0, z2: 0, z3: 0, z4: 100, z5: 0 }, total: 100,
    }));
    const st = calcularStats(emZ4, CFG);
    expect(st.semanasNaMeta).toBe(5);

    /* 160 min em Z1 = 160 brutos, mas 0 equivalentes: não bate */
    const emZ1 = historico(6).map((x) => ({
      ...x, zones: { z1: 160, z2: 0, z3: 0, z4: 0, z5: 0 }, total: 160,
    }));
    expect(calcularStats(emZ1, CFG).semanasNaMeta).toBe(0);
  });

  it("sem nenhuma semana parada, a média não muda", () => {
    const st = calcularStats(historico(10), CFG);
    expect(st.mediaSemanal).toBeCloseTo(60, 1);
    expect(st.sessoesPorSemana).toBeCloseTo(1, 2);
  });
});

describe("recordes", () => {
  it("um recorde batido na semana corrente aparece na hora", () => {
    const ses = historico(10);
    ses.push(sessao(iso(segundaHa(0)), 500));
    const st = calcularStats(ses, CFG);
    /* a semana corrente soma 60 + 500; antes ela era ignorada por não ter fechado */
    expect(st.recordes.maiorSemana.minutos).toBe(560);
    expect(st.recordes.maiorSemana.start).toBe(iso(segundaHa(0)));
  });

  it("FC máxima é nula quando nenhum treino registrou o campo", () => {
    const semFc = historico(4).map((x) => ({ ...x, maxHr: null }));
    const st = calcularStats(semFc, CFG);
    expect(st.fcMaxReg).toBeNull();
  });

  it("FC máxima devolve o maior valor quando há algum", () => {
    const ses = historico(4).map((x) => ({ ...x, maxHr: null }));
    ses[0] = { ...ses[0], maxHr: 181 };
    ses[1] = { ...ses[1], maxHr: 174 };
    const st = calcularStats(ses, CFG);
    expect(st.fcMaxReg).toBe(181);
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

/* A janela móvel dos últimos 7 dias. O risco aqui é errar a fronteira por um dia
   — incluir o oitavo, ou perder o de hoje —, e nenhum desses erros aparece na
   tela: só faz o número ficar um pouco errado para sempre. */
describe("montarJanela", () => {
  const diasAtras = (n) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const treino = (n, min) => ({
    id: `j${n}`,
    date: diasAtras(n),
    zones: { z1: 0, z2: min, z3: 0, z4: 0, z5: 0 },
    total: min,
    avgHr: null,
    maxHr: null,
    rpe: null,
    notes: "",
  });

  it("pega hoje e os seis dias anteriores, e para aí", () => {
    const j = montarJanela([treino(0, 10), treino(6, 10), treino(7, 99)]);
    expect(j.minutos, "o sétimo dia atrás está fora da janela").toBe(20);
    expect(j.sessoes).toBe(2);
  });

  it("a janela anterior começa exatamente onde a primeira termina", () => {
    const treinos = [treino(6, 5), treino(7, 5), treino(13, 5), treino(14, 99)];
    expect(montarJanela(treinos, 0).minutos).toBe(5);
    expect(montarJanela(treinos, 1).minutos, "deve pegar os dias 7 a 13").toBe(10);
  });

  it("nenhum dia cai nas duas janelas nem fica de fora", () => {
    const treinos = Array.from({ length: 14 }, (_, n) => treino(n, 1));
    expect(montarJanela(treinos, 0).sessoes + montarJanela(treinos, 1).sessoes).toBe(14);
  });

  it("soma carga e minutos equivalentes, não só o tempo", () => {
    const j = montarJanela([
      {
        id: "a",
        date: diasAtras(1),
        zones: { z1: 0, z2: 10, z3: 0, z4: 5, z5: 0 },
        total: 15,
        avgHr: null,
        maxHr: null,
        rpe: null,
        notes: "",
      },
    ]);
    expect(j.carga, "10×2 + 5×4").toBe(40);
    expect(j.equiv, "10×1 + 5×2").toBe(20);
  });

  it("histórico vazio devolve zeros, não NaN", () => {
    const j = montarJanela([]);
    expect([j.minutos, j.carga, j.equiv, j.sessoes]).toEqual([0, 0, 0, 0]);
  });
});


/* A curva da dose: a janela de 7 dias avaliada em cada um dos últimos N dias. É
   a mesma conta de `montarJanela` repetida no tempo, e o risco é o mesmo — errar
   a fronteira por um dia não aparece na tela, só deixa a curva torta. */
describe("curvaDose", () => {
  const diasAtras = (n) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const treino = (n, z2) => ({
    id: `c${n}`,
    date: diasAtras(n),
    zones: { z1: 0, z2, z3: 0, z4: 0, z5: 0 },
    total: z2,
    avgHr: null,
    maxHr: null,
    rpe: null,
    notes: "",
  });

  it("devolve um ponto por dia, terminando hoje", () => {
    const c = curvaDose([treino(1, 30)], 30);
    expect(c).toHaveLength(30);
    expect(c[29].date).toBe(diasAtras(0));
    expect(c[0].date).toBe(diasAtras(29));
  });

  it("cada ponto é a soma dos 7 dias que terminam nele", () => {
    /* um treino há 3 dias entra em todos os pontos de 3 a 9 dias atrás */
    const c = curvaDose([treino(3, 30)], 12);
    const dose = (atras) => c[c.length - 1 - atras].equiv;
    expect(dose(0), "hoje: o treino de 3 dias atrás ainda está na janela").toBe(30);
    expect(dose(3), "no próprio dia do treino").toBe(30);
    expect(dose(4), "um dia antes do treino: ainda não aconteceu").toBe(0);
  });

  it("o treino sai da janela no oitavo dia, não no sétimo", () => {
    const c = curvaDose([treino(0, 30)], 12);
    /* o ponto de hoje inclui; o de 7 dias adiante não existe ainda, então
       conferimos pelo caminho inverso: um treino de 6 dias atrás ainda conta */
    expect(c.at(-1).equiv).toBe(30);
    expect(curvaDose([treino(6, 30)], 3).at(-1).equiv, "6 dias atrás: dentro").toBe(30);
    expect(curvaDose([treino(7, 30)], 3).at(-1).equiv, "7 dias atrás: fora").toBe(0);
  });

  it("conta minutos equivalentes, não minutos brutos", () => {
    const forte = {
      id: "f",
      date: diasAtras(1),
      zones: { z1: 20, z2: 0, z3: 0, z4: 10, z5: 0 },
      total: 30,
      avgHr: null,
      maxHr: null,
      rpe: null,
      notes: "",
    };
    /* Z1 não conta, Z4 vale 2x: 30 min de treino viram 20 equivalentes */
    expect(curvaDose([forte], 3).at(-1).equiv).toBe(20);
  });

  it("o último ponto da curva é igual à janela de hoje", () => {
    const treinos = [treino(0, 10), treino(3, 20), treino(6, 15), treino(9, 99)];
    expect(curvaDose(treinos, 30).at(-1).equiv).toBe(montarJanela(treinos).equiv);
  });

  it("histórico vazio devolve a curva toda em zero, não NaN", () => {
    const c = curvaDose([], 30);
    expect(c.every((p) => p.equiv === 0)).toBe(true);
  });

  it("o custo não cresce com o histórico", () => {
    const muitos = Array.from({ length: 4000 }, (_, i) => treino(i % 900, 30));
    const t0 = performance.now();
    curvaDose(muitos, 30);
    expect(performance.now() - t0, "deve ficar bem abaixo de 50 ms").toBeLessThan(50);
  });
});
