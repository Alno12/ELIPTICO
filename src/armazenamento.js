/* Chaves, configuração padrão e o adaptador de armazenamento. Fica à parte
   porque a tela de recuperação precisa das chaves sem depender do App. */

const KEY = "eliptico:v5:sessoes";
const KEY_CFG = "eliptico:v5:config";
const DEFAULT_CFG = {
  maxHr: 193,
  restHr: 65,
  method: "hrr",
  weeklyGoal: 150,
  vo2max: 41.8,
  demoLimpo: false,
};

/* ================= armazenamento tolerante a falha ================= */

const store = {
  async get(k) {
    const v = localStorage.getItem(k);
    if (v === null) throw new Error("sem registro");
    return { key: k, value: v };
  },
  async set(k, v) {
    localStorage.setItem(k, v);
    return { key: k, value: v };
  },
};

/* ================= utilidades ================= */

export { KEY, KEY_CFG, DEFAULT_CFG, store };
