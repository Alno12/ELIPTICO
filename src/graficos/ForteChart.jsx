import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";
import { topRounded } from "./topRounded.js";

/* Z4 e Z5 empilhados, semana a semana.

   A escala é só do trabalho forte. No gráfico de volume total ele vira uma tira
   de poucos pixels na base das barras — dá para ver que existe, não dá para ver
   se cresceu. Aqui uma semana de 12 minutos e outra de 20 ficam visivelmente
   diferentes, que é a única razão de o card existir. */
function ForteChart({ weeks }) {
  const H = 132,
    W = 326,
    pad = 26;
  const max = Math.max(10, ...weeks.map((w) => Math.max(w.forte, w.forte4))) * 1.14;
  const bw = W / weeks.length;
  const bar = bw * 0.56;
  const linha = weeks
    .map((w, i) => `${i ? "L" : "M"}${pad + i * bw + bw / 2},${H - (w.forte4 / max) * H}`)
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
        const x = pad + i * bw + (bw - bar) / 2;
        const h = (w.forte / max) * H;
        const h5 = (w.zones.z5 / max) * H;
        return (
          <g key={w.start}>
            {/* a pilha inteira em Z4 e, por cima dela, a fatia de Z5: assim o
                topo fica arredondado tenha ou não havido Z5 na semana */}
            {h > 0 && <path d={topRounded(x, H - h, bar, h, 3.5)} fill="url(#zg-z4)" />}
            {h5 > 0 && <path d={topRounded(x, H - h, bar, h5, 3.5)} fill="url(#zg-z5)" />}
          </g>
        );
      })}
      <path
        d={linha}
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

export { ForteChart };
