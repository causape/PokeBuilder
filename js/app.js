(() => {
  'use strict';

  const D = window.POKEDATA;
  const $ = (sel, el = document) => el.querySelector(sel);

  const teamEl = $('#team');
  const partyEl = $('#party');
  const addCombo = $('#add-combo');
  const addInput = $('#add-input');
  const toastEl = $('#toast');
  const header = $('.top');
  const tabsEl = $('#tabs');

  if (!D) {
    teamEl.innerHTML = '<div class="notice">No se han encontrado los datos de los pokémon (<b>data/pokedata.js</b>). ' +
      'Abre una terminal en la carpeta de la app y ejecuta <b>python tools/build_data.py</b>.</div>';
    return;
  }

  /* ================================================================ Constantes */

  const STORE_KEY = 'equipos-pokemon.v2';
  const OLD_STORE_KEY = 'mi-equipo-pokemon.v1';
  const MAX_TEAM = 6;
  const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const DARK_TEXT = '#14171F';
  const TYPES = {
    normal:   { n: 'Normal',    c: '#9FA19F', f: DARK_TEXT },
    fire:     { n: 'Fuego',     c: '#EE8130', f: DARK_TEXT },
    water:    { n: 'Agua',      c: '#6390F0', f: DARK_TEXT },
    electric: { n: 'Eléctrico', c: '#F7D02C', f: DARK_TEXT },
    grass:    { n: 'Planta',    c: '#7AC74C', f: DARK_TEXT },
    ice:      { n: 'Hielo',     c: '#96D9D6', f: DARK_TEXT },
    fighting: { n: 'Lucha',     c: '#C22E28', f: '#FFFFFF' },
    poison:   { n: 'Veneno',    c: '#A33EA1', f: '#FFFFFF' },
    ground:   { n: 'Tierra',    c: '#E2BF65', f: DARK_TEXT },
    flying:   { n: 'Volador',   c: '#A98FF3', f: DARK_TEXT },
    psychic:  { n: 'Psíquico',  c: '#F95587', f: DARK_TEXT },
    bug:      { n: 'Bicho',     c: '#A6B91A', f: DARK_TEXT },
    rock:     { n: 'Roca',      c: '#B6A136', f: DARK_TEXT },
    ghost:    { n: 'Fantasma',  c: '#735797', f: '#FFFFFF' },
    dragon:   { n: 'Dragón',    c: '#6F35FC', f: '#FFFFFF' },
    dark:     { n: 'Siniestro', c: '#705746', f: '#FFFFFF' },
    steel:    { n: 'Acero',     c: '#B7B7CE', f: DARK_TEXT },
    fairy:    { n: 'Hada',      c: '#D685AD', f: DARK_TEXT },
    stellar:  { n: 'Astral',    c: '#40B5A5', f: DARK_TEXT },
  };
  const ALL_TYPES = Object.keys(TYPES).filter((t) => t !== 'stellar');

  // Tabla de tipos: atacante -> { defensor: multiplicador } (solo lo que no es ×1).
  const CHART = {
    normal: { rock: .5, ghost: 0, steel: .5 },
    fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
    water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
    electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
    grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
    ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
    fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
    poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
    flying: { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
    psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
    bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
    rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
    dragon: { dragon: 2, steel: .5, fairy: 0 },
    dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
    steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
    fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 },
  };

  // Habilidades que cambian el daño recibido de ciertos tipos (por su nombre en inglés).
  const ABILITY_DEF = {
    'Levitate': { ground: 0 }, 'Earth Eater': { ground: 0 }, 'Eelevate': { ground: 0 },
    'Flash Fire': { fire: 0 }, 'Well-Baked Body': { fire: 0 },
    'Water Absorb': { water: 0 }, 'Storm Drain': { water: 0 }, 'Dry Skin': { water: 0, fire: 1.25 },
    'Volt Absorb': { electric: 0 }, 'Lightning Rod': { electric: 0 }, 'Motor Drive': { electric: 0 },
    'Sap Sipper': { grass: 0 },
    'Thick Fat': { fire: .5, ice: .5 }, 'Heatproof': { fire: .5 }, 'Water Bubble': { fire: .5 },
    'Purifying Salt': { ghost: .5 }, 'Fluffy': { fire: 2 },
  };

  const CATS = {
    physical: ['Físico', 'var(--phys)'],
    special: ['Especial', 'var(--spec)'],
    status: ['Estado', 'var(--stat)'],
  };
  const STAT_NAMES = ['PS', 'Ataque', 'Defensa', 'At. Esp.', 'Def. Esp.', 'Velocidad'];
  const STAT_SHORT = ['PS', 'Atq', 'Def', 'AtEsp', 'DefEsp', 'Vel'];
  // [nombre, característica que sube, característica que baja]
  const NATURES = [
    ['Activa', 5, 2], ['Afable', 3, 2], ['Agitada', 2, 3], ['Alegre', 5, 3], ['Alocada', 3, 4],
    ['Amable', 4, 2], ['Audaz', 1, 5], ['Cauta', 4, 3], ['Dócil'], ['Firme', 1, 3], ['Floja', 2, 4],
    ['Fuerte'], ['Grosera', 4, 5], ['Huraña', 1, 2], ['Ingenua', 5, 4], ['Mansa', 3, 5],
    ['Miedosa', 5, 1], ['Modesta', 3, 1], ['Osada', 2, 1], ['Pícara', 1, 4], ['Plácida', 2, 5],
    ['Rara'], ['Serena', 4, 1], ['Seria'], ['Tímida'],
  ];
  const NATURE = new Map(NATURES.map((n) => [n[0], n]));
  const ST_LABEL = [...STAT_NAMES, 'Precisión', 'Evasión'];
  const STATUS = {
    brn: 'Quemado', par: 'Paralizado', psn: 'Envenenado', tox: 'Gravemente envenenado', slp: 'Dormido', frz: 'Congelado',
  };
  const HP_LEVELS = {
    full: 'Al máximo', high: 'Más de la mitad', half: 'La mitad o menos', third: '1/3 o menos', quarter: '1/4 o menos',
  };
  const HP_ORDER = Object.keys(HP_LEVELS);
  const hpAtMost = (hp, level) => HP_ORDER.indexOf(hp || 'full') >= HP_ORDER.indexOf(level);
  const WEATHERS = { sun: 'Sol intenso', rain: 'Lluvia', sand: 'Tormenta de arena', snow: 'Nieve' };
  const TERRAINS = { electric: 'Campo Eléctrico', grassy: 'Campo de Hierba', psychic: 'Campo Psíquico', misty: 'Campo de Niebla' };
  /** Multiplicador de un nivel de cambio (-6..+6). Precisión y evasión usan base 3. */
  const stageMult = (s, accEva) => {
    const b = accEva ? 3 : 2;
    return s >= 0 ? (b + s) / b : b / (b - s);
  };
  const fmtMult = (m) => String(Math.round(m * 100) / 100).replace('.', ',');
  const POPULAR_ITEMS = ['leftovers', 'life-orb', 'focus-sash', 'choice-scarf', 'choice-band', 'choice-specs',
    'assault-vest', 'heavy-duty-boots', 'sitrus-berry', 'lum-berry', 'rocky-helmet', 'weakness-policy',
    'booster-energy', 'covert-cloak', 'clear-amulet', 'black-sludge', 'eviolite', 'expert-belt', 'light-clay', 'loaded-dice'];
  const SUGGESTED = [25, 6, 94, 445, 700];

  const TABS = {
    mine: {
      label: 'Mi equipo', other: 'rival', vsTitle: 'Contra el equipo rival',
      vsEmpty: 'Añade pokémon en la pestaña «Rival» para ver cómo se enfrenta a ellos.',
      placeholder: 'Escribe un pokémon para añadirlo', summary: 'Resumen de tu equipo',
      emptyTitle: 'Empieza tu equipo',
      emptyText: 'Escribe el nombre de un pokémon en el buscador de arriba. Puedes buscarlo en español, en inglés o por su número de la Pokédex.',
    },
    rival: {
      label: 'Rival', other: 'mine', vsTitle: 'Contra tu equipo',
      vsEmpty: 'Añade pokémon en la pestaña «Mi equipo» para ver cómo se enfrenta a ellos.',
      placeholder: 'Escribe un pokémon del rival', summary: 'Resumen del equipo rival',
      emptyTitle: 'Añade el equipo rival',
      emptyText: 'Escribe los pokémon de tu rival para ver sus debilidades, sus objetos y a cuáles de los tuyos pega fuerte.',
    },
  };

  const ICON_X = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 2.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  const ICON_KO = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 5.5l2 2m0-2l-2 2M9 5.5l2 2m0-2l-2 2M5.5 11h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const ICON_HEART = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const ICON_SWAP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 5.5h10l-2.5-2.5M13.5 10.5h-10l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_UP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_DOWN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4M6.7 6.5v4.5M9.3 6.5v4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ================================================================ Utilidades */

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const norm = (s) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim();
  const dex = (n) => '#' + String(n).padStart(3, '0');
  const newUid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const typeOf = (t) => TYPES[t] || { n: t, c: '#8A93A7', f: '#FFFFFF' };

  function highlight(text, q) {
    const nq = norm(q);
    if (!nq) return esc(text);
    let folded = '';
    const map = [];
    for (let i = 0; i < text.length; i++) {
      for (const ch of fold(text[i]).replace(/[^a-z0-9]/g, ' ')) {
        if (ch === ' ' && (folded === '' || folded.endsWith(' '))) continue;
        folded += ch;
        map.push(i);
      }
    }
    const at = folded.indexOf(nq);
    if (at < 0) return esc(text);
    const s = map[at];
    const e = map[at + nq.length - 1] + 1;
    return esc(text.slice(0, s)) + '<mark>' + esc(text.slice(s, e)) + '</mark>' + esc(text.slice(e));
  }

  function statColor(v) {
    if (v < 50) return '#EF5350';
    if (v < 80) return '#F39A3B';
    if (v < 100) return '#E4C93A';
    if (v < 120) return '#98CF45';
    if (v < 150) return '#3DBE76';
    return '#22B3C7';
  }

  function imgTag(id, kind, cls, alt) {
    const p = `${SPR}pokemon/`;
    const art = [`${p}other/official-artwork/${id}.png`, `${p}other/home/${id}.png`, `${p}${id}.png`];
    const mini = [`${p}${id}.png`, `${p}other/home/${id}.png`, `${p}other/official-artwork/${id}.png`];
    const srcs = kind === 'art' ? art : mini;
    return `<img class="${cls}" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  }
  const itemImg = (it, cls) =>
    `<img class="${cls}" src="${SPR}items/${it.k}.png" data-fb="" alt="" loading="lazy" decoding="async">`;

  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fb === undefined) return;
    const [next, ...rest] = img.dataset.fb.split('|').filter(Boolean);
    if (next) {
      img.dataset.fb = rest.join('|');
      img.src = next;
    } else {
      delete img.dataset.fb;
      img.classList.add('img-missing');
    }
  }, true);

  const typeBadge = (t, extra = '') => {
    const ty = typeOf(t);
    return `<span class="type${extra}" style="--tc:${ty.c};--tf:${ty.f}">${esc(ty.n)}</span>`;
  };
  const catPill = (c) => {
    const [n, col] = CATS[c] || CATS.status;
    return `<span class="cat" style="--cc:${col}">${n}</span>`;
  };
  const multLabel = (m) => {
    if (m === 0.5) return '×½';
    if (m === 0.25) return '×¼';
    return '×' + String(Math.round(m * 1000) / 1000).replace('.', ',');
  };

  /* ================================================================ Datos */

  const P = new Map();
  const M = new Map();
  const A = new Map();
  const I = new Map();
  for (const p of D.pokemon) { p._k = norm(p.n + ' ' + p.k); P.set(p.id, p); }
  for (const m of D.moves) { m._k = norm(m.n + ' ' + m.en); M.set(m.id, m); }
  for (const a of D.abilities) { a._k = norm(a.n + ' ' + a.en); A.set(a.id, a); }
  for (const it of D.items) { it._k = norm(it.n + ' ' + it.en); I.set(it.id, it); }
  const itemByKey = new Map(D.items.map((it) => [it.k, it]));

  const collator = new Intl.Collator('es', { sensitivity: 'base' });
  const byName = (a, b) => collator.compare(a.n, b.n);
  const POKEMON = D.pokemon;
  const MOVES = [...D.moves].sort(byName);
  const ABILITIES = [...D.abilities].sort(byName);
  const ITEMS = [...D.items].sort(byName);

  function find(list, q, limit, bonus) {
    const nq = norm(q);
    if (!nq) return [];
    const hits = [];
    list.forEach((it, idx) => {
      const at = it._k.indexOf(nq);
      if (at < 0) return;
      let score = at === 0 ? 0 : it._k[at - 1] === ' ' ? 1 : 2;
      if (bonus) score += bonus(it);
      hits.push([score, idx, it]);
    });
    hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return hits.slice(0, limit).map((h) => h[2]);
  }

  function searchPokemon(q) {
    const num = q.trim().replace(/^#/, '');
    if (/^\d+$/.test(num)) return POKEMON.filter((p) => p.sp === Number(num)).slice(0, 30);
    return find(POKEMON, q, 30, (p) => (p.id > 10000 ? 0.5 : 0));
  }

  function pokemonOptionHTML(p, q) {
    return `${imgTag(p.id, 'mini', 'opt-sprite', '')}
      <span class="opt-main"><span class="opt-name"><span>${highlight(p.n, q)}</span></span><span class="opt-sub">${dex(p.sp)}</span></span>
      <span class="opt-types">${p.t.map((t) => typeBadge(t)).join('')}</span>`;
  }

  /* ================================================================ Tipos y enfrentamientos */

  const eff = (atk, defTypes) => defTypes.reduce((m, d) => m * (CHART[atk]?.[d] ?? 1), 1);

  /** Tipos con los que se defiende (teniendo en cuenta la teracristalización si se pide). */
  function defTypes(mem, useTera) {
    const p = P.get(mem.pid);
    return useTera && mem.tera && mem.tera !== 'stellar' ? [mem.tera] : p.t;
  }

  /** Multiplicador de daño que recibe `mem` de un ataque de tipo `atk`, con su habilidad y objeto. */
  function damageTaken(atk, mem, useTera) {
    let m = eff(atk, defTypes(mem, useTera));
    let why = null;
    const ab = mem.ab != null ? A.get(mem.ab) : null;
    const mod = ab && ABILITY_DEF[ab.en];
    if (mod && atk in mod) {
      m = mod[atk] === 0 ? 0 : m * mod[atk];
      why = ab.n;
    }
    if (ab && ab.en === 'Wonder Guard' && m < 2 && m > 0) {
      m = 0;
      why = ab.n;
    }
    const it = mem.it != null ? I.get(mem.it) : null;
    if (it && it.k === 'air-balloon' && atk === 'ground' && m > 0) {
      m = 0;
      why = it.n;
    }
    return { m, why };
  }

  /** Tipos con los que ataca: los de sus movimientos de daño o, si no tiene, sus propios tipos. */
  function attackTypes(mem) {
    const dmg = mem.mv.map((id) => (id != null ? M.get(id) : null)).filter((m) => m && m.c !== 'status');
    if (dmg.length) return { types: [...new Set(dmg.map((m) => m.t))], fromMoves: true };
    return { types: P.get(mem.pid).t, fromMoves: false };
  }

  const damagingMoves = (mem) =>
    mem.mv.map((id) => (id != null ? M.get(id) : null)).filter((m) => m && m.c !== 'status');

  /** El ataque de `attacker` que más daño hace a `defender` (solo con sus movimientos puestos). */
  function bestMoveAgainst(attacker, defender) {
    let best = null;
    for (const mv of damagingMoves(attacker)) {
      const m = damageTaken(mv.t, defender, false).m;
      if (!best || m > best.m || (m === best.m && (mv.p || 0) > (best.mv.p || 0))) best = { m, mv };
    }
    return best;
  }

  /* ================================================================ Estado */

  function cleanMember(m) {
    const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
    return {
      uid: newUid(),
      pid: Number(m.pid),
      ab: A.has(num(m.ab)) ? num(m.ab) : null,
      it: I.has(num(m.it)) ? num(m.it) : null,
      nat: NATURE.has(m.nat) ? m.nat : null,
      tera: TYPES[m.tera] ? m.tera : null,
      mv: [0, 1, 2, 3].map((i) => {
        const id = num(Array.isArray(m.mv) ? m.mv[i] : NaN);
        return M.has(id) ? id : null;
      }),
      ko: m.ko === true,
      st: STATUS[m.st] ? m.st : '',
      lv: Math.max(1, Math.min(100, Math.round(Number(m.lv)) || 50)),
      chp: Number.isFinite(Number(m.chp)) && m.chp !== null && m.chp !== '' ? Math.max(0, Math.round(Number(m.chp))) : null,
      ev: (() => {
        const ev = [0, 1, 2, 3, 4, 5].map((i) => Math.max(0, Math.min(252, Math.round(Number(Array.isArray(m.ev) ? m.ev[i] : 0)) || 0)));
        let extra = ev.reduce((a, b) => a + b, 0) - 510;
        for (let i = 5; i >= 0 && extra > 0; i--) { const cut = Math.min(ev[i], extra); ev[i] -= cut; extra -= cut; }
        return ev;
      })(),
      iv: [0, 1, 2, 3, 4, 5].map((i) => {
        const v = Array.isArray(m.iv) ? Number(m.iv[i]) : 31;
        return Number.isFinite(v) ? Math.max(0, Math.min(31, Math.round(v))) : 31;
      }),
      stg: Array.from({ length: 8 }, (_, i) => (i === 0 ? 0 : Math.max(-6, Math.min(6, Math.round(Number(Array.isArray(m.stg) ? m.stg[i] : 0)) || 0)))),
      // PP gastados de cada ataque (entre 0 y sus PP máximos)
      ppu: [0, 1, 2, 3].map((i) => {
        const id = num(Array.isArray(m.mv) ? m.mv[i] : NaN);
        const max = M.get(id)?.pp || 0;
        const used = Math.round(num(Array.isArray(m.ppu) ? m.ppu[i] : 0)) || 0;
        return Math.min(Math.max(used, 0), max);
      }),
    };
  }

  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    return list.filter((m) => m && P.has(Number(m.pid))).slice(0, MAX_TEAM).map(cleanMember);
  }

  const serialize = (list) => list.map(({ pid, ab, it, nat, tera, mv, ko, ppu, st, stg, lv, chp, ev, iv }) => ({ pid, ab, it, nat, tera, mv, ko, ppu, st, stg, lv, chp, ev, iv }));

  function load() {
    const empty = { active: 'mine', teams: { mine: [], rival: [] }, cond: { weather: '', terrain: '' } };
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && raw.teams) {
        return {
          active: raw.active === 'rival' ? 'rival' : 'mine',
          cond: {
            weather: WEATHERS[raw.cond?.weather] ? raw.cond.weather : '',
            terrain: TERRAINS[raw.cond?.terrain] ? raw.cond.terrain : '',
          },
          teams: { mine: sanitize(raw.teams.mine), rival: sanitize(raw.teams.rival) },
        };
      }
      const old = JSON.parse(localStorage.getItem(OLD_STORE_KEY) || 'null');
      if (old) empty.teams.mine = sanitize(old);
    } catch {
      /* datos dañados: se empieza de cero */
    }
    return empty;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        active: state.active,
        cond: state.cond,
        teams: { mine: serialize(state.teams.mine), rival: serialize(state.teams.rival) },
      }));
    } catch {
      /* El navegador no permite guardar. */
    }
  }

  const state = load();
  const team = () => state.teams[state.active];
  const otherTeam = () => state.teams[TABS[state.active].other];
  const cardEls = new Map();
  const teraView = new Set(); // fichas que muestran las debilidades teracristalizado

  /* ================================================================ Combobox */

  let comboSeq = 0;
  let quietFocus = false;

  function focusQuietly(el) {
    if (!el) return;
    quietFocus = true;
    el.focus({ preventScroll: true });
    quietFocus = false;
  }

  function makeCombo(root, opts) {
    const input = root.querySelector('input');
    const list = root.querySelector('.combo-list');
    const id = 'cb' + (++comboSeq);
    list.id = id;
    list.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', id);
    input.autocomplete = 'off';
    input.spellcheck = false;

    let items = [];
    let active = -1;

    function setActive(i, scroll = true) {
      active = i;
      list.querySelectorAll('.opt').forEach((li, j) => {
        li.setAttribute('aria-selected', j === i ? 'true' : 'false');
        if (j === i && scroll) li.scrollIntoView({ block: 'nearest' });
      });
      if (i >= 0) input.setAttribute('aria-activedescendant', `${id}-${i}`);
      else input.removeAttribute('aria-activedescendant');
    }

    function open(q) {
      const r = opts.search(q) || {};
      items = r.items || [];
      let html = '';
      if (r.head) html += `<li class="combo-head" role="presentation">${esc(r.head)}</li>`;
      html += items.map((it, i) =>
        `<li class="opt" role="option" id="${id}-${i}" data-i="${i}" aria-selected="false">${opts.render(it, q)}</li>`).join('');
      if (r.note) html += `<li class="combo-note" role="presentation">${esc(r.note)}</li>`;
      if (!html) { close(); return; }

      list.innerHTML = html;
      list.scrollTop = 0;
      root.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      root.closest('.member')?.classList.add('has-open');

      const rect = input.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      root.classList.toggle('up', below < 280 && rect.top > below);

      setActive(items.length && norm(q) ? 0 : -1);
    }

    function close() {
      root.classList.remove('open', 'up');
      root.closest('.member')?.classList.remove('has-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      list.innerHTML = '';
      items = [];
      active = -1;
    }

    function pick(i) {
      const it = items[i];
      close();
      if (it) opts.onPick(it);
    }

    input.addEventListener('input', () => open(input.value));
    input.addEventListener('focus', () => {
      if (quietFocus) return;
      if (opts.selectOnFocus) input.select();
      open(opts.focusQuery ? opts.focusQuery() : input.value);
    });
    input.addEventListener('blur', () => {
      close();
      opts.onCancel?.();
    });
    input.addEventListener('keydown', (e) => {
      const isOpen = root.classList.contains('open');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) open(opts.focusQuery && input.value === opts.currentText?.() ? opts.focusQuery() : input.value);
        else if (items.length) setActive((active + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length) setActive(active <= 0 ? items.length - 1 : active - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0) pick(active);
        else if (items.length === 1) pick(0);
        else opts.onEnterNothing?.(input.value);
      } else if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          close();
        }
        opts.onCancel?.();
      }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.opt');
      if (li) pick(Number(li.dataset.i));
    });
    list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('.opt');
      if (li && Number(li.dataset.i) !== active) setActive(Number(li.dataset.i), false);
    });
  }

  /* ================================================================ Ficha: piezas */

  // Objetos que multiplican una característica: { índice de característica: multiplicador }.
  // `sp` limita el efecto a ciertas especies (número de la Pokédex).
  const ITEM_STATS = {
    'choice-band': { s: { 1: 1.5 } },
    'choice-specs': { s: { 3: 1.5 } },
    'choice-scarf': { s: { 5: 1.5 } },
    'assault-vest': { s: { 4: 1.5 } },
    'eviolite': { s: { 2: 1.5, 4: 1.5 }, needsEvo: true },
    'iron-ball': { s: { 5: 0.5 } },
    'light-ball': { s: { 1: 2, 3: 2 }, sp: [25] },
    'thick-club': { s: { 1: 2 }, sp: [104, 105] },
    'deep-sea-tooth': { s: { 3: 2 }, sp: [366] },
    'deep-sea-scale': { s: { 4: 2 }, sp: [366] },
    'metal-powder': { s: { 2: 2 }, sp: [132] },
    'quick-powder': { s: { 5: 2 }, sp: [132] },
  };

  /* ---------------- Combate: estado, PS, clima, campo y cambios de características ---------------- */


  function highestStat(p) {
    let best = 1;
    for (let i = 2; i <= 5; i++) if (p.s[i] > p.s[best]) best = i;
    return best;
  }

  const paradox = (c, active, why) => {
    if (!active) return null;
    const best = highestStat(c.p);
    return {
      parts: [{ i: best, m: best === 5 ? 1.5 : 1.3 }],
      note: `Activa por ${why}: sube su característica más alta (${ST_LABEL[best]}, según las stats base).`,
    };
  };

  // Habilidades que cambian las características. Devuelven { parts, note } si están activas o { hint } si no.
  const weatherSpeed = (w, name) => (c) => (c.W === w ? { parts: [{ i: 5, m: 2 }] } : { hint: `duplica su Velocidad con ${name}.` });
  const ABILITY_STATS = {
    'Huge Power': () => ({ parts: [{ i: 1, m: 2 }] }),
    'Pure Power': () => ({ parts: [{ i: 1, m: 2 }] }),
    'Hustle': () => ({ parts: [{ i: 1, m: 1.5 }, { i: 6, m: 0.8 }], note: 'La precisión baja solo en sus ataques físicos.' }),
    'Gorilla Tactics': () => ({ parts: [{ i: 1, m: 1.5 }], note: 'Solo puede usar el primer movimiento que elija.' }),
    'Fur Coat': () => ({ parts: [{ i: 2, m: 2 }] }),
    'Ice Scales': () => ({ parts: [{ i: 4, m: 2, eq: true }], note: 'Recibe la mitad de daño de los ataques especiales (equivale a ×2 Def. Esp.).' }),
    'Multiscale': (c) => (c.hp === 'full'
      ? { parts: [{ i: 2, m: 2, eq: true }, { i: 4, m: 2, eq: true }], note: 'Con los PS al máximo recibe la mitad de daño.' }
      : { hint: 'recibe la mitad de daño solo con los PS al máximo.' }),
    'Shadow Shield': (c) => ABILITY_STATS.Multiscale(c),
    'Marvel Scale': (c) => (c.st ? { parts: [{ i: 2, m: 1.5 }] } : { hint: 'sube la Defensa ×1,5 si tiene un problema de estado.' }),
    'Guts': (c) => (c.st
      ? { parts: [{ i: 1, m: 1.5 }], note: c.st === 'brn' ? 'Además, la quemadura no le reduce el daño.' : '' }
      : { hint: 'sube el Ataque ×1,5 si tiene un problema de estado.' }),
    'Quick Feet': (c) => (c.st
      ? { parts: [{ i: 5, m: 1.5 }], note: c.st === 'par' ? 'Además, la parálisis no le baja la Velocidad.' : '' }
      : { hint: 'sube la Velocidad ×1,5 si tiene un problema de estado.' }),
    'Toxic Boost': (c) => (['psn', 'tox'].includes(c.st)
      ? { parts: [{ i: 1, m: 1.5, eq: true }], note: 'Sus ataques físicos hacen ×1,5 de daño mientras esté envenenado.' }
      : { hint: 'sus ataques físicos hacen ×1,5 de daño si está envenenado.' }),
    'Flare Boost': (c) => (c.st === 'brn'
      ? { parts: [{ i: 3, m: 1.5, eq: true }], note: 'Sus ataques especiales hacen ×1,5 de daño mientras esté quemado.' }
      : { hint: 'sus ataques especiales hacen ×1,5 de daño si está quemado.' }),
    'Defeatist': (c) => (hpAtMost(c.hp, 'half')
      ? { parts: [{ i: 1, m: 0.5 }, { i: 3, m: 0.5 }] }
      : { hint: 'con la mitad de PS o menos, su Ataque y su At. Esp. bajan a la mitad.' }),
    'Slow Start': () => ({ parts: [{ i: 1, m: 0.5 }, { i: 5, m: 0.5 }], note: 'Solo durante sus 5 primeros turnos en combate.' }),
    'Chlorophyll': weatherSpeed('sun', 'sol intenso'),
    'Swift Swim': weatherSpeed('rain', 'lluvia'),
    'Sand Rush': weatherSpeed('sand', 'tormenta de arena'),
    'Slush Rush': weatherSpeed('snow', 'nieve'),
    'Solar Power': (c) => (c.W === 'sun'
      ? { parts: [{ i: 3, m: 1.5 }], note: 'Pierde 1/8 de sus PS cada turno con sol.' }
      : { hint: 'sube el At. Esp. ×1,5 con sol intenso.' }),
    'Flower Gift': (c) => (c.W === 'sun'
      ? { parts: [{ i: 1, m: 1.5 }, { i: 4, m: 1.5 }], note: 'También a sus aliados.' }
      : { hint: 'sube el Ataque y la Def. Esp. ×1,5 con sol intenso.' }),
    'Surge Surfer': (c) => (c.T === 'electric' ? { parts: [{ i: 5, m: 2 }] } : { hint: 'duplica su Velocidad en un Campo Eléctrico.' }),
    'Grass Pelt': (c) => (c.T === 'grassy' ? { parts: [{ i: 2, m: 1.5 }] } : { hint: 'sube la Defensa ×1,5 en un Campo de Hierba.' }),
    'Protosynthesis': (c) => paradox(c, c.W === 'sun' || c.it?.k === 'booster-energy', c.W === 'sun' ? 'el sol intenso' : 'la Energía Potenciadora')
      || { hint: 'sube su característica más alta con sol intenso o con Energía Potenciadora.' },
    'Quark Drive': (c) => paradox(c, c.T === 'electric' || c.it?.k === 'booster-energy', c.T === 'electric' ? 'el Campo Eléctrico' : 'la Energía Potenciadora')
      || { hint: 'sube su característica más alta en un Campo Eléctrico o con Energía Potenciadora.' },
    'Orichalcum Pulse': (c) => (c.W === 'sun'
      ? { parts: [{ i: 1, m: 5461 / 4096 }], note: 'Al entrar en combate crea sol intenso.' }
      : { hint: 'al entrar crea sol intenso y, con sol, sube el Ataque ×1,33. Pon el clima en «Sol intenso».' }),
    'Hadron Engine': (c) => (c.T === 'electric'
      ? { parts: [{ i: 3, m: 5461 / 4096 }], note: 'Al entrar en combate crea un Campo Eléctrico.' }
      : { hint: 'al entrar crea un Campo Eléctrico y, en él, sube el At. Esp. ×1,33. Pon el campo en «Campo Eléctrico».' }),
    'Sand Veil': (c) => (c.W === 'sand' ? { parts: [{ i: 7, m: 1.25 }] } : { hint: 'sube su evasión ×1,25 con tormenta de arena.' }),
    'Snow Cloak': (c) => (c.W === 'snow' ? { parts: [{ i: 7, m: 1.25 }] } : { hint: 'sube su evasión ×1,25 con nieve.' }),
    'Compound Eyes': () => ({ parts: [{ i: 6, m: 1.3 }] }),
    'Victory Star': () => ({ parts: [{ i: 6, m: 1.1 }], note: 'También a sus aliados.' }),
    'Unburden': () => ({ hint: 'duplica su Velocidad cuando usa o pierde su objeto (súbele la Velocidad +2 para simularlo).' }),
    'Simple': () => ({ hint: 'los cambios de características que recibe se duplican. Pon los niveles que tenga de verdad.' }),
    'Contrary': () => ({ hint: 'los cambios de características que recibe se invierten. Pon los niveles que tenga de verdad.' }),
    'Unaware': () => ({ hint: 'ignora los cambios de características del rival al atacar y al recibir ataques.' }),
    'Intimidate': () => ({ hint: 'al entrar baja 1 nivel el Ataque de los rivales. Márcalo en sus cambios de características.' }),
    'Speed Boost': () => ({ hint: 'sube 1 nivel su Velocidad al final de cada turno. Ve sumándolo con el botón +.' }),
    'Moxie': () => ({ hint: 'sube 1 nivel su Ataque cada vez que debilita a un rival.' }),
    'Beast Boost': () => ({ hint: 'sube 1 nivel su característica más alta cada vez que debilita a un rival.' }),
    'Download': () => ({ hint: 'al entrar sube 1 nivel su Ataque o su At. Esp., según la defensa más baja del rival.' }),
    'Plus': () => ({ hint: 'sube el At. Esp. ×1,5 si un aliado tiene Más o Menos.' }),
    'Minus': () => ({ hint: 'sube el At. Esp. ×1,5 si un aliado tiene Más o Menos.' }),
    'Klutz': () => ({ hint: 'no puede usar su objeto: su efecto no se aplica.' }),
  };

  /**
   * Todos los efectos sobre las características de un pokémon:
   * real[i] = multiplicador real de la característica, eq[i] = equivalente en daño.
   */
  function statEffects(p, mem) {
    const W = state.cond.weather;
    const T = state.cond.terrain;
    const st = mem.st || '';
    const hp = hpLevel(mem);
    const ab = mem.ab != null ? A.get(mem.ab) : null;
    const abEn = ab ? ab.en : '';
    const klutz = abEn === 'Klutz';
    const it = !klutz && mem.it != null ? I.get(mem.it) : null;
    const sources = [];
    const hints = [];
    const add = (label, kind, parts, note) => sources.push({ label, kind, parts, note });

    // Objeto
    if (it) {
      const dmg = DAMAGE_EQUIV[it.k];
      if (dmg) add(it.n, 'item', Object.entries(dmg.eq).map(([i, m]) => ({ i: +i, m, eq: true })), dmg.note);
      const def = ITEM_STATS[it.k];
      if (def) {
        if (def.sp && !def.sp.includes(p.sp)) hints.push(`<b>${esc(it.n)}</b>: no tiene efecto en ${esc(p.n)}.`);
        else if (def.needsEvo && !p.ev) hints.push(`<b>${esc(it.n)}</b>: no tiene efecto porque ${esc(p.n)} ya no puede evolucionar (evolución final, mega, gigamax o forma que no evoluciona).`);
        else add(it.n, 'item', Object.entries(def.s).map(([i, m]) => ({ i: +i, m })), def.needsEvo ? `Funciona porque ${p.n} todavía puede evolucionar.` : '');
      }
      if (it.k === 'booster-energy' && !['Protosynthesis', 'Quark Drive'].includes(abEn)) {
        hints.push(`<b>${esc(it.n)}</b>: solo funciona con las habilidades Paleosíntesis o Carga Cuark.`);
      }
    }

    // Habilidad
    const fn = ab && ABILITY_STATS[abEn];
    if (fn) {
      const r = fn({ p, mem, W, T, st, hp, it });
      if (r.parts && r.parts.length) add(ab.n, 'ability', r.parts, r.note || '');
      else if (r.hint) hints.push(`<b>${esc(ab.n)}</b>: ${esc(r.hint)}`);
    }

    // Problema de estado
    if (st === 'brn' && abEn !== 'Guts') {
      add('Quemado', 'status', [{ i: 1, m: 0.5, eq: true }], 'La quemadura reduce a la mitad el daño de sus ataques físicos y quita 1/16 de PS por turno.');
    }
    if (st === 'par' && abEn !== 'Quick Feet') {
      add('Paralizado', 'status', [{ i: 5, m: 0.5 }], 'La parálisis reduce su Velocidad a la mitad y a veces no le deja moverse.');
    }

    // Clima
    if (W === 'sand' && p.t.includes('rock')) add(WEATHERS.sand, 'weather', [{ i: 4, m: 1.5 }], 'Los tipo Roca tienen ×1,5 Def. Esp. con tormenta de arena.');
    if (W === 'snow' && p.t.includes('ice')) add(WEATHERS.snow, 'weather', [{ i: 2, m: 1.5 }], 'Los tipo Hielo tienen ×1,5 Defensa con nieve.');

    // Naturaleza: ×1,1 a la que sube y ×0,9 a la que baja
    const nat = mem.nat ? NATURE.get(mem.nat) : null;
    if (nat && nat[1]) add(nat[0], 'nature', [{ i: nat[1], m: 1.1, nat: true }, { i: nat[2], m: 0.9, nat: true }], '');

    // Cambios de características
    const stg = mem.stg || [];
    const stageParts = [];
    for (let i = 1; i <= 7; i++) if (stg[i]) stageParts.push({ i, m: stageMult(stg[i], i >= 6), stage: stg[i] });
    if (stageParts.length) add('Cambios de características', 'stage', stageParts, '');

    const real = Array(8).fill(1);
    const eq = Array(8).fill(1);
    for (const s of sources) for (const pt of s.parts) if (!pt.nat) (pt.eq ? eq : real)[pt.i] *= pt.m;
    return { real, eq, sources, hints };
  }

  /** Velocidad efectiva aproximada (stat base con todos los efectos). */
  const effectiveSpeed = (mem) => {
    const p = P.get(mem.pid);
    return Math.floor(calcStat(p, mem, 5) * statEffects(p, mem).real[5]);
  };

  /** Estadística real con la fórmula del juego (nivel, IV, EV y, si se pide, naturaleza). */
  function calcStat(p, mem, i, withNature = true) {
    const lv = mem.lv || 50;
    const iv = mem.iv ? mem.iv[i] : 31;
    const ev = mem.ev ? mem.ev[i] : 0;
    const core = Math.floor(((2 * p.s[i] + iv + Math.floor(ev / 4)) * lv) / 100);
    if (i === 0) return p.sp === 292 ? 1 : core + lv + 10; // Shedinja siempre tiene 1 PS
    let v = core + 5;
    const n = withNature && mem.nat ? NATURE.get(mem.nat) : null;
    if (n && n[1] === i) v = Math.floor(v * 1.1);
    else if (n && n[2] === i) v = Math.floor(v * 0.9);
    return v;
  }
  const maxHP = (mem) => calcStat(P.get(mem.pid), mem, 0);
  const curHP = (mem) => (mem.chp == null ? maxHP(mem) : Math.min(mem.chp, maxHP(mem)));
  function hpLevel(mem) {
    const max = maxHP(mem);
    const r = max ? curHP(mem) / max : 1;
    if (r >= 1) return 'full';
    if (r > 1 / 2) return 'high';
    if (r > 1 / 3) return 'half';
    if (r > 1 / 4) return 'third';
    return 'quarter';
  }
  const setHP = (mem, v) => {
    const max = maxHP(mem);
    const hp = Math.max(0, Math.min(max, Math.round(v)));
    mem.chp = hp >= max ? null : hp;
    mem.ko = hp === 0;
  };

  const DAMAGE_EQUIV = {
    'life-orb': {
      eq: { 1: 1.3, 3: 1.3 },
      note: 'No sube las stats, sube el daño de todos sus ataques. El tramo punteado es el equivalente aproximado. Pierde 1/10 de sus PS por ataque.',
    },
    'muscle-band': {
      eq: { 1: 1.1 },
      note: 'No sube el Ataque, sube el daño de sus ataques físicos. El tramo punteado es el equivalente aproximado.',
    },
    'wise-glasses': {
      eq: { 3: 1.1 },
      note: 'No sube el At. Esp., sube el daño de sus ataques especiales. El tramo punteado es el equivalente aproximado.',
    },
  };

  const TYPE_BY_NAME = new Map(Object.entries(TYPES).map(([k, t]) => [fold(t.n), k]));

  /** Multiplicador de daño que el objeto da a un ataque concreto: { m, label } o null. */
  // Listas de ataques por nombre en inglés (PokeAPI no trae estas categorías).
  const MOVE_SETS = {
    punch: /punch|^hammer arm$|^meteor mash$|^sky uppercut$|^dizzy punch$|^comet punch$|^surging strikes$|^wicked blow$|^jet punch$|^rage fist$|^headlong rush$|^double iron bash$|^plasma fists$/i,
    bite: /fang|bite|crunch|^jaw lock$|^fishious rend$/i,
    pulse: /pulse|^aura sphere$/i,
    slice: /^(slash|cut|air cutter|air slash|aerial ace|aqua cutter|behemoth blade|bitter blade|ceaseless edge|cross poison|fury cutter|kowtow cleave|leaf blade|mighty cleave|night slash|population bomb|psyblade|psycho cut|razor leaf|razor shell|sacred sword|secret sword|solar blade|stone axe|tachyon cutter|x-scissor)$/i,
    recoil: /^(double-edge|brave bird|flare blitz|head smash|wood hammer|wild charge|take down|submission|volt tackle|head charge|light of ruin|wave crash|jump kick|high jump kick|supercell slam|chloroblast)$/i,
    sound: /^(hyper voice|boomburst|bug buzz|snarl|round|echoed voice|uproar|overdrive|sparkling aria|disarming voice|clanging scales|torch song|alluring voice|psychic noise|relic song|chatter|eerie spell|snore)$/i,
  };

  const ATE = { 'Pixilate': 'fairy', 'Aerilate': 'flying', 'Refrigerate': 'ice', 'Galvanize': 'electric' };
  const PINCH = { 'Blaze': 'fire', 'Torrent': 'water', 'Overgrow': 'grass', 'Swarm': 'bug' };
  const TYPE_BOOST_AB = {
    'Steelworker': ['steel', 1.5], 'Steely Spirit': ['steel', 1.5], 'Transistor': ['electric', 1.3],
    "Dragon's Maw": ['dragon', 1.5], 'Rocky Payload': ['rock', 1.5], 'Water Bubble': ['water', 2],
  };

  /** Efectos de la habilidad sobre un ataque concreto: [{ m, label }]. */
  function abilityMoveBoosts(p, mem, mv) {
    const ab = mem.ab != null ? A.get(mem.ab) : null;
    if (!ab || mv.c === 'status') return [];
    const en = ab.en;
    const out = [];
    const W = state.cond.weather;
    if (en === 'Technician' && mv.p && mv.p <= 60) out.push({ m: '×1,5', label: `${ab.n} (potencia 60 o menos)` });
    if (ATE[en] && mv.t === 'normal') out.push({ m: '×1,2', label: `${ab.n}: pasa a tipo ${typeOf(ATE[en]).n}` });
    if (en === 'Normalize') out.push({ m: '×1,2', label: `${ab.n}: pasa a tipo Normal` });
    if (en === 'Liquid Voice' && MOVE_SETS.sound.test(mv.en)) out.push({ m: '', label: `${ab.n}: pasa a tipo Agua` });
    if (PINCH[en] && mv.t === PINCH[en]) {
      out.push(hpAtMost(hpLevel(mem), 'third')
        ? { m: '×1,5', label: `${ab.n} (1/3 de PS o menos)` }
        : { m: '×1,5', label: `${ab.n}, con 1/3 de PS o menos`, off: true });
    }
    if (TYPE_BOOST_AB[en] && mv.t === TYPE_BOOST_AB[en][0]) out.push({ m: '×' + fmtMult(TYPE_BOOST_AB[en][1]), label: ab.n });
    if (en === 'Sand Force' && ['rock', 'ground', 'steel'].includes(mv.t)) {
      out.push(W === 'sand' ? { m: '×1,3', label: ab.n } : { m: '×1,3', label: `${ab.n}, con tormenta de arena`, off: true });
    }
    if (en === 'Iron Fist' && MOVE_SETS.punch.test(mv.en)) out.push({ m: '×1,2', label: ab.n });
    if (en === 'Strong Jaw' && MOVE_SETS.bite.test(mv.en)) out.push({ m: '×1,5', label: ab.n });
    if (en === 'Mega Launcher' && MOVE_SETS.pulse.test(mv.en)) out.push({ m: '×1,5', label: ab.n });
    if (en === 'Sharpness' && MOVE_SETS.slice.test(mv.en)) out.push({ m: '×1,5', label: ab.n });
    if (en === 'Reckless' && MOVE_SETS.recoil.test(mv.en)) out.push({ m: '×1,2', label: ab.n });
    if (en === 'Punk Rock' && MOVE_SETS.sound.test(mv.en)) out.push({ m: '×1,3', label: ab.n });
    if (en === 'Tough Claws' && mv.c === 'physical') out.push({ m: '×1,3', label: `${ab.n}, si es de contacto`, off: true });
    if (en === 'Sheer Force') out.push({ m: '×1,3', label: `${ab.n}, si tiene efecto secundario`, off: true });
    if (en === 'Tinted Lens') out.push({ m: '×2', label: `${ab.n}, si es poco eficaz`, off: true });
    if (en === 'Analytic') out.push({ m: '×1,3', label: `${ab.n}, si ataca el último`, off: true });
    if (en === 'Toxic Boost' && mv.c === 'physical' && ['psn', 'tox'].includes(mem.st)) out.push({ m: '×1,5', label: ab.n });
    if (en === 'Flare Boost' && mv.c === 'special' && mem.st === 'brn') out.push({ m: '×1,5', label: ab.n });
    if (mv.c === 'physical' && mem.st === 'brn' && en !== 'Guts' && mv.en !== 'Facade') out.push({ m: '×0,5', label: 'Quemado', bad: true });
    if (mv.en === 'Facade' && mem.st) out.push({ m: '×2', label: 'Imagen con problema de estado' });
    return out;
  }

  function itemMoveBoost(p, mem, mv) {
    if (mv.c === 'status') return null;
    const it = mem.it != null ? I.get(mem.it) : null;
    if (!it) return null;
    if (mem.ab != null && A.get(mem.ab)?.en === 'Klutz') return null;
    const k = it.k;
    if (k === 'life-orb') return { m: '×1,3', label: it.n };
    if (k === 'muscle-band' && mv.c === 'physical') return { m: '×1,1', label: it.n };
    if (k === 'wise-glasses' && mv.c === 'special') return { m: '×1,1', label: it.n };
    if (k === 'expert-belt') return { m: '×1,2', label: `${it.n}, si es supereficaz` };
    if (k === 'punching-glove' && /\b(punch|pu[ñn]o)\b/i.test(mv.en + ' ' + mv.n)) return { m: '×1,1', label: it.n };
    if (['wellspring-mask', 'hearthflame-mask', 'cornerstone-mask'].includes(k) && p.sp === 1017) return { m: '×1,2', label: it.n };
    const orb = { 'adamant-orb': [483, ['dragon', 'steel']], 'adamant-crystal': [483, ['dragon', 'steel']],
      'lustrous-orb': [484, ['dragon', 'water']], 'lustrous-globe': [484, ['dragon', 'water']],
      'griseous-orb': [487, ['dragon', 'ghost']], 'griseous-core': [487, ['dragon', 'ghost']],
      'soul-dew': [[380, 381], ['psychic', 'dragon']] }[k];
    if (orb) {
      const sps = [].concat(orb[0]);
      return sps.includes(p.sp) && orb[1].includes(mv.t) ? { m: '×1,2', label: it.n } : null;
    }
    if (['type', 'plate', 'gem'].includes(it.g) || k === 'fairy-feather') {
      const t = /de tipo ([A-Za-zÁÉÍÓÚáéíóúñ]+)/.exec(it.e || '');
      const type = t && TYPE_BY_NAME.get(fold(t[1]));
      if (type !== mv.t) return null;
      return it.g === 'gem' ? { m: '×1,3', label: `${it.n}, solo el primer uso` } : { m: '×1,2', label: it.n };
    }
    return null;
  }

  const pct = (v) => Math.min(100, (v / 200) * 100);

  const KIND_LABEL = { item: 'objeto', ability: 'habilidad', status: 'estado', weather: 'clima', nature: 'naturaleza', stage: '' };

  function statsHTML(p, mem) {
    const nat = mem.nat ? NATURE.get(mem.nat) : null;
    const total = p.s.reduce((a, b) => a + b, 0);
    const fx = statEffects(p, mem);
    const rows = p.s.map((v, i) => {
      let cls = '';
      let mark = '';
      if (nat && nat[1] === i) { cls = ' up'; mark = ' <span aria-label="sube por la naturaleza">↑</span>'; }
      if (nat && nat[2] === i) { cls = ' down'; mark = ' <span aria-label="baja por la naturaleza">↓</span>'; }
      const neutral = calcStat(p, mem, i, false);
      const withNat = calcStat(p, mem, i);
      const final = Math.floor(Math.floor(withNat * fx.real[i]) * fx.eq[i]);
      // La barra muestra la base; el tramo extra refleja cuánto cambia la stat real por los efectos.
      const shown = v * (neutral ? final / neutral : 1);
      const onlyEq = fx.real[i] === 1 && (!nat || (nat[1] !== i && nat[2] !== i));
      const why = fx.sources.filter((src) => src.parts.some((pt) => pt.i === i))
        .map((src) => `${src.label}: ×${fmtMult(src.parts.filter((pt) => pt.i === i).reduce((a, pt) => a * pt.m, 1))}`).join(', ');
      let bar = `<i style="width:${pct(v).toFixed(1)}%;--c:${statColor(v)}"></i>`;
      let state = '';
      if (final > neutral) {
        bar += `<i class="${onlyEq ? 'equiv' : 'boost'}" style="width:${Math.max(0, pct(shown) - pct(v)).toFixed(1)}%"></i>`;
        state = onlyEq ? ' eqv' : ' up';
      } else if (final < neutral) {
        bar = `<i style="width:${pct(shown).toFixed(1)}%;--c:${statColor(shown)}"></i><i class="loss" style="width:${Math.max(0, pct(v) - pct(shown)).toFixed(1)}%"></i>`;
        state = ' down';
      }
      const title = `Stat real a nivel ${mem.lv}: ${withNat}${why ? ` · Efectos: ${why}` : ''}`;
      return `
      <div class="stat">
        <span class="stat-label${cls}">${STAT_NAMES[i]}${mark}</span>
        <span class="stat-val">${v}</span>
        <span class="stat-bar">${bar}</span>
        <span class="stat-boost${state}" title="${esc(title)}">${fx.eq[i] !== 1 ? '≈' : ''}${final}</span>
      </div>`;
    }).join('');

    const accEva = [6, 7].filter((i) => fx.real[i] !== 1)
      .map((i) => `<span class="acc-chip ${fx.real[i] > 1 ? 'up' : 'down'}">${ST_LABEL[i]} ×${fmtMult(fx.real[i])}</span>`).join('');

    const items = fx.sources.map((src) => {
      const allEq = src.parts.every((pt) => pt.eq);
      const anyLoss = src.parts.some((pt) => pt.m < 1);
      const parts = src.parts.map((pt) => {
        const lvl = pt.stage ? ` (${pt.stage > 0 ? '+' : ''}${pt.stage})` : '';
        const dmgWord = pt.eq ? (pt.i === 1 ? ' daño físico' : pt.i === 3 ? ' daño especial' : ' daño recibido') : '';
        return `${ST_LABEL[pt.i]}${lvl} ×${fmtMult(pt.m)}${dmgWord ? `, equivale a${dmgWord}` : ''}`;
      }).join('; ');
      const kind = KIND_LABEL[src.kind] ? ` <small>(${KIND_LABEL[src.kind]})</small>` : '';
      return `<li><span class="swatch${anyLoss ? ' loss' : allEq ? ' equiv' : ''}"></span>
        <span><b>${esc(src.label)}</b>${kind}: ${parts}.${src.note ? ` ${esc(src.note)}` : ''}</span></li>`;
    }).join('');
    const hints = fx.hints.map((h) => `<li class="hint"><span class="swatch off"></span><span>${h}</span></li>`).join('');

    return `<div class="stat stat-head"><span></span><span>Base</span><span></span><span title="Estadística real en combate con nivel, EVs, IVs, naturaleza y efectos">Real</span></div>
      ${rows}
      <div class="stat-total"><span>Total</span><b>${total}</b><span></span><span class="stat-lv">Nv. ${mem.lv}</span></div>
      ${accEva ? `<div class="acc-row">${accEva}</div>` : ''}
      ${items || hints ? `<ul class="fx-list">${items}${hints}</ul>` : ''}
      ${evivHTML(p, mem)}
      ${combatHTML(p, mem)}`;
  }

  const evOpen = new Set(); // fichas con el panel de EVs/IVs abierto

  function evivHTML(p, mem) {
    const total = mem.ev.reduce((a, b) => a + b, 0);
    const rows = [0, 1, 2, 3, 4, 5].map((i) => `
      <div class="eviv-row">
        <span>${STAT_NAMES[i]}</span>
        <input class="num" type="number" inputmode="numeric" min="0" max="252" step="4" value="${mem.ev[i]}" data-ev="${i}" aria-label="EVs de ${STAT_NAMES[i]}">
        <input class="num" type="number" inputmode="numeric" min="0" max="31" value="${mem.iv[i]}" data-iv="${i}" aria-label="IVs de ${STAT_NAMES[i]}">
        <b>${calcStat(p, mem, i)}</b>
      </div>`).join('');
    return `<details class="eviv" data-eviv ${evOpen.has(mem.uid) ? 'open' : ''}>
      <summary>EVs e IVs <small>(EVs usados: ${total}/510)</small></summary>
      <div class="eviv-row eviv-head"><span></span><span>EVs</span><span>IVs</span><span>Stat</span></div>
      ${rows}
      <div class="eviv-btns">
        <button class="link-btn" type="button" data-ev-reset>EVs a 0</button>
        <button class="link-btn" type="button" data-iv-max>IVs a 31</button>
      </div>
      <p class="eff-note">EVs: máximo 252 por estadística y 510 en total (cada 4 EVs suman 1 punto a nivel 100). IVs: de 0 a 31.</p>
    </details>`;
  }

  function hpBarHTML(p, mem) {
    const max = maxHP(mem);
    const cur = curHP(mem);
    const r = max ? cur / max : 0;
    const color = r > 0.5 ? 'g' : r > 0.2 ? 'y' : 'r';
    return `<div class="m-hp">
      <label class="lv-label">Nivel <input class="num" type="number" inputmode="numeric" min="1" max="100" value="${mem.lv}" data-lv aria-label="Nivel de ${esc(p.n)}"></label>
      <span class="hp-title">PS</span>
      <input class="hp-range hp-${color}" type="range" min="0" max="${max}" step="1" value="${cur}" data-hp-range
        style="--p:${(r * 100).toFixed(1)}%" aria-label="PS de ${esc(p.n)}" aria-valuetext="${cur} de ${max} PS">

      <span class="hp-num">
        <input class="num" type="number" inputmode="numeric" min="0" max="${max}" value="${cur}" data-chp aria-label="PS actuales de ${esc(p.n)}">
        <span>/ <b>${max}</b></span>
        <small>${Math.round(r * 100)}%</small>
      </span>
      <span class="hp-btns">
        <button type="button" data-hpd="-0.25" title="Quitar el 25 % de sus PS máximos">−25%</button>
        <button type="button" data-hpd="-0.1" title="Quitar el 10 % de sus PS máximos">−10%</button>
        <button type="button" data-hpd="0.1" title="Recuperar el 10 % de sus PS máximos">+10%</button>
        <button type="button" data-hpd="0.25" title="Recuperar el 25 % de sus PS máximos">+25%</button>
        <button type="button" data-hp-full ${cur >= max ? 'disabled' : ''}>Curar</button>
      </span>
    </div>`;
  }

  function combatHTML(p, mem) {
    const stg = mem.stg || [];
    const any = stg.some((x) => x);
    const rows = [1, 2, 3, 4, 5, 6, 7].map((i) => {
      const st = stg[i] || 0;
      return `<div class="stage-row">
        <span class="stage-name">${ST_LABEL[i]}</span>
        <button class="stage-btn" type="button" data-stage="${i}" data-d="-1" ${st <= -6 ? 'disabled' : ''} aria-label="Bajar 1 nivel ${ST_LABEL[i]}">−</button>
        <b class="stage-val${st > 0 ? ' pos' : st < 0 ? ' neg' : ''}">${st > 0 ? '+' : ''}${st}</b>
        <button class="stage-btn" type="button" data-stage="${i}" data-d="1" ${st >= 6 ? 'disabled' : ''} aria-label="Subir 1 nivel ${ST_LABEL[i]}">+</button>
        <span class="stage-mult">${st ? '×' + fmtMult(stageMult(st, i >= 6)) : ''}</span>
      </div>`;
    }).join('');
    const statusOpts = Object.entries(STATUS).map(([k, n]) => `<option value="${k}" ${mem.st === k ? 'selected' : ''}>${n}</option>`).join('');
    return `<section class="combat" aria-label="En combate">
      <h3>En combate</h3>
      <label class="sel-label">Problema de estado
        <select class="select" data-status><option value="">Ninguno</option>${statusOpts}</select>
      </label>
      <div class="stages-head"><span>Cambios de características</span>${any ? '<button class="link-btn" type="button" data-stage-reset>Quitar todos</button>' : ''}</div>
      <div class="stages">${rows}</div>
    </section>`;
  }

  function moveHTML(mem, i) {
    const p = P.get(mem.pid);
    const m = mem.mv[i] != null ? M.get(mem.mv[i]) : null;
    const label = `Movimiento ${i + 1}`;
    if (!m) {
      return `<div class="move empty" data-slot="${i}">
        <div class="move-top combo">
          <input class="field" type="text" aria-label="${label}" placeholder="Añadir movimiento">
          <ul class="combo-list"></ul>
        </div>
      </div>`;
    }
    const prio = m.pr ? `<span>Prioridad <b>${m.pr > 0 ? '+' : ''}${m.pr}</b></span>` : '';
    const adaptability = mem.ab != null && A.get(mem.ab)?.en === 'Adaptability';
    const stab = m.c !== 'status' && p.t.includes(m.t)
      ? (adaptability
        ? `<span class="tag stab" title="Mismo tipo que el pokémon y ${esc(A.get(mem.ab).n)}: el doble de daño">STAB ×2 (${esc(A.get(mem.ab).n)})</span>`
        : '<span class="tag stab" title="Mismo tipo que el pokémon: hace un 50 % más de daño">STAB ×1,5</span>') : '';
    const abTags = abilityMoveBoosts(p, mem, m).map((b) =>
      `<span class="tag ab-dmg${b.off ? ' off' : ''}${b.bad ? ' bad' : ''}" title="${b.off ? 'Solo en esas condiciones' : 'Efecto activo'}">${b.m ? b.m + ' ' : ''}${esc(b.label)}</span>`).join('');
    const boost = itemMoveBoost(p, mem, m);
    const itemTag = boost
      ? `<span class="tag item-dmg" title="Daño multiplicado por el objeto: ${esc(boost.label)}">${boost.m} ${esc(boost.label)}</span>` : '';
    const used = mem.ppu[i] || 0;
    const left = m.pp != null ? m.pp - used : null;
    const pp = m.pp == null ? '' : `
      <div class="pp-ctl${left === 0 ? ' empty' : ''}">
        <span class="pp-label">PP restantes</span>
        <span class="pp-bar" aria-hidden="true"><i style="width:${(left / m.pp) * 100}%"></i></span>
        <b class="pp-num">${left}<small>/${m.pp}</small></b>
        <button class="pp-btn" type="button" data-pp-slot="${i}" data-pp="1" ${left === 0 ? 'disabled' : ''}
          aria-label="Gastar 1 PP de ${esc(m.n)}" title="Gastar 1 PP (usar el ataque)">−</button>
        <button class="pp-btn" type="button" data-pp-slot="${i}" data-pp="-1" ${used === 0 ? 'disabled' : ''}
          aria-label="Recuperar 1 PP de ${esc(m.n)}" title="Recuperar 1 PP">+</button>
      </div>`;
    return `<div class="move${left === 0 ? ' no-pp' : ''}" data-slot="${i}" style="--mt:${typeOf(m.t).c}">
      <div class="move-top combo">
        ${typeBadge(m.t)}
        <input class="field" type="text" aria-label="${label}" value="${esc(m.n)}" placeholder="Añadir movimiento">
        <button class="clear" type="button" data-clear="${i}" aria-label="Quitar ${esc(m.n)}" title="Quitar movimiento">${ICON_X}</button>
        <ul class="combo-list"></ul>
      </div>
      <div class="move-meta">
        ${catPill(m.c)}
        <span>Potencia <b>${m.p ?? '—'}</b></span>
        <span>Precisión <b>${m.a != null ? m.a + '%' : '—'}</b></span>
        ${prio}${stab}${itemTag}${abTags}${left === 0 ? '<span class="tag no-pp-tag">Sin PP</span>' : ''}
      </div>
      ${pp}
      <p class="desc">${esc(m.d)}</p>
    </div>`;
  }

  const BUCKETS = [
    [4, 'Muy débil', 'm4'], [2, 'Débil', 'm2'], [1, 'Neutro', 'm1'],
    [0.5, 'Resiste', 'mh'], [0.25, 'Resiste mucho', 'mq'], [0, 'Inmune', 'm0'],
  ];

  function rowsHTML(entries) {
    // entries: [{ t, m, why }]
    const groups = new Map();
    for (const e of entries) {
      if (!groups.has(e.m)) groups.set(e.m, []);
      groups.get(e.m).push(e);
    }
    return [...groups.keys()].sort((a, b) => b - a).map((m) => {
      const b = BUCKETS.find((x) => x[0] === m);
      const cls = b ? b[2] : m > 1 ? 'm2' : 'mh';
      const label = b ? b[1] : m > 1 ? 'Débil' : 'Resiste';
      const badges = groups.get(m).map((e) => e.why
        ? `<span class="why" title="Por ${esc(e.why)}">${typeBadge(e.t, ' sm')}<sup>*</sup></span>`
        : typeBadge(e.t, ' sm')).join('');
      return `<div class="eff-row ${cls}"><span class="eff-mult"><b>${multLabel(m)}</b> ${label}</span><span class="eff-types">${badges}</span></div>`;
    }).join('');
  }

  function defenseHTML(mem) {
    const useTera = teraView.has(mem.uid) && mem.tera && mem.tera !== 'stellar';
    const entries = ALL_TYPES.map((t) => ({ t, ...damageTaken(t, mem, useTera) }));
    const notes = [...new Set(entries.filter((e) => e.why).map((e) => e.why))];
    const teraToggle = mem.tera && mem.tera !== 'stellar'
      ? `<label class="tera-toggle"><input type="checkbox" data-tera-view ${useTera ? 'checked' : ''}> Teracristalizado (${esc(typeOf(mem.tera).n)})</label>` : '';
    return `<div class="eff-head"><h3>Daño que recibe</h3>${teraToggle}</div>
      ${rowsHTML(entries)}
      ${notes.length ? `<p class="eff-note">* Cambia por ${notes.map(esc).join(' y ')}.</p>` : ''}`;
  }

  function offenseHTML(mem) {
    const { types, fromMoves } = attackTypes(mem);
    const entries = ALL_TYPES.map((t) => ({ t, m: types.reduce((best, a) => Math.max(best, eff(a, [t])), 0) }))
      .filter((e) => e.m !== 1);
    const se = entries.filter((e) => e.m > 1);
    const rest = entries.filter((e) => e.m < 1);
    const note = fromMoves
      ? `Según sus movimientos de daño (${types.map((t) => typeOf(t).n).join(', ')}).`
      : 'Según sus tipos. Añade movimientos de daño para verlo con más precisión.';
    const perMove = damagingMoves(mem).map((mv) => {
      const row = (cls, label, list) => (list.length
        ? `<div class="eff-row ${cls}"><span class="eff-mult"><b>${label}</b></span><span class="eff-types">${list.map((t) => typeBadge(t, ' sm')).join('')}</span></div>` : '');
      const se = ALL_TYPES.filter((t) => eff(mv.t, [t]) > 1);
      const nve = ALL_TYPES.filter((t) => eff(mv.t, [t]) === 0.5);
      const immune = ALL_TYPES.filter((t) => eff(mv.t, [t]) === 0);
      return `<div class="mv-eff" style="--mt:${typeOf(mv.t).c}">
        <div class="mv-eff-head">${typeBadge(mv.t, ' sm')}<b>${esc(mv.n)}</b></div>
        ${row('m2', '×2 Supereficaz', se) || '<div class="eff-row m2"><span class="eff-mult"><b>×2 Supereficaz</b></span><span class="none">Ningún tipo</span></div>'}
        ${row('mh', '×½ Poco eficaz', nve)}
        ${row('m0', '×0 Sin efecto', immune)}
      </div>`;
    }).join('');
    return `<h3>A qué le pega fuerte</h3>
      <div class="eff-row m2"><span class="eff-mult"><b>×2</b> Supereficaz</span><span class="eff-types">${se.length ? se.map((e) => typeBadge(e.t, ' sm')).join('') : '<span class="none">Ningún tipo</span>'}</span></div>
      ${rest.length ? rowsHTML(rest).replace(/Resiste mucho|Resiste/g, 'Poco eficaz').replace(/Inmune/g, 'Sin efecto') : ''}
      <p class="eff-note">${note}</p>
      ${perMove ? `<h4 class="mv-eff-title">Cada ataque por separado</h4><div class="mv-eff-list">${perMove}</div>` : ''}`;
  }

  function vsHTML(mem) {
    const tab = TABS[state.active];
    const koOthers = otherTeam().filter((o) => o.ko).map((o) => P.get(o.pid).n);
    const others = otherTeam().filter((o) => !o.ko);
    if (!otherTeam().length) return `<h3>${tab.vsTitle}</h3><p class="eff-note">${tab.vsEmpty}</p>`;
    if (!others.length) return `<h3>${tab.vsTitle}</h3><p class="eff-note">Todos están debilitados.</p>`;
    const chip = (o, best) => {
      const p = P.get(o.pid);
      return `<span class="vs-chip ${best.m >= 4 ? 'x4' : ''}" title="${esc(p.n)}: ${multLabel(best.m)} con ${esc(best.mv.n)}">${imgTag(p.id, 'mini', '', '')}<span class="vs-text">${esc(p.n)} <b>${multLabel(best.m)}</b><small>con ${esc(best.mv.n)}</small></span></span>`;
    };
    const mine = P.get(mem.pid);
    const sorter = (a, b) => b[1].m - a[1].m;
    const hits = others.map((o) => [o, bestMoveAgainst(mem, o)]).filter(([, b]) => b && b.m >= 2).sort(sorter);
    const hitBy = others.map((o) => [o, bestMoveAgainst(o, mem)]).filter(([, b]) => b && b.m >= 2).sort(sorter);
    const mySpeed = effectiveSpeed(mem);
    const faster = others.filter((o) => effectiveSpeed(o) < mySpeed).length;
    const noMoves = others.filter((o) => !damagingMoves(o).length).map((o) => P.get(o.pid).n);
    const myLine = damagingMoves(mem).length
      ? (hits.length ? hits.map(([o, b]) => chip(o, b)).join('') : '<span class="none">Ninguno con sus ataques</span>')
      : '<span class="none">Ponle ataques de daño para calcularlo.</span>';
    return `<h3>${tab.vsTitle}</h3>
      <div class="vs-row"><span class="vs-label">Le pega fuerte a</span><span class="vs-chips">${myLine}</span></div>
      <div class="vs-row"><span class="vs-label">Le pegan fuerte</span><span class="vs-chips">${hitBy.length ? hitBy.map(([o, b]) => chip(o, b)).join('') : '<span class="none">Ninguno con sus ataques</span>'}</span></div>
      <p class="eff-note">Calculado con los ataques puestos de cada pokémon.${noMoves.length ? ` Sin ataques de daño (no cuentan): ${noMoves.map(esc).join(', ')}.` : ''}${koOthers.length ? ` Debilitados (no cuentan): ${koOthers.map(esc).join(', ')}.` : ''}</p>
      <p class="eff-note">Velocidad ${mySpeed}${mySpeed !== mine.s[5] ? ` (base ${mine.s[5]}, con efectos)` : ' (base)'}: más rápido que ${faster} de ${others.length}.</p>`;
  }

  function itemDescHTML(it) {
    if (!it) return '';
    return `${it.e ? `<p class="desc effect">${esc(it.e)}</p>` : ''}${it.d && it.d !== it.e ? `<p class="desc flavor">${esc(it.d)}</p>` : ''}`;
  }

  /* ================================================================ Ficha completa */

  function nextEmptyMove(mem, from) {
    for (let k = 0; k < 4; k++) {
      const j = (from + 1 + k) % 4;
      if (mem.mv[j] == null) return `.move[data-slot="${j}"] input`;
    }
    return null;
  }

  function buildCard(mem) {
    const p = P.get(mem.pid);
    const t1 = typeOf(p.t[0]);
    const t2 = typeOf(p.t[1] || p.t[0]);
    const ab = mem.ab != null ? A.get(mem.ab) : null;
    const item = mem.it != null ? I.get(mem.it) : null;
    const own = new Map(p.ab.map(([id, hidden]) => [id, !!hidden]));

    let abTag = '';
    if (ab && own.get(ab.id)) abTag = '<span class="tag hidden-ab">Habilidad oculta</span>';
    else if (ab && !own.has(ab.id)) abTag = `<span class="tag" title="${esc(p.n)} no tiene esta habilidad de forma natural">No habitual</span>`;

    const natOptions = NATURES.map(([n, up, down]) =>
      `<option value="${n}" ${mem.nat === n ? 'selected' : ''}>${n}${up ? ` (+${STAT_SHORT[up]} −${STAT_SHORT[down]})` : ' (neutra)'}</option>`).join('');
    const teraOptions = Object.keys(TYPES).map((t) =>
      `<option value="${t}" ${mem.tera === t ? 'selected' : ''}>${TYPES[t].n}</option>`).join('');
    const tera = mem.tera ? typeOf(mem.tera) : null;
    const total = team().length;
    const pos = Math.max(0, team().indexOf(mem));

    const el = document.createElement('article');
    el.className = 'member' + (mem.ko ? ' ko' : '');
    el.id = 'm-' + mem.uid;
    el.style.setProperty('--t1', t1.c);
    el.style.setProperty('--t2', t2.c);
    el.setAttribute('aria-label', p.n);
    el.innerHTML = `
      ${hpBarHTML(p, mem)}
      <div class="m-id">
        <div class="art">
          <span class="dex">${dex(p.sp)}</span>
          ${mem.ko ? '<span class="ko-stamp">Debilitado</span>' : ''}
          ${imgTag(p.id, 'art', '', p.n)}
        </div>
        <div class="m-title">
          <h2 class="m-name">${esc(p.n)}</h2>
          <div class="types">${p.t.map((t) => typeBadge(t)).join('')}${mem.st ? `<span class="status-badge st-${mem.st}">${STATUS[mem.st]}</span>` : ''}</div>
          <div class="m-selects">
            <label class="sel-label">Naturaleza
              <select class="select" data-nat><option value="">Sin elegir</option>${natOptions}</select>
            </label>
            <label class="sel-label">Teratipo
              <select class="select${tera ? ' has-tera' : ''}" data-tera ${tera ? `style="--tc:${tera.c};--tf:${tera.f}"` : ''}><option value="">Sin elegir</option>${teraOptions}</select>
            </label>
          </div>
          <div class="card-actions">
            <button class="swap" type="button" aria-label="Cambiar a ${esc(p.n)} por otro pokémon" aria-expanded="false">${ICON_SWAP}Cambiar</button>
            <button class="remove" type="button" aria-label="Borrar a ${esc(p.n)} del equipo">${ICON_TRASH}Borrar</button>
            <button class="ko-btn${mem.ko ? ' is-ko' : ''}" type="button" data-ko aria-pressed="${mem.ko}">
              ${mem.ko ? `${ICON_HEART}Revivir` : `${ICON_KO}Marcar debilitado`}
            </button>
          </div>
          <div class="combo swap-combo" hidden>
            <input class="field" type="text" aria-label="Pokémon por el que cambiar a ${esc(p.n)}" placeholder="Escribe el nuevo pokémon">
            <ul class="combo-list"></ul>
          </div>
          <div class="order" role="group" aria-label="Orden en el equipo">
            <span class="order-pos">Puesto ${pos + 1} de ${total}</span>
            <button class="order-btn" type="button" data-move="-1" ${pos === 0 ? 'disabled' : ''} aria-label="Subir a ${esc(p.n)}" title="Subir">${ICON_UP}</button>
            <button class="order-btn" type="button" data-move="1" ${pos === total - 1 ? 'disabled' : ''} aria-label="Bajar a ${esc(p.n)}" title="Bajar">${ICON_DOWN}</button>
          </div>
        </div>
      </div>

      <section class="m-stats" aria-label="Estadísticas base de ${esc(p.n)}">
        <h3>Estadísticas</h3>
        ${statsHTML(p, mem)}
      </section>

      <div class="m-build">
        <div class="ab-it">
          <section class="m-ability">
            <h3 id="ab-${mem.uid}">Habilidad</h3>
            <div class="ab-row">
              <div class="combo ab-combo">
                <input class="field" type="text" aria-labelledby="ab-${mem.uid}" placeholder="Elige una habilidad" value="${esc(ab ? ab.n : '')}">
                <ul class="combo-list"></ul>
              </div>
              ${abTag}
            </div>
            ${ab ? `<p class="desc">${esc(ab.d)}</p>` : ''}
          </section>
          <section class="m-item">
            <h3 id="it-${mem.uid}">Objeto</h3>
            <div class="ab-row">
              <div class="combo it-combo${item ? ' has-item' : ''}">
                ${item ? itemImg(item, 'it-icon') : ''}
                <input class="field" type="text" aria-labelledby="it-${mem.uid}" placeholder="Elige un objeto" value="${esc(item ? item.n : '')}">
                ${item ? `<button class="clear" type="button" data-clear-item aria-label="Quitar ${esc(item.n)}" title="Quitar objeto">${ICON_X}</button>` : ''}
                <ul class="combo-list"></ul>
              </div>
            </div>
            ${itemDescHTML(item)}
          </section>
        </div>

        <section class="m-moves">
          <h3>Movimientos</h3>
          <div class="moves">${[0, 1, 2, 3].map((i) => moveHTML(mem, i)).join('')}</div>
        </section>
      </div>

      <div class="m-match">
        <section class="eff-block">${defenseHTML(mem)}</section>
        <section class="eff-block">${offenseHTML(mem)}</section>
        <section class="eff-block vs-block">${vsHTML(mem)}</section>
      </div>`;

    // --- Cambiar pokémon
    const swapCombo = el.querySelector('.swap-combo');
    const swapBtn = el.querySelector('.swap');
    const hideSwap = () => {
      swapCombo.hidden = true;
      swapBtn.setAttribute('aria-expanded', 'false');
      swapCombo.querySelector('input').value = '';
    };
    // Si el buscador está abierto, pulsar «Cambiar» lo cierra sin que el blur lo vuelva a abrir.
    swapBtn.addEventListener('mousedown', (e) => { if (!swapCombo.hidden) e.preventDefault(); });
    makeCombo(swapCombo, {
      search: (q) => {
        if (!norm(q)) return {};
        const items = searchPokemon(q).filter((x) => x.id !== mem.pid);
        return { items, note: items.length ? null : `No hay ningún pokémon que coincida con «${q.trim()}».` };
      },
      render: pokemonOptionHTML,
      onPick: (np) => changePokemon(mem, np.id),
      onCancel: () => setTimeout(() => { if (document.activeElement !== swapCombo.querySelector('input')) hideSwap(); }, 0),
    });

    // --- Habilidad
    const abInput = el.querySelector('.ab-combo input');
    const currentAbName = () => (mem.ab != null && A.has(mem.ab) ? A.get(mem.ab).n : '');
    makeCombo(el.querySelector('.ab-combo'), {
      selectOnFocus: true,
      focusQuery: () => '',
      currentText: currentAbName,
      search: (q) => {
        if (!norm(q)) {
          return {
            head: `Habilidades de ${p.n}`,
            items: p.ab.map(([id]) => A.get(id)).filter(Boolean),
            note: 'Escribe para buscar cualquier otra habilidad.',
          };
        }
        const items = find(ABILITIES, q, 40, (a) => (own.has(a.id) ? -0.5 : 0));
        return { items, note: items.length ? null : `No hay ninguna habilidad que coincida con «${q.trim()}».` };
      },
      render: (a, q) => {
        let tag = '';
        if (own.has(a.id)) tag = own.get(a.id) ? '<span class="tag hidden-ab">Oculta</span>' : '<span class="tag">Habitual</span>';
        return `<span class="opt-main"><span class="opt-name"><span>${highlight(a.n, q)}</span>${tag}</span><span class="opt-sub">${esc(a.d)}</span></span>`;
      },
      onPick: (a) => {
        mem.ab = a.id;
        refreshCard(mem, '.it-combo input');
      },
      onEnterNothing: (v) => {
        if (!norm(v) && mem.ab != null) {
          mem.ab = null;
          refreshCard(mem, '.ab-combo input');
        }
      },
      onCancel: () => { abInput.value = currentAbName(); },
    });

    // --- Objeto
    const itInput = el.querySelector('.it-combo input');
    const currentItName = () => (mem.it != null && I.has(mem.it) ? I.get(mem.it).n : '');
    makeCombo(el.querySelector('.it-combo'), {
      selectOnFocus: true,
      focusQuery: () => '',
      currentText: currentItName,
      search: (q) => {
        if (!norm(q)) {
          const stones = D.items.filter((it) => it.mp && P.get(it.mp)?.sp === p.sp);
          return {
            head: stones.length ? `Megapiedras de ${p.n} y objetos más usados` : 'Objetos más usados',
            items: [...stones, ...POPULAR_ITEMS.map((k) => itemByKey.get(k)).filter(Boolean)],
            note: 'Escribe para buscar cualquier otro objeto.',
          };
        }
        const items = find(ITEMS, q, 40);
        return { items, note: items.length ? null : `No hay ningún objeto que coincida con «${q.trim()}».` };
      },
      render: (it, q) => `${itemImg(it, 'opt-item')}
        <span class="opt-main"><span class="opt-name"><span>${highlight(it.n, q)}</span></span><span class="opt-sub">${esc(it.e || it.d)}</span></span>`,
      onPick: (it) => {
        mem.it = it.id;
        refreshCard(mem, nextEmptyMove(mem, -1) || '.it-combo input');
      },
      onEnterNothing: (v) => {
        if (!norm(v) && mem.it != null) {
          mem.it = null;
          refreshCard(mem, '.it-combo input');
        }
      },
      onCancel: () => { itInput.value = currentItName(); },
    });

    // --- Movimientos
    el.querySelectorAll('.move').forEach((slot) => {
      const i = Number(slot.dataset.slot);
      const input = slot.querySelector('input');
      const currentName = () => (mem.mv[i] != null && M.has(mem.mv[i]) ? M.get(mem.mv[i]).n : '');
      makeCombo(slot.querySelector('.combo'), {
        selectOnFocus: true,
        focusQuery: () => '',
        currentText: currentName,
        search: (q) => {
          if (!norm(q)) return {};
          const taken = new Set(mem.mv.filter((id, j) => id != null && j !== i));
          const items = find(MOVES, q, 48).filter((m) => !taken.has(m.id)).slice(0, 40);
          return { items, note: items.length ? null : `No hay ningún movimiento que coincida con «${q.trim()}».` };
        },
        render: (m, q) => `
          ${typeBadge(m.t)}
          <span class="opt-main"><span class="opt-name"><span>${highlight(m.n, q)}</span></span><span class="opt-sub">${esc(m.d)}</span></span>
          <span class="opt-meta">${catPill(m.c)}<span class="opt-pow" title="Potencia">${m.p ?? '—'}</span></span>`,
        onPick: (m) => {
          mem.mv[i] = m.id;
          mem.ppu[i] = 0;
          refreshCard(mem, nextEmptyMove(mem, i) || `.move[data-slot="${i}"] input`);
        },
        onEnterNothing: (v) => {
          if (!norm(v) && mem.mv[i] != null) {
            mem.mv[i] = null;
            mem.ppu[i] = 0;
            refreshCard(mem, `.move[data-slot="${i}"] input`);
          }
        },
        onCancel: () => { input.value = currentName(); },
      });
    });

    el.addEventListener('click', (e) => {
      const clear = e.target.closest('[data-clear]');
      if (clear) {
        const i = Number(clear.dataset.clear);
        mem.mv[i] = null;
        mem.ppu[i] = 0;
        refreshCard(mem, `.move[data-slot="${i}"] input`);
        return;
      }
      const ppBtn = e.target.closest('[data-pp]');
      if (ppBtn) {
        const i = Number(ppBtn.dataset.ppSlot);
        const delta = Number(ppBtn.dataset.pp);
        const max = M.get(mem.mv[i])?.pp || 0;
        mem.ppu[i] = Math.min(Math.max((mem.ppu[i] || 0) + delta, 0), max);
        const sel = `[data-pp-slot="${i}"][data-pp="${delta}"]`;
        refreshCard(mem, sel);
        // Si el botón pulsado queda desactivado, el foco pasa al otro.
        const card = cardEls.get(mem.uid);
        if (card.querySelector(sel)?.disabled) focusQuietly(card.querySelector(`[data-pp-slot="${i}"][data-pp="${-delta}"]`));
        return;
      }
      const stBtn = e.target.closest('[data-stage]');
      if (stBtn) {
        const i = Number(stBtn.dataset.stage);
        const d = Number(stBtn.dataset.d);
        mem.stg[i] = Math.max(-6, Math.min(6, (mem.stg[i] || 0) + d));
        const sel = `[data-stage="${i}"][data-d="${d}"]`;
        refreshCard(mem, sel);
        const card = cardEls.get(mem.uid);
        if (card.querySelector(sel)?.disabled) focusQuietly(card.querySelector(`[data-stage="${i}"][data-d="${-d}"]`));
        return;
      }
      if (e.target.closest('[data-stage-reset]')) {
        mem.stg = [0, 0, 0, 0, 0, 0, 0, 0];
        refreshCard(mem, '[data-stage="1"][data-d="1"]');
        return;
      }
      const hpd = e.target.closest('[data-hpd]');
      if (hpd) {
        setHP(mem, curHP(mem) + maxHP(mem) * Number(hpd.dataset.hpd));
        refreshCard(mem, `[data-hpd="${hpd.dataset.hpd}"]`);
        renderParty();
        return;
      }
      if (e.target.closest('[data-hp-full]')) {
        mem.chp = null;
        mem.ko = false;
        refreshCard(mem, '[data-chp]');
        renderParty();
        return;
      }
      if (e.target.closest('[data-ev-reset]')) {
        mem.ev = [0, 0, 0, 0, 0, 0];
        if (mem.chp != null) setHP(mem, curHP(mem));
        refreshCard(mem, '[data-ev="0"]');
        return;
      }
      if (e.target.closest('[data-iv-max]')) {
        mem.iv = [31, 31, 31, 31, 31, 31];
        refreshCard(mem, '[data-iv="0"]');
        return;
      }
      if (e.target.closest('[data-ko]')) {
        // Debilitado = 0 PS; al revivir vuelve con la mitad, como en el juego.
        if (!mem.ko) mem.chp = 0;
        else if (curHP(mem) === 0) mem.chp = Math.max(1, Math.floor(maxHP(mem) / 2));
        mem.ko = !mem.ko;
        refreshCard(mem, '[data-ko]');
        renderParty();
        // El enfrentamiento del otro equipo cambia: se rehacen sus fichas la próxima vez que se muestren.
        return;
      }
      if (e.target.closest('[data-clear-item]')) {
        mem.it = null;
        refreshCard(mem, '.it-combo input');
        return;
      }
      if (e.target.closest('.remove')) {
        removeMember(mem.uid);
        return;
      }
      if (e.target.closest('.swap')) {
        swapCombo.hidden = !swapCombo.hidden;
        swapBtn.setAttribute('aria-expanded', String(!swapCombo.hidden));
        if (!swapCombo.hidden) swapCombo.querySelector('input').focus();
        return;
      }
      const mv = e.target.closest('[data-move]');
      if (mv) moveMember(mem.uid, Number(mv.dataset.move));
    });

    el.addEventListener('change', (e) => {
      if (e.target.matches('[data-status]')) {
        mem.st = e.target.value;
        refreshCard(mem, '[data-status]');
        return;
      }
      if (e.target.matches('[data-lv]')) {
        const wasFull = mem.chp == null;
        mem.lv = Math.max(1, Math.min(100, Math.round(Number(e.target.value)) || 50));
        if (!wasFull) setHP(mem, curHP(mem));
        refreshCard(mem, '[data-lv]');
        renderParty();
        return;
      }
      if (e.target.matches('[data-chp]')) {
        setHP(mem, Number(e.target.value) || 0);
        refreshCard(mem, '[data-chp]');
        renderParty();
        return;
      }
      if (e.target.matches('[data-hp-range]')) {
        // Al soltar el deslizador: se guarda y se recalcula todo.
        setHP(mem, Number(e.target.value) || 0);
        refreshCard(mem, '[data-hp-range]');
        renderParty();
        return;
      }
      if (e.target.matches('[data-ev]')) {
        const i = Number(e.target.dataset.ev);
        const others = mem.ev.reduce((a, b, j) => (j === i ? a : a + b), 0);
        mem.ev[i] = Math.max(0, Math.min(252, 510 - others, Math.round(Number(e.target.value)) || 0));
        if (mem.chp != null) setHP(mem, curHP(mem));
        refreshCard(mem, `[data-ev="${i}"]`);
        return;
      }
      if (e.target.matches('[data-iv]')) {
        const i = Number(e.target.dataset.iv);
        mem.iv[i] = Math.max(0, Math.min(31, Math.round(Number(e.target.value)) || 0));
        refreshCard(mem, `[data-iv="${i}"]`);
        return;
      }
      if (e.target.matches('[data-nat]')) {
        mem.nat = e.target.value || null;
        refreshCard(mem, '[data-nat]');
      } else if (e.target.matches('[data-tera]')) {
        mem.tera = e.target.value || null;
        if (!mem.tera) teraView.delete(mem.uid);
        refreshCard(mem, '[data-tera]');
      } else if (e.target.matches('[data-tera-view]')) {
        if (e.target.checked) teraView.add(mem.uid);
        else teraView.delete(mem.uid);
        refreshCard(mem, '[data-tera-view]');
      }
    });

    // Mientras se arrastra la barra de PS, se actualizan número, porcentaje y color al momento.
    el.querySelector('[data-hp-range]').addEventListener('input', (e) => {
      const range = e.target;
      const max = Number(range.max) || 1;
      const cur = Number(range.value);
      const r = cur / max;
      range.style.setProperty('--p', `${(r * 100).toFixed(1)}%`);
      range.classList.remove('hp-g', 'hp-y', 'hp-r');
      range.classList.add(r > 0.5 ? 'hp-g' : r > 0.2 ? 'hp-y' : 'hp-r');
      range.setAttribute('aria-valuetext', `${cur} de ${max} PS`);
      el.querySelector('[data-chp]').value = cur;
      el.querySelector('.hp-num small').textContent = `${Math.round(r * 100)}%`;
    });

    el.querySelector('[data-eviv]').addEventListener('toggle', (e) => {
      if (e.target.open) evOpen.add(mem.uid);
      else evOpen.delete(mem.uid);
    });

    el.addEventListener('animationend', (e) => {
      if (e.animationName === 'pop-in') el.classList.remove('is-new');
      if (e.animationName === 'flash') el.classList.remove('flash');
    });

    return el;
  }

  function refreshCard(mem, focusSel) {
    save();
    const old = cardEls.get(mem.uid);
    const fresh = buildCard(mem);
    cardEls.set(mem.uid, fresh);
    if (old && old.isConnected) old.replaceWith(fresh);
    renderSummary();
    renderTabs();
    if (focusSel) focusQuietly(fresh.querySelector(focusSel));
  }

  /* ================================================================ Resumen del equipo */

  /** Clima y campo: los comparten los dos equipos. */
  function conditionsEl() {
    const sec = document.createElement('section');
    sec.className = 'conditions';
    const opts = (map, cur) => Object.entries(map).map(([k, n]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${n}</option>`).join('');
    sec.innerHTML = `
      <span class="cond-title">Condiciones del combate <small>(para los dos equipos)</small></span>
      <label class="cond-label">Clima
        <select class="select" data-weather><option value="">Ninguno</option>${opts(WEATHERS, state.cond.weather)}</select>
      </label>
      <label class="cond-label">Campo
        <select class="select" data-terrain><option value="">Ninguno</option>${opts(TERRAINS, state.cond.terrain)}</select>
      </label>`;
    sec.addEventListener('change', (e) => {
      if (e.target.matches('[data-weather]')) state.cond.weather = e.target.value;
      else if (e.target.matches('[data-terrain]')) state.cond.terrain = e.target.value;
      else return;
      const sel = e.target.matches('[data-weather]') ? '[data-weather]' : '[data-terrain]';
      save();
      cardEls.clear();
      renderAll();
      focusQuietly(teamEl.querySelector(sel));
    });
    return sec;
  }

  function summaryEl() {
    const list = team();
    const sec = document.createElement('section');
    sec.className = 'summary';
    sec.id = 'summary';
    if (!list.length) {
      sec.hidden = true;
      return sec;
    }
    const cells = ALL_TYPES.map((t) => {
      let weak = 0;
      let resist = 0;
      for (const mem of list) {
        const { m } = damageTaken(t, mem, false);
        if (m > 1) weak++;
        else if (m < 1) resist++;
      }
      const risk = weak >= 3 || (weak >= 2 && resist === 0);
      return `<div class="sum-cell${risk ? ' risk' : ''}" title="${risk ? 'Punto débil del equipo' : ''}">
        ${typeBadge(t, ' sm')}
        <span class="sum-n weak"><b>${weak}</b> débil${weak === 1 ? '' : 'es'}</span>
        <span class="sum-n res"><b>${resist}</b> resiste${resist === 1 ? '' : 'n'}</span>
      </div>`;
    }).join('');

    const covered = new Set();
    for (const mem of list) {
      for (const a of attackTypes(mem).types) {
        for (const t of ALL_TYPES) if (eff(a, [t]) > 1) covered.add(t);
      }
    }
    const uncovered = ALL_TYPES.filter((t) => !covered.has(t));
    const risky = ALL_TYPES.filter((t) => {
      const weak = list.filter((mem) => damageTaken(t, mem, false).m > 1).length;
      const resist = list.filter((mem) => damageTaken(t, mem, false).m < 1).length;
      return weak >= 3 || (weak >= 2 && resist === 0);
    });

    sec.innerHTML = `
      <div class="sum-head">
        <h2>${TABS[state.active].summary}</h2>
        <span class="sum-ko">${list.filter((m) => m.ko).length ? `Debilitados: <b>${list.filter((m) => m.ko).length} de ${list.length}</b>` : `Todos en pie (${list.length})`}</span>
        <button class="btn-reset" type="button" data-reset title="Restaura PP, PS, estados y cambios de características, y revive a todos los pokémon de este equipo">Nuevo combate: restaurar todo/button>
      </div>
      <div class="sum-lines">
        <p><span class="sum-label">Puntos débiles</span>${risky.length ? risky.map((t) => typeBadge(t, ' sm')).join('') : '<span class="none">Ninguno: cada tipo tiene a alguien que lo resiste.</span>'}</p>
        <p><span class="sum-label">Nadie le pega fuerte a</span>${uncovered.length ? uncovered.map((t) => typeBadge(t, ' sm')).join('') : '<span class="none">Ningún tipo: cubrís los 18.</span>'}</p>
      </div>
      <details class="sum-details">
        <summary>Ver cuántos son débiles y cuántos resisten cada tipo</summary>
        <div class="sum-grid">${cells}</div>
      </details>`;
    return sec;
  }

  function renderSummary() {
    const old = $('#summary');
    const open = old?.querySelector('details')?.open;
    const fresh = summaryEl();
    if (open) fresh.querySelector('details')?.setAttribute('open', '');
    if (old) old.replaceWith(fresh);
  }

  /* ================================================================ Pestañas y equipo */

  function renderTabs() {
    tabsEl.innerHTML = Object.entries(TABS).map(([key, tab]) => `
      <button class="tab" role="tab" type="button" data-tab="${key}" aria-selected="${state.active === key}">
        ${tab.label} <span class="tab-count">${state.teams[key].length}</span>
      </button>`).join('');
    document.body.dataset.tab = state.active;
  }

  function slotHP(mem) {
    const r = curHP(mem) / maxHP(mem);
    return `<span class="slot-hp"><i class="hp-${r > 0.5 ? 'g' : r > 0.2 ? 'y' : 'r'}" style="width:${(r * 100).toFixed(0)}%"></i></span>`;
  }

  function renderParty(justAddedUid) {
    const list = team();
    let html = '';
    for (let i = 0; i < MAX_TEAM; i++) {
      const mem = list[i];
      if (!mem) {
        html += '<button class="slot empty" type="button" data-empty aria-label="Hueco libre: añadir un pokémon" title="Hueco libre"></button>';
        continue;
      }
      const p = P.get(mem.pid);
      html += `<button class="slot${mem.uid === justAddedUid ? ' just-added' : ''}${mem.ko ? ' ko' : ''}" type="button" data-uid="${mem.uid}" draggable="true"
        style="--t1:${typeOf(p.t[0]).c}" aria-label="Ir a ${esc(p.n)}" title="${esc(p.n)}: ${curHP(mem)}/${maxHP(mem)} PS (arrastra para cambiar el orden)">${imgTag(p.id, 'mini', '', '')}${slotHP(mem)}</button>`;
    }
    html += `<span class="party-count" aria-label="${list.length} de ${MAX_TEAM} pokémon">${list.length}/${MAX_TEAM}</span>`;
    partyEl.innerHTML = html;
    partyEl.setAttribute('aria-label', TABS[state.active].label);
  }

  function renderTeam() {
    const list = team();
    for (const uid of [...cardEls.keys()]) {
      if (!list.some((m) => m.uid === uid)) cardEls.delete(uid);
    }
    const nodes = [conditionsEl(), summaryEl()];
    for (const mem of list) {
      let el = cardEls.get(mem.uid);
      if (!el) {
        el = buildCard(mem);
        cardEls.set(mem.uid, el);
      }
      nodes.push(el);
    }

    const tab = TABS[state.active];
    if (!list.length) {
      const empty = document.createElement('section');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <h2>${tab.emptyTitle}</h2>
        <p>${tab.emptyText}</p>
        <div class="suggestions">${SUGGESTED.filter((id) => P.has(id)).map((id) =>
          `<button class="suggestion" type="button" data-add="${id}">${imgTag(id, 'mini', '', '')}${esc(P.get(id).n)}</button>`).join('')}</div>`;
      nodes.push(empty);
    } else if (list.length < MAX_TEAM) {
      const left = MAX_TEAM - list.length;
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'add-slot';
      add.dataset.focusSearch = '';
      add.innerHTML = `Añadir otro pokémon <span>(${left === 1 ? 'queda 1 hueco' : `quedan ${left} huecos`})</span>`;
      nodes.push(add);
    }
    teamEl.replaceChildren(...nodes);

    // Las fichas reutilizadas actualizan su puesto y sus flechas.
    list.forEach((mem, i) => {
      const el = cardEls.get(mem.uid);
      el.querySelector('.order-pos').textContent = `Puesto ${i + 1} de ${list.length}`;
      el.querySelector('[data-move="-1"]').disabled = i === 0;
      el.querySelector('[data-move="1"]').disabled = i === list.length - 1;
    });
  }

  function updateAddState() {
    const full = team().length >= MAX_TEAM;
    addInput.disabled = full;
    addInput.placeholder = full ? 'Equipo completo. Quita un pokémon para añadir otro.' : TABS[state.active].placeholder;
  }

  function renderAll(justAddedUid) {
    renderTabs();
    renderParty(justAddedUid);
    renderTeam();
    updateAddState();
  }

  function switchTab(key) {
    if (key === state.active || !TABS[key]) return;
    state.active = key;
    cardEls.clear(); // las fichas dependen del otro equipo: se rehacen
    save();
    renderAll();
  }

  function scrollToCard(el) {
    el.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  function addPokemon(pid) {
    const list = team();
    if (list.length >= MAX_TEAM || !P.has(pid)) return;
    const p = P.get(pid);
    const firstAbility = (p.ab.find(([, hidden]) => !hidden) || p.ab[0] || [null])[0];
    const mem = {
      uid: newUid(), pid, ab: firstAbility, it: null, nat: null, tera: null,
      mv: [null, null, null, null], ko: false, ppu: [0, 0, 0, 0], st: '', stg: [0, 0, 0, 0, 0, 0, 0, 0], lv: 50, chp: null, ev: [0, 0, 0, 0, 0, 0], iv: [31, 31, 31, 31, 31, 31],
    };
    list.push(mem);
    save();
    const el = buildCard(mem);
    el.classList.add('is-new');
    cardEls.set(mem.uid, el);
    renderAll(mem.uid);
    scrollToCard(el);
  }

  function changePokemon(mem, pid) {
    const before = { pid: mem.pid, ab: mem.ab };
    const oldName = P.get(mem.pid).n;
    const np = P.get(pid);
    mem.pid = pid;
    // Mantiene la habilidad si el nuevo pokémon también la tiene; si no, pone su primera habilidad.
    if (!np.ab.some(([id]) => id === mem.ab)) {
      mem.ab = (np.ab.find(([, hidden]) => !hidden) || np.ab[0] || [null])[0];
    }
    rebuildAfterChange(mem.uid);
    toast(`Has cambiado a ${oldName} por ${np.n}. Se mantienen sus ataques y objeto.`, 'Deshacer', () => {
      mem.pid = before.pid;
      mem.ab = before.ab;
      rebuildAfterChange(mem.uid);
    });
  }

  function moveMember(uid, delta) {
    const list = team();
    const from = list.findIndex((m) => m.uid === uid);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    moveToIndex(uid, to);
    const btn = cardEls.get(uid)?.querySelector(`[data-move="${delta}"]:not([disabled])`)
      || cardEls.get(uid)?.querySelector('[data-move]:not([disabled])');
    focusQuietly(btn);
  }

  function moveToIndex(uid, to) {
    const list = team();
    const from = list.findIndex((m) => m.uid === uid);
    if (from < 0 || from === to) return;
    const [mem] = list.splice(from, 1);
    list.splice(to, 0, mem);
    rebuildAfterChange(uid);
  }

  /** Vuelve a pintar todo (las fichas muestran su puesto) y deja a la vista la ficha indicada. */
  function rebuildAfterChange(uid) {
    save();
    cardEls.clear();
    renderAll();
    const el = cardEls.get(uid);
    if (el) {
      scrollToCard(el);
      el.classList.add('flash');
    }
  }

  function removeMember(uid) {
    const list = team();
    const idx = list.findIndex((m) => m.uid === uid);
    if (idx < 0) return;
    const [mem] = list.splice(idx, 1);
    const tabKey = state.active;
    save();
    renderAll();
    const name = P.get(mem.pid).n;
    toast(`Has borrado a ${name}.`, 'Deshacer', () => {
      const target = state.teams[tabKey];
      if (target.length >= MAX_TEAM) {
        toast(`No hay hueco para volver a añadir a ${name}.`);
        return;
      }
      target.splice(Math.min(idx, target.length), 0, mem);
      save();
      cardEls.clear();
      renderAll();
      toast(`${name} ha vuelto.`);
    });
  }

  /* ================================================================ Buscador principal */

  makeCombo(addCombo, {
    search: (q) => {
      if (team().length >= MAX_TEAM || !norm(q)) return {};
      const items = searchPokemon(q);
      return { items, note: items.length ? null : `No hay ningún pokémon que coincida con «${q.trim()}».` };
    },
    render: pokemonOptionHTML,
    onPick: (p) => {
      addInput.value = '';
      addPokemon(p.id);
    },
  });

  /* ================================================================ Exportar / importar */

  function describe(list) {
    return list.map((m) => ({
      pokemon: P.get(m.pid).n,
      habilidad: m.ab != null ? A.get(m.ab).n : null,
      objeto: m.it != null ? I.get(m.it).n : null,
      naturaleza: m.nat,
      teratipo: m.tera ? typeOf(m.tera).n : null,
      movimientos: m.mv.map((id) => (id != null ? M.get(id).n : null)),
      pid: m.pid, ab: m.ab, it: m.it, nat: m.nat, tera: m.tera, mv: m.mv, ko: m.ko, ppu: m.ppu, st: m.st, stg: m.stg, nivel: m.lv, lv: m.lv, chp: m.chp, ev: m.ev, iv: m.iv,
    }));
  }

  function exportTeams() {
    if (!state.teams.mine.length && !state.teams.rival.length) {
      toast('Los dos equipos están vacíos. Añade algún pokémon antes de exportar.');
      return;
    }
    const data = { formato: 'equipos-pokemon', version: 2, equipo: describe(state.teams.mine), rival: describe(state.teams.rival) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'equipos-pokemon.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Equipos exportados en equipos-pokemon.json.');
  }

  function importTeams(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try { data = JSON.parse(reader.result); } catch { data = null; }
      const previous = { mine: state.teams.mine, rival: state.teams.rival };
      let msg = '';
      if (data && !Array.isArray(data) && Array.isArray(data.rival)) {
        state.teams.mine = sanitize(data.equipo);
        state.teams.rival = sanitize(data.rival);
        msg = `Importados: ${state.teams.mine.length} en tu equipo y ${state.teams.rival.length} en el rival.`;
      } else {
        const list = sanitize(Array.isArray(data) ? data : data?.equipo);
        if (list.length) {
          state.teams[state.active] = list;
          msg = `Importados ${list.length} pokémon en «${TABS[state.active].label}».`;
        }
      }
      if (!msg || (!state.teams.mine.length && !state.teams.rival.length)) {
        state.teams.mine = previous.mine;
        state.teams.rival = previous.rival;
        toast('Ese archivo no contiene un equipo válido. Usa un archivo creado con «Exportar».');
        return;
      }
      cardEls.clear();
      save();
      renderAll();
      toast(msg, 'Deshacer', () => {
        state.teams.mine = previous.mine;
        state.teams.rival = previous.rival;
        cardEls.clear();
        save();
        renderAll();
        toast('Has recuperado los equipos anteriores.');
      });
    };
    reader.readAsText(file);
  }

  $('#btn-export').addEventListener('click', exportTeams);
  $('#btn-import').addEventListener('click', () => $('#file-import').click());
  $('#file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importTeams(file);
    e.target.value = '';
  });

  /* ================================================================ Aviso flotante */

  let toastTimer;
  function toast(msg, actionLabel, action) {
    clearTimeout(toastTimer);
    toastEl.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
    if (actionLabel) {
      toastEl.querySelector('button').addEventListener('click', () => {
        toastEl.classList.remove('show');
        action();
      }, { once: true });
    }
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), actionLabel ? 6500 : 3500);
  }

  /* ================================================================ Eventos generales */

  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) switchTab(tab.dataset.tab);
  });
  tabsEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = state.active === 'mine' ? 'rival' : 'mine';
    switchTab(next);
    tabsEl.querySelector(`[data-tab="${next}"]`)?.focus();
  });

  partyEl.addEventListener('click', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot) return;
    if (slot.hasAttribute('data-empty')) {
      addInput.focus();
      return;
    }
    const el = cardEls.get(slot.dataset.uid);
    if (el) {
      scrollToCard(el);
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
  });

  // Arrastrar en la barra del equipo para cambiar el orden.
  let dragUid = null;
  partyEl.addEventListener('dragstart', (e) => {
    const slot = e.target.closest('.slot[data-uid]');
    if (!slot) return;
    dragUid = slot.dataset.uid;
    slot.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragUid);
  });
  partyEl.addEventListener('dragover', (e) => {
    const slot = e.target.closest('.slot[data-uid]');
    if (!dragUid || !slot) return;
    e.preventDefault();
    partyEl.querySelectorAll('.drop-target').forEach((s) => s.classList.remove('drop-target'));
    if (slot.dataset.uid !== dragUid) slot.classList.add('drop-target');
  });
  partyEl.addEventListener('drop', (e) => {
    const slot = e.target.closest('.slot[data-uid]');
    if (!dragUid || !slot) return;
    e.preventDefault();
    const to = team().findIndex((m) => m.uid === slot.dataset.uid);
    const uid = dragUid;
    dragUid = null;
    moveToIndex(uid, to);
  });
  partyEl.addEventListener('dragend', () => {
    dragUid = null;
    partyEl.querySelectorAll('.dragging, .drop-target').forEach((s) => s.classList.remove('dragging', 'drop-target'));
  });

  function newBattle() {
    const list = team();
    const before = list.map((m) => ({ ko: m.ko, ppu: [...m.ppu], st: m.st, chp: m.chp, stg: [...m.stg] }));
    list.forEach((m) => { m.ko = false; m.ppu = [0, 0, 0, 0]; m.st = ''; m.chp = null; m.stg = [0, 0, 0, 0, 0, 0, 0, 0]; });
    save();
    cardEls.clear();
    renderAll();
    toast('Combate reiniciado: todo restaurado.', 'Deshacer', () => {
      list.forEach((m, i) => { if (before[i]) Object.assign(m, before[i]); });
      save();
      cardEls.clear();
      renderAll();
    });
  }

  teamEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) {
      newBattle();
      return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      addPokemon(Number(add.dataset.add));
      return;
    }
    if (e.target.closest('[data-focus-search]')) {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      addInput.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    e.preventDefault();
    addInput.focus();
  });

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 4);
  }, { passive: true });

  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--head-h', header.offsetHeight + 'px');
  }).observe(header);

  renderAll();
})();
