# Melhorias futuras

Levantamento refeito do zero sobre o estado atual do código, substituindo a versão
anterior — que envelheceu junto com as mudanças e ficou com todas as referências de
linha apontando para o lugar errado.

Cada item diz **como foi apurado**. Onde está escrito *medido*, o número saiu de um
experimento reproduzível descrito no próprio item. Onde está escrito *leitura de
código*, é análise sem reprodução. A diferença importa na hora de decidir se vale
confiar sem verificar.

As referências apontam para **nomes de função e de componente**, não para números de
linha. A versão anterior deste documento citava linhas, e todas apodreceram em duas
semanas de mudanças — um nome sobrevive à edição vizinha, um número não.

Estado de referência: `App.jsx` com 258 linhas (era 2.308 antes da separação),
164 testes em Vitest e 42 em Playwright, pacote de 225 kB (70 kB comprimido).

**Já resolvido** (não repetir): datas em fuso local, contador de sequência de semanas,
contradição do "Tempo fácil", ressemeadura dos exemplos, PWA instalável e offline,
importação de CSV, vazamento da janela de 17 semanas, extração da lógica pura e suíte
de testes, plano de 10 semanas removido, registro em minutos e segundos, minutos
equivalentes, médias da Consistência, recordes da semana corrente, separação do
App.jsx em módulos,
"FC máxima registrada: 0 bpm", normalização dos dados na leitura, tela de
recuperação, faixa plausível de FC e RPE, contraste do texto neutro, testes de
interface versionados, lint e CI.

---

## P1 — O app pode parar de abrir

### 1.1 Registro malformado deixava a tela em branco — RESOLVIDO

Uma sessão sem o campo `zones` fazia `calcularStats` acessar `x.zones.z1` e derrubar
a árvore inteira, sem caminho de recuperação de dentro do app.

Duas camadas: `src/lib/sessoes.js` normaliza tudo que vem do armazenamento — zona
ausente vira 0, registro irrecuperável é descartado com aviso — e um error boundary
mostra uma tela de recuperação, que oferece baixar uma cópia bruta dos dados antes
de limpar.

Cada camada foi verificada desligando a outra: sem a normalização caem 4 testes,
sem o limite caem 3.

### 1.2 `total` divergia das zonas — RESOLVIDO

`total` passou a ser derivado das zonas na normalização, em vez de lido do
armazenamento. Eram duas fontes de verdade para o mesmo número: uma sessão gravada
com `total: 9999` e zonas somando 60 exibia 9999.

### 1.3 FC média e máxima aceitam qualquer valor — RESOLVIDO

Faixa de 30 a 250 bpm, e esforço percebido de 1 a 10, aplicados nos três caminhos
de entrada: o formulário recusa com mensagem, e a leitura do armazenamento e a
importação de CSV tratam o valor como desconhecido.

Fora da faixa vira **nulo, não o limite**: um 1500 gravado por engano não vira
250 bpm, porque 250 pareceria uma leitura real que a pessoa nunca fez.
Desconhecido é mais honesto que inventado. Isso mudou também o RPE, que antes era
ajustado em silêncio de 99 para 10.

---

## P2 — Acessibilidade

Subiu de prioridade em relação ao levantamento anterior porque o item de contraste
deixou de ser suspeita e virou medição: ele afeta praticamente todo o texto de apoio
do app, o tempo inteiro, e não só em situações de exceção.

### 2.1 Contraste do texto neutro — RESOLVIDO

`C.sec` foi de 0,6 para 0,725 de opacidade e `C.ter` de 0,28 para 0,565. Medido
sobre os dois fundos usados:

| Cor | Antes | Depois | Mínimo |
|---|---|---|---|
| `C.sec` (texto de apoio) | 3,44:1 | **4,78:1** | 4,5:1 |
| `C.ter` (rótulo de eixo) | 1,67:1 | **3,14:1** | 3:1 |

Coberto por teste de navegador que calcula a razão a partir das cores realmente
computadas na página, não das constantes do código.

### 2.2 As folhas modais não são diálogos

**Leitura de código.** O componente `Sheet`, em `src/App.jsx`, é um `<div>` dentro
de outro `<div>`. Falta tudo o que caracteriza um diálogo:

- sem `role="dialog"` e sem `aria-modal`
- sem armadilha de foco — dá para tabular para fora da folha aberta e continuar
  navegando pelo conteúdo atrás dela
- sem fechamento com Esc
- sem bloqueio do rolamento do fundo
- sem devolução do foco ao elemento que abriu a folha
- o fundo escurecido é um `<div>` com `onClick` (`s.sheetWrap`, no mesmo componente), sem
  `role="presentation"`, invisível para o teclado

Para quem usa teclado ou leitor de tela, abrir "Novo treino" significa perder a
referência de onde está.

**Abordagem sugerida.** Trocar por `<dialog>` nativo, que resolve foco, Esc e camada
de sobreposição de graça, ou aplicar as marcações e o gerenciamento de foco à mão.

**Esforço:** meio dia.

### 2.3 Dezesseis gráficos sem alternativa textual

**Medido.** 16 elementos `<svg>` no arquivo, nenhum com `role="img"`. Doze deles são
visualizações de dados: `CumulativeChart`, `ZoneEvolution`, `WeekdayChart`,
`ProjChart`, `PmcChart`, `ZoneBars`, `LoadChart`, `IntensityChart`, `HrChart`,
`RpeScatter`, `Heatmap` e a faixa de dias da semana.

Para um leitor de tela, a aba Tendências inteira é uma página em branco. As células do
heatmap são `<rect>` clicáveis, sem nome acessível.

**Abordagem sugerida.** `role="img"` mais um `aria-label` de uma frase por gráfico,
gerado dos mesmos dados que ele desenha — "carga semanal, 12 semanas, de 180 a 320
TRIMP, tendência de alta". Uma frase resolve mais que qualquer descrição estrutural.

**Esforço:** meio dia para o conjunto.

### 2.4 Itens menores — RESOLVIDOS, menos um por decisão

- **`aria-current`** passou a emitir `"page"` ou nada, em vez do inválido `"false"`.
- **Campos sem rótulo**: data, notas e os três campos numéricos ganharam
  `aria-label`. Coberto por teste que reprova qualquer `input` ou `textarea` sem
  nome acessível.
- **`prefers-reduced-motion`** já estava tratado.
- **`maximum-scale=1`** foi **mantido por decisão** — está registrado em
  "Limitações conhecidas e aceitas".

### 2.5 As cores de destaque reprovam o contraste

**Medido.** Apareceu ao escrever o teste do item 2.1, que a princípio reprovava
muito além do texto neutro.

Como **texto** sobre o card branco:

| Cor | Razão | Número grande (3:1) | Texto pequeno (4,5:1) |
|---|---|---|---|
| verde `#30D158` | 2,02:1 | reprova | reprova |
| laranja `#FF9F0A` | 2,06:1 | reprova | reprova |
| vermelho `#FF375F` | 3,52:1 | ok | reprova |
| roxo `#BF5AF2` | 3,52:1 | ok | reprova |
| azul `#007AFF` | 4,02:1 | ok | reprova |

O verde aparece nos minutos da semana e em toda variação positiva ("↑ 2 vs.
anterior", 12,5 px); o laranja, na carga em TRIMP.

E como texto **branco sobre selo colorido** — os números de zona, que precisam de
4,5:1 por serem pequenos:

| | Razão |
|---|---|
| Zona 1 `#5AC8FA` | 1,90:1 |
| Zona 2 `#30D158` | 2,02:1 |
| Zona 3 `#FFD60A` | **1,41:1** |
| Zona 4 `#FF9F0A` | 2,06:1 |
| Zona 5 `#FF375F` | 3,52:1 |

**Por que não foi corrigido junto com o 2.1.** O 2.1 mexeu em dois cinzas e
ninguém nota. Escurecer verde, laranja e amarelo muda a aparência do app de forma
visível, e a paleta imita a do iOS de propósito — é decisão de produto, não de
correção, e pede conferência no aparelho.

**Abordagem sugerida.** Separar cor de marca de cor de texto: manter os tons
atuais em barras, selos e preenchimentos, e usar variantes escurecidas só onde a
cor vira texto. Para os selos de zona, texto escuro em vez de branco resolve sem
mexer na cor de fundo.

**Esforço:** meio dia, quase todo em conferência visual.

---

## P3 — O código não se defende sozinho

### 3.1 Nenhum teste de interface versionado — RESOLVIDO

Playwright em `e2e/`, contra o build de produção num viewport de celular. Qualquer
erro de runtime ou no console reprova o teste, mesmo que as asserções passem.

A rede foi verificada reintroduzindo os dois defeitos que a motivaram: o hook
depois de retorno antecipado derruba os testes que cruzam a fronteira de app vazio
para app com dados; a sobrescrita de `style` pela animação derruba o teste da grade.

**Uma armadilha que apareceu no caminho:** o Playwright estava configurado para
reaproveitar um servidor de preview já em execução, e chegou a aprovar uma validação
que ainda nem tinha sido compilada. A suíte passou a usar porta própria (4174) e a
não reaproveitar servidor: sempre compila o que está no disco, e nunca disputa a
porta com o `npm run preview` do dia a dia.

### 3.2 Sem lint, formatação nem CI — RESOLVIDO

ESLint com `react-hooks`, Prettier e um workflow do GitHub Actions rodando lint,
formatação, testes, build e navegador a cada push.

O lint encontrou, de imediato, o BOM do Excel escrito como caractere literal dentro
de uma regex — invisível no editor, e uma normalização distraída quebraria a leitura
de CSVs de planilha sem deixar rastro.

A formatação do Prettier **não** foi aplicada ao código existente: reescreveria
2.263 linhas só no `App.jsx`. `src/` está no `.prettierignore` com o motivo; vale
formatar junto com o item 3.3, que já reescreve o arquivo.

### 3.3 `App.jsx` com 2.308 linhas — RESOLVIDO

Separado em `estilos.js`, `armazenamento.js`, `ui/`, `telas/` e `graficos/`, com um
arquivo por gráfico. O `App.jsx` passou de 2.308 para 258 linhas e ficou só com o
estado e a troca de abas; o maior arquivo agora é uma tela de 272 linhas.

`FC_MIN` e `FC_MAX` estavam declarados duas vezes, no `App.jsx` e em `lib/sessoes.js`;
a separação unificou.

**Como foi verificado.** É refatoração pura: nada devia mudar na tela. Capturei 18
telas antes, separei, capturei de novo e comparei byte a byte — as 18 idênticas.
Antes disso confirmei que as capturas eram determinísticas, rodando duas vezes sem a
mudança, senão a comparação não provaria nada.

O lint foi decisivo: apontou 14 símbolos indefinidos ou não usados que meu script de
extração errou, incluindo falsos positivos por casar `equiv` dentro da palavra
"equivalentes". O build passava com todos eles.

**A formatação automática continua de fora**, ao contrário do que este documento
previa. Aplicar o Prettier reescreveu 466 linhas do `stats.js`, que nem fazia parte
do trabalho, e explodiu a tabela de `ZONES` de cinco linhas alinhadas para quarenta
e seis. O motivo está escrito no `.prettierignore`.

---

## P4 — Experiência de uso

### 4.1 Não existe modo escuro

**Medido.** Zero ocorrências de `prefers-color-scheme` no projeto. As cores são fixas
no objeto `C`, e o único `@media` presente é o de `prefers-reduced-motion`.

O app imita a interface do iOS com fidelidade alta, e quem usa iOS no escuro vai
receber uma tela branca — na academia, à noite, que é o cenário de uso real.

**Abordagem sugerida.** Trocar o objeto `C` por variáveis CSS e declarar um bloco
`@media (prefers-color-scheme: dark)`. Os gradientes SVG precisam de um segundo
conjunto de paradas; as cores de zona provavelmente sobrevivem sem mudança. Vale
resolver junto com o item 2.1, já que os dois mexem na mesma paleta.

**Esforço:** um dia, quase todo em conferência visual.

### 4.2 Excluir treino não tinha volta — RESOLVIDO

O toast que aparece depois da exclusão passou a oferecer **Desfazer**, e dura sete
segundos em vez de menos de três quando há ação. Desfazer restaura também a marca
de "exemplos limpos", que a exclusão do último treino teria acionado.

Continua sem diálogo de confirmação, de propósito: confirmação atrapalha quem
acertou o toque, e o desfazer resolve quem errou.

---

## P5 — Alcance e refinamento

### 5.1 Injeção de fórmula no CSV exportado — RESOLVIDO

Nota começando com `=`, `+`, `-` ou `@` sai com apóstrofo à frente, que faz Excel e
LibreOffice tratarem o campo como texto. A importação remove o apóstrofo de volta,
e só quando o caractere seguinte é de fato um desses — para não comer apóstrofo
legítimo de quem escreveu "'tava puxado".

Coberto por teste de navegador que exporta de verdade, lê o arquivo gerado, confere
o apóstrofo e reimporta para checar que o texto voltou intacto.

### 5.2 O custo do motor cresce mais rápido que o histórico

**Medido.** Tempo de `calcularStats` por tamanho de histórico, no Node deste ambiente:

| Treinos | Histórico | `calcularStats` | `montarSemana` ×2 |
|---|---|---|---|
| 150 | ~1 ano | 3,8 ms | 0,12 ms |
| 500 | ~3 anos | 9,4 ms | 0,21 ms |
| 1.500 | ~10 anos | 29,8 ms | 0,63 ms |
| 5.000 | ~33 anos | 99,6 ms | 1,61 ms |

O crescimento é claramente super-linear. A causa é `sessions.filter(...)` dentro de
laços — a série diária percorre o histórico inteiro uma vez por dia decorrido.

**Isto não é urgente.** Com três anos de treino são 9 ms, e o cálculo é memoizado em
`[sessions, cfg]`, então só roda ao gravar ou mudar ajustes. Num celular, três a cinco
vezes mais lento, ainda é imperceptível. `montarSemana`, que roda a cada render, é
irrelevante em qualquer tamanho.

Fica registrado com números para não virar decisão por intuição: o momento de mexer é
se alguém passar de uns 1.500 registros, não antes.

**Abordagem sugerida.** Indexar as sessões por data uma vez, num `Map`, e trocar os
`filter` por consultas a esse índice.

**Esforço:** meio dia.

### 5.3 Tamanho do pacote

**Medido.** Compilei um ponto de entrada mínimo só com React para separar as parcelas:

| | Bruto | Comprimido |
|---|---|---|
| Pacote total | 220,6 kB | 70,1 kB |
| React + React DOM | 138,3 kB | 44,5 kB |
| Código do app | 82,3 kB | 25,6 kB |

React responde por 63% do que trafega. O app em si são 25,6 kB comprimidos, o que é
enxuto para o que ele faz.

Trocar por Preact cortaria uns 35 kB comprimidos. Para um PWA que o usuário instala
uma vez e depois carrega do cache, o ganho real é pequeno.

**Abordagem sugerida.** Só considerar se a primeira abertura em rede ruim virar
queixa concreta. `preact/compat` costuma ser troca de alias, mas exige regressão
visual completa.

**Esforço:** duas horas, mais a conferência visual.

### 5.4 Sincronização entre dispositivos

Hoje os dados vivem no `localStorage` de um aparelho. Trocar de celular sem lembrar de
exportar significa perder o histórico. O CSV cobre o caso do backup consciente, não o
do esquecimento.

**Abordagem sugerida.** É a única decisão da lista que muda a natureza do projeto: sai
de app local e entra em serviço com conta, servidor e política de privacidade. A
alternativa intermediária é backup automático para o iCloud Drive ou equivalente, sem
conta.

**Esforço:** semanas, e não deveria ser decidido pelo esforço.

---

## Limpeza pontual

Achados menores, todos verificados por contagem de ocorrências:

- **Três campos de `calcularStats` nunca lidos**: `delta`, `densidade` e `maiorDur`, no objeto devolvido por `calcularStats`. Zero referências em `App.jsx` e zero nos
  testes. `densidade28` e `mediaDur`, que são parecidos, esses sim são usados.
- **Grade de referência dos gráficos** repetida quase idêntica em `CumulativeChart`,
  `LoadChart` e `IntensityChart`, cerca de seis linhas cada. Agora que cada gráfico
  tem arquivo próprio, extrair um componente `<Grade>` ficou trivial.

**Esforço:** minutos, exceto o último.

---

## Limitações conhecidas e aceitas

Não são defeitos. Ficam registradas para não virarem suspeita de novo:

- **`maximum-scale=1` no viewport foi mantido por decisão.** Ele impede o usuário
  de ampliar a tela com os dedos, o que prejudica quem enxerga pouco, mas evita o
  zoom acidental ao tocar nos campos numéricos — que neste app são a interação mais
  frequente. Decisão consciente, não esquecimento.

- **O card "Este mês" compara com o mês anterior inteiro**, então a seta aponta para
  baixo nas três primeiras semanas de todo mês. Foi decisão consciente, contra a
  alternativa de comparar com o mesmo período do mês anterior.
- **As médias da Consistência excluem a semana em curso.** Uma semana pela metade
  contada como semana inteira faria a média cair toda segunda e subir até domingo, por
  artefato do calendário. Elas incluem, sim, as semanas paradas.
- **A ida e volta do CSV perde milissegundos.** O tempo é guardado em minutos decimais
  e exportado com quatro casas, então 20 s viram 19,998 s ao reimportar. É invisível na
  interface, que exibe `0:20`, e a chave de deduplicação normaliza para segundos
  inteiros — reimportar não duplica. Só não é idêntico byte a byte.
- **O campo de segundos aceita valores acima de 59.** Digitar 90 s é lido como 1,5 min,
  em vez de ser recusado. Comportamento tolerante, de propósito.

---

## Nota sobre as métricas

O app usa três medidas de esforço, e vale não confundi-las:

- **TRIMP** pondera cada zona por um peso de 1 a 5 e mede *carga*. É o que alimenta o
  modelo de aptidão e fadiga, a razão aguda/crônica e a monotonia.
- **Minutos equivalentes** não contam a Zona 1, contam Zonas 2 e 3 por 1 e Zonas 4 e 5
  por 2. É a equivalência entre atividade moderada e vigorosa da recomendação de 150
  min semanais, e é a base da meta semanal.
- **Minutos** são o tempo bruto.

Os pesos do TRIMP são uma convenção do próprio app, não a formulação de Banister, que
usa a fração da reserva cardíaca ponderada exponencialmente. Para acompanhar tendência
de uma pessoa ao longo do tempo, a convenção serve; para comparar com números
publicados em outro lugar, não serve.

O mesmo vale para o modelo de aptidão e fadiga, com constantes de 42 e 7 dias: as
constantes vêm da literatura de ciclismo, sobre atletas treinados. A forma da curva é
informativa; o valor absoluto não deve ser levado ao pé da letra.

---

## Ordem sugerida

Já saíram: todo o P1, o 2.1, o 2.4, o 3.1, o 3.2, o 3.3, o 4.2 e o 5.1.

Restam **2.2**, **2.3**, **2.5** e **4.1** — acessibilidade e modo escuro, os quatro
avaliados e deixados de lado por ora — e **5.2**, **5.3** e **5.4**, que só valem
quando houver motivo concreto.

A limpeza pontual ficou barata com a separação e pode ir junto do próximo trabalho
que tocar em gráficos.
