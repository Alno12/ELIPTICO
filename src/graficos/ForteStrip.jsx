import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";

/* Tira de dias: um traço alto por dia de Z4 ou Z5, um traço baixo por dia de
   treino fácil, nada nos dias parados.

   O assunto do desenho é o espaço vazio. Dois traços altos colados dizem que o
   estímulo forte se repetiu sem intervalo; espalhados, dizem que houve
   recuperação entre eles. Um número médio sozinho não mostra a diferença entre
   "a cada três dias" e "dois emendados e dez de nada". */
function ForteStrip({ serie }) {
  const CELL = 6,
    GAP = 2.6,
    ALTA = 30,
    BAIXA = 7,
    BASE = 34;
  const W = serie.length * (CELL + GAP) - GAP;
  const max = Math.max(1, ...serie.map((d) => d.forte));

  return (
    <svg
      viewBox={`0 0 ${W} ${BASE + 15}`}
      style={{ width: "100%", display: "block", marginTop: 14 }}
    >
      {serie.map((d, i) => {
        const x = i * (CELL + GAP);
        /* piso de 40% da altura: um dia de 4 min de Z4 ao lado de um de 20 não
           pode virar um traço quase rente ao chão e se confundir com dia fácil */
        const h = d.forte ? BAIXA + 2 + (ALTA - BAIXA - 2) * (0.4 + 0.6 * (d.forte / max)) : 0;
        if (d.forte)
          return (
            <rect
              key={d.date}
              x={x}
              y={BASE - Math.min(h, ALTA)}
              width={CELL}
              height={Math.min(h, ALTA)}
              rx="2.4"
              fill="url(#zg-z4)"
            />
          );
        return (
          <rect
            key={d.date}
            x={x}
            y={BASE - (d.treino ? BAIXA : 2.5)}
            width={CELL}
            height={d.treino ? BAIXA : 2.5}
            rx={d.treino ? 2.4 : 1.2}
            fill={d.treino ? "rgba(48,209,88,0.34)" : C.sep}
          />
        );
      })}
      {serie.map((d, i) =>
        i % 7 === 0 ? (
          <text
            key={d.date}
            /* o primeiro rótulo se ancora à esquerda: centrado, metade dele cai
               fora do viewBox e a data aparece cortada */
            x={i === 0 ? 0 : i * (CELL + GAP) + CELL / 2}
            y={BASE + 12}
            fontSize="9"
            fill={C.ter}
            textAnchor={i === 0 ? "start" : "middle"}
          >
            {dayjs(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </text>
        ) : null,
      )}
      <text x={W} y={BASE + 12} fontSize="9" fill={C.ter} textAnchor="end">
        hoje
      </text>
    </svg>
  );
}

export { ForteStrip };
