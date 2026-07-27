import { clamp } from "../lib/util.js";
import { useRef } from "react";
import { dayjs } from "../lib/datas.js";
import { ZONES } from "../lib/treino.js";
import { C } from "../estilos.js";
import { topRounded } from "./topRounded.js";

function ZoneBars({ dias, sel, setSel }) {
  const ref = useRef(null);
  const H = 158,
    W = 336,
    pad = 22,
    VB = W + pad;
  const max = Math.max(30, ...dias.map((d) => d.total));
  const bw = W / dias.length;
  const bar = Math.max(2.5, Math.min(17, bw * 0.66));
  const step = dias.length <= 7 ? 1 : dias.length <= 30 ? 7 : 21;

  const locate = (clientX) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return null;
    return clamp(Math.floor((((clientX - r.left) / r.width) * VB - pad) / bw), 0, dias.length - 1);
  };
  const move = (e) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const i = locate(e.clientX);
    if (i != null) setSel(i);
  };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB} ${H + 24}`}
      style={{
        width: "100%",
        display: "block",
        marginTop: 14,
        touchAction: "pan-y",
        cursor: "crosshair",
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const i = locate(e.clientX);
        if (i != null) setSel(i);
      }}
      onPointerMove={move}
      onPointerUp={(e) => e.currentTarget.releasePointerCapture?.(e.pointerId)}
    >
      {[0, Math.round(max / 2), max].map((t) => {
        const y = H - (t / max) * H;
        return (
          <g key={t}>
            <line x1={pad} y1={y} x2={VB} y2={y} stroke={C.sep} strokeWidth="0.7" />
            <text x="0" y={y + 3.5} fontSize="9.5" fill={C.ter}>
              {t}
            </text>
          </g>
        );
      })}
      {sel != null && (
        <line
          x1={pad + sel * bw + bw / 2}
          y1={-2}
          x2={pad + sel * bw + bw / 2}
          y2={H}
          stroke={C.ter}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      {dias.map((d, i) => {
        const x = pad + i * bw + (bw - bar) / 2;
        const on = sel === i;
        const segs = ZONES.filter((z) => d.zones[z.id] > 0);
        let y = H;
        return (
          <g key={d.date} opacity={sel == null || on ? 1 : 0.28}>
            {segs.map((z, k) => {
              const h = (d.zones[z.id] / max) * H;
              y -= h;
              return k === segs.length - 1 ? (
                <path
                  key={z.id}
                  d={topRounded(x, y, bar, h, Math.min(bar / 2.2, 3))}
                  fill={`url(#zg-${z.id})`}
                />
              ) : (
                <rect key={z.id} x={x} y={y} width={bar} height={h} fill={`url(#zg-${z.id})`} />
              );
            })}
          </g>
        );
      })}
      <line x1={pad} y1={H} x2={VB} y2={H} stroke={C.sep} strokeWidth="0.7" />
      {dias.map((d, i) =>
        i % step === 0 ? (
          <text
            key={d.date}
            x={pad + i * bw + bw / 2}
            y={H + 16}
            fontSize="9.5"
            fill={sel === i ? C.label : C.sec}
            fontWeight={sel === i ? 600 : 400}
            textAnchor="middle"
          >
            {dayjs(d.date).toLocaleDateString(
              "pt-BR",
              dias.length <= 7 ? { weekday: "short" } : { day: "2-digit", month: "2-digit" },
            )}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export { ZoneBars };
