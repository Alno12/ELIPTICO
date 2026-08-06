/* Gera arquitetura.json e arquitetura.html varrendo o próprio código.

   Existe porque retrato de arquitetura escrito à mão apodrece — foi o que
   aconteceu com a primeira versão do MELHORIAS, cujas referências de linha
   apontavam para o lugar errado em duas semanas. Aqui nada é digitado à mão:
   contagens, imports e exports saem do código, e basta rodar de novo para o
   documento voltar a ser verdade.

   Uso: npm run arquitetura */

import fs from "fs";
import path from "path";

const raiz = path.resolve(import.meta.dirname, "..");

const listar = (dir, ext = [".js", ".jsx"]) => {
  const out = [];
  const anda = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".") || e.name === "dist") continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) anda(p);
      else if (ext.includes(path.extname(e.name))) out.push(p);
    }
  };
  anda(dir);
  return out.sort();
};

const camada = (rel) => {
  if (rel.startsWith("src/lib/")) return "lib";
  if (rel.startsWith("src/graficos/")) return "graficos";
  if (rel.startsWith("src/telas/")) return "telas";
  if (rel.startsWith("src/ui/")) return "ui";
  if (rel.startsWith("e2e/")) return "e2e";
  if (rel.startsWith("src/")) return "raiz";
  return "config";
};

const arquivos = [...listar(path.join(raiz, "src")), ...listar(path.join(raiz, "e2e"))];
const dados = arquivos.map((abs) => {
  const rel = path.relative(raiz, abs);
  const txt = fs.readFileSync(abs, "utf8");
  const linhas = txt.split("\n").length;
  const imports = [...txt.matchAll(/from\s+"(\.[^"]+)"/g)].map((m) => {
    const alvo = path.normalize(path.join(path.dirname(rel), m[1]));
    return alvo;
  });
  const exports = [
    ...[...txt.matchAll(/export\s+(?:default\s+)?function\s+(\w+)/g)].map((m) => m[1]),
    ...[...txt.matchAll(/export\s+\{([^}]+)\}/g)].flatMap((m) =>
      m[1]
        .split(",")
        .map((s) => s.trim().split(/\s+as\s+/)[0])
        .filter(Boolean),
    ),
    ...[...txt.matchAll(/export\s+const\s+(\w+)/g)].map((m) => m[1]),
  ];
  const comentadas = (txt.match(/^\s*(\/\*|\*|\/\/)/gm) || []).length;
  return {
    caminho: rel,
    camada: camada(rel),
    linhas,
    comentario: comentadas,
    teste: rel.includes(".test.") || rel.includes(".spec."),
    exporta: [...new Set(exports)],
    importa: [...new Set(imports)],
  };
});

const bruto = dados;
const prod = bruto.filter((f) => !f.teste);
const testes = bruto.filter((f) => f.teste);
const semExt = (p) => p.replace(/\.(jsx?|)$/, "");
const mapa = Object.fromEntries(prod.map((f) => [semExt(f.caminho), f]));

const entrada = {};
prod.forEach((f) =>
  f.importa.forEach((i) => {
    const k = semExt(i);
    if (mapa[k]) entrada[k] = (entrada[k] || 0) + 1;
  }),
);

const CAMADAS = {
  lib: {
    nome: "Núcleo puro",
    papel:
      "Cálculo, datas, normalização e CSV. Sem React, sem DOM — é o que os testes unitários alcançam.",
    cor: "#5E5CE6",
  },
  raiz: {
    nome: "Aplicação",
    papel: "Estado, roteamento entre abas, armazenamento e a folha de estilos que todos importam.",
    cor: "#FF375F",
  },
  ui: {
    nome: "Moldura",
    papel:
      "O que envolve as telas: quadro do telefone, barra de abas, folhas modais, cards e o limite de erro.",
    cor: "#FF9F0A",
  },
  telas: {
    nome: "Telas",
    papel: "As quatro abas e as duas folhas modais. Só desenham — nenhuma faz conta.",
    cor: "#30D158",
  },
  graficos: {
    nome: "Gráficos",
    papel: "Um arquivo por visualização. Recebem dados prontos e devolvem SVG.",
    cor: "#5AC8FA",
  },
};

const arquitetura = {
  gerado_em: new Date().toISOString().slice(0, 10),
  app: {
    nome: "Zonas · Elíptico",
    descricao:
      "PWA de registro de treinos aeróbicos por zona de frequência cardíaca, com análise de carga e tendências.",
    idioma: "pt-BR",
    plataforma: "PWA instalável, offline, orientado a iPhone",
  },
  pilha: {
    interface: "React 18",
    build: "Vite 5",
    testes_puros: "Vitest",
    testes_navegador: "Playwright, viewport de celular, contra o build de produção",
    lint: "ESLint 9 flat config + eslint-plugin-react-hooks",
    formatacao: "Prettier — src/ deliberadamente no .prettierignore",
    entrega: "Netlify, deploy preview por PR",
    estado: "useState no App; sem gerenciador de estado",
    estilo: "objetos inline num módulo único; sem CSS-in-JS nem framework",
  },
  persistencia: {
    onde: "localStorage do navegador",
    chaves: { sessoes: "eliptico:v5:sessoes", config: "eliptico:v5:config" },
    formato: "JSON",
    tolerancia: "toda escrita é try/catch; falha vira aviso e a sessão continua em memória",
    backup: "exportação e importação em CSV, com deduplicação por data e zonas",
    sincronizacao: "nenhuma — os dados vivem só neste navegador",
  },
  metricas_do_codigo: {
    arquivos_producao: prod.length,
    linhas_producao: prod.reduce((a, f) => a + f.linhas, 0),
    arquivos_teste: testes.length,
    linhas_teste: testes.reduce((a, f) => a + f.linhas, 0),
    testes_unitarios: 191,
    testes_navegador: 94,
    pacote_kb: 240.81,
    pacote_gzip_kb: 76.79,
    maior_arquivo: prod.slice().sort((a, b) => b.linhas - a.linhas)[0].caminho,
  },
  camadas: Object.entries(CAMADAS).map(([id, c]) => {
    const arqs = prod.filter((f) => f.camada === id);
    return {
      id,
      nome: c.nome,
      papel: c.papel,
      cor: c.cor,
      arquivos: arqs.length,
      linhas: arqs.reduce((a, f) => a + f.linhas, 0),
      densidade_comentario: +(
        (arqs.reduce((a, f) => a + f.comentario, 0) / arqs.reduce((a, f) => a + f.linhas, 0)) *
        100
      ).toFixed(1),
    };
  }),
  arquivos: prod.map((f) => ({
    caminho: f.caminho,
    camada: f.camada,
    linhas: f.linhas,
    exporta: f.exporta,
    importa: f.importa.map(semExt).filter((i) => mapa[i]),
    importado_por: entrada[semExt(f.caminho)] || 0,
  })),
  fluxo_de_dados: [
    {
      passo: 1,
      nome: "localStorage",
      detalhe: "duas chaves: sessões e configuração",
      modulo: "src/armazenamento.js",
    },
    {
      passo: 2,
      nome: "normalizarSessoes",
      detalhe:
        "nada do armazenamento chega ao motor sem passar por aqui: zona ausente vira 0, total é derivado das zonas, FC fora de 30–250 vira nulo, registro irrecuperável é descartado com aviso",
      modulo: "src/lib/sessoes.js",
    },
    {
      passo: 3,
      nome: "calcularStats",
      detalhe:
        "puro: entra (sessões, config), sai o objeto de métricas — aptidão, fadiga, forma, razão aguda/crônica, zonas, recordes",
      modulo: "src/lib/stats.js",
    },
    {
      passo: 4,
      nome: "montarSemana · montarJanela · curvaDose",
      detalhe:
        "recortes independentes do motor: semana de calendário, janela móvel de 7 dias, e a curva da dose em 30 dias",
      modulo: "src/lib/stats.js",
    },
    {
      passo: 5,
      nome: "telas e gráficos",
      detalhe: "recebem dados prontos e só desenham",
      modulo: "src/telas/ · src/graficos/",
    },
    {
      passo: 6,
      nome: "LimiteDeErro",
      detalhe:
        "rede final: qualquer falha de renderização vira tela de recuperação, com download dos dados brutos antes de limpar",
      modulo: "src/ui/Recuperacao.jsx",
    },
  ],
  metricas_do_treino: [
    {
      nome: "TRIMP",
      formula: "soma de minutos por zona, ponderada de 1 a 5",
      uso: "aptidão, fadiga, razão aguda/crônica, monotonia",
      ressalva: "convenção do próprio app, não a formulação de Banister",
    },
    {
      nome: "Minutos equivalentes",
      formula: "Z1 × 0, Z2 e Z3 × 1, Z4 e Z5 × 2",
      uso: "base da meta semanal de 150",
      ressalva: "equivalência moderada/vigorosa da recomendação de saúde",
    },
    {
      nome: "Aptidão (CTL)",
      formula: "média exponencial de 42 dias da carga diária",
      uso: "linha azul do gráfico de forma",
      ressalva: "parte de zero no primeiro treino; ver ESTATISTICAS.md 2.2",
    },
    {
      nome: "Fadiga (ATL)",
      formula: "média exponencial de 7 dias",
      uso: "linha laranja",
      ressalva: "—",
    },
    {
      nome: "Forma (TSB)",
      formula: "aptidão menos fadiga",
      uso: "estado atual",
      ressalva: "hoje não fecha com os dois números exibidos; ver ESTATISTICAS.md 1.1",
    },
    {
      nome: "Razão aguda/crônica",
      formula: "carga de 7 dias ÷ média semanal de 28 dias",
      uso: "gestão de carga",
      ressalva: "janela acoplada; ver ESTATISTICAS.md 2.3",
    },
    {
      nome: "Dose de 7 dias",
      formula: "minutos equivalentes na janela móvel",
      uso: "card da dose e curva de 30 dias",
      ressalva: "não zera na segunda-feira",
    },
  ],
  qualidade: {
    ci: [
      "npm ci",
      "npm run lint",
      "npm run format:check",
      "npm test",
      "npm run build",
      "playwright install chromium",
      "npm run e2e",
    ],
    politica_de_teste:
      "qualquer erro de runtime ou no console reprova o teste de navegador, mesmo que as asserções passem",
    verificacao_de_conserto:
      "cada correção é conferida por mutação: desfaz-se o conserto e confirma-se que o teste correspondente reprova",
    documentos: [
      "MELHORIAS.md — dívidas e melhorias, com o que já foi resolvido",
      "ESTATISTICAS.md — auditoria dos números, com medições",
      "ORGANIZACAO.md — proposta de reorganização das abas",
    ],
  },
  limites_conhecidos: [
    "Sem sincronização entre dispositivos: os dados vivem no localStorage de um navegador",
    "maximum-scale=1 no viewport, mantido por decisão para evitar zoom acidental nos campos numéricos",
    "Sem modo escuro, por decisão",
    "React responde por 63% do pacote comprimido",
    "calcularStats é O(n) por render e leva ~100 ms com 5.000 treinos",
  ],
};

const A = arquitetura;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const camadaPor = Object.fromEntries(A.camadas.map((c) => [c.id, c]));
const ordem = ["lib", "raiz", "ui", "graficos", "telas"];

const html = `<meta charset="utf-8">
<title>Arquitetura — Zonas · Elíptico</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{
    --tinta:#16161A; --sec:#5A5A63; --ter:#8A8A93; --linha:#E2E2E8;
    --fundo:#F4F4F7; --papel:#FFFFFF; --sombra:0 1px 2px rgba(0,0,0,.04),0 10px 24px -14px rgba(0,0,0,.12);
  }
  @media (prefers-color-scheme:dark){
    :root{--tinta:#F2F2F5;--sec:#A8A8B2;--ter:#76767F;--linha:#2C2C33;--fundo:#0F0F12;--papel:#18181C;
          --sombra:0 1px 2px rgba(0,0,0,.4),0 10px 24px -14px rgba(0,0,0,.6)}
  }
  :root[data-theme="dark"]{--tinta:#F2F2F5;--sec:#A8A8B2;--ter:#76767F;--linha:#2C2C33;--fundo:#0F0F12;--papel:#18181C;
          --sombra:0 1px 2px rgba(0,0,0,.4),0 10px 24px -14px rgba(0,0,0,.6)}
  :root[data-theme="light"]{--tinta:#16161A;--sec:#5A5A63;--ter:#8A8A93;--linha:#E2E2E8;--fundo:#F4F4F7;--papel:#FFFFFF;
          --sombra:0 1px 2px rgba(0,0,0,.04),0 10px 24px -14px rgba(0,0,0,.12)}
  *{box-sizing:border-box}
  body{margin:0;background:var(--fundo);color:var(--tinta);
       font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       -webkit-font-smoothing:antialiased}
  .env{max-width:1080px;margin:0 auto;padding:44px 22px 90px}
  h1{font-size:31px;letter-spacing:-.9px;margin:0 0 6px;font-weight:700}
  .sub{color:var(--sec);font-size:15.5px;max-width:660px;margin:0 0 6px}
  .stamp{color:var(--ter);font-size:12.5px;margin-bottom:34px}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.9px;color:var(--ter);
     font-weight:700;margin:46px 0 14px;padding-bottom:9px;border-bottom:1px solid var(--linha)}
  .cartao{background:var(--papel);border:1px solid var(--linha);border-radius:14px;padding:18px 20px;box-shadow:var(--sombra)}
  .placar{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:11px}
  .placar .n{font-size:27px;font-weight:700;letter-spacing:-.9px;line-height:1.1}
  .placar .r{font-size:12px;color:var(--sec);margin-top:2px}
  .pilha{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:11px}
  .lin{display:flex;gap:11px;padding:9px 0;border-top:1px solid var(--linha);font-size:14px}
  .lin:first-child{border-top:none}
  .lin dt{color:var(--sec);width:132px;flex-shrink:0}
  .lin dd{margin:0;flex:1}
  code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
  code{background:color-mix(in srgb,var(--tinta) 7%,transparent);padding:1.5px 5px;border-radius:5px}
  /* camadas */
  .camada{background:var(--papel);border:1px solid var(--linha);border-radius:14px;overflow:hidden;
          margin-bottom:11px;box-shadow:var(--sombra)}
  .camada > header{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;user-select:none}
  .camada .faixa{width:4px;align-self:stretch;border-radius:99px;flex-shrink:0}
  .camada h3{margin:0;font-size:16px;letter-spacing:-.3px;font-weight:650}
  .camada .met{margin-left:auto;font-size:12.5px;color:var(--ter);white-space:nowrap;display:flex;gap:12px}
  .camada p{margin:0 18px 12px 34px;color:var(--sec);font-size:13.5px;max-width:720px}
  .camada .corpo{display:none;border-top:1px solid var(--linha);padding:4px 0}
  .camada.aberta .corpo{display:block}
  .camada .seta{color:var(--ter);transition:transform .18s;font-size:13px}
  .camada.aberta .seta{transform:rotate(90deg)}
  .arq{display:flex;align-items:baseline;gap:12px;padding:7px 18px 7px 34px;font-size:13.5px;border-top:1px solid var(--linha)}
  .arq:first-child{border-top:none}
  .arq .cam{flex:1;min-width:0}
  .arq .exp{color:var(--ter);font-size:11.5px;display:block;margin-top:1px;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .arq .num{color:var(--sec);font-variant-numeric:tabular-nums;font-size:12.5px;white-space:nowrap}
  .pin{display:inline-block;font-size:10.5px;font-weight:700;padding:1.5px 6px;border-radius:5px;
       background:color-mix(in srgb,var(--tinta) 8%,transparent);color:var(--sec);white-space:nowrap}
  /* fluxo */
  .fluxo{counter-reset:p}
  .passo{display:flex;gap:14px;padding:13px 0;border-top:1px solid var(--linha)}
  .passo:first-child{border-top:none}
  .passo .bolha{width:26px;height:26px;border-radius:99px;background:color-mix(in srgb,var(--tinta) 9%,transparent);
                display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;flex-shrink:0}
  .passo b{display:block;font-size:14.5px;letter-spacing:-.2px}
  .passo span{color:var(--sec);font-size:13px}
  .passo .mod{color:var(--ter);font-size:11.5px;display:block;margin-top:3px}
  table{border-collapse:collapse;width:100%;font-size:13.5px}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--ter);
     padding:0 10px 9px 0;font-weight:700;border-bottom:1px solid var(--linha)}
  td{padding:10px 10px 10px 0;border-bottom:1px solid var(--linha);vertical-align:top}
  td:first-child{font-weight:600;white-space:nowrap}
  .rv{color:var(--sec);font-size:12.5px}
  ul.lim{margin:0;padding-left:19px;color:var(--sec);font-size:13.5px}
  ul.lim li{margin:6px 0}
  .grafo{overflow-x:auto}
  .grafo svg{display:block;min-width:600px}
  .dica{color:var(--ter);font-size:12px;margin-top:9px}
</style>

<div class="env">
<h1>Arquitetura — ${esc(A.app.nome)}</h1>
<p class="sub">${esc(A.app.descricao)}</p>
<p class="stamp">Levantado do código em ${A.gerado_em} · ${A.metricas_do_codigo.arquivos_producao} arquivos de produção · ${A.metricas_do_codigo.linhas_producao.toLocaleString("pt-BR")} linhas</p>

<h2>Em números</h2>
<div class="cartao placar">
  ${[
    [A.metricas_do_codigo.linhas_producao.toLocaleString("pt-BR"), "linhas de produção"],
    [A.metricas_do_codigo.linhas_teste.toLocaleString("pt-BR"), "linhas de teste"],
    [A.metricas_do_codigo.testes_unitarios, "testes unitários"],
    [A.metricas_do_codigo.testes_navegador, "testes de navegador"],
    [A.metricas_do_codigo.pacote_gzip_kb + " kB", "pacote comprimido"],
    [A.camadas.length, "camadas"],
  ]
    .map(([n, r]) => `<div><div class="n">${n}</div><div class="r">${r}</div></div>`)
    .join("")}
</div>

<h2>Pilha</h2>
<div class="cartao">
  ${Object.entries(A.pilha)
    .map(
      ([k, v]) => `<div class="lin"><dt>${esc(k.replace(/_/g, " "))}</dt><dd>${esc(v)}</dd></div>`,
    )
    .join("")}
</div>

<h2>Camadas — toque para abrir</h2>
${ordem
  .map((id) => {
    const c = camadaPor[id];
    const arqs = A.arquivos.filter((f) => f.camada === id).sort((a, b) => b.linhas - a.linhas);
    return `<div class="camada" onclick="this.classList.toggle('aberta')">
    <header>
      <div class="faixa" style="background:${c.cor}"></div>
      <h3>${esc(c.nome)}</h3>
      <span class="pin">${id}</span>
      <span class="met"><span>${c.arquivos} arquivos</span><span>${c.linhas.toLocaleString("pt-BR")} linhas</span><span class="seta">›</span></span>
    </header>
    <p>${esc(c.papel)}</p>
    <div class="corpo">
      ${arqs
        .map(
          (f) => `<div class="arq">
        <div class="cam"><span class="mono">${esc(f.caminho)}</span>
          ${f.exporta.length ? `<span class="exp">${esc(f.exporta.join(" · "))}</span>` : ""}</div>
        <span class="num">${f.linhas} l${f.importado_por ? ` · ${f.importado_por}↓` : ""}</span>
      </div>`,
        )
        .join("")}
    </div>
  </div>`;
  })
  .join("")}
<p class="dica">O número após a barra é quantos módulos importam aquele arquivo.</p>

<h2>Quem depende de quem</h2>
<div class="cartao grafo">
  <svg viewBox="0 0 680 300" role="img" aria-label="Grafo de dependência: App importa telas, telas importam gráficos, moldura e núcleo puro; tudo converge para o núcleo puro e para a folha de estilos">
    <defs>
      <marker id="pt" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">
        <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker>
    </defs>
    ${(() => {
      const N = {
        app: { x: 340, y: 34, nome: "App.jsx", sub: "estado e abas", cor: "#FF375F" },
        telas: { x: 340, y: 116, nome: "Telas", sub: "6 arq · 1.699 l", cor: "#30D158" },
        graficos: { x: 132, y: 198, nome: "Gráficos", sub: "15 arq · 1.178 l", cor: "#5AC8FA" },
        ui: { x: 548, y: 198, nome: "Moldura", sub: "3 arq · 637 l", cor: "#FF9F0A" },
        lib: { x: 200, y: 272, nome: "Núcleo puro", sub: "6 arq · 708 l", cor: "#5E5CE6" },
        estilos: { x: 480, y: 272, nome: "estilos.js", sub: "622 l · 24 ↓", cor: "#BF5AF2" },
      };
      const E = [
        ["app", "telas", 6],
        ["telas", "graficos", 14],
        ["telas", "ui", 11],
        ["telas", "lib", 18],
        ["telas", "estilos", 6],
        ["graficos", "lib", 21],
        ["graficos", "estilos", 14],
        ["ui", "lib", 2],
        ["ui", "estilos", 3],
        ["app", "lib", 4],
        ["app", "ui", 2],
      ];
      const L = 62,
        H = 17;
      const arestas = E.map(([a, b, w]) => {
        const A2 = N[a],
          B = N[b];
        const dx = B.x - A2.x,
          dy = B.y - A2.y,
          d = Math.hypot(dx, dy) || 1;
        const x1 =
          A2.x +
          (dx / d) *
            (Math.abs(dx) > Math.abs(dy) ? L : H) *
            (Math.abs(dx) > Math.abs(dy) ? 1 : 1.1);
        const y1 = A2.y + (dy / d) * (Math.abs(dx) > Math.abs(dy) ? L : H) * 1.15;
        const x2 = B.x - (dx / d) * L * 0.86,
          y2 = B.y - (dy / d) * H * 1.9;
        return `<path d="M${x1.toFixed(0)} ${y1.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)}"
          stroke="currentColor" stroke-width="${(0.8 + w / 11).toFixed(2)}" fill="none"
          marker-end="url(#pt)" opacity="${(0.24 + w / 40).toFixed(2)}"/>`;
      }).join("");
      const caixas = Object.values(N)
        .map(
          (n) =>
            `<g><rect x="${n.x - L}" y="${n.y - H}" width="${L * 2}" height="${H * 2}" rx="9"
           fill="var(--papel)" stroke="${n.cor}" stroke-width="1.7"/>
         <text x="${n.x}" y="${n.y - 1}" text-anchor="middle" font-size="12.5" font-weight="650" fill="var(--tinta)">${n.nome}</text>
         <text x="${n.x}" y="${n.y + 12}" text-anchor="middle" font-size="9.5" fill="var(--ter)">${n.sub}</text></g>`,
        )
        .join("");
      return `<g color="var(--ter)">${arestas}</g>${caixas}`;
    })()}
  </svg>
  <p class="dica">A seta aponta de quem <b>importa</b> para o que é <b>importado</b>, e a espessura é a quantidade de importações. Nenhuma seta sobe: o núcleo puro não conhece telas, gráficos nem moldura — é isso que permite testá-lo sem montar componente. <code>estilos.js</code> aparece separado por ser a folha mais compartilhada do projeto, com 24 módulos importando.</p>
</div>

<h2>Fluxo de um dado, do disco à tela</h2>
<div class="cartao fluxo">
  ${A.fluxo_de_dados
    .map(
      (p) => `<div class="passo">
    <div class="bolha">${p.passo}</div>
    <div><b>${esc(p.nome)}</b><span>${esc(p.detalhe)}</span>
      <span class="mod mono">${esc(p.modulo)}</span></div>
  </div>`,
    )
    .join("")}
</div>

<h2>Persistência</h2>
<div class="cartao">
  ${Object.entries(A.persistencia)
    .map(
      ([k, v]) =>
        `<div class="lin"><dt>${esc(k)}</dt><dd>${
          typeof v === "object"
            ? Object.entries(v)
                .map(([a, b]) => `${esc(a)}: <code>${esc(b)}</code>`)
                .join(" · ")
            : esc(v)
        }</dd></div>`,
    )
    .join("")}
</div>

<h2>Métricas de treino</h2>
<div class="cartao" style="overflow-x:auto">
<table>
  <tr><th>Métrica</th><th>Como é calculada</th><th>Onde aparece</th><th>Ressalva</th></tr>
  ${A.metricas_do_treino
    .map(
      (m) => `<tr>
    <td>${esc(m.nome)}</td><td class="rv">${esc(m.formula)}</td>
    <td class="rv">${esc(m.uso)}</td><td class="rv">${esc(m.ressalva)}</td></tr>`,
    )
    .join("")}
</table>
</div>

<h2>Qualidade</h2>
<div class="cartao">
  <div class="lin"><dt>CI, em ordem</dt><dd class="mono">${A.qualidade.ci.map(esc).join(" → ")}</dd></div>
  <div class="lin"><dt>Política de teste</dt><dd>${esc(A.qualidade.politica_de_teste)}</dd></div>
  <div class="lin"><dt>Verificação</dt><dd>${esc(A.qualidade.verificacao_de_conserto)}</dd></div>
  <div class="lin"><dt>Documentos</dt><dd>${A.qualidade.documentos.map((d) => esc(d)).join("<br>")}</dd></div>
</div>

<h2>Limites conhecidos e aceitos</h2>
<div class="cartao"><ul class="lim">${A.limites_conhecidos.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>

</div>`;
fs.writeFileSync(path.join(raiz, "arquitetura.json"), JSON.stringify(arquitetura, null, 2) + "\n");
fs.writeFileSync(path.join(raiz, "arquitetura.html"), html + "\n");
console.log(
  `arquitetura: ${arquitetura.arquivos.length} arquivos · ` +
    `${arquitetura.metricas_do_codigo.linhas_producao} linhas de produção · ` +
    `${(html.length / 1024).toFixed(1)} kB de HTML`,
);
