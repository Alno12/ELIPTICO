import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";

function HrChart({ data }) {
  const H = 134,
    W = 312,
    pad = 28;
  const vals = data.map((d) => d.avgHr);
  const min = Math.min(...vals) - 5,
    max = Math.max(...vals) + 5;
  const x = (i) => pad + (i / Math.max(1, data.length - 1)) * W;
  const y = (v) => H - ((v - min) / (max - min || 1)) * H;
  const n = data.length,
    mx = (n - 1) / 2,
    my = vals.reduce((a, b) => a + b, 0) / n;
  let nume = 0,
    deno = 0;
  vals.forEach((v, i) => {
    nume += (i - mx) * (v - my);
    deno += (i - mx) ** 2;
  });
  const b = deno ? nume / deno : 0,
    a = my - b * mx;

  let line = `M${x(0)},${y(vals[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const x0 = x(i),
      y0 = y(vals[i]),
      x1 = x(i + 1),
      y1 = y(vals[i + 1]);
    const cx = (x0 + x1) / 2;
    line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 20}`}
      style={{ width: "100%", display: "block", marginTop: 14 }}
    >
      {[min + 4, (min + max) / 2, max - 4].map((v, i) => (
        <g key={i}>
          <line x1={pad} y1={y(v)} x2={W + pad} y2={y(v)} stroke={C.sep} strokeWidth="0.7" />
          <text x="0" y={y(v) + 3.5} fontSize="9.5" fill={C.ter}>
            {Math.round(v)}
          </text>
        </g>
      ))}
      <path d={`${line} L${x(n - 1)},${H} L${x(0)},${H} Z`} fill="url(#gradHr)" />
      <path
        d={`M${x(0)},${y(a)} L${x(n - 1)},${y(a + b * (n - 1))}`}
        stroke={C.sec}
        strokeWidth="1.4"
        strokeDasharray="5 4"
        fill="none"
      />
      <path
        d={line}
        fill="none"
        stroke={C.red}
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <circle
          key={d.id}
          cx={x(i)}
          cy={y(d.avgHr)}
          r="3.4"
          fill="#fff"
          stroke={C.red}
          strokeWidth="2"
        />
      ))}
      {[0, n - 1].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H + 15}
          fontSize="9.5"
          fill={C.sec}
          textAnchor={i ? "end" : "start"}
        >
          {dayjs(data[i].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ))}
    </svg>
  );
}

export { HrChart };
