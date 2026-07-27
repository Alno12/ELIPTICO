import { useState } from "react";
import { fmt, minSeg, deMinSeg, mmss } from "../lib/util.js";
import { iso } from "../lib/datas.js";
import { ZONES, totalZ, equivZ, faixa } from "../lib/treino.js";
import { C, s } from "../estilos.js";
import { Sheet, SectionTitle, Card } from "../ui/estrutura.jsx";
import { FieldNum } from "../ui/primitivos.jsx";
import { FC_MIN, FC_MAX } from "../lib/sessoes.js";

function RegistrarSheet({ cfg, inicial, onSave, onClose }) {
  const vazio = { date: iso(new Date()), avgHr: "", maxHr: "", rpe: "", notes: "" };
  const partida = (() => {
    if (!inicial)
      return {
        ...vazio,
        ...Object.fromEntries(
          ZONES.flatMap((k) => [
            [`${k.id}m`, ""],
            [`${k.id}s`, ""],
          ]),
        ),
      };
    return {
      date: inicial.date,
      ...Object.fromEntries(
        ZONES.flatMap((k) => {
          const { m, s: seg } = minSeg(inicial.zones[k.id]);
          return [
            [`${k.id}m`, m ? String(m) : ""],
            [`${k.id}s`, seg ? String(seg) : ""],
          ];
        }),
      ),
      avgHr: inicial.avgHr ? String(inicial.avgHr) : "",
      maxHr: inicial.maxHr ? String(inicial.maxHr) : "",
      rpe: inicial.rpe ? String(inicial.rpe) : "",
      notes: inicial.notes || "",
    };
  })();

  const [f, setF] = useState(partida);
  const [err, setErr] = useState(null);
  const editando = !!inicial;
  const n = (v) => (v === "" ? 0 : Math.max(0, Number(v) || 0));
  const minutosDa = (z) => deMinSeg(f[`${z.id}m`], f[`${z.id}s`]);
  const zonas = Object.fromEntries(ZONES.map((z) => [z.id, minutosDa(z)]));
  const total = totalZ(zonas);
  const carga = ZONES.reduce((a, z) => a + zonas[z.id] * z.w, 0);
  const equivalentes = equivZ(zonas);

  const campo = (chave, valor) => {
    setErr(null);
    setF({ ...f, [chave]: valor });
  };

  const fora = (v, min, max) => v !== "" && (n(v) < min || n(v) > max);

  const submit = () => {
    if (total === 0) {
      setErr("Informe o tempo em pelo menos uma zona.");
      return;
    }
    /* um 1500 digitado por engano achatava o gráfico de eficiência cardíaca e
       fazia o percentual da reserva exibir 590%; recusar é mais honesto que
       corrigir em silêncio para um valor que o usuário não escolheu */
    if (fora(f.avgHr, FC_MIN, FC_MAX) || fora(f.maxHr, FC_MIN, FC_MAX)) {
      setErr(`A frequência cardíaca deve ficar entre ${FC_MIN} e ${FC_MAX} bpm.`);
      return;
    }
    if (fora(f.rpe, 1, 10)) {
      setErr("O esforço percebido vai de 1 a 10.");
      return;
    }
    onSave({
      // eslint-disable-next-line react-hooks/purity -- submit só roda em clique, nunca no render
      id: editando ? inicial.id : `s-${Date.now()}`,
      date: f.date,
      zones: zonas,
      total,
      avgHr: n(f.avgHr) || null,
      maxHr: n(f.maxHr) || null,
      rpe: n(f.rpe) || null,
      notes: f.notes.trim(),
    });
  };

  return (
    <Sheet
      onClose={onClose}
      titulo={editando ? "Editar treino" : "Novo treino"}
      esquerda={
        <button style={s.linkSm} onClick={onClose}>
          Cancelar
        </button>
      }
      direita={
        <button style={s.done} onClick={submit}>
          Salvar
        </button>
      }
    >
      <Card pad={0}>
        <div style={{ ...s.field, borderTop: "none" }}>
          <span style={s.fieldLabel}>Data</span>
          <input
            style={s.inputRight}
            type="date"
            aria-label="Data do treino"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </div>
      </Card>

      <SectionTitle>Tempo por zona</SectionTitle>
      <Card>
        {ZONES.map((z, i) => (
          <div key={z.id} style={{ ...s.zoneRow, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.rowLabel}>{z.name}</div>
              <div style={s.rowSub}>{faixa(cfg, i)} bpm</div>
              <div style={s.trackOuter}>
                <div
                  style={{
                    ...s.trackInner,
                    width: total ? `${(zonas[z.id] / total) * 100}%` : "0%",
                    background: z.color,
                  }}
                />
              </div>
            </div>
            <div style={s.tempoCampo}>
              <input
                style={s.tempoInput}
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                aria-label={`${z.label}, minutos`}
                value={f[`${z.id}m`]}
                onChange={(e) => campo(`${z.id}m`, e.target.value)}
              />
              <span style={s.tempoSep}>min</span>
              <input
                style={s.tempoInput}
                type="number"
                min="0"
                max="59"
                inputMode="numeric"
                placeholder="00"
                aria-label={`${z.label}, segundos`}
                value={f[`${z.id}s`]}
                onChange={(e) => campo(`${z.id}s`, e.target.value)}
              />
              <span style={s.tempoSep}>s</span>
            </div>
          </div>
        ))}
        <div style={s.totalBar}>
          <div>
            <div style={s.rowLabel}>Duração total</div>
            <div style={s.rowSub}>
              {fmt(carga)} TRIMP · {fmt(equivalentes)} min equivalentes
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ ...s.big, fontSize: 32 }}>{mmss(total)}</span>
            <span style={s.unit}>min</span>
          </div>
        </div>
      </Card>

      <SectionTitle>Frequência cardíaca e esforço</SectionTitle>
      <Card pad={0}>
        <FieldNum
          first
          label="FC média"
          unit="bpm"
          min={FC_MIN}
          max={FC_MAX}
          value={f.avgHr}
          onChange={(v) => campo("avgHr", v)}
        />
        <FieldNum
          label="FC máxima"
          unit="bpm"
          min={FC_MIN}
          max={FC_MAX}
          value={f.maxHr}
          onChange={(v) => campo("maxHr", v)}
        />
        <FieldNum
          label="Esforço percebido"
          unit="1–10"
          min={0}
          max={10}
          value={f.rpe}
          onChange={(v) => campo("rpe", v)}
        />
      </Card>

      <SectionTitle>Notas</SectionTitle>
      <Card>
        <textarea
          style={s.textarea}
          rows={3}
          placeholder="Como foi o treino"
          aria-label="Notas do treino"
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
        />
      </Card>

      {err && <div style={s.error}>{err}</div>}
      <button style={s.primary} onClick={submit}>
        {editando ? "Salvar alterações" : "Salvar treino"}
      </button>
    </Sheet>
  );
}

export { RegistrarSheet };
