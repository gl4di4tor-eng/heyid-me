/* heyid.me: one small script, no libraries. Everything works without it except the interactive tools. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SUPPORTED = ['en', 'pl', 'de', 'es', 'fr', 'pt'];
  const RTL = ['ar', 'he', 'fa', 'ur'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- language: follow the browser, allow override ---------- */
  function pickLang() {
    const saved = store.get('heyid.lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    for (const l of navigator.languages || [navigator.language || 'en']) {
      const base = String(l).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(base)) return base;
    }
    return 'en';
  }
  let lang = pickLang();
  let en = {}, dict = {};
  const t = (k, vars) => {
    let s = dict[k] ?? en[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
    return s;
  };
  const getJSON = (u) => fetch(u).then((r) => r.json());

  function applyI18n() {
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    const rtl = RTL.includes(lang);
    document.body.dir = rtl ? 'rtl' : 'ltr';
    const sel = $('[data-lang-select]');
    if (sel) sel.value = lang;
  }

  /* ---------- conversation starters ---------- */
  function initStarters(root, data) {
    const q = $('[data-q]', root), dots = $('[data-typing]', root), bubble = q.parentElement;
    const pool = data[lang] || data.en;
    let mode = 'any', last = -1, timer;
    const list = () => (mode === 'any' ? [...pool.light, ...pool.deep, ...pool.fun] : pool[mode]);
    function next(animate = true) {
      const l = list();
      let i; do { i = Math.floor(Math.random() * l.length); } while (l.length > 1 && l[i] === last);
      last = l[i];
      clearTimeout(timer);
      if (animate && !reduce) {
        q.hidden = true; dots.hidden = false;
        timer = setTimeout(() => { dots.hidden = true; q.hidden = false; q.textContent = last; }, 420);
      } else { q.textContent = last; }
    }
    $$('[data-mode]', root).forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      $$('[data-mode]', root).forEach((x) => x.classList.toggle('is-on', x === b));
      next();
    }));
    $('[data-next]', root).addEventListener('click', () => next());
    const copy = $('[data-copy]', root);
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(last); } catch {
        const ta = document.createElement('textarea'); ta.value = last; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      const old = copy.textContent; copy.textContent = t('starter.copied');
      setTimeout(() => (copy.textContent = t('starter.copy')), 1400);
    });
    next(false);
  }

  /* ---------- say hello ---------- */
  function initHello(root, list) {
    const names = (code) => { try { return new Intl.DisplayNames([lang], { type: 'language' }).of(code) || code; } catch { return code; } };
    const native = (code) => { try { return new Intl.DisplayNames([code], { type: 'language' }).of(code) || ''; } catch { return ''; } };
    let cur = -1, bag = [];
    const show = (i) => {
      const h = list[i]; cur = i;
      $('[data-hello-name]', root).textContent = names(h.l);
      $('[data-hello-native]', root).textContent = native(h.l);
      const w = $('[data-hello-word]', root); w.textContent = h.w; w.lang = h.l; w.dir = RTL.includes(h.l) ? 'rtl' : 'ltr';
      $('[data-hello-say]', root).textContent = h.p;
    };
    const spin = () => {
      if (!bag.length) bag = list.map((_, i) => i).filter((i) => i !== cur).sort(() => Math.random() - 0.5);
      show(bag.pop());
    };
    $('[data-spin]', root).addEventListener('click', spin);
    const listen = $('[data-listen]', root);
    if ('speechSynthesis' in window) {
      listen.hidden = false;
      listen.addEventListener('click', () => {
        const u = new SpeechSynthesisUtterance(list[cur].w); u.lang = list[cur].l;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      });
    }
    spin();
    root._hello = { list, names };
  }

  /* ---------- the world right now ---------- */
  const CITIES = [
    ['Pacific/Auckland', 'en'], ['Asia/Tokyo', 'ja'], ['Asia/Seoul', 'ko'], ['Asia/Shanghai', 'zh'], ['Asia/Bangkok', 'th'],
    ['Asia/Jakarta', 'id'], ['Asia/Manila', 'tl'], ['Asia/Kolkata', 'hi'], ['Asia/Dubai', 'ar'], ['Europe/Istanbul', 'tr'],
    ['Europe/Warsaw', 'pl'], ['Europe/Berlin', 'de'], ['Europe/Paris', 'fr'], ['Europe/London', 'en'], ['Africa/Nairobi', 'sw'],
    ['Africa/Lagos', 'en'], ['America/Sao_Paulo', 'pt'], ['America/Mexico_City', 'es'], ['America/New_York', 'en'], ['America/Los_Angeles', 'en'],
  ];
  function localHour(tz, now) {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hour12: false }).format(now);
    return parseInt(p, 10) % 24;
  }
  function initWorld(root, hello) {
    const ul = $('[data-world-list]', root), detail = $('[data-world-detail]', root);
    const byLang = Object.fromEntries(hello.map((h) => [h.l, h]));
    const part = (h) => (h >= 5 && h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night');
    let selected = null;
    const fmt = (tz, now) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(now);
    const cityName = (tz) => tz.split('/')[1].replace(/_/g, ' ');
    function render() {
      const now = new Date();
      const rows = CITIES.map(([tz, l]) => ({ tz, l, h: localHour(tz, now) }))
        .sort((a, b) => Math.abs(a.h - 12) - Math.abs(b.h - 12) || a.tz.localeCompare(b.tz));
      ul.innerHTML = '';
      rows.forEach(({ tz, l, h }) => {
        const asleep = h < 7 || h >= 23;
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'city' + (asleep ? ' is-asleep' : ''); b.setAttribute('aria-pressed', selected === tz);
        b.innerHTML = `<b></b><span class="t"></span><small><span class="dot"></span><span></span></small>`;
        b.children[0].textContent = cityName(tz);
        b.children[1].textContent = fmt(tz, now);
        b.children[2].children[1].textContent = t(asleep ? 'world.asleep' : 'world.awake');
        b.addEventListener('click', () => { selected = tz; render(); explain(tz, l, h, now); });
        li.append(b); ul.append(li);
      });
      if (selected) { const r = rows.find((x) => x.tz === selected); explain(selected, r.l, r.h, now, true); }
    }
    function explain(tz, l, h, now, quiet) {
      const g = byLang[l] || byLang.en;
      detail.textContent = t('world.detail', { city: cityName(tz), part: t('world.' + part(h)), time: fmt(tz, now) }) + ' ';
      const s = document.createElement('strong'); s.textContent = g.w; s.lang = g.l; s.translate = false;
      detail.append(s);
    }
    render();
    setInterval(render, 30000);
  }

  /* ---------- translated-chat demo ---------- */
  const CHAT = [
    { f: 'ana',   es: '¡Hola! ¿Qué hora es allí?', ja: 'こんにちは！そちらは今何時ですか？', en: 'Hi! What time is it there?', pl: 'Cześć! Która tam jest godzina?' },
    { f: 'kenji', ja: '夜の11時です。お茶を飲んでいます。', es: 'Son las 11 de la noche. Estoy tomando té.', en: "It's 11 at night. I'm drinking tea.", pl: 'Jest 23:00. Piję herbatę.' },
    { f: 'ana',   es: 'Aquí son las 8 de la mañana. Yo tomo café.', ja: 'こちらは朝の8時です。私はコーヒーを飲んでいます。', en: "It's 8 in the morning here. I'm having coffee.", pl: 'U nas jest 8 rano. Piję kawę.' },
    { f: 'kenji', ja: '日本語を勉強していますか？', es: '¿Estás estudiando japonés?', en: 'Are you studying Japanese?', pl: 'Uczysz się japońskiego?' },
    { f: 'ana',   es: 'Un poco. ¿Me enseñas a decir «buenos días»?', ja: '少しだけ。「おはよう」の言い方を教えてくれる？', en: "A little. Can you teach me how to say 'good morning'?", pl: 'Trochę. Nauczysz mnie mówić „dzień dobry”?' },
    { f: 'kenji', ja: 'もちろん！「おはよう」です。', es: '¡Claro! Se dice «ohayō».', en: "Of course! It's “ohayō”.", pl: 'Jasne! Mówi się „ohayō”.' },
  ];
  function initDemo(root) {
    const chat = $('[data-chat]', root), who = $('[data-demo-who]', root);
    let me = 'ana';
    const myLang = () => (me === 'ana' ? 'es' : 'ja');
    const names = { ana: 'Ana', kenji: 'Kenji' };
    function render() {
      chat.innerHTML = '';
      who.textContent = t(me === 'ana' ? 'demo.whoAna' : 'demo.whoKenji');
      CHAT.forEach((m) => {
        const mine = m.f === me;
        const div = document.createElement('div'); div.className = 'msg' + (mine ? ' me' : '');
        const name = document.createElement('span'); name.className = 'who'; name.textContent = names[m.f];
        const btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-expanded', 'false');
        const main = document.createElement('span'); main.textContent = m[myLang()]; main.lang = myLang(); main.translate = false;
        const orig = document.createElement('span'); orig.className = 'orig'; orig.hidden = true; orig.translate = false;
        const origLang = m.f === 'ana' ? 'es' : 'ja';
        const gloss = m[lang] && lang !== myLang() && lang !== origLang ? m[lang] : m.en;
        orig.textContent = mine ? gloss : `${t('demo.original')}: ${m[origLang]}`;
        orig.lang = mine ? (m[lang] ? lang : 'en') : origLang;
        btn.append(main, orig);
        btn.addEventListener('click', () => { orig.hidden = !orig.hidden; btn.setAttribute('aria-expanded', String(!orig.hidden)); });
        div.append(name, btn); chat.append(div);
      });
    }
    $$('[data-as]', root).forEach((b) => b.addEventListener('click', () => {
      me = b.dataset.as; $$('[data-as]', root).forEach((x) => x.classList.toggle('is-on', x === b)); render();
    }));
    render();
    root._render = render;
  }

  /* ---------- blog filter, share, language select ---------- */
  function initBlog() {
    const grid = $('[data-blog-grid]'); if (!grid) return;
    const btns = $$('[data-topic-filter]');
    const apply = (topic) => {
      btns.forEach((b) => b.classList.toggle('is-on', b.dataset.topicFilter === topic));
      $$('.card', grid).forEach((c) => (c.hidden = topic !== 'all' && c.dataset.topic !== topic));
    };
    btns.forEach((b) => b.addEventListener('click', () => apply(b.dataset.topicFilter)));
    const q = new URLSearchParams(location.search).get('topic'); if (q) apply(q);
  }
  function initShare() {
    const b = $('[data-share]'); if (!b) return;
    b.addEventListener('click', async () => {
      const data = { title: b.dataset.title, url: location.href.split('#')[0] };
      if (navigator.share) { try { await navigator.share(data); return; } catch { return; } }
      try { await navigator.clipboard.writeText(data.url); const o = b.textContent; b.textContent = t('post.shared'); setTimeout(() => (b.textContent = t('post.share')), 1600); } catch {}
    });
  }

  /* ---------- ads: load only when configured, and only after the page is settled ---------- */
  function initAds() {
    const m = $('meta[name="heyid-ads"]'); if (!m || !$('.adsbygoogle')) return;
    const go = () => {
      if (window.__adsLoaded) return; window.__adsLoaded = true;
      const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(m.content);
      s.onload = () => $$('.adsbygoogle').forEach(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} });
      document.head.append(s);
    };
    ['scroll', 'pointerdown', 'keydown'].forEach((e) => addEventListener(e, go, { once: true, passive: true }));
    setTimeout(go, 4000);
  }

  /* ---------- boot ---------- */
  async function boot() {
    try { en = await getJSON('/i18n/en.json'); if (lang !== 'en') dict = await getJSON(`/i18n/${lang}.json`); } catch {}
    applyI18n();
    const sel = $('[data-lang-select]');
    if (sel) sel.addEventListener('change', () => { store.set('heyid.lang', sel.value); location.reload(); });

    const needs = (n) => $$(`[data-tool="${n}"]`);
    const [starters, hello] = await Promise.all([
      needs('starters').length ? getJSON('/data/starters.json').catch(() => null) : null,
      needs('hello').length || needs('world').length ? getJSON('/data/hello.json').catch(() => null) : null,
    ]);
    if (starters) needs('starters').forEach((r) => initStarters(r, starters));
    if (hello) { needs('hello').forEach((r) => initHello(r, hello)); needs('world').forEach((r) => initWorld(r, hello)); }
    needs('demo').forEach((r) => initDemo(r));
    initBlog(); initShare(); initAds();
  }
  boot();
})();
