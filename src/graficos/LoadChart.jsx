import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";
import { topRounded } from "./topRounded.js";

function LoadChart({ weeks }) {
  const H = 146,
    W = 326,
    pad = 26;
  const max = Math.max(50, ...weeks.map((w) => Math.max(w.carga, w.media4))) * 1.14;
  const bw = W / weeks.length;
  const bar = bw * 0.56;
  const path = weeks
    .map((w, i) => `${i ? "L" : "M"}${pad + i * bw + bw / 2},${H - (w.media4 / max) * H}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 22}`}
      style={{ width: "100%", display: "block", marginTop: 14 }}
    >
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line
            x1={pad}
            y1={H - (t / max) * H}
            x2={W + pad}
            y2={H - (t / max) * H}
            stroke={C.sep}
            strokeWidth="0.7"
          />
          <text x="0" y={H - (t / max) * H + 3.5} fontSize="9.5" fill={C.ter}>
            {Math.round(t)}
          </text>
        </g>
      ))}
      {weeks.map((w, i) => {
        const h = (w.carga / max) * H;
        const alta = w.media4 > 0 && w.carga > w.media4 * 1.3;
        return (
          <path
            key={w.start}
            d={topRounded(pad + i * bw + (bw - bar) / 2, H - h, bar, h, 3.5)}
            fill={alta ? "url(#gradAlerta)" : "url(#gradNeutro)"}
          />
        );
      })}
      <path
        d={path}
        fill="none"
        stroke={C.blue}
        strokeWidth="2"
        strokeDasharray="4 3.5"
        strokeLinecap="round"
      />
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      {weeks.map((w, i) =>
        i % 4 === 0 ? (
          <text
            key={w.start}
            x={pad + i * bw + bw / 2}
            y={H + 15}
            fontSize="9.5"
            fill={C.sec}
            textAnchor="middle"
          >
            {dayjs(w.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export { LoadChart };
