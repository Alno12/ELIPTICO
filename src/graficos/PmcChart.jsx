import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";

function PmcChart({ pmc }) {
  const dados = pmc.slice(-98);
  const H = 128,
    HB = 34,
    W = 322,
    pad = 26;
  const max = Math.max(10, ...dados.map((d) => Math.max(d.ctl, d.atl))) * 1.12;
  const x = (i) => pad + (i / Math.max(1, dados.length - 1)) * W;
  const y = (v) => H - (v / max) * H;
  const maxT = Math.max(8, ...dados.map((d) => Math.abs(d.tsb)));
  const linha = (key) => dados.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  const bw = W / dados.length;

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + HB + 26}`}
      style={{ width: "100%", display: "block", marginTop: 14 }}
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
        d={`${linha("ctl")} L${x(dados.length - 1)},${H} L${x(0)},${H} Z`}
        fill="url(#gradCtl)"
      />
      <path d={linha("ctl")} fill="none" stroke={C.blue} strokeWidth="2.4" strokeLinejoin="round" />
      <path
        d={linha("atl")}
        fill="none"
        stroke={C.orange}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <line x1={pad} y1={H} x2={W + pad} y2={H} stroke={C.sep} strokeWidth="0.7" />
      <text x="0" y={H + HB / 2 + 3} fontSize="8.5" fill={C.ter}>
        forma
      </text>
      <line
        x1={pad}
        y1={H + 12 + HB / 2}
        x2={W + pad}
        y2={H + 12 + HB / 2}
        stroke={C.sep}
        strokeWidth="0.7"
      />
      {dados.map((d, i) => {
        const h = (Math.abs(d.tsb) / maxT) * (HB / 2);
        const zero = H + 12 + HB / 2;
        return (
          <rect
            key={d.date}
            x={pad + i * bw}
            width={Math.max(bw - 0.4, 0.8)}
            y={d.tsb >= 0 ? zero - h : zero}
            height={h}
            fill={d.tsb >= 0 ? C.green : d.tsb < -20 ? C.red : C.orange}
            opacity="0.65"
          />
        );
      })}
      {[0, Math.floor(dados.length / 2), dados.length - 1].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H + HB + 24}
          fontSize="9.5"
          fill={C.sec}
          textAnchor={i === 0 ? "start" : i === dados.length - 1 ? "end" : "middle"}
        >
          {dayjs(dados[i].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ))}
    </svg>
  );
}

export { PmcChart };
