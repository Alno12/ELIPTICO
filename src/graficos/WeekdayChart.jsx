import { DIAS_CURTO } from "../lib/datas.js";
import { C } from "../estilos.js";
import { topRounded } from "./topRounded.js";

function WeekdayChart({ perfil }) {
  const H = 104,
    W = 320,
    pad = 24;
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const max = Math.max(5, ...perfil.map((p) => p.media)) * 1.15;
  const bw = W / 7;
  const bar = bw * 0.52;

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 22}`}
      style={{ width: "100%", display: "block", marginTop: 12 }}
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
      {ordem.map((wd, i) => {
        const p = perfil[wd];
        const h = (p.media / max) * H;
        return (
          <g key={wd}>
            <path
              d={topRounded(pad + i * bw + (bw - bar) / 2, H - h, bar, h, 3.5)}
              fill="url(#gradDia)"
            />
            <text
              x={pad + i * bw + bw / 2}
              y={H + 15}
              fontSize="10"
              fill={C.sec}
              textAnchor="middle"
            >
              {DIAS_CURTO[wd]}
            </text>
          </g>
        );
      })}
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
    </svg>
  );
}

export { WeekdayChart };
