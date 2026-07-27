import { ZONES, faixa } from "../lib/treino.js";
import { C, s } from "../estilos.js";
import { Sheet, SectionTitle, Card } from "../ui/estrutura.jsx";
import { FieldNum } from "../ui/primitivos.jsx";

function Ajustes({ cfg, onChange, onClose }) {
  const set = (k, v) => onChange({ ...cfg, [k]: Number(v) || 0 });
  return (
    <Sheet
      onClose={onClose}
      titulo="Ajustes"
      direita={
        <button style={s.done} onClick={onClose}>
          OK
        </button>
      }
    >
      <SectionTitle>Frequência cardíaca</SectionTitle>
      <Card pad={0}>
        <FieldNum
          first
          label="FC máxima"
          unit="bpm"
          value={cfg.maxHr}
          onChange={(v) => set("maxHr", v)}
        />
        <FieldNum
          label="FC de repouso"
          unit="bpm"
          value={cfg.restHr}
          onChange={(v) => set("restHr", v)}
        />
        <FieldNum
          label="VO₂ máx"
          unit="ml/kg/min"
          value={cfg.vo2max}
          onChange={(v) => onChange({ ...cfg, vo2max: Number(v) || 0 })}
        />
        <FieldNum
          label="Meta semanal"
          unit="min equiv."
          value={cfg.weeklyGoal}
          onChange={(v) => set("weeklyGoal", v)}
        />
      </Card>

      <SectionTitle>Cálculo das zonas</SectionTitle>
      <Card pad={0}>
        {[
          {
            v: "hrr",
            t: "Frequência de reserva",
            d: "Método Karvonen, usa também a FC de repouso",
          },
          { v: "max", t: "Percentual da FC máxima", d: "Divisão simples por % da FC máxima" },
        ].map((o, i) => (
          <button
            key={o.v}
            style={{
              ...s.field,
              borderTop: i ? `0.5px solid ${C.sep}` : "none",
              width: "100%",
              textAlign: "left",
            }}
            onClick={() => onChange({ ...cfg, method: o.v })}
          >
            <div style={{ flex: 1 }}>
              <div style={s.rowLabel}>{o.t}</div>
              <div style={s.rowSub}>{o.d}</div>
            </div>
            {cfg.method === o.v && (
              <span style={{ color: C.blue, fontSize: 18, fontWeight: 700 }}>✓</span>
            )}
          </button>
        ))}
      </Card>

      <SectionTitle>Suas zonas</SectionTitle>
      <Card pad={0}>
        {ZONES.map((z, i) => (
          <div key={z.id} style={{ ...s.field, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
            <div style={{ flex: 1 }}>
              <div style={s.rowLabel}>{z.label}</div>
              <div style={s.rowSub}>{z.name}</div>
            </div>
            <span style={s.mono}>{faixa(cfg, i)} bpm</span>
          </div>
        ))}
      </Card>

      <p style={s.foot}>
        Compare as faixas de bpm com as zonas que aparecem no seu Apple Watch e ajuste a FC máxima
        até baterem. O relógio recalcula as faixas conforme seus treinos, então elas mudam de tempos
        em tempos.
      </p>
    </Sheet>
  );
}

/* ================= gráficos ================= */

export { Ajustes };
