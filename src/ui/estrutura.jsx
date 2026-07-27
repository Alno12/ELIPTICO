import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ZONES } from "../lib/treino.js";
import { C, s } from "../estilos.js";

/* Moldura da aplicação: o que envolve as telas em vez de pertencer a alguma
   delas — o quadro do telefone, a barra de abas, as folhas modais e os
   componentes de título e de card usados por todas. */

function EstilosBase() {
  return (
    <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,textarea,button{font:inherit;color:inherit}
        button{cursor:pointer;border:none;background:none}
        input[type=number]::-webkit-inner-spin-button{display:none}
        input[type=number]{-moz-appearance:textfield}
        input[type=date]{-webkit-appearance:none}
        button:active{transform:scale(.982);opacity:.7}
        input:focus-visible,textarea:focus-visible,button:focus-visible{outline:2.5px solid ${C.blue};outline-offset:2px;border-radius:8px}
        @keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes fade{from{opacity:0}to{opacity:1}}
        @keyframes sheetIn{from{transform:translateY(100%)}to{transform:none}}
        @keyframes deEsquerda{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
        @keyframes deDireita{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
        .card{animation:rise .5s cubic-bezier(.16,.84,.28,1) both}
        @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>
  );
}

/* `sobreposicoes` são irmãs da div que rola, não filhas dela, e isso é o ponto.
   Enquanto a folha modal, o aviso e a barra de abas ficavam dentro do rolador,
   qualquer arrasto sobre eles subia a cadeia de ancestrais e encontrava o rolador
   — então rolava a tela de trás. No iPhone era o que acontecia: arrastar na folha
   mexia a página atrás dela. `overscroll-behavior` não resolve isso, porque só
   contém o gesto que começa dentro de algo que rola e chega ao fim; o arrasto que
   começa no cabeçalho da folha, no espaço entre campos ou no fundo escurecido
   nunca passou por lá. Fora do rolador, não há o que encadear. */
function Shell({ children, sobreposicoes, scroller, onScroll, compact, titulo }) {
  return (
    <div style={s.page}>
      <EstilosBase />

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          {ZONES.map((z) => (
            <linearGradient key={z.id} id={`zg-${z.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={z.light} />
              <stop offset="100%" stopColor={z.color} />
            </linearGradient>
          ))}
          <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF375F" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FF375F" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradCtl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradAcum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30D158" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#30D158" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradNeutro" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6D6DB" />
            <stop offset="100%" stopColor="#BFBFC6" />
          </linearGradient>
          <linearGradient id="gradAlerta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFBC55" />
            <stop offset="100%" stopColor="#FF9F0A" />
          </linearGradient>
          <linearGradient id="gradIntensa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF7A96" />
            <stop offset="100%" stopColor="#FF375F" />
          </linearGradient>
          <linearGradient id="gradDia" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B8CFF" />
            <stop offset="100%" stopColor="#5E5CE6" />
          </linearGradient>
        </defs>
      </svg>

      <div style={s.phone} data-camadas>
        <div style={{ ...s.compactBar, opacity: compact ? 1 : 0, pointerEvents: "none" }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>{titulo}</span>
        </div>
        <div ref={scroller} onScroll={onScroll} style={s.scroll} data-rolagem="app">
          {children}
        </div>
        {sobreposicoes}
      </div>
    </div>
  );
}

/* Toda camada modal se desenha no quadro do telefone, e não onde foi escrita.

   Sem isto, uma folha aberta de dentro de uma tela nasce dentro da div que rola,
   e todo arrasto sobre ela encontra o rolador subindo pela cadeia de ancestrais:
   é a tela de trás que se mexe. A caixa de confirmação do Histórico é levantada
   lá de dentro justamente assim.

   Fica dentro dos próprios componentes modais, e não a cargo de quem os usa,
   porque a garantia tem de valer em qualquer lugar de onde forem chamados. */
const naCamadaDeCima = (conteudo) => {
  const alvo = typeof document !== "undefined" && document.querySelector("[data-camadas]");
  return alvo ? createPortal(conteudo, alvo) : conteudo;
};

/* Elementos que o teclado alcança dentro de um contêiner, na ordem em que os
   alcança. Exclui os desabilitados e os que estão fora de vista. */
const focaveis = (raiz) =>
  [
    ...raiz.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => !el.disabled && el.offsetParent !== null);

/* Comportamento de diálogo: foco preso dentro da caixa, Esc fecha, o fundo para
   de rolar e o foco volta a quem abriu.

   Fica num hook porque tanto a folha modal quanto a caixa de confirmação
   precisam do mesmo, e duplicar armadilha de foco é como duplicar fechadura:
   uma das duas vai ficar para trás numa mudança futura. */
function useDialogo(caixa, onClose, focoInicial = 0) {
  useEffect(() => {
    const abriuCom = document.activeElement;
    const alvos = focaveis(caixa.current);
    /* `preventScroll` porque neste instante a caixa ainda está fora da tela, no
       começo da animação: sem ele o navegador rola os contêineres de cima para
       revelar o que acabou de receber o foco. O Safari do iOS honra a opção há
       poucas versões, então o que garante mesmo é a caixa não ser descendente
       do rolador — revelar algo fora dele não tem o que rolar. */
    (alvos[focoInicial] || alvos[0] || caixa.current)?.focus({ preventScroll: true });

    /* Trava o rolador por `touch-action`, e não por `overflow: hidden`.

       O `overflow` muda a geometria: um elemento rolado a 700 px que deixa de
       ser rolável tem a posição grampeada no topo, e ao reabrir a rolagem a tela
       já não está onde estava — é o salto que aparecia no iPhone ao abrir a
       folha. `touch-action: none` não mexe em layout nem em posição de rolagem;
       só diz ao navegador para não arrastar este elemento com o dedo.

       Isto é a segunda linha de defesa. A primeira é estrutural: as camadas
       modais ficam fora do rolador, então o gesto nem chega aqui. */
    const fundo = document.querySelector('[data-rolagem="app"]');
    const tatoAntes = fundo?.style.touchAction;
    if (fundo) fundo.style.touchAction = "none";

    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = focaveis(caixa.current);
      if (!lista.length) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      if (fundo) fundo.style.touchAction = tatoAntes || "";
      /* devolve o foco a quem abriu, senão o teclado recomeça do topo da página */
      abriuCom?.focus?.();
    };
  }, [caixa, onClose, focoInicial]);
}

/* Folha modal com semântica de diálogo.

   Antes era só um `<div>` desenhado por cima: o teclado atravessava para o
   conteúdo de trás, o Esc não fazia nada, o fundo continuava rolando e o leitor
   de tela seguia lendo a página como se nada tivesse aberto. Para quem não usa
   o toque, abrir "Novo treino" era perder a referência de onde estava. */
function Sheet({ children, onClose, titulo, esquerda, direita, rotulo }) {
  const caixa = useRef(null);
  useDialogo(caixa, onClose);

  return naCamadaDeCima(
    <div style={s.sheetWrap} onClick={onClose} role="presentation">
      <div style={s.sheetFundo} data-fundo-folha />
      <div
        ref={caixa}
        style={s.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={rotulo || titulo}
        tabIndex={-1}
      >
        <div style={s.grabber} />
        <div style={s.sheetHead}>
          <span style={{ width: 74 }}>{esquerda}</span>
          <strong style={{ fontSize: 17, letterSpacing: "-0.3px" }}>{titulo}</strong>
          <span style={{ width: 74, textAlign: "right" }}>{direita}</span>
        </div>
        <div style={s.sheetConteudo}>{children}</div>
      </div>
    </div>,
  );
}

/* Confirmação para ação destrutiva. Centralizada e curta de propósito: é uma
   pergunta, não um formulário. O foco começa em Cancelar, para que Enter no
   susto não apague nada. */
function Confirmacao({ titulo, texto, rotuloConfirmar, onConfirmar, onCancelar }) {
  const caixa = useRef(null);
  useDialogo(caixa, onCancelar, 0);

  return naCamadaDeCima(
    <div style={s.confirmWrap} onClick={onCancelar} role="presentation">
      <div
        ref={caixa}
        style={s.confirmCaixa}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <strong style={s.confirmTitulo}>{titulo}</strong>
        {texto && <p style={s.confirmTexto}>{texto}</p>}
        <button style={s.secondary} onClick={onCancelar}>
          Cancelar
        </button>
        <button style={s.destructive} onClick={onConfirmar}>
          {rotuloConfirmar}
        </button>
      </div>
    </div>,
  );
}

const LargeTitle = ({ title, action }) => (
  <div style={s.largeTitle}>
    <h1 style={s.h1}>{title}</h1>
    {action && (
      <button style={s.link} onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);

const SectionTitle = ({ children }) => <div style={s.section}>{children}</div>;

const Card = ({ children, pad = 16, i = 0 }) => (
  <div
    className="card"
    style={{ ...s.card, padding: pad, animationDelay: `${Math.min(i, 10) * 0.035}s` }}
  >
    {children}
  </div>
);

const Empty = () => (
  <Card>
    <p style={{ ...s.foot, margin: 0, textAlign: "center", padding: 26 }}>
      Nenhum treino registrado. Toque no botão + para começar.
    </p>
  </Card>
);

function TabBar({ tab, setTab, onPlus }) {
  const esq = [
    { id: "resumo", l: "Semana", d: "M3 12h4l2.5 6 3.5-12 2.5 6h5" },
    { id: "tendencias", l: "Tendências", d: "M4 19V9M9.5 19V5M15 19v-7M20.5 19v-4" },
  ];
  const dir = [
    { id: "analise", l: "Análise", d: "M4.5 17a7.5 7.5 0 1115 0M12 17l4-5" },
    { id: "historico", l: "Histórico", d: "M4 6h16M4 12h16M4 18h10" },
  ];
  const Btn = ({ i }) => {
    const on = tab === i.id;
    return (
      <button onClick={() => setTab(i.id)} style={s.tabBtn} aria-current={on ? "page" : undefined}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={on ? C.red : C.sec}
          strokeWidth={on ? 2.4 : 1.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={i.d} />
        </svg>
        <span
          style={{
            fontSize: 10,
            color: on ? C.red : C.sec,
            fontWeight: on ? 600 : 400,
            letterSpacing: "-0.2px",
          }}
        >
          {i.l}
        </span>
      </button>
    );
  };

  return (
    <nav style={s.tabbar}>
      {esq.map((i) => (
        <Btn key={i.id} i={i} />
      ))}
      <div style={s.tabBtn}>
        <button onClick={onPlus} style={s.fab} aria-label="Registrar treino">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {dir.map((i) => (
        <Btn key={i.id} i={i} />
      ))}
    </nav>
  );
}

/* ================= rede final ================= */

/* A normalização na leitura cobre os dados malformados que conhecemos. Este
   limite cobre o resto: qualquer falha de renderização que escape dela. Sem ele,
   o React desmonta a árvore e sobra uma página em branco — e como os dados vivem
   no localStorage de um PWA, o usuário não tem por onde recuperar, a não ser
   apagando os dados do site e perdendo todo o histórico. */

export { EstilosBase, Shell, Sheet, Confirmacao, LargeTitle, SectionTitle, Card, Empty, TabBar };
