import { C } from "../estilos.js";

/* A dose de 7 dias ao longo dos últimos 30, contra a linha da meta.

   A área abaixo da linha da meta fica no cinza neutro e a acima no verde: o que
   importa não é o valor de cada dia, é quanto tempo a curva passou acima do
   traço. Por isso não há eixo vertical rotulado — o único número de referência
   é a própria meta. */
function DoseChart({ pontos, meta }) {
  const H = 104,
    W = 320,
    pad = 8;
  const max = Math.max(meta, ...pontos.map((p) => p.equiv)) * 1.12 || 1;
  const x = (i) => pad + (i / (pontos.length - 1)) * (W - pad);
  const y = (v) => H - 6 - (v / max) * (H - 20);
  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.equiv).toFixed(1)}`);
  const ultimo = pontos[pontos.length - 1];
  const bateu = ultimo.equiv >= meta;

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 18}`}
      style={{ width: "100%", display: "block", marginTop: 12 }}
      role="img"
      aria-label={`Dose dos últimos 7 dias ao longo de ${pontos.length} dias, hoje em ${Math.round(ultimo.equiv)} minutos equivalentes, meta de ${meta}`}
    >
      <path
        d={`${linha.join(" ")} L${x(pontos.length - 1)},${H - 6} L${x(0)},${H - 6} Z`}
        fill={bateu ? "url(#gradAcum)" : C.fill}
      />
      <line
        x1={pad}
        y1={y(meta)}
        x2={W}
        y2={y(meta)}
        stroke={C.red}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <path
        d={linha.join(" ")}
        fill="none"
        stroke={bateu ? C.green : C.orange}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(pontos.length - 1)}
        cy={y(ultimo.equiv)}
        r="4.2"
        fill="#fff"
        stroke={bateu ? C.green : C.orange}
        strokeWidth="2.4"
      />
      {/* desenhado por último, e sobre uma base opaca: a curva cruza a linha da
          meta com frequência, e é justamente nos períodos em que ela foi batida
          que o rótulo ficaria ilegível */}
      <rect
        x={W - 47}
        y={y(meta) - 15}
        width={47}
        height={13}
        rx={3}
        fill={C.card}
        opacity="0.94"
      />
      <text x={W - 2} y={y(meta) - 5} fontSize="9.5" fill={C.red} textAnchor="end">
        meta {meta}
      </text>
      <text x={pad} y={H + 13} fontSize="9.5" fill={C.ter}>
        {pontos.length} dias atrás
      </text>
      <text x={W} y={H + 13} fontSize="9.5" fill={C.ter} textAnchor="end">
        hoje
      </text>
    </svg>
  );
}

export { DoseChart };
