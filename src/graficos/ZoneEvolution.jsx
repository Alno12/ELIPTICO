import { dayjs } from "../lib/datas.js";
import { ZONES } from "../lib/treino.js";
import { C, s } from "../estilos.js";

function ZoneEvolution({ weeks }) {
  const H = 124,
    W = 326,
    pad = 8;
  const dados = weeks.slice(-12).filter((w) => w.minutos > 0);
  if (dados.length < 2)
    return <p style={s.foot}>Poucas semanas com registro para montar a evolução.</p>;
  const bw = W / dados.length;

  return (
    <svg
      viewBox={`0 0 ${W + pad} ${H + 20}`}
      style={{ width: "100%", display: "block", marginTop: 12 }}
    >
      {dados.map((w, i) => {
        let y = H;
        const bar = bw * 0.78;
        const x = pad + i * bw + (bw - bar) / 2;
        return (
          <g key={w.start}>
            {ZONES.map((z) => {
              const p = w.zones[z.id] / w.minutos;
              if (!p) return null;
              const h = p * H;
              y -= h;
              return <rect key={z.id} x={x} y={y} width={bar} height={h} fill={z.color} rx="1" />;
            })}
          </g>
        );
      })}
      {dados.map((w, i) =>
        i % 3 === 0 ? (
          <text
            key={w.start}
            x={pad + i * bw + bw / 2}
            y={H + 15}
            fontSize="9"
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

export { ZoneEvolution };
