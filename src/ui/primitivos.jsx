import { useState } from "react";
import { fmt } from "../lib/util.js";
import { Card } from "./estrutura.jsx";
import { C, s, FAIXA_COR, FAIXA_TXT } from "../estilos.js";

/* Peças pequenas de exibição, sem estado e sem conhecimento do domínio:
   recebem valor pronto e desenham. */

function Tile({ label, value, unit, delta, suffix = "", comparado = "anterior", color, i }) {
  return (
    <div className="card" style={{ ...s.tile, animationDelay: `${i * 0.035}s` }}>
      <div style={s.tileLabel}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 3 }}>
        <span style={{ ...s.big, fontSize: 31, color }}>{value}</span>
        <span style={{ ...s.unit, fontSize: 13 }}>{unit}</span>
      </div>
      {delta != null && (
        <div style={{ ...s.rowSub, marginTop: 5, color: delta > 0 ? C.green : C.sec }}>
          {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {fmt(Math.abs(delta))}
          {suffix} vs. {comparado}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, nota, faixa, delta, first }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: first ? "none" : `0.5px solid ${C.sep}` }}>
      <button style={s.metricRow} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={s.rowLabel}>{label}</div>
          {delta && <div style={s.rowSub}>{delta}</div>}
        </div>
        {faixa && (
          <span
            style={{ ...s.faixaTag, color: FAIXA_COR[faixa], background: `${FAIXA_COR[faixa]}1A` }}
          >
            {FAIXA_TXT[faixa]}
          </span>
        )}
        <span style={s.metricValue}>{value}</span>
        <span style={{ ...s.chev, fontSize: 18, transform: open ? "rotate(90deg)" : "none" }}>
          ›
        </span>
      </button>
      {open && <p style={s.metricNota}>{nota}</p>}
    </div>
  );
}

const LegendItem = ({ color, label, value }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
    <span style={{ fontSize: 12.5, color: C.sec }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
      {value}
    </span>
  </span>
);

const Insight = ({ data, i }) => (
  <Card i={i} pad={16}>
    <div style={{ display: "flex", gap: 13 }}>
      <span style={{ ...s.iconBadge, background: data.c }}>
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={data.icon} />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.insightHead}>
          <span style={s.insightTitle}>{data.t}</span>
          <span style={{ ...s.insightTag, color: data.c }}>{data.tag}</span>
        </div>
        <div style={s.insightBody}>{data.d}</div>
      </div>
    </div>
  </Card>
);

const Line = ({ label, value, sub, first }) => (
  <div style={{ ...s.field, borderTop: first ? "none" : `0.5px solid ${C.sep}` }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={s.rowLabel}>{label}</div>
      {sub && <div style={s.rowSub}>{sub}</div>}
    </div>
    <span style={{ ...s.mono, textAlign: "right" }}>{value}</span>
  </div>
);

const FieldNum = ({ label, unit, value, onChange, first, min, max }) => (
  <div style={{ ...s.field, borderTop: first ? "none" : `0.5px solid ${C.sep}` }}>
    <span style={s.fieldLabel}>{label}</span>
    <input
      style={s.inputNum}
      type="number"
      inputMode="decimal"
      placeholder={unit}
      aria-label={`${label} em ${unit}`}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

function Segmented({ value, onChange, options }) {
  const idx = options.findIndex((o) => o.v === value);
  return (
    <div style={s.segmented}>
      <div
        style={{
          ...s.segPill,
          width: `calc(${100 / options.length}% - 4px)`,
          transform: `translateX(calc(${idx * 100}% + ${idx * 4}px))`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{ ...s.seg, fontWeight: value === o.v ? 600 : 500 }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export { Tile, Metric, LegendItem, Insight, Line, FieldNum, Segmented };
