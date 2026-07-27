import { clamp } from "../lib/util.js";
import { C } from "../estilos.js";

function RpeScatter({ pontos }) {
  const H = 130,
    W = 310,
    pad = 26;
  const maxX = Math.max(...pontos.map((p) => p.x)) * 1.08;
  const x = (v) => pad + (v / maxX) * W;
  const y = (v) => H - ((v - 1) / 9) * H;
  const xs = pontos.map((p) => p.x),
    ys = pontos.map((p) => p.y);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den ? num / den : 0,
    a = my - b * mx;

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 22}`}
      style={{ width: "100%", display: "block", marginTop: 14 }}
    >
      {[2, 4, 6, 8, 10].map((v) => (
        <g key={v}>
          <line x1={pad} y1={y(v)} x2={W + pad} y2={y(v)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(v) + 3.5} fontSize="9.5" fill={C.ter}>
            {v}
          </text>
        </g>
      ))}
      <path
        d={`M${x(0)},${clamp(y(a), 0, H)} L${x(maxX)},${clamp(y(a + b * maxX), 0, H)}`}
        stroke={C.purple}
        strokeWidth="1.6"
        strokeDasharray="5 4"
        fill="none"
      />
      {pontos.map((p, i) => (
        <circle key={i} cx={x(p.x)} cy={y(p.y)} r="3.6" fill={C.purple} opacity="0.55" />
      ))}
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      <text x={pad} y={H + 15} fontSize="9.5" fill={C.sec}>
        0 TRIMP
      </text>
      <text x={W + pad} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="end">
        {Math.round(maxX)} TRIMP
      </text>
    </svg>
  );
}

export { RpeScatter };
