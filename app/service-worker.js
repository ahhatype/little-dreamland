const CACHE = "little-dreamland-app-v7";
const APP_SHELL = [
  "./", "./index.html", "./styles.css", "./app.css", "./script.js", "./world.js", "./app.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./princess.svg", "./bunny.svg", "./dragon.svg", "./horse.svg", "./unicorn.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("little-dreamland-app-") && key !== CACHE)
      .map((key) => caches.delete(key)),
  )));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  if (event.request.mode === "navigate" &&
      (url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`)) {
    event.respondWith(caches.open(CACHE).then((cache) =>
      cache.match("./index.html").then((cached) => cached || fetch(event.request))));
    return;
  }
  event.respondWith(caches.open(CACHE).then((cache) =>
    cache.match(event.request).then((cached) => cached || fetch(event.request))));
});
