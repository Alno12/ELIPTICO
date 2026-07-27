import { useState } from "react";
import { fmt } from "../lib/util.js";
import { iso, dayjs, daysAgo, mondayOf, longDate } from "../lib/datas.js";
import { trimp, equiv } from "../lib/treino.js";
import { C, s } from "../estilos.js";

function Heatmap({ sessions }) {
  const [sel, setSel] = useState(null);
  const SEMANAS = 15,
    CELL = 15,
    GAP = 4.5;
  const mapa = {};
  sessions.forEach((x) => {
    const d = (mapa[x.date] ||= { carga: 0, minutos: 0, equiv: 0 });
    d.carga += trimp(x);
    d.minutos += x.total;
    d.equiv += equiv(x);
  });
  const maxCarga = Math.max(1, ...Object.values(mapa).map((d) => d.carga));
  const inicio = mondayOf(daysAgo((SEMANAS - 1) * 7));
  const hoje = iso(new Date());
  const cols = [];
  for (let w = 0; w < SEMANAS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(inicio);
      dt.setDate(dt.getDate() + w * 7 + d);
      col.push(iso(dt));
    }
    cols.push(col);
  }
  const cor = (carga) => {
    if (!carga) return C.fill;
    const o = 0.28 + 0.72 * Math.min(1, (carga / maxCarga) * 1.15);
    return `rgba(48,209,88,${o.toFixed(2)})`;
  };
  const W = SEMANAS * (CELL + GAP) + 22,
    H = 7 * (CELL + GAP) + 16;
  const noPeriodo = Object.entries(mapa)
    .filter(([d]) => d >= iso(inicio))
    .map(([, v]) => v);
  const soma = (k) => noPeriodo.reduce((a, v) => a + v[k], 0);
  const mostrado = sel
    ? mapa[sel] || { carga: 0, minutos: 0, equiv: 0 }
    : { carga: soma("carga"), minutos: soma("minutos"), equiv: soma("equiv") };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={s.eyebrow}>{sel ? longDate(sel) : "Últimas 15 semanas"}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 2 }}>
            <span style={{ ...s.big, fontSize: 26 }}>{fmt(mostrado.carga)}</span>
            <span style={s.unit}>TRIMP</span>
          </div>
          <div style={{ ...s.rowSub, marginTop: 3 }}>
            {fmt(mostrado.minutos)} min · {fmt(mostrado.equiv)} min equivalentes
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ ...s.rowSub, marginRight: 2 }}>menos</span>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <span
              key={t}
              style={{ width: 10, height: 10, borderRadius: 3, background: cor(t * maxCarga) }}
            />
          ))}
          <span style={{ ...s.rowSub, marginLeft: 2 }}>mais</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", touchAction: "pan-y" }}
      >
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <text key={i} x="0" y={i * (CELL + GAP) + CELL / 2 + 4.5} fontSize="9" fill={C.ter}>
            {d}
          </text>
        ))}
        {cols.map((col, w) =>
          col.map((date, d) => {
            const futuro = date > hoje,
              on = sel === date;
            return (
              <rect
                key={date}
                x={22 + w * (CELL + GAP)}
                y={d * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx="4.2"
                fill={futuro ? "transparent" : cor(mapa[date]?.carga || 0)}
                stroke={on ? C.label : "transparent"}
                strokeWidth="1.6"
                onClick={() => setSel(on || futuro ? null : date)}
                style={{ cursor: futuro ? "default" : "pointer" }}
              />
            );
          }),
        )}
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

export { Heatmap };
