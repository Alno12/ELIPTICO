import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { seed } from "./lib/treino.js";
import { calcularStats } from "./lib/stats.js";
import { normalizarSessoes } from "./lib/sessoes.js";
import { chaveSessao, sessoesDeCsv } from "./lib/csv.js";
import { C, s } from "./estilos.js";
import { KEY, KEY_CFG, DEFAULT_CFG, store } from "./armazenamento.js";
import { Shell, TabBar } from "./ui/estrutura.jsx";
import { LimiteDeErro } from "./ui/Recuperacao.jsx";
import { Resumo } from "./telas/Resumo.jsx";
import { Tendencias } from "./telas/Tendencias.jsx";
import { Analise } from "./telas/Analise.jsx";
import { Historico } from "./telas/Historico.jsx";
import { RegistrarSheet } from "./telas/RegistrarSheet.jsx";
import { Ajustes } from "./telas/Ajustes.jsx";

/* Estado da aplicação e navegação entre abas. Tudo que desenha mora em
   `telas/`, `graficos/` e `ui/`; aqui fica só o que decide o que aparece. */

function App() {
  const [sessions, setSessions] = useState([]);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [tab, setTab] = useState("resumo");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [editando, setEditando] = useState(null);
  const scroller = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    (async () => {
      let conf = DEFAULT_CFG;
      try {
        conf = { ...DEFAULT_CFG, ...JSON.parse((await store.get(KEY_CFG)).value) };
      } catch {
        /* padrão */
      }

      let bruto = null;
      try {
        bruto = JSON.parse((await store.get(KEY)).value);
      } catch {
        /* primeira abertura */
      }

      /* nada do armazenamento chega ao motor sem passar pela normalização */
      let { sessoes, descartadas } = normalizarSessoes(bruto);
      if (descartadas) {
        /* regrava já limpo, senão o aviso reaparece a cada abertura */
        store.set(KEY, JSON.stringify(sessoes)).catch(() => {});
        setToast(
          descartadas === 1
            ? "1 registro ilegível foi descartado"
            : `${descartadas} registros ilegíveis foram descartados`,
        );
      }

      /* semeia exemplos só enquanto o usuário nunca limpou nada; depois disso,
         histórico vazio é um estado legítimo e não deve ser sobrescrito */
      if (!sessoes.length && !conf.demoLimpo) {
        sessoes = seed();
        store.set(KEY, JSON.stringify(sessoes)).catch(() => {});
      }
      setCfg(conf);
      setSessions(sessoes);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    /* com ação, precisa durar o suficiente para ler e decidir */
    const t = setTimeout(() => setToast(null), toast.acao ? 7000 : 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const onScroll = useCallback(() => setScrolled((scroller.current?.scrollTop || 0) > 34), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    /* deliberado: scrollTo dispara o evento de rolagem de forma assíncrona, e sem
       isto a sombra do cabeçalho pisca por um quadro ao trocar de aba */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrolled(false);
  }, [tab]);

  const commit = (next, msg) => {
    setSessions(next);
    if (msg) setToast(msg);
    store
      .set(KEY, JSON.stringify(next))
      .catch(() => setToast("Salvo nesta sessão, mas não foi possível gravar no dispositivo."));
  };

  const saveCfg = (next) => {
    setCfg(next);
    store.set(KEY_CFG, JSON.stringify(next)).catch(() => {});
  };

  const salvarTreino = (s) => {
    const outros = sessions.filter((x) => x.id !== s.id);
    commit(
      [s, ...outros].sort((a, b) => b.date.localeCompare(a.date)),
      editando ? "Treino atualizado" : "Treino salvo",
    );
    setSheet(null);
    setEditando(null);
  };

  const abrirRegistro = (sessao = null) => {
    setEditando(sessao ? { ...sessao } : null);
    setSheet("registrar");
  };

  /* marca que o histórico passou a ser gerido pelo usuário: nunca mais semear exemplos por cima */
  const marcarLimpo = (next = cfg) => saveCfg({ ...next, demoLimpo: true });

  /* Excluir não pede confirmação, para não atrapalhar quem acertou o toque; o
     desfazer resolve quem errou. O estado anterior já está em mãos aqui, então
     restaurar é devolver a lista — inclusive a marca de "exemplos limpos", que a
     exclusão do último treino teria acionado. */
  const excluirTreino = (id) => {
    const antes = sessions;
    const cfgAntes = cfg;
    const restantes = sessions.filter((x) => x.id !== id);
    if (!restantes.length) marcarLimpo();
    commit(restantes, {
      texto: "Treino excluído",
      acao: {
        rotulo: "Desfazer",
        fn: () => {
          if (!restantes.length) saveCfg(cfgAntes);
          commit(antes, "Treino restaurado");
        },
      },
    });
  };

  const importarCsv = async (file) => {
    let lidas;
    try {
      lidas = sessoesDeCsv(await file.text());
    } catch {
      setToast("Não foi possível ler este arquivo como CSV de treinos.");
      return;
    }
    const { sessoes, ignoradas } = lidas;
    if (!sessoes.length) {
      setToast("Nenhum treino válido encontrado no arquivo.");
      return;
    }
    const existentes = new Set(sessions.map(chaveSessao));
    const novas = sessoes.filter((x) => !existentes.has(chaveSessao(x)));
    if (!novas.length) {
      setToast("Todos os treinos do arquivo já estavam no histórico.");
      return;
    }
    const partes = [
      `${novas.length} ${novas.length === 1 ? "treino importado" : "treinos importados"}`,
    ];
    if (sessoes.length - novas.length) partes.push(`${sessoes.length - novas.length} já existiam`);
    if (ignoradas)
      partes.push(`${ignoradas} ${ignoradas === 1 ? "linha ignorada" : "linhas ignoradas"}`);
    marcarLimpo();
    commit(
      [...novas, ...sessions].sort((a, b) => b.date.localeCompare(a.date)),
      partes.join(" · "),
    );
  };

  const st = useStats(sessions, cfg);
  const titulo = {
    resumo: "Semana",
    tendencias: "Tendências",
    analise: "Análise",
    historico: "Histórico",
  }[tab];

  /* Fora do rolador de propósito — ver o comentário em `Shell`. */
  const sobreposicoes = (
    <>
      {sheet === "registrar" && (
        <RegistrarSheet
          cfg={cfg}
          inicial={editando}
          onSave={salvarTreino}
          onClose={() => {
            setSheet(null);
            setEditando(null);
          }}
        />
      )}
      {sheet === "cfg" && <Ajustes cfg={cfg} onChange={saveCfg} onClose={() => setSheet(null)} />}
      {toast && (
        <div style={s.toast} role="status">
          <span>{toast.texto ?? toast}</span>
          {toast.acao && (
            <button
              style={s.toastAcao}
              onClick={() => {
                toast.acao.fn();
              }}
            >
              {toast.acao.rotulo}
            </button>
          )}
        </div>
      )}
      <TabBar tab={tab} setTab={setTab} onPlus={() => abrirRegistro()} />
    </>
  );

  return (
    <Shell
      scroller={scroller}
      onScroll={onScroll}
      compact={scrolled}
      titulo={titulo}
      sobreposicoes={sobreposicoes}
    >
      {!ready ? (
        <div style={{ padding: 90, textAlign: "center", color: C.sec }}>Carregando…</div>
      ) : (
        <div key={tab} style={{ paddingBottom: 118 }}>
          {tab === "resumo" && (
            <Resumo st={st} cfg={cfg} sessions={sessions} onAjustes={() => setSheet("cfg")} />
          )}
          {tab === "tendencias" && <Tendencias sessions={sessions} st={st} />}
          {tab === "analise" && <Analise st={st} cfg={cfg} />}
          {tab === "historico" && (
            <Historico
              sessions={sessions}
              onEdit={(s) => abrirRegistro(s)}
              onDelete={excluirTreino}
              onClearDemo={() => {
                marcarLimpo();
                commit(
                  sessions.filter((x) => !x.demo),
                  "Dados de exemplo removidos",
                );
              }}
              onReseed={() => {
                saveCfg({ ...cfg, demoLimpo: false });
                commit(seed(), "Dados de exemplo recarregados");
              }}
              onImport={importarCsv}
              onToast={setToast}
            />
          )}
        </div>
      )}

    </Shell>
  );
}

/* ================= estatísticas ================= */

function useStats(sessions, cfg) {
  return useMemo(() => calcularStats(sessions, cfg), [sessions, cfg]);
}
/* ================= tela: semana ================= */

export default function AppComRecuperacao() {
  return (
    <LimiteDeErro>
      <App />
    </LimiteDeErro>
  );
}
