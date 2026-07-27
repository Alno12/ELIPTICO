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

function Shell({ children, scroller, onScroll, compact, titulo }) {
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

      <div style={s.phone}>
        <div style={{ ...s.compactBar, opacity: compact ? 1 : 0, pointerEvents: "none" }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>{titulo}</span>
        </div>
        <div ref={scroller} onScroll={onScroll} style={s.scroll}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Sheet({ children, onClose, titulo, esquerda, direita }) {
  return (
    <div style={s.sheetWrap} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.grabber} />
        <div style={s.sheetHead}>
          <span style={{ width: 74 }}>{esquerda}</span>
          <strong style={{ fontSize: 17, letterSpacing: "-0.3px" }}>{titulo}</strong>
          <span style={{ width: 74, textAlign: "right" }}>{direita}</span>
        </div>
        <div style={{ padding: "0 16px 34px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
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

export { EstilosBase, Shell, Sheet, LargeTitle, SectionTitle, Card, Empty, TabBar };
