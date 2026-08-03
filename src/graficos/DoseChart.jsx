import { useRef, useId } from "react";
import { clamp } from "../lib/util.js";
import { dayjs } from "../lib/datas.js";
import { C } from "../estilos.js";

/* A dose de 7 dias ao longo dos últimos 30 dias, contra a linha da meta.

   Os dias que bateram a meta ficam verdes, em faixas de cima a baixo. É o que
   torna visível a pergunta que o card faz — não quanto você fez num dia, e sim
   quanto tempo passou acima da recomendação. A fração verde da largura é o mesmo
   que o "16 de 30" escrito ao pé do card.

   Arrastar o dedo percorre os dias, no mesmo gesto usado pelo gráfico de zonas
   na aba Tendências. */
function DoseChart({ pontos, meta, sel, setSel }) {
  const ref = useRef(null);
  const id = useId();
  const H = 112,
    W = 320,
    pad = 8,
    VB = W + pad;
  const max = Math.max(meta, ...pontos.map((p) => p.equiv)) * 1.14 || 1;
  const x = (i) => pad + (i / (pontos.length - 1)) * (W - pad);
  const y = (v) => H - 8 - (v / max) * (H - 22);
  const passo = (W - pad) / (pontos.length - 1);
  const traco = pontos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.equiv).toFixed(1)}`);
  const area = `${traco.join(" ")} L${x(pontos.length - 1)},${H - 8} L${x(0)},${H - 8} Z`;

  const atual = sel != null ? pontos[sel] : pontos[pontos.length - 1];
  const iAtual = sel != null ? sel : pontos.length - 1;
  const bateu = atual.equiv >= meta;
  const cor = bateu ? C.green : C.orange;

  /* mesma mecânica do ZoneBars: converte o toque em índice de dia */
  const achar = (clientX) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return null;
    const emVB = ((clientX - r.left) / r.width) * VB;
    return clamp(Math.round(((emVB - pad) / (W - pad)) * (pontos.length - 1)), 0, pontos.length - 1);
  };
  const mover = (e) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const i = achar(e.clientX);
    if (i != null) setSel(i);
  };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB} ${H + 16}`}
      style={{
        width: "100%",
        display: "block",
        marginTop: 10,
        touchAction: "pan-y",
        cursor: "crosshair",
      }}
      role="img"
      aria-label={`Dose dos últimos 7 dias ao longo de ${pontos.length} dias. Hoje em ${Math.round(pontos[pontos.length - 1].equiv)} minutos equivalentes, meta de ${meta}.`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const i = achar(e.clientX);
        if (i != null) setSel(i);
      }}
      onPointerMove={mover}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        setSel(null);
      }}
      onPointerCancel={() => setSel(null)}
      onPointerLeave={() => setSel(null)}
    >
      <defs>
        {/* Recorte por faixas verticais, e não pela altura da meta.

           Cortar na horizontal pintaria só o excedente acima da linha, que é um
           filete de poucos pixels e não se vê. Em faixas, o dia que bateu a meta
           fica verde de cima a baixo — e a fração verde da largura do gráfico é,
           literalmente, o "16 de 30" escrito ao pé do card. */}
        <clipPath id={`${id}-bateu`}>
          {pontos.map((p, i) =>
            p.equiv >= meta ? (
              <rect
                key={p.date}
                x={x(i) - passo / 2}
                y="0"
                width={passo}
                height={H}
              />
            ) : null,
          )}
        </clipPath>
      </defs>

      <path d={area} fill={C.fill} />
      <path d={area} fill="rgba(48,209,88,0.30)" clipPath={`url(#${id}-bateu)`} />

      <line
        x1={pad}
        y1={y(meta)}
        x2={W}
        y2={y(meta)}
        stroke={C.red}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />

      {/* referência de tempo: uma marca por semana */}
      {pontos.map((p, i) =>
        i % 7 === 0 && i > 0 ? (
          <line
            key={p.date}
            x1={x(i)}
            y1={H - 8}
            x2={x(i)}
            y2={H - 4}
            stroke={C.ter}
            strokeWidth="1"
          />
        ) : null,
      )}

      <path
        d={traco.join(" ")}
        fill="none"
        stroke={C.orange}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* a linha acompanha as mesmas faixas, para não destoar da área */}
      <path
        d={traco.join(" ")}
        fill="none"
        stroke={C.green}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        clipPath={`url(#${id}-bateu)`}
      />

      {sel != null && (
        <line
          x1={x(sel)}
          y1={0}
          x2={x(sel)}
          y2={H - 8}
          stroke={C.ter}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      {/* Sem rótulo escrito na linha da meta.

         Ele ficava no canto direito, encostado no ponto de hoje, e tapava
         justamente o marcador do dia — que é o que o dedo está procurando. Não
         faz falta: o cabeçalho do card, duas linhas acima, já diz "de 150 min
         equivalentes", então a tracejada vermelha não precisa se apresentar. */}
      <circle cx={x(iAtual)} cy={y(atual.equiv)} r="4.4" fill="#fff" stroke={cor} strokeWidth="2.6" />

      <text x={pad} y={H + 11} fontSize="9.5" fill={C.ter}>
        {dayjs(pontos[0].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
      </text>
      <text x={W} y={H + 11} fontSize="9.5" fill={C.ter} textAnchor="end">
        hoje
      </text>
    </svg>
  );
}

export { DoseChart };
