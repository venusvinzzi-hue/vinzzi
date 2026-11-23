/* =====================================================================
   VINZZI — funcionamento do site
   (o conteúdo fica em js/config.js; aqui não é preciso mexer)
   ===================================================================== */
(() => {
  'use strict';
  const C = window.VINZZI || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const money = v => (typeof v === 'number' ? BRL.format(v) : String(v ?? '')).replace(/ /g, ' ');
  const waNumber = String(C.contato?.whatsapp || '').replace(/\D/g, '');
  const wa = msg => `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  const fmt = s => (!isFinite(s) || s < 0) ? '--:--' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9&]/g, '');
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const ICON = id => `<svg class="i-${id}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  /* ---------- capa (imagem real ou capa provisória) ---------- */
  function cover(item, seed, big = '') {
    if (item.capa) {
      return `<img class="cover__img" src="${esc(item.capa)}" alt="Capa de ${esc(item.nome || item.musica || item.titulo)}" loading="lazy" decoding="async" width="800" height="800">`;
    }
    const r = rng(hash(seed));
    const v = 1 + Math.floor(r() * 4);
    const p = () => Math.round(10 + r() * 80);
    return `<div class="cover__ph cover__ph--v${v}" style="--x1:${p()}%;--y1:${p()}%;--x2:${p()}%;--y2:${p()}%;--rot:${Math.round(r() * 360)}deg" role="img" aria-label="Capa provisória, a ser substituída pela arte oficial">
      ${big ? `<span class="cover__big">${esc(big)}</span>` : ''}<span class="cover__tag">CAPA PROVISÓRIA</span></div>`;
  }

  /* ---------- ondas sonoras ---------- */
  function wave(seed, n = 54) {
    const r = rng(hash(seed + 'w'));
    let bars = '';
    for (let i = 0; i < n; i++) {
      const env = Math.pow(Math.sin(Math.PI * (i + 0.5) / n), 0.35);
      const h = Math.round(16 + (0.3 + 0.7 * r()) * env * 84);
      bars += `<i style="height:${h}%"></i>`;
    }
    return `<div class="wave" data-seek tabindex="0" role="slider" aria-label="Posição da prévia (use as setas)" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="wave__bars">${bars}</div><div class="wave__bars wave__bars--fill" aria-hidden="true">${bars}</div></div>`;
  }

  /* =====================================================================
     PLAYER DE ÁUDIO — um único áudio para o site todo
     (garante que só uma faixa toca por vez)
     ===================================================================== */
  const tracks = new Map();     // id -> { id, title, sub, audio, buy, coverHTML }
  const durations = new Map();  // id -> segundos
  const audio = new Audio();
  audio.preload = 'none';
  let cur = null;
  let pendingSeek = null;

  function playerHTML(id, label) {
    const t = tracks.get(id);
    const has = !!t.audio;
    return `<div class="player">
      <button class="play" data-play="${id}" ${has ? '' : 'disabled'} aria-label="${has ? `Tocar ou pausar a prévia de ${esc(t.title)}` : 'Prévia em breve'}">${ICON('play')}${ICON('pause')}</button>
      <div class="player__main">
        <div class="player__meta"><span class="player__name">${esc(label ?? t.title)}</span>
          <span class="player__time">${has ? `<span data-cur>0:00</span> / <span data-dur>${fmt(durations.get(id))}</span>` : 'Prévia em breve'}</span></div>
        ${wave(id)}
        <div class="pbar" data-seek aria-hidden="true"></div>
      </div></div>`;
  }

  const els = id => (id ? $$(`[data-track="${id}"]`) : []);

  function sync() {
    $$('[data-track]').forEach(el => {
      const on = el.dataset.track === cur;
      el.classList.toggle('is-current', on);
      el.classList.toggle('is-playing', on && !audio.paused);
    });
    document.body.classList.toggle('audio-playing', !!cur && !audio.paused);
    const st = $('#signalStatus');
    if (st) st.textContent = cur && !audio.paused ? `tocando · ${tracks.get(cur).title}` : 'aguardando';
  }

  function paint(id, ratio, time) {
    els(id).forEach(el => {
      el.style.setProperty('--p', (ratio * 100).toFixed(2) + '%');
      $$('[data-cur]', el).forEach(n => { n.textContent = fmt(time); });
      $$('.wave', el).forEach(w => w.setAttribute('aria-valuenow', Math.round(ratio * 100)));
    });
  }

  function setDur(id, d) {
    if (!isFinite(d) || d <= 0) return;
    durations.set(id, d);
    els(id).forEach(el => $$('[data-dur]', el).forEach(n => { n.textContent = fmt(d); }));
  }

  function toggle(id) {
    const t = tracks.get(id);
    if (!t || !t.audio) return;
    if (cur !== id) {
      if (cur) { paint(cur, 0, 0); els(cur).forEach(el => el.classList.remove('player--error')); }
      cur = id;
      audio.src = t.audio;
      renderMini();
    }
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    sync();
  }

  function seek(id, ratio) {
    if (id !== cur) { pendingSeek = ratio; toggle(id); return; }
    if (audio.duration) audio.currentTime = ratio * audio.duration; else pendingSeek = ratio;
    if (audio.paused) audio.play().catch(() => {});
  }

  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('loadedmetadata', () => {
    setDur(cur, audio.duration);
    if (pendingSeek != null) { audio.currentTime = pendingSeek * audio.duration; pendingSeek = null; }
  });
  audio.addEventListener('timeupdate', () => {
    if (!cur) return;
    paint(cur, audio.duration ? audio.currentTime / audio.duration : 0, audio.currentTime);
  });
  audio.addEventListener('ended', () => { paint(cur, 0, 0); sync(); });
  audio.addEventListener('error', () => {
    if (!cur || !audio.getAttribute('src')) return;
    els(cur).forEach(el => el.classList.add('player--error'));
    sync();
  });

  // Cliques em play e nas barras de progresso (delegado: vale para tudo)
  document.addEventListener('click', e => {
    const pb = e.target.closest('[data-play]');
    if (pb) { e.preventDefault(); toggle(pb.dataset.play); return; }
    const sk = e.target.closest('[data-seek]');
    if (sk) {
      const host = sk.closest('[data-track]');
      if (!host || !tracks.get(host.dataset.track)?.audio) return;
      const r = sk.getBoundingClientRect();
      seek(host.dataset.track, clamp((e.clientX - r.left) / r.width, 0, 1));
    }
  });
  document.addEventListener('keydown', e => {
    const w = e.target.closest?.('.wave');
    if (!w) return;
    const id = w.closest('[data-track]')?.dataset.track;
    if (!id) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (id !== cur) { toggle(id); return; }
      audio.currentTime = clamp(audio.currentTime + (e.key === 'ArrowRight' ? 5 : -5), 0, audio.duration || 0);
    } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(id); }
  });

  // Descobre a duração das prévias quando o card aparece na tela (leve)
  const probed = new Set();
  const durIO = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.dataset.track;
      durIO.unobserve(en.target);
      if (probed.has(id) || !tracks.get(id)?.audio) return;
      probed.add(id);
      const a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => { setDur(id, a.duration); a.removeAttribute('src'); a.load(); }, { once: true });
      a.src = tracks.get(id).audio;
    });
  }, { rootMargin: '300px' }) : null;
  const watchDur = root => durIO && $$('[data-track]', root).forEach(el => durIO.observe(el));

  /* ---------- mini player fixo ---------- */
  function renderMini() {
    const box = $('#mini');
    const t = tracks.get(cur);
    if (!t) { box.hidden = true; document.body.classList.remove('has-mini'); return; }
    box.dataset.track = cur;
    box.innerHTML = `
      <button class="play" data-play="${cur}" aria-label="Tocar ou pausar ${esc(t.title)}">${ICON('play')}${ICON('pause')}</button>
      <div class="mini__thumb cover">${t.coverHTML}</div>
      <div class="mini__info"><strong>${esc(t.title)}</strong><span>${esc(t.sub)} · <span data-cur>0:00</span> / <span data-dur>${fmt(durations.get(cur))}</span></span>
        <div class="pbar" data-seek></div></div>
      ${t.buy ? `<button class="btn btn--primary btn--sm mini__buy" data-licenses="${cur}">Licenças</button>` : ''}
      <button class="mini__close" aria-label="Fechar player">${ICON('close')}</button>`;
    box.hidden = false;
    document.body.classList.add('has-mini');
    $('.mini__close', box).addEventListener('click', () => {
      audio.pause(); paint(cur, 0, 0); audio.currentTime = 0;
      cur = null; box.hidden = true; document.body.classList.remove('has-mini'); sync();
    });
  }

  /* =====================================================================
     CONTEÚDO
     ===================================================================== */
  const LIC = C.licencas || [];
  const licPrice = (b, l) => Number((b.precos && b.precos[l.id]) ?? l.preco);
  const beats = (C.beats || []).map((b, i) => {
    const prices = LIC.map(l => licPrice(b, l)).filter(n => isFinite(n));
    const min = prices.length ? Math.min(...prices) : Number(b.preco);
    return { ...b, id: 'beat-' + (b.codigo || i), _i: i, preco: isFinite(min) ? min : b.preco };
  });

  beats.forEach(b => tracks.set(b.id, {
    id: b.id, title: b.nome, sub: `Beat ${b.codigo}${b.estilo ? ' · ' + b.estilo : ''}`, audio: b.audio || '',
    buy: 'licencas', coverHTML: cover(b, b.id, b.nome),
  }));
  (C.trabalhos || []).forEach((w, i) => tracks.set('work-' + i, {
    id: 'work-' + i, title: w.musica, sub: w.artista, audio: w.audio || '', buy: '', coverHTML: cover(w, 'work-' + i, 'Nº ' + String(i + 1).padStart(2, '0')),
  }));

  /* ---------- links de WhatsApp, Instagram, e-mail ---------- */
  $$('[data-wa]').forEach(a => { a.href = wa(C.mensagens?.[a.dataset.wa] || C.mensagens?.geral || ''); });
  const insta = $('#lnkInsta');
  if (insta) { insta.href = C.contato?.instagram || '#'; $('span', insta).textContent = C.contato?.instagramUsuario || 'Instagram'; }
  const mail = $('#lnkMail');
  if (mail) { mail.href = 'mailto:' + (C.contato?.email || ''); $('span', mail).textContent = C.contato?.email || 'E-mail'; }
  $('#year').textContent = new Date().getFullYear();

  /* ---------- hero ---------- */
  const heroBeat = beats[0];
  const hp = $('#heroPlayer');
  if (heroBeat) {
    hp.dataset.track = heroBeat.id;
    hp.innerHTML = `
      <div class="hplayer__head">
        <div class="hplayer__thumb cover">${cover(heroBeat, heroBeat.id)}</div>
        <div class="hplayer__info"><small>Prévia do catálogo</small><strong>${esc(heroBeat.nome)}</strong><span>${esc(heroBeat.estilo)}${heroBeat.bpm ? ` · ${heroBeat.bpm} BPM` : ''}</span></div>
        <a class="hplayer__buy" href="#beats">Ver no catálogo →</a>
      </div>
      ${playerHTML(heroBeat.id, `Beat ${heroBeat.codigo}`)}`;
  } else { hp.remove(); }

  const scope = $('#scopeBars');
  if (scope) {
    const r = rng(7);
    scope.innerHTML = Array.from({ length: 34 }, (_, i) => `<i style="--h:${Math.round(25 + r() * 75)}%;--d:${(-r() * 2).toFixed(2)}s"></i>`).join('');
  }
  const ctaBars = $('#ctaBars');
  if (ctaBars) {
    const r = rng(11);
    ctaBars.innerHTML = Array.from({ length: 72 }, (_, i) => `<i style="--h:${Math.round(15 + Math.pow(Math.sin(i / 72 * Math.PI), .6) * 70 * (0.5 + r() * 0.5))}%;--d:${(-r() * 2.4).toFixed(2)}s"></i>`).join('');
  }

  /* ---------- sobre: fotos ---------- */
  const photoLabels = ['Foto: estúdio e equipamentos<br>(substituir)', 'Foto: bastidores / DAW<br>(substituir)'];
  $$('[data-photo]').forEach(el => {
    const i = +el.dataset.photo;
    const src = (C.sobreFotos || [])[i];
    el.innerHTML = src
      ? `<img src="${esc(src)}" alt="Bastidores da VINZZI" loading="lazy" decoding="async">`
      : `<div class="photo-ph"><span>${photoLabels[i] || 'Foto (substituir)'}</span></div>`;
  });

  /* ---------- trabalhos ---------- */
  const worksGrid = $('#worksGrid');
  const spotifyId = url => (String(url || '').match(/track[/:]([A-Za-z0-9]+)/) || [])[1];
  worksGrid.innerHTML = (C.trabalhos || []).map((w, i) => {
    const id = 'work-' + i;
    const sp = spotifyId(w.spotify);
    if (sp) {
      return `<article class="win work work--spotify" data-reveal>
        <div class="win__bar"><span class="win__dots"><i></i><i></i><i></i></span><span>faixa ${String(i + 1).padStart(2, '0')}</span><span class="win__status">spotify</span></div>
        <div class="work__embed"><div data-spotify="${sp}" data-title="${esc(w.musica || 'Música no Spotify')}"></div></div>
        <div class="work__foot">
          <span class="work__type">${esc(w.tipo || 'Produção de beat')}</span>
          <a class="work__open" href="https://open.spotify.com/track/${sp}" target="_blank" rel="noopener">Abrir no Spotify ↗</a>
        </div>
      </article>`;
    }
    const t = tracks.get(id);
    const size = ['grande', 'medio', 'pequeno'].includes(w.tamanho) ? w.tamanho : 'medio';
    return `<article class="win work work--${size}" data-track="${id}" data-reveal>
      <div class="win__bar"><span class="win__dots"><i></i><i></i><i></i></span><span>faixa ${String(i + 1).padStart(2, '0')}</span></div>
      <div class="work__media"><div class="cover">${t.coverHTML}
        ${t.audio ? `<button class="cover__play" data-play="${id}" aria-label="Tocar ou pausar ${esc(w.musica)}">${ICON('play')}${ICON('pause')}</button>` : ''}
        ${w.placeholder ? '<span class="placeholder-flag">ESPAÇO RESERVADO</span>' : ''}</div></div>
      <div class="work__body">
        <span class="work__type">${esc(w.tipo)}</span>
        <div><h3 class="work__title">${esc(w.musica)}</h3></div>
        <p class="work__artist">${esc(w.artista)}</p>
        ${playerHTML(id, w.musica)}
      </div>
    </article>`;
  }).join('');
  watchDur(worksGrid);

  /* ---------- players do Spotify (só uma música toca por vez) ---------- */
  const spotifyCtrls = [];
  const pauseSpotify = except => spotifyCtrls.forEach(c => { if (c !== except) { try { c.pause(); } catch (e) { /* ignora */ } } });
  audio.addEventListener('play', () => pauseSpotify());
  const spSlots = $$('[data-spotify]', worksGrid);
  const EMBED_H = 352;
  const plainIframe = el => {
    el.outerHTML = `<iframe title="${el.dataset.title}" src="https://open.spotify.com/embed/track/${el.dataset.spotify}?utm_source=generator&theme=0" width="100%" height="${EMBED_H}" frameborder="0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
  };
  if (spSlots.length) {
    let apiReady = false;
    window.onSpotifyIframeApiReady = API => {
      apiReady = true;
      spSlots.forEach(el => {
        if (!el.isConnected) return;
        const title = el.dataset.title;
        API.createController(el, { uri: 'spotify:track:' + el.dataset.spotify, width: '100%', height: EMBED_H, theme: 'dark' }, ctrl => {
          spotifyCtrls.push(ctrl);
          const fr = ctrl.iframeElement || worksGrid.querySelector(`iframe[src*="${el.dataset.spotify}"]`);
          if (fr) fr.title = title;
          ctrl.addListener('playback_update', e => {
            if (e && e.data && e.data.isPaused === false) {
              if (!audio.paused) audio.pause();
              pauseSpotify(ctrl);
            }
          });
        });
      });
    };
    const s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    s.async = true;
    s.onerror = () => spSlots.forEach(el => el.isConnected && plainIframe(el));
    document.head.appendChild(s);
    // se a API do Spotify demorar demais, mostra o player simples
    setTimeout(() => { if (!apiReady) spSlots.forEach(el => el.isConnected && plainIframe(el)); }, 8000);
  }

  /* ---------- catálogo de beats ---------- */
  const MAIN = ['Trap', 'Drill', 'Boom Bap', 'R&B'];
  const FILTERS = [['Todos', 'Todos'], ...MAIN.map(s => [s, s]), ['Outros', 'Outros estilos']];
  const isMain = b => MAIN.some(s => norm(s) === norm(b.estilo));
  const match = (b, f) => f === 'Todos' || (f === 'Outros' ? !isMain(b) : norm(b.estilo) === norm(f));
  let filter = 'Todos', sort = 'recentes';

  const filtersEl = $('#filters');
  // só mostra os estilos que têm beats (e esconde "Outros" se ele for igual a "Todos")
  filtersEl.innerHTML = FILTERS.map(([v, label]) => {
    const n = beats.filter(b => match(b, v)).length;
    if (v !== 'Todos' && (n === 0 || (v === 'Outros' && n === beats.length))) return '';
    return `<button class="chip-btn" data-filter="${v}" aria-pressed="${v === filter}">${label}<small>${n}</small></button>`;
  }).join('');
  filtersEl.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    $$('[data-filter]', filtersEl).forEach(x => x.setAttribute('aria-pressed', x === b));
    renderBeats();
  });
  $('#sort').addEventListener('change', e => { sort = e.target.value; renderBeats(); });
  $('#demoNote').hidden = !beats.some(b => b.demo);

  function beatCard(b, i) {
    const t = tracks.get(b.id);
    return `<article class="win beat" data-track="${b.id}" style="--i:${i}">
      <div class="beat__cover cover">${t.coverHTML}
        ${t.audio ? `<button class="cover__play" data-play="${b.id}" aria-label="Ouvir prévia de ${esc(b.nome)}">${ICON('play')}${ICON('pause')}</button>` : ''}
        <span class="beat__num">BEAT ${esc(b.codigo)}</span>
        ${b.demo ? '<span class="beat__demo">DEMO</span>' : ''}
      </div>
      <div class="beat__body">
        <div>
          <h3 class="beat__name">${esc(b.nome)}</h3>
          <p class="beat__meta">${b.estilo ? `<span class="tag">${esc(b.estilo)}</span>` : ''}${b.bpm ? `<span>${b.bpm} BPM</span>` : ''}${b.tom ? `<span>· ${esc(b.tom)}</span>` : ''}<span class="beat__lics">${LIC.map(l => esc(l.formato)).join(' · ')}</span></p>
        </div>
        ${playerHTML(b.id, 'Ouvir prévia')}
        <div class="beat__foot">
          <div class="price"><small>${LIC.length > 1 ? 'A partir de' : 'Preço'}</small><strong>${money(b.preco)}</strong></div>
          <button class="btn btn--primary" data-licenses="${b.id}">${ICON('doc').replace('class="i-doc"', 'class="ico"')} Verificar licenças</button>
        </div>
      </div>
    </article>`;
  }

  function renderBeats() {
    let list = beats.filter(b => match(b, filter));
    if (sort === 'menor') list.sort((a, b) => a.preco - b.preco);
    else if (sort === 'maior') list.sort((a, b) => b.preco - a.preco);
    else list.sort((a, b) => String(b.data).localeCompare(String(a.data)) || a._i - b._i);
    const grid = $('#beatsGrid');
    grid.innerHTML = list.length ? list.map(beatCard).join('') : '<p class="empty">Nenhum beat neste estilo por enquanto. Fale com a VINZZI pelo WhatsApp e peça uma produção personalizada.</p>';
    $('#beatsCount').textContent = `${list.length} ${list.length === 1 ? 'beat disponível' : 'beats disponíveis'}${filter !== 'Todos' ? ' em ' + (FILTERS.find(f => f[0] === filter)[1]) : ''}`;
    // devolve o estado do player para o card que está tocando
    if (cur) {
      const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      paint(cur, ratio, audio.currentTime);
    }
    sync();
    watchDur(grid);
  }
  renderBeats();

  /* ---------- serviços ---------- */
  const visuals = {
    sequenciador: () => {
      const on = ['x...x...x...x.x.', '....x.......x...', 'x.x.x.x.x.xxx.x.', 'x......x..x.....'];
      return `<div class="seq">${on.map((row, r) => row.split('').map(c => `<i class="${c === 'x' ? (r === 2 ? 'on2' : 'on') : ''}"></i>`).join('')).join('')}</div>`;
    },
    equalizador: () => `<svg class="eq" viewBox="0 0 300 130" preserveAspectRatio="none">
      <defs><linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#512477" stop-opacity=".7"/><stop offset="1" stop-color="#512477" stop-opacity="0"/></linearGradient></defs>
      ${[26, 52, 78, 104].map(y => `<line class="grid" x1="0" x2="300" y1="${y}" y2="${y}"/>`).join('')}
      ${[50, 100, 150, 200, 250].map(x => `<line class="grid" y1="0" y2="130" x1="${x}" x2="${x}"/>`).join('')}
      <path class="area" d="M0 90 C 30 90, 40 60, 70 62 S 120 80, 150 72 S 200 40, 230 48 S 280 70, 300 66 L300 130 L0 130 Z"/>
      <path class="curve" d="M0 90 C 30 90, 40 60, 70 62 S 120 80, 150 72 S 200 40, 230 48 S 280 70, 300 66"/>
      <circle class="node" cx="70" cy="62" r="4"/><circle class="node" cx="150" cy="72" r="4"/><circle class="node" cx="230" cy="48" r="4"/></svg>`,
    cadeia: () => `<div class="chain">
      <div class="chain__step">BEAT<small style="--d:0s"></small></div><span class="chain__arrow">→</span>
      <div class="chain__step">MIX<small style="--d:.6s"></small></div><span class="chain__arrow">→</span>
      <div class="chain__step">MASTER<small style="--d:1.2s"></small></div></div>`,
  };
  const winNames = { sequenciador: 'beat.vz', equalizador: 'mix-master.vz', cadeia: 'pacote.vz' };
  $('#servicesGrid').innerHTML = (C.servicos || []).map(s => `
    <article class="win svc ${s.destaque ? 'svc--featured' : ''}" data-reveal>
      <div class="win__bar"><span class="win__dots"><i></i><i></i><i></i></span><span>${winNames[s.visual] || 'servico.vz'}</span>${s.destaque ? '<span class="svc__badge">Projeto completo</span>' : ''}</div>
      <div class="svc__visual" aria-hidden="true">${(visuals[s.visual] || visuals.sequenciador)()}</div>
      <div class="svc__body">
        <span class="svc__num">JANELA ${esc(s.numero)}</span>
        <h3 class="svc__title">${esc(s.titulo)}</h3>
        <p class="svc__desc">${esc(s.descricao)}</p>
        <div class="svc__price"><strong>${esc(s.preco)}</strong><span>${esc(s.unidade || '')}</span></div>
        <a class="btn btn--wa btn--block" href="${wa(s.mensagem)}" target="_blank" rel="noopener">${esc(s.botao)} ${ICON('arrow').replace('class="i-arrow"', 'class="ico"')}</a>
      </div>
    </article>`).join('');

  /* ---------- depoimentos (carrossel) — só roda se a seção existir ---------- */
  const track = $('#testiTrack');
  if (track) {
  const deps = C.depoimentos || [];
  track.innerHTML = deps.map(t => `
    <article class="win tcard ${t.placeholder ? 'is-ph' : ''}">
      <div class="win__bar"><span class="win__dots"><i></i><i></i><i></i></span><span>${t.placeholder ? 'exemplo de layout' : 'depoimento'}</span></div>
      <div class="tcard__body">
        <p class="tcard__quote">${esc(t.texto)}</p>
        <div class="tcard__who">
          <span class="avatar">${t.foto ? `<img src="${esc(t.foto)}" alt="" loading="lazy">` : esc((t.nome || '?').replace(/[\[\]]/g, '').charAt(0).toUpperCase())}</span>
          <div><strong>${esc(t.nome)}</strong><span>${esc(t.servico)}</span></div>
        </div>
      </div>
    </article>`).join('');
  const cards = $$('.tcard', track);
  const dots = $('#testiDots');
  dots.innerHTML = cards.map((_, i) => `<button aria-label="Ir para o depoimento ${i + 1}"></button>`).join('');
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
  const goTo = i => track.scrollTo({ left: cards[clamp(i, 0, cards.length - 1)].offsetLeft - cards[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
  const idx = () => Math.round(track.scrollLeft / (step() || 1));
  function updDots() {
    const maxI = Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / (step() || 1)));
    const i = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? cards.length - 1 : idx();
    $$('button', dots).forEach((b, k) => b.setAttribute('aria-current', k === i));
    $('#testiPrev').disabled = track.scrollLeft <= 2;
    $('#testiNext').disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2 || maxI === 0;
  }
  $('#testiPrev').addEventListener('click', () => goTo(idx() - 1));
  $('#testiNext').addEventListener('click', () => goTo(idx() + 1));
  dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) goTo($$('button', dots).indexOf(b)); });
  track.addEventListener('scroll', () => requestAnimationFrame(updDots), { passive: true });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx() - 1); }
  });
  window.addEventListener('resize', updDots);
  updDots();
  }

  /* ---------- formulário de contato ---------- */
  const ctaInsta = $('#ctaInsta'), ctaMail = $('#ctaMail');
  if (ctaInsta) { ctaInsta.href = C.contato?.instagram || '#'; $('span', ctaInsta).textContent = C.contato?.instagramUsuario || 'Instagram'; }
  if (ctaMail) { ctaMail.href = 'mailto:' + (C.contato?.email || ''); $('span', ctaMail).textContent = C.contato?.email || 'E-mail'; }

  const form = $('#projectForm');
  if (form) {
    const msg = $('#fMsg'), count = $('#msgCount'), ok = $('#formOk');
    msg.addEventListener('input', () => { count.textContent = `${msg.value.length}/800`; });
    const showErr = (name, on) => {
      const el = $(`[data-err="${name}"]`, form);
      if (el) el.classList.toggle('is-on', on);
      const input = form.elements[name];
      if (input && input.classList) input.classList.toggle('is-invalid', on);
    };
    const collect = () => {
      const f = form.elements;
      const data = {
        servico: (form.querySelector('input[name="servico"]:checked') || {}).value || '',
        nome: f.nome.value.trim(), cidade: f.cidade.value.trim(),
        referencia: f.referencia.value.trim(), mensagem: f.mensagem.value.trim(),
      };
      const errs = { servico: !data.servico, nome: !data.nome, mensagem: data.mensagem.length < 3 };
      Object.entries(errs).forEach(([k, v]) => showErr(k, v));
      const first = Object.keys(errs).find(k => errs[k]);
      if (first) {
        const el = first === 'servico' ? form.querySelector('input[name="servico"]') : form.elements[first];
        el && el.focus();
        return null;
      }
      return data;
    };
    const compose = d => [
      'Olá, VINZZI! Vim pelo site e quero falar sobre um projeto.', '',
      `*Nome:* ${d.nome}`,
      d.cidade ? `*Cidade:* ${d.cidade}` : null,
      `*Interesse:* ${d.servico}`,
      d.referencia ? `*Referência:* ${d.referencia}` : null,
      '', `*Sobre o projeto:* ${d.mensagem}`,
    ].filter(l => l !== null).join('\n');
    const done = () => { ok.hidden = false; form.classList.add('is-sent'); };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = collect();
      if (!d) return;
      window.open(wa(compose(d)), '_blank', 'noopener');
      done();
    });
    $('#sendMail').addEventListener('click', () => {
      const d = collect();
      if (!d) return;
      const subject = `Projeto pelo site — ${d.servico}`;
      location.href = `mailto:${C.contato?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(compose(d).replace(/\*/g, ''))}`;
      done();
    });
    form.addEventListener('change', e => {
      if (e.target.name === 'servico') showErr('servico', false);
    });
    form.addEventListener('input', e => {
      if (['nome', 'mensagem'].includes(e.target.name) && e.target.value.trim()) showErr(e.target.name, false);
    });
  }

  /* ---------- FAQ ---------- */
  $('#faqList').innerHTML = (C.faq || []).map((f, i) => `
    <div class="acc">
      <button class="acc__q" id="faq-q${i}" aria-expanded="false" aria-controls="faq-a${i}">${esc(f.pergunta)}<span class="acc__icon">${ICON('plus')}</span></button>
      <div class="acc__a" id="faq-a${i}" role="region" aria-labelledby="faq-q${i}"><div><p>${esc(f.resposta)}</p></div></div>
    </div>`).join('');
  $('#faqList').addEventListener('click', e => {
    const q = e.target.closest('.acc__q');
    if (!q) return;
    const item = q.parentElement;
    const open = !item.classList.contains('is-open');
    $$('.acc', item.parentElement).forEach(a => { a.classList.remove('is-open'); $('.acc__q', a).setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('is-open', open);
    q.setAttribute('aria-expanded', open);
  });

  /* =====================================================================
     NAVEGAÇÃO, ROLAGEM E ANIMAÇÕES
     ===================================================================== */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger');
  const setNav = open => {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setNav(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) setNav(false); });

  // link ativo no menu
  const navLinks = $$('#nav a[href^="#"]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => navIO.observe(s));
  }

  /* ---------- janela flutuante de licenças ---------- */
  const dlg = $('#licDialog');
  let licOpener = null;
  const licMsg = (b, l) => (C.mensagens?.licenca || 'Olá! Quero comprar o beat {nome} com a licença {licenca}, no valor de {preco}.')
    .replace('{nome}', b.nome).replace('{licenca}', `${l.nome} (${l.formato})`).replace('{preco}', money(licPrice(b, l)));
  function openLicenses(id, opener) {
    const b = beats.find(x => x.id === id);
    if (!b || !dlg) return;
    licOpener = opener || null;
    $('#licBarName').textContent = `licenças · ${b.nome}`;
    $('#licBody').innerHTML = `
      <div class="lic__head" data-track="${b.id}">
        <div class="lic__thumb cover">${tracks.get(b.id).coverHTML}</div>
        <div class="lic__info">
          <small>Beat ${esc(b.codigo)}${b.estilo ? ' · ' + esc(b.estilo) : ''}</small>
          <h2 id="licTitle">${esc(b.nome)}</h2>
          <p>Escolha a licença ideal para o seu lançamento.</p>
        </div>
        ${tracks.get(b.id).audio ? `<button class="play" data-play="${b.id}" aria-label="Tocar ou pausar ${esc(b.nome)}">${ICON('play')}${ICON('pause')}</button>` : ''}
      </div>
      <div class="lic__grid">
        ${LIC.map(l => `
          <article class="lic__card ${l.destaque ? 'is-featured' : ''}">
            <div class="lic__top">
              <span class="lic__fmt">${esc(l.formato)}</span>
              ${l.destaque ? '<span class="lic__badge">Mais completa</span>' : ''}
            </div>
            <h3>${esc(l.nome)}</h3>
            <p class="lic__sub">${esc(l.subtitulo || '')}</p>
            <strong class="lic__price">${money(licPrice(b, l))}</strong>
            <ul>${(l.itens || []).map(it => {
              const no = it.startsWith('-');
              return `<li class="${no ? 'no' : ''}">${ICON(no ? 'x' : 'check')}<span>${esc(no ? it.slice(1) : it)}</span></li>`;
            }).join('')}</ul>
            <a class="btn btn--wa btn--block" href="${wa(licMsg(b, l))}" target="_blank" rel="noopener">${ICON('wa').replace('class="i-wa"', 'class="ico"')} Comprar agora</a>
          </article>`).join('')}
      </div>
      <p class="lic__note">A compra é finalizada pelo WhatsApp com a VINZZI.</p>`;
    sync();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('lic-open');
    $('#licClose').focus();
  }
  function closeLicenses() {
    if (!dlg || !dlg.open) return;
    dlg.classList.add('is-closing');
    setTimeout(() => {
      dlg.classList.remove('is-closing');
      if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    }, reduceMotion ? 0 : 200);
  }
  if (dlg) {
    dlg.addEventListener('close', () => { document.body.classList.remove('lic-open'); licOpener?.focus?.(); });
    dlg.addEventListener('cancel', e => { e.preventDefault(); closeLicenses(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) closeLicenses(); });
    $('#licClose').addEventListener('click', closeLicenses);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-licenses]');
    if (b) openLicenses(b.dataset.licenses, b);
  });

  /* ---------- partículas do fundo do hero ---------- */
  const particles = $('#particles');
  if (particles) {
    const r = rng(23);
    particles.innerHTML = Array.from({ length: 30 }, () =>
      `<i style="left:${(r() * 100).toFixed(1)}%;--s:${(2 + r() * 3).toFixed(1)}px;--t:${(12 + r() * 14).toFixed(1)}s;--d:${(-r() * 20).toFixed(1)}s;--o:${(0.25 + r() * 0.5).toFixed(2)}"></i>`).join('');
  }

  // animações de entrada
  $$('[data-reveal]').forEach(el => {
    const sibs = $$(':scope > [data-reveal]', el.parentElement);
    el.style.setProperty('--rd', Math.min(sibs.indexOf(el), 6) * 90 + 'ms');
  });
  const startReveals = () => {
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(el => io.observe(el));
    const tl = $('#timeline');
    const tlIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { tl.classList.add('is-in'); tlIO.disconnect(); } }, { threshold: 0.3 });
    tlIO.observe(tl);
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
    $('#timeline').classList.add('is-in');
  }
  };

  /* ---------- preloader ---------- */
  const pre = $('#preloader');
  if (pre) {
    const bar = $('#preBar'), pct = $('#prePct');
    const t0 = performance.now();
    let shown = 0, target = 12, done = false;
    const hero = $('.hwin--char img');
    const assets = [document.fonts ? document.fonts.ready : Promise.resolve()];
    if (hero && !hero.complete) assets.push(new Promise(res => { hero.addEventListener('load', res, { once: true }); hero.addEventListener('error', res, { once: true }); }));
    let loaded = 0;
    assets.forEach(p => p.then(() => { loaded++; target = Math.max(target, 15 + (loaded / assets.length) * 70); }));
    let hidden = false, last = performance.now();
    const hide = () => {
      if (hidden) return;
      hidden = true;
      bar.style.width = '100%';
      pct.textContent = '100%';
      pre.classList.add('is-done');
      document.documentElement.classList.add('is-loaded');
      setTimeout(() => pre.remove(), 700);
      startReveals();
    };
    const tick = now => {
      if (hidden) return;
      const dt = Math.min(100, now - last); last = now;
      if (!done) target = Math.min(target + dt * 0.01, 92);
      shown += (target - shown) * (1 - Math.exp(-dt / 90));
      bar.style.width = shown.toFixed(1) + '%';
      pct.textContent = Math.round(shown) + '%';
      if (done && shown > 99.4) { hide(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    let finishing = false;
    const finish = () => {
      if (finishing) return;
      finishing = true;
      const wait = Math.max(0, (reduceMotion ? 0 : 900) - (performance.now() - t0));
      setTimeout(() => { done = true; target = 100; setTimeout(hide, 600); }, wait);
    };
    Promise.all(assets).then(finish);
    setTimeout(finish, 5000); // nunca segura o site por mais de 5 s
  } else {
    startReveals();
  }

  // playhead da janela DAW acompanha a largura da trilha
  const setLane = () => {
    const lane = $('.daw__lane');
    if (lane) $('.daw').style.setProperty('--lane-w', (lane.offsetWidth - 2) + 'px');
  };
  setLane();
  window.addEventListener('resize', setLane);

  // leve paralaxe das janelas do hero (só desktop com mouse)
  const stage = $('#heroStage');
  if (stage && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const depth = { hwin__cover: 14, 'hwin--cover': 14, 'hwin--player': 22, 'hwin--wave': 9, 'hwin--tag': 28 };
    const wins = $$('.hwin', stage);
    let raf = 0;
    $('.hero').addEventListener('pointermove', e => {
      if (window.innerWidth <= 960) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        wins.forEach(w => {
          const k = Object.keys(depth).find(c => w.classList.contains(c));
          const dpt = depth[k] || 10;
          w.style.transform = `translate3d(${(-x * dpt).toFixed(1)}px, ${(-y * dpt).toFixed(1)}px, 0)`;
        });
      });
    });
  }

  if (!waNumber || /^0+$/.test(waNumber.slice(2))) {
    console.warn('[VINZZI] Configure o número oficial do WhatsApp em js/config.js (contato.whatsapp).');
  }
})();
