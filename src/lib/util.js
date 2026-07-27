/* helpers puros, sem dependência de outros módulos */

const sum = (a, f) => a.reduce((x, s) => x + f(s), 0);
const fmt = (n, d = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function desvio(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 4) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* O app guarda tempo de zona em minutos decimais; o usuário digita minutos e segundos.
   Estas três funções são a única ponte entre as duas representações. */
const minSeg = (minutos) => {
  const seg = Math.max(0, Math.round((Number(minutos) || 0) * 60));
  return { m: Math.floor(seg / 60), s: seg % 60 };
};
const deMinSeg = (m, s) => Math.max(0, Number(m) || 0) + Math.max(0, Number(s) || 0) / 60;
const mmss = (minutos) => {
  const { m, s } = minSeg(minutos);
  return `${m}:${String(s).padStart(2, "0")}`;
};

/* Campo de tempo onde os dígitos entram pela direita, como no visor de um
   cronômetro: 1 vira 0:01, 12 vira 0:12, 120 vira 1:20 e 1205 vira 12:05.

   O estado do campo é a cadeia de dígitos, não o número. É o que faz o apagar
   se comportar: some o último dígito e o resto desliza de volta sozinho, sem
   precisar de nenhuma regra de cursor. */

/* Só os algarismos do que foi digitado. Zeros à frente somem porque não mudam o
   valor e atrapalham a contagem; cinco algarismos dão até 999:99, mais do que
   qualquer sessão numa zona. */
const soDigitos = (texto) =>
  String(texto ?? "")
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .slice(-5);

/* Os dois últimos algarismos são os segundos, o resto são os minutos. Ao pé da
   letra, sem normalizar: digitando 8, 3, 0 o campo passa por "0:83" antes de
   chegar em "8:30".

   Normalizar a cada tecla parece mais correto e não é: 83 s viraria 1:23, os
   dígitos guardados passariam a ser 123, e o 0 seguinte daria 12:30 em vez de
   8:30. Qualquer tempo cujo caminho passe por mais de 59 s seria impossível de
   digitar. O acerto vem depois, ao sair do campo. */
const tempoDeDigitos = (d) => {
  if (!d) return "";
  const p = String(d).padStart(3, "0");
  return `${Number(p.slice(0, -2))}:${p.slice(-2)}`;
};

const minutosDeDigitos = (d) => {
  if (!d) return 0;
  const p = String(d).padStart(3, "0");
  return Number(p.slice(0, -2)) + Number(p.slice(-2)) / 60;
};

const digitosDeMinutos = (minutos) => {
  const { m, s } = minSeg(minutos);
  return m || s ? `${m}${String(s).padStart(2, "0")}`.replace(/^0+/, "") : "";
};

/* A volta pelo valor é o que normaliza: "0:83" vira 1:23 e os dígitos guardados
   passam a ser 123. Vale ao sair do campo, quando a digitação já terminou. */
const arrumarDigitos = (texto) => digitosDeMinutos(minutosDeDigitos(soDigitos(texto)));

export {
  sum,
  fmt,
  clamp,
  cap,
  desvio,
  pearson,
  mulberry32,
  minSeg,
  deMinSeg,
  mmss,
  soDigitos,
  tempoDeDigitos,
  minutosDeDigitos,
  digitosDeMinutos,
  arrumarDigitos,
};
