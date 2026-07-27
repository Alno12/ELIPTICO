
import { dayjs } from "./datas.js";
import { FC_MIN, FC_MAX } from "./sessoes.js";
import { ZONES, totalZ } from "./treino.js";

/* \uFEFF é o BOM que o Excel põe no início do arquivo. Escrito como escape porque
   o caractere literal é invisível e some numa normalização distraída, o que
   quebraria a leitura de arquivos exportados de planilha sem deixar rastro. */
function parseCsv(texto) {
  const t = texto.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c !== '"') campo += c;
      else if (t[i + 1] === '"') { campo += '"'; i++; }
      else aspas = false;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/* identidade de um treino para efeito de deduplicação na reimportação */
const chaveSessao = (x) => `${x.date}|${ZONES.map((z) => Math.round((x.zones[z.id] || 0) * 60)).join("-")}`;

function sessoesDeCsv(texto) {
  const linhas = parseCsv(texto).filter((l) => l.some((c) => c.trim() !== ""));
  if (linhas.length < 2) throw new Error("arquivo sem linhas de dados");
  const cab = linhas[0].map((c) => c.trim().toLowerCase());
  const col = (nome) => cab.indexOf(nome);
  if (col("data") < 0) throw new Error("coluna 'data' não encontrada");
  /* bpm e RPE são inteiros; tempo de zona é decimal e não pode ser arredondado,
     senão os segundos se perdem na volta */
  const num = (v) => {
    const n = Number(String(v ?? "").trim().replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };
  /* mesma regra da normalização: fora da faixa é desconhecido, não é o limite */
  const naFaixa = (n, min, max) => (n >= min && n <= max ? n : null);
  const dec = (v) => {
    const n = Number(String(v ?? "").trim().replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const sessoes = [];
  let ignoradas = 0;
  linhas.slice(1).forEach((l, k) => {
    const date = String(l[col("data")] ?? "").trim();
    const zones = Object.fromEntries(ZONES.map((z) => [z.id, dec(l[col(z.id)])]));
    const total = totalZ(zones);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dayjs(date).getTime()) || !total) {
      ignoradas++;
      return;
    }
    sessoes.push({
      id: `imp-${Date.now().toString(36)}-${k}`,
      date, zones, total,
      avgHr: naFaixa(num(l[col("fc_media")]), FC_MIN, FC_MAX),
      maxHr: naFaixa(num(l[col("fc_max")]), FC_MIN, FC_MAX),
      rpe: naFaixa(num(l[col("rpe")]), 1, 10),
      notes: String(l[col("notas")] ?? "").trim(),
    });
  });
  return { sessoes, ignoradas };
}

export { parseCsv, chaveSessao, sessoesDeCsv };
