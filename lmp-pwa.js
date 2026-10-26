(function () {
  var audio = new Audio('sonido.wav');
  audio.preload = 'auto';
  var sonidoActivo = localStorage.getItem('lmp_sonido') !== 'no';
  var desbloqueado = false;
  var instalador = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (e) { console.log('SW', e); });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); instalador = e;
    document.dispatchEvent(new Event('lmp-puede-instalar'));
  });
  window.addEventListener('appinstalled', function () { instalador = null; });

  function desbloquear() {
    if (desbloqueado) return;
    audio.muted = true;
    audio.play().then(function () { audio.pause(); audio.currentTime = 0; audio.muted = false; desbloqueado = true; })
      .catch(function () { audio.muted = false; });
  }
  document.addEventListener('click', desbloquear, { once: true });
  document.addEventListener('touchstart', desbloquear, { once: true });

  window.LMP = {
    instalar: function () {
      if (!instalador) return Promise.resolve(false);
      instalador.prompt();
      return instalador.userChoice.then(function (r) { instalador = null; return r.outcome === 'accepted'; });
    },
    puedeInstalar: function () { return !!instalador; },
    sonidoActivo: function () { return sonidoActivo; },
    setSonido: function (si) { sonidoActivo = !!si; localStorage.setItem('lmp_sonido', si ? 'si' : 'no'); if (si) { audio.currentTime = 0; audio.play().catch(function () {}); } },
    pedirPermiso: function () {
      if (!('Notification' in window)) return Promise.resolve('no-soportado');
      return Notification.requestPermission();
    },
    nuevoMensaje: function (remitente, texto) {
      if (sonidoActivo) { try { audio.currentTime = 0; audio.play().catch(function () {}); } catch (_) {} }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
        navigator.serviceWorker.ready.then(function (reg) {
          reg.showNotification(remitente || 'LMP', {
            body: texto || 'Nuevo mensaje', icon: 'icon-192.png', badge: 'icon-192.png',
            vibrate: [200, 100, 200], tag: 'lmp-msg', renotify: true
          });
        });
      }
    }
  };
})();
