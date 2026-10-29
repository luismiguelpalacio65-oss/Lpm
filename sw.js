self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { return; });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
      var visible = l.some(function (c) { return c.visibilityState === 'visible'; });
      if (visible) return;
      return self.registration.showNotification(d.title || 'LMP', {
        body: d.body || 'Tenés un mensaje nuevo',
        icon: 'lmp-192.png', badge: 'lmp-192.png',
        vibrate: [200, 100, 200], tag: 'lmp-msg', renotify: true
      });
    })
  );
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    if (l.length) return l[0].focus();
    return clients.openWindow('./index.html');
  }));
});
