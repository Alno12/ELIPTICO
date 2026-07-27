import { C } from "../estilos.js";

function ProjChart({ atual, cenarios }) {
  const H = 104,
    W = 316,
    pad = 26;
  const max = Math.max(atual, ...cenarios.map((c) => c.v)) * 1.15;
  const x = (t) => pad + (t / 28) * W;
  const y = (v) => H - (v / max) * H;

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
      {cenarios.map((c) => (
        <g key={c.l}>
          <path
            d={`M${x(0)},${y(atual)} Q${x(14)},${y(atual + (c.v - atual) * 0.62)} ${x(28)},${y(c.v)}`}
            fill="none"
            stroke={c.c}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx={x(28)} cy={y(c.v)} r="3.4" fill="#fff" stroke={c.c} strokeWidth="2.2" />
        </g>
      ))}
      <circle cx={x(0)} cy={y(atual)} r="3.6" fill={C.label} />
      <text x={pad} y={H + 15} fontSize="9.5" fill={C.sec}>
        hoje
      </text>
      <text x={W + pad} y={H + 15} fontSize="9.5" fill={C.sec} textAnchor="end">
        em 4 semanas
      </text>
    </svg>
  );
}

export { ProjChart };
