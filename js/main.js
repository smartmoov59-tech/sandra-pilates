/* ==========================================================================
   SANDRA PILATES — interactions & motion
   GSAP + ScrollTrigger + Lenis (tous servis en local, aucun service externe).
   Réservation : 100 % statique (SMS pré-rempli / appel / presse-papiers / .ics).
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- CONFIG (à modifier ici si le téléphone ou les créneaux changent) ---------- */
  const CONFIG = {
    phoneIntl: '+33662057514',
    phoneShow: '06 62 05 75 14',
    address: '68 Rue Fernand Signoret, 84240 La Tour-d’Aigues',
    studioName: 'Sandra Pilates',
    // Créneaux SOUHAITÉS proposés dans le formulaire (Sandra confirme ensuite par SMS).
    slots: ['9h00', '10h15', '12h15', '17h45', '18h45', '19h45', 'Peu importe'],
    closedWeekdays: [0],          // 0 = dimanche (jour non proposé)
    daysAhead: 21,
    sessionMinutes: 60
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;
  if (reduced) root.classList.add('reduced');

  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (!hasGSAP) { // filet de sécurité : tout afficher
    root.classList.add('reduced');
    document.body.classList.remove('is-loading');
    const l = $('.loader'); if (l) l.remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToEl = (target, opts = {}) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: opts.offset ?? -10, duration: opts.duration ?? 1.7, easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: opts.onComplete });
    else { el.scrollIntoView({ behavior: 'auto', block: 'start' }); if (opts.onComplete) opts.onComplete(); }
  };

  /* ---------- Utilitaires de découpe de texte ---------- */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.wi', el);
  }
  function splitChars(el, cls, inner) {
    const out = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach((ch) => {
            if (/\s/.test(ch) && !inner) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = cls;
            if (inner) { const i = document.createElement('span'); i.textContent = ch; s.appendChild(i); out.push(i); }
            else { s.textContent = ch; out.push(s); }
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return out;
  }

  /* ==========================================================================
     NAVIGATION, MENU, PROGRESSION, CURSEUR
     ========================================================================== */
  const nav = $('#nav');
  const burger = $('.burger');
  const menu = $('#menu');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.setAttribute('aria-hidden', String(!open));
    nav.classList.toggle('is-menu', open);
    const links = $$('a', menu).filter((a) => !a.closest('.menu__foot'));
    if (open) {
      if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
      menu.style.visibility = 'visible';
      gsap.timeline()
        .to(menu, { clipPath: 'circle(150% at calc(100% - 3rem) 2.6rem)', duration: 1.1, ease: 'expo.inOut' }, 0)
        .to(links, { y: 0, yPercent: 0, duration: 1, stagger: 0.07, ease: 'expo.out' }, 0.35)
        .to($('.menu__foot', menu), { opacity: 1, duration: 0.6 }, 0.8);
    } else {
      if (lenis) lenis.start(); else document.body.style.overflow = '';
      gsap.timeline({ onComplete: () => { menu.style.visibility = 'hidden'; } })
        .to($('.menu__foot', menu), { opacity: 0, duration: 0.2 }, 0)
        .to(links, { yPercent: 105, duration: 0.45, stagger: 0.03, ease: 'power3.in' }, 0)
        .to(menu, { clipPath: 'circle(0% at calc(100% - 3rem) 2.6rem)', duration: 0.8, ease: 'expo.inOut' }, 0.15);
    }
  }
  if (burger && menu) {
    gsap.set($$('a', menu).filter((a) => !a.closest('.menu__foot')), { yPercent: 105 });
    burger.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  }

  // ancres : défilement fluide
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      const go = () => {
        if (id === '#top') { lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo(0, 0); }
        else scrollToEl(target, { offset: id === '#reservation' ? -(nav.offsetHeight * 0.6) : -nav.offsetHeight * 0.2 });
      };
      if (menuOpen) { setMenu(false); setTimeout(go, 500); } else go();
    });
  });

  // barre de progression + état du menu (masqué en descendant, visible en remontant)
  const progress = $('.progress');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      progress.style.transform = `scaleX(${self.progress})`;
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > 60);
      if (menuOpen) return;
      if (self.direction === 1 && y > 320) gsap.to(nav, { yPercent: -110, duration: 0.5, ease: 'power3.out', overwrite: true });
      else if (self.direction === -1 || y <= 320) gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power3.out', overwrite: true });
    }
  });

  // curseur personnalisé (souris uniquement)
  if (finePointer && !reduced) {
    const cur = $('.cursor'), dot = $('.cursor-dot'), label = $('span', cur);
    const cx = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3.out' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3.out' });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (!shown) { shown = true; gsap.to([cur, dot], { opacity: 1, duration: 0.4 }); }
      cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { shown = false; gsap.to([cur, dot], { opacity: 0, duration: 0.3 }); });
    const hov = (sel, fn) => document.addEventListener('pointerover', (e) => { if (e.target.closest(sel)) fn(true, e); });
    const out = (sel, fn) => document.addEventListener('pointerout', (e) => { if (e.target.closest(sel) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(sel))) fn(false, e); });
    hov('a,button,.opt,.day,.slot,.qa button', () => cur.classList.add('is-link'));
    out('a,button,.opt,.day,.slot,.qa button', () => cur.classList.remove('is-link'));
    hov('.tile', () => { label.textContent = 'Voir'; cur.classList.add('is-drag'); });
    out('.tile', () => cur.classList.remove('is-drag'));
  }

  // boutons magnétiques
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.32);
        qy((e.clientY - (r.top + r.height / 2)) * 0.42);
      });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)', overwrite: true }); });
    });
  }

  /* ==========================================================================
     PRÉCHARGEUR + INTRO DU HERO
     ========================================================================== */
  const heroLines = $$('[data-hero-line]');
  const heroIns = $$('[data-hero-in]');
  const video = $('.hero__video');
  if (video) { video.muted = true; video.defaultMuted = true; video.setAttribute('playsinline', ''); }

  if (!reduced) {
    gsap.set(heroLines, { yPercent: 115 });
    gsap.set(heroIns, { opacity: 0, y: 30 });
    gsap.set('.badge-trial', { scale: 0, rotate: -40 });
    gsap.set('.hero__shapes i', { scale: 0.4, opacity: 0 });
    gsap.set('.hero__outline', { opacity: 0, x: 60 });
    gsap.set(video, { scale: 1.35 });
  }

  function heroIntro() {
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(video, { scale: 1.06, duration: 3, ease: 'power3.out' }, 0)
      .to(heroLines, { yPercent: 0, duration: 1.5, stagger: 0.14 }, 0.1)
      .to('.hero__outline', { opacity: 1, x: 0, duration: 2 }, 0.2)
      .to(heroIns, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.6)
      .to('.hero__shapes i', { scale: 1, opacity: (i, t) => (t.classList.contains('s2') ? 0.9 : 1), duration: 1.6, stagger: 0.12 }, 0.4)
      .to('.badge-trial', { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1,.6)' }, 1);
  }

  function finishLoading() {
    document.body.classList.remove('is-loading');
    $('.loader').style.display = 'none';
    if (lenis) lenis.start();
    sessionStorage.setItem('sp-seen', '1');
    ScrollTrigger.refresh();
  }

  function runLoader() {
    const loader = $('.loader');
    if (reduced) { loader.style.display = 'none'; document.body.classList.remove('is-loading'); return; }
    const seen = sessionStorage.getItem('sp-seen') === '1';
    const dur = seen ? 0.9 : 2.2;
    const path = $('.loader__mark path');
    const countEl = $('[data-loader-count]');
    const labelEl = $('[data-loader-label]');
    const spans = $$('.loader__name span');
    const counter = { v: 0 };
    gsap.set(spans, { yPercent: 110 });
    gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
    const tl = gsap.timeline({ onComplete: finishLoading });
    tl.to(path, { strokeDashoffset: 0, duration: dur * 0.85, ease: 'power2.inOut' }, 0)
      .to(spans, { yPercent: 0, duration: 1, stagger: 0.12, ease: 'expo.out' }, 0.15)
      .to('.loader__bar i', { scaleX: 1, duration: dur, ease: 'power1.inOut' }, 0)
      .to(counter, { v: 100, duration: dur, ease: 'power1.inOut', onUpdate: () => {
        countEl.textContent = String(Math.round(counter.v)).padStart(3, '0');
        labelEl.textContent = counter.v < 50 ? 'Inspirez' : 'Expirez';
      } }, 0)
      .to(path, { fill: '#D6A53A', fillOpacity: 0, duration: 0.01 }, '>')
      .to('.loader__inner', { opacity: 0, y: -24, duration: 0.55, ease: 'power3.in' }, '>0.15')
      .to('.loader__half--top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '>-0.1')
      .to('.loader__half--bot', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
      .call(heroIntro, null, '<0.35');
  }

  /* ==========================================================================
     HERO : parallax multicouche, souffle, mouvement souris
     ========================================================================== */
  function initHero() {
    if (reduced) { if (video) video.pause(); return; }
    const hero = $('.hero');
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('[data-hero-media]', { yPercent: 16, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero-outline]', { xPercent: -14, yPercent: -8, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__in', { yPercent: -14, opacity: 0.15, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__shapes .s1', { yPercent: -60, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__shapes .s2', { yPercent: -180, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__shapes .s3', { yPercent: 40, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero-badge]', { yPercent: 140, rotate: 120, ease: 'none', scrollTrigger: st });

    // le souffle : un orbe qui gonfle et se vide, avec son libellé
    const label = $('[data-breath-label]');
    const o1 = $('[data-orb-1]'), o2 = $('[data-orb-2]');
    const br = gsap.timeline({ repeat: -1 });
    br.call(() => { label.textContent = 'Inspirez'; })
      .to(o1, { scale: 1.45, duration: 4, ease: 'sine.inOut' }, 0)
      .to(o2, { scale: 1.5, duration: 4, ease: 'sine.inOut' }, 0)
      .call(() => { label.textContent = 'Expirez'; }, null, 4)
      .to(o1, { scale: 1, duration: 4.5, ease: 'sine.inOut' }, 4)
      .to(o2, { scale: 0.7, duration: 4.5, ease: 'sine.inOut' }, 4);

    // légère réaction à la souris
    if (finePointer) {
      const layers = $$('.hero__shapes i').map((el) => ({ el, d: parseFloat(el.dataset.depth || 0.5), x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }) }));
      const ox = gsap.quickTo('[data-hero-outline]', 'x', { duration: 1.6, ease: 'power3.out' });
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(nx * 60 * l.d); l.y(ny * 60 * l.d); });
        ox(nx * -40);
      });
    }
  }

  /* ==========================================================================
     TITRES, RÉVÉLATIONS, PARALLAXES D'IMAGES
     ========================================================================== */
  function initReveals() {
    // titres : mot par mot, avec masque qui monte
    $$('[data-split]').forEach((el) => {
      if (reduced) { el.style.visibility = 'visible'; return; }
      const words = splitWords(el);
      gsap.set(words, { yPercent: 115 });
      el.style.visibility = 'visible';
      gsap.to(words, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.055, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // éléments génériques
    if (reduced) { $$('[data-reveal]').forEach((e) => e.classList.add('is-in')); }
    else {
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 92%', once: true,
        onEnter: (els) => {
          els.forEach((e) => e.classList.add('is-in'));
          gsap.fromTo(els, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.09, overwrite: true });
        }
      });
    }

    if (reduced) return;

    // images qui bougent dans leur cadre
    $$('[data-parallax]').forEach((img) => {
      const amt = parseFloat(img.dataset.parallax) || 0.1;
      gsap.fromTo(img, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // cadre de Sandra : ouverture en cercle
    const frame = $('[data-about-frame]');
    if (frame) {
      gsap.set(frame, { clipPath: 'circle(0% at 50% 40%)' });
      gsap.to(frame, { clipPath: 'circle(100% at 50% 40%)', duration: 2, ease: 'expo.out', scrollTrigger: { trigger: frame, start: 'top 78%', once: true } });
      gsap.from('.about__ring', { scale: 0, rotate: -90, duration: 1.4, ease: 'elastic.out(1,.6)', scrollTrigger: { trigger: frame, start: 'top 70%', once: true } });
    }
    // puces « pour qui » : apparition en cascade
    gsap.fromTo('.chips li', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.chips', start: 'top 92%', once: true } });
  }

  /* ==========================================================================
     MARQUEE réactif au scroll (vitesse, sens, inclinaison)
     ========================================================================== */
  function initMarquee() {
    const rows = $$('[data-marquee]');
    if (!rows.length) return;
    if (reduced) { rows.forEach((r) => { r.style.width = 'auto'; r.style.flexWrap = 'wrap'; }); return; }
    const tweens = [];
    rows.forEach((row) => {
      const item = row.firstElementChild;
      const dir = parseFloat(row.dataset.marquee) || -1;
      const w = item.getBoundingClientRect().width || 1;
      let copies = 2;
      while ((copies / 2) * w < window.innerWidth * 1.3) copies += 2;
      for (let i = 1; i < copies; i++) { const c = item.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.appendChild(c); }
      const tw = dir < 0
        ? gsap.fromTo(row, { xPercent: 0 }, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
        : gsap.fromTo(row, { xPercent: -50 }, { xPercent: 0, duration: 46, ease: 'none', repeat: -1 });
      tweens.push(tw);
    });
    let boost = 0, dirNow = 1;
    const skew = rows.map((r) => gsap.quickSetter(r, 'skewX', 'deg'));
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        boost = Math.min(Math.abs(v) / 140, 9);
        dirNow = self.direction;
      }
    });
    gsap.ticker.add(() => {
      boost *= 0.93;
      const d = boost > 0.35 ? dirNow : 1;
      tweens.forEach((tw) => tw.timeScale(d * (1 + boost)));
      skew.forEach((s, i) => s(clamp(-dirNow * boost * (i ? -0.9 : 0.9), -9, 9)));
    });
  }

  /* ==========================================================================
     MÉTHODE : section pinnée, storytelling en 4 gestes
     ========================================================================== */
  function initStory() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 980px) and (prefers-reduced-motion: no-preference)', () => {
      const pin = $('[data-story]');
      const section = pin.closest('.story');
      section.classList.add('is-pinned');
      const steps = $$('[data-step]', pin);
      const imgs = $$('.story__img', pin);
      const nums = $('[data-story-nums]', pin);
      const dots = $$('.story__dots i', pin);
      const line = $('[data-story-line]', pin);
      gsap.set(steps, { autoAlpha: 0, y: 50 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });
      gsap.set(imgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set($$('img', imgs[0]), { scale: 1.12 });
      let current = -1;
      const setDot = (i) => { if (i === current) return; current = i; dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
      setDot(0);
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: pin, start: 'top top', end: '+=360%', pin: true, scrub: 0.7, anticipatePin: 1, onUpdate: (self) => setDot(Math.min(3, Math.floor(self.progress * 3.65 + 0.15))) }
      });
      tl.to(line, { scaleY: 1, ease: 'none', duration: 3.4 }, 0)
        .to('.story__bg-word', { xPercent: -10, ease: 'none', duration: 3.6 }, 0);
      for (let i = 1; i < 4; i++) {
        const t = i - 0.45;
        tl.to(steps[i - 1], { autoAlpha: 0, y: -50, duration: 0.4 }, t)
          .fromTo(steps[i], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.45 }, t + 0.3)
          .to(nums, { yPercent: -i * 25, duration: 0.6 }, t)
          .to(imgs[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7 }, t)
          .fromTo($('img', imgs[i]), { scale: 1.4 }, { scale: 1.1, duration: 0.9 }, t);
      }
      tl.to({}, { duration: 0.45 });
      return () => { section.classList.remove('is-pinned'); gsap.set([steps, imgs, nums, $$('img', pin)], { clearProps: 'all' }); };
    });
    mm.add('(max-width: 979px), (prefers-reduced-motion: reduce)', () => {
      if (reduced) return;
      $$('[data-step]').forEach((s) => gsap.from(s, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 88%', once: true } }));
    });
  }

  /* ==========================================================================
     SÉANCES : défilement horizontal piloté par le scroll vertical + tilt 3D
     ========================================================================== */
  function initServices() {
    const hs = $('[data-hs]');
    if (!hs) return;
    const track = $('[data-hs-track]', hs);
    const bar = $('[data-hs-bar]', hs);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      hs.classList.remove('is-native');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: hs, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; } }
      });
      $$('.card__media img', track).forEach((img) => {
        gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('.card'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => { gsap.set(track, { clearProps: 'all' }); };
    });
    mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => { hs.classList.add('is-native'); });

    // inclinaison 3D + reflet qui suit la souris
    if (finePointer && !reduced) {
      $$('[data-tilt]').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        });
        const cimg = $('.card__media img', card);
        card.addEventListener('pointerenter', () => { if (cimg) gsap.to(cimg, { scale: 1.07, duration: 1.1, ease: 'expo.out', overwrite: 'auto' }); });
        card.addEventListener('pointerleave', () => {
          card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg');
          if (cimg) gsap.to(cimg, { scale: 1, duration: 1.1, ease: 'expo.out', overwrite: 'auto' });
        });
      });
    }
  }

  /* ==========================================================================
     CHIFFRES : compteurs + anneaux
     ========================================================================== */
  function initNumbers() {
    const wrap = $('.nums');
    if (!wrap) return;
    const CIRC = 97.4; // circonférence du cercle r = 15.5
    if (reduced) { $$('.num__ring .fg').forEach((c) => { c.style.strokeDashoffset = CIRC * (1 - parseFloat(c.dataset.ring)); }); return; }
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count), o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: target, duration: 2.4, ease: 'power3.out', scrollTrigger: { trigger: wrap, start: 'top 80%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });
    $$('.num__ring .fg').forEach((c) => {
      gsap.to(c, { strokeDashoffset: CIRC * (1 - parseFloat(c.dataset.ring)), duration: 2.4, ease: 'power3.out', scrollTrigger: { trigger: wrap, start: 'top 80%', once: true } });
    });
    gsap.from('.num__v', { yPercent: 30, duration: 1.4, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
  }

  /* ==========================================================================
     TARIFS : onglets accessibles
     ========================================================================== */
  function initTabs() {
    const tabs = $('[data-tabs]');
    if (!tabs) return;
    const btns = $$('[role=tab]', tabs);
    const thumb = $('.tabs__thumb', tabs);
    const place = (btn, animate = true) => {
      const x = btn.offsetLeft, w = btn.offsetWidth;
      thumb.style.width = w + 'px';
      thumb.style.transition = animate ? '' : 'none';
      thumb.style.transform = `translateX(${x}px)`;
    };
    const select = (btn, focus) => {
      btns.forEach((b) => {
        const on = b === btn;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        const p = document.getElementById(b.getAttribute('aria-controls'));
        if (on) {
          p.hidden = false; p.classList.add('is-on');
          if (!reduced) gsap.fromTo($$('.ticket', p), { y: 50, opacity: 0, rotate: 1.5 }, { y: 0, opacity: 1, rotate: 0, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' });
        } else { p.hidden = true; p.classList.remove('is-on'); }
      });
      place(btn);
      if (focus) btn.focus();
      ScrollTrigger.refresh();
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = btns[(i + 1) % btns.length];
        if (e.key === 'ArrowLeft') n = btns[(i - 1 + btns.length) % btns.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    place(btns[0], false);
    window.addEventListener('resize', () => place(btns.find((b) => b.getAttribute('aria-selected') === 'true'), false));
    document.fonts && document.fonts.ready.then(() => place(btns.find((b) => b.getAttribute('aria-selected') === 'true'), false));
    if (!reduced) {
      gsap.fromTo('#plans-1 .ticket', { y: 70, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,opacity', scrollTrigger: { trigger: '#plans-1', start: 'top 85%', once: true } });
    }
  }

  /* ==========================================================================
     GALERIE : tilt au survol, révélation par masque, lightbox
     ========================================================================== */
  function initGallery() {
    const tiles = $$('[data-tile]');
    if (!tiles.length) return;
    const lb = $('[data-lightbox]');
    const lbImg = $('img', lb), lbCap = $('p', lb), lbClose = $('button', lb);
    let lastFocus = null;
    const open = (tile) => {
      lastFocus = tile;
      const img = $('img', tile);
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
      lbCap.textContent = $('figcaption span', tile).textContent + ' · ' + $('figcaption span:last-child', tile).textContent;
      lb.style.visibility = 'visible';
      gsap.to(lb, { opacity: 1, duration: 0.4 });
      gsap.fromTo(lbImg, { scale: 0.9, y: 30 }, { scale: 1, y: 0, duration: 0.8, ease: 'expo.out' });
      if (lenis) lenis.stop();
      lbClose.focus();
    };
    const close = () => {
      gsap.to(lb, { opacity: 0, duration: 0.3, onComplete: () => { lb.style.visibility = 'hidden'; } });
      if (lenis && !menuOpen) lenis.start();
      if (lastFocus) lastFocus.focus();
    };
    tiles.forEach((t) => {
      t.addEventListener('click', () => open(t));
      t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t); } });
    });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbClose) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.style.visibility === 'visible') close(); });

    if (reduced) return;
    ScrollTrigger.batch(tiles, {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.fromTo(els, { clipPath: 'inset(100% 0% 0% 0%)', y: 40 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.5, ease: 'expo.out', stagger: 0.1, clearProps: 'clipPath' })
    });
    gsap.set(tiles, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (finePointer) {
      tiles.forEach((t) => {
        const inner = $('.tile__in', t);
        t.addEventListener('pointermove', (e) => {
          const r = t.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(inner, { rotationY: x * 9, rotationX: -y * 9, scale: 1.05, transformPerspective: 900, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
        });
        t.addEventListener('pointerleave', () => gsap.to(inner, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.9, ease: 'expo.out', overwrite: 'auto' }));
      });
    }
  }

  /* ==========================================================================
     RÉSERVATION : assistant en 4 étapes → SMS pré-rempli / appel / .ics
     (aucun serveur, aucune donnée transmise : tout reste dans le navigateur)
     ========================================================================== */
  function initBooking() {
    const form = $('[data-wiz]');
    if (!form) return;
    const panes = $$('.pane', form);
    const segs = $$('.wiz__steps i', form);
    const countEl = $('[data-wiz-count]', form);
    const prev = $('[data-prev]', form), next = $('[data-next]', form), err = $('[data-err]', form);
    const daysBox = $('[data-days]', form), slotsBox = $('[data-slots]', form);
    const recap = $('[data-recap]', form), msgBox = $('[data-msg]', form), ok = $('[data-ok]', form);
    const smsBtn = $('[data-sms]', form);
    let step = 0;

    // jours proposés
    const fmtW = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    const fmtM = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
    const fmtLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= CONFIG.daysAhead; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const off = CONFIG.closedWeekdays.includes(d.getDay());
      const id = 'd-' + iso(d);
      const el = document.createElement('div');
      el.className = 'day' + (off ? ' day--off' : '');
      el.innerHTML = `<input type="radio" name="day" id="${id}" value="${iso(d)}" ${off ? 'disabled' : ''}><label for="${id}"><small>${fmtW.format(d).replace('.', '')}</small><b>${d.getDate()}</b><span>${fmtM.format(d).replace('.', '')}</span></label>`;
      daysBox.appendChild(el);
    }
    CONFIG.slots.forEach((s, i) => {
      const id = 'sl-' + i;
      const el = document.createElement('div');
      el.className = 'slot';
      el.innerHTML = `<input type="radio" name="slot" id="${id}" value="${s}"><label for="${id}">${s}</label>`;
      slotsBox.appendChild(el);
    });

    const val = (n) => { const c = form.querySelector(`[name=${n}]:checked`); return c ? c.value : ''; };
    const serviceInput = () => form.querySelector('[name=service]:checked');
    const dateOf = () => { const v = val('day'); if (!v) return null; const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };

    function buildMessage() {
      const s = serviceInput();
      const d = dateOf();
      const slot = val('slot');
      const nb = form.nb.value;
      const prenom = form.prenom.value.trim();
      const extra = form.msg.value.trim();
      const lines = [
        'Bonjour Sandra,',
        `je souhaiterais réserver : ${s ? s.dataset.label : ''}`,
        `le ${d ? fmtLong.format(d) : ''}${slot && slot !== 'Peu importe' ? ' vers ' + slot : ' (horaire à votre convenance)'}`,
        `pour ${nb} personne${nb > 1 ? 's' : ''}.`,
        `Prénom : ${prenom}.`
      ];
      if (extra) lines.push(extra);
      lines.push('Pouvez-vous me confirmer la disponibilité ? Merci !');
      return lines.join('\n').replace(/\n(?=le |pour |Prénom)/g, ' ');
    }

    function fillRecap() {
      const s = serviceInput(), d = dateOf(), slot = val('slot');
      const rows = [
        ['Séance', s ? `${s.dataset.label} (${s.dataset.price})` : ''],
        ['Jour', d ? fmtLong.format(d) : ''],
        ['Créneau', slot || ''],
        ['Prénom', form.prenom.value.trim()],
        ['Personnes', form.nb.value]
      ];
      recap.innerHTML = '';
      rows.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; recap.append(dt, dd); });
      const m = buildMessage();
      msgBox.textContent = m;
      smsBtn.href = `sms:${CONFIG.phoneIntl}?&body=${encodeURIComponent(m)}`;
    }

    function validate(i) {
      if (i === 0 && !serviceInput()) return 'Choisissez une séance pour continuer.';
      if (i === 1 && (!val('day') || !val('slot'))) return 'Choisissez un jour et un créneau souhaité.';
      if (i === 2 && form.prenom.value.trim().length < 2) return 'Indiquez votre prénom pour que Sandra sache qui vous êtes.';
      return '';
    }

    function go(n, animate = true) {
      const from = panes[step], to = panes[n], dirFwd = n >= step;
      step = n;
      segs.forEach((s, i) => s.classList.toggle('on', i <= n));
      countEl.textContent = `Étape ${n + 1} / ${panes.length}`;
      prev.hidden = n === 0;
      next.style.display = n === panes.length - 1 ? 'none' : '';
      next.firstChild.textContent = n === panes.length - 2 ? 'Voir le récapitulatif ' : 'Continuer ';
      err.textContent = '';
      if (n === panes.length - 1) fillRecap();
      const swap = () => {
        from.classList.remove('is-on'); to.classList.add('is-on');
        if (!reduced && animate) gsap.fromTo(to, { x: dirFwd ? 40 : -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out' });
        if (!reduced && animate) gsap.from($$('.opt,.day,.slot,.fld,.recap,.send .btn,.msg', to), { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.035, delay: 0.05 });
        ScrollTrigger.refresh();
      };
      if (from === to) return;
      if (!reduced && animate) gsap.to(from, { x: dirFwd ? -40 : 40, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => { gsap.set(from, { clearProps: 'all' }); swap(); } });
      else swap();
    }

    next.addEventListener('click', () => {
      const e = validate(step);
      if (e) { err.textContent = e; if (!reduced) gsap.fromTo(err, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,.3)' }); return; }
      go(Math.min(step + 1, panes.length - 1));
    });
    prev.addEventListener('click', () => go(Math.max(step - 1, 0)));
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('change', () => { err.textContent = ''; });
    // Entrée dans le champ prénom = étape suivante
    form.prenom.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); next.click(); } });

    // SMS : rappel si la messagerie ne s'ouvre pas (ordinateur)
    smsBtn.addEventListener('click', () => { ok.textContent = `Si votre messagerie ne s’est pas ouverte, copiez le message et envoyez-le au ${CONFIG.phoneShow}.`; });

    // copier le message
    $('[data-copy]', form).addEventListener('click', async () => {
      const m = buildMessage();
      try { await navigator.clipboard.writeText(m); }
      catch (e) { const ta = document.createElement('textarea'); ta.value = m; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (_) {} ta.remove(); }
      ok.textContent = `Message copié ✓ — envoyez-le au ${CONFIG.phoneShow}.`;
    });

    // agenda (.ics) : événement provisoire, à confirmer avec Sandra
    $('[data-ics]', form).addEventListener('click', () => {
      const s = serviceInput(), d = dateOf(); if (!s || !d) return;
      const slot = val('slot');
      let h = 10, mi = 0;
      const m = /^(\d{1,2})h(\d{2})$/.exec(slot);
      if (m) { h = +m[1]; mi = +m[2]; }
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi);
      const end = new Date(start.getTime() + CONFIG.sessionMinutes * 60000);
      const f = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}T${String(x.getHours()).padStart(2, '0')}${String(x.getMinutes()).padStart(2, '0')}00`;
      const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const esc = (t) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sandra Pilates//Reservation//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT', `UID:${Date.now()}@sandra-pilates`, `DTSTAMP:${stamp}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
        `SUMMARY:${esc(`Pilates avec Sandra — ${s.dataset.label} (à confirmer)`)}`,
        `LOCATION:${esc(CONFIG.address)}`,
        `DESCRIPTION:${esc(`Demande de réservation à confirmer avec Sandra : ${CONFIG.phoneShow}.${slot === 'Peu importe' ? ' Horaire à définir.' : ''}`)}`,
        'STATUS:TENTATIVE',
        'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Séance de Pilates', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'seance-pilates-sandra.ics';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      ok.textContent = 'Fichier agenda téléchargé ✓ — ouvrez-le pour l’ajouter à votre calendrier.';
    });

    // pré-sélection depuis les boutons « Réserver cette séance »
    $$('[data-service]').forEach((a) => {
      a.addEventListener('click', () => {
        const input = form.querySelector(`[name=service][value="${a.dataset.service}"]`);
        if (!input) return;
        input.checked = true;
        if (step !== 1) setTimeout(() => go(1), 900);
      });
    });
    go(0, false);
  }

  /* ==========================================================================
     FAQ : accordéon animé
     ========================================================================== */
  function initFaq() {
    const items = $$('[data-faq] .qa');
    items.forEach((qa, i) => {
      const btn = $('button', qa), ans = $('.qa__a', qa);
      const id = 'faq-a-' + i;
      ans.id = id; btn.setAttribute('aria-controls', id);
      ans.setAttribute('aria-labelledby', 'faq-q-' + i); btn.id = 'faq-q-' + i;
      btn.addEventListener('click', () => {
        const open = qa.classList.contains('is-open');
        items.forEach((o) => {
          if (o !== qa && o.classList.contains('is-open')) {
            o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false');
            gsap.to($('.qa__a', o), { height: 0, duration: reduced ? 0 : 0.6, ease: 'expo.inOut' });
          }
        });
        qa.classList.toggle('is-open', !open);
        btn.setAttribute('aria-expanded', String(!open));
        gsap.to(ans, { height: open ? 0 : 'auto', duration: reduced ? 0 : 0.7, ease: 'expo.inOut', onComplete: () => ScrollTrigger.refresh() });
      });
    });
    if (!reduced) gsap.from('.qa', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '[data-faq]', start: 'top 85%', once: true } });
  }

  /* ==========================================================================
     APPEL + FOOTER : lettres animées
     ========================================================================== */
  function initTypeFx() {
    const tel = $('[data-call-tel]');
    if (tel) {
      const chars = splitChars(tel, 'ch', true); // le wrapper .ch porte le survol CSS, l'enfant porte l'animation GSAP
      tel.setAttribute('aria-label', 'Appeler Sandra au ' + CONFIG.phoneShow);
      if (!reduced) {
        gsap.set(chars, { yPercent: 90, opacity: 0, rotate: 6 });
        gsap.to(chars, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.3, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: tel, start: 'top 88%', once: true } });
      }
    }
    const giant = $('[data-giant]');
    if (giant) {
      const letters = splitChars(giant, 'gl', true);
      if (!reduced) {
        gsap.set(letters, { yPercent: 110 });
        gsap.to(letters, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: giant, start: 'top 95%', once: true } });
      }
    }
    // couleur d'accent de la section d'appel : lueur qui suit le scroll
    if (!reduced) gsap.fromTo('.call', { backgroundPosition: '50% 0%' }, { backgroundPosition: '50% 100%', ease: 'none', scrollTrigger: { trigger: '.call', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Divers ---------- */
  function initMisc() {
    const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    const top = $('[data-top]'); if (top) top.addEventListener('click', () => { lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo(0, 0); });
    // lecture vidéo : certains navigateurs bloquent l'autoplay → on retente à la première interaction
    if (video && !reduced) {
      const tryPlay = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
      tryPlay();
      ['pointerdown', 'touchstart', 'scroll'].forEach((ev) => window.addEventListener(ev, tryPlay, { once: true, passive: true }));
      // pause quand le hero n'est plus visible (économie de batterie)
      ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: (self) => { if (self.isActive) tryPlay(); else video.pause(); } });
    }
  }

  /* ---------- Démarrage ---------- */
  initReveals();
  initHero();
  initMarquee();
  initStory();
  initServices();
  initNumbers();
  initTabs();
  initGallery();
  initBooking();
  initFaq();
  initTypeFx();
  initMisc();
  runLoader();

  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
