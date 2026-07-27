import { useState } from "react";
import { fmt, clamp, cap, mmss } from "../lib/util.js";
import { DIAS_NOME, iso, dayjs, diffDias, mondayOf, longDate } from "../lib/datas.js";
import { ZONES, trimp } from "../lib/treino.js";
import { montarSemana, montarJanela } from "../lib/stats.js";
import { C, s } from "../estilos.js";
import { LargeTitle, SectionTitle, Card, Empty } from "../ui/estrutura.jsx";
import { Tile, Line } from "../ui/primitivos.jsx";
import { ZoneColumn } from "../graficos/ZoneColumn.jsx";
import { Heatmap } from "../graficos/Heatmap.jsx";
import { WeekStrip } from "../graficos/WeekStrip.jsx";

const SetaSemana = ({ dir, ativa, onClick }) => (
  <button
    onClick={ativa ? onClick : undefined}
    disabled={!ativa}
    aria-label={dir === "anterior" ? "Semana anterior" : "Próxima semana"}
    style={{ ...s.setaSemana, opacity: ativa ? 1 : 0.35, cursor: ativa ? "pointer" : "default" }}
  >
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ativa ? C.blue : C.sec}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "anterior" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  </button>
);

const rotuloSemana = (sem) => {
  const ini = dayjs(sem.inicio),
    fim = dayjs(sem.fim);
  const mes = (d) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return ini.getMonth() === fim.getMonth()
    ? `${ini.getDate()} a ${fim.getDate()} de ${mes(fim)}`
    : `${ini.getDate()} de ${mes(ini)} a ${fim.getDate()} de ${mes(fim)}`;
};

/* Um número da janela móvel. Sem o "vs." em cada um: a comparação é a mesma para
   os quatro e está dita uma vez no título da seção. Repetir quatro vezes só
   gastaria a linha que sobra para o número. */
const NumeroJanela = ({ label, value, unit, delta, color }) => (
  <div style={{ minWidth: 0 }}>
    <div style={s.tileLabel}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
      <span style={{ ...s.big, fontSize: 27, color }}>{value}</span>
      <span style={{ ...s.unit, fontSize: 12.5 }}>{unit}</span>
    </div>
    <div style={{ ...s.rowSub, marginTop: 3, color: delta > 0 ? C.green : C.sec }}>
      {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {fmt(Math.abs(delta))}
    </div>
  </div>
);

function Resumo({ st, cfg, sessions, onAjustes }) {
  const [selDia, setSelDia] = useState(null);
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(-1);
  if (!st)
    return (
      <>
        <LargeTitle title="Semana" />
        <Empty />
      </>
    );

  /* até onde dá para voltar: a semana do primeiro treino registrado */
  const maxOffset = Math.max(
    0,
    Math.floor(diffDias(iso(mondayOf(dayjs(st.primeiro))), iso(mondayOf(new Date()))) / 7),
  );
  const irPara = (n) => {
    const alvo = clamp(n, 0, maxOffset);
    if (alvo === offset) return;
    /* ir para o passado traz conteúdo que estava à esquerda, e vice-versa */
    setDir(alvo > offset ? -1 : 1);
    setOffset(alvo);
    setSelDia(null);
  };
  /* `key={offset}` remonta o bloco a cada semana, o que faz a animação tocar de novo */
  const transicao = (extra) => ({
    key: offset,
    style: {
      ...extra,
      animation: `${dir < 0 ? "deEsquerda" : "deDireita"} .3s cubic-bezier(.16,.84,.28,1) both`,
    },
  });

  const sem = montarSemana(sessions, offset);
  const ant = montarSemana(sessions, offset + 1);
  /* ancoradas em hoje de propósito: não acompanham as setas de semana */
  const jan = montarJanela(sessions);
  const janAnt = montarJanela(sessions, 1);
  const pct = Math.min(100, st.meta ? (sem.equiv / st.meta) * 100 : 0);
  const dia = selDia != null ? sem.dias.find((d) => d.date === selDia) : null;
  const deltaMin = sem.minutos - ant.minutos;
  const seta = (v) => (v > 0 ? "↑" : v < 0 ? "↓" : "→");

  return (
    <>
      <LargeTitle title="Semana" action={{ label: "Ajustes", onClick: onAjustes }} />

      {/* herói: os sete dias da semana em exibição */}
      <Card i={0} pad={18}>
        <div>
          {/* controles fora da transição: se remontassem a cada troca, o toque se perderia */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <div
              data-testid="semana-rotulo"
              style={{
                ...s.eyebrow,
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {dia
                ? cap(DIAS_NOME[dia.wd]) + ", " + dayjs(dia.date).getDate()
                : offset === 0
                  ? "Esta semana"
                  : rotuloSemana(sem)}
            </div>
            {offset > 0 && (
              <button style={s.chipHoje} onClick={() => irPara(0)}>
                Hoje
              </button>
            )}
            <SetaSemana
              dir="anterior"
              ativa={offset < maxOffset}
              onClick={() => irPara(offset + 1)}
            />
            <SetaSemana dir="proxima" ativa={offset > 0} onClick={() => irPara(offset - 1)} />
          </div>

          <div {...transicao()}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
              <span data-testid="semana-minutos" style={s.big}>
                {fmt(dia ? dia.total : sem.minutos)}
              </span>
              <span style={s.unit}>min</span>
              {!dia && (
                <span style={{ ...s.unit, color: deltaMin > 0 ? C.green : C.sec, fontSize: 13 }}>
                  {seta(deltaMin)} {fmt(Math.abs(deltaMin))} vs. semana anterior
                </span>
              )}
            </div>

            <WeekStrip dias={sem.dias} sel={selDia} setSel={setSelDia} />

            {dia ? (
              <div style={s.diaDetalhe}>
                {dia.sessoes.length > 0 ? (
                  <>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <span style={s.rowSub}>
                        {fmt(dia.carga)} TRIMP · {fmt(dia.equiv)} min equiv.
                      </span>
                      <span style={s.rowSub}>
                        {dia.sessoes[0].avgHr
                          ? `${dia.sessoes[0].avgHr} bpm médios`
                          : "sem FC registrada"}
                      </span>
                    </div>
                    {ZONES.filter((z) => dia.zones[z.id] > 0).map((z) => (
                      <div key={z.id} style={s.detailRow}>
                        <span style={{ ...s.dotSm, background: z.color }} />
                        <span style={{ flex: 1, color: C.sec }}>{z.label}</span>
                        <span style={s.mono}>{mmss(dia.zones[z.id])} min</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ ...s.rowSub, textAlign: "center", padding: "6px 0" }}>
                    Dia sem treino
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <div style={s.metaBarOuter}>
                  <div style={{ ...s.metaBarInner, width: `${pct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                  <span data-testid="semana-meta" style={s.rowSub}>
                    {fmt(sem.equiv)} de {st.meta} min equivalentes
                  </span>
                  <span style={s.rowSub}>
                    {sem.equiv >= st.meta ? "meta atingida" : `${fmt(pct)}%`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Janela móvel, presa a hoje. Fica fora da `transicao` e não recebe o
          `offset`: navegar para uma semana de março não muda o que são os
          últimos sete dias. O intervalo no título deixa isso explícito. */}
      <SectionTitle>
        Últimos 7 dias
        <span style={s.sectionRight}>{rotuloSemana(jan)}</span>
      </SectionTitle>
      <Card i={1}>
        <div data-testid="janela-7" style={{ ...s.grid, gap: "16px 12px" }}>
          <NumeroJanela
            label="Minutos"
            value={fmt(jan.minutos)}
            unit="min"
            delta={jan.minutos - janAnt.minutos}
            color={C.green}
          />
          <NumeroJanela
            label="Treinos"
            value={jan.sessoes}
            unit="sessões"
            delta={jan.sessoes - janAnt.sessoes}
            color={C.blue}
          />
          <NumeroJanela
            label="Carga"
            value={fmt(jan.carga)}
            unit="TRIMP"
            delta={jan.carga - janAnt.carga}
            color={C.orange}
          />
          <NumeroJanela
            label="Min. equivalentes"
            value={fmt(jan.equiv)}
            unit="min"
            delta={jan.equiv - janAnt.equiv}
            color={C.purple}
          />
        </div>
        <p style={{ ...s.foot, marginBottom: 0 }}>
          Comparado com os 7 dias anteriores, de {rotuloSemana(janAnt)}. Diferente do card acima,
          esta janela não zera na segunda-feira.
        </p>
      </Card>

      <SectionTitle>
        Distribuição por zona na semana
        <span style={s.sectionRight}>{offset === 0 ? "esta semana" : rotuloSemana(sem)}</span>
      </SectionTitle>
      <Card i={2}>
        <div>
          <div {...transicao()}>
            {sem.grand > 0 ? (
              <ZoneColumn totals={sem.zonas} grand={sem.grand} cfg={cfg} />
            ) : (
              <p style={{ ...s.foot, margin: 0, textAlign: "center", padding: 20 }}>
                Nenhum treino nesta semana.
              </p>
            )}
          </div>
        </div>
      </Card>

      <SectionTitle>{offset === 0 ? "Esta semana" : rotuloSemana(sem)}</SectionTitle>
      <div data-testid="quadros-semana" {...transicao(s.grid)}>
        <Tile
          i={3}
          label="Minutos"
          value={fmt(sem.minutos)}
          unit="min"
          delta={sem.minutos - ant.minutos}
          color={C.green}
        />
        <Tile
          i={4}
          label="Treinos"
          value={sem.sessoes}
          unit="sessões"
          delta={sem.sessoes - ant.sessoes}
          color={C.blue}
        />
        <Tile
          i={5}
          label="Carga"
          value={fmt(sem.carga)}
          unit="TRIMP"
          delta={sem.carga - ant.carga}
          color={C.orange}
        />
        <Tile
          i={6}
          label="Min. equivalentes"
          value={fmt(sem.equiv)}
          unit="min"
          delta={sem.equiv - ant.equiv}
          color={C.purple}
        />
      </div>

      <SectionTitle>
        Consistência
        <span style={s.sectionRight}>{st.streak} semanas seguidas</span>
      </SectionTitle>
      <Card i={7}>
        <Heatmap sessions={sessions} />
      </Card>

      <Card i={8} pad={0}>
        <Line first label="Média de treinos por semana" value={fmt(st.sessoesPorSemana, 1)} />
        <Line label="Média de minutos por semana" value={`${fmt(st.mediaSemanal)} min`} />
        <Line label="Média de minutos equivalentes" value={`${fmt(st.equivSemanalMedio)} min`} />
        <Line label="Intervalo médio entre treinos" value={`${fmt(st.intervaloMedio, 1)} dias`} />
        <Line
          label="Último treino"
          value={
            st.desdeUltimo === 0
              ? "hoje"
              : `há ${st.desdeUltimo} ${st.desdeUltimo === 1 ? "dia" : "dias"}`
          }
        />
        <Line
          label="Semanas que bateram a meta"
          value={`${st.semanasNaMeta} de ${st.totalCompletas}`}
        />
      </Card>

      <SectionTitle>
        Este mês
        <span style={s.sectionRight}>projeção {fmt(st.projecaoMes)} min</span>
      </SectionTitle>
      <div style={s.grid}>
        <Tile
          i={8}
          label="Minutos"
          value={fmt(st.mesAtual.minutos)}
          unit="min"
          delta={st.mesAnterior ? st.mesAtual.minutos - st.mesAnterior.minutos : null}
          comparado="mês anterior"
          color={C.green}
        />
        <Tile
          i={9}
          label="Treinos"
          value={st.mesAtual.sessoes}
          unit="sessões"
          delta={st.mesAnterior ? st.mesAtual.sessoes - st.mesAnterior.sessoes : null}
          comparado="mês anterior"
          color={C.blue}
        />
        <Tile
          i={10}
          label="Carga"
          value={fmt(st.mesAtual.carga)}
          unit="TRIMP"
          delta={st.mesAnterior ? st.mesAtual.carga - st.mesAnterior.carga : null}
          comparado="mês anterior"
          color={C.orange}
        />
        <Tile
          i={11}
          label="Min. equivalentes"
          value={fmt(st.mesAtual.equiv)}
          unit="min"
          delta={st.mesAnterior ? st.mesAtual.equiv - st.mesAnterior.equiv : null}
          comparado="mês anterior"
          color={C.purple}
        />
      </div>

      <SectionTitle>Recordes</SectionTitle>
      <Card i={13} pad={0}>
        <Line
          first
          label="Sessão mais longa"
          value={`${fmt(st.recordes.maisLonga.total)} min`}
          sub={longDate(st.recordes.maisLonga.date)}
        />
        <Line
          label="Sessão mais pesada"
          value={`${fmt(trimp(st.recordes.maisPesada))} TRIMP`}
          sub={longDate(st.recordes.maisPesada.date)}
        />
        {st.recordes.maiorSemana && (
          <Line
            label="Maior semana"
            value={`${fmt(st.recordes.maiorSemana.minutos)} min`}
            sub={`semana de ${dayjs(st.recordes.maiorSemana.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`}
          />
        )}
        <Line label="Maior sequência de semanas" value={`${st.maiorStreak} semanas`} />
        {st.fcMaxReg != null && <Line label="FC máxima registrada" value={`${st.fcMaxReg} bpm`} />}
      </Card>

      <SectionTitle>Desde o início</SectionTitle>
      <Card i={14} pad={0}>
        <Line first label="Treinos registrados" value={`${st.total}`} />
        <Line label="Tempo total" value={`${fmt(st.horas, 1)} h`} />
        <Line label="Carga acumulada" value={`${fmt(st.cargaTotal)} TRIMP`} />
        <Line label="Minutos" value={`${fmt(st.minutosTotal)} min`} />
        <Line label="Minutos equivalentes" value={`${fmt(st.equivTotal)} min`} />
        <Line label="Duração média" value={`${fmt(st.mediaDur)} min`} />
        <Line label="Contínuos e intervalados" value={`${st.continuos} · ${st.intervalados}`} />
        <Line label="Dia que você mais treina" value={DIAS_NOME[st.melhorDia]} />
        <Line label="Primeiro registro" value={longDate(st.primeiro)} />
      </Card>
    </>
  );
}

/* ================= tela: tendências ================= */

export { Resumo };
