import { useState } from "react";
import { sum, fmt } from "../lib/util.js";
import { DIAS_NOME, iso, dayjs, daysAgo, longDate, shortDate } from "../lib/datas.js";
import { ZONES } from "../lib/treino.js";
import { recorteForte, espacoForte, minutosFortes, MIN_FORTE } from "../lib/stats.js";
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
import { ForteChart } from "../graficos/ForteChart.jsx";
import { ForteStrip } from "../graficos/ForteStrip.jsx";

const Z = Object.fromEntries(ZONES.map((z) => [z.id, z]));

/* Duas barras na mesma escala de 0 a 100%: a fatia que Z4 e Z5 ocupam no relógio
   e a fatia que ocupam na carga. O ponto do card é a distância entre elas, e ela
   só se lê se as duas réguas forem a mesma. */
const BarraPeso = ({ label, sub, pct, cor }) => (
  <div style={{ marginTop: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 13.5, color: C.sec }}>{label}</span>
      <span style={{ ...s.mono, fontSize: 16, color: C.label, fontWeight: 600 }}>
        {fmt(pct)}%
      </span>
    </div>
    <div style={{ ...s.metaBarOuter, marginTop: 6 }}>
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          height: "100%",
          borderRadius: 4,
          background: cor,
        }}
      />
    </div>
    <div style={{ ...s.rowSub, marginTop: 5 }}>{sub}</div>
  </div>
);

/* As caixas esticam à altura da mais alta e o valor fica no rodapé de cada uma:
   assim um rótulo que quebra em duas linhas não empurra o número dele para baixo
   do número dos vizinhos. */
const MiniStat = ({ label, value }) => (
  <div
    style={{
      flex: 1,
      background: C.fill,
      borderRadius: 11,
      padding: "10px 11px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <div style={{ ...s.rowSub, marginTop: 0 }}>{label}</div>
    <div style={{ ...s.mono, color: C.label, fontSize: 19, fontWeight: 600, marginTop: 6 }}>
      {value}
    </div>
  </div>
);

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

  /* zonas 4 e 5: a janela de 7 dias contra a anterior, o recorte que acompanha o
     seletor lá de cima e o espaçamento entre estímulos */
  const f0 = recorteForte(sessions, 7);
  const f1 = recorteForte(sessions, 7, 1);
  const fr = recorteForte(sessions, range);
  const esp = espacoForte(sessions, 35);
  const temForte = st.zoneTotals.z4 + st.zoneTotals.z5 > 0;
  /* quanto a fatia pesa na carga dividido por quanto pesa no relógio */
  const fator = fr.pctMin > 0 ? fr.pctCarga / fr.pctMin : null;
  const recentes = [...sessions]
    .filter((x) => minutosFortes(x) >= MIN_FORTE)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

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

      {/* ================= zonas 4 e 5 ================= */}

      {!temForte ? (
        <>
          <SectionTitle>Zonas 4 e 5</SectionTitle>
          <Card i={5} pad={18}>
            <p style={{ ...s.foot, marginTop: 0 }}>
              Você ainda não registrou nenhum minuto em Z4 (limiar) ou Z5 (máximo). Quando registrar,
              esta seção passa a mostrar quanto desse trabalho você faz, quanto ele pesa na sua carga
              e quanto tempo de recuperação fica entre um estímulo e o seguinte.
            </p>
          </Card>
        </>
      ) : (
        <>
          <SectionTitle>Trabalho forte</SectionTitle>
          <Card i={5} pad={18}>
            <div style={s.eyebrow}>Minutos em Z4 e Z5, semana a semana</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={s.big}>{fmt(f0.minutos)}</span>
              <span style={s.unit}>min nos últimos 7 dias</span>
            </div>
            <div style={s.sub}>
              {f1.minutos > 0
                ? `${f0.minutos >= f1.minutos ? "↑" : "↓"} ${fmt(Math.abs(f0.minutos - f1.minutos))} min contra os 7 dias anteriores`
                : "Nos 7 dias anteriores não houve nada em Z4 ou Z5"}
            </div>
            <ForteChart weeks={st.weeks} />
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              <LegendItem color={Z.z4.color} label="Z4 · Limiar" value={`${fmt(f0.z4)} min`} />
              <LegendItem color={Z.z5.color} label="Z5 · Máximo" value={`${fmt(f0.z5)} min`} />
            </div>
            <p style={s.foot}>
              A escala é só do trabalho forte, por isso as variações aparecem — no gráfico de volume
              total essa fatia some. A linha tracejada é a média de 4 semanas: é ela que diz se a
              tendência subiu, e não a diferença entre duas semanas vizinhas.
            </p>
          </Card>

          <SectionTitle>Peso na carga</SectionTitle>
          <Card i={6} pad={18}>
            <div style={s.eyebrow}>
              Z4 e Z5 nos últimos {range} {range === 1 ? "dia" : "dias"}
            </div>
            {fator == null ? (
              <p style={{ ...s.foot, marginTop: 10 }}>
                Nenhum minuto em Z4 ou Z5 nesta janela. Escolha 90 dias acima para olhar mais para
                trás.
              </p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
                  <span style={{ ...s.big, color: C.orange }}>{fmt(fator, 1)}×</span>
                  <span style={s.unit}>mais peso na carga do que no relógio</span>
                </div>
                <BarraPeso
                  label="Do seu tempo total"
                  sub={`${fmt(fr.minutos)} de ${fmt(fr.minutosTotal)} min`}
                  pct={fr.pctMin}
                  cor={C.ter}
                />
                <BarraPeso
                  label="Da sua carga total"
                  sub={`${fmt(fr.carga)} de ${fmt(fr.cargaTotal)} TRIMP`}
                  pct={fr.pctCarga}
                  cor={`linear-gradient(90deg, ${Z.z4.light}, ${Z.z4.color})`}
                />
                <p style={s.foot}>
                  O TRIMP pondera cada minuto pela zona: Z4 vale 4 e Z5 vale 5, contra 1 de Z1 e 2 de
                  Z2. É por isso que uma fatia pequena do relógio ocupa uma fatia grande da carga — e
                  é dessa fatia que vem boa parte da fadiga que aparece na aba Análise.
                </p>
              </>
            )}
          </Card>

          <SectionTitle>Recuperação entre estímulos</SectionTitle>
          <Card i={7} pad={18}>
            <div style={s.eyebrow}>Dias com Z4 ou Z5 nos últimos {esp.dias} dias</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
              <span style={s.big}>{esp.desdeUltimo != null ? fmt(esp.desdeUltimo) : "—"}</span>
              <span style={s.unit}>
                {esp.desdeUltimo === 0
                  ? "— foi hoje"
                  : esp.desdeUltimo === 1
                    ? "dia desde a última sessão forte"
                    : "dias desde a última sessão forte"}
              </span>
            </div>
            <ForteStrip serie={esp.serie} />
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <MiniStat label="Sessões fortes" value={fmt(esp.total)} />
              <MiniStat
                label="Intervalo médio"
                value={esp.medio != null ? `${fmt(esp.medio, 1)} d` : "—"}
              />
              <MiniStat label="Dias seguidos" value={fmt(esp.seguidos)} />
            </div>
            <p style={s.foot}>
              Traço alto é dia de Z4 ou Z5, e a altura acompanha quantos minutos foram; traço verde
              baixo é dia de treino fácil. A referência prática é deixar mais ou menos 48 h entre dois
              estímulos fortes — emendados em dias seguidos eles acumulam fadiga sem render adaptação
              a mais.
            </p>
          </Card>

          {/* sem nenhuma sessão acima do corte não há lista: um card vazio sob um
              título só faria o leitor procurar o que não existe */}
          {recentes.length > 0 && (
            <>
              <SectionTitle>Sessões fortes recentes</SectionTitle>
              <Card i={8} pad={0}>
                {recentes.map((x, i) => (
                  <Line
                    key={x.id}
                    first={i === 0}
                    label={shortDate(x.date)}
                    value={`${fmt(minutosFortes(x))} min`}
                    sub={`Z4 ${fmt(x.zones.z4 || 0)} min · Z5 ${fmt(x.zones.z5 || 0)} min · ${fmt(x.total)} min no total`}
                  />
                ))}
              </Card>
            </>
          )}

          <p style={{ ...s.foot, padding: "0 4px", marginTop: -2 }}>
            Conta como sessão forte um treino com pelo menos {MIN_FORTE} minutos somados em Z4 e Z5.
            Abaixo disso costuma ser o fim de uma subida, não um estímulo procurado.
          </p>
        </>
      )}

      <SectionTitle>Perfil semanal</SectionTitle>
      <Card i={9} pad={18}>
        <div style={s.eyebrow}>Minutos médios por dia da semana</div>
        <WeekdayChart perfil={st.perfilDia} />
        <p style={s.foot}>
          Seu dia mais forte é {DIAS_NOME[st.melhorDia]}. Dias com barra baixa mas não zerada são os
          que você começa e abandona — vale conferir se o horário está mesmo funcionando.
        </p>
      </Card>

      <SectionTitle>Eficiência cardíaca</SectionTitle>
      <Card i={10} pad={18}>
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
      <Card i={11} pad={0}>
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
