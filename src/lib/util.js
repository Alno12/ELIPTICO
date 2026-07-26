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

export { sum, fmt, clamp, cap, desvio, pearson, mulberry32, minSeg, deMinSeg, mmss };
