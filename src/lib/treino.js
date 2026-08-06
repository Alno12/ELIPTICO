import { clamp, mulberry32 } from "./util.js";
import { iso, daysAgo } from "./datas.js";

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

/* Minutos equivalentes: Z1 não conta, Z2 e Z3 valem 1×, Z4 e Z5 valem 2×.
   É a equivalência entre atividade moderada e vigorosa que sustenta a
   recomendação de 150 min semanais — 1 min vigoroso conta como 2 moderados. */
const PESO_EQUIV = { z1: 0, z2: 1, z3: 1, z4: 2, z5: 2 };
const equivZ = (z) => ZONES.reduce((a, k) => a + (z[k.id] || 0) * PESO_EQUIV[k.id], 0);
const equiv = (s) => equivZ(s.zones);

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

export { ZONES, PESO_EQUIV, trimp, totalZ, cargaZ, equiv, equivZ, seed, faixa };
