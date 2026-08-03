# Reorganização das abas Semana, Tendências e Análise

Proposta de rearranjo do conteúdo das três abas de estatística, com adições, remoções e
correções. Complementa o `ESTATISTICAS.md`, que trata da correção dos números; aqui a
pergunta é **onde cada número mora e se ele merece o espaço que ocupa**.

Nada aqui mexe em dado gravado.

---

## O diagnóstico, medido

Alturas reais medidas no navegador, viewport de 402×874 (iPhone), com os dados de
exemplo:

| Aba | Altura | Em telas | Cards | Seções |
|---|---|---|---|---|
| Semana | 2.856 px | **3,3** | 15 | 7 |
| Tendências | 3.243 px | **3,7** | 8 | 7 |
| Análise | 3.783 px | **4,3** | 14 | 6 |
| Histórico | 874 px | **1,0** | 3 | 2 |

Quatro achados saem daí, e três deles eu consegui confirmar por medição direta:

**1. A aba de check-in diário tem 3,3 telas.** "Semana" é a tela que a pessoa abre depois
de treinar, para ver se a semana está indo bem. Hoje ela obriga a rolar por recordes
vitalícios e por um card do mês antes de acabar. É a aba mais usada e a que menos respeita
o tempo de quem usa.

**2. Análise termina em seis cards de leitura automática, um atrás do outro.** Medido — os
cards da aba, em ordem: Forma atual, Projeção, Gestão de carga, Intensidade, Capacidade e
zonas, Zonas, Percepção, e então **Carga bem distribuída · Boa base de intensidade leve ·
FC caindo · Treinos ficaram mais densos · Quase nada em Zona 5 · Abaixo da recomendação**.
Seis parágrafos de conselho seguidos não são lidos: são rolados.

**3. O seletor 7 / 30 / 90 D move um gráfico de sete.** Medido comparando a assinatura de
todos os `<svg>` da aba antes e depois de trocar de 30 D para 90 D: dos **7 gráficos, 1
mudou**. Os outros seis são fixos em 28 dias, 17 semanas ou vida inteira. O controle está
no topo da aba, sugerindo que governa a aba.

**4. Os dois cards de "últimos 7 dias" mostram os mesmos quatro números.** Esse é meu:
o card que fizemos ontem tem minutos, treinos, carga e minutos equivalentes; o grid "Esta
semana", trinta pixels abaixo, tem exatamente os mesmos quatro, só que na semana do
calendário. Resolvi o problema da segunda-feira e deixei a duplicação na tela.

---

## Como cheguei à proposta

O pedido foi trabalhar em loop. Foram três passagens, e vale registrar as duas que
descartei — elas explicam por que a terceira é o que é.

**Passagem 1 — organizar por horizonte de tempo.** Semana = dias, Tendências = semanas,
Análise = o modelo. Descartei: sobravam duas coisas sem casa (o card do mês e a
consistência histórica), e a aba Semana ficava com dois cards. Além disso exigia renomear
abas, que é custo alto para ganho de arrumação.

**Passagem 2 — mover tudo que é histórico para a aba Histórico.** Melhor: aproveita a aba
mais vazia do app e é semanticamente honesto — recordes e totais de vida inteira *são* o
histórico. Mas Tendências inchava para dez blocos ao receber o que saía de Semana.

**Passagem 3 — a que ficou.** A passagem 2 mais três fusões que eu não tinha visto: os
dois cards de sete dias viram um, os dois gráficos de zona por semana viram um, e a tabela
"Semana a semana" sai porque repete em texto o que dois gráficos já mostram. Com isso
Tendências volta a sete blocos e Análise cai para seis.

**A conclusão que mudou entre a passagem 1 e a 3:** o problema nunca foi a divisão em
quatro abas. As quatro perguntas que o app responde — *como estou agora, estou melhorando,
devo mudar algo, o que eu fiz* — mapeiam bem nas quatro abas que existem. O problema é que
o conteúdo foi crescendo na aba errada.

---

## Princípio

> Cada aba responde a **uma** pergunta, e **nenhum número aparece em duas abas**.

| Aba | Pergunta | Janela |
|---|---|---|
| Semana | Como estou indo agora? | dias |
| Tendências | Estou melhorando? | semanas e meses |
| Análise | Devo mudar alguma coisa? | interpretação |
| Histórico | O que eu fiz? | tudo |

---

## Semana — de 15 cards para 5

**O que fica**

1. **Card herói** — a semana do calendário, com navegação, faixa de dias e barra de meta.
   Sem mudança.
2. **Os quatro números, uma vez só.** Fundir o card "Últimos 7 dias" com o grid "Esta
   semana". A janela móvel vence: ela não zera na segunda-feira, e é a que responde
   "como estou indo agora". O card herói continua sendo o calendário, porque é ele que
   tem a faixa de dias e a navegação.
3. **Distribuição por zona na semana.** Sem mudança.
4. **NOVO — "O que falta".** Ver adições, N1.
5. **NOVO — "Há N dias sem intensidade".** Ver adições, N2.

**O que sai, e para onde**

| Bloco | Vai para | Por quê |
|---|---|---|
| Consistência (heatmap + sequência) | Tendências | um mapa de calor de meses não é uma pergunta sobre esta semana |
| As 6 linhas de médias | Tendências | médias de vida inteira, mesma razão |
| Este mês (4 tiles) | Tendências | não é semana |
| Recordes | Histórico | é o resumo do registro |
| Desde o início | Histórico | idem |

**Resultado estimado:** de 3,3 telas para cerca de 1,5. A aba mais aberta do app passa a
caber quase inteira sem rolar.

---

## Tendências — o seletor passa a valer

**A mudança central:** o seletor 7 / 30 / 90 D governa a aba inteira. Todo gráfico que
aceita uma janela passa a obedecê-lo. O que não aceita — porque é por definição de outra
janela — sai da aba ou perde o seletor de forma explícita.

**O que fica**

1. **Minutos por zona** (obedece ao seletor, já obedece hoje).
2. **Zonas por semana, com alternador.** Fundir "Evolução da distribuição" e "Proporção de
   intensidade": são o mesmo dado, um normalizado em 100% e o outro em minutos absolutos.
   Um card com dois botões — *proporção* / *minutos* — em vez de dois cards com dois
   gráficos.
3. **Carga semanal** (LoadChart, com a média móvel).
4. **Perfil semanal** (minutos médios por dia da semana).
5. **Eficiência cardíaca**, corrigida — ver melhorias, M5.
6. **Consistência**, vinda de Semana: heatmap, sequência e as médias.
7. **Este mês**, vindo de Semana.

**O que sai**

| Bloco | Por quê |
|---|---|
| Volume acumulado (28 d vs 28 d) | mesma comparação que "Este mês" e que a carga semanal fazem, num terceiro formato |
| Semana a semana (10 linhas) | repete em tabela o que o LoadChart e o gráfico de zonas já desenham |

---

## Análise — de 14 cards para 6

**O que fica**

1. **Forma atual** — com o TSB corrigido para fechar com aptidão menos fadiga
   (`ESTATISTICAS.md` 1.1) e a aptidão semeada (2.2).
2. **Projeção de aptidão** — herda as duas correções acima.
3. **Gestão de carga** — razão aguda/crônica desacoplada e com porta de 21 dias,
   carga crônica, variação semanal em coeficiente de variação.
4. **Intensidade** — densidade, minutos equivalentes em 28 dias, **tempo fácil dos últimos
   28 dias** (hoje é vitalício e contradiz o comportamento recente), reserva cardíaca.
5. **Percepção de esforço** — correlação de postos contra densidade.
6. **Leituras: no máximo três**, escolhidas por relevância, e as demais atrás de um
   "ver mais". Seis parágrafos seguidos não são lidos.

**O que sai**

| Item | Destino | Por quê |
|---|---|---|
| Capacidade e zonas (VO₂, MET, FC máx, repouso, faixas) | **Ajustes** | VO₂ máx é digitado pelo usuário em Ajustes, com padrão 41,8. Exibi-lo de volta como "aptidão cardiorrespiratória excelente" é devolver o palpite da pessoa em forma de diagnóstico. As faixas de bpm são configuração. |
| Strain | remover | `ESTATISTICAS.md` 2.6 — a nota diz que só serve para comparar semanas, e o app nunca mostra outra semana |
| Monotonia | remover ou consertar | 2.4 — com 3 dias de descanso ela fica presa no verde; medido 1,14 |
| Contínuos e intervalados | remover | contagem vitalícia; nos dados de exemplo ela muda uma vez a cada poucas semanas |

**Resultado estimado:** de 4,3 telas para cerca de 2.

---

## Histórico — deixa de ser uma tela só

Recebe **Recordes** e **Desde o início**, que hoje ficam no fim da aba Semana. Passa de
1,0 para cerca de 2 telas, e a aba mais vazia do app deixa de ser vazia.

---

## Estatísticas novas

Cinco. Cada uma existe para responder algo que hoje fica sem resposta.

### N1 · "O que falta" — na aba Semana

Traduz a meta em ação. Hoje a barra mostra *0 de 150 min equivalentes · 0%*. A pergunta
que sobra é sempre a mesma: **quanto isso é em treinos?**

> Faltam **44 min equivalentes**. Dois treinos como os seus últimos resolvem.

O segundo número vem da mediana dos minutos equivalentes das últimas 8 sessões — mediana,
não média, para um treino atípico não distorcer. É a única estatística proposta aqui que
diz o que fazer em vez de descrever o que foi feito.

### N2 · Dias desde a última sessão com intensidade — na aba Semana

Uma sessão conta quando soma 4 min ou mais em Z4 e Z5, o mesmo corte que o app já usa para
classificar intervalados.

Hoje existe a leitura "Quase nada em Zona 5", que é vitalícia e não muda de uma semana
para outra. Um contador vivo — *"há 11 dias sem uma sessão de intensidade"* — responde a
mesma preocupação com um número que anda.

### N3 · Tempo fácil dos últimos 28 dias — na aba Análise

É correção e adição ao mesmo tempo. Medido: o número vitalício mostra **81,6%** — verde,
"boa base" — enquanto os últimos 28 dias somam **72,7%**, faixa em que o app daria o
conselho oposto. E quatro semanas treinando 100% em Z1 movem o vitalício apenas 4,4
pontos. Com janela de 28 dias ele passa a ser uma estatística de verdade, e não uma
constante.

### N4 · Regularidade — na aba Tendências

**% das últimas 12 semanas com pelo menos 3 treinos.**

Substitui a sequência de semanas, que é generosa demais: um único treino mantém a
sequência viva, então ela mede "apareceu" e não "manteve a rotina". A regularidade
distingue quem faz três a quatro treinos por semana de quem faz um.

### N5 · FC média em sessões comparáveis — na aba Tendências

O gráfico de eficiência cardíaca compara a FC média de sessões contínuas ao longo do
tempo. O problema é que a FC média depende da mistura de zonas: uma queda pode significar
condicionamento melhor **ou** treinos mais fáceis.

A proposta é restringir o gráfico a sessões cuja densidade fique dentro de ± 0,15 da
mediana — sessões parecidas entre si. Aí a queda de FC significa uma coisa só.

Nos dados de exemplo o confundidor não está ativo (densidade 1,92 na primeira sessão da
janela e 1,98 na última), então isto é blindagem, não correção de erro presente.

---

## Melhorias nas que ficam

Sete, quase todas vindas da auditoria. Ordenadas por relação entre ganho e esforço.

| # | Métrica | Mudança | Origem |
|---|---|---|---|
| M1 | Forma | passar a fechar com aptidão − fadiga | `ESTATISTICAS.md` 1.1 |
| M2 | Tempo fácil | janela de 28 dias | 2.1 / N3 |
| M3 | Razão aguda/crônica | denominador desacoplado + porta de 21 dias | 1.2 e 2.3 |
| M4 | Aptidão | semear em vez de partir de zero | 2.2 |
| M5 | Eficiência cardíaca | sessões comparáveis | N5 |
| M6 | Variação semanal | coeficiente de variação em vez de desvio absoluto | 2.7 |
| M7 | Percepção de esforço | Spearman contra densidade | 2.5 |

Duas fora da auditoria:

**M8 — a barra de meta ganha o ritmo esperado.** Hoje ela mostra o quanto foi feito. A
mesma barra pode mostrar, num tom mais claro, onde a pessoa *deveria* estar hoje se
distribuísse a meta pelos dias da semana. Transforma "0%" em "atrasado dois dias" sem
texto nenhum.

**M9 — o heatmap ganha uma escala.** Ele desenha intensidade por cor e não diz o que cada
tom vale. Três quadradinhos e dois rótulos resolvem.

---

## O que eu não faria

Registrado para não voltar como sugestão:

- **Não renomear as abas.** A passagem 1 pedia isso e o ganho não paga. Os quatro nomes
  atuais descrevem bem as quatro perguntas, desde que o conteúdo obedeça.
- **Não adicionar VO₂ máx estimado.** Seria possível estimar a partir de FC de repouso e
  idade, mas o app não pede idade, e trocar um palpite digitado por um palpite calculado
  não é ganho.
- **Não somar nenhuma métrica nova de carga.** TRIMP, aptidão, fadiga, forma, razão
  aguda/crônica e densidade já são seis maneiras de dizer "quanto você treinou". O
  problema desta aba é excesso, não falta.
- **Não mexer na deriva cardíaca nem em nada intra-sessão.** O app guarda minutos por zona,
  não a série de batimentos. Qualquer métrica desse tipo exigiria mudar o que é registrado.

---

## Ordem sugerida

**Primeiro, o que é subtração** — não quebra nada e o ganho aparece na hora: fundir os dois
cards de sete dias, mover Recordes e Desde o início para Histórico, mover Capacidade e
zonas para Ajustes, remover Strain, "Semana a semana" e "Volume acumulado", limitar as
leituras a três.

**Depois, as correções que a auditoria já justifica:** M1, M2, M3.

**Então as mudanças estruturais:** o seletor valendo para a aba, a fusão dos dois gráficos
de zona, e a migração de Consistência e Este mês para Tendências.

**Por último, as adições:** N1, N2, N4, e as melhorias M4 a M9.

Cada bloco é independente e pode virar um PR próprio. O primeiro sozinho já derruba Semana
de 3,3 para cerca de 2 telas e Análise de 4,3 para 3.
