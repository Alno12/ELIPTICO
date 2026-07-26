# Melhorias futuras

Levantamento refeito do zero sobre o estado atual do código, substituindo a versão
anterior — que envelheceu junto com as mudanças e ficou com todas as referências de
linha apontando para o lugar errado.

Cada item diz **como foi apurado**. Onde está escrito *medido*, o número saiu de um
experimento reproduzível descrito no próprio item. Onde está escrito *leitura de
código*, é análise sem reprodução. A diferença importa na hora de decidir se vale
confiar sem verificar.

Estado de referência: `App.jsx` com 2.079 linhas, 134 testes em Vitest, pacote de
225 kB (70 kB comprimido).

**Já resolvido** (não repetir): datas em fuso local, contador de sequência de semanas,
contradição do "Tempo fácil", ressemeadura dos exemplos, PWA instalável e offline,
importação de CSV, vazamento da janela de 17 semanas, extração da lógica pura e suíte
de testes, plano de 10 semanas removido, registro em minutos e segundos, minutos
equivalentes, médias da Consistência, recordes da semana corrente, limite do RPE,
"FC máxima registrada: 0 bpm".

---

## P1 — O app pode parar de abrir

### 1.1 Um registro malformado deixa a tela em branco, sem saída

**Medido.** Gravei no `localStorage` uma sessão sem o campo `zones` — a forma que um
registro de um esquema antigo teria — e abri o app:

```
erro lançado : Cannot read properties of undefined (reading 'z1')
tela         : EM BRANCO
texto visível: (nada)
dá para chegar nos Ajustes e limpar? NÃO
```

A leitura em `src/App.jsx:77` faz `JSON.parse` e confere apenas `Array.isArray`. O
conteúdo de cada registro entra sem validação, e `calcularStats` acessa `x.zones.z1`
direto.

O agravante é a ausência de saída. Não há error boundary em lugar nenhum do projeto,
então o React desmonta a árvore inteira e resta uma página vazia. Como os dados estão
no `localStorage` e o app é um PWA com service worker, o usuário não consegue chegar
nos Ajustes para limpar nem "recarregar até funcionar": só limpando os dados do site
pelo navegador, o que joga fora todo o histórico.

Um caso mais brando da mesma causa: uma sessão a que falte **uma** das cinco zonas
produz `NaN` em vez de erro, e o `NaN` se espalha em silêncio pelos totais
(`src/lib/stats.js:246` soma `x.zones.z3 + x.zones.z4 + x.zones.z5` sem guarda).

Hoje o risco é baixo, porque tanto o formulário quanto a importação sempre gravam as
cinco zonas. Mas é exatamente o que quebra na próxima mudança de esquema — e o
sintoma, uma tela branca, não aponta para a causa.

**Abordagem sugerida.** Duas peças independentes, e as duas valem por si:

1. Uma função de normalização na leitura, preenchendo zonas ausentes com 0 e
   descartando registros irrecuperáveis. É o mesmo trabalho que `sessoesDeCsv` já faz
   para o CSV; dá para aproveitar a forma.
2. Um error boundary em volta do `App`, com uma tela de recuperação que ofereça
   exportar o backup e limpar os dados. Cobre também os defeitos que ainda não
   conhecemos.

**Esforço:** três horas para as duas.

### 1.2 `total` é gravado à parte das zonas e pode divergir

**Medido.** Uma sessão com `total: 9999` e zonas somando 60 aparece como 9999 minutos
na semana. O campo é gravado no envio do formulário (`src/App.jsx:907`) e depois lido
como verdade, em vez de derivado das zonas.

Enquanto só o formulário e a importação escreverem, os dois valores concordam. O
problema é que `total` é redundante: existe uma segunda fonte de verdade para um
número que já está nas zonas, e nada garante que as duas continuem de acordo.

**Abordagem sugerida.** Derivar `total` na leitura, com `totalZ(zones)`, e parar de
persistir o campo. A normalização do item 1.1 é o lugar natural para isso.

**Esforço:** uma hora, contando a migração dos registros existentes.

### 1.3 FC média e máxima aceitam qualquer valor

**Medido.** O formulário sanitiza com `Math.max(0, Number(v) || 0)` e grava sem teto
(`src/App.jsx:908`). Com uma FC média de 1500 registrada, a métrica "percentual da
reserva cardíaca" na aba Análise passa a exibir **590%**.

O gráfico de eficiência cardíaca ajusta o eixo pelos valores mínimo e máximo da série,
então um único valor absurdo achata todos os outros pontos contra a base.

O RPE já foi limitado a 0–10 quando o formulário foi reescrito. A importação de CSV
também limita. É só o formulário que não limita a FC.

**Abordagem sugerida.** `clamp` com faixa plausível — algo como 30–250 bpm — no envio,
igual ao que já é feito com o RPE, e sinalização no campo.

**Esforço:** meia hora.

---

## P2 — Acessibilidade

Subiu de prioridade em relação ao levantamento anterior porque o item de contraste
deixou de ser suspeita e virou medição: ele afeta praticamente todo o texto de apoio
do app, o tempo inteiro, e não só em situações de exceção.

### 2.1 O texto secundário reprova o contraste mínimo

**Medido.** Calculei a razão de contraste das cores de texto sobre os dois fundos
usados, pela fórmula do WCAG 2.1:

| Cor | Sobre card `#FFF` | Sobre fundo `#F2F2F7` | Mínimo AA (texto normal) |
|---|---|---|---|
| `C.sec` — `rgba(60,60,67,0.6)` | **3,44:1** | **3,29:1** | 4,5:1 — reprova |
| `C.ter` — `rgba(60,60,67,0.28)` | **1,67:1** | **1,64:1** | 4,5:1 — reprova |

`C.sec` (`src/App.jsx:16`) não é um detalhe: é a cor de oito estilos de texto —
`eyebrow`, `unit`, `tileLabel`, `rowSub`, `insightBody`, `foot`, entre outros — com
41 usos diretos. Na prática, todo o texto de apoio do app. E todos esses estilos usam
fontes de 12,5 a 14 px, que contam como texto normal no WCAG; a tolerância de 3,0:1
vale só a partir de 18,7 px em negrito ou 24 px.

`C.ter` (`src/App.jsx:17`), com 17 usos, é a cor dos rótulos dos eixos dos gráficos e
dos marcadores "—" de dia sem treino. A 1,67:1, é quase invisível.

Isso não é rigor formal: são os números que somem ao ler o celular no sol da rua ou
com a tela no brilho baixo da academia.

**Abordagem sugerida.** Escurecer as duas. `rgba(60,60,67,0.78)` leva `C.sec` para a
casa de 4,6:1 sobre branco; `C.ter` precisa de algo perto de 0,55 de opacidade para
passar de 3,0:1, o suficiente para rótulo de eixo. Vale conferir a aparência depois,
porque o app imita a paleta do iOS de propósito.

**Esforço:** duas horas, quase todas em conferência visual.

### 2.2 As folhas modais não são diálogos

**Leitura de código.** O componente `Sheet` (`src/App.jsx:1722`) é um `<div>` dentro
de outro `<div>`. Falta tudo o que caracteriza um diálogo:

- sem `role="dialog"` e sem `aria-modal`
- sem armadilha de foco — dá para tabular para fora da folha aberta e continuar
  navegando pelo conteúdo atrás dela
- sem fechamento com Esc
- sem bloqueio do rolamento do fundo
- sem devolução do foco ao elemento que abriu a folha
- o fundo escurecido é um `<div>` com `onClick` (`src/App.jsx:1724`), sem
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

### 2.4 Quatro itens menores

**Leitura de código**, todos independentes:

- **`aria-current={on}`** (`src/App.jsx:1876`) gera `aria-current="false"` no item não
  selecionado, que não é valor válido. O correto é `aria-current={on ? "page" :
  undefined}`.
- **Campos sem `<label>`**: o seletor de data, o campo de notas e o `FieldNum`
  genérico dependem de proximidade visual. Os campos de minutos e segundos por zona
  já têm `aria-label`.
- **`maximum-scale=1`** no viewport (`index.html:5`) sinaliza bloqueio de zoom.
- **`prefers-reduced-motion`** já está tratado e desliga todas as animações — este
  não é um problema, fica registrado para não ser reinvestigado.

**Esforço:** uma hora para os três primeiros.

---

## P3 — O código não se defende sozinho

### 3.1 Nenhum teste de interface versionado

**Medido.** `git ls-files` devolve quatro arquivos de teste, todos de `src/lib/`:
`csv.test.js` (36 testes), `datas.test.js` (37), `stats.test.js` (38) e `util.test.js`
(23). Nada cobre `App.jsx`, que concentra 2.079 das 3.597 linhas do projeto.

Isso não é hipotético. Dois defeitos reais escaparam de todos os 134 testes unitários
e do build, e só apareceram em verificação por navegador:

- uma função de deslize chamava `useRef` depois de um retorno antecipado, e a tela
  quebrava ao salvar o primeiro treino num app zerado;
- espalhar as props de uma animação sobre um elemento que já tinha `style`
  sobrescrevia o estilo e destruía a grade de duas colunas, de forma permanente.

Os dois passavam no build e nos testes. Nenhum seria pego por teste unitário da
camada pura, porque nenhum dos dois está nela.

As suítes de navegador que os pegaram foram escritas fora do repositório e se perdem
com o ambiente. **É o item de maior retorno da lista**: a rede que já provou pegar
defeito real não existe no projeto.

**Abordagem sugerida.** Playwright como dependência de desenvolvimento, um diretório
`e2e/`, e um `npm run e2e`. Começar pelos caminhos que já se mostraram frágeis: app
zerado até o primeiro treino salvo, navegação entre semanas, e exportar/reimportar
sem duplicar.

**Esforço:** um dia para a estrutura e os primeiros casos.

### 3.2 Sem lint, formatação nem CI

**Medido.** Não existem `.eslintrc*`, `eslint.config.*`, `.prettierrc*` nem diretório
`.github`. Os scripts do `package.json` são `dev`, `build`, `preview`, `test` e
`test:watch`.

O `eslint-plugin-react-hooks` teria apontado sozinho o defeito de hooks descrito acima
— é exatamente a regra `rules-of-hooks`.

**Abordagem sugerida.** ESLint com `react-hooks`, Prettier na convenção já usada de
fato (aspas duplas, ponto e vírgula), e um workflow que rode lint, testes e build a
cada push.

**Esforço:** meio dia.

### 3.3 `App.jsx` com 2.079 linhas

**Medido.** 2.079 das 3.597 linhas do projeto, contra 285 do maior módulo de
`src/lib/`. Continuam no arquivo: quatro telas, duas folhas modais, doze gráficos SVG,
os componentes de interface e o objeto de estilos com 83 chaves.

O arquivo **cresceu** desde a extração da lógica pura, porque as funcionalidades novas
foram todas para dentro dele.

**Abordagem sugerida.** `charts/`, `ui/`, `screens/`, `styles.js`.

O pré-requisito honesto não é o teste unitário da camada pura, que já existe — é o
item 3.1. Sem teste de interface, essa separação é refatoração às cegas justamente na
parte do código que não tem cobertura nenhuma. Fazer 3.1 antes.

**Esforço:** um dia.

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

### 4.2 Excluir treino não pede confirmação nem tem volta

**Leitura de código.** O botão Excluir (`src/App.jsx:833`) apaga na hora. O toast que
aparece depois é informativo e não oferece desfazer. Um toque errado numa lista densa
apaga um registro sem recurso.

**Abordagem sugerida.** Desfazer no próprio toast é melhor que um diálogo de
confirmação: não atrapalha quem acertou o toque e resolve quem errou. O estado
anterior já está em mãos no momento da exclusão.

**Esforço:** duas horas.

---

## P5 — Alcance e refinamento

### 5.1 Injeção de fórmula no CSV exportado

**Medido.** As notas são escapadas para CSV — aspas duplicadas e campo entre aspas
(`src/App.jsx:758`) — mas isso resolve delimitador, não fórmula. Uma nota começando
com `=`, `+`, `-` ou `@` continua sendo avaliada como fórmula ao abrir o arquivo no
Excel ou no Google Sheets:

```
2026-07-26,60,0,60,0,0,0,120,60,,,,"=HYPERLINK(""http://x"",...
```

O alcance é limitado, porque o texto é digitado pelo próprio usuário no próprio
aparelho. Vira problema quando o arquivo é compartilhado, e é o tipo de coisa que
ferramenta de segurança automática aponta.

**Abordagem sugerida.** Prefixar com apóstrofo os campos de texto que comecem com um
desses caracteres, na exportação. A importação deve retirar o apóstrofo, e um teste de
ida e volta trava o comportamento.

**Esforço:** uma hora, contando o teste.

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

- **Três campos de `calcularStats` nunca lidos**: `delta` (`src/lib/stats.js:248`),
  `densidade` (`:256`) e `maiorDur` (`:264`). Zero referências em `App.jsx` e zero nos
  testes. `densidade28` e `mediaDur`, que são parecidos, esses sim são usados.
- **`import React`** em `src/App.jsx:1` sem nenhum uso de `React.` no arquivo — o JSX
  moderno dispensa.
- **Grade de referência dos gráficos** repetida quase idêntica em `CumulativeChart`,
  `LoadChart` e `IntensityChart`, cerca de seis linhas cada. Candidata a um
  componente `<Grade>`, junto com o item 3.3.

**Esforço:** minutos, exceto o último.

---

## Limitações conhecidas e aceitas

Não são defeitos. Ficam registradas para não virarem suspeita de novo:

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

1. **3.1** — teste de interface versionado. É o item que protege todos os outros, e o
   único cuja ausência já custou defeito real duas vezes.
2. **1.1** — normalização na leitura e error boundary. Maior gravidade da lista: hoje o
   sintoma é tela branca sem recuperação.
3. **2.1** — contraste. Duas horas, afeta todo o texto de apoio do app.
4. **1.3** e **1.2** — faixa da FC e `total` derivado. Baratos, fecham o P1.
5. **3.2** — lint e CI, que impedem a volta do que foi corrigido.
6. **2.2**, **2.3**, **2.4** — o resto da acessibilidade.
7. **4.1** com **2.1** revisitado — modo escuro, mexendo na paleta uma vez só.
8. **4.2**, **5.1** — desfazer exclusão e escape do CSV.
9. **3.3** — separação de `App.jsx`, agora com rede.
10. **5.2**, **5.3**, **5.4** — quando houver motivo concreto.
