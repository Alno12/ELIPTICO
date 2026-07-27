import { fmt } from "../lib/util.js";
import { ZONES, faixa } from "../lib/treino.js";
import { escala, escalaFacil } from "../lib/stats.js";
import { C, s, ICONS } from "../estilos.js";
import { LargeTitle, SectionTitle, Card, Empty } from "../ui/estrutura.jsx";
import { Metric, LegendItem, Insight, Line } from "../ui/primitivos.jsx";
import { ProjChart } from "../graficos/ProjChart.jsx";
import { PmcChart } from "../graficos/PmcChart.jsx";
import { RpeScatter } from "../graficos/RpeScatter.jsx";

function Analise({ st, cfg }) {
  if (!st)
    return (
      <>
        <LargeTitle title="Análise" />
        <Empty />
      </>
    );

  const tsb = st.forma.tsb;
  const estado =
    tsb > 8
      ? {
          t: "Descansado",
          c: C.blue,
          d: "Fadiga baixa em relação à sua base. Bom momento para um treino mais forte.",
        }
      : tsb > -8
        ? {
            t: "Equilibrado",
            c: C.green,
            d: "Carga recente compatível com a base que você construiu.",
          }
        : tsb > -20
          ? {
              t: "Carga produtiva",
              c: C.orange,
              d: "Você está treinando acima da base. Sustentável por algumas semanas, não indefinidamente.",
            }
          : {
              t: "Fadiga acentuada",
              c: C.red,
              d: "A carga recente está bem acima da base. Uma semana mais leve costuma resolver.",
            };

  const dens28 = st.densidade28;
  const densDelta = dens28 != null && st.densidade28ant != null ? dens28 - st.densidade28ant : null;
  const cenarios = [
    { l: "Reduzir 20%", f: 0.8, c: C.blue },
    { l: "Manter", f: 1, c: C.green },
    { l: "Subir 10%", f: 1.1, c: C.orange },
  ].map((x) => ({ ...x, v: st.projetar(x.f) }));

  const vo2 = cfg.vo2max;
  const classeVo2 =
    vo2 >= 48 ? "excelente" : vo2 >= 42 ? "boa" : vo2 >= 36 ? "regular" : "abaixo da média";

  return (
    <>
      <LargeTitle title="Análise" />

      <Card i={0} pad={18}>
        <div style={s.eyebrow}>Forma atual</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3 }}>
          <span style={{ ...s.big, color: estado.c }}>
            {tsb > 0 ? "+" : ""}
            {fmt(tsb, 1)}
          </span>
          <span style={{ ...s.insightTag, color: estado.c, fontSize: 15 }}>{estado.t}</span>
        </div>
        <div style={s.sub}>{estado.d}</div>
        <PmcChart pmc={st.pmc} />
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <LegendItem color={C.blue} label="Aptidão" value={fmt(st.forma.ctl, 1)} />
          <LegendItem color={C.orange} label="Fadiga" value={fmt(st.forma.atl, 1)} />
          <LegendItem
            color={estado.c}
            label="Forma"
            value={`${tsb > 0 ? "+" : ""}${fmt(tsb, 1)}`}
          />
        </div>
        <p style={s.foot}>
          Aptidão é a média ponderada da sua carga em 42 dias; fadiga, a mesma coisa em 7 dias. A
          diferença entre as duas é a forma: positiva quando você está mais descansado que treinado.
        </p>
      </Card>

      <SectionTitle>Projeção de aptidão</SectionTitle>
      <Card i={1} pad={18}>
        <div style={s.eyebrow}>Onde sua aptidão estará em 4 semanas</div>
        <ProjChart atual={st.forma.ctl} cenarios={cenarios} />
        {cenarios.map((c, i) => (
          <div key={c.l} style={{ ...s.row, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.dot, background: c.c }} />
            <span style={{ flex: 1, ...s.rowLabel }}>{c.l}</span>
            <span style={s.rowValue}>{fmt(c.v, 1)}</span>
            <span style={{ ...s.rowSub, marginLeft: 8, minWidth: 42, textAlign: "right" }}>
              {c.v > st.forma.ctl ? "+" : ""}
              {fmt(c.v - st.forma.ctl, 1)}
            </span>
          </div>
        ))}
        <p style={s.foot}>
          Simulação do mesmo modelo de 42 dias, assumindo que você mantenha a média diária das
          últimas 4 semanas multiplicada por cada fator. É uma extrapolação matemática, não uma
          promessa fisiológica.
        </p>
      </Card>

      <SectionTitle>Gestão de carga</SectionTitle>
      <Card i={2} pad={0}>
        <Metric
          first
          label="Razão aguda / crônica"
          value={st.acwr != null ? fmt(st.acwr, 2) : "—"}
          faixa={st.acwr != null ? escala(st.acwr, [0.8, 1.3, 1.5]) : null}
          nota="Carga dos últimos 7 dias dividida pela média de 4 semanas. Entre 0,8 e 1,3 costuma ser a zona de progressão estável."
        />
        <Metric
          label="Monotonia"
          value={st.monotonia != null ? fmt(st.monotonia, 2) : "—"}
          faixa={st.monotonia != null ? escala(st.monotonia, [1.3, 2, 2.5], true) : null}
          nota="Média da carga diária dividida pelo desvio-padrão dos últimos 7 dias. Valores altos indicam semana uniforme demais, sem dias leves de verdade."
        />
        <Metric
          label="Strain"
          value={st.strain != null ? fmt(st.strain) : "—"}
          nota="Carga da semana multiplicada pela monotonia. Serve para comparar semanas entre si, não contra um valor absoluto."
        />
        <Metric
          label="Carga crônica"
          value={fmt(st.cronica)}
          nota="Média semanal de TRIMP nas últimas 4 semanas. É a base sobre a qual as outras métricas são comparadas."
        />
        <Metric
          label="Variação semanal"
          value={`± ${fmt(st.variacaoSemanal)} min`}
          nota="Desvio-padrão dos minutos nas últimas 8 semanas fechadas. Quanto menor, mais previsível é a sua rotina."
        />
      </Card>

      <SectionTitle>Intensidade</SectionTitle>
      <Card i={3} pad={0}>
        <Metric
          first
          label="Densidade de carga"
          value={dens28 != null ? `${fmt(dens28, 2)} /min` : "—"}
          delta={
            densDelta != null
              ? `${densDelta > 0 ? "+" : ""}${fmt(densDelta, 2)} vs. 28 dias anteriores`
              : null
          }
          nota="TRIMP por minuto nos últimos 28 dias. Equivale à zona média dos seus treinos: 2,0 é uma rotina de base, acima de 2,8 é uma rotina intensa."
        />
        <Metric
          label="Minutos equivalentes, 28 dias"
          value={fmt(st.equiv28)}
          nota="Zona 1 não conta, Zonas 2 e 3 valem 1× e Zonas 4 e 5 valem 2×. É a equivalência entre atividade moderada e vigorosa por trás da recomendação de 150 min semanais: 1 min vigoroso conta como 2 moderados."
        />
        <Metric
          label="Tempo fácil"
          value={`${fmt(st.polar)}%`}
          faixa={escalaFacil(st.polar)}
          nota="Proporção do tempo total em Z1 e Z2. A literatura de treino polarizado costuma trabalhar perto de 80%."
        />
        <Metric
          label="Reserva cardíaca usada"
          value={st.pctFCR != null ? `${fmt(st.pctFCR)}%` : "—"}
          nota={`Média de (FC do treino − ${cfg.restHr}) ÷ (${cfg.maxHr} − ${cfg.restHr}) nos últimos 28 dias.`}
        />
        <Metric
          label="Contínuos e intervalados"
          value={`${st.continuos} · ${st.intervalados}`}
          nota="Sessões com 4 min ou mais em Z4 e Z5 contam como intervaladas."
        />
      </Card>

      <SectionTitle>Capacidade e zonas</SectionTitle>
      <Card i={4} pad={0}>
        <Line
          first
          label="VO₂ máx"
          value={`${fmt(vo2, 1)} ml/kg/min`}
          sub={`Aptidão cardiorrespiratória ${classeVo2}`}
        />
        <Line
          label="Equivalente em MET"
          value={fmt(vo2 / 3.5, 1)}
          sub="Acima de 10 MET associa-se a bom prognóstico"
        />
        <Line label="FC máxima" value={`${cfg.maxHr} bpm`} />
        <Line label="FC de repouso" value={`${cfg.restHr} bpm`} />
        <Line label="Reserva cardíaca" value={`${cfg.maxHr - cfg.restHr} bpm`} />
      </Card>
      <Card i={5} pad={0}>
        {ZONES.map((z, i) => (
          <div key={z.id} style={{ ...s.field, borderTop: i ? `0.5px solid ${C.sep}` : "none" }}>
            <span style={{ ...s.zoneBadge, background: z.color }}>{z.short}</span>
            <div style={{ flex: 1 }}>
              <div style={s.rowLabel}>{z.name}</div>
              <div style={s.rowSub}>
                {fmt((st.zoneTotals[z.id] / st.grand) * 100)}% do seu tempo
              </div>
            </div>
            <span style={s.mono}>{faixa(cfg, i)} bpm</span>
          </div>
        ))}
      </Card>

      <SectionTitle>Percepção de esforço</SectionTitle>
      <Card i={6} pad={18}>
        {st.rpeCorr != null ? (
          <>
            <div style={s.eyebrow}>Correlação entre RPE e carga</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
              <span style={{ ...s.big, color: st.rpeCorr > 0.6 ? C.green : C.orange }}>
                {fmt(st.rpeCorr, 2)}
              </span>
              <span style={s.unit}>r de Pearson</span>
            </div>
            <div style={s.sub}>
              {st.rpeCorr > 0.7
                ? "Sua percepção acompanha bem a carga medida pelo relógio."
                : st.rpeCorr > 0.4
                  ? "Percepção e carga andam juntas, mas com folga. Vale observar os treinos que fogem da linha."
                  : "Sua percepção não está acompanhando a carga objetiva. Costuma acontecer com sono ruim, calor ou estresse fora da academia."}
            </div>
            <RpeScatter pontos={st.rpePontos} />
            <p style={s.foot}>
              Cada ponto é um treino: carga no eixo horizontal, esforço percebido no vertical.
              Pontos acima da linha foram mais difíceis do que os números sugerem.
            </p>
          </>
        ) : (
          <p style={{ ...s.foot, marginTop: 0 }}>
            Registre o esforço percebido em pelo menos 6 treinos para ver esta análise.
          </p>
        )}
      </Card>

      <SectionTitle>Leituras</SectionTitle>
      {insights(st).map((x, i) => (
        <Insight key={x.t} data={x} i={8 + i} />
      ))}

      <Card>
        <p style={{ ...s.foot, marginTop: 0 }}>
          TRIMP, monotonia, strain e a razão aguda/crônica são heurísticas de carga de treino vindas
          da fisiologia do exercício, úteis para comparar as suas próprias semanas. Não são medidas
          validadas para prever lesão em indivíduos, e os limiares aqui são referências práticas,
          não pontos de corte.
        </p>
      </Card>
    </>
  );
}

/* ================= tela: histórico ================= */

function insights(st) {
  const out = [];

  if (st.acwr != null) {
    const v = st.acwr,
      alto = v > 1.45,
      baixo = v < 0.8;
    out.push({
      tag: fmt(v, 2),
      icon: ICONS.carga,
      c: alto ? C.orange : baixo ? C.blue : C.green,
      t: alto ? "Carga subiu rápido" : baixo ? "Semana mais leve" : "Carga bem distribuída",
      d: alto
        ? `Sua semana pesou ${fmt((v - 1) * 100)}% mais que a média das últimas quatro. Saltos assim costumam vir acompanhados de cansaço acumulado — repetir o volume atual antes de subir de novo é o caminho mais seguro.`
        : baixo
          ? "A carga dos últimos 7 dias ficou abaixo da sua média recente. Se foi intencional, funciona bem como semana de recuperação."
          : "A carga dos últimos 7 dias está próxima da média das últimas quatro semanas, que é onde a progressão costuma se sustentar.",
    });
  }

  if (st.monotonia != null && st.monotonia > 2) {
    out.push({
      tag: fmt(st.monotonia, 2),
      icon: ICONS.balanca,
      c: C.orange,
      t: "Semana uniforme demais",
      d: `Monotonia em ${fmt(st.monotonia, 2)}: seus dias tiveram carga muito parecida entre si. Semanas com contraste — dias claramente leves e um ou dois claramente puxados — costumam render mais adaptação.`,
    });
  }

  const tsb = st.forma.tsb;
  if (tsb < -18 || tsb > 12) {
    out.push({
      tag: `${tsb > 0 ? "+" : ""}${fmt(tsb, 1)}`,
      icon: ICONS.relogio,
      c: tsb > 0 ? C.blue : C.red,
      t: tsb > 0 ? "Você está descansado" : "Fadiga acima da base",
      d:
        tsb > 0
          ? "Sua fadiga está bem abaixo da aptidão acumulada. É um bom momento para uma sessão mais longa ou mais intensa, se quiser subir o volume."
          : "Sua carga recente está bem acima da base de 6 semanas. Não é um problema em si — é assim que se progride — mas costuma pedir uma semana mais leve depois de duas ou três assim.",
    });
  }

  const p = st.polar;
  out.push({
    tag: `${fmt(p)}%`,
    icon: ICONS.zonas,
    c: p >= 75 ? C.green : C.orange,
    t: p >= 75 ? "Boa base de intensidade leve" : "Muito tempo em intensidade média",
    d:
      p >= 75
        ? `${fmt(p)}% do seu tempo está em Z1 e Z2. Essa proporção alta de treino fácil é o que permite manter volume sem acumular fadiga.`
        : `Só ${fmt(p)}% do seu tempo está em Z1 e Z2. Treinar quase sempre em Z3 tende a cansar mais do que render; a alternativa é deixar os treinos fáceis mais fáceis e concentrar a intensidade em uma ou duas sessões da semana.`,
  });

  if (st.deltaHr != null && Math.abs(st.deltaHr) >= 1) {
    const queda = st.deltaHr < 0;
    out.push({
      tag: `${st.deltaHr > 0 ? "+" : ""}${fmt(st.deltaHr, 1)}`,
      icon: ICONS.coracao,
      c: queda ? C.green : C.purple,
      t: queda ? "FC caindo nos treinos contínuos" : "FC subindo nos treinos contínuos",
      d: queda
        ? `Nas últimas ${st.hrSes.length} sessões contínuas sua FC média caiu cerca de ${fmt(Math.abs(st.deltaHr), 1)} bpm. Sustentar um esforço parecido com FC menor é o sinal mais direto de condicionamento melhorando.`
        : `Nas últimas ${st.hrSes.length} sessões contínuas sua FC média subiu cerca de ${fmt(st.deltaHr, 1)} bpm. Pode ser aumento real de intensidade, mas também aparece com sono ruim, calor na academia ou fadiga acumulada.`,
    });
  }

  if (st.densidade28 != null && st.densidade28ant != null) {
    const d = st.densidade28 - st.densidade28ant;
    if (Math.abs(d) >= 0.12) {
      out.push({
        tag: `${d > 0 ? "+" : ""}${fmt(d, 2)}`,
        icon: ICONS.raio,
        c: d > 0 ? C.orange : C.blue,
        t: d > 0 ? "Treinos ficaram mais densos" : "Treinos ficaram mais leves",
        d: `A densidade passou de ${fmt(st.densidade28ant, 2)} para ${fmt(st.densidade28, 2)} TRIMP por minuto entre os dois últimos blocos de 28 dias. ${d > 0 ? "Você está tirando mais carga de cada minuto — vale conferir se o volume total não subiu junto." : "Cada minuto está pesando menos, o que combina com uma fase de volume ou de recuperação."}`,
      });
    }
  }

  if (st.rpeCorr != null && st.rpeCorr < 0.45) {
    out.push({
      tag: fmt(st.rpeCorr, 2),
      icon: ICONS.balanca,
      c: C.purple,
      t: "Percepção descolada da carga",
      d: `A correlação entre o seu RPE e a carga medida está em ${fmt(st.rpeCorr, 2)}. Quando os treinos parecem mais duros do que os números indicam de forma repetida, o fator costuma estar fora da academia: sono, alimentação, estresse ou calor.`,
    });
  }

  const z5 = st.zoneTotals.z5;
  if (st.grand && (z5 / st.grand) * 100 < 1.5) {
    out.push({
      tag: "Z5",
      icon: ICONS.raio,
      c: C.blue,
      t: "Quase nada em Zona 5",
      d: `Você tem ${fmt(z5)} min acumulados em Z5. Não é um problema — dá para progredir bastante sem tocar essa faixa. Se quiser subir o teto aeróbico, blocos curtos de 30 a 60 segundos no elíptico dão conta.`,
    });
  }

  if (st.desdeUltimo >= 4) {
    out.push({
      tag: `${st.desdeUltimo}d`,
      icon: ICONS.calendario,
      c: C.orange,
      t: "Alguns dias sem treinar",
      d: `Seu último registro foi há ${st.desdeUltimo} dias, contra um intervalo médio de ${fmt(st.intervaloMedio, 1)} dias. Pausas curtas custam pouco: a aptidão cai devagar e volta rápido.`,
    });
  }

  const eq = st.semana.equiv;
  out.push({
    tag: fmt(eq),
    icon: ICONS.meta,
    c: eq >= 150 ? C.green : C.orange,
    t: eq >= 150 ? "Acima da recomendação semanal" : "Abaixo da recomendação semanal",
    d: `A referência para adultos é de 150 a 300 min semanais de atividade aeróbica moderada, com 1 min vigoroso valendo 2. Você somou ${fmt(eq)} min equivalentes — de ${fmt(st.semana.minutos)} min de treino — em ${st.semana.sessoes} ${st.semana.sessoes === 1 ? "treino" : "treinos"} nos últimos 7 dias.`,
  });

  return out;
}

/* ================= interface ================= */

/* Reset e animações usados por toda a interface. Fica num componente próprio
   porque a tela de recuperação renderiza fora do Shell — sem isto ela sairia
   com a fonte serifada do navegador e os botões com a borda padrão. */

export { Analise };
