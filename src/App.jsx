import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/* ================= constantes ================= */

const ZONES = [
  { id: "z1", label: "Zona 1", short: "1", name: "Recuperação", color: "#5AC8FA", light: "#8FDCFC", w: 1 },
  { id: "z2", label: "Zona 2", short: "2", name: "Base aeróbica", color: "#30D158", light: "#6BE889", w: 2 },
  { id: "z3", label: "Zona 3", short: "3", name: "Tempo", color: "#FFD60A", light: "#FFE566", w: 3 },
  { id: "z4", label: "Zona 4", short: "4", name: "Limiar", color: "#FF9F0A", light: "#FFBC55", w: 4 },
  { id: "z5", label: "Zona 5", short: "5", name: "Máximo", color: "#FF375F", light: "#FF7A96", w: 5 },
];

const C = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  sep: "rgba(60,60,67,0.13)",
  label: "#000000",
  sec: "rgba(60,60,67,0.6)",
  ter: "rgba(60,60,67,0.28)",
  fill: "rgba(120,120,128,0.11)",
  blue: "#007AFF",
  red: "#FF375F",
  green: "#30D158",
  orange: "#FF9F0A",
  purple: "#BF5AF2",
  indigo: "#5E5CE6",
};

const KEY = "eliptico:v5:sessoes";
const KEY_CFG = "eliptico:v5:config";
const DEFAULT_CFG = {
  maxHr: 193, restHr: 65, method: "hrr", weeklyGoal: 150,
  vo2max: 41.8, planoInicio: null, planoAtivo: true, demoLimpo: false,
};

const DIAS_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];
const DIAS_NOME = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/* ================= plano de 10 semanas ================= */

const PLANO = [
  {
    de: 1, ate: 2, nome: "Adaptação",
    resumo: "Introduzir a Zona 4 em blocos curtos, sem buscar ainda o 4×4 completo.",
    treinos: [
      { dia: 1, id: "A", nome: "Contínuo Z2", z: { z1: 8, z2: 22 }, desc: "5 min aquecendo em Z1, 22 min contínuos em Z2, 3 min desacelerando." },
      { dia: 3, id: "B", nome: "Intervalado 5×2", z: { z1: 21, z4: 10 }, desc: "5 min aquecendo, depois 5 blocos de 2 min em Z4 com 3 min fáceis entre eles, 4 min desacelerando." },
      { dia: 5, id: "C", nome: "Contínuo Z2", z: { z1: 8, z2: 22 }, desc: "5 min aquecendo em Z1, 22 min contínuos em Z2, 3 min desacelerando." },
    ],
  },
  {
    de: 3, ate: 4, nome: "Blocos de 3 minutos",
    resumo: "Blocos mais longos em Z4, com o mesmo número de repetições.",
    treinos: [
      { dia: 1, id: "A", nome: "Contínuo Z2", z: { z1: 8, z2: 24 }, desc: "5 min aquecendo, 24 min em Z2, 3 min desacelerando." },
      { dia: 3, id: "B", nome: "Intervalado 4×3", z: { z1: 18, z4: 12 }, desc: "5 min aquecendo, 4 blocos de 3 min em Z4 com 3 min fáceis entre eles, 4 min desacelerando." },
      { dia: 5, id: "C", nome: "Contínuo Z2", z: { z1: 8, z2: 24 }, desc: "5 min aquecendo, 24 min em Z2, 3 min desacelerando." },
    ],
  },
  {
    de: 5, ate: 6, nome: "4×4 completo",
    resumo: "O protocolo clássico de 4 blocos de 4 minutos, o estímulo mais estudado para VO₂ máx.",
    treinos: [
      { dia: 1, id: "A", nome: "Contínuo Z2", z: { z1: 8, z2: 27 }, desc: "5 min aquecendo, 27 min em Z2, 3 min desacelerando." },
      { dia: 3, id: "B", nome: "Intervalado 4×4", z: { z1: 18, z4: 16 }, desc: "5 min aquecendo, 4 blocos de 4 min em Z4 com 3 min fáceis entre eles, 4 min desacelerando." },
      { dia: 5, id: "C", nome: "Contínuo Z2", z: { z1: 8, z2: 27 }, desc: "5 min aquecendo, 27 min em Z2, 3 min desacelerando." },
    ],
  },
  {
    de: 7, ate: 8, nome: "Consolidação",
    resumo: "Mantém o 4×4 e adiciona uma dose leve de Z3 no terceiro treino.",
    treinos: [
      { dia: 1, id: "A", nome: "Contínuo Z2", z: { z1: 8, z2: 30 }, desc: "5 min aquecendo, 30 min em Z2, 3 min desacelerando." },
      { dia: 3, id: "B", nome: "Intervalado 4×4", z: { z1: 18, z4: 16 }, desc: "5 min aquecendo, 4 blocos de 4 min em Z4 com 3 min fáceis entre eles, 4 min desacelerando." },
      { dia: 5, id: "C", nome: "Contínuo com Z3", z: { z1: 7, z2: 20, z3: 8 }, desc: "5 min aquecendo, 20 min em Z2, 8 min em Z3, 2 min desacelerando." },
    ],
  },
  {
    de: 9, ate: 10, nome: "Pico",
    resumo: "Uma repetição a mais em Z4 e recuperação um pouco mais curta entre blocos.",
    treinos: [
      { dia: 1, id: "A", nome: "Contínuo Z2", z: { z1: 8, z2: 32 }, desc: "5 min aquecendo, 32 min em Z2, 3 min desacelerando." },
      { dia: 3, id: "B", nome: "Intervalado 5×4", z: { z1: 19, z4: 20 }, desc: "5 min aquecendo, 5 blocos de 4 min em Z4 com 2 a 3 min fáceis entre eles, 4 min desacelerando." },
      { dia: 5, id: "C", nome: "Contínuo leve", z: { z1: 8, z2: 27 }, desc: "5 min aquecendo, 27 min em Z2 num ritmo confortável, 3 min desacelerando." },
    ],
  },
];

/* ================= armazenamento tolerante a falha ================= */

const store = {
  async get(k) {
    const v = localStorage.getItem(k);
    if (v === null) throw new Error("sem registro");
    return { key: k, value: v };
  },
  async set(k, v) {
    localStorage.setItem(k, v);
    return { key: k, value: v };
  },
};

/* ================= utilidades ================= */

/* data em componentes locais; toISOString() seria UTC e viraria o dia à noite em fuso negativo */
const pad2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dayjs = (s) => new Date(s + "T12:00:00");
const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const trimp = (s) => ZONES.reduce((a, z) => a + (s.zones[z.id] || 0) * z.w, 0);
const totalZ = (z) => ZONES.reduce((a, k) => a + (z[k.id] || 0), 0);
const cargaZ = (z) => ZONES.reduce((a, k) => a + (z[k.id] || 0) * k.w, 0);
const sum = (a, f) => a.reduce((x, s) => x + f(s), 0);
const fmt = (n, d = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const diffDias = (a, b) => Math.round((dayjs(b) - dayjs(a)) / 864e5);
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function mondayOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function desvio(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 4) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function topRounded(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, Math.max(h, 0.01));
  return `M${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} L${x},${y + h} Z`;
}

/* --------- plano --------- */

function semanaDoPlano(cfg, date = new Date()) {
  if (!cfg.planoAtivo || !cfg.planoInicio) return null;
  const n = Math.floor(diffDias(cfg.planoInicio, iso(mondayOf(date))) / 7) + 1;
  return n >= 1 && n <= 10 ? n : null;
}

const faseDaSemana = (n) => PLANO.find((f) => n >= f.de && n <= f.ate);

function treinoDoDia(cfg, dateIso) {
  const n = semanaDoPlano(cfg, dayjs(dateIso));
  if (!n) return null;
  const fase = faseDaSemana(n);
  const t = fase.treinos.find((x) => x.dia === dayjs(dateIso).getDay());
  return t ? { ...t, semana: n, fase: fase.nome } : null;
}

function proximoTreino(cfg) {
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i);
    const t = treinoDoDia(cfg, iso(d));
    if (t) return { ...t, data: iso(d), emDias: i };
  }
  return null;
}

/* ================= dados de demonstração ================= */

function seed() {
  const rnd = mulberry32(70423);
  const out = [];
  for (let ago = 132; ago >= 0; ago--) {
    const d = daysAgo(ago);
    const wd = d.getDay();
    const dias = ago < 45 ? [1, 2, 4, 6] : [1, 3, 5];
    if (!dias.includes(wd)) continue;
    if (rnd() < 0.11) continue;

    const p = (132 - ago) / 132;
    const intervalado = wd === 2 || wd === 4;
    const dur = Math.round(32 + 16 * p + (rnd() * 8 - 4));
    const aq = 5 + Math.round(rnd() * 2);
    const meio = dur - aq - 4;

    const z = { z1: aq + 4, z2: 0, z3: 0, z4: 0, z5: 0 };
    if (intervalado) {
      z.z4 = Math.round(meio * (0.16 + 0.06 * p));
      z.z5 = rnd() < 0.45 ? Math.round(meio * 0.05) : 0;
      z.z3 = Math.round(meio * 0.26);
      z.z2 = meio - z.z3 - z.z4 - z.z5;
    } else {
      z.z3 = Math.round(meio * (0.12 + 0.1 * p));
      z.z4 = rnd() < 0.3 ? Math.round(meio * 0.05) : 0;
      z.z2 = meio - z.z3 - z.z4;
    }
    const avgHr = Math.round((intervalado ? 152 : 143) - 7 * p + (rnd() * 5 - 2.5));

    out.push({
      id: `seed-${ago}`,
      date: iso(d),
      zones: z,
      total: totalZ(z),
      avgHr,
      maxHr: Math.round(avgHr + (intervalado ? 26 : 15) + rnd() * 6),
      rpe: clamp(Math.round(cargaZ(z) / 22 + (rnd() * 1.6 - 0.8)), 3, 10),
      notes: "",
      demo: true,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/* ================= app ================= */

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [tab, setTab] = useState("resumo");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [editando, setEditando] = useState(null);
  const scroller = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    (async () => {
      let conf = DEFAULT_CFG;
      try {
        conf = { ...DEFAULT_CFG, ...JSON.parse((await store.get(KEY_CFG)).value) };
      } catch { /* padrão */ }
      if (!conf.planoInicio) conf = { ...conf, planoInicio: iso(mondayOf(new Date())) };

      let data = null;
      try {
        data = JSON.parse((await store.get(KEY)).value);
      } catch { /* primeira abertura */ }
      if (!Array.isArray(data)) data = [];
      /* semeia exemplos só enquanto o usuário nunca limpou nada; depois disso,
         histórico vazio é um estado legítimo e não deve ser sobrescrito */
      if (!data.length && !conf.demoLimpo) {
        data = seed();
        store.set(KEY, JSON.stringify(data)).catch(() => {});
      }
      setCfg(conf);
      setSessions(data);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const onScroll = useCallback(() => setScrolled((scroller.current?.scrollTop || 0) > 34), []);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); setScrolled(false); }, [tab]);

  const commit = (next, msg) => {
    setSessions(next);
    if (msg) setToast(msg);
    store.set(KEY, JSON.stringify(next)).catch(() =>
      setToast("Salvo nesta sessão, mas não foi possível gravar no dispositivo.")
    );
  };

  const saveCfg = (next) => {
    setCfg(next);
    store.set(KEY_CFG, JSON.stringify(next)).catch(() => {});
  };

  const salvarTreino = (s) => {
    const outros = sessions.filter((x) => x.id !== s.id);
    commit([s, ...outros].sort((a, b) => b.date.localeCompare(a.date)),
      editando ? "Treino atualizado" : "Treino salvo");
    setSheet(null);
    setEditando(null);
  };

  const abrirRegistro = (sessao = null, preset = null) => {
    setEditando(sessao ? { ...sessao } : preset ? { preset } : null);
    setSheet("registrar");
  };

  /* marca que o histórico passou a ser gerido pelo usuário: nunca mais semear exemplos por cima */
  const marcarLimpo = (next = cfg) => saveCfg({ ...next, demoLimpo: true });

  const excluirTreino = (id) => {
    const restantes = sessions.filter((x) => x.id !== id);
    if (!restantes.length) marcarLimpo();
    commit(restantes, "Treino excluído");
  };

  const importarCsv = async (file) => {
    let lidas;
    try {
      lidas = sessoesDeCsv(await file.text());
    } catch {
      setToast("Não foi possível ler este arquivo como CSV de treinos.");
      return;
    }
    const { sessoes, ignoradas } = lidas;
    if (!sessoes.length) {
      setToast("Nenhum treino válido encontrado no arquivo.");
      return;
    }
    const existentes = new Set(sessions.map(chaveSessao));
    const novas = sessoes.filter((x) => !existentes.has(chaveSessao(x)));
    if (!novas.length) {
      setToast("Todos os treinos do arquivo já estavam no histórico.");
      return;
    }
    const partes = [`${novas.length} ${novas.length === 1 ? "treino importado" : "treinos importados"}`];
    if (sessoes.length - novas.length) partes.push(`${sessoes.length - novas.length} já existiam`);
    if (ignoradas) partes.push(`${ignoradas} ${ignoradas === 1 ? "linha ignorada" : "linhas ignoradas"}`);
    marcarLimpo();
    commit([...novas, ...sessions].sort((a, b) => b.date.localeCompare(a.date)), partes.join(" · "));
  };

  const st = useStats(sessions, cfg);
  const titulo = { resumo: "Semana", tendencias: "Tendências", analise: "Análise", historico: "Histórico" }[tab];

  return (
    <Shell scroller={scroller} onScroll={onScroll} compact={scrolled} titulo={titulo}>
      {!ready ? (
        <div style={{ padding: 90, textAlign: "center", color: C.sec }}>Carregando…</div>
      ) : (
        <div key={tab} style={{ paddingBottom: 118 }}>
          {tab === "resumo" && (
            <Resumo st={st} cfg={cfg} sessions={sessions}
              onAjustes={() => setSheet("cfg")}
              onPlano={() => setSheet("plano")}
              onRegistrar={abrirRegistro} />
          )}
          {tab === "tendencias" && <Tendencias sessions={sessions} st={st} />}
          {tab === "analise" && <Analise st={st} cfg={cfg} onPlano={() => setSheet("plano")} />}
          {tab === "historico" && (
            <Historico
              sessions={sessions}
              onEdit={(s) => abrirRegistro(s)}
              onDelete={excluirTreino}
              onClearDemo={() => { marcarLimpo(); commit(sessions.filter((x) => !x.demo), "Dados de exemplo removidos"); }}
              onReseed={() => { saveCfg({ ...cfg, demoLimpo: false }); commit(seed(), "Dados de exemplo recarregados"); }}
              onImport={importarCsv}
              onToast={setToast}
            />
          )}
        </div>
      )}

      {sheet === "registrar" && (
        <RegistrarSheet cfg={cfg} inicial={editando} onSave={salvarTreino}
          onClose={() => { setSheet(null); setEditando(null); }} />
      )}
      {sheet === "cfg" && <Ajustes cfg={cfg} onChange={saveCfg} onClose={() => setSheet(null)} />}
      {sheet === "plano" && (
        <PlanoSheet cfg={cfg} sessions={sessions} onChange={saveCfg}
          onClose={() => setSheet(null)}
          onUsar={(t, data) => { setSheet(null); abrirRegistro(null, { z: t.z, date: data }); }} />
      )}

      {toast && <div style={s.toast}>{toast}</div>}
      <TabBar tab={tab} setTab={setTab} onPlus={() => abrirRegistro()} />
    </Shell>
  );
}

/* ================= estatísticas ================= */

function useStats(sessions, cfg) {
  return useMemo(() => {
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

    /* semana corrente, segunda a domingo */
    const seg = mondayOf(new Date());
    const semanaAtual = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(seg); d.setDate(d.getDate() + i);
      const dISO = iso(d);
      const ses = sessions.filter((x) => x.date === dISO);
      semanaAtual.push({
        date: dISO,
        wd: d.getDay(),
        futuro: dISO > hoje,
        hoje: dISO === hoje,
        sessoes: ses,
        total: sum(ses, (x) => x.total),
        carga: sum(ses, trimp),
        zones: Object.fromEntries(ZONES.map((z) => [z.id, sum(ses, (x) => x.zones[z.id] || 0)])),
        plano: treinoDoDia(cfg, dISO),
      });
    }
    const semanaPassada = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(seg); d.setDate(d.getDate() - 7 + i);
      const ses = sessions.filter((x) => x.date === iso(d));
      semanaPassada.push({ total: sum(ses, (x) => x.total) });
    }

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

    /* séries semanais */
    const weeks = [];
    for (let i = 16; i >= 0; i--) {
      const start = mondayOf(daysAgo(i * 7));
      const end = new Date(start); end.setDate(end.getDate() + 6);
      const inWeek = sessions.filter((x) => x.date >= iso(start) && x.date <= iso(end));
      const zw = Object.fromEntries(ZONES.map((z) => [z.id, sum(inWeek, (x) => x.zones[z.id] || 0)]));
      weeks.push({
        start: iso(start),
        completa: iso(end) < hoje,
        minutos: sum(inWeek, (x) => x.total),
        carga: sum(inWeek, trimp),
        sessoes: inWeek.length,
        z3mais: sum(inWeek, (x) => x.zones.z3 + x.zones.z4 + x.zones.z5),
        zones: zw,
      });
    }
    weeks.forEach((w, i) => {
      const win = weeks.slice(Math.max(0, i - 3), i + 1);
      w.media4 = win.reduce((a, b) => a + b.carga, 0) / win.length;
    });
    const completas = weeks.filter((w) => w.completa && w.sessoes > 0);
    const ult8 = completas.slice(-8);
    const variacaoSemanal = desvio(ult8.map((w) => w.minutos));
    const semanasNaMeta = completas.filter((w) => w.minutos >= cfg.weeklyGoal).length;

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
      const semanas = Math.max(1, completas.length);
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

    /* série semanal de todo o histórico; `weeks` só cobre 17 semanas e saturaria as sequências */
    const semanasComTreino = new Set(sessions.map((x) => iso(mondayOf(dayjs(x.date)))));
    const primeiraSemana = mondayOf(dayjs(inicio));
    const nSemanas = Math.floor(diffDias(iso(primeiraSemana), iso(mondayOf(new Date()))) / 7) + 1;
    const serie = [];
    for (let i = 0; i < nSemanas; i++) {
      const d = new Date(primeiraSemana); d.setDate(d.getDate() + i * 7);
      serie.push(semanasComTreino.has(iso(d)));
    }

    /* maior sequência: qualquer corrida de semanas com treino */
    let maiorStreak = 0, run = 0;
    for (const tem of serie) {
      run = tem ? run + 1 : 0;
      maiorStreak = Math.max(maiorStreak, run);
    }
    /* sequência atual: conta de trás para frente; a semana corrente,
       se ainda vazia, está em aberto e não quebra a sequência */
    let streak = 0;
    for (let i = serie.length - 1; i >= 0; i--) {
      if (serie[i]) streak++;
      else if (i < serie.length - 1) break;
    }

    /* aderência ao plano */
    let planoPrev = 0, planoFeito = 0;
    if (cfg.planoAtivo && cfg.planoInicio) {
      for (let i = 0; i < 28; i++) {
        const d = iso(daysAgo(i));
        if (d < cfg.planoInicio) continue;
        if (treinoDoDia(cfg, d)) {
          planoPrev++;
          if (sessions.some((x) => x.date === d)) planoFeito++;
        }
      }
    }

    /* meses */
    const meses = {};
    sessions.forEach((x) => {
      const k = x.date.slice(0, 7);
      meses[k] ||= { minutos: 0, carga: 0, sessoes: 0 };
      meses[k].minutos += x.total; meses[k].carga += trimp(x); meses[k].sessoes += 1;
    });
    const mesAtualK = hoje.slice(0, 7);
    const mesAntK = iso(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)).slice(0, 7);
    const mesAtual = meses[mesAtualK] || { minutos: 0, carga: 0, sessoes: 0 };
    const mesAnterior = meses[mesAntK] || null;
    const diaDoMes = new Date().getDate();
    const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    /* recordes */
    const maisLonga = asc.reduce((a, b) => (b.total > a.total ? b : a));
    const maisPesada = asc.reduce((a, b) => (trimp(b) > trimp(a) ? b : a));
    const maiorSemana = completas.length ? completas.reduce((a, b) => (b.minutos > a.minutos ? b : a)) : null;
    const maiorZ3 = completas.length ? completas.reduce((a, b) => (b.z3mais > a.z3mais ? b : a)) : null;

    const durs = sessions.map((x) => x.total);
    const minSemana = sum(semanaAtual, (d) => d.total);

    return {
      total: sessions.length,
      horas: sum(sessions, (x) => x.total) / 60,
      cargaTotal: sum(sessions, trimp),
      primeiro: inicio,
      semanaAtual, semanaPassada,
      minSemana,
      cargaSemana: sum(semanaAtual, (d) => d.carga),
      sessoesSemana: sum(semanaAtual, (d) => d.sessoes.length),
      z3Semana: sum(semanaAtual, (d) => d.zones.z3 + d.zones.z4 + d.zones.z5),
      minSemanaPassada: sum(semanaPassada, (d) => d.total),
      semana: {
        minutos: sum(w0, (x) => x.total), sessoes: w0.length, carga: load0,
        z3mais: sum(w0, (x) => x.zones.z3 + x.zones.z4 + x.zones.z5),
      },
      delta: {
        minutos: sum(w0, (x) => x.total) - sum(w1, (x) => x.total),
        carga: load1 ? Math.round(((load0 - load1) / load1) * 100) : null,
      },
      acwr: cronica > 0 ? load0 / cronica : null,
      cronica, forma, pmc, monotonia, strain,
      projetar, cargaDiariaMedia,
      zoneTotals, grand, polar, weeks, completas, deltaHr, hrSes, pctFCR,
      densidade: dens(sessions), densidade28: dens(d28), densidade28ant: dens(d28ant),
      rpeMedia, rpeCorr, rpePontos,
      intervalados: sessions.filter((x) => x.zones.z4 + x.zones.z5 >= 4).length,
      continuos: sessions.filter((x) => x.zones.z4 + x.zones.z5 < 4).length,
      intervaloMedio, desdeUltimo, streak, maiorStreak, melhorDia, perfilDia,
      acum28: acum(0), acum28ant: acum(28),
      variacaoSemanal, semanasNaMeta, totalCompletas: completas.length,
      planoPrev, planoFeito,
      mediaDur: durs.reduce((a, b) => a + b, 0) / durs.length,
      maiorDur: Math.max(...durs),
      fcMaxReg: Math.max(...sessions.map((x) => x.maxHr || 0)),
      mesAtual, mesAnterior, meses,
      projecaoMes: Math.round((mesAtual.minutos / diaDoMes) * diasNoMes),
      recordes: { maisLonga, maisPesada, maiorSemana, maiorZ3 },
      meta: cfg.weeklyGoal,
      mediaSemanal: completas.length ? sum(completas, (w) => w.minutos) / completas.length : 0,
      sessoesPorSemana: completas.length ? sum(completas, (w) => w.sessoes) / completas.length : 0,
    };
  }, [sessions, cfg]);
}

/* ================= tela: semana ================= */

function Resumo({ st, cfg, sessions, onAjustes, onPlano, onRegistrar }) {
  const [selDia, setSelDia] = useState(null);
  if (!st) return <><LargeTitle title="Semana" /><Empty /></>;

  const pct = Math.min(100, (st.minSemana / st.meta) * 100);
  const hojeISO = iso(new Date());
  const planoHoje = treinoDoDia(cfg, hojeISO);
  const proximo = proximoTreino(cfg);
  const semanaN = semanaDoPlano(cfg);
  const feitoHoje = st.semanaAtual.find((d) => d.hoje)?.sessoes.length > 0;
  const dia = selDia != null ? st.semanaAtual.find((d) => d.date === selDia) : null;
  const deltaSemana = st.minSemana - st.minSemanaPassada;

  return (
    <>
      <LargeTitle title="Semana" action={{ label: "Ajustes", onClick: onAjustes }} />

      {/* herói: os sete dias */}
      <Card i={0} pad={18}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={s.eyebrow}>
              {dia ? cap(DIAS_NOME[dia.wd]) + ", " + dayjs(dia.date).getDate() : "Segunda a domingo"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
              <span style={s.big}>{fmt(dia ? dia.total : st.minSemana)}</span>
              <span style={s.unit}>min</span>
              {!dia && (
                <span style={{ ...s.unit, color: deltaSemana >= 0 ? C.green : C.sec, fontSize: 13 }}>
                  {deltaSemana >= 0 ? "↑" : "↓"} {fmt(Math.abs(deltaSemana))} vs. semana passada
                </span>
              )}
            </div>
          </div>
          {semanaN && (
            <button style={s.planoBadge} onClick={onPlano}>
              Semana {semanaN}/10
            </button>
          )}
        </div>

        <WeekStrip dias={st.semanaAtual} sel={selDia} setSel={setSelDia} />

        {dia ? (
          <div style={s.diaDetalhe}>
            {dia.sessoes.length > 0 ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={s.rowSub}>{fmt(dia.carga)} TRIMP</span>
                  <span style={s.rowSub}>
                    {dia.sessoes[0].avgHr ? `${dia.sessoes[0].avgHr} bpm médios` : "sem FC registrada"}
                  </span>
                </div>
                {ZONES.filter((z) => dia.zones[z.id] > 0).map((z) => (
                  <div key={z.id} style={s.detailRow}>
                    <span style={{ ...s.dotSm, background: z.color }} />
                    <span style={{ flex: 1, color: C.sec }}>{z.label}</span>
                    <span style={s.mono}>{dia.zones[z.id]} min</span>
                  </div>
                ))}
              </>
            ) : dia.plano ? (
              <div>
                <div style={s.rowLabel}>Planejado: {dia.plano.nome}</div>
                <div style={{ ...s.rowSub, marginTop: 4 }}>{dia.plano.desc}</div>
              </div>
            ) : (
              <div style={{ ...s.rowSub, textAlign: "center", padding: "6px 0" }}>Dia de descanso</div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <div style={s.metaBarOuter}>
              <div style={{ ...s.metaBarInner, width: `${pct}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
              <span style={s.rowSub}>{fmt(pct)}% da meta de {st.meta} min</span>
              <span style={s.rowSub}>
                {st.minSemana >= st.meta ? "meta atingida" : `faltam ${fmt(st.meta - st.minSemana)} min`}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* treino de hoje + registro */}
      <Card i={1} pad={16}>
        {planoHoje && !feitoHoje ? (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ ...s.iconBadge, background: planoHoje.z.z4 ? C.orange : C.green }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff"
                  strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d={planoHoje.z.z4 ? ICONS.raio : ICONS.coracao} />
                </svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.eyebrow}>Treino de hoje · {planoHoje.fase}</div>
                <div style={{ ...s.insightTitle, marginTop: 2 }}>
                  {planoHoje.nome} · {totalZ(planoHoje.z)} min
                </div>
                <div style={{ ...s.insightBody, marginTop: 3 }}>{planoHoje.desc}</div>
              </div>
            </div>
            <button style={s.primary} onClick={() => onRegistrar(null, { z: planoHoje.z, date: hojeISO })}>
              Registrar treino de hoje
            </button>
            <button style={s.secondary} onClick={() => onRegistrar()}>Registrar outro treino</button>
          </>
        ) : feitoHoje ? (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ ...s.iconBadge, background: C.green }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff"
                  strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS.meta} />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={s.insightTitle}>Treino de hoje registrado</div>
                <div style={s.insightBody}>
                  {proximo && proximo.emDias > 0
                    ? `Próximo: ${proximo.nome} na ${DIAS_NOME[dayjs(proximo.data).getDay()]}.`
                    : "Bom trabalho."}
                </div>
              </div>
            </div>
            <button style={s.secondary} onClick={() => onRegistrar()}>Registrar outro treino</button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ ...s.iconBadge, background: C.blue }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff"
                  strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.insightTitle}>Registrar treino</div>
                <div style={s.insightBody}>
                  {proximo
                    ? proximo.emDias === 0
                      ? `Hoje: ${proximo.nome}, ${totalZ(proximo.z)} min.`
                      : `Próximo do plano: ${proximo.nome} na ${DIAS_NOME[dayjs(proximo.data).getDay()]}.`
                    : "Sem treino planejado para hoje."}
                </div>
              </div>
            </div>
            <button style={s.primary} onClick={() => onRegistrar()}>Novo registro</button>
          </>
        )}
      </Card>

      <SectionTitle>Esta semana</SectionTitle>
      <div style={s.grid}>
        <Tile i={2} label="Minutos" value={fmt(st.minSemana)} unit="min" color={C.green} />
        <Tile i={3} label="Treinos" value={st.sessoesSemana} unit="sessões" color={C.blue} />
        <Tile i={4} label="Carga" value={fmt(st.cargaSemana)} unit="TRIMP" color={C.orange} />
        <Tile i={5} label="Zona 3+" value={fmt(st.z3Semana)} unit="min" color={C.red} />
      </div>

      <SectionTitle>
        Consistência
        <span style={s.sectionRight}>{st.streak} semanas seguidas</span>
      </SectionTitle>
      <Card i={6}><Heatmap sessions={sessions} /></Card>

      <Card i={7} pad={0}>
        <Line first label="Média de treinos por semana" value={fmt(st.sessoesPorSemana, 1)} />
        <Line label="Média de minutos por semana" value={`${fmt(st.mediaSemanal)} min`} />
        <Line label="Intervalo médio entre treinos" value={`${fmt(st.intervaloMedio, 1)} dias`} />
        <Line label="Último treino" value={st.desdeUltimo === 0 ? "hoje" : `há ${st.desdeUltimo} ${st.desdeUltimo === 1 ? "dia" : "dias"}`} />
        <Line label="Semanas que bateram a meta" value={`${st.semanasNaMeta} de ${st.totalCompletas}`} />
        {st.planoPrev > 0 && (
          <Line label="Aderência ao plano, 28 dias" value={`${st.planoFeito} de ${st.planoPrev}`} />
        )}
      </Card>

      <SectionTitle>
        {new Date().toLocaleDateString("pt-BR", { month: "long" })}
        <span style={s.sectionRight}>projeção {fmt(st.projecaoMes)} min</span>
      </SectionTitle>
      <div style={s.grid}>
        <Tile i={8} label="Minutos" value={fmt(st.mesAtual.minutos)} unit="min"
          delta={st.mesAnterior ? st.mesAtual.minutos - st.mesAnterior.minutos : null} color={C.green} />
        <Tile i={9} label="Treinos" value={st.mesAtual.sessoes} unit="sessões"
          delta={st.mesAnterior ? st.mesAtual.sessoes - st.mesAnterior.sessoes : null} color={C.blue} />
      </div>

      <SectionTitle>Distribuição por zona</SectionTitle>
      <Card i={10}><ZoneColumn totals={st.zoneTotals} grand={st.grand} cfg={cfg} /></Card>

      <SectionTitle>Recordes</SectionTitle>
      <Card i={10} pad={0}>
        <Line first label="Sessão mais longa" value={`${st.recordes.maisLonga.total} min`} sub={longDate(st.recordes.maisLonga.date)} />
        <Line label="Sessão mais pesada" value={`${fmt(trimp(st.recordes.maisPesada))} TRIMP`} sub={longDate(st.recordes.maisPesada.date)} />
        {st.recordes.maiorSemana && (
          <Line label="Maior semana" value={`${fmt(st.recordes.maiorSemana.minutos)} min`}
            sub={`semana de ${dayjs(st.recordes.maiorSemana.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`} />
        )}
        <Line label="Maior sequência de semanas" value={`${st.maiorStreak} semanas`} />
        <Line label="FC máxima registrada" value={`${st.fcMaxReg} bpm`} />
      </Card>

      <SectionTitle>Desde o início</SectionTitle>
      <Card i={10} pad={0}>
        <Line first label="Treinos registrados" value={`${st.total}`} />
        <Line label="Tempo total" value={`${fmt(st.horas, 1)} h`} />
        <Line label="Carga acumulada" value={`${fmt(st.cargaTotal)} TRIMP`} />
        <Line label="Duração média" value={`${fmt(st.mediaDur)} min`} />
        <Line label="Contínuos e intervalados" value={`${st.continuos} · ${st.intervalados}`} />
        <Line label="Dia que você mais treina" value={DIAS_NOME[st.melhorDia]} />
        <Line label="Primeiro registro" value={longDate(st.primeiro)} />
      </Card>
    </>
  );
}

/* ================= tela: tendências ================= */

function Tendencias({ sessions, st }) {
  const [range, setRange] = useState(30);
  const [sel, setSel] = useState(null);
  if (!st) return <><LargeTitle title="Tendências" /><Empty /></>;

  const dias = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = iso(daysAgo(i));
    const ses = sessions.filter((x) => x.date === d);
    dias.push({
      date: d,
      zones: Object.fromEntries(ZONES.map((z) => [z.id, sum(ses, (x) => x.zones[z.id] || 0)])),
      total: sum(ses, (x) => x.total),
      avgHr: ses.length ? Math.round(sum(ses, (x) => x.avgHr || 0) / ses.length) : null,
    });
  }
  const cur = sel != null ? dias[sel] : null;
  const comTreino = dias.filter((d) => d.total > 0);

  return (
    <>
      <LargeTitle title="Tendências" />
      <Segmented value={range} onChange={(v) => { setRange(v); setSel(null); }}
        options={[{ v: 7, l: "7 D" }, { v: 30, l: "30 D" }, { v: 90, l: "90 D" }]} />

      <Card i={0} pad={18}>
        <div style={s.eyebrow}>Minutos por zona</div>
        {cur ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={s.big}>{fmt(cur.total)}</span><span style={s.unit}>min</span>
            </div>
            <div style={s.sub}>{longDate(cur.date)}{cur.avgHr ? ` · ${cur.avgHr} bpm médios` : ""}</div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={s.big}>{fmt(sum(comTreino, (d) => d.total))}</span>
              <span style={s.unit}>min · {comTreino.length} treinos</span>
            </div>
            <div style={s.sub}>Arraste o dedo sobre o gráfico para ver cada dia</div>
          </>
        )}
        <ZoneBars dias={dias} sel={sel} setSel={setSel} />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
          {ZONES.map((z) => (
            <span key={z.id} style={s.legend}><span style={{ ...s.dotSm, background: z.color }} />Z{z.short}</span>
          ))}
        </div>
      </Card>

      <SectionTitle>Volume acumulado</SectionTitle>
      <Card i={1} pad={18}>
        <div style={s.eyebrow}>Últimos 28 dias contra os 28 anteriores</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
          <span style={{ ...s.big, color: st.acum28.at(-1) >= st.acum28ant.at(-1) ? C.green : C.label }}>
            {st.acum28.at(-1) >= st.acum28ant.at(-1) ? "+" : ""}
            {fmt(st.acum28.at(-1) - st.acum28ant.at(-1))}
          </span>
          <span style={s.unit}>min de diferença</span>
        </div>
        <CumulativeChart atual={st.acum28} anterior={st.acum28ant} />
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <LegendItem color={C.green} label="Atual" value={`${fmt(st.acum28.at(-1))} min`} />
          <LegendItem color={C.ter} label="Anterior" value={`${fmt(st.acum28ant.at(-1))} min`} />
        </div>
      </Card>

      <SectionTitle>Carga semanal</SectionTitle>
      <Card i={2} pad={18}>
        <div style={s.eyebrow}>TRIMP por semana</div>
        <LoadChart weeks={st.weeks} />
        <p style={s.foot}>
          A linha tracejada é a média móvel de 4 semanas. Barras em laranja passaram 30% dessa média —
          a referência prática é subir no máximo 10% de volume por semana.
        </p>
      </Card>

      <SectionTitle>Evolução da distribuição</SectionTitle>
      <Card i={3} pad={18}>
        <div style={s.eyebrow}>Proporção de cada zona, semana a semana</div>
        <ZoneEvolution weeks={st.weeks} />
        <p style={s.foot}>
          Cada coluna é uma semana normalizada em 100%. Uma faixa verde crescente indica base aeróbica
          se consolidando; laranja e vermelho subindo juntos indicam semanas mais intensas.
        </p>
      </Card>

      <SectionTitle>Proporção de intensidade</SectionTitle>
      <Card i={4} pad={18}>
        <div style={s.eyebrow}>Tempo em Z3 ou acima, por semana</div>
        <IntensityChart weeks={st.weeks} />
        <p style={s.foot}>As barras claras são o volume total da semana; a parte colorida, o tempo em Z3, Z4 e Z5.</p>
      </Card>

      <SectionTitle>Perfil semanal</SectionTitle>
      <Card i={5} pad={18}>
        <div style={s.eyebrow}>Minutos médios por dia da semana</div>
        <WeekdayChart perfil={st.perfilDia} />
        <p style={s.foot}>
          Seu dia mais forte é {DIAS_NOME[st.melhorDia]}. Dias com barra baixa mas não zerada costumam ser
          os que mais escapam do plano — vale conferir se o horário está mesmo funcionando.
        </p>
      </Card>

      <SectionTitle>Eficiência cardíaca</SectionTitle>
      <Card i={6} pad={18}>
        <div style={s.eyebrow}>FC média em treinos contínuos</div>
        {st.hrSes.length >= 5 ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={{ ...s.big, color: st.deltaHr < 0 ? C.green : C.label }}>
                {st.deltaHr > 0 ? "+" : ""}{fmt(st.deltaHr, 1)}
              </span>
              <span style={s.unit}>bpm em {st.hrSes.length} sessões</span>
            </div>
            <HrChart data={st.hrSes} />
            <p style={s.foot}>
              Cada ponto é um treino contínuo. Com duração e zonas parecidas, FC média em queda costuma
              refletir ganho de condicionamento.
            </p>
          </>
        ) : (
          <p style={s.foot}>Registre pelo menos 5 treinos contínuos com FC média para ver esta análise.</p>
        )}
      </Card>

      <SectionTitle>Semana a semana</SectionTitle>
      <Card i={7} pad={0}>
        {[...st.weeks].reverse().slice(0, 10).map((w, i) => (
          <Line key={w.start} first={i === 0}
            label={`Semana de ${dayjs(w.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`}
            value={`${fmt(w.minutos)} min`}
            sub={`${w.sessoes} ${w.sessoes === 1 ? "treino" : "treinos"} · ${fmt(w.carga)} TRIMP · ${fmt(w.z3mais)} min em Z3+`} />
        ))}
      </Card>
    </>
  );
}

/* ================= tela: análise ================= */

function Analise({ st, cfg, onPlano }) {
  if (!st) return <><LargeTitle title="Análise" /><Empty /></>;

  const tsb = st.forma.tsb;
  const estado =
    tsb > 8 ? { t: "Descansado", c: C.blue, d: "Fadiga baixa em relação à sua base. Bom momento para um treino mais forte." }
      : tsb > -8 ? { t: "Equilibrado", c: C.green, d: "Carga recente compatível com a base que você construiu." }
        : tsb > -20 ? { t: "Carga produtiva", c: C.orange, d: "Você está treinando acima da base. Sustentável por algumas semanas, não indefinidamente." }
          : { t: "Fadiga acentuada", c: C.red, d: "A carga recente está bem acima da base. Uma semana mais leve costuma resolver." };

  const dens28 = st.densidade28;
  const densDelta = dens28 != null && st.densidade28ant != null ? dens28 - st.densidade28ant : null;
  const cenarios = [
    { l: "Reduzir 20%", f: 0.8, c: C.blue },
    { l: "Manter", f: 1, c: C.green },
    { l: "Subir 10%", f: 1.1, c: C.orange },
  ].map((x) => ({ ...x, v: st.projetar(x.f) }));

  const vo2 = cfg.vo2max;
  const classeVo2 = vo2 >= 48 ? "excelente" : vo2 >= 42 ? "boa" : vo2 >= 36 ? "regular" : "abaixo da média";

  return (
    <>
      <LargeTitle title="Análise" />

      <Card i={0} pad={18}>
        <div style={s.eyebrow}>Forma atual</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3 }}>
          <span style={{ ...s.big, color: estado.c }}>{tsb > 0 ? "+" : ""}{fmt(tsb, 1)}</span>
          <span style={{ ...s.insightTag, color: estado.c, fontSize: 15 }}>{estado.t}</span>
        </div>
        <div style={s.sub}>{estado.d}</div>
        <PmcChart pmc={st.pmc} />
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <LegendItem color={C.blue} label="Aptidão" value={fmt(st.forma.ctl, 1)} />
          <LegendItem color={C.orange} label="Fadiga" value={fmt(st.forma.atl, 1)} />
          <LegendItem color={estado.c} label="Forma" value={`${tsb > 0 ? "+" : ""}${fmt(tsb, 1)}`} />
        </div>
        <p style={s.foot}>
          Aptidão é a média ponderada da sua carga em 42 dias; fadiga, a mesma coisa em 7 dias. A diferença
          entre as duas é a forma: positiva quando você está mais descansado que treinado.
        </p>
      </Card>

      <SectionTitle>Projeção de aptidão</SectionTitle>
      <Card i={1} pad={18}>
        <div style={s.eyebrow}>Onde sua aptidão estará em 4 semanas</div>
        <ProjChart atual={st.forma.ctl} cenarios={cenarios} />
        {cenarios.map((c, i) => (
          <div key={c.l} style={{ ...s.row, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.dot, background: c.c }} />
            <span style={{ flex: 1, ...s.rowLabel }}>{c.l}</span>
            <span style={s.rowValue}>{fmt(c.v, 1)}</span>
            <span style={{ ...s.rowSub, marginLeft: 8, minWidth: 42, textAlign: "right" }}>
              {c.v > st.forma.ctl ? "+" : ""}{fmt(c.v - st.forma.ctl, 1)}
            </span>
          </div>
        ))}
        <p style={s.foot}>
          Simulação do mesmo modelo de 42 dias, assumindo que você mantenha a média diária das últimas
          4 semanas multiplicada por cada fator. É uma extrapolação matemática, não uma promessa fisiológica.
        </p>
      </Card>

      <SectionTitle>Gestão de carga</SectionTitle>
      <Card i={2} pad={0}>
        <Metric first label="Razão aguda / crônica" value={st.acwr != null ? fmt(st.acwr, 2) : "—"}
          faixa={st.acwr != null ? escala(st.acwr, [0.8, 1.3, 1.5]) : null}
          nota="Carga dos últimos 7 dias dividida pela média de 4 semanas. Entre 0,8 e 1,3 costuma ser a zona de progressão estável." />
        <Metric label="Monotonia" value={st.monotonia != null ? fmt(st.monotonia, 2) : "—"}
          faixa={st.monotonia != null ? escala(st.monotonia, [1.3, 2, 2.5], true) : null}
          nota="Média da carga diária dividida pelo desvio-padrão dos últimos 7 dias. Valores altos indicam semana uniforme demais, sem dias leves de verdade." />
        <Metric label="Strain" value={st.strain != null ? fmt(st.strain) : "—"}
          nota="Carga da semana multiplicada pela monotonia. Serve para comparar semanas entre si, não contra um valor absoluto." />
        <Metric label="Carga crônica" value={fmt(st.cronica)}
          nota="Média semanal de TRIMP nas últimas 4 semanas. É a base sobre a qual as outras métricas são comparadas." />
        <Metric label="Variação semanal" value={`± ${fmt(st.variacaoSemanal)} min`}
          nota="Desvio-padrão dos minutos nas últimas 8 semanas fechadas. Quanto menor, mais previsível é a sua rotina." />
      </Card>

      <SectionTitle>Intensidade</SectionTitle>
      <Card i={3} pad={0}>
        <Metric first label="Densidade de carga" value={dens28 != null ? `${fmt(dens28, 2)} /min` : "—"}
          delta={densDelta != null ? `${densDelta > 0 ? "+" : ""}${fmt(densDelta, 2)} vs. 28 dias anteriores` : null}
          nota="TRIMP por minuto nos últimos 28 dias. Equivale à zona média dos seus treinos: 2,0 é uma rotina de base, acima de 2,8 é uma rotina intensa." />
        <Metric label="Tempo fácil" value={`${fmt(st.polar)}%`} faixa={escalaFacil(st.polar)}
          nota="Proporção do tempo total em Z1 e Z2. A literatura de treino polarizado costuma trabalhar perto de 80%." />
        <Metric label="Reserva cardíaca usada" value={st.pctFCR != null ? `${fmt(st.pctFCR)}%` : "—"}
          nota={`Média de (FC do treino − ${cfg.restHr}) ÷ (${cfg.maxHr} − ${cfg.restHr}) nos últimos 28 dias.`} />
        <Metric label="Contínuos e intervalados" value={`${st.continuos} · ${st.intervalados}`}
          nota="Sessões com 4 min ou mais em Z4 e Z5 contam como intervaladas." />
      </Card>

      <SectionTitle>Capacidade e zonas</SectionTitle>
      <Card i={4} pad={0}>
        <Line first label="VO₂ máx" value={`${fmt(vo2, 1)} ml/kg/min`} sub={`Aptidão cardiorrespiratória ${classeVo2}`} />
        <Line label="Equivalente em MET" value={fmt(vo2 / 3.5, 1)} sub="Acima de 10 MET associa-se a bom prognóstico" />
        <Line label="FC máxima" value={`${cfg.maxHr} bpm`} />
        <Line label="FC de repouso" value={`${cfg.restHr} bpm`} />
        <Line label="Reserva cardíaca" value={`${cfg.maxHr - cfg.restHr} bpm`} />
      </Card>
      <Card i={5} pad={0}>
        {ZONES.map((z, i) => (
          <div key={z.id} style={{ ...s.field, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
            <div style={{ flex: 1 }}>
              <div style={s.rowLabel}>{z.name}</div>
              <div style={s.rowSub}>{fmt((st.zoneTotals[z.id] / st.grand) * 100)}% do seu tempo</div>
            </div>
            <span style={s.mono}>{faixa(cfg, i)} bpm</span>
          </div>
        ))}
      </Card>

      <SectionTitle>Percepção de esforço</SectionTitle>
      <Card i={6} pad={18}>
        {st.rpeCorr != null ? (
          <>
            <div style={s.eyebrow}>Correlação entre RPE e carga</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
              <span style={{ ...s.big, color: st.rpeCorr > 0.6 ? C.green : C.orange }}>{fmt(st.rpeCorr, 2)}</span>
              <span style={s.unit}>r de Pearson</span>
            </div>
            <div style={s.sub}>
              {st.rpeCorr > 0.7 ? "Sua percepção acompanha bem a carga medida pelo relógio."
                : st.rpeCorr > 0.4 ? "Percepção e carga andam juntas, mas com folga. Vale observar os treinos que fogem da linha."
                  : "Sua percepção não está acompanhando a carga objetiva. Costuma acontecer com sono ruim, calor ou estresse fora da academia."}
            </div>
            <RpeScatter pontos={st.rpePontos} />
            <p style={s.foot}>
              Cada ponto é um treino: carga no eixo horizontal, esforço percebido no vertical. Pontos acima
              da linha foram mais difíceis do que os números sugerem.
            </p>
          </>
        ) : (
          <p style={{ ...s.foot, marginTop: 0 }}>Registre o esforço percebido em pelo menos 6 treinos para ver esta análise.</p>
        )}
      </Card>

      {st.planoPrev > 0 && (
        <>
          <SectionTitle>Plano de 10 semanas</SectionTitle>
          <Card i={7}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={s.eyebrow}>Aderência nos últimos 28 dias</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
                  <span style={{ ...s.big, fontSize: 30, color: st.planoFeito / st.planoPrev >= 0.75 ? C.green : C.orange }}>
                    {fmt((st.planoFeito / st.planoPrev) * 100)}%
                  </span>
                  <span style={s.unit}>{st.planoFeito} de {st.planoPrev} sessões</span>
                </div>
              </div>
              <button style={s.linkSm} onClick={onPlano}>Ver plano</button>
            </div>
          </Card>
        </>
      )}

      <SectionTitle>Leituras</SectionTitle>
      {insights(st).map((x, i) => <Insight key={x.t} data={x} i={8 + i} />)}

      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          TRIMP, monotonia, strain e a razão aguda/crônica são heurísticas de carga de treino vindas da
          fisiologia do exercício, úteis para comparar as suas próprias semanas. Não são medidas validadas
          para prever lesão em indivíduos, e os limiares aqui são referências práticas, não pontos de corte.
        </p>
      </Card>
    </>
  );
}

/* ================= importação de CSV ================= */

/* parser mínimo, mas com aspas e quebras de linha dentro de campo — o campo
   "notas" é texto livre digitado pelo usuário e pode conter vírgula e aspas */
function parseCsv(texto) {
  const t = texto.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c !== '"') campo += c;
      else if (t[i + 1] === '"') { campo += '"'; i++; }
      else aspas = false;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/* identidade de um treino para efeito de deduplicação na reimportação */
const chaveSessao = (x) => `${x.date}|${ZONES.map((z) => x.zones[z.id] || 0).join("-")}`;

function sessoesDeCsv(texto) {
  const linhas = parseCsv(texto).filter((l) => l.some((c) => c.trim() !== ""));
  if (linhas.length < 2) throw new Error("arquivo sem linhas de dados");
  const cab = linhas[0].map((c) => c.trim().toLowerCase());
  const col = (nome) => cab.indexOf(nome);
  if (col("data") < 0) throw new Error("coluna 'data' não encontrada");
  const num = (v) => {
    const n = Number(String(v ?? "").trim().replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };
  const sessoes = [];
  let ignoradas = 0;
  linhas.slice(1).forEach((l, k) => {
    const date = String(l[col("data")] ?? "").trim();
    const zones = Object.fromEntries(ZONES.map((z) => [z.id, num(l[col(z.id)])]));
    const total = totalZ(zones);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dayjs(date).getTime()) || !total) {
      ignoradas++;
      return;
    }
    sessoes.push({
      id: `imp-${Date.now().toString(36)}-${k}`,
      date, zones, total,
      avgHr: num(l[col("fc_media")]) || null,
      maxHr: num(l[col("fc_max")]) || null,
      rpe: clamp(num(l[col("rpe")]), 0, 10) || null,
      notes: String(l[col("notas")] ?? "").trim(),
    });
  });
  return { sessoes, ignoradas };
}

/* ================= tela: histórico ================= */

function Historico({ sessions, onEdit, onDelete, onClearDemo, onReseed, onImport, onToast }) {
  const [open, setOpen] = useState(null);
  const arquivo = useRef(null);

  const inputArquivo = (
    <input ref={arquivo} type="file" accept=".csv,text/csv" style={{ display: "none" }}
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) onImport(f);
      }} />
  );

  if (!sessions.length) {
    return (
      <>
        <LargeTitle title="Histórico" /><Empty />
        <Card>
          <button style={s.secondary} onClick={() => arquivo.current?.click()}>Importar CSV</button>
          <button style={s.secondary} onClick={onReseed}>Carregar dados de exemplo</button>
          {inputArquivo}
        </Card>
      </>
    );
  }

  const exportar = () => {
    const linhas = [["data", "total_min", "z1", "z2", "z3", "z4", "z5", "trimp", "fc_media", "fc_max", "rpe", "notas"].join(",")];
    [...sessions].sort((a, b) => a.date.localeCompare(b.date)).forEach((x) => {
      linhas.push([x.date, x.total, x.zones.z1 || 0, x.zones.z2 || 0, x.zones.z3 || 0, x.zones.z4 || 0,
        x.zones.z5 || 0, trimp(x), x.avgHr || "", x.maxHr || "", x.rpe || "",
        `"${(x.notes || "").replace(/"/g, '""')}"`].join(","));
    });
    try {
      const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `treinos-${iso(new Date())}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      onToast("Arquivo CSV gerado");
    } catch {
      onToast("Não foi possível exportar neste ambiente");
    }
  };

  const meses = {};
  sessions.forEach((x) => { (meses[x.date.slice(0, 7)] ||= []).push(x); });
  const nDemo = sessions.filter((x) => x.demo).length;

  return (
    <>
      <LargeTitle title="Histórico" action={{ label: "Exportar", onClick: exportar }} />
      {Object.entries(meses).map(([mes, list], mi) => (
        <div key={mes}>
          <div style={s.section}>
            <span>{dayjs(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
            <span style={s.sectionRight}>{fmt(sum(list, (x) => x.total))} min · {list.length} treinos</span>
          </div>
          <Card i={mi} pad={0}>
            {list.map((x, i) => (
              <div key={x.id}>
                <button style={{ ...s.sesRow, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}
                  onClick={() => setOpen(open === x.id ? null : x.id)}>
                  <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={s.rowLabel}>{shortDate(x.date)}</span>
                      <span style={{ ...s.mono, fontSize: 13 }}>{x.total} min</span>
                    </div>
                    <div style={s.rowSub}>
                      {fmt(trimp(x))} TRIMP{x.avgHr ? ` · ${x.avgHr} bpm médios` : ""}{x.rpe ? ` · RPE ${x.rpe}` : ""}
                    </div>
                    <div style={s.miniBar}>
                      {ZONES.map((z) => (x.zones[z.id] > 0 ? (
                        <div key={z.id} style={{ width: `${(x.zones[z.id] / x.total) * 100}%`, background: z.color }} />
                      ) : null))}
                    </div>
                  </div>
                  <span style={{ ...s.chev, transform: open === x.id ? "rotate(90deg)" : "none" }}>›</span>
                </button>
                {open === x.id && (
                  <div style={s.detail}>
                    {ZONES.map((z) => (
                      <div key={z.id} style={s.detailRow}>
                        <span style={{ ...s.dotSm, background: z.color }} />
                        <span style={{ flex: 1, color: C.sec }}>{z.label}</span>
                        <span style={s.mono}>{x.zones[z.id] || 0} min</span>
                      </div>
                    ))}
                    {x.maxHr && (
                      <div style={s.detailRow}>
                        <span style={{ flex: 1, color: C.sec }}>FC máxima</span>
                        <span style={s.mono}>{x.maxHr} bpm</span>
                      </div>
                    )}
                    <div style={s.detailRow}>
                      <span style={{ flex: 1, color: C.sec }}>Densidade</span>
                      <span style={s.mono}>{fmt(trimp(x) / x.total, 2)} /min</span>
                    </div>
                    {x.notes && <p style={{ ...s.foot, marginTop: 8 }}>{x.notes}</p>}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button style={{ ...s.secondary, flex: 1, marginTop: 0 }} onClick={() => onEdit(x)}>Editar</button>
                      <button style={{ ...s.destructive, flex: 1, marginTop: 0 }} onClick={() => onDelete(x.id)}>Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      ))}

      <SectionTitle>Backup</SectionTitle>
      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          Os treinos ficam apenas neste navegador — limpar os dados do site apaga tudo. Exporte de
          tempos em tempos e guarde o arquivo; ele pode ser importado de volta aqui, inclusive em
          outro aparelho. Treinos já presentes não são duplicados na importação.
        </p>
        <button style={s.secondary} onClick={exportar}>Exportar CSV</button>
        <button style={s.secondary} onClick={() => arquivo.current?.click()}>Importar CSV</button>
        {inputArquivo}
      </Card>

      <SectionTitle>Dados de exemplo</SectionTitle>
      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          {nDemo > 0
            ? `O app está com ${nDemo} treinos fictícios de 19 semanas para os gráficos aparecerem preenchidos.`
            : "Os treinos de exemplo foram removidos. Só ficaram os seus registros."}
        </p>
        {nDemo > 0
          ? <button style={s.secondary} onClick={onClearDemo}>Limpar exemplos e começar do zero</button>
          : <button style={s.secondary} onClick={onReseed}>Recarregar dados de exemplo</button>}
      </Card>
    </>
  );
}

/* ================= folhas modais ================= */

function RegistrarSheet({ cfg, inicial, onSave, onClose }) {
  const base = { date: iso(new Date()), z1: "", z2: "", z3: "", z4: "", z5: "", avgHr: "", maxHr: "", rpe: "", notes: "" };
  const partida = (() => {
    if (!inicial) return base;
    if (inicial.preset) {
      const z = inicial.preset.z;
      return {
        ...base, date: inicial.preset.date || base.date,
        ...Object.fromEntries(ZONES.map((k) => [k.id, z[k.id] ? String(z[k.id]) : ""])),
      };
    }
    return {
      date: inicial.date,
      ...Object.fromEntries(ZONES.map((k) => [k.id, inicial.zones[k.id] ? String(inicial.zones[k.id]) : ""])),
      avgHr: inicial.avgHr ? String(inicial.avgHr) : "",
      maxHr: inicial.maxHr ? String(inicial.maxHr) : "",
      rpe: inicial.rpe ? String(inicial.rpe) : "",
      notes: inicial.notes || "",
    };
  })();

  const [f, setF] = useState(partida);
  const [err, setErr] = useState(null);
  const editando = inicial && !inicial.preset;
  const n = (v) => (v === "" ? 0 : Math.max(0, Number(v) || 0));
  const total = ZONES.reduce((a, z) => a + n(f[z.id]), 0);
  const carga = ZONES.reduce((a, z) => a + n(f[z.id]) * z.w, 0);
  const planoHoje = treinoDoDia(cfg, f.date);

  const aplicar = (z) => setF({ ...f, ...Object.fromEntries(ZONES.map((k) => [k.id, z[k.id] ? String(z[k.id]) : ""])) });

  const submit = () => {
    if (total === 0) { setErr("Informe os minutos em pelo menos uma zona."); return; }
    onSave({
      id: editando ? inicial.id : `s-${Date.now()}`,
      date: f.date,
      zones: Object.fromEntries(ZONES.map((z) => [z.id, n(f[z.id])])),
      total,
      avgHr: n(f.avgHr) || null,
      maxHr: n(f.maxHr) || null,
      rpe: n(f.rpe) || null,
      notes: f.notes.trim(),
    });
  };

  return (
    <Sheet onClose={onClose} titulo={editando ? "Editar treino" : "Novo treino"}
      esquerda={<button style={s.linkSm} onClick={onClose}>Cancelar</button>}
      direita={<button style={s.done} onClick={submit}>Salvar</button>}>
      <Card pad={0}>
        <div style={{ ...s.field, borderTop: "none" }}>
          <span style={s.fieldLabel}>Data</span>
          <input style={s.inputRight} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </div>
      </Card>

      {planoHoje && (
        <Card>
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            <span style={{ ...s.zoneBadge, background: planoHoje.z.z4 ? C.orange : C.green, width: 26, height: 26 }}>
              {planoHoje.id}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.rowLabel}>{planoHoje.nome}</div>
              <div style={s.rowSub}>Planejado para este dia · {totalZ(planoHoje.z)} min</div>
            </div>
            <button style={s.chipBtn} onClick={() => aplicar(planoHoje.z)}>Usar</button>
          </div>
        </Card>
      )}

      <SectionTitle>Modelos rápidos</SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {[
          { l: "Z2 · 30 min", z: { z1: 8, z2: 22 } },
          { l: "Z2 · 40 min", z: { z1: 8, z2: 32 } },
          { l: "4×4", z: { z1: 18, z4: 16 } },
          { l: "5×2", z: { z1: 21, z4: 10 } },
          { l: "Limpar", z: {} },
        ].map((p) => (
          <button key={p.l} style={s.preset} onClick={() => aplicar(p.z)}>{p.l}</button>
        ))}
      </div>

      <SectionTitle>Minutos por zona</SectionTitle>
      <Card>
        {ZONES.map((z, i) => {
          const v = n(f[z.id]);
          return (
            <div key={z.id} style={{ ...s.zoneRow, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
              <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.rowLabel}>{z.name}</div>
                <div style={s.rowSub}>{faixa(cfg, i)} bpm</div>
                <div style={s.trackOuter}>
                  <div style={{ ...s.trackInner, width: total ? `${(v / total) * 100}%` : "0%", background: z.color }} />
                </div>
              </div>
              <input style={s.zoneInput} type="number" min="0" inputMode="numeric" placeholder="0"
                value={f[z.id]} onChange={(e) => { setErr(null); setF({ ...f, [z.id]: e.target.value }); }} />
            </div>
          );
        })}
        <div style={s.totalBar}>
          <div>
            <div style={s.rowLabel}>Duração total</div>
            <div style={s.rowSub}>Carga estimada {fmt(carga)} TRIMP</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ ...s.big, fontSize: 32 }}>{total}</span><span style={s.unit}>min</span>
          </div>
        </div>
      </Card>

      <SectionTitle>Frequência cardíaca e esforço</SectionTitle>
      <Card pad={0}>
        <FieldNum first label="FC média" unit="bpm" value={f.avgHr} onChange={(v) => setF({ ...f, avgHr: v })} />
        <FieldNum label="FC máxima" unit="bpm" value={f.maxHr} onChange={(v) => setF({ ...f, maxHr: v })} />
        <FieldNum label="Esforço percebido" unit="1–10" value={f.rpe} onChange={(v) => setF({ ...f, rpe: v })} />
      </Card>

      <SectionTitle>Notas</SectionTitle>
      <Card>
        <textarea style={s.textarea} rows={3} placeholder="Como foi o treino"
          value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Card>

      {err && <div style={s.error}>{err}</div>}
      <button style={s.primary} onClick={submit}>{editando ? "Salvar alterações" : "Salvar treino"}</button>
    </Sheet>
  );
}

function PlanoSheet({ cfg, sessions, onChange, onClose, onUsar }) {
  const atual = semanaDoPlano(cfg);
  const hoje = iso(new Date());

  return (
    <Sheet onClose={onClose} titulo="Plano de 10 semanas"
      direita={<button style={s.done} onClick={onClose}>OK</button>}>
      <Card>
        <div style={s.eyebrow}>Objetivo</div>
        <p style={{ ...s.insightBody, marginTop: 4 }}>
          Construir capacidade de sustentar a Zona 4 partindo do zero em intervalado, mantendo a base
          aeróbica em Z2. Três sessões por semana: segunda, quarta e sexta.
        </p>
        <div style={{ ...s.row, borderTop: `0.5px solid ${C.sep}`, marginTop: 10 }}>
          <span style={{ flex: 1, ...s.rowLabel }}>Início do plano</span>
          <input style={s.inputRight} type="date" value={cfg.planoInicio || ""}
            onChange={(e) => onChange({ ...cfg, planoInicio: e.target.value })} />
        </div>
        {atual && <div style={s.rowSub}>Você está na semana {atual} de 10.</div>}
      </Card>

      {PLANO.map((fase, fi) => {
        const ativa = atual && atual >= fase.de && atual <= fase.ate;
        return (
          <div key={fase.nome}>
            <div style={s.section}>
              <span>Semanas {fase.de} e {fase.ate} · {fase.nome}</span>
              {ativa && <span style={{ ...s.sectionRight, color: C.green }}>em curso</span>}
            </div>
            <Card i={fi} pad={0}>
              <p style={{ ...s.foot, margin: 0, padding: "13px 16px 4px" }}>{fase.resumo}</p>
              {fase.treinos.map((t, i) => (
                <div key={t.id} style={{ ...s.field, borderTop: `0.5px solid ${C.sep}`, alignItems: "flex-start" }}>
                  <span style={{ ...s.zoneBadge, background: t.z.z4 ? C.orange : t.z.z3 ? C.blue : C.green, marginTop: 2 }}>
                    {t.id}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.rowLabel}>{cap(DIAS_NOME[t.dia])} · {t.nome}</div>
                    <div style={{ ...s.rowSub, marginTop: 3 }}>{t.desc}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                      {ZONES.filter((z) => t.z[z.id]).map((z) => (
                        <span key={z.id} style={{ ...s.miniTag, background: `${z.color}22`, color: z.color }}>
                          {t.z[z.id]} min Z{z.short}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={s.mono}>{totalZ(t.z)}′</div>
                    {ativa && (
                      <button style={{ ...s.chipBtn, marginTop: 6 }} onClick={() => onUsar(t, hoje)}>Usar</button>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ ...s.field, borderTop: `0.5px solid ${C.sep}` }}>
                <span style={{ flex: 1, ...s.rowSub }}>Volume da semana</span>
                <span style={s.mono}>{sum(fase.treinos, (t) => totalZ(t.z))} min</span>
              </div>
            </Card>
          </div>
        );
      })}

      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          Se dois treinos intervalados seguidos parecerem excessivamente difíceis, repita a semana anterior
          antes de avançar. Se a razão aguda/crônica passar de 1,4, mantenha o volume da semana seguinte
          igual ao da atual em vez de subir.
        </p>
      </Card>
    </Sheet>
  );
}

function Ajustes({ cfg, onChange, onClose }) {
  const set = (k, v) => onChange({ ...cfg, [k]: Number(v) || 0 });
  return (
    <Sheet onClose={onClose} titulo="Ajustes" direita={<button style={s.done} onClick={onClose}>OK</button>}>
      <SectionTitle>Frequência cardíaca</SectionTitle>
      <Card pad={0}>
        <FieldNum first label="FC máxima" unit="bpm" value={cfg.maxHr} onChange={(v) => set("maxHr", v)} />
        <FieldNum label="FC de repouso" unit="bpm" value={cfg.restHr} onChange={(v) => set("restHr", v)} />
        <FieldNum label="VO₂ máx" unit="ml/kg/min" value={cfg.vo2max} onChange={(v) => onChange({ ...cfg, vo2max: Number(v) || 0 })} />
        <FieldNum label="Meta semanal" unit="min" value={cfg.weeklyGoal} onChange={(v) => set("weeklyGoal", v)} />
      </Card>

      <SectionTitle>Cálculo das zonas</SectionTitle>
      <Card pad={0}>
        {[
          { v: "hrr", t: "Frequência de reserva", d: "Método Karvonen, usa também a FC de repouso" },
          { v: "max", t: "Percentual da FC máxima", d: "Divisão simples por % da FC máxima" },
        ].map((o, i) => (
          <button key={o.v} style={{ ...s.field, borderTop: i ? `0.5px solid ${C.sep}` : "none", width: "100%", textAlign: "left" }}
            onClick={() => onChange({ ...cfg, method: o.v })}>
            <div style={{ flex: 1 }}>
              <div style={s.rowLabel}>{o.t}</div>
              <div style={s.rowSub}>{o.d}</div>
            </div>
            {cfg.method === o.v && <span style={{ color: C.blue, fontSize: 18, fontWeight: 700 }}>✓</span>}
          </button>
        ))}
      </Card>

      <SectionTitle>Suas zonas</SectionTitle>
      <Card pad={0}>
        {ZONES.map((z, i) => (
          <div key={z.id} style={{ ...s.field, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
            <div style={{ flex: 1 }}>
              <div style={s.rowLabel}>{z.label}</div>
              <div style={s.rowSub}>{z.name}</div>
            </div>
            <span style={s.mono}>{faixa(cfg, i)} bpm</span>
          </div>
        ))}
      </Card>

      <SectionTitle>Plano de treino</SectionTitle>
      <Card pad={0}>
        <button style={{ ...s.field, borderTop: "none", width: "100%", textAlign: "left" }}
          onClick={() => onChange({ ...cfg, planoAtivo: !cfg.planoAtivo })}>
          <div style={{ flex: 1 }}>
            <div style={s.rowLabel}>Plano de 10 semanas</div>
            <div style={s.rowSub}>{cfg.planoAtivo ? "Ativo" : "Desativado"}</div>
          </div>
          <span style={{ ...s.toggle, background: cfg.planoAtivo ? C.green : "rgba(120,120,128,0.3)" }}>
            <span style={{ ...s.toggleKnob, transform: cfg.planoAtivo ? "translateX(19px)" : "none" }} />
          </span>
        </button>
        <div style={{ ...s.field, borderTop: `0.5px solid ${C.sep}` }}>
          <span style={s.fieldLabel}>Início</span>
          <input style={s.inputRight} type="date" value={cfg.planoInicio || ""}
            onChange={(e) => onChange({ ...cfg, planoInicio: e.target.value })} />
        </div>
      </Card>

      <p style={s.foot}>
        Compare as faixas de bpm com as zonas que aparecem no seu Apple Watch e ajuste a FC máxima até
        baterem. O relógio recalcula as faixas conforme seus treinos, então elas mudam de tempos em tempos.
      </p>
    </Sheet>
  );
}

/* ================= gráficos ================= */

function WeekStrip({ dias, sel, setSel }) {
  const H = 74;
  const maxMin = Math.max(40, ...dias.map((d) => Math.max(d.total, d.plano ? totalZ(d.plano.z) : 0)));

  return (
    <div style={{ display: "flex", gap: 5, marginTop: 14 }}>
      {dias.map((d) => {
        const on = sel === d.date;
        const planoMin = d.plano ? totalZ(d.plano.z) : 0;
        const mostraPlano = d.total === 0 && planoMin > 0;
        return (
          <button key={d.date} onClick={() => setSel(on ? null : d.date)}
            style={{ ...s.diaCol, background: on ? "rgba(0,122,255,0.08)" : "transparent" }}>
            <span style={{ ...s.diaLetra, color: d.hoje ? C.red : C.sec, fontWeight: d.hoje ? 700 : 500 }}>
              {DIAS_CURTO[d.wd]}
            </span>
            <span style={{ ...s.diaNum, ...(d.hoje ? s.diaNumHoje : {}) }}>{dayjs(d.date).getDate()}</span>
            <div style={{ height: H, width: "100%", display: "flex", flexDirection: "column",
              justifyContent: "flex-end", alignItems: "center", marginTop: 6 }}>
              {d.total > 0 ? (
                <div style={{ ...s.diaBarra, height: `${(d.total / maxMin) * H}px` }}>
                  {[...ZONES].reverse().map((z) => (d.zones[z.id] > 0 ? (
                    <div key={z.id} style={{ height: `${(d.zones[z.id] / d.total) * 100}%`, background: z.color, width: "100%" }} />
                  ) : null))}
                </div>
              ) : mostraPlano ? (
                <div style={{
                  ...s.diaBarraPlano, height: `${(planoMin / maxMin) * H}px`,
                  borderColor: d.plano.z.z4 ? "rgba(255,159,10,0.5)" : "rgba(48,209,88,0.45)",
                }} />
              ) : (
                <div style={s.diaVazio} />
              )}
            </div>
            <span style={{ ...s.diaMin, color: d.total ? C.label : C.ter }}>
              {d.total || (mostraPlano ? planoMin : "—")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CumulativeChart({ atual, anterior }) {
  const H = 120, W = 320, pad = 26;
  const max = Math.max(...atual, ...anterior, 10) * 1.1;
  const x = (i) => pad + (i / 27) * W;
  const y = (v) => H - (v / max) * H;
  const linha = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 20}`} style={{ width: "100%", display: "block", marginTop: 12 }}>
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={y(t)} x2={W + pad} y2={y(t)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(t) + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(t)}</text>
        </g>
      ))}
      <path d={linha(anterior)} fill="none" stroke={C.ter} strokeWidth="1.8" strokeDasharray="4 3" />
      <path d={`${linha(atual)} L${x(27)},${H} L${x(0)},${H} Z`} fill="url(#gradAcum)" />
      <path d={linha(atual)} fill="none" stroke={C.green} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx={x(27)} cy={y(atual[27])} r="3.6" fill="#fff" stroke={C.green} strokeWidth="2.2" />
      <text x={pad} y={H + 15} fontSize="9.5" fill={C.sec}>28 dias atrás</text>
      <text x={W + pad} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="end">hoje</text>
    </svg>
  );
}

function ZoneEvolution({ weeks }) {
  const H = 124, W = 326, pad = 8;
  const dados = weeks.slice(-12).filter((w) => w.minutos > 0);
  if (dados.length < 2) return <p style={s.foot}>Poucas semanas com registro para montar a evolução.</p>;
  const bw = W / dados.length;

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 20}`} style={{ width: "100%", display: "block", marginTop: 12 }}>
      {dados.map((w, i) => {
        let y = H;
        const bar = bw * 0.78;
        const x = pad + i * bw + (bw - bar) / 2;
        return (
          <g key={w.start}>
            {ZONES.map((z) => {
              const p = w.zones[z.id] / w.minutos;
              if (!p) return null;
              const h = p * H;
              y -= h;
              return <rect key={z.id} x={x} y={y} width={bar} height={h} fill={z.color} rx="1" />;
            })}
          </g>
        );
      })}
      {dados.map((w, i) => (i % 3 === 0 ? (
        <text key={w.start} x={pad + i * bw + bw / 2} y={H + 15} fontSize="9" fill={C.sec} textAnchor="middle">
          {dayjs(w.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ) : null))}
    </svg>
  );
}

function WeekdayChart({ perfil }) {
  const H = 104, W = 320, pad = 24;
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const max = Math.max(5, ...perfil.map((p) => p.media)) * 1.15;
  const bw = W / 7;
  const bar = bw * 0.52;

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 22}`} style={{ width: "100%", display: "block", marginTop: 12 }}>
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={H - (t / max) * H} x2={W + pad} y2={H - (t / max) * H} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={H - (t / max) * H + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(t)}</text>
        </g>
      ))}
      {ordem.map((wd, i) => {
        const p = perfil[wd];
        const h = (p.media / max) * H;
        return (
          <g key={wd}>
            <path d={topRounded(pad + i * bw + (bw - bar) / 2, H - h, bar, h, 3.5)} fill="url(#gradDia)" />
            <text x={pad + i * bw + bw / 2} y={H + 15} fontSize="10" fill={C.sec} textAnchor="middle">
              {DIAS_CURTO[wd]}
            </text>
          </g>
        );
      })}
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
    </svg>
  );
}

function ProjChart({ atual, cenarios }) {
  const H = 104, W = 316, pad = 26;
  const max = Math.max(atual, ...cenarios.map((c) => c.v)) * 1.15;
  const x = (t) => pad + (t / 28) * W;
  const y = (v) => H - (v / max) * H;

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 20}`} style={{ width: "100%", display: "block", marginTop: 12 }}>
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={y(t)} x2={W + pad} y2={y(t)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(t) + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(t)}</text>
        </g>
      ))}
      {cenarios.map((c) => (
        <g key={c.l}>
          <path d={`M${x(0)},${y(atual)} Q${x(14)},${y(atual + (c.v - atual) * 0.62)} ${x(28)},${y(c.v)}`}
            fill="none" stroke={c.c} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx={x(28)} cy={y(c.v)} r="3.4" fill="#fff" stroke={c.c} strokeWidth="2.2" />
        </g>
      ))}
      <circle cx={x(0)} cy={y(atual)} r="3.6" fill={C.label} />
      <text x={pad} y={H + 15} fontSize="9.5" fill={C.sec}>hoje</text>
      <text x={W + pad} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="end">em 4 semanas</text>
    </svg>
  );
}

function PmcChart({ pmc }) {
  const dados = pmc.slice(-98);
  const H = 128, HB = 34, W = 322, pad = 26;
  const max = Math.max(10, ...dados.map((d) => Math.max(d.ctl, d.atl))) * 1.12;
  const x = (i) => pad + (i / Math.max(1, dados.length - 1)) * W;
  const y = (v) => H - (v / max) * H;
  const maxT = Math.max(8, ...dados.map((d) => Math.abs(d.tsb)));
  const linha = (key) => dados.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  const bw = W / dados.length;

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + HB + 26}`} style={{ width: "100%", display: "block", marginTop: 14 }}>
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={y(t)} x2={W + pad} y2={y(t)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(t) + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(t)}</text>
        </g>
      ))}
      <path d={`${linha("ctl")} L${x(dados.length - 1)},${H} L${x(0)},${H} Z`} fill="url(#gradCtl)" />
      <path d={linha("ctl")} fill="none" stroke={C.blue} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={linha("atl")} fill="none" stroke={C.orange} strokeWidth="1.8" strokeLinejoin="round" opacity="0.9" />
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      <text x="0" y={H + HB / 2 + 3} fontSize="8.5" fill={C.ter}>forma</text>
      <line x1={pad} y1={H + 12 + HB / 2} x2={W + pad} y2={H + 12 + HB / 2} stroke={C.sep} strokeWidth="0.7" />
      {dados.map((d, i) => {
        const h = (Math.abs(d.tsb) / maxT) * (HB / 2);
        const zero = H + 12 + HB / 2;
        return (
          <rect key={d.date} x={pad + i * bw} width={Math.max(bw - 0.4, 0.8)}
            y={d.tsb >= 0 ? zero - h : zero} height={h}
            fill={d.tsb >= 0 ? C.green : d.tsb < -20 ? C.red : C.orange} opacity="0.65" />
        );
      })}
      {[0, Math.floor(dados.length / 2), dados.length - 1].map((i) => (
        <text key={i} x={x(i)} y={H + HB + 24} fontSize="9.5" fill={C.sec}
          textAnchor={i === 0 ? "start" : i === dados.length - 1 ? "end" : "middle"}>
          {dayjs(dados[i].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ))}
    </svg>
  );
}

function ZoneColumn({ totals, grand, cfg }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={s.columnWrap}>
        {[...ZONES].reverse().map((z) => {
          const p = grand ? (totals[z.id] / grand) * 100 : 0;
          return p > 0 ? <div key={z.id} style={{ height: `${p}%`, background: z.color, width: "100%" }} /> : null;
        })}
      </div>
      <div style={{ flex: 1 }}>
        {ZONES.map((z, i) => {
          const m = totals[z.id];
          const p = grand ? (m / grand) * 100 : 0;
          return (
            <div key={z.id} style={{ ...s.row, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
              <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.rowLabel}>{z.name}</div>
                <div style={s.rowSub}>{faixa(cfg, i)} bpm</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={s.rowValue}>{fmt(p)}%</div>
                <div style={s.rowSub}>{fmt(m)} min</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ZoneBars({ dias, sel, setSel }) {
  const ref = useRef(null);
  const H = 158, W = 336, pad = 22, VB = W + pad;
  const max = Math.max(30, ...dias.map((d) => d.total));
  const bw = W / dias.length;
  const bar = Math.max(2.5, Math.min(17, bw * 0.66));
  const step = dias.length <= 7 ? 1 : dias.length <= 30 ? 7 : 21;

  const locate = (clientX) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return null;
    return clamp(Math.floor((((clientX - r.left) / r.width) * VB - pad) / bw), 0, dias.length - 1);
  };
  const move = (e) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const i = locate(e.clientX);
    if (i != null) setSel(i);
  };

  return (
    <svg ref={ref} viewBox={`0 0 ${VB} ${H + 24}`}
      style={{ width: "100%", display: "block", marginTop: 14, touchAction: "pan-y", cursor: "crosshair" }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); const i = locate(e.clientX); if (i != null) setSel(i); }}
      onPointerMove={move}
      onPointerUp={(e) => e.currentTarget.releasePointerCapture?.(e.pointerId)}>
      {[0, Math.round(max / 2), max].map((t) => {
        const y = H - (t / max) * H;
        return (
          <g key={t}>
            <line x1={pad} y1={y} x2={VB} y2={y} stroke={C.sep} strokeWidth="0.7" />
            <text x="0" y={y + 3.5} fontSize="9.5" fill={C.ter}>{t}</text>
          </g>
        );
      })}
      {sel != null && (
        <line x1={pad + sel * bw + bw / 2} y1={-2} x2={pad + sel * bw + bw / 2} y2={H}
          stroke={C.ter} strokeWidth="1" strokeDasharray="3 3" />
      )}
      {dias.map((d, i) => {
        const x = pad + i * bw + (bw - bar) / 2;
        const on = sel === i;
        const segs = ZONES.filter((z) => d.zones[z.id] > 0);
        let y = H;
        return (
          <g key={d.date} opacity={sel == null || on ? 1 : 0.28}>
            {segs.map((z, k) => {
              const h = (d.zones[z.id] / max) * H;
              y -= h;
              return k === segs.length - 1
                ? <path key={z.id} d={topRounded(x, y, bar, h, Math.min(bar / 2.2, 3))} fill={`url(#zg-${z.id})`} />
                : <rect key={z.id} x={x} y={y} width={bar} height={h} fill={`url(#zg-${z.id})`} />;
            })}
          </g>
        );
      })}
      <line x1={pad} y1={H} x2={VB} y2={H} stroke={C.sep} strokeWidth="0.7" />
      {dias.map((d, i) => (i % step === 0 ? (
        <text key={d.date} x={pad + i * bw + bw / 2} y={H + 16} fontSize="9.5"
          fill={sel === i ? C.label : C.sec} fontWeight={sel === i ? 600 : 400} textAnchor="middle">
          {dayjs(d.date).toLocaleDateString("pt-BR",
            dias.length <= 7 ? { weekday: "short" } : { day: "2-digit", month: "2-digit" })}
        </text>
      ) : null))}
    </svg>
  );
}

function LoadChart({ weeks }) {
  const H = 146, W = 326, pad = 26;
  const max = Math.max(50, ...weeks.map((w) => Math.max(w.carga, w.media4))) * 1.14;
  const bw = W / weeks.length;
  const bar = bw * 0.56;
  const path = weeks.map((w, i) => `${i ? "L" : "M"}${pad + i * bw + bw / 2},${H - (w.media4 / max) * H}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 22}`} style={{ width: "100%", display: "block", marginTop: 14 }}>
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={H - (t / max) * H} x2={W + pad} y2={H - (t / max) * H} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={H - (t / max) * H + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(t)}</text>
        </g>
      ))}
      {weeks.map((w, i) => {
        const h = (w.carga / max) * H;
        const alta = w.media4 > 0 && w.carga > w.media4 * 1.3;
        return <path key={w.start} d={topRounded(pad + i * bw + (bw - bar) / 2, H - h, bar, h, 3.5)}
          fill={alta ? "url(#gradAlerta)" : "url(#gradNeutro)"} />;
      })}
      <path d={path} fill="none" stroke={C.blue} strokeWidth="2" strokeDasharray="4 3.5" strokeLinecap="round" />
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      {weeks.map((w, i) => (i % 4 === 0 ? (
        <text key={w.start} x={pad + i * bw + bw / 2} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="middle">
          {dayjs(w.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ) : null))}
    </svg>
  );
}

function IntensityChart({ weeks }) {
  const H = 120, W = 326, pad = 26;
  const max = Math.max(30, ...weeks.map((w) => w.minutos)) * 1.1;
  const bw = W / weeks.length;
  const bar = bw * 0.56;

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 22}`} style={{ width: "100%", display: "block", marginTop: 14 }}>
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={H - (t / max) * H} x2={W + pad} y2={H - (t / max) * H} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={H - (t / max) * H + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(t)}</text>
        </g>
      ))}
      {weeks.map((w, i) => {
        const x = pad + i * bw + (bw - bar) / 2;
        const h = (w.minutos / max) * H, hi = (w.z3mais / max) * H;
        return (
          <g key={w.start}>
            <path d={topRounded(x, H - h, bar, h, 3.5)} fill="#E3E3E8" />
            {hi > 0 && <path d={topRounded(x, H - hi, bar, hi, 3.5)} fill="url(#gradIntensa)" />}
          </g>
        );
      })}
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      {weeks.map((w, i) => (i % 4 === 0 ? (
        <text key={w.start} x={pad + i * bw + bw / 2} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="middle">
          {dayjs(w.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ) : null))}
    </svg>
  );
}

function HrChart({ data }) {
  const H = 134, W = 312, pad = 28;
  const vals = data.map((d) => d.avgHr);
  const min = Math.min(...vals) - 5, max = Math.max(...vals) + 5;
  const x = (i) => pad + (i / Math.max(1, data.length - 1)) * W;
  const y = (v) => H - ((v - min) / (max - min || 1)) * H;
  const n = data.length, mx = (n - 1) / 2, my = vals.reduce((a, b) => a + b, 0) / n;
  let nume = 0, deno = 0;
  vals.forEach((v, i) => { nume += (i - mx) * (v - my); deno += (i - mx) ** 2; });
  const b = deno ? nume / deno : 0, a = my - b * mx;

  let line = `M${x(0)},${y(vals[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const x0 = x(i), y0 = y(vals[i]), x1 = x(i + 1), y1 = y(vals[i + 1]);
    const cx = (x0 + x1) / 2;
    line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 20}`} style={{ width: "100%", display: "block", marginTop: 14 }}>
      {[min + 4, (min + max) / 2, max - 4].map((v, i) => (
        <g key={i}>
          <line x1={pad} y1={y(v)} x2={W + pad} y2={y(v)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(v) + 3.5} fontSize="9.5" fill={C.ter}>{Math.round(v)}</text>
        </g>
      ))}
      <path d={`${line} L${x(n - 1)},${H} L${x(0)},${H} Z`} fill="url(#gradHr)" />
      <path d={`M${x(0)},${y(a)} L${x(n - 1)},${y(a + b * (n - 1))}`} stroke={C.sec} strokeWidth="1.4" strokeDasharray="5 4" fill="none" />
      <path d={line} fill="none" stroke={C.red} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => <circle key={d.id} cx={x(i)} cy={y(d.avgHr)} r="3.4" fill="#fff" stroke={C.red} strokeWidth="2" />)}
      {[0, n - 1].map((i) => (
        <text key={i} x={x(i)} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor={i ? "end" : "start"}>
          {dayjs(data[i].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ))}
    </svg>
  );
}

function RpeScatter({ pontos }) {
  const H = 130, W = 310, pad = 26;
  const maxX = Math.max(...pontos.map((p) => p.x)) * 1.08;
  const x = (v) => pad + (v / maxX) * W;
  const y = (v) => H - ((v - 1) / 9) * H;
  const xs = pontos.map((p) => p.x), ys = pontos.map((p) => p.y);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const b = den ? num / den : 0, a = my - b * mx;

  return (
    <svg viewBox={`0 0 ${W + pad} ${H + 22}`} style={{ width: "100%", display: "block", marginTop: 14 }}>
      {[2, 4, 6, 8, 10].map((v) => (
        <g key={v}>
          <line x1={pad} y1={y(v)} x2={W + pad} y2={y(v)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(v) + 3.5} fontSize="9.5" fill={C.ter}>{v}</text>
        </g>
      ))}
      <path d={`M${x(0)},${clamp(y(a), 0, H)} L${x(maxX)},${clamp(y(a + b * maxX), 0, H)}`}
        stroke={C.purple} strokeWidth="1.6" strokeDasharray="5 4" fill="none" />
      {pontos.map((p, i) => <circle key={i} cx={x(p.x)} cy={y(p.y)} r="3.6" fill={C.purple} opacity="0.55" />)}
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      <text x={pad} y={H + 15} fontSize="9.5" fill={C.sec}>0 TRIMP</text>
      <text x={W + pad} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="end">{Math.round(maxX)} TRIMP</text>
    </svg>
  );
}

function Heatmap({ sessions }) {
  const [sel, setSel] = useState(null);
  const SEMANAS = 15, CELL = 15, GAP = 4.5;
  const mapa = {};
  sessions.forEach((x) => { mapa[x.date] = (mapa[x.date] || 0) + trimp(x); });
  const maxCarga = Math.max(1, ...Object.values(mapa));
  const inicio = mondayOf(daysAgo((SEMANAS - 1) * 7));
  const hoje = iso(new Date());
  const cols = [];
  for (let w = 0; w < SEMANAS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(inicio); dt.setDate(dt.getDate() + w * 7 + d);
      col.push(iso(dt));
    }
    cols.push(col);
  }
  const cor = (carga) => {
    if (!carga) return C.fill;
    const o = 0.28 + 0.72 * Math.min(1, (carga / maxCarga) * 1.15);
    return `rgba(48,209,88,${o.toFixed(2)})`;
  };
  const W = SEMANAS * (CELL + GAP) + 22, H = 7 * (CELL + GAP) + 16;
  const totalPeriodo = Object.entries(mapa).filter(([d]) => d >= iso(inicio)).reduce((a, [, v]) => a + v, 0);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div style={s.eyebrow}>{sel ? longDate(sel) : "Últimas 15 semanas"}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 2 }}>
            <span style={{ ...s.big, fontSize: 26 }}>{fmt(sel ? mapa[sel] || 0 : totalPeriodo)}</span>
            <span style={s.unit}>TRIMP</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ ...s.rowSub, marginRight: 2 }}>menos</span>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <span key={t} style={{ width: 10, height: 10, borderRadius: 3, background: cor(t * maxCarga) }} />
          ))}
          <span style={{ ...s.rowSub, marginLeft: 2 }}>mais</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", touchAction: "pan-y" }}>
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <text key={i} x="0" y={i * (CELL + GAP) + CELL / 2 + 4.5} fontSize="9" fill={C.ter}>{d}</text>
        ))}
        {cols.map((col, w) => col.map((date, d) => {
          const futuro = date > hoje, on = sel === date;
          return (
            <rect key={date} x={22 + w * (CELL + GAP)} y={d * (CELL + GAP)}
              width={CELL} height={CELL} rx="4.2"
              fill={futuro ? "transparent" : cor(mapa[date] || 0)}
              stroke={on ? C.label : "transparent"} strokeWidth="1.6"
              onClick={() => setSel(on || futuro ? null : date)}
              style={{ cursor: futuro ? "default" : "pointer" }} />
          );
        }))}
        {cols.map((col, w) => {
          const first = dayjs(col[0]);
          return first.getDate() <= 7 ? (
            <text key={w} x={22 + w * (CELL + GAP)} y={H - 2} fontSize="9" fill={C.sec}>
              {first.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
            </text>
          ) : null;
        })}
      </svg>
    </>
  );
}

/* ================= análise textual ================= */

const ICONS = {
  carga: "M3 17l5-6 4 4 6-8",
  zonas: "M4 19V9M9.5 19V5M15 19v-7M20.5 19v-4",
  coracao: "M12 20s-7-4.5-7-9.5A3.9 3.9 0 0112 8a3.9 3.9 0 017 2.5C19 15.5 12 20 12 20z",
  raio: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
  meta: "M5 12l4.5 4.5L19 7",
  relogio: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z",
  balanca: "M12 4v16M5 8h14M7 8l-3 6h6zM17 8l-3 6h6z",
  calendario: "M4 8h16M8 3v3M16 3v3M5 21h14a1 1 0 001-1V7a1 1 0 00-1-1H5a1 1 0 00-1 1v13a1 1 0 001 1z",
};

function escala(v, [a, b, c], invertido = false) {
  if (invertido) return v < a ? "bom" : v < b ? "ok" : v < c ? "atencao" : "alto";
  return v < a ? "baixo" : v < b ? "bom" : v < c ? "atencao" : "alto";
}

/* tempo fácil não tem faixa superior de risco: quanto maior, melhor.
   O corte em 75% é o mesmo usado pela leitura em `insights`, para os dois não se contradizerem. */
const escalaFacil = (v) => (v < 75 ? "atencao" : "bom");

function insights(st) {
  const out = [];

  if (st.acwr != null) {
    const v = st.acwr, alto = v > 1.45, baixo = v < 0.8;
    out.push({
      tag: fmt(v, 2), icon: ICONS.carga, c: alto ? C.orange : baixo ? C.blue : C.green,
      t: alto ? "Carga subiu rápido" : baixo ? "Semana mais leve" : "Carga bem distribuída",
      d: alto
        ? `Sua semana pesou ${fmt((v - 1) * 100)}% mais que a média das últimas quatro. Saltos assim costumam vir acompanhados de cansaço acumulado — repetir o volume atual antes de subir de novo é o caminho mais seguro.`
        : baixo
          ? "A carga dos últimos 7 dias ficou abaixo da sua média recente. Se foi intencional, funciona bem como semana de recuperação."
          : "A carga dos últimos 7 dias está próxima da média das últimas quatro semanas, que é onde a progressão costuma se sustentar.",
    });
  }

  if (st.monotonia != null && st.monotonia > 2) {
    out.push({
      tag: fmt(st.monotonia, 2), icon: ICONS.balanca, c: C.orange, t: "Semana uniforme demais",
      d: `Monotonia em ${fmt(st.monotonia, 2)}: seus dias tiveram carga muito parecida entre si. Semanas com contraste — dias claramente leves e um ou dois claramente puxados — costumam render mais adaptação.`,
    });
  }

  const tsb = st.forma.tsb;
  if (tsb < -18 || tsb > 12) {
    out.push({
      tag: `${tsb > 0 ? "+" : ""}${fmt(tsb, 1)}`, icon: ICONS.relogio, c: tsb > 0 ? C.blue : C.red,
      t: tsb > 0 ? "Você está descansado" : "Fadiga acima da base",
      d: tsb > 0
        ? "Sua fadiga está bem abaixo da aptidão acumulada. É um bom momento para uma sessão mais longa ou mais intensa, se quiser subir o volume."
        : "Sua carga recente está bem acima da base de 6 semanas. Não é um problema em si — é assim que se progride — mas costuma pedir uma semana mais leve depois de duas ou três assim.",
    });
  }

  const p = st.polar;
  out.push({
    tag: `${fmt(p)}%`, icon: ICONS.zonas, c: p >= 75 ? C.green : C.orange,
    t: p >= 75 ? "Boa base de intensidade leve" : "Muito tempo em intensidade média",
    d: p >= 75
      ? `${fmt(p)}% do seu tempo está em Z1 e Z2. Essa proporção alta de treino fácil é o que permite manter volume sem acumular fadiga.`
      : `Só ${fmt(p)}% do seu tempo está em Z1 e Z2. Treinar quase sempre em Z3 tende a cansar mais do que render; a alternativa é deixar os treinos fáceis mais fáceis e concentrar a intensidade em uma ou duas sessões da semana.`,
  });

  if (st.deltaHr != null && Math.abs(st.deltaHr) >= 1) {
    const queda = st.deltaHr < 0;
    out.push({
      tag: `${st.deltaHr > 0 ? "+" : ""}${fmt(st.deltaHr, 1)}`, icon: ICONS.coracao,
      c: queda ? C.green : C.purple,
      t: queda ? "FC caindo nos treinos contínuos" : "FC subindo nos treinos contínuos",
      d: queda
        ? `Nas últimas ${st.hrSes.length} sessões contínuas sua FC média caiu cerca de ${fmt(Math.abs(st.deltaHr), 1)} bpm. Sustentar um esforço parecido com FC menor é o sinal mais direto de condicionamento melhorando.`
        : `Nas últimas ${st.hrSes.length} sessões contínuas sua FC média subiu cerca de ${fmt(st.deltaHr, 1)} bpm. Pode ser aumento real de intensidade, mas também aparece com sono ruim, calor na academia ou fadiga acumulada.`,
    });
  }

  if (st.planoPrev >= 4) {
    const taxa = (st.planoFeito / st.planoPrev) * 100;
    out.push({
      tag: `${fmt(taxa)}%`, icon: ICONS.calendario, c: taxa >= 75 ? C.green : C.orange,
      t: taxa >= 75 ? "Boa aderência ao plano" : "Sessões do plano ficando para trás",
      d: `Você completou ${st.planoFeito} das ${st.planoPrev} sessões previstas nos últimos 28 dias. ${taxa >= 75 ? "Nesse ritmo o plano chega ao fim como desenhado." : "Se o problema for o dia da semana e não o treino em si, vale mover a sessão em vez de pular."}`,
    });
  }

  if (st.densidade28 != null && st.densidade28ant != null) {
    const d = st.densidade28 - st.densidade28ant;
    if (Math.abs(d) >= 0.12) {
      out.push({
        tag: `${d > 0 ? "+" : ""}${fmt(d, 2)}`, icon: ICONS.raio, c: d > 0 ? C.orange : C.blue,
        t: d > 0 ? "Treinos ficaram mais densos" : "Treinos ficaram mais leves",
        d: `A densidade passou de ${fmt(st.densidade28ant, 2)} para ${fmt(st.densidade28, 2)} TRIMP por minuto entre os dois últimos blocos de 28 dias. ${d > 0 ? "Você está tirando mais carga de cada minuto — vale conferir se o volume total não subiu junto." : "Cada minuto está pesando menos, o que combina com uma fase de volume ou de recuperação."}`,
      });
    }
  }

  if (st.rpeCorr != null && st.rpeCorr < 0.45) {
    out.push({
      tag: fmt(st.rpeCorr, 2), icon: ICONS.balanca, c: C.purple, t: "Percepção descolada da carga",
      d: `A correlação entre o seu RPE e a carga medida está em ${fmt(st.rpeCorr, 2)}. Quando os treinos parecem mais duros do que os números indicam de forma repetida, o fator costuma estar fora da academia: sono, alimentação, estresse ou calor.`,
    });
  }

  const z5 = st.zoneTotals.z5;
  if (st.grand && (z5 / st.grand) * 100 < 1.5) {
    out.push({
      tag: "Z5", icon: ICONS.raio, c: C.blue, t: "Quase nada em Zona 5",
      d: `Você tem ${fmt(z5)} min acumulados em Z5. Não é um problema — dá para progredir bastante sem tocar essa faixa. Se quiser subir o teto aeróbico, blocos curtos de 30 a 60 segundos no elíptico dão conta.`,
    });
  }

  if (st.desdeUltimo >= 4) {
    out.push({
      tag: `${st.desdeUltimo}d`, icon: ICONS.calendario, c: C.orange, t: "Alguns dias sem treinar",
      d: `Seu último registro foi há ${st.desdeUltimo} dias, contra um intervalo médio de ${fmt(st.intervaloMedio, 1)} dias. Pausas curtas custam pouco: a aptidão cai devagar e volta rápido.`,
    });
  }

  const m = st.semana.minutos;
  out.push({
    tag: fmt(m), icon: ICONS.meta, c: m >= 150 ? C.green : C.orange,
    t: m >= 150 ? "Acima da recomendação semanal" : "Abaixo da recomendação semanal",
    d: `A referência da OMS para adultos é de 150 a 300 min semanais de atividade aeróbica moderada. Você somou ${fmt(m)} min em ${st.semana.sessoes} ${st.semana.sessoes === 1 ? "treino" : "treinos"} nos últimos 7 dias.`,
  });

  return out;
}

function faixa(cfg, i) {
  const pc = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1]][i];
  const calc = (p) => (cfg.method === "hrr"
    ? Math.round(cfg.restHr + p * (cfg.maxHr - cfg.restHr))
    : Math.round(p * cfg.maxHr));
  return `${calc(pc[0])}–${calc(pc[1])}`;
}

const longDate = (d) => cap(dayjs(d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }));
const shortDate = (d) => cap(dayjs(d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, ""));

/* ================= interface ================= */

function Shell({ children, scroller, onScroll, compact, titulo }) {
  return (
    <div style={s.page}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,textarea,button{font:inherit;color:inherit}
        button{cursor:pointer;border:none;background:none}
        input[type=number]::-webkit-inner-spin-button{display:none}
        input[type=number]{-moz-appearance:textfield}
        input[type=date]{-webkit-appearance:none}
        button:active{transform:scale(.982);opacity:.7}
        input:focus-visible,textarea:focus-visible,button:focus-visible{outline:2.5px solid ${C.blue};outline-offset:2px;border-radius:8px}
        @keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes fade{from{opacity:0}to{opacity:1}}
        @keyframes sheetIn{from{transform:translateY(100%)}to{transform:none}}
        .card{animation:rise .5s cubic-bezier(.16,.84,.28,1) both}
        @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          {ZONES.map((z) => (
            <linearGradient key={z.id} id={`zg-${z.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={z.light} /><stop offset="100%" stopColor={z.color} />
            </linearGradient>
          ))}
          <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF375F" stopOpacity="0.22" /><stop offset="100%" stopColor="#FF375F" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradCtl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.2" /><stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradAcum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30D158" stopOpacity="0.22" /><stop offset="100%" stopColor="#30D158" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradNeutro" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6D6DB" /><stop offset="100%" stopColor="#BFBFC6" />
          </linearGradient>
          <linearGradient id="gradAlerta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFBC55" /><stop offset="100%" stopColor="#FF9F0A" />
          </linearGradient>
          <linearGradient id="gradIntensa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF7A96" /><stop offset="100%" stopColor="#FF375F" />
          </linearGradient>
          <linearGradient id="gradDia" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B8CFF" /><stop offset="100%" stopColor="#5E5CE6" />
          </linearGradient>
        </defs>
      </svg>

      <div style={s.phone}>
        <div style={{ ...s.compactBar, opacity: compact ? 1 : 0, pointerEvents: "none" }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>{titulo}</span>
        </div>
        <div ref={scroller} onScroll={onScroll} style={s.scroll}>{children}</div>
      </div>
    </div>
  );
}

function Sheet({ children, onClose, titulo, esquerda, direita }) {
  return (
    <div style={s.sheetWrap} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.grabber} />
        <div style={s.sheetHead}>
          <span style={{ width: 74 }}>{esquerda}</span>
          <strong style={{ fontSize: 17, letterSpacing: "-0.3px" }}>{titulo}</strong>
          <span style={{ width: 74, textAlign: "right" }}>{direita}</span>
        </div>
        <div style={{ padding: "0 16px 34px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

const LargeTitle = ({ title, action }) => (
  <div style={s.largeTitle}>
    <h1 style={s.h1}>{title}</h1>
    {action && <button style={s.link} onClick={action.onClick}>{action.label}</button>}
  </div>
);

const SectionTitle = ({ children }) => <div style={s.section}>{children}</div>;

const Card = ({ children, pad = 16, i = 0 }) => (
  <div className="card" style={{ ...s.card, padding: pad, animationDelay: `${Math.min(i, 10) * 0.035}s` }}>
    {children}
  </div>
);

const Empty = () => (
  <Card><p style={{ ...s.foot, margin: 0, textAlign: "center", padding: 26 }}>
    Nenhum treino registrado. Toque no botão + para começar.
  </p></Card>
);

function Tile({ label, value, unit, delta, suffix = "", color, i }) {
  return (
    <div className="card" style={{ ...s.tile, animationDelay: `${i * 0.035}s` }}>
      <div style={s.tileLabel}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 3 }}>
        <span style={{ ...s.big, fontSize: 31, color }}>{value}</span>
        <span style={{ ...s.unit, fontSize: 13 }}>{unit}</span>
      </div>
      {delta != null && (
        <div style={{ ...s.rowSub, marginTop: 5, color: delta > 0 ? C.green : C.sec }}>
          {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {fmt(Math.abs(delta))}{suffix} vs. anterior
        </div>
      )}
    </div>
  );
}

const FAIXA_COR = { baixo: C.blue, bom: C.green, ok: C.green, atencao: C.orange, alto: C.red };
const FAIXA_TXT = { baixo: "baixo", bom: "na faixa", ok: "aceitável", atencao: "atenção", alto: "alto" };

function Metric({ label, value, nota, faixa, delta, first }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: first ? "none" : `0.5px solid ${C.sep}` }}>
      <button style={s.metricRow} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={s.rowLabel}>{label}</div>
          {delta && <div style={s.rowSub}>{delta}</div>}
        </div>
        {faixa && (
          <span style={{ ...s.faixaTag, color: FAIXA_COR[faixa], background: `${FAIXA_COR[faixa]}1A` }}>
            {FAIXA_TXT[faixa]}
          </span>
        )}
        <span style={s.metricValue}>{value}</span>
        <span style={{ ...s.chev, fontSize: 18, transform: open ? "rotate(90deg)" : "none" }}>›</span>
      </button>
      {open && <p style={s.metricNota}>{nota}</p>}
    </div>
  );
}

const LegendItem = ({ color, label, value }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
    <span style={{ fontSize: 12.5, color: C.sec }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
  </span>
);

const Insight = ({ data, i }) => (
  <Card i={i} pad={16}>
    <div style={{ display: "flex", gap: 13 }}>
      <span style={{ ...s.iconBadge, background: data.c }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d={data.icon} />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.insightHead}>
          <span style={s.insightTitle}>{data.t}</span>
          <span style={{ ...s.insightTag, color: data.c }}>{data.tag}</span>
        </div>
        <div style={s.insightBody}>{data.d}</div>
      </div>
    </div>
  </Card>
);

const Line = ({ label, value, sub, first }) => (
  <div style={{ ...s.field, borderTop: first ? "none" : `0.5px solid ${C.sep}` }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={s.rowLabel}>{label}</div>
      {sub && <div style={s.rowSub}>{sub}</div>}
    </div>
    <span style={{ ...s.mono, textAlign: "right" }}>{value}</span>
  </div>
);

const FieldNum = ({ label, unit, value, onChange, first }) => (
  <div style={{ ...s.field, borderTop: first ? "none" : `0.5px solid ${C.sep}` }}>
    <span style={s.fieldLabel}>{label}</span>
    <input style={s.inputNum} type="number" inputMode="decimal" placeholder={unit}
      value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

function Segmented({ value, onChange, options }) {
  const idx = options.findIndex((o) => o.v === value);
  return (
    <div style={s.segmented}>
      <div style={{
        ...s.segPill, width: `calc(${100 / options.length}% - 4px)`,
        transform: `translateX(calc(${idx * 100}% + ${idx * 4}px))`,
      }} />
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{ ...s.seg, fontWeight: value === o.v ? 600 : 500 }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function TabBar({ tab, setTab, onPlus }) {
  const esq = [
    { id: "resumo", l: "Semana", d: "M3 12h4l2.5 6 3.5-12 2.5 6h5" },
    { id: "tendencias", l: "Tendências", d: "M4 19V9M9.5 19V5M15 19v-7M20.5 19v-4" },
  ];
  const dir = [
    { id: "analise", l: "Análise", d: "M4.5 17a7.5 7.5 0 1115 0M12 17l4-5" },
    { id: "historico", l: "Histórico", d: "M4 6h16M4 12h16M4 18h10" },
  ];
  const Btn = ({ i }) => {
    const on = tab === i.id;
    return (
      <button onClick={() => setTab(i.id)} style={s.tabBtn} aria-current={on}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke={on ? C.red : C.sec} strokeWidth={on ? 2.4 : 1.85} strokeLinecap="round" strokeLinejoin="round">
          <path d={i.d} />
        </svg>
        <span style={{ fontSize: 10, color: on ? C.red : C.sec, fontWeight: on ? 600 : 400, letterSpacing: "-0.2px" }}>
          {i.l}
        </span>
      </button>
    );
  };

  return (
    <nav style={s.tabbar}>
      {esq.map((i) => <Btn key={i.id} i={i} />)}
      <div style={s.tabBtn}>
        <button onClick={onPlus} style={s.fab} aria-label="Registrar treino">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff"
            strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      {dir.map((i) => <Btn key={i.id} i={i} />)}
    </nav>
  );
}

/* ================= estilos ================= */

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';

const s = {
  page: {
    background: "#DEDEE4", minHeight: "100dvh", display: "flex", justifyContent: "center",
    fontFamily: font, color: C.label,
  },
  phone: {
    width: "100%", maxWidth: 402, height: "100dvh", background: C.bg, position: "relative",
    overflow: "hidden", boxShadow: "0 0 80px rgba(0,0,0,0.13)",
  },
  scroll: { height: "100%", overflowY: "auto", padding: "0 16px", WebkitOverflowScrolling: "touch" },
  compactBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 46, zIndex: 15,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(242,242,247,0.82)", backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    borderBottom: `0.5px solid ${C.sep}`, transition: "opacity .25s ease",
  },
  largeTitle: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "22px 0 10px" },
  h1: { fontSize: 34, fontWeight: 700, letterSpacing: "-1.1px", margin: 0 },
  link: { color: C.blue, fontSize: 17, padding: "4px 0", letterSpacing: "-0.2px" },
  linkSm: { color: C.blue, fontSize: 15, fontWeight: 500 },
  section: {
    fontSize: 12.5, fontWeight: 600, color: C.sec, textTransform: "uppercase", letterSpacing: "0.3px",
    padding: "22px 4px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
  },
  sectionRight: { fontWeight: 500, textTransform: "none", fontSize: 12.5, letterSpacing: 0, flexShrink: 0 },
  card: {
    background: C.card, borderRadius: 18, marginBottom: 10, overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.045), 0 8px 20px -8px rgba(0,0,0,0.06)",
  },
  eyebrow: { fontSize: 12.5, fontWeight: 600, color: C.sec, letterSpacing: "0.1px" },
  big: { fontSize: 36, fontWeight: 700, letterSpacing: "-1.3px", fontVariantNumeric: "tabular-nums", lineHeight: 1 },
  unit: { fontSize: 14, color: C.sec, fontWeight: 500 },
  sub: { fontSize: 13, color: C.sec, marginTop: 5, lineHeight: 1.4 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  tile: {
    background: C.card, borderRadius: 18, padding: 15,
    boxShadow: "0 1px 2px rgba(0,0,0,0.045), 0 8px 20px -8px rgba(0,0,0,0.06)",
  },
  tileLabel: { fontSize: 12.5, fontWeight: 600, color: C.sec },
  row: { display: "flex", alignItems: "center", gap: 11, padding: "10px 0" },
  rowLabel: { fontSize: 15.5, letterSpacing: "-0.25px" },
  rowSub: { fontSize: 12.5, color: C.sec, marginTop: 2, lineHeight: 1.3 },
  rowValue: { fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" },

  /* faixa de dias */
  diaCol: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    padding: "6px 0 5px", borderRadius: 11, minWidth: 0, transition: "background .2s",
  },
  diaLetra: { fontSize: 11, letterSpacing: "0.2px" },
  diaNum: { fontSize: 13, fontWeight: 600, marginTop: 2, fontVariantNumeric: "tabular-nums", color: C.label },
  diaNumHoje: {
    background: C.red, color: "#fff", borderRadius: 999, width: 21, height: 21,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5,
  },
  diaBarra: {
    width: 15, borderRadius: 5, overflow: "hidden", display: "flex", flexDirection: "column",
    minHeight: 5, boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },
  diaBarraPlano: { width: 15, borderRadius: 5, border: "1.5px dashed", minHeight: 8 },
  diaVazio: { width: 5, height: 5, borderRadius: 999, background: C.ter },
  diaMin: { fontSize: 11, fontWeight: 600, marginTop: 6, fontVariantNumeric: "tabular-nums" },
  diaDetalhe: { marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${C.sep}`, animation: "fade .2s ease" },
  metaBarOuter: { height: 7, borderRadius: 4, background: C.fill, overflow: "hidden" },
  metaBarInner: {
    height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#17B84A,#5DE86F)",
    transition: "width .7s cubic-bezier(.16,.84,.28,1)",
  },
  planoBadge: {
    fontSize: 12, fontWeight: 600, color: C.blue, background: "rgba(0,122,255,0.1)",
    padding: "5px 10px", borderRadius: 8, flexShrink: 0,
  },

  zoneBadge: {
    width: 22, height: 22, borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  dot: { width: 11, height: 11, borderRadius: 3, flexShrink: 0 },
  dotSm: { width: 8, height: 8, borderRadius: 2.5, display: "inline-block", marginRight: 5 },
  legend: { fontSize: 11.5, color: C.sec, display: "flex", alignItems: "center", fontWeight: 500 },
  columnWrap: {
    width: 12, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column",
    background: C.fill, alignSelf: "stretch",
  },
  iconBadge: {
    width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  insightHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 3 },
  insightTitle: { fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.3px" },
  insightTag: { fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px", flexShrink: 0 },
  insightBody: { fontSize: 13.5, color: C.sec, lineHeight: 1.47 },
  foot: { fontSize: 12.5, color: C.sec, lineHeight: 1.5, marginTop: 12, marginBottom: 0 },
  field: { display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", background: C.card },
  fieldLabel: { fontSize: 15.5, flex: 1, letterSpacing: "-0.25px" },
  inputRight: { border: "none", fontSize: 15.5, textAlign: "right", color: C.sec },
  inputNum: { border: "none", fontSize: 17, textAlign: "right", width: 100, fontVariantNumeric: "tabular-nums", fontWeight: 500 },
  metricRow: { display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", width: "100%" },
  metricValue: { fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px", flexShrink: 0 },
  faixaTag: { fontSize: 11, fontWeight: 600, padding: "3px 7px", borderRadius: 6, flexShrink: 0 },
  metricNota: { fontSize: 12.5, color: C.sec, lineHeight: 1.5, margin: 0, padding: "0 16px 14px", animation: "fade .2s ease" },
  miniTag: { fontSize: 10.5, fontWeight: 600, padding: "3px 7px", borderRadius: 6 },
  chipBtn: {
    fontSize: 13, fontWeight: 600, color: C.blue, background: "rgba(0,122,255,0.1)",
    padding: "6px 12px", borderRadius: 9, flexShrink: 0,
  },
  preset: {
    fontSize: 13, fontWeight: 500, background: C.card, padding: "9px 13px", borderRadius: 11,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  toggle: { width: 41, height: 25, borderRadius: 999, padding: 2, display: "flex", transition: "background .25s", flexShrink: 0 },
  toggleKnob: {
    width: 21, height: 21, borderRadius: 999, background: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "transform .25s cubic-bezier(.16,.84,.28,1)",
  },
  zoneRow: { display: "flex", alignItems: "center", gap: 11, padding: "11px 0" },
  trackOuter: { height: 3, borderRadius: 2, background: C.fill, marginTop: 7, overflow: "hidden" },
  trackInner: { height: "100%", borderRadius: 2, transition: "width .35s cubic-bezier(.16,.84,.28,1)" },
  zoneInput: {
    width: 64, background: C.fill, border: "none", borderRadius: 10, padding: "10px 8px",
    fontSize: 17, textAlign: "center", fontVariantNumeric: "tabular-nums", fontWeight: 600,
  },
  totalBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${C.sep}`,
  },
  textarea: { width: "100%", border: "none", fontSize: 15.5, resize: "vertical", lineHeight: 1.45 },
  primary: {
    width: "100%", background: C.red, color: "#fff", borderRadius: 15, padding: 15,
    fontSize: 17, fontWeight: 600, marginTop: 14, letterSpacing: "-0.3px",
    boxShadow: "0 6px 18px -6px rgba(255,55,95,0.6)",
  },
  secondary: { width: "100%", background: C.fill, color: C.blue, borderRadius: 12, padding: 12, fontSize: 15, fontWeight: 500, marginTop: 10 },
  destructive: { width: "100%", background: "rgba(255,55,95,0.1)", color: C.red, borderRadius: 12, padding: 12, fontSize: 15, fontWeight: 500, marginTop: 12 },
  error: { background: "rgba(255,55,95,0.1)", color: C.red, borderRadius: 12, padding: "13px 15px", fontSize: 14, marginTop: 12 },
  sesRow: { display: "flex", alignItems: "center", gap: 8, padding: "13px 16px", width: "100%" },
  miniBar: { display: "flex", height: 5, borderRadius: 3, overflow: "hidden", background: C.fill, marginTop: 8, width: "100%" },
  chev: { color: C.ter, fontSize: 22, transition: "transform .25s cubic-bezier(.16,.84,.28,1)", lineHeight: 1, flexShrink: 0 },
  detail: { padding: "4px 16px 16px", background: "rgba(120,120,128,0.045)", animation: "fade .2s ease" },
  detailRow: { display: "flex", alignItems: "center", fontSize: 14, padding: "6px 0" },
  mono: { fontVariantNumeric: "tabular-nums", fontSize: 15.5, color: C.sec, fontWeight: 500 },
  segmented: {
    display: "flex", background: "rgba(120,120,128,0.12)", borderRadius: 10, padding: 2,
    marginBottom: 12, position: "relative",
  },
  segPill: {
    position: "absolute", top: 2, bottom: 2, left: 2, background: "#fff", borderRadius: 8,
    boxShadow: "0 3px 8px rgba(0,0,0,0.12)", transition: "transform .3s cubic-bezier(.16,.84,.28,1)",
  },
  seg: { flex: 1, borderRadius: 8, padding: "7px 0", fontSize: 13, position: "relative", zIndex: 1, letterSpacing: "-0.1px" },
  tabbar: {
    position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start",
    background: "rgba(249,249,251,0.88)", backdropFilter: "saturate(180%) blur(22px)",
    WebkitBackdropFilter: "saturate(180%) blur(22px)",
    borderTop: `0.5px solid ${C.sep}`, padding: "8px 0 24px", zIndex: 20,
  },
  tabBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 0 },
  fab: {
    width: 46, height: 46, borderRadius: 999, background: C.red, display: "flex",
    alignItems: "center", justifyContent: "center", marginTop: -8,
    boxShadow: "0 6px 16px -4px rgba(255,55,95,0.65)",
  },
  toast: {
    position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 45,
    background: "rgba(28,28,30,0.95)", color: "#fff", padding: "12px 20px", borderRadius: 24,
    fontSize: 14, maxWidth: 330, textAlign: "center", animation: "rise .25s ease",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  sheetWrap: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,0.34)", zIndex: 40,
    display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fade .25s ease",
  },
  sheet: {
    width: "100%", maxHeight: "94%", background: C.bg, borderRadius: "14px 14px 0 0",
    animation: "sheetIn .34s cubic-bezier(.16,.84,.28,1)", display: "flex", flexDirection: "column",
  },
  grabber: { width: 36, height: 5, borderRadius: 3, background: "rgba(60,60,67,0.28)", margin: "8px auto 0" },
  sheetHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px" },
  done: { color: C.blue, fontSize: 17, fontWeight: 600 },
};
