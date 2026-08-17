const CACHE = "dabakala-1787009972998";
const ASSETS = ["./manifest.json", "./icon-192.png", "./icon-512.png", "./banner-hero.jpg"].concat(["./app.RGCAXCYP.js","./app.5MQKNDBK.css"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Supprime les caches des anciennes versions (les fichiers app.[empreinte].js
  // changent de nom à chaque déploiement, donc rien de périmé ne traîne).
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Page HTML : toujours le réseau en premier, pour ne jamais servir une
  // version périmée. cache:"no-store" force le contournement du cache HTTP
  // du navigateur lui-même. Le cache ne sert que de secours hors-ligne.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request.url, { cache: "no-store" }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Fichiers statiques : cache d'abord (instantané). C'est sans risque car
  // app.[empreinte].js change de nom à chaque nouvelle version — un ancien
  // fichier en cache n'est jamais réclamé par le nouvel index.html.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return resp;
      });
    })
  );
});
