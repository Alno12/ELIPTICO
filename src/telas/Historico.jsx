import { useState, useRef } from "react";
import { sum, fmt, mmss } from "../lib/util.js";
import { iso, dayjs, shortDate } from "../lib/datas.js";
import { ZONES, trimp, equiv } from "../lib/treino.js";
import { C, s } from "../estilos.js";
import { LargeTitle, SectionTitle, Card, Empty } from "../ui/estrutura.jsx";

function Historico({ sessions, onEdit, onDelete, onClearDemo, onReseed, onImport, onToast }) {
  const [open, setOpen] = useState(null);
  const arquivo = useRef(null);

  const inputArquivo = (
    <input
      ref={arquivo}
      type="file"
      accept=".csv,text/csv"
      style={{ display: "none" }}
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) onImport(f);
      }}
    />
  );

  if (!sessions.length) {
    return (
      <>
        <LargeTitle title="Histórico" />
        <Empty />
        <Card>
          <button style={s.secondary} onClick={() => arquivo.current?.click()}>
            Importar CSV
          </button>
          <button style={s.secondary} onClick={onReseed}>
            Carregar dados de exemplo
          </button>
          {inputArquivo}
        </Card>
      </>
    );
  }

  const exportar = () => {
    const linhas = [
      [
        "data",
        "total_min",
        "z1",
        "z2",
        "z3",
        "z4",
        "z5",
        "trimp",
        "min_equivalentes",
        "fc_media",
        "fc_max",
        "rpe",
        "notas",
      ].join(","),
    ];
    /* tempos podem ser fracionários; 4 casas bastam para reconstruir o segundo exato */
    const dec = (v) => Number((Number(v) || 0).toFixed(4)).toString();
    /* Uma nota começando com =, +, - ou @ é avaliada como fórmula ao abrir o
       arquivo numa planilha. O apóstrofo à frente faz Excel e LibreOffice
       tratarem o campo como texto; a importação o remove de volta. */
    const campoTexto = (v) => {
      const t = String(v ?? "");
      const seguro = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
      return `"${seguro.replace(/"/g, '""')}"`;
    };
    [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((x) => {
        linhas.push(
          [
            x.date,
            dec(x.total),
            ...ZONES.map((z) => dec(x.zones[z.id] || 0)),
            dec(trimp(x)),
            dec(equiv(x)),
            x.avgHr || "",
            x.maxHr || "",
            x.rpe || "",
            campoTexto(x.notes),
          ].join(","),
        );
      });
    try {
      const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `treinos-${iso(new Date())}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      onToast("Arquivo CSV gerado");
    } catch {
      onToast("Não foi possível exportar neste ambiente");
    }
  };

  const meses = {};
  sessions.forEach((x) => {
    (meses[x.date.slice(0, 7)] ||= []).push(x);
  });
  const nDemo = sessions.filter((x) => x.demo).length;

  return (
    <>
      <LargeTitle title="Histórico" action={{ label: "Exportar", onClick: exportar }} />
      {Object.entries(meses).map(([mes, list], mi) => (
        <div key={mes}>
          <div style={s.section}>
            <span>
              {dayjs(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <span style={s.sectionRight}>
              {fmt(sum(list, (x) => x.total))} min · {list.length} treinos
            </span>
          </div>
          <Card i={mi} pad={0}>
            {list.map((x, i) => (
              <div key={x.id}>
                <button
                  style={{ ...s.sesRow, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}
                  onClick={() => setOpen(open === x.id ? null : x.id)}
                >
                  <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={s.rowLabel}>{shortDate(x.date)}</span>
                      <span style={{ ...s.mono, fontSize: 13 }}>{fmt(x.total)} min</span>
                    </div>
                    <div style={s.rowSub}>
                      {fmt(trimp(x))} TRIMP{x.avgHr ? ` · ${x.avgHr} bpm médios` : ""}
                      {x.rpe ? ` · RPE ${x.rpe}` : ""}
                    </div>
                    <div style={s.miniBar}>
                      {ZONES.map((z) =>
                        x.zones[z.id] > 0 ? (
                          <div
                            key={z.id}
                            style={{
                              width: `${(x.zones[z.id] / x.total) * 100}%`,
                              background: z.color,
                            }}
                          />
                        ) : null,
                      )}
                    </div>
                  </div>
                  <span style={{ ...s.chev, transform: open === x.id ? "rotate(90deg)" : "none" }}>
                    ›
                  </span>
                </button>
                {open === x.id && (
                  <div style={s.detail}>
                    {ZONES.map((z) => (
                      <div key={z.id} style={s.detailRow}>
                        <span style={{ ...s.dotSm, background: z.color }} />
                        <span style={{ flex: 1, color: C.sec }}>{z.label}</span>
                        <span style={s.mono}>{mmss(x.zones[z.id] || 0)} min</span>
                      </div>
                    ))}
                    {x.maxHr && (
                      <div style={s.detailRow}>
                        <span style={{ flex: 1, color: C.sec }}>FC máxima</span>
                        <span style={s.mono}>{x.maxHr} bpm</span>
                      </div>
                    )}
                    <div style={s.detailRow}>
                      <span style={{ flex: 1, color: C.sec }}>Minutos equivalentes</span>
                      <span style={s.mono}>{fmt(equiv(x))}</span>
                    </div>
                    <div style={s.detailRow}>
                      <span style={{ flex: 1, color: C.sec }}>Densidade</span>
                      <span style={s.mono}>{fmt(trimp(x) / x.total, 2)} /min</span>
                    </div>
                    {x.notes && <p style={{ ...s.foot, marginTop: 8 }}>{x.notes}</p>}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        style={{ ...s.secondary, flex: 1, marginTop: 0 }}
                        onClick={() => onEdit(x)}
                      >
                        Editar
                      </button>
                      <button
                        style={{ ...s.destructive, flex: 1, marginTop: 0 }}
                        onClick={() => onDelete(x.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      ))}

      <SectionTitle>Backup</SectionTitle>
      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          Os treinos ficam apenas neste navegador — limpar os dados do site apaga tudo. Exporte de
          tempos em tempos e guarde o arquivo; ele pode ser importado de volta aqui, inclusive em
          outro aparelho. Treinos já presentes não são duplicados na importação.
        </p>
        <button style={s.secondary} onClick={exportar}>
          Exportar CSV
        </button>
        <button style={s.secondary} onClick={() => arquivo.current?.click()}>
          Importar CSV
        </button>
        {inputArquivo}
      </Card>

      <SectionTitle>Dados de exemplo</SectionTitle>
      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          {nDemo > 0
            ? `O app está com ${nDemo} treinos fictícios de 19 semanas para os gráficos aparecerem preenchidos.`
            : "Os treinos de exemplo foram removidos. Só ficaram os seus registros."}
        </p>
        {nDemo > 0 ? (
          <button style={s.secondary} onClick={onClearDemo}>
            Limpar exemplos e começar do zero
          </button>
        ) : (
          <button style={s.secondary} onClick={onReseed}>
            Recarregar dados de exemplo
          </button>
        )}
      </Card>
    </>
  );
}

/* ================= folhas modais ================= */

export { Historico };
