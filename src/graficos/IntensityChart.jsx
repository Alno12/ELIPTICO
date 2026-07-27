import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";
import { topRounded } from "./topRounded.js";

function IntensityChart({ weeks }) {
  const H = 120,
    W = 326,
    pad = 26;
  const max = Math.max(30, ...weeks.map((w) => w.minutos)) * 1.1;
  const bw = W / weeks.length;
  const bar = bw * 0.56;

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
        const x = pad + i * bw + (bw - bar) / 2;
        const h = (w.minutos / max) * H,
          hi = (w.z3mais / max) * H;
        return (
          <g key={w.start}>
            <path d={topRounded(x, H - h, bar, h, 3.5)} fill="#E3E3E8" />
            {hi > 0 && <path d={topRounded(x, H - hi, bar, hi, 3.5)} fill="url(#gradIntensa)" />}
          </g>
        );
      })}
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

export { IntensityChart };
