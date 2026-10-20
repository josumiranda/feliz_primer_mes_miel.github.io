/* ════════════════════════════════════════════════════════════
   AMBIENTE SONORO · sintetizado con Web Audio
   drone grave · viento · campanas lejanas
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var btn = document.getElementById('soundBtn');
  if (!btn) return;

  var ctx = null, master = null, bellTimer = null, on = false;

  // escala: la menor natural (campanas)
  var SCALE = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

  function bell(freq) {
    var now = ctx.currentTime;
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) pan.pan.value = (Math.random() * 1.6) - .8;

    var car = ctx.createOscillator();
    var mod = ctx.createOscillator();
    var modG = ctx.createGain();
    var amp = ctx.createGain();
    var lp = ctx.createBiquadFilter();

    car.type = 'sine';
    car.frequency.value = freq;
    mod.type = 'sine';
    mod.frequency.value = freq * 2.756;          // inarmónico = metal
    modG.gain.value = freq * 1.4;

    lp.type = 'lowpass';
    lp.frequency.value = 2400;

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(0.055 + Math.random() * 0.03, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 5.2);

    mod.connect(modG);
    modG.connect(car.frequency);
    car.connect(lp);
    lp.connect(amp);
    if (pan) { amp.connect(pan); pan.connect(master); } else { amp.connect(master); }

    car.start(now); mod.start(now);
    car.stop(now + 5.4); mod.stop(now + 5.4);
  }

  function scheduleBell() {
    clearTimeout(bellTimer);
    bellTimer = setTimeout(function () {
      if (!on) return;
      bell(SCALE[(Math.random() * SCALE.length) | 0] * (Math.random() < .25 ? 2 : 1));
      scheduleBell();
    }, 7000 + Math.random() * 9000);
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // ── drone grave (dos senos desafinados + filtro) ──
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = .4;
    lp.connect(master);

    var g1 = ctx.createGain(); g1.gain.value = .5;
    var g2 = ctx.createGain(); g2.gain.value = .34;
    var g3 = ctx.createGain(); g3.gain.value = .16;

    var o1 = ctx.createOscillator(); o1.type = 'sine';     o1.frequency.value = 55;    // La1
    var o2 = ctx.createOscillator(); o2.type = 'sine';     o2.frequency.value = 55.6;  // batido lento
    var o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 82.41; // Mi2

    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    g1.connect(lp); g2.connect(lp); g3.connect(lp);
    o1.start(); o2.start(); o3.start();

    // ── respiración del drone (LFO en ganancia) ──
    var breathe = ctx.createOscillator();
    breathe.frequency.value = 0.05;
    var breatheG = ctx.createGain();
    breatheG.gain.value = .12;
    breathe.connect(breatheG);
    breatheG.connect(g1.gain);
    breathe.start();

    // ── viento (ruido filtrado) ──
    var len = ctx.sampleRate * 3;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    var noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = .6;

    var ng = ctx.createGain(); ng.gain.value = .05;

    var windLFO = ctx.createOscillator(); windLFO.frequency.value = .07;
    var windLFOG = ctx.createGain(); windLFOG.gain.value = 260;
    windLFO.connect(windLFOG); windLFOG.connect(bp.frequency);
    windLFO.start();

    noise.connect(bp); bp.connect(ng); ng.connect(master);
    noise.start();
  }

  function toggle() {
    if (!ctx) build();

    on = !on;
    btn.classList.toggle('is-on', on);

    var now = ctx.currentTime;
    if (ctx.state === 'suspended') ctx.resume();

    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    if (on) {
      master.gain.linearRampToValueAtTime(0.62, now + 2.4);
      bell(SCALE[2]);
      scheduleBell();
    } else {
      master.gain.linearRampToValueAtTime(0, now + 1.1);
      clearTimeout(bellTimer);
    }
  }

  btn.addEventListener('click', toggle);

  window.GothAudio = { toggle: toggle };
})();
