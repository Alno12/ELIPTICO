import { clamp, mulberry32 } from "./util.js";
import { iso, dayjs, daysAgo, diffDias, mondayOf } from "./datas.js";

/* ================= zonas ================= */

const ZONES = [
  { id: "z1", label: "Zona 1", short: "1", name: "Recuperação", color: "#5AC8FA", light: "#8FDCFC", w: 1 },
  { id: "z2", label: "Zona 2", short: "2", name: "Base aeróbica", color: "#30D158", light: "#6BE889", w: 2 },
  { id: "z3", label: "Zona 3", short: "3", name: "Tempo", color: "#FFD60A", light: "#FFE566", w: 3 },
  { id: "z4", label: "Zona 4", short: "4", name: "Limiar", color: "#FF9F0A", light: "#FFBC55", w: 4 },
  { id: "z5", label: "Zona 5", short: "5", name: "Máximo", color: "#FF375F", light: "#FF7A96", w: 5 },
];

const trimp = (s) => ZONES.reduce((a, z) => a + (s.zones[z.id] || 0) * z.w, 0);
const totalZ = (z) => ZONES.reduce((a, k) => a + (z[k.id] || 0), 0);
const cargaZ = (z) => ZONES.reduce((a, k) => a + (z[k.id] || 0) * k.w, 0);

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

/* ================= faixas de bpm ================= */

function faixa(cfg, i) {
  const pc = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1]][i];
  const calc = (p) => (cfg.method === "hrr"
    ? Math.round(cfg.restHr + p * (cfg.maxHr - cfg.restHr))
    : Math.round(p * cfg.maxHr));
  return `${calc(pc[0])}–${calc(pc[1])}`;
}

export { ZONES, trimp, totalZ, cargaZ, PLANO, semanaDoPlano, faseDaSemana, treinoDoDia, proximoTreino, seed, faixa };
