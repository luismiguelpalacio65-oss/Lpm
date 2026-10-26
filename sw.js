const CACHE = 'lmp-v2';
const BASE = ['./', './index.html', './descargar.html', './manifest.json', './icon-192.png', './icon-512.png', './sonido.wav'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
// Red primero (para ver siempre la última versión); si no hay internet, usa lo guardado
self.addEventListener('fetch', e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copia = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copia));
    return r;
  }).catch(() => caches.match(e.request)));
});
// Notificación push (cuando haya servidor que las envíe)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.titulo || 'LMP', {
    body: d.texto || 'Nuevo mensaje', icon: 'icon-192.png', badge: 'icon-192.png',
    vibrate: [200, 100, 200], tag: d.tag || 'lmp-msg', renotify: true
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    if (l.length) return l[0].focus();
    return clients.openWindow('./index.html');
  }));
});
