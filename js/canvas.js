/* ════════════════════════════════════════════════════════════
   CAPAS DE PARTÍCULAS
   atrás · motas de oro y brasas rojas
   adelante · pétalos de rosa negra y estallidos
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cvB = document.getElementById('fxBack');
  var cvF = document.getElementById('fxFront');
  if (!cvB || !cvF) return;

  var ctxB = cvB.getContext('2d');
  var ctxF = cvF.getContext('2d');

  var W = 0, H = 0, DPR = 1;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
  var running = true;

  /* ── sprite de brasa (radial) ─────────────────────────── */
  var sprite = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0,   'rgba(255,190,120,1)');
    rg.addColorStop(.25, 'rgba(226,86,58,.85)');
    rg.addColorStop(.55, 'rgba(150,24,40,.35)');
    rg.addColorStop(1,   'rgba(150,24,40,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    return c;
  })();

  var spriteGold = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0,   'rgba(250,232,190,1)');
    rg.addColorStop(.3,  'rgba(200,164,93,.7)');
    rg.addColorStop(1,   'rgba(200,164,93,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    return c;
  })();

  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* ── medidas ──────────────────────────────────────────── */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    [[cvB, ctxB], [cvF, ctxF]].forEach(function (pair) {
      var cv = pair[0];
      cv.width = Math.floor(W * DPR);
      cv.height = Math.floor(H * DPR);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      pair[1].setTransform(DPR, 0, 0, DPR, 0, 0);
    });
  }

  /* ── tipos de partícula ───────────────────────────────── */
  function makeDust() {
    var z = rnd(.25, 1);
    return {
      t: 'dust', z: z,
      x: rnd(0, W), y: rnd(0, H),
      r: rnd(.5, 1.6) * z,
      a: rnd(.12, .5),
      tw: rnd(.4, 1.6), ph: rnd(0, 6.28),
      vx: rnd(-.06, .06), vy: rnd(-.1, -.02)
    };
  }

  function makeEmber() {
    var z = rnd(.3, 1);
    return {
      t: 'ember', z: z,
      x: rnd(0, W), y: rnd(H * .55, H + 40),
      r: rnd(5, 13) * z,
      a: rnd(.25, .7),
      tw: rnd(.5, 1.4), ph: rnd(0, 6.28),
      vx: rnd(-.12, .12), vy: rnd(-.55, -.16) * z
    };
  }

  var PETAL_COLORS = [
    'rgba(143,18,32,.92)',   // sangre
    'rgba(96,12,24,.95)',    // vino oscuro
    'rgba(46,7,14,.95)',     // casi negro
    'rgba(181,40,60,.8)',    // carmín
    'rgba(24,6,12,.95)'      // sombra
  ];

  function makePetal(x, y, burst) {
    var z = rnd(.45, 1);
    var ang = rnd(0, 6.28);
    var sp = burst ? rnd(1.2, 5.2) : 0;
    return {
      t: 'petal', z: z,
      x: x !== undefined ? x : rnd(-40, W + 40),
      y: y !== undefined ? y : rnd(-160, -30),
      s: rnd(6, 13) * z,
      a: rnd(.55, .95),
      c: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      vy: burst ? Math.sin(ang) * sp : rnd(.45, 1.25) * z + .25,
      vx: burst ? Math.cos(ang) * sp : rnd(-.2, .2),
      rot: rnd(0, 6.28),
      vr: rnd(-.02, .02),
      fl: rnd(0, 6.28),
      fs: rnd(.014, .03),
      sway: rnd(.4, 1.6),
      swayF: rnd(.004, .012),
      burst: !!burst,
      life: burst ? 1 : 0
    };
  }

  /* ── poblaciones ──────────────────────────────────────── */
  var dust = [], embers = [], petals = [];

  function populate() {
    var w = Math.max(W, 320);
    var nd = reduce ? 0 : Math.round(Math.min(110, w / 13));
    var ne = reduce ? 0 : Math.round(Math.min(44, w / 34));
    var np = reduce ? 0 : Math.round(Math.min(30, w / 46));
    dust = []; embers = []; petals = [];
    for (var i = 0; i < nd; i++) dust.push(makeDust());
    for (var j = 0; j < ne; j++) embers.push(makeEmber());
    for (var k = 0; k < np; k++) {
      // los primeros pétalos ya caen repartidos por toda la pantalla,
      // para que el aire no esté vacío al revelar la portada
      var p = makePetal();
      p.y = rnd(-40, H + 40);
      petals.push(p);
    }
  }

  /* ── bucle ────────────────────────────────────────────── */
  var t = 0;

  function step() {
    t += 1;

    // viento: base + inercia del ratón
    mouse.vx += (mouse.tx - mouse.x) * .012;
    mouse.vy += (mouse.ty - mouse.y) * .012;
    mouse.vx *= .9;
    mouse.vy *= .9;
    mouse.x += mouse.vx;
    mouse.y += mouse.vy;

    var wind = mouse.vx * 2.4 + Math.sin(t * .0022) * .3;

    /* ── capa trasera ── */
    ctxB.clearRect(0, 0, W, H);

    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.x += d.vx + wind * d.z * .5;
      d.y += d.vy;
      if (d.y < -12) { d.y = H + 12; d.x = rnd(0, W); }
      if (d.x < -12) d.x = W + 12;
      if (d.x > W + 12) d.x = -12;
      var tw = .55 + .45 * Math.sin(t * .02 * d.tw + d.ph);
      var px = d.x - mouse.x * d.z * 14;
      var py = d.y - mouse.y * d.z * 14;
      ctxB.globalAlpha = d.a * tw;
      ctxB.drawImage(spriteGold, px - d.r, py - d.r, d.r * 2, d.r * 2);
    }

    for (var e = 0; e < embers.length; e++) {
      var b = embers[e];
      b.x += b.vx + Math.sin(t * .01 + b.ph) * .22 + wind * b.z;
      b.y += b.vy;
      if (b.y < -40) { b.y = H + rnd(10, 90); b.x = rnd(0, W); b.vy = rnd(-.55, -.16) * b.z; }
      var fl = .6 + .4 * Math.sin(t * .05 * b.tw + b.ph);
      var bx = b.x - mouse.x * b.z * 18;
      var by = b.y - mouse.y * b.z * 18;
      ctxB.globalAlpha = b.a * fl;
      ctxB.drawImage(sprite, bx - b.r, by - b.r, b.r * 2, b.r * 2);
    }

    ctxB.globalAlpha = 1;

    /* ── capa delantera ── */
    ctxF.clearRect(0, 0, W, H);

    for (var p = petals.length - 1; p >= 0; p--) {
      var q = petals[p];

      q.fl += q.fs;
      if (q.burst) {
        q.vx *= .975;
        q.vy = q.vy * .975 + .045;   // gravedad suave
        q.life -= .006;
        if (q.life <= 0 || q.y > H + 80) { petals.splice(p, 1); continue; }
      } else {
        q.vy += (rnd(.45, 1.25) * q.z + .25 - q.vy) * .02;
      }

      q.x += q.vx + Math.sin(t * q.swayF + q.fl) * q.sway * .5 + wind * q.z * 2.2;
      q.y += q.vy;
      q.rot += q.vr + Math.sin(q.fl) * .006;

      if (!q.burst && q.y > H + 60) { petals[p] = makePetal(); continue; }
      if (!q.burst && q.x < -80) q.x = W + 60;
      if (!q.burst && q.x > W + 80) q.x = -60;

      var sx = q.x - mouse.x * q.z * 26;
      var sy = q.y - mouse.y * q.z * 26;
      var squash = Math.abs(Math.cos(q.fl)) * .72 + .28;

      ctxF.save();
      ctxF.translate(sx, sy);
      ctxF.rotate(q.rot);
      ctxF.scale(1, squash);
      ctxF.globalAlpha = q.a * (q.burst ? Math.max(q.life, 0) : 1);
      ctxF.fillStyle = q.c;

      var s = q.s;
      ctxF.beginPath();
      ctxF.moveTo(0, -s * 1.35);
      ctxF.bezierCurveTo(s * 1.05, -s * .8, s * 1.05, s * .8, 0, s * 1.35);
      ctxF.bezierCurveTo(-s * 1.05, s * .8, -s * 1.05, -s * .8, 0, -s * 1.35);
      ctxF.closePath();
      ctxF.fill();

      // nervadura tenue
      ctxF.globalAlpha *= .35;
      ctxF.strokeStyle = 'rgba(255,170,150,.6)';
      ctxF.lineWidth = .6;
      ctxF.beginPath();
      ctxF.moveTo(0, -s * 1.1);
      ctxF.quadraticCurveTo(s * .18, 0, 0, s * 1.1);
      ctxF.stroke();

      ctxF.restore();
    }

    ctxF.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    step();
    requestAnimationFrame(loop);
  }

  /* ── estallido al hacer clic ───────────────────────────── */
  function burst(x, y, n) {
    n = n || 16;
    for (var i = 0; i < n; i++) petals.push(makePetal(x, y, true));
    for (var j = 0; j < 8; j++) {
      embers.push(Object.assign(makeEmber(), {
        x: x, y: y, vy: rnd(-2.4, -.4), vx: rnd(-1.6, 1.6), r: rnd(4, 10), a: rnd(.5, .95),
        _tmp: true
      }));
    }
    // limpieza de temporales tras un rato
    clearTimeout(burst._to);
    burst._to = setTimeout(function () {
      embers = embers.filter(function (e) { return !e._tmp; });
    }, 4200);
  }

  /* ── eventos ──────────────────────────────────────────── */
  window.addEventListener('pointermove', function (ev) {
    mouse.tx = (ev.clientX / Math.max(W, 1)) * 2 - 1;
    mouse.ty = (ev.clientY / Math.max(H, 1)) * 2 - 1;
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) loop();
  });

  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { resize(); populate(); }, 160);
  });

  resize();
  populate();

  if (reduce) { step(); } else { loop(); }

  /* ── API pública ──────────────────────────────────────── */
  window.GothFX = { burst: burst };
})();
