# Reorganização das abas — segunda rodada

Substitui a primeira versão deste documento. A v1 está resumida no fim, junto com o
motivo de eu tê-la abandonado.

Complementa o `ESTATISTICAS.md`, que trata da correção dos números. Aqui a pergunta é
**onde cada número mora, e se ele merece existir**.

Nada aqui mexe em dado gravado.

---

## Primeiro: onde a v1 estava errada

Quatro críticas à minha própria proposta anterior. Três delas eu confirmei medindo.

### C1 · Eu reorganizei por arrumação, não por uso

A v1 partia do princípio *"cada aba responde a uma pergunta"*. É um princípio bonito e
infalsificável — dá para encaixar qualquer conteúdo em qualquer pergunta depois do fato.
Ele arruma a gaveta sem perguntar se as coisas dentro dela deveriam estar ali.

### C2 · A v1 dizia que o problema é excesso, e propunha cinco métricas novas

Contradição direta. Se o diagnóstico é "está cheio demais", adicionar cinco só se
justifica se cada uma substituir algo — e a v1 não dizia o que sairia no lugar.

### C3 · A maquete foi desenhada com dados que a favoreciam

Inventei números curtos e cards enxutos. **Medido** sobre a própria maquete: o total do
app cairia de 12,3 para 7,6 telas, −38%. Mas parte disso é a maquete ser menos detalhada
que a tela real, não a proposta ser melhor. Uma redução de 38% é o mínimo que qualquer
rearranjo produz; não prova nada.

### C4 · A v1 não tocou no problema principal — e eu só o encontrei nesta rodada

**Medido**, aba Análise:

| | |
|---|---|
| Altura total da aba | 3.783 px — **4,3 telas** |
| Onde começa a seção "Leituras" | 2.592 px — **3,0 telas de rolagem** |
| Posição relativa | depois de **69%** da aba mais longa do app |
| Leituras exibidas | 6 cards · 1.181 caracteres · ~71 s de leitura |

**O motor de leituras é a única parte do app que diz o que fazer** — e está enterrado a
três telas de rolagem dentro da aba que ninguém abre por hábito. Tudo que vem antes dele
descreve; só ele aconselha.

A v1 encolhia a Análise de 4,3 para 2,4 telas e **deixava as leituras no mesmo lugar
relativo**: no fim. Arrumei a casa e mantive o que importa no último cômodo.

---

## A pergunta que eu não tinha feito

Não *"onde cada número mora"*, mas: **quantos destes números mudam alguma decisão?**

Levantei os **58 números distintos** que as três abas exibem e apliquei um teste único:
*se este valor mudasse, eu treinaria diferente na semana que vem?*

| Categoria | Quantos | O que são |
|---|---|---|
| **Decide** | **6** | mudam o que você faz |
| **Contextualiza** | 14 | explicam por que, mas não pedem ação |
| **Recompensa** | 13 | recordes e totais: existem pelo prazer de olhar |
| **Ruído** | **25** | não decidem, não explicam, não recompensam |

### Os 6 que decidem

1. **Minutos equivalentes contra a meta da semana** — treinar mais ou não
2. **Dias desde o último treino** — treinar hoje ou não
3. **Tempo fácil da janela recente** — deixar o treino de amanhã mais leve
4. **Razão aguda/crônica corrigida** — segurar ou subir o volume
5. **Dias sem sessão de intensidade** — incluir intensidade
6. **FC média em sessões comparáveis** — confirma que está funcionando

Cinco desses seis **já existem** no app. Nenhum deles está numa posição que se leia sem
rolar.

### Os 25 de ruído, nomeados

`Strain` (sem régua, ver `ESTATISTICAS.md` 2.6) · `Monotonia` (presa no verde, 2.4) ·
`VO₂ máx` e `MET` (eco do que você digitou em Ajustes) · `FC máx`, `FC repouso`,
`Reserva cardíaca` (idem) · `Faixas de zona em bpm` (configuração) ·
`Contínuos e intervalados` (**aparece duas vezes, em abas diferentes**) ·
`Reserva cardíaca usada` (61%, praticamente constante) · `Variação semanal` ·
`Correlação RPE` · `Projeção de aptidão`, três cenários · `Volume acumulado 28 d` ·
`Semana a semana`, 10 linhas · `Projeção do mês` (1.4 do `ESTATISTICAS.md`) ·
`Densidade, delta` · `Maior sequência` · `FC máxima registrada` · `Duração média` ·
`Dia que você mais treina` · `Carga acumulada` · `Minutos totais` · `Primeiro registro`

### E a duplicação que eu não tinha visto

**Minutos equivalentes aparecem em seis lugares:** barra de meta do herói, tile de
Últimos 7 dias, tile de Esta semana, tile de Este mês, linha de Desde o início, e
"Minutos equivalentes, 28 dias" na Análise. Seis janelas da mesma grandeza, três delas
na mesma tela.

**"Contínuos e intervalados" aparece duas vezes, em abas diferentes** — em "Desde o
início" (Semana) e em "Intensidade" (Análise), com o mesmo valor vitalício.

---

## O princípio, refeito

A v1 dizia: *uma pergunta por aba*. Errado, porque trata os 58 números como iguais e só
discute a gaveta.

> **v2: o app tem três camadas de profundidade, e a primeira tem que caber numa tela
> sem rolar.**

| Camada | O que é | Onde vive | Quanto ocupa |
|---|---|---|---|
| **1 · Decide** | os 6 números que mudam a semana | topo da aba Semana | **uma tela** |
| **2 · Contextualiza** | gráficos e séries, para entender o porquê | Tendências e Análise | livre |
| **3 · Recompensa** | recordes e totais | Histórico | livre |

O ruído não ganha camada. Sai.

---

## A mudança de maior impacto

**As leituras sobem para o topo da aba Semana, comprimidas em três linhas.**

Hoje: 6 cards de parágrafo, 71 segundos de leitura, a 3 telas de rolagem dentro da aba
mais longa.

Proposta: um card no alto da primeira aba, com **três linhas de uma frase cada**, cor de
estado à esquerda, e um toque para abrir o texto completo. O mesmo motor, a mesma
qualidade de escrita — a 0 pixels de rolagem em vez de 2.592.

Isto sozinho muda mais a experiência do que toda a reorganização da v1.

---

## As abas, na v2

### Semana — a camada 1

1. **Card de leituras** — três linhas. Novo lugar, motor existente.
2. **Card herói** — semana, faixa de dias, barra de meta com a marca do ritmo esperado.
3. **Os quatro números, uma vez só** — hoje aparecem duas vezes na mesma tela.
4. **Distribuição por zona da semana.**

Saem: Consistência, médias, Este mês, Recordes, Desde o início.

### Tendências — a camada 2, o que aconteceu

Seletor 7/30/90 valendo para a aba inteira (hoje move 1 gráfico de 7) · Minutos por
zona · Zonas por semana com alternador *proporção / minutos* (dois cards de hoje viram
um) · Carga semanal · Perfil semanal · Eficiência cardíaca corrigida · Consistência,
vinda de Semana.

Saem: Volume acumulado, Semana a semana, Este mês (vira uma linha na Consistência).

### Análise — a camada 2, o que isso significa

Forma (com o TSB que fecha) · Projeção · Gestão de carga: razão aguda/crônica
desacoplada, carga crônica · Intensidade: densidade, equivalentes 28 d, tempo fácil de
28 dias · Leituras completas.

Saem: Capacidade e zonas → **Ajustes** · Strain · Monotonia · Contínuos e intervalados ·
Variação semanal · Percepção de esforço → só quando houver 15+ registros de RPE, em vez
de 6.

### Histórico — a camada 3

Recebe Recordes e Desde o início.

---

## Estatísticas novas: duas, não cinco

A v1 propunha cinco. Cortei três, porque violavam o próprio diagnóstico.

**N1 · "O que falta"** — *"faltam 44 min equivalentes; dois treinos como os seus últimos
resolvem"*. É a única estatística do app que diz o que fazer. **Substitui** a linha
"Semanas que bateram a meta", que é retrospectiva.

**N2 · Dias sem sessão de intensidade** — contador vivo. **Substitui** a leitura "Quase
nada em Zona 5", que é vitalícia e não muda de semana para semana.

**Cortadas da v1:** *Regularidade* (é contexto, não decisão — e já há heatmap, sequência
e média de treinos medindo a mesma coisa), *Tempo fácil de 28 dias* (é correção,
`ESTATISTICAS.md` 2.1, não estatística nova), *FC em sessões comparáveis* (idem, é
correção do gráfico existente).

---

## O que testei nesta rodada e descartei

**Fundir Tendências e Análise em uma aba só.** As duas são camada 2 e se sobrepõem em
carga, intensidade e frequência cardíaca. Descartei por dois motivos, um fraco e um
forte:

- *fraco:* a aba fundida daria ~4 telas, longa demais mesmo para leitura ocasional;
- *forte:* **o botão + fica no centro da barra**, entre duas abas de cada lado. Com três
  abas a simetria quebra e o botão de registrar — a ação mais frequente do app — sai do
  centro. Não vale trocar a ergonomia do gesto principal por arrumação.

**Renomear as abas.** Testado na v1 e descartado de novo. Os nomes descrevem bem as três
camadas, desde que o conteúdo obedeça.

---

## Ordem sugerida

| # | O quê | Ganho | Risco |
|---|---|---|---|
| 1 | Leituras para o topo da Semana, em três linhas | o maior de todos | baixo |
| 2 | Fundir os dois cards de sete dias | tira a duplicação mais visível | nenhum |
| 3 | Mover Recordes e Desde o início para Histórico | −1,2 tela na aba mais usada | nenhum |
| 4 | Remover os 25 de ruído, começando por Capacidade e zonas | −1 tela na Análise | baixo |
| 5 | Correções do `ESTATISTICAS.md`: M1, M2, M3 | números que param de se contradizer | médio |
| 6 | Seletor valendo para a aba, fusão dos gráficos de zona | tira a promessa falsa do controle | médio |
| 7 | N1 e N2 | as duas únicas adições | baixo |

Os quatro primeiros são subtração e mudança de lugar. Não tocam em cálculo nenhum, e
sozinhos resolvem o que a medição apontou.

---

## Apêndice — a v1, e por que caiu

A v1 propunha o mesmo rearranjo de abas desta versão, mas partia de *"uma pergunta por
aba"*, adicionava cinco estatísticas, e não mexia na posição das leituras. Ela arrumava
a distribuição do conteúdo sem perguntar quanto do conteúdo deveria existir.

O que sobreviveu dela: mover Recordes e Desde o início para Histórico, mover Capacidade
e zonas para Ajustes, fundir os dois cards de sete dias, fundir os dois gráficos de zona,
fazer o seletor valer para a aba, e as correções vindas da auditoria.

O que morreu: o princípio, três das cinco estatísticas novas, e a ideia de que o problema
era o arranjo.
