(function () {
  var ctx = null;
  var sonidoActivo = localStorage.getItem('lmp_sonido') !== 'no';
  var instalador = null;

  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); }
    return ctx;
  }
  function beep() {
    var c = ac(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    var t = c.currentTime;
    [[880, 0], [1318, 0.14]].forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t + p[1]);
      g.gain.exponentialRampToValueAtTime(0.5, t + p[1] + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p[1] + 0.2);
      o.connect(g); g.connect(c.destination);
      o.start(t + p[1]); o.stop(t + p[1] + 0.22);
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (e) { console.log('SW', e); });
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); instalador = e;
  });
  window.addEventListener('appinstalled', function () { instalador = null; });

  function desbloquear() { var c = ac(); if (c && c.state === 'suspended') c.resume(); }
  document.addEventListener('click', desbloquear);
  document.addEventListener('touchstart', desbloquear);

  window.LMP = {
    instalar: function () {
      if (!instalador) return Promise.resolve(false);
      instalador.prompt();
      return instalador.userChoice.then(function (r) { instalador = null; return r.outcome === 'accepted'; });
    },
    puedeInstalar: function () { return !!instalador; },
    sonidoActivo: function () { return sonidoActivo; },
    setSonido: function (si) { sonidoActivo = !!si; localStorage.setItem('lmp_sonido', si ? 'si' : 'no'); if (si) beep(); },
    pedirPermiso: function () {
      if (!('Notification' in window)) return Promise.resolve('no-soportado');
      return Notification.requestPermission();
    },
    nuevoMensaje: function (remitente, texto) {
      if (sonidoActivo) { try { beep(); } catch (_) {} }
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
