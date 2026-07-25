# Melhorias futuras

Levantamento do estado do app após os PRs #1 e #2. Cada item traz o problema, onde ele está,
por que importa e uma sugestão de abordagem. As estimativas de esforço são grosseiras e servem
só para ordenar a fila.

Onde há número medido, está dito como foi medido. Onde é leitura de código, está dito também —
a diferença importa na hora de decidir se vale confiar sem reproduzir.

**Já resolvido** (não repetir): datas em fuso local, contador de sequência de semanas,
contradição do "Tempo fácil", ressemeadura dos dados de exemplo, PWA instalável e offline,
importação de CSV.

---

## P1 — Números errados na tela

O app existe para produzir números confiáveis sobre o treino. Estes são os pontos onde ele
ainda não produz.

### 1.1 A janela de 17 semanas vaza para métricas apresentadas como históricas

**Medido.** É o item mais importante da lista.

`weeks` é construído com exatamente 17 posições (`src/App.jsx:469`) porque é isso que os
gráficos de tendência exibem. Mas `completas` (`:488`) deriva dele, e daí saem métricas que a
interface apresenta como se cobrissem todo o histórico.

O caso pior é o perfil por dia da semana (`:526-531`): o numerador soma **todas** as sessões
já registradas naquele dia da semana, e o denominador é `completas.length`, que satura em 17.
Numerador e denominador cobrem períodos diferentes, então o resultado não é uma média de coisa
nenhuma — e o erro cresce quanto mais longo for o histórico.

Medição feita no app rodando, com 104 semanas injetadas contendo exatamente 60 min toda
segunda-feira:

| Métrica | Verdade | Exibido |
|---|---|---|
| Minutos médios na segunda-feira | 60 min | **390 min** (6,5×) |
| Semanas que bateram a meta | de 104 | **de 16** |
| Maior sequência de semanas | 104 | 104 ✓ (já corrigido no PR #2) |

Também afetados, pelo mesmo motivo:

- `semanasNaMeta` / `totalCompletas` (`:491`, exibido em `:830`) — "X de Y" sugere todo o
  histórico, conta no máximo 17 semanas.
- `maiorSemana` e `maiorZ3` (`:605-606`, exibidos em `:854`) — estão sob a seção **Recordes**,
  mas só procuram nas últimas 17 semanas. Um recorde que ignora o passado não é um recorde.
- `mediaSemanal` / `sessoesPorSemana` (`:649-650`, exibidos em `:826-827`) — rotulados como
  "Média de minutos/treinos por semana", são médias de 17 semanas. Com dados estáveis o valor
  sai certo por coincidência; com volume variando ao longo do ano, não.

**Abordagem sugerida.** O PR #2 já construiu, para as sequências, uma série semanal que cobre
todo o histórico (a variável `serie`, em `useStats`). A correção é generalizar isso: produzir
uma única série semanal completa, usar `weeks` **só** para o que é desenho de gráfico, e
recalcular recordes, médias e o perfil por dia da semana em cima da série completa. Aproveitar
para acertar os rótulos do que continuar sendo janela móvel — "nas últimas 17 semanas" dito
explicitamente é melhor que um número ambíguo.

**Esforço:** meio dia, sendo boa parte conferência dos números depois.

### 1.2 RPE aceita qualquer valor e quebra o gráfico

**Leitura de código.** O formulário sanitiza com `Math.max(0, Number(v) || 0)`
(`src/App.jsx:1418`) e grava sem teto (`:1434`). Um 99 digitado por engano é aceito.

O gráfico de dispersão mapeia o eixo vertical como `(v - 1) / 9`, assumindo a faixa 1–10. Com
99 o ponto vai parar muito fora da área visível, e a reta de regressão é puxada junto — a
correlação de Pearson exibida ao lado passa a descrever um ponto que ninguém vê.

Vale notar que a importação de CSV **já** limita RPE a 0–10; é só o formulário que não limita.

**Abordagem sugerida.** Aplicar `clamp(…, 0, 10)` no envio, como a importação faz, e sinalizar
no campo. Mesma checagem serve para FC média e FC máxima, hoje igualmente sem faixa — um 1500
digitado por engano destrói a escala do gráfico de eficiência cardíaca.

**Esforço:** uma hora.

### 1.3 "FC máxima registrada: 0 bpm"

**Leitura de código.** `Math.max(...sessions.map((x) => x.maxHr || 0))` (`src/App.jsx:644`)
devolve 0 quando nenhum treino tem FC máxima preenchida — campo opcional. A linha de Recordes
mostra "0 bpm", que parece defeito.

**Abordagem sugerida.** Devolver `null` quando não houver nenhum valor e omitir a linha, como
já é feito com `maiorSemana`.

**Esforço:** minutos.

### 1.4 Dados do `localStorage` entram sem validação

**Leitura de código.** O que vem do armazenamento é usado direto. Em `weeks`, o cálculo de
`z3mais` acessa `x.zones.z3 + x.zones.z4 + x.zones.z5` sem proteção: uma sessão gravada por
uma versão anterior sem alguma dessas chaves produz `NaN`, que se propaga silenciosamente por
todos os gráficos e totais.

Hoje o risco é baixo — tanto o formulário quanto a importação sempre gravam as cinco zonas. Mas
é exatamente o tipo de coisa que quebra na próxima mudança de esquema, e o sintoma (`NaN`
espalhado) não aponta para a causa.

**Abordagem sugerida.** Uma função de normalização na leitura, preenchendo zonas ausentes com 0
e descartando registros irrecuperáveis. É o mesmo trabalho que `sessoesDeCsv` já faz para o CSV;
dá para aproveitar a forma.

**Esforço:** duas horas.

---

## P2 — O código não se defende sozinho

### 2.1 Não há testes

Zero cobertura. Todas as verificações feitas até aqui foram harnesses descartáveis, montados
por fora e jogados fora depois. Isso não escala: o motor de estatística tem umas cinquenta
métricas derivadas e nenhuma rede de proteção.

**Abordagem sugerida.** Extrair `useStats` e os utilitários de data para um módulo puro, sem
React, e cobrir com Vitest. O corte natural é: entra `(sessions, cfg)`, sai o objeto de
estatísticas — testável sem montar componente. Priorizar os casos que já mordem: histórico
vazio, uma única sessão, histórico longo (o item 1.1), virada de fuso e de horário de verão.

**Esforço:** dois a três dias para uma cobertura que valha.

### 2.2 Sem lint, sem formatação, sem CI

Não há ESLint, Prettier nem workflow no GitHub. O `eslint-plugin-react-hooks` teria apontado
sozinho pelo menos um problema real deste código.

**Abordagem sugerida.** ESLint com `react-hooks`, Prettier na configuração já usada de fato
(aspas duplas, ponto e vírgula), e um workflow que rode lint, testes e build a cada push.

**Esforço:** meio dia.

### 2.3 `App.jsx` tem 2.750 linhas

Constantes, motor de estatística, quatro telas, três folhas modais, nove gráficos SVG e a folha
de estilos inteira, tudo num arquivo.

**Abordagem sugerida.** `stats.js`, `datas.js`, `csv.js`, `charts/`, `ui/`, `styles.js`.

**Importante:** fazer isso **depois** de 2.1. Quebrar um arquivo sem testes não reduz risco,
apenas o transfere para o momento do merge. A ordem correta é testes primeiro, separação depois.

**Esforço:** um dia, e vira dois se vier antes dos testes.

---

## P3 — Experiência de uso

### 3.1 Não existe modo escuro

**Leitura de código.** As cores são fixas em `C` e o único `@media` presente é o de
`prefers-reduced-motion`. O app imita a interface do iOS com fidelidade alta, e quem usa iOS no
escuro vai receber uma tela branca — na academia, à noite, que é o cenário de uso real.

**Abordagem sugerida.** Trocar o objeto `C` por variáveis CSS e declarar um bloco
`@media (prefers-color-scheme: dark)`. Os gradientes SVG precisam de um segundo conjunto de
paradas; as cores de zona provavelmente sobrevivem sem mudança.

**Esforço:** um dia, quase todo em conferência visual.

### 3.2 Acessibilidade

Itens independentes, do mais para o menos grave:

- **Folhas modais sem armadilha de foco e sem Esc.** Dá para tabular para fora da folha
  aberta e o fundo continua rolando. Teclado e leitor de tela ficam perdidos.
- **Gráficos sem alternativa textual.** Nove SVGs sem `role="img"` nem `aria-label`. Para
  leitor de tela, a aba Tendências é uma página vazia. Um resumo de uma frase por gráfico já
  mudaria isso.
- **`aria-current={on}`** (`src/App.jsx:2540`) gera `aria-current="false"` no elemento não
  selecionado, o que não é valor válido. Deveria ser `aria-current={on ? "page" : undefined}`.
- **Campos sem `<label>`.** Os `<input>` dependem de proximidade visual.
- **`maximum-scale=1`** no viewport (`index.html:5`) sinaliza bloqueio de zoom.

**Esforço:** um dia para o conjunto.

### 3.3 Excluir treino não pede confirmação nem tem volta

**Leitura de código.** O botão Excluir (`src/App.jsx:1355`) apaga na hora. O toast que aparece
depois é informativo, não oferece desfazer. Um toque errado numa lista densa apaga um registro
sem recurso.

**Abordagem sugerida.** Desfazer no próprio toast é melhor que um diálogo de confirmação: não
atrapalha quem acertou o toque e resolve quem errou. O estado anterior já está em mãos no
momento da exclusão.

**Esforço:** duas horas.

---

## P4 — Alcance e refinamento

### 4.1 Injeção de fórmula no CSV exportado

**Leitura de código.** Uma nota começando com `=`, `+`, `-` ou `@` é interpretada como fórmula
ao abrir o arquivo no Excel ou no Google Sheets. Severidade baixa num app de uso pessoal, onde
o autor da nota é a própria vítima, mas o custo de corrigir também é baixo.

**Cuidado:** a correção usual é prefixar o campo com apóstrofo, o que quebraria o round-trip
com a importação. Se for feito, a importação precisa remover o prefixo na volta — os dois lados
têm que mudar juntos.

**Esforço:** uma hora, contando o teste de ida e volta.

### 4.2 Desempenho do motor de estatística

**Leitura de código.** `useStats` faz cerca de vinte varreduras completas de `sessions`, várias
delas dentro de laços — os 28 dias de `acum` chamam `filter` 28 vezes, cada `weeks` outras 17.
`Tendencias` refaz até 90 filtragens a cada renderização, sem `useMemo`.

Com algumas centenas de sessões não se nota. É um problema de daqui a alguns anos de uso, não
de agora.

**Abordagem sugerida.** Indexar as sessões por data uma única vez, no começo do `useMemo`, e
consultar o índice. Envolver o cálculo de `Tendencias` em `useMemo`. Se 2.1 vier antes, dá para
medir o ganho de verdade em vez de supor.

**Esforço:** meio dia.

### 4.3 Tamanho do pacote

233 kB, 74 kB comprimido, dos quais React e ReactDOM são a maior parte — o código do app é
pequeno. Trocar por Preact via `compat` cortaria perto de 40 kB comprimidos, relevante numa
primeira carga em rede móvel. Depois do service worker do PR #2, porém, a primeira carga é a
única que paga esse custo, o que reduz bastante a urgência.

**Esforço:** duas horas, mais teste de regressão visual.

### 4.4 Sincronização entre dispositivos

O `README` já avisa que os treinos não sincronizam. O PR #2 tirou o pior da situação — dá para
instalar e para exportar/importar — mas mover o histórico entre o celular e o computador ainda é
manual.

O invólucro `store` em `src/App.jsx` já isola a persistência atrás de uma interface assíncrona,
o que sugere que essa possibilidade estava prevista desde o início. É a porta de entrada natural
caso a decisão seja usar um backend.

Vale registrar que isso muda a natureza do projeto: sai de app local sem conta e entra em
autenticação, servidor e dados de saúde hospedados em algum lugar. É uma decisão de produto, não
uma tarefa técnica — e o custo recorrente é permanente.

**Esforço:** semanas, e não deveria ser decidido pelo esforço.

---

## Nota sobre as métricas de carga

TRIMP, monotonia, strain e razão aguda/crônica são heurísticas de fisiologia do exercício, úteis
para comparar as suas próprias semanas entre si. O app já diz isso na aba Análise, e o texto está
correto — vale mantê-lo em qualquer reescrita.

Um detalhe técnico que não é defeito, mas convém conhecer: a razão aguda/crônica usa a variante
*acoplada* (`src/App.jsx:630`), em que os 7 dias recentes entram também no denominador de 28
dias. É a formulação original de Gabbett e funciona, mas infla a razão em semanas de pico
comparada à variante desacoplada. Se algum dia o número parecer conservador demais numa semana
forte, a causa é essa.

---

## Ordem sugerida

1. **1.1** — é o único item que faz o app mostrar número errado hoje, e piora com o tempo.
2. **1.2, 1.3, 1.4** — baratos, e 1.4 evita uma classe inteira de defeito futuro.
3. **2.1** — destrava tudo que vem depois com segurança.
4. **2.2**, depois **2.3**.
5. **3.x** conforme incomodar; o modo escuro é o de maior retorno percebido.
6. **4.x** por último; 4.4 é decisão de produto, não de engenharia.
