import { Component, useState } from "react";
import { C, s } from "../estilos.js";
import { EstilosBase } from "./estrutura.jsx";
import { KEY, KEY_CFG } from "../armazenamento.js";

class LimiteDeErro extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return <TelaDeRecuperacao erro={this.state.erro} />;
  }
}

function TelaDeRecuperacao({ erro }) {
  const [confirmando, setConfirmando] = useState(false);
  const [baixou, setBaixou] = useState(false);

  /* Copia o conteúdo bruto do armazenamento, sem interpretar nada: é justamente
     o dado que não deu para interpretar que precisa ser preservado. */
  const baixarCopia = () => {
    try {
      const copia = {
        exportadoEm: new Date().toISOString(),
        motivo: String(erro?.message || erro || "falha desconhecida"),
        sessoes: localStorage.getItem(KEY),
        config: localStorage.getItem(KEY_CFG),
      };
      const blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `eliptico-copia-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setBaixou(true);
    } catch {
      setBaixou(false);
    }
  };

  const limpar = () => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_CFG);
    } catch {
      /* nada a fazer */
    }
    location.reload();
  };

  return (
    <div style={s.recWrap}>
      <EstilosBase />
      <div style={s.recCard}>
        <span style={{ ...s.iconBadge, background: C.orange, marginBottom: 14 }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </span>

        <h1 style={s.recTitulo}>O app não conseguiu abrir</h1>
        <p style={s.recTexto}>
          Alguma coisa nos dados guardados impediu a tela de carregar. Seus treinos continuam no
          aparelho — baixe uma cópia antes de limpar, por segurança.
        </p>

        <button style={s.primary} onClick={baixarCopia}>
          {baixou ? "Baixar cópia de novo" : "Baixar cópia dos dados"}
        </button>
        <button style={s.secondary} onClick={() => location.reload()}>
          Tentar de novo
        </button>

        {confirmando ? (
          <>
            <p style={{ ...s.recTexto, marginTop: 18, marginBottom: 10 }}>
              Isso apaga todos os treinos deste aparelho e não tem volta.
              {baixou ? " Você já baixou uma cópia." : " Você ainda não baixou uma cópia."}
            </p>
            <button style={s.destructive} onClick={limpar}>
              Confirmar e apagar tudo
            </button>
            <button style={s.secondary} onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button style={{ ...s.secondary, color: C.red }} onClick={() => setConfirmando(true)}>
            Limpar os dados e recomeçar
          </button>
        )}

        {erro?.message && (
          <p style={s.recDetalhe}>Detalhe técnico: {String(erro.message).slice(0, 200)}</p>
        )}
      </div>
    </div>
  );
}

export { LimiteDeErro };
