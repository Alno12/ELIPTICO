/* Service worker do Zonas · Elíptico.
   Objetivo: o app abrir e funcionar sem rede. Os dados continuam no localStorage —
   este arquivo só cuida do casco (HTML, JS, CSS, ícones). */

const CACHE = "eliptico-v1";

const CASCO = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      /* allSettled: um recurso ausente não pode derrubar a instalação inteira */
      .then((c) => Promise.allSettled(CASCO.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  /* Documento: rede primeiro. Um index.html velho serviria por tempo indefinido
     bundles com hash que já não existem, deixando o app quebrado e sem conserto. */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copia));
          return r;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  /* Demais recursos: o build gera nomes com hash, então são imutáveis — cache primeiro. */
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((r) => {
        if (r.ok && r.type === "basic") {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return r;
      })
    )
  );
});
