import { cap } from "./util.js";

const DIAS_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];
const DIAS_NOME = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/* data em componentes locais; toISOString() seria UTC e viraria o dia à noite em fuso negativo */
const pad2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dayjs = (s) => new Date(s + "T12:00:00");
const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const diffDias = (a, b) => Math.round((dayjs(b) - dayjs(a)) / 864e5);

function mondayOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const longDate = (d) => cap(dayjs(d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }));
const shortDate = (d) => cap(dayjs(d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, ""));

export { DIAS_CURTO, DIAS_NOME, pad2, iso, dayjs, daysAgo, diffDias, mondayOf, longDate, shortDate };
