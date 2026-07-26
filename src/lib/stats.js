import { sum, desvio, pearson } from "./util.js";
import { iso, dayjs, daysAgo, diffDias, mondayOf, DIAS_CURTO } from "./datas.js";
import { ZONES, trimp, equiv } from "./treino.js";

/* Visão de uma semana de segunda a domingo. offset 0 é a semana corrente, 1 a
   anterior, e assim por diante. Pura e independente de `calcularStats`: é o que
   permite a aba Semana navegar pelo histórico sem recomputar tudo. */
export function montarSemana(sessions, offset = 0) {
  const hoje = iso(new Date());
  const seg = mondayOf(daysAgo(offset * 7));
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(seg); d.setDate(d.getDate() + i);
    const dISO = iso(d);
    const ses = sessions.filter((x) => x.date === dISO);
    dias.push({
      date: dISO,
      wd: d.getDay(),
      futuro: dISO > hoje,
      hoje: dISO === hoje,
      sessoes: ses,
      total: sum(ses, (x) => x.total),
      carga: sum(ses, trimp),
      equiv: sum(ses, equiv),
      zones: Object.fromEntries(ZONES.map((z) => [z.id, sum(ses, (x) => x.zones[z.id] || 0)])),
    });
  }
  const zonas = Object.fromEntries(ZONES.map((z) => [z.id, sum(dias, (d) => d.zones[z.id])]));
  return {
    offset,
    inicio: dias[0].date,
    fim: dias[6].date,
    dias,
    zonas,
    grand: ZONES.reduce((a, z) => a + zonas[z.id], 0),
    minutos: sum(dias, (d) => d.total),
    carga: sum(dias, (d) => d.carga),
    equiv: sum(dias, (d) => d.equiv),
    sessoes: sum(dias, (d) => d.sessoes.length),
  };
}

/* Núcleo de estatísticas. Puro: entra (sessions, cfg), sai o objeto de métricas.
   Sem React, para poder ser testado sem montar componente. */
export function calcularStats(sessions, cfg) {
    if (!sessions.length) return null;
    const asc = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    const hoje = iso(new Date());
    const cut = (n) => iso(daysAgo(n));

    const w0 = sessions.filter((x) => x.date >= cut(6));
    const w1 = sessions.filter((x) => x.date >= cut(13) && x.date < cut(6));
    const d28 = sessions.filter((x) => x.date >= cut(27));
    const d28ant = sessions.filter((x) => x.date >= cut(55) && x.date < cut(27));

    const load0 = sum(w0, trimp);
    const load1 = sum(w1, trimp);
    const cronica = sum(d28, trimp) / 4;

    /* carga diária contínua */
    const porDia = {};
    sessions.forEach((x) => { porDia[x.date] = (porDia[x.date] || 0) + trimp(x); });
    const inicio = asc[0].date;
    const nDias = diffDias(inicio, hoje) + 1;
    const daily = [];
    for (let i = 0; i < nDias; i++) {
      const d = new Date(dayjs(inicio)); d.setDate(d.getDate() + i);
      daily.push({ date: iso(d), carga: porDia[iso(d)] || 0 });
    }

    /* aptidão, fadiga, forma */
    let ctl = 0, atl = 0;
    const pmc = daily.map((d) => {
      const tsb = ctl - atl;
      ctl += (d.carga - ctl) / 42;
      atl += (d.carga - atl) / 7;
      return { date: d.date, ctl, atl, tsb };
    });
    const forma = pmc[pmc.length - 1] || { ctl: 0, atl: 0, tsb: 0 };
    const cargaDiariaMedia = daily.slice(-28).reduce((a, b) => a + b.carga, 0) / 28;
    const projetar = (fator, dias = 28) => {
      let c = forma.ctl;
      for (let i = 0; i < dias; i++) c += (cargaDiariaMedia * fator - c) / 42;
      return c;
    };

    /* monotonia e strain */
    const ult7 = daily.slice(-7).map((d) => d.carga);
    const media7 = ult7.reduce((a, b) => a + b, 0) / Math.max(1, ult7.length);
    const sd7 = desvio(ult7);
    const monotonia = sd7 > 0 ? media7 / sd7 : null;
    const strain = monotonia != null ? load0 * monotonia : null;

    /* Série semanal de TODO o histórico, começando na semana do primeiro treino
       registrado — semanas anteriores a ele não existem para o app e não aparecem
       em lugar nenhum. `weeks`, mais abaixo, é o recorte das 17 últimas que os
       gráficos desenham; recordes, médias e o perfil por dia da semana precisam
       do histórico inteiro, senão saturam na janela de exibição. */
    const nSemanasHist = Math.floor(diffDias(iso(mondayOf(dayjs(inicio))), iso(mondayOf(new Date()))) / 7) + 1;
    const porSemana = {};
    sessions.forEach((x) => { (porSemana[iso(mondayOf(dayjs(x.date)))] ||= []).push(x); });

    const todasSemanas = [];
    for (let i = nSemanasHist - 1; i >= 0; i--) {
      const start = mondayOf(daysAgo(i * 7));
      const end = new Date(start); end.setDate(end.getDate() + 6);
      const inWeek = porSemana[iso(start)] || [];
      const zw = Object.fromEntries(ZONES.map((z) => [z.id, sum(inWeek, (x) => x.zones[z.id] || 0)]));
      todasSemanas.push({
        start: iso(start),
        completa: iso(end) < hoje,
        minutos: sum(inWeek, (x) => x.total),
        carga: sum(inWeek, trimp),
        sessoes: inWeek.length,
        z3mais: sum(inWeek, (x) => (x.zones.z3 || 0) + (x.zones.z4 || 0) + (x.zones.z5 || 0)),
        equiv: sum(inWeek, equiv),
        zones: zw,
      });
    }
    /* média móvel de 4 semanas: calculada sobre a série completa, então a
       ponta esquerda do gráfico deixa de subir a partir do zero */
    todasSemanas.forEach((w, i) => {
      const win = todasSemanas.slice(Math.max(0, i - 3), i + 1);
      w.media4 = win.reduce((a, b) => a + b.carga, 0) / win.length;
    });

    const weeks = todasSemanas.slice(-17);
    /* Semanas fechadas, INCLUINDO as que ficaram sem treino: as médias precisam
       delas no denominador, senão medem a intensidade de quem aparece em vez da
       consistência de quem treina. `comTreino` é o recorte usado só nos recordes. */
    const fechadas = todasSemanas.filter((w) => w.completa);
    const comTreino = todasSemanas.filter((w) => w.sessoes > 0);
    const ult8 = fechadas.slice(-8);
    const variacaoSemanal = desvio(ult8.map((w) => w.minutos));
    /* a meta é medida em minutos equivalentes, como a barra da aba Semana;
       comparar contra minutos brutos aqui daria dois critérios para a mesma meta */
    const semanasNaMeta = fechadas.filter((w) => w.equiv >= cfg.weeklyGoal).length;

    /* zonas */
    const zoneTotals = Object.fromEntries(ZONES.map((z) => [z.id, sum(sessions, (x) => x.zones[z.id] || 0)]));
    const grand = Object.values(zoneTotals).reduce((a, b) => a + b, 0);
    const polar = grand ? ((zoneTotals.z1 + zoneTotals.z2) / grand) * 100 : 0;

    /* densidade */
    const dens = (arr) => {
      const m = sum(arr, (x) => x.total);
      return m ? sum(arr, trimp) / m : null;
    };

    /* frequência cardíaca */
    const hrSes = asc.filter((x) => x.avgHr && x.zones.z4 + x.zones.z5 < 3).slice(-12);
    let deltaHr = null;
    if (hrSes.length >= 5) {
      const n = hrSes.length, mx = (n - 1) / 2;
      const my = hrSes.reduce((a, b) => a + b.avgHr, 0) / n;
      let nume = 0, deno = 0;
      hrSes.forEach((x, i) => { nume += (i - mx) * (x.avgHr - my); deno += (i - mx) ** 2; });
      deltaHr = deno ? (nume / deno) * (n - 1) : 0;
    }
    const reserva = cfg.maxHr - cfg.restHr;
    const comHr28 = d28.filter((x) => x.avgHr);
    const pctFCR = comHr28.length && reserva > 0
      ? (sum(comHr28, (x) => (x.avgHr - cfg.restHr) / reserva) / comHr28.length) * 100 : null;

    /* percepção */
    const comRpe = sessions.filter((x) => x.rpe);
    const rpeMedia = comRpe.length ? sum(comRpe, (x) => x.rpe) / comRpe.length : null;
    const rpeCorr = comRpe.length >= 6 ? pearson(comRpe.map(trimp), comRpe.map((x) => x.rpe)) : null;
    const rpePontos = comRpe.map((x) => ({ x: trimp(x), y: x.rpe }));

    /* perfil por dia da semana */
    const perfilDia = DIAS_CURTO.map((_, wd) => {
      const ses = sessions.filter((x) => dayjs(x.date).getDay() === wd);
      /* numerador cobre todo o histórico, então o denominador precisa cobrir também:
         o número de semanas decorridas desde o primeiro registro */
      const semanas = Math.max(1, nSemanasHist);
      return { wd, total: sum(ses, (x) => x.total), media: sum(ses, (x) => x.total) / semanas, sessoes: ses.length };
    });
    const melhorDia = perfilDia.reduce((a, b) => (b.total > a.total ? b : a)).wd;

    /* acumulado 28 dias vs 28 anteriores */
    const acum = (offset) => {
      const arr = [];
      let t = 0;
      for (let i = 27; i >= 0; i--) {
        const d = iso(daysAgo(i + offset));
        t += sum(sessions.filter((x) => x.date === d), (x) => x.total);
        arr.push(t);
      }
      return arr;
    };

    /* consistência */
    const gaps = [];
    for (let i = 1; i < asc.length; i++) gaps.push(diffDias(asc[i - 1].date, asc[i].date));
    const intervaloMedio = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    const desdeUltimo = diffDias(asc[asc.length - 1].date, hoje);

    /* maior sequência: qualquer corrida de semanas com treino, em todo o histórico */
    let maiorStreak = 0, run = 0;
    for (const w of todasSemanas) {
      run = w.sessoes > 0 ? run + 1 : 0;
      maiorStreak = Math.max(maiorStreak, run);
    }
    /* sequência atual: conta de trás para frente; a semana corrente,
       se ainda vazia, está em aberto e não quebra a sequência */
    let streak = 0;
    for (let i = todasSemanas.length - 1; i >= 0; i--) {
      if (todasSemanas[i].sessoes > 0) streak++;
      else if (i < todasSemanas.length - 1) break;
    }

    /* meses */
    const meses = {};
    sessions.forEach((x) => {
      const k = x.date.slice(0, 7);
      meses[k] ||= { minutos: 0, carga: 0, equiv: 0, sessoes: 0 };
      meses[k].minutos += x.total; meses[k].carga += trimp(x);
      meses[k].equiv += equiv(x); meses[k].sessoes += 1;
    });
    const mesAtualK = hoje.slice(0, 7);
    const mesAntK = iso(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)).slice(0, 7);
    const mesAtual = meses[mesAtualK] || { minutos: 0, carga: 0, equiv: 0, sessoes: 0 };
    const mesAnterior = meses[mesAntK] || null;
    const diaDoMes = new Date().getDate();
    const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    /* recordes */
    const maisLonga = asc.reduce((a, b) => (b.total > a.total ? b : a));
    const maisPesada = asc.reduce((a, b) => (trimp(b) > trimp(a) ? b : a));
    const maiorSemana = comTreino.length ? comTreino.reduce((a, b) => (b.minutos > a.minutos ? b : a)) : null;

    const durs = sessions.map((x) => x.total);

    return {
      total: sessions.length,
      horas: sum(sessions, (x) => x.total) / 60,
      cargaTotal: sum(sessions, trimp),
      primeiro: inicio,
      minutosTotal: sum(sessions, (x) => x.total),
      equivTotal: sum(sessions, equiv),
      equiv28: sum(d28, equiv),
      semana: {
        minutos: sum(w0, (x) => x.total), sessoes: w0.length, carga: load0,
        equiv: sum(w0, equiv),
        z3mais: sum(w0, (x) => x.zones.z3 + x.zones.z4 + x.zones.z5),
      },
      delta: {
        minutos: sum(w0, (x) => x.total) - sum(w1, (x) => x.total),
        carga: load1 ? Math.round(((load0 - load1) / load1) * 100) : null,
      },
      acwr: cronica > 0 ? load0 / cronica : null,
      cronica, forma, pmc, monotonia, strain,
      projetar, cargaDiariaMedia,
      zoneTotals, grand, polar, weeks, todasSemanas, deltaHr, hrSes, pctFCR,
      densidade: dens(sessions), densidade28: dens(d28), densidade28ant: dens(d28ant),
      rpeMedia, rpeCorr, rpePontos,
      intervalados: sessions.filter((x) => x.zones.z4 + x.zones.z5 >= 4).length,
      continuos: sessions.filter((x) => x.zones.z4 + x.zones.z5 < 4).length,
      intervaloMedio, desdeUltimo, streak, maiorStreak, melhorDia, perfilDia,
      acum28: acum(0), acum28ant: acum(28),
      variacaoSemanal, semanasNaMeta, totalCompletas: fechadas.length,
      mediaDur: durs.reduce((a, b) => a + b, 0) / durs.length,
      maiorDur: Math.max(...durs),
      fcMaxReg: sessions.some((x) => x.maxHr) ? Math.max(...sessions.map((x) => x.maxHr || 0)) : null,
      mesAtual, mesAnterior, meses,
      projecaoMes: Math.round((mesAtual.minutos / diaDoMes) * diasNoMes),
      recordes: { maisLonga, maisPesada, maiorSemana },
      meta: cfg.weeklyGoal,
      mediaSemanal: fechadas.length ? sum(fechadas, (w) => w.minutos) / fechadas.length : 0,
      sessoesPorSemana: fechadas.length ? sum(fechadas, (w) => w.sessoes) / fechadas.length : 0,
      equivSemanalMedio: fechadas.length ? sum(fechadas, (w) => w.equiv) / fechadas.length : 0,
    };
}

function escala(v, [a, b, c], invertido = false) {
  if (invertido) return v < a ? "bom" : v < b ? "ok" : v < c ? "atencao" : "alto";
  return v < a ? "baixo" : v < b ? "bom" : v < c ? "atencao" : "alto";
}

/* tempo fácil não tem faixa superior de risco: quanto maior, melhor.
   O corte em 75% é o mesmo usado pela leitura em `insights`, para os dois não se contradizerem. */
const escalaFacil = (v) => (v < 75 ? "atencao" : "bom");

export { escala, escalaFacil };
