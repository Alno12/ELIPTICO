import { C } from "../estilos.js";

function CumulativeChart({ atual, anterior }) {
  const H = 120,
    W = 320,
    pad = 26;
  const max = Math.max(...atual, ...anterior, 10) * 1.1;
  const x = (i) => pad + (i / 27) * W;
  const y = (v) => H - (v / max) * H;
  const linha = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 20}`}
      style={{ width: "100%", display: "block", marginTop: 12 }}
    >
      {[0, max / 2, max].map((t, i) => (
        <g key={i}>
          <line x1={pad} y1={y(t)} x2={W + pad} y2={y(t)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(t) + 3.5} fontSize="9.5" fill={C.ter}>
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path
        d={linha(anterior)}
        fill="none"
        stroke={C.ter}
        strokeWidth="1.8"
        strokeDasharray="4 3"
      />
      <path d={`${linha(atual)} L${x(27)},${H} L${x(0)},${H} Z`} fill="url(#gradAcum)" />
      <path
        d={linha(atual)}
        fill="none"
        stroke={C.green}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx={x(27)} cy={y(atual[27])} r="3.6" fill="#fff" stroke={C.green} strokeWidth="2.2" />
      <text x={pad} y={H + 15} fontSize="9.5" fill={C.sec}>
        28 dias atrás
      </text>
      <text x={W + pad} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="end">
        hoje
      </text>
    </svg>
  );
}

export { CumulativeChart };
