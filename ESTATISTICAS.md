# Análise das estatísticas

Auditoria do motor de métricas — `src/lib/stats.js`, a tela `Analise.jsx` e as leituras
automáticas em `insights()`. Documento separado do `MELHORIAS.md` porque a pergunta aqui
é outra: não *o código está sadio*, e sim **os números estão certos e dizem o que
prometem**.

Todos os itens marcados **medido** vêm de execução real do motor sobre os dados de
exemplo do app (`seed()`, 133 dias, 3 a 4 treinos por semana) com a configuração padrão
(FC máx 193, repouso 58, meta 150). Os cálculos de conferência foram feitos fora do
motor, a partir das mesmas sessões, para não usar a peça auditada como régua de si
mesma.

Referências por **nome de função e de campo**, nunca por número de linha.

---

## P1 — O número exibido está errado

Nesta seção não há questão de método. São contradições internas ou valores que o app
mostra com confiança e que não se sustentam.

### 1.1 "Forma" não é a diferença entre aptidão e fadiga, apesar de o app dizer que é

**Medido**, dados de exemplo:

| O que o card mostra | Valor |
|---|---|
| Aptidão | 38,92 |
| Fadiga | 42,65 |
| **Forma** | **−9,88** |
| Aptidão − Fadiga | −3,72 |
| **Erro** | **6,16** |

O rodapé do próprio card afirma: *"A diferença entre as duas é a forma"*. Qualquer
pessoa que subtraia os dois números que estão logo acima encontra outro resultado.

**Causa.** Em `calcularStats`, o laço que constrói `pmc` lê `tsb` **antes** de atualizar
`ctl` e `atl` do dia, e devolve `ctl` e `atl` **depois**:

```js
const tsb = ctl - atl;      // véspera
ctl += (d.carga - ctl) / 42;  // hoje
atl += (d.carga - atl) / 7;   // hoje
return { date: d.date, ctl, atl, tsb };
```

Guardar a forma da véspera é convenção legítima e defensável — é como a maioria dos
softwares de ciclismo faz. O defeito não é o cálculo: é exibir na mesma linha um valor
de ontem e dois de hoje, dizendo que um é a diferença dos outros.

**Correção.** Duas saídas, e a escolha é de produto:
devolver `tsbHoje = ctl - atl` e mostrar esse (os três números passam a fechar), ou
manter a convecção da véspera e corrigir o texto do rodapé, exibindo a data à qual a
forma se refere. Prefiro a primeira: o usuário confere subtraindo, e um número que não
fecha destrói a confiança nos outros.

**Esforço:** minutos, mais um teste que trave a identidade.

### 1.2 Todo usuário novo recebe um alarme falso de carga no primeiro mês

**Medido**, recortando o histórico de exemplo em janelas crescentes:

| Histórico | ACWR exibido | Carga crônica | Leitura que o app dispara |
|---|---|---|---|
| 7 dias | **4,00** | 105 | "Carga subiu rápido — sua semana pesou 300% mais" |
| 14 dias | **3,28** | 128 | idem, 228% |
| 21 dias | 1,86 | 225 | idem, 86% |
| 28 dias | 1,29 | 324 | "Carga bem distribuída" |
| 60 dias | 1,29 | 324 | idem |

**Causa.** `cronica = sum(d28, trimp) / 4` divide por quatro semanas mesmo quando só
existe uma semana de histórico. O denominador é artificialmente pequeno, a razão
explode, e a leitura automática em `insights()` anuncia um salto de carga que não
aconteceu.

Isso não é um caso de borda: é o que **todo mundo** vê nas primeiras quatro semanas de
uso. É o pior tipo de erro de estatística num app pessoal — o número está errado
exatamente quando o usuário ainda está decidindo se confia no app.

**Correção.** Dividir pelo número de semanas efetivamente cobertas pelo histórico, e
não mostrar ACWR antes de 21 dias — abaixo disso o denominador não tem o que estimar.

**Esforço:** menos de uma hora, incluindo o teste.

### 1.3 Métricas com precisão de duas casas sobre três treinos

**Medido**, motor rodado sobre exatamente três sessões em três dias:

| Métrica | Valor exibido | Comentário |
|---|---|---|
| Razão aguda/crônica | 4,00 | ver 1.2 |
| Monotonia | **10,26** | a escala do app termina em 2,5 |
| Projeção do mês | **1.550 min** | 25 horas |
| Semanas que bateram a meta | 0 de 0 | frase sem conteúdo |
| Variação semanal | ± 0,0 min | "rotina perfeitamente previsível" |
| Média de minutos por semana | 0,0 | há três treinos registrados |

Nenhum desses números é sinalizado como preliminar. Todos aparecem com a mesma tipografia
e a mesma autoridade dos números maduros.

**Correção.** Uma porta de entrada por métrica, declarada num lugar só — algo como
`minimoDeHistorico = { acwr: 21, monotonia: 14, variacaoSemanal: 8 * 7, projecaoMes: 7 }`
— e um traço no lugar do número quando não houver dado suficiente, exatamente como já é
feito hoje quando `st.acwr` é `null`. O mecanismo existe; falta aplicá-lo.

**Esforço:** meio dia, quase todo em decidir os limiares.

### 1.4 A projeção do mês é aleatória nos primeiros dias

**Medido.** Hoje é dia 2. Com 50 min registrados, a projeção exibida é **775 min** —
`(50 / 2) × 31`. No dia 1, um único treino de 40 min projetaria 1.240 min no mês.

**Causa.** `projecaoMes: Math.round((mesAtual.minutos / diaDoMes) * diasNoMes)` não tem
piso de dias nem nenhuma suavização.

**Correção.** Não projetar antes do dia 7, e usar a média diária das últimas 4 semanas
como âncora nos primeiros dias do mês, migrando para os dados do mês corrente conforme
ele avança.

**Esforço:** uma hora.

---

## P2 — O número está certo, mas não sustenta o que promete

Aqui não há erro de conta. O problema é o casamento entre o que é calculado e o que é
afirmado na tela.

### 2.1 "Tempo fácil" contradiz o comportamento recente e quase não responde a mudança

**A mais séria desta seção.** Medido:

| | Valor | Faixa que o app atribuiria |
|---|---|---|
| Tempo fácil exibido (vida inteira) | **81,6%** | verde — *"Boa base de intensidade leve"* |
| Tempo fácil dos últimos 28 dias | **72,7%** | laranja — *"Muito tempo em intensidade média"* |

O app está elogiando uma proporção que o usuário **não pratica há um mês**. E a leitura
em `insights()` é escrita como conselho acionável — *"a alternativa é deixar os treinos
fáceis mais fáceis"* — sobre um número que não reage a ação.

Quanto ele reage, medido: simulei quatro semanas treinando **100% em Zona 1**, o extremo
absoluto do comportamento desejado. O número da vida inteira andou **4,4 pontos**, de
81,6% para 86,0%. Um mês de disciplina perfeita quase não move o ponteiro; e no sentido
inverso, um mês inteiro de erro também não acende a luz.

`polar` é calculado sobre `zoneTotals`, que soma `sessions` inteiro. Métrica vitalícia
serve para a seção "Desde o início". Não serve para um card de conselho.

**Correção.** Calcular sobre os últimos 28 dias, mesma janela da densidade que fica duas
linhas acima no mesmo card. Manter o número vitalício, se desejado, como linha em "Desde
o início", onde ele é o que promete ser.

**Esforço:** minutos. O impacto é o maior do documento.

### 2.2 A aptidão parte do zero e leva meses para significar alguma coisa

**Medido**, sobre os 133 dias de exemplo:

| Momento | Aptidão | % do patamar |
|---|---|---|
| Dia 42 | 15,1 | 33% |
| Dia 84 | 24,9 | 54% |
| Dia 133 (hoje) | 38,9 | 84% |
| Patamar teórico (carga diária média) | 46,3 | 100% |

`ctl` e `atl` começam em `0` no dia do primeiro treino registrado. Com constante de 42
dias, a convergência é lenta: mesmo depois de **quatro meses e meio** o número ainda está
16% abaixo do que a rotina do usuário sustenta.

Três consequências, em ordem de gravidade:

1. O card **Projeção de aptidão** extrapola a partir de um valor subestimado. Os três
   cenários ("Reduzir 20%", "Manter", "Subir 10%") herdam o viés inteiro.
2. A **forma** (`tsb = ctl − atl`) fica sistematicamente negativa nos primeiros meses,
   porque `atl` converge seis vezes mais rápido. O app dirá "Fadiga acentuada" para
   alguém que apenas começou a registrar.
3. Quem importa um CSV com histórico antigo **não** sofre disso — o que é bom, mas cria
   uma diferença silenciosa entre dois usuários com a mesma rotina.

**Correção.** Semear `ctl` e `atl` com a carga diária média das duas primeiras semanas,
em vez de zero. É uma linha, e é o que a literatura de ciclismo recomenda para
inicialização. Complementarmente, marcar os primeiros 42 dias da série no `PmcChart` com
opacidade menor e uma legenda "período de aquecimento do modelo" — honesto e barato.

**Esforço:** duas horas com o gráfico.

### 2.3 A razão aguda/crônica usa a janela acoplada, e o veredicto muda com isso

**Medido:**

| Método | Valor | Faixa |
|---|---|---|
| Acoplado — agudo dentro do crônico (o do app) | **1,29** | verde, "zona de progressão estável" |
| Desacoplado — crônico dos dias 8 a 28 | **1,43** | laranja, "atenção" |

Diferença de 10,7%, **e os dois lados de um limiar**. Não é uma sutileza acadêmica: os
dois métodos dão conselhos diferentes ao usuário no mesmo dia.

O acoplamento matemático da versão clássica é crítica conhecida na literatura desde 2019:
os últimos 7 dias entram no numerador e também no denominador, o que comprime
artificialmente a razão em direção a 1 e cria correlação espúria.

**Correção.** Trocar o denominador para os dias 8 a 28 (`sum(d28 excluindo w0) / 3`).
Uma linha. Vale registrar no rodapé qual variante está em uso — hoje a nota diz
"dividida pela média de 4 semanas", que descreve a acoplada sem dizer que é uma escolha.

**Esforço:** minutos, mais a revisão dos limiares da `escala`, que foram calibrados para
a outra variante.

### 2.4 Monotonia é estruturalmente "boa" para quem descansa

**Medido.** Dados de exemplo: monotonia **1,14**, faixa "bom". Carga dos últimos 7 dias:
`[90, 105, 0, 124, 0, 99, 0]` — **três dias parados**.

E o comportamento em função da frequência:

| Treinos iguais na semana | Monotonia |
|---|---|
| 1 | 0,41 — "bom" |
| 2 | 0,63 — "bom" |
| 3 | 0,87 — "bom" |
| 7 idênticos | — (desvio zero, o app mostra traço) |

A monotonia de Foster foi desenhada para atletas que treinam quase todos os dias, onde
a pergunta é *"seus dias são parecidos demais entre si?"*. Para uma rotina de 3 a 4
sessões semanais, os dias de descanso garantem desvio-padrão alto e a métrica fica presa
no verde independentemente do que a pessoa faça. Ela não distingue uma semana bem
distribuída de uma mal distribuída — só conta quantos dias estão zerados.

**Correção.** Duas opções honestas: restringir o cálculo aos dias com treino (passa a
medir o contraste **entre sessões**, que é a pergunta relevante para esta rotina), ou
remover a métrica e o insight que depende dela. Não vejo terceira: manter uma métrica
que só sabe dizer "bom" é ocupar espaço da tela com decoração.

**Esforço:** uma hora para a primeira opção.

### 2.5 A correlação RPE × carga é, em boa parte, correlação com a duração

**Medido:**

| Par | r de Pearson |
|---|---|
| RPE × TRIMP (o que o app exibe) | 0,771 |
| RPE × duração | 0,628 |
| RPE × densidade (TRIMP/min) | 0,787 |
| **TRIMP × duração** | **0,916** |

A última linha é a chave: **84% da variância do TRIMP é explicada pela duração**. Então
"correlação entre a sua percepção e a carga medida" é, em grande medida, a constatação de
que treino longo cansa mais — o que a pessoa já sabe sem o app.

Some-se que o RPE é uma escala ordinal de 1 a 10 e o Pearson pressupõe intervalo.

**Correção.** Exibir a correlação com a **densidade** (r = 0,787 aqui, e independente da
duração), que responde à pergunta interessante: *quando o treino é mais intenso por
minuto, você sente?* Trocar Pearson por **Spearman**, apropriado para escala ordinal e
robusto a outliers. Ambas são poucas linhas.

**Esforço:** duas horas com o teste da correlação de postos.

### 2.6 Strain é um número sem régua

**Medido:** 475. A nota diz *"serve para comparar semanas entre si, não contra um valor
absoluto"* — e o app **nunca mostra o strain de outra semana**. O usuário recebe um
número de três dígitos, é avisado de que ele só faz sentido em comparação, e não recebe
nenhuma comparação.

**Correção.** Ou uma linha de tendência das últimas 8 semanas ao lado do valor, ou
remoção. Como ele é o produto de duas grandezas já exibidas (carga da semana × monotonia),
e a monotonia está comprometida pelo 2.4, a remoção é defensável.

**Esforço:** duas horas para a série; minutos para remover.

### 2.7 A variação semanal em minutos absolutos não é comparável

**Medido:** ± 42,6 min sobre média semanal de 117,4 min — **coeficiente de variação de
36,3%**.

O desvio-padrão sozinho não permite julgar. ±40 min é rotina errática para quem faz 100
min por semana e é rotina bastante regular para quem faz 400. Além disso, "± 42,6 min"
sugere um intervalo garantido, quando um desvio-padrão cobre cerca de 68% das semanas.

**Correção.** Exibir o coeficiente de variação em porcentagem, com o desvio em minutos
como subtítulo.

**Esforço:** minutos.

---

## P3 — Peso morto

### 3.1 Sete campos calculados a cada render e nunca lidos

**Medido** por varredura de `st.<campo>` em todas as telas e gráficos: `calcularStats`
devolve **56 campos**, dos quais **7 não são lidos em lugar nenhum**:

`delta` · `cargaDiariaMedia` · `todasSemanas` · `densidade` · `rpeMedia` · `maiorDur` ·
`meses`

O `MELHORIAS.md` já registrava três deles; a varredura agora encontrou mais quatro.
`todasSemanas` é o mais caro: é a série semanal inteira do histórico, materializada e
descartada. (`cargaDiariaMedia` é usada *internamente* pelo fechamento `projetar`, então
só o campo exportado sobra.)

**Esforço:** minutos.

### 3.2 "Últimos 7 dias" é calculado duas vezes, por dois caminhos

**Medido:** `st.semana.minutos` = 191,0 e `montarJanela().minutos` = 191,0;
`st.semana.carga` = 418,0 e `montarJanela().carga` = 418,0. Idênticos.

`calcularStats` monta `w0` filtrando `date >= cut(6)`, e `montarJanela` faz o mesmo
recorte por outro caminho. Duas fontes de verdade para o mesmo intervalo é como as duas
fontes do campo `total` que o item 1.2 do `MELHORIAS.md` já corrigiu: funciona até
alguém mexer numa e esquecer a outra.

**Correção.** `calcularStats` passa a chamar `montarJanela` e a preencher `semana` a
partir dela.

**Esforço:** meia hora com os testes.

---

## Conferido e está certo

Registrado para não virar suspeita de novo. Estas eu levantei como hipótese e a medição
me desmentiu:

- **Reserva cardíaca usada, ponderada por duração.** Suspeitei que a média simples de
  `pctFCR` distorcesse, dando o mesmo peso a um treino de 10 e a um de 60 minutos.
  Medido: média simples **61,20%**, ponderada por minuto **61,18%**. Diferença de 0,02
  ponto. Não vale a mudança.

- **Tendência de FC e confusão com intensidade.** `deltaHr` regride a FC média contra o
  índice da sessão, não contra a data — 12 sessões podem cobrir 3 semanas ou 6 meses (nos
  dados de exemplo, cobrem 42 dias). E a FC média depende da mistura de zonas, então uma
  queda poderia significar apenas treinos mais fáceis. Medido: a densidade da primeira e
  da última sessão da janela é 1,92 e 1,98 — praticamente igual, então a leitura de −1,9
  bpm **não** está contaminada aqui. A fragilidade é estrutural, não ativa. Fica como
  observação, não como correção.

- **Densidade de carga como zona média.** `densidade28` = 2,16 TRIMP/min, e como os pesos
  do TRIMP são 1 a 5 por zona, isso é literalmente a zona média ponderada pelo tempo. A
  nota na tela explica exatamente assim. Correto e bem comunicado.

- **Médias da Consistência sobre semanas fechadas incluindo as vazias.** Confere com o
  que está documentado, e é a escolha certa: medir consistência excluindo as semanas
  paradas mediria a intensidade de quem aparece.

- **`mesAnterior` via dia 15 do mês anterior.** Evita o clássico bug de 31 de março
  menos um mês. Correto.

---

## Ordem sugerida

**Primeiro, porque são erros visíveis e baratos:** 1.1 (forma que não fecha), 2.1 (tempo
fácil vitalício), 1.2 (alarme falso do primeiro mês). Os três somam menos de meio dia e
são os que mais afetam a confiança nos números.

**Depois, o método:** 2.2 (semear a aptidão), 2.3 (desacoplar a razão), 1.3 (portas de
entrada), 1.4 (projeção do mês).

**Por último, a limpeza:** 3.1, 3.2, 2.7, e a decisão sobre 2.4 e 2.6 — que é decisão de
produto, não de correção: manter uma métrica que não discrimina custa espaço de tela e
atenção.

**Nada aqui muda dado gravado.** Todas as correções são de cálculo e de exibição; o
histórico de treinos permanece intacto em qualquer cenário.
