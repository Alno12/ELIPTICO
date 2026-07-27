/* caminho de retângulo com só o topo arredondado; usado pelas barras empilhadas */
function topRounded(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, Math.max(h, 0.01));
  return `M${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} L${x},${y + h} Z`;
}

/* ================= app ================= */

export { topRounded };
