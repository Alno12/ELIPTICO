import { useState } from "react";
import {
  fmt,
  mmss,
  soDigitos,
  tempoDeDigitos,
  minutosDeDigitos,
  digitosDeMinutos,
  arrumarDigitos,
} from "../lib/util.js";
import { iso } from "../lib/datas.js";
import { ZONES, totalZ, equivZ, faixa } from "../lib/treino.js";
import { C, s } from "../estilos.js";
import { Sheet, SectionTitle, Card } from "../ui/estrutura.jsx";
import { FieldNum } from "../ui/primitivos.jsx";
import { FC_MIN, FC_MAX } from "../lib/sessoes.js";

function RegistrarSheet({ cfg, inicial, onSave, onClose }) {
  const vazio = { date: iso(new Date()), avgHr: "", maxHr: "", rpe: "" };
  const partida = (() => {
    if (!inicial) return { ...vazio, ...Object.fromEntries(ZONES.map((k) => [k.id, ""])) };
    return {
      date: inicial.date,
      ...Object.fromEntries(ZONES.map((k) => [k.id, digitosDeMinutos(inicial.zones[k.id])])),
      avgHr: inicial.avgHr ? String(inicial.avgHr) : "",
      maxHr: inicial.maxHr ? String(inicial.maxHr) : "",
      rpe: inicial.rpe ? String(inicial.rpe) : "",
    };
  })();

  const [f, setF] = useState(partida);
  const [err, setErr] = useState(null);
  const editando = !!inicial;
  const n = (v) => (v === "" ? 0 : Math.max(0, Number(v) || 0));
  const zonas = Object.fromEntries(ZONES.map((z) => [z.id, minutosDeDigitos(f[z.id])]));
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
      /* O campo de notas saiu da tela, mas a nota de um treino já gravado não
         pode evaporar só porque ele foi reaberto para editar. Continua sendo
         lida do CSV e mostrada no Histórico. */
      notes: inicial?.notes || "",
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
            {/* Um campo só, preenchido da direita para a esquerda: digitar 1205
                dá 12:05, sem passar de um campo para o outro no meio do número.
                `text` em vez de `number` porque o valor mostrado tem dois-pontos;
                `inputMode` mantém o teclado numérico. */}
            <div style={s.tempoCampo}>
              <input
                style={s.tempoInput}
                type="text"
                inputMode="numeric"
                placeholder="0:00"
                aria-label={`${z.label}, tempo`}
                value={tempoDeDigitos(f[z.id])}
                onChange={(e) => campo(z.id, soDigitos(e.target.value))}
                /* o acerto de "0:83" para "1:23" espera a digitação terminar */
                onBlur={() => campo(z.id, arrumarDigitos(f[z.id]))}
              />
              <span style={s.tempoSep}>min</span>
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

      {err && <div style={s.error}>{err}</div>}
      <button style={s.primary} onClick={submit}>
        {editando ? "Salvar alterações" : "Salvar treino"}
      </button>
    </Sheet>
  );
}

export { RegistrarSheet };
