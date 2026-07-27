import { useState } from "react";
import { sum, fmt } from "../lib/util.js";
import { DIAS_NOME, iso, dayjs, daysAgo, longDate } from "../lib/datas.js";
import { ZONES } from "../lib/treino.js";
import { C, s } from "../estilos.js";
import { LargeTitle, SectionTitle, Card, Empty } from "../ui/estrutura.jsx";
import { LegendItem, Line, Segmented } from "../ui/primitivos.jsx";
import { CumulativeChart } from "../graficos/CumulativeChart.jsx";
import { ZoneEvolution } from "../graficos/ZoneEvolution.jsx";
import { WeekdayChart } from "../graficos/WeekdayChart.jsx";
import { ZoneBars } from "../graficos/ZoneBars.jsx";
import { LoadChart } from "../graficos/LoadChart.jsx";
import { IntensityChart } from "../graficos/IntensityChart.jsx";
import { HrChart } from "../graficos/HrChart.jsx";

function Tendencias({ sessions, st }) {
  const [range, setRange] = useState(30);
  const [sel, setSel] = useState(null);
  if (!st)
    return (
      <>
        <LargeTitle title="Tendências" />
        <Empty />
      </>
    );

  const dias = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = iso(daysAgo(i));
    const ses = sessions.filter((x) => x.date === d);
    dias.push({
      date: d,
      zones: Object.fromEntries(ZONES.map((z) => [z.id, sum(ses, (x) => x.zones[z.id] || 0)])),
      total: sum(ses, (x) => x.total),
      avgHr: ses.length ? Math.round(sum(ses, (x) => x.avgHr || 0) / ses.length) : null,
    });
  }
  const cur = sel != null ? dias[sel] : null;
  const comTreino = dias.filter((d) => d.total > 0);

  return (
    <>
      <LargeTitle title="Tendências" />
      <Segmented
        value={range}
        onChange={(v) => {
          setRange(v);
          setSel(null);
        }}
        options={[
          { v: 7, l: "7 D" },
          { v: 30, l: "30 D" },
          { v: 90, l: "90 D" },
        ]}
      />

      <Card i={0} pad={18}>
        <div style={s.eyebrow}>Minutos por zona</div>
        {cur ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={s.big}>{fmt(cur.total)}</span>
              <span style={s.unit}>min</span>
            </div>
            <div style={s.sub}>
              {longDate(cur.date)}
              {cur.avgHr ? ` · ${cur.avgHr} bpm médios` : ""}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={s.big}>{fmt(sum(comTreino, (d) => d.total))}</span>
              <span style={s.unit}>min · {comTreino.length} treinos</span>
            </div>
            <div style={s.sub}>Arraste o dedo sobre o gráfico para ver cada dia</div>
          </>
        )}
        <ZoneBars dias={dias} sel={sel} setSel={setSel} />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
          {ZONES.map((z) => (
            <span key={z.id} style={s.legend}>
              <span style={{ ...s.dotSm, background: z.color }} />Z{z.short}
            </span>
          ))}
        </div>
      </Card>

      <SectionTitle>Volume acumulado</SectionTitle>
      <Card i={1} pad={18}>
        <div style={s.eyebrow}>Últimos 28 dias contra os 28 anteriores</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
          <span
            style={{ ...s.big, color: st.acum28.at(-1) >= st.acum28ant.at(-1) ? C.green : C.label }}
          >
            {st.acum28.at(-1) >= st.acum28ant.at(-1) ? "+" : ""}
            {fmt(st.acum28.at(-1) - st.acum28ant.at(-1))}
          </span>
          <span style={s.unit}>min de diferença</span>
        </div>
        <CumulativeChart atual={st.acum28} anterior={st.acum28ant} />
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <LegendItem color={C.green} label="Atual" value={`${fmt(st.acum28.at(-1))} min`} />
          <LegendItem color={C.ter} label="Anterior" value={`${fmt(st.acum28ant.at(-1))} min`} />
        </div>
      </Card>

      <SectionTitle>Carga semanal</SectionTitle>
      <Card i={2} pad={18}>
        <div style={s.eyebrow}>TRIMP por semana</div>
        <LoadChart weeks={st.weeks} />
        <p style={s.foot}>
          A linha tracejada é a média móvel de 4 semanas. Barras em laranja passaram 30% dessa média
          — a referência prática é subir no máximo 10% de volume por semana.
        </p>
      </Card>

      <SectionTitle>Evolução da distribuição</SectionTitle>
      <Card i={3} pad={18}>
        <div style={s.eyebrow}>Proporção de cada zona, semana a semana</div>
        <ZoneEvolution weeks={st.weeks} />
        <p style={s.foot}>
          Cada coluna é uma semana normalizada em 100%. Uma faixa verde crescente indica base
          aeróbica se consolidando; laranja e vermelho subindo juntos indicam semanas mais intensas.
        </p>
      </Card>

      <SectionTitle>Proporção de intensidade</SectionTitle>
      <Card i={4} pad={18}>
        <div style={s.eyebrow}>Tempo em Z3 ou acima, por semana</div>
        <IntensityChart weeks={st.weeks} />
        <p style={s.foot}>
          As barras claras são o volume total da semana; a parte colorida, o tempo em Z3, Z4 e Z5.
        </p>
      </Card>

      <SectionTitle>Perfil semanal</SectionTitle>
      <Card i={5} pad={18}>
        <div style={s.eyebrow}>Minutos médios por dia da semana</div>
        <WeekdayChart perfil={st.perfilDia} />
        <p style={s.foot}>
          Seu dia mais forte é {DIAS_NOME[st.melhorDia]}. Dias com barra baixa mas não zerada são os
          que você começa e abandona — vale conferir se o horário está mesmo funcionando.
        </p>
      </Card>

      <SectionTitle>Eficiência cardíaca</SectionTitle>
      <Card i={6} pad={18}>
        <div style={s.eyebrow}>FC média em treinos contínuos</div>
        {st.hrSes.length >= 5 ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={{ ...s.big, color: st.deltaHr < 0 ? C.green : C.label }}>
                {st.deltaHr > 0 ? "+" : ""}
                {fmt(st.deltaHr, 1)}
              </span>
              <span style={s.unit}>bpm em {st.hrSes.length} sessões</span>
            </div>
            <HrChart data={st.hrSes} />
            <p style={s.foot}>
              Cada ponto é um treino contínuo. Com duração e zonas parecidas, FC média em queda
              costuma refletir ganho de condicionamento.
            </p>
          </>
        ) : (
          <p style={s.foot}>
            Registre pelo menos 5 treinos contínuos com FC média para ver esta análise.
          </p>
        )}
      </Card>

      <SectionTitle>Semana a semana</SectionTitle>
      <Card i={7} pad={0}>
        {[...st.weeks]
          .reverse()
          .slice(0, 10)
          .map((w, i) => (
            <Line
              key={w.start}
              first={i === 0}
              label={`Semana de ${dayjs(w.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`}
              value={`${fmt(w.minutos)} min`}
              sub={`${w.sessoes} ${w.sessoes === 1 ? "treino" : "treinos"} · ${fmt(w.carga)} TRIMP · ${fmt(w.z3mais)} min em Z3+`}
            />
          ))}
      </Card>
    </>
  );
}

/* ================= tela: análise ================= */

export { Tendencias };
