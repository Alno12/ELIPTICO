import { ZONES, totalZ } from "./treino.js";
import { dayjs } from "./datas.js";

/* Fronteira entre o armazenamento e o resto do app.

   Nada que venha do localStorage ou de um backup chega ao motor de estatística
   sem passar por aqui. Antes disso, um registro gravado por uma versão antiga do
   esquema — sem o campo `zones`, por exemplo — derrubava a tela inteira, e não
   havia como recuperar de dentro do app.

   A regra é: consertar o que dá, descartar o que não dá, nunca propagar. */

/* número não negativo e finito; qualquer outra coisa vira 0 */
const naoNegativo = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/* Inteiro dentro de uma faixa; qualquer outra coisa vira nulo.

   Fora da faixa vira nulo em vez de ser ajustado para o limite: um 1500 gravado
   por engano não vira 250 bpm, porque 250 pareceria uma leitura real que o
   usuário nunca fez. Desconhecido é mais honesto que inventado. */
const inteiroNaFaixa = (v, min, max) => {
  const n = Math.round(naoNegativo(v));
  return n >= min && n <= max ? n : null;
};

/* faixa plausível de frequência cardíaca */
export const FC_MIN = 30;
export const FC_MAX = 250;

export const dataValida = (d) =>
  typeof d === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  !Number.isNaN(dayjs(d).getTime());

/* Devolve uma sessão íntegra, ou null se o registro for irrecuperável. */
export function normalizarSessao(bruta) {
  if (!bruta || typeof bruta !== "object" || Array.isArray(bruta)) return null;
  if (!dataValida(bruta.date)) return null;

  const cru = bruta.zones && typeof bruta.zones === "object" ? bruta.zones : {};
  const zones = Object.fromEntries(ZONES.map((z) => [z.id, naoNegativo(cru[z.id])]));

  /* `total` é derivado das zonas, nunca lido do armazenamento. Guardá-lo à parte
     criava duas fontes de verdade para o mesmo número, sem nada que garantisse
     que continuassem de acordo. */
  const total = totalZ(zones);
  if (total <= 0) return null;

  return {
    id: typeof bruta.id === "string" && bruta.id ? bruta.id : `r-${bruta.date}-${Math.round(total * 60)}`,
    date: bruta.date,
    zones,
    total,
    avgHr: inteiroNaFaixa(bruta.avgHr, FC_MIN, FC_MAX),
    maxHr: inteiroNaFaixa(bruta.maxHr, FC_MIN, FC_MAX),
    rpe: inteiroNaFaixa(bruta.rpe, 1, 10),
    notes: typeof bruta.notes === "string" ? bruta.notes : "",
  };
}

/* Normaliza a lista inteira. `descartadas` serve para avisar o usuário de que
   algo foi perdido, em vez de sumir com registros em silêncio. */
export function normalizarSessoes(bruto) {
  if (!Array.isArray(bruto)) return { sessoes: [], descartadas: 0 };

  const sessoes = [];
  let descartadas = 0;
  for (const item of bruto) {
    const s = normalizarSessao(item);
    if (s) sessoes.push(s);
    else descartadas++;
  }
  return { sessoes, descartadas };
}
