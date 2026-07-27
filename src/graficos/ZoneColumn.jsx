import { fmt } from "../lib/util.js";
import { ZONES, faixa } from "../lib/treino.js";
import { C, s } from "../estilos.js";

function ZoneColumn({ totals, grand, cfg }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={s.columnWrap}>
        {[...ZONES].reverse().map((z) => {
          const p = grand ? (totals[z.id] / grand) * 100 : 0;
          return p > 0 ? (
            <div key={z.id} style={{ height: `${p}%`, background: z.color, width: "100%" }} />
          ) : null;
        })}
      </div>
      <div style={{ flex: 1 }}>
        {ZONES.map((z, i) => {
          const m = totals[z.id];
          const p = grand ? (m / grand) * 100 : 0;
          return (
            <div key={z.id} style={{ ...s.row, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
              <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.rowLabel}>{z.name}</div>
                <div style={s.rowSub}>{faixa(cfg, i)} bpm</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={s.rowValue}>{fmt(p)}%</div>
                <div style={s.rowSub}>{fmt(m)} min</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ZoneColumn };
