/* ════════════════════════════════════════════════════════════
   COREOGRAFÍA
   preloader · apertura · parallax · scroll · cursor
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pre    = document.getElementById('preloader');

  function hidePreloader() {
    if (!pre) return;
    pre.style.transition = 'opacity .8s ease';
    pre.style.opacity = '0';
    setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 900);
  }

  /* ── sin GSAP: versión mínima pero visible ─────────────── */
  if (!window.gsap) {
    document.documentElement.classList.add('no-anim');
    window.addEventListener('load', hidePreloader);
    setTimeout(hidePreloader, 4000);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── desplazamiento suave (Lenis) ──────────────────────── */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var monogram = document.getElementById('monogram');
  if (monogram) {
    monogram.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── divisores de texto ────────────────────────────────── */
  function splitWords(el) {
    var lines = el.querySelectorAll('.phrase__l');
    var all = [];
    lines.forEach(function (line) {
      var words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = w;
        line.appendChild(s);
        if (i < words.length - 1) line.appendChild(document.createTextNode(' '));
        all.push(s);
      });
    });
    return all;
  }

  /* ── preparación de rosas (trazo del tallo) ────────────── */
  var roses = gsap.utils.toArray('.rose');
  var stems = [];

  roses.forEach(function (rose) {
    var stem = rose.querySelector('.stem-line');
    var len  = 0;
    try { len = stem.getTotalLength(); } catch (e) { len = 900; }
    stem.style.visibility = 'visible';
    gsap.set(stem, { strokeDasharray: len, strokeDashoffset: len });
    stems.push({ rose: rose, stem: stem, len: len });
  });

  /* ── ESTADO INICIAL ────────────────────────────────────── */
  gsap.set('#moon', { opacity: 0, scale: .86 });
  gsap.set('#roseWindow', { opacity: 0, scale: 1.1, rotation: -6 });
  gsap.set('.skyline--near', { opacity: 0, y: 50 });
  gsap.set('.skyline--far',  { opacity: 0, y: 30 });
  gsap.set('#finTitle .title__c',  { opacity: 0, y: 44, filter: 'blur(12px)' });
  gsap.set('#heroLabel, #heroSub', { opacity: 0, y: 12 });
  gsap.set('#finLabel, #finScript', { opacity: 0, y: 14 });
  gsap.set('#heroRule i', { scaleX: 0 });
  gsap.set('#heroRule b', { scale: 0, rotation: 45 });
  gsap.set('.cue', { opacity: 0 });
  gsap.set('#monogram, #soundBtn', { opacity: 0, scale: .7 });
  gsap.set(roses, { opacity: 0 });
  gsap.set('.leaf, .thorn', { scale: 0, transformOrigin: '50% 50%' });
  gsap.set('.rose__bloom', { scale: 0, transformOrigin: '50% 50%' });
  gsap.set('.ornament', { opacity: 0, scaleX: .2, transformOrigin: '50% 50%' });

  /* ── APERTURA ──────────────────────────────────────────── */
  var bar = document.getElementById('preBar');
  var tl = gsap.timeline({ paused: true });

  tl.to('#moon', { opacity: .92, scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .to('#roseWindow', { opacity: .85, scale: 1, rotation: 0, duration: 2.8, ease: 'power3.out' }, .1)
    .to('.skyline--far',  { opacity: .55, y: 0, duration: 1.8, ease: 'power2.out' }, .5)
    .to('.skyline--near', { opacity: 1, y: 0, duration: 1.8, ease: 'power2.out' }, .6)

    .to('#heroLabel', { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, .9)
    .to('#heroRule i', { scaleX: 1, duration: 1.1, ease: 'power2.inOut', stagger: .06 }, 1.35)
    .to('#heroRule b', { scale: 1, duration: .7, ease: 'back.out(2.2)' }, 1.75)
    .to('#heroSub', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 1.85)

    .to(roses, { opacity: 1, duration: .8, ease: 'power1.out', stagger: .12 }, 1.5);

  // crecimiento de cada rosa
  stems.forEach(function (s, i) {
    var at = 1.5 + i * .16;
    tl.to(s.stem, { strokeDashoffset: 0, duration: 1.9, ease: 'power2.inOut' }, at)
      .to(s.rose.querySelectorAll('.leaf, .thorn'), {
        scale: 1, duration: .8, ease: 'back.out(1.9)', stagger: .1
      }, at + .9)
      .to(s.rose.querySelector('.rose__bloom'), {
        scale: 1, duration: 1.35, ease: 'elastic.out(1, .58)'
      }, at + 1.15);
  });

  tl.to('#cue', { opacity: 1, duration: 1, ease: 'power1.out' }, 3.1)
    .to('#monogram, #soundBtn', { opacity: 1, scale: 1, duration: .9, ease: 'back.out(1.8)', stagger: .1 }, 3.0)
    .add(function () {
      if (reduce) return;
      // balanceo continuo de las rosas
      roses.forEach(function (rose, i) {
        gsap.to(rose, {
          rotation: (i % 2 ? 1.4 : -1.4) * (0.7 + Math.random() * .8),
          y: (i % 2 ? 4 : -4),
          duration: 3.2 + i * .5 + Math.random(),
          yoyo: true, repeat: -1, ease: 'sine.inOut',
          transformOrigin: 'bottom center'
        });
      });
    }, 3.4);

  /* ── PRELOADER → APERTURA ──────────────────────────────── */
  if (bar) gsap.set(bar, { scaleX: 0 });
  if (!reduce && bar) gsap.to(bar, { scaleX: .74, duration: 1.2, ease: 'power1.out' });

  var isLoaded = false, fontsReady = false, started = false;
  var t0 = performance.now();

  window.addEventListener('load', function () { isLoaded = true; });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fontsReady = true; ScrollTrigger.refresh(); });
  } else { fontsReady = true; }

  // la intro debe arrancAR SIEMPRE, aunque rAF esté silenciado (pestaña oculta)
  function startIntro() {
    if (started) return;
    started = true;

    // el preloader se retira con CSS+setTimeout, NO con el ticker de GSAP,
    // para que nunca pueda quedarse una pantalla negra pegada
    function dropPre() {
      if (!pre) return;
      pre.style.transition = 'opacity .9s ease';
      pre.style.opacity = '0';
      setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 950);
    }

    if (reduce) {                       // sin coreografía: todo visible ya
      dropPre();
      tl.progress(1).pause();
      return;
    }

    if (bar) {
      gsap.to(bar, { scaleX: 1, duration: .32, ease: 'power2.in', onComplete: function () {
        dropPre();
        tl.play();
      }});
      // respaldo por si el ticker no avanza: arrancar igualmente
      setTimeout(function () { dropPre(); tl.play(); }, 700);
    } else {
      dropPre();
      tl.play();
    }
  }

  (function waitReady() {
    var e = (performance.now() - t0) / 1000;
    if ((isLoaded && fontsReady && e >= 1.35) || e > 7) { startIntro(); return; }
    requestAnimationFrame(waitReady);
  })();

  // respaldo: nunca dejar la portada bloqueada en el preloader
  setTimeout(startIntro, 3200);
  window.addEventListener('load', function () { setTimeout(startIntro, 1400); });

  /* ── PARALLAX DE RATÓN ─────────────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var qx = function (sel, d) { return gsap.quickTo(sel, 'x', { duration: .9, ease: 'power2.out' }) ; };
    var qy = function (sel, d) { return gsap.quickTo(sel, 'y', { duration: .9, ease: 'power2.out' }) ; };

    var px = {
      moon:   [qx('#moon'), qy('#moon')],
      window: [qx('#roseWindow'), qy('#roseWindow')],
      near:   [qx('.skyline--near'), qy('.skyline--near')],
      far:    [qx('.skyline--far'), qy('.skyline--far')],
      hero:   [qx('.hero__inner'), qy('.hero__inner')]
    };
    var strengths = { moon: 10, window: 18, near: 26, far: 14, hero: 8 };

    window.addEventListener('pointermove', function (ev) {
      var nx = (ev.clientX / window.innerWidth) * 2 - 1;
      var ny = (ev.clientY / window.innerHeight) * 2 - 1;
      Object.keys(strengths).forEach(function (k) {
        px[k][0](-nx * strengths[k]);
        px[k][1](-ny * strengths[k] * .6);
      });
    }, { passive: true });
  }

  /* ── SCROLL ────────────────────────────────────────────── */
  gsap.to('.hero__inner', {
    opacity: 0, scale: 1.07,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '80% top', scrub: true }
  });

  gsap.fromTo('#ghost', { yPercent: 20 }, {
    yPercent: -20, ease: 'none',
    scrollTrigger: { trigger: '#uno', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  var words = splitWords(document.getElementById('phrase'));
  gsap.from(words, {
    opacity: 0, y: 54, filter: 'blur(10px)',
    duration: 1.15, stagger: .1, ease: 'power3.out',
    scrollTrigger: { trigger: '#uno', start: 'top 58%', once: true }
  });
  gsap.from('#unoScript', {
    opacity: 0, y: 20, duration: 1, ease: 'power2.out',
    scrollTrigger: { trigger: '#uno', start: 'top 58%', once: true }
  });
  gsap.from('#unoRule', {
    opacity: 0, scaleX: .3, duration: 1.2, ease: 'power2.out',
    scrollTrigger: { trigger: '#uno', start: 'top 48%', once: true }
  });

  var finTl = gsap.timeline({
    scrollTrigger: { trigger: '#fin', start: 'top 55%', once: true }
  });
  finTl.to('#ornTop', { opacity: 1, scaleX: 1, duration: 1.3, ease: 'power3.out', transformOrigin: '50% 50%' })
       .to('#finLabel', { opacity: 1, y: 0, duration: .9, ease: 'power2.out' }, '-=.7')
       .to('#finTitle .title__c', {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.2, stagger: .08, ease: 'power3.out'
       }, '-=.6')
       .to('#ornBot', { opacity: 1, scaleX: 1, duration: 1.3, ease: 'power3.out', transformOrigin: '50% 50%' }, '-=.9')
       .to('#finScript', { opacity: 1, y: 0, duration: .9, ease: 'power2.out' }, '-=.7');

  /* ── MOVIMIENTO REDUCIDO: nada de coreografía ──────────── */
  if (reduce) {
    tl.progress(1).pause();
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
    gsap.set(
      '#ornTop, #ornBot, #finLabel, #finScript, #finTitle .title__c, ' +
      '#phrase .w, #unoScript, #unoRule, #ghost, .hero__inner',
      { clearProps: 'all' }
    );
    gsap.set('#ghost', { clearProps: 'all' });
  }

  // gancho de depuración: permite avanzar la intro a mano
  window.__miel = { tl: tl, finTl: finTl, start: startIntro };

  /* ── CURSOR ────────────────────────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    document.body.classList.add('has-cursor');

    var dotX = gsap.quickTo('#cursorDot', 'x', { duration: .1, ease: 'power2.out' });
    var dotY = gsap.quickTo('#cursorDot', 'y', { duration: .1, ease: 'power2.out' });
    var ringX = gsap.quickTo('#cursorRing', 'x', { duration: .42, ease: 'power3.out' });
    var ringY = gsap.quickTo('#cursorRing', 'y', { duration: .42, ease: 'power3.out' });

    window.addEventListener('pointermove', function (ev) {
      dotX(ev.clientX); dotY(ev.clientY);
      ringX(ev.clientX); ringY(ev.clientY);
    }, { passive: true });

    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        gsap.to('#cursorRing', { scale: 1.85, opacity: .85, duration: .35, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to('#cursorRing', { scale: 1, opacity: 1, duration: .35, ease: 'power2.out' });
      });
    });

    window.addEventListener('pointerdown', function (ev) {
      gsap.fromTo('#cursorRing', { scale: .55 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .5)' });
      if (window.GothFX) window.GothFX.burst(ev.clientX, ev.clientY);
    });
  } else {
    // táctil: estallido al tocar
    window.addEventListener('pointerdown', function (ev) {
      if (window.GothFX) window.GothFX.burst(ev.clientX, ev.clientY, 12);
    });
  }

  window.addEventListener('resize', function () { ScrollTrigger.refresh(); });
})();
