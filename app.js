/* Parcelko – web: lišta, odhaľovanie sekcií a živá 3D mapa Brezno – Zadné Halny (skutočné údaje katastra a NLC). */
'use strict';

(function () {
  const lista = document.getElementById('lista');
  const naPosun = () => lista.classList.toggle('plna', window.scrollY > 40);
  window.addEventListener('scroll', naPosun, { passive: true });
  naPosun();

  // ponuka na mobile (pod 860 px): tlačidlo ☰ ukáže odkazy pod lištou; odkaz, Escape alebo ťuknutie mimo ju zavrie
  const tlPonuky = document.getElementById('ponuka-tlacidlo');
  if (tlPonuky) {
    const otvorena = () => lista.classList.contains('ponuka-otvorena');
    const ponuka = (zap) => { lista.classList.toggle('ponuka-otvorena', zap); tlPonuky.setAttribute('aria-expanded', String(zap)); };
    tlPonuky.addEventListener('click', () => ponuka(!otvorena()));
    lista.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', () => ponuka(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && otvorena()) { ponuka(false); tlPonuky.focus(); } });
    document.addEventListener('click', (e) => { if (otvorena() && !lista.contains(e.target)) ponuka(false); });
  }

  // jedno miesto: snímky z aplikácie sa striedajú samy, riadok legendy vyberie snímku (potom sa po 10 s striedajú ďalej)
  document.querySelectorAll('[data-striedaj]').forEach((m) => {
    const riadky = [...m.querySelectorAll('.volby-legenda li[data-i]')];
    const snimky = [...m.querySelectorAll('.telefon-snimky img')];
    const popis = m.querySelector('.miesto-popis');
    if (!riadky.length || riadky.length !== snimky.length) return;
    let i = 0, pauza = 0, vidno = !('IntersectionObserver' in window);
    const ukaz = (j) => {
      i = j;
      snimky.forEach((x, k) => x.classList.toggle('aktivna', k === j));
      riadky.forEach((r, k) => r.setAttribute('aria-pressed', String(k === j)));
      if (popis) popis.textContent = riadky[j].dataset.popis || '';
    };
    riadky.forEach((r, k) => {
      const vyber = () => { pauza = Date.now(); ukaz(k); };
      r.addEventListener('click', vyber);
      r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vyber(); } });
    });
    if (!vidno) new IntersectionObserver((z) => { vidno = z[0].isIntersecting; }, { threshold: 0.2 }).observe(m);
    setInterval(() => { if (vidno && !document.hidden && Date.now() - pauza > 10000) ukaz((i + 1) % snimky.length); }, 2800);
  });

  // sekcie sa plynulo ukážu pri posúvaní
  const odhal = document.querySelectorAll('.odhal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((zaznamy) => zaznamy.forEach((z) => {
      if (z.isIntersecting) { z.target.classList.add('viditelne'); io.unobserve(z.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    odhal.forEach((e) => io.observe(e));
  } else {
    odhal.forEach((e) => e.classList.add('viditelne'));
  }

  // snímka aplikácie, ktorá ešte nie je pripravená – rám s textom namiesto rozbitého obrázka
  document.querySelectorAll('.mobil img').forEach((img) => {
    const chyba = () => img.closest('.mobil').classList.add('chyba-snimky');
    img.addEventListener('error', chyba);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') chyba();
  });

  // kontaktný formulár – odoslanie bez opustenia stránky (FormSubmit, ako pri kubikovači)
  const formular = document.getElementById('formular');
  if (formular) formular.addEventListener('submit', async (e) => {
    e.preventDefault();
    const stav = document.getElementById('stav-formulara');
    const udaje = Object.fromEntries(new FormData(formular));
    if (udaje._honey) return;                                   // robot vyplnil skryté pole
    const tlacidlo = formular.querySelector('button[type="submit"]');
    tlacidlo.disabled = true;
    stav.textContent = 'Odosielam…';
    try {
      const r = await fetch('https://formsubmit.co/ajax/luberit@proton.me', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(udaje) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === 'false') throw new Error(j.message || String(r.status));
      formular.reset();
      stav.textContent = 'Ďakujeme! Správa bola odoslaná – ozveme sa spravidla do 24 hodín.';
    } catch (chyba) {
      stav.innerHTML = 'Odoslanie sa nepodarilo. Napíšte nám priamo na <a href="mailto:luberit@proton.me">luberit@proton.me</a>.';
    } finally {
      tlacidlo.disabled = false;
    }
  });

  // galéria obrazoviek: posúva sa sama (vidno, že je tam viac); zastaví ju len skutočné ťahanie alebo šípky, nie myš nad ňou
  const galeria = document.querySelector('.galeria');
  if (galeria) {
    const plynulo = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const obrazky = () => [...galeria.querySelectorAll('.mobil')];
    const aktualny = () => {
      const stred = galeria.scrollLeft + galeria.clientWidth / 2;
      let naj = 0, vzd = Infinity;
      obrazky().forEach((f, i) => { const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - stred); if (d < vzd) { vzd = d; naj = i; } });
      return naj;
    };
    const naObrazok = (i) => {
      const f = obrazky()[i];
      if (f) galeria.scrollTo({ left: f.offsetLeft + f.offsetWidth / 2 - galeria.clientWidth / 2, behavior: plynulo });
    };
    const posun = (smer) => {
      const n = obrazky().length, i = aktualny();
      const koniec = galeria.scrollLeft + galeria.clientWidth >= galeria.scrollWidth - 8;
      naObrazok(smer > 0 && koniec ? 0 : Math.max(0, Math.min(n - 1, i + smer)));
    };
    let pauzaDo = 0, viditelna = false;
    const zastavGaleriu = () => { pauzaDo = Date.now() + 8000; };
    galeria.addEventListener('pointerdown', zastavGaleriu, { passive: true });
    galeria.addEventListener('touchstart', zastavGaleriu, { passive: true });
    galeria.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) zastavGaleriu(); }, { passive: true });
    document.querySelectorAll('.galeria-sipka').forEach((b) => b.addEventListener('click', () => { zastavGaleriu(); posun(b.classList.contains('vpravo') ? 1 : -1); }));
    if ('IntersectionObserver' in window) new IntersectionObserver((z) => { viditelna = z[0].isIntersecting; }).observe(galeria);
    else viditelna = true;
    setInterval(() => { if (viditelna && !document.hidden && Date.now() > pauzaDo) posun(1); }, 2600);
  }

  // porovnanie: posúvač medzi „len lesná mapa“ a „s parcelami“ – kým je na obrazovke, sám sa posúva tam a späť stále dokola;
  // keď ho niekto potiahne, chvíľu počká a potom pokračuje
  const porovnanie = document.getElementById('porovnanie-obr');
  if (porovnanie) {
    const r = porovnanie.querySelector('input[type="range"]');
    let poloha = 50, viditelne = false, pauzaDo = 0, beh = 0;
    const nastav = (v) => { poloha = v; r.value = Math.round(v); porovnanie.style.setProperty('--p', v.toFixed(1)); };
    const pauza = () => { pauzaDo = performance.now() + 6000; };
    r.addEventListener('input', () => { pauza(); poloha = Number(r.value); porovnanie.style.setProperty('--p', r.value); });
    r.addEventListener('pointerdown', pauza);
    const ciele = [14, 86, 50];
    const spusti = () => {
      const id = ++beh;
      let i = 0;
      const dalsi = () => {
        if (id !== beh || !viditelne) return;
        if (performance.now() < pauzaDo) { setTimeout(dalsi, 400); return; }
        const od = poloha, po = ciele[i % ciele.length];
        const trvanie = 500 + 1300 * Math.abs(po - od) / 72, start = performance.now();
        const krok = (t) => {
          if (id !== beh || !viditelne) return;
          if (performance.now() < pauzaDo) { setTimeout(dalsi, 400); return; }
          const k = Math.min(1, (t - start) / trvanie), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          nastav(od + (po - od) * e);
          if (k < 1) requestAnimationFrame(krok); else { i++; setTimeout(dalsi, po === 50 ? 1600 : 1100); }
        };
        requestAnimationFrame(krok);
      };
      setTimeout(dalsi, 500);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((z) => {
        if (z[0].isIntersecting && !viditelne) { viditelne = true; spusti(); }
        else if (!z[0].isIntersecting) { viditelne = false; beh++; }
      }, { threshold: 0.35 }).observe(porovnanie);
    } else { viditelne = true; spusti(); }
  }

  // návod: kroky s obrazovkou v mobile – prepínajú sa samy (animácie bežia vždy), ťuknutím si vyberiete krok
  document.querySelectorAll('[data-navod]').forEach((navod) => {
    const kroky = [...navod.querySelectorAll('[data-krok]')];
    const obrazky = [...navod.querySelectorAll('.navod-mobil img')];
    // na mobile sa popis aktuálneho kroku ukáže priamo na obrazovke (zoznam krokov sú len bodky)
    const popisok = document.createElement('div');
    popisok.className = 'navod-popisok';
    popisok.setAttribute('aria-hidden', 'true');
    navod.querySelector('.navod-mobil').appendChild(popisok);
    const trvanie = 4200;
    navod.style.setProperty('--trvanie', `${trvanie}ms`);
    let aktualny = 0, pauzaDo = 0, viditelny = false, poslednaZmena = 0;
    const ukaz = (i) => {
      aktualny = (i + obrazky.length) % obrazky.length;
      obrazky.forEach((o, j) => o.classList.toggle('aktivny', j === aktualny));
      kroky.forEach((k, j) => k.setAttribute('aria-pressed', String(j === aktualny)));
      const k = kroky[aktualny];
      if (k) {
        popisok.innerHTML = k.innerHTML;
        popisok.classList.remove('novy'); void popisok.offsetWidth; popisok.classList.add('novy');
      }
      // ďalší obrázok sa načíta vopred, aby prechod nebol prázdny
      const dalsi = obrazky[(aktualny + 1) % obrazky.length];
      if (dalsi && dalsi.loading === 'lazy') dalsi.loading = 'eager';
      poslednaZmena = Date.now();
    };
    ukaz(0);
    kroky.forEach((k) => k.addEventListener('click', () => {
      pauzaDo = Date.now() + 12000; navod.classList.add('pozastavene'); ukaz(+k.dataset.krok);
    }));
    if ('IntersectionObserver' in window) new IntersectionObserver((z) => {
      const bol = viditelny; viditelny = z[0].isIntersecting;
      if (viditelny && !bol && Date.now() > pauzaDo) ukaz(aktualny);       // po návrate do obrazu beží krok odznova
    }, { threshold: 0.35 }).observe(navod);
    else viditelny = true;
    setInterval(() => {
      if (!viditelny || document.hidden) return;
      if (Date.now() < pauzaDo) return;
      if (navod.classList.contains('pozastavene')) { navod.classList.remove('pozastavene'); ukaz(aktualny + 1); return; }
      if (Date.now() - poslednaZmena >= trvanie) ukaz(aktualny + 1);
    }, 250);
  });

  // služba: „Chcem portfólio pozemkov na mieru“ predvyplní záujem a správu vo formulári
  document.querySelectorAll('[data-zaujem]').forEach((a) => a.addEventListener('click', () => {
    const vyber = document.querySelector('#formular select[name="Záujem"]');
    if (vyber) vyber.value = a.dataset.zaujem;
    const sprava = document.querySelector('#formular textarea[name="Správa"]');
    if (sprava && !sprava.value.trim()) {
      sprava.value = 'Dobrý deň, mám záujem o portfólio pozemkov na mieru.\nLicencia (mesiac / polrok / rok): \nMeno vlastníka (pri dedičstve poručiteľa): \nKatastrálne územia: \nČo potrebujem (farby, podiely, spoluvlastníci…): ';
    }
  }));

  mapa().catch((e) => { console.warn('mapa:', e); document.body.classList.add('bez-mapy'); });
})();

// ------------------------------------------------------------------ pomocné výpočty (malé územie – rovinný odhad stačí)
const cislo = (x, d = 0) => new Intl.NumberFormat('sk-SK', { maximumFractionDigits: d, minimumFractionDigits: d }).format(x);
// [lon, lat] → metre v miestnej rovine s polomermi krivosti elipsoidu GRS80 (plocha parcely sedí s elipsoidom na ~0,01 %)
function priemet(body) {
  const lat0 = body.reduce((s, b) => s + b[1], 0) / body.length * Math.PI / 180;
  const lon0 = body.reduce((s, b) => s + b[0], 0) / body.length;
  const a = 6378137, e2 = 0.00669438002290, w = Math.sqrt(1 - e2 * Math.sin(lat0) ** 2);
  const N = a / w, M = a * (1 - e2) / w ** 3;
  return body.map((b) => [(b[0] - lon0) * Math.PI / 180 * N * Math.cos(lat0), (b[1] * Math.PI / 180 - lat0) * M]);
}
function plocha(kruh) {
  const p = priemet(kruh);
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}
function dlzka(ciara) {
  const p = priemet(ciara);
  let s = 0;
  for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return s;
}
function vPolygone(b, kruh) {
  let v = false;
  for (let i = 0, j = kruh.length - 1; i < kruh.length; j = i++) {
    const [xi, yi] = kruh[i], [xj, yj] = kruh[j];
    if ((yi > b[1]) !== (yj > b[1]) && b[0] < (xj - xi) * (b[1] - yi) / (yj - yi) + xi) v = !v;
  }
  return v;
}
const vonkajsie = (g) => (g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]));
const textPlochy = (m2) => (m2 >= 10000 ? `${cislo(m2)} m² (${cislo(m2 / 10000, 2)} ha)` : `${cislo(m2)} m²`);
const prazdne = () => ({ type: 'FeatureCollection', features: [] });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ 3D mapa
async function mapa() {
  const el = document.getElementById('mapa3d');
  const maGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!window.maplibregl || !maGL) { document.body.classList.add('bez-mapy'); return; }

  const zaklad = new URL('.', window.location.href).href;
  const [info, parcely, lesy] = await Promise.all(['demo/ukazka.json', 'demo/parcely.geojson', 'demo/lesy.geojson']
    .map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); })));
  const moje = info.mojeParcely || [];
  lesy.features.forEach((f) => { const dc = parseInt(f.properties.porast, 10); f.properties.farba = Number.isFinite(dc) ? dc % 6 : 6; });
  const nazvyKu = { 806528: 'Brezno', 802689: 'Beňuš' };
  const male = window.matchMedia('(max-width: 760px)').matches;
  const pokojne = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [z, j, v, s] = info.obalka;
  const ORTO = 'https://zbgisws.skgeodesy.sk/zbgis_ortofoto_wms/service.svc/get?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=1&STYLES=' +
    '&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image%2Fjpeg';
  const sirka = (a, b) => ['interpolate', ['linear'], ['zoom'], 13, a, 18, b];
  const reg = (r) => ['==', ['get', 'r'], r];
  const pismo = ['Open Sans Semibold'];
  const TEREN = { source: 'dem', exaggeration: 1.35 };

  const map = new maplibregl.Map({
    container: el,
    style: {
      version: 8,
      glyphs: zaklad + 'vendor/fonty/{fontstack}/{range}.pbf',
      sources: {
        orto: { type: 'raster', tiles: [ORTO], tileSize: 256, maxzoom: 19 },
        // porastová mapa NLC (ako v aplikácii) – so súhlasom NLC; dlaždice priamo zo servera NLC
        porastova: { type: 'raster', tiles: ['https://gis.nlcsk.org/arcgis/rest/services/BackgroundMaps/Porastova_mapa_web/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18 },
        dem: { type: 'raster-dem', tiles: [zaklad + 'demo/teren/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, minzoom: 9, maxzoom: 12 },
        tien: { type: 'raster-dem', tiles: [zaklad + 'demo/teren/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, minzoom: 9, maxzoom: 12 },
        parcely: { type: 'geojson', data: parcely, generateId: true },
        lesy: { type: 'geojson', data: lesy, generateId: true },
        vyber: { type: 'geojson', data: prazdne() },
        rozmery: { type: 'geojson', data: prazdne() },
        meranie: { type: 'geojson', data: prazdne() },
        // poľnohospodárske vrstvy a poľovné revíry – snímka z otvorených služieb (demo/*.geojson), načítajú sa po zobrazení mapy
        diely: { type: 'geojson', data: prazdne() },
        uzivanie: { type: 'geojson', data: prazdne() },
        bpej: { type: 'geojson', data: prazdne() },
        prvky: { type: 'geojson', data: prazdne() },
        reviry: { type: 'geojson', data: prazdne() },
        'reviry-stitky': { type: 'geojson', data: prazdne() },
        'agro-vyber': { type: 'geojson', data: prazdne() },
        'agro-vyber-plocha': { type: 'geojson', data: prazdne() },
        bod: { type: 'geojson', data: prazdne() },
        portfolio: { type: 'geojson', data: prazdne() },
        'e-v-poraste': { type: 'geojson', data: prazdne() },
        navigacia: { type: 'geojson', data: prazdne() },
        'offline-maska': { type: 'geojson', data: prazdne() },
        'offline-ram': { type: 'geojson', data: prazdne() },
      },
      layers: [
        { id: 'pozadie', type: 'background', paint: { 'background-color': '#14241e' } },
        { id: 'tien', type: 'hillshade', source: 'tien', paint: { 'hillshade-exaggeration': 0.55, 'hillshade-shadow-color': '#04110c', 'hillshade-highlight-color': '#4f7a69', 'hillshade-accent-color': '#0b2019' } },
        { id: 'orto', type: 'raster', source: 'orto', paint: { 'raster-fade-duration': 250 } },
        { id: 'porastova', type: 'raster', source: 'porastova', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 250 } },
        // zlatá výplň kultúrnych dielov ako v ZBGIS, krajinné prvky; neviditeľné plochy BPEJ, užívania a revírov slúžia na ťuknutie
        { id: 'diely-vypln', type: 'fill', source: 'diely', layout: { visibility: 'none' }, paint: { 'fill-color': '#FFD580', 'fill-opacity': 0.4 } },
        { id: 'prvky-vypln', type: 'fill', source: 'prvky', layout: { visibility: 'none' }, paint: { 'fill-color': '#43A047', 'fill-opacity': 0.5 } },
        { id: 'bpej-plocha', type: 'fill', source: 'bpej', layout: { visibility: 'none' }, paint: { 'fill-color': '#FFD600', 'fill-opacity': 0 } },
        { id: 'uzivanie-plocha', type: 'fill', source: 'uzivanie', layout: { visibility: 'none' }, paint: { 'fill-color': '#E00000', 'fill-opacity': 0 } },
        { id: 'reviry-plocha', type: 'fill', source: 'reviry', layout: { visibility: 'none' }, paint: { 'fill-color': '#7B1FA2', 'fill-opacity': 0 } },
        { id: 'lesy-vypln', type: 'fill', source: 'lesy', paint: { 'fill-color': ['match', ['get', 'farba'],
          0, '#2f7d4f', 1, '#5aa35e', 2, '#86b04a', 3, '#3d8f80', 4, '#6f9f3e', 5, '#2c6e60', '#4f9d5a'], 'fill-opacity': 0.32 } },
        { id: 'lesy-obrys', type: 'line', source: 'lesy', paint: { 'line-color': '#9CF0CC', 'line-width': sirka(1, 2.6), 'line-opacity': 0.9 } },
        { id: 'reviry-tien', type: 'line', source: 'reviry', layout: { visibility: 'none' }, paint: { 'line-color': '#F3E5F5', 'line-width': sirka(4, 8), 'line-opacity': 0.35 } },
        { id: 'reviry-obrys', type: 'line', source: 'reviry', layout: { visibility: 'none' }, paint: { 'line-color': '#AB47BC', 'line-width': sirka(2.2, 4) } },
        { id: 'diely-obrys', type: 'line', source: 'diely', layout: { visibility: 'none' }, paint: { 'line-color': '#F57C00', 'line-width': sirka(1, 2.4) } },
        { id: 'prvky-obrys', type: 'line', source: 'prvky', layout: { visibility: 'none' }, paint: { 'line-color': '#1B5E20', 'line-width': sirka(0.6, 1.4) } },
        { id: 'uzivanie-obrys', type: 'line', source: 'uzivanie', layout: { visibility: 'none' }, paint: { 'line-color': '#FF1744', 'line-width': sirka(0.8, 2) } },
        { id: 'bpej-obrys', type: 'line', source: 'bpej', layout: { visibility: 'none' }, paint: { 'line-color': '#FFD600', 'line-width': sirka(1, 2.2), 'line-dasharray': [3, 2] } },
        { id: 'e-plocha', type: 'fill', source: 'parcely', filter: reg('E'), paint: { 'fill-color': '#FF8A00', 'fill-opacity': 0 } },
        { id: 'c-plocha', type: 'fill', source: 'parcely', filter: reg('C'), paint: { 'fill-color': '#FFD60A', 'fill-opacity': 0 } },
        { id: 'moje-plocha', type: 'fill', source: 'portfolio', paint: { 'fill-color': ['get', 'farba'], 'fill-opacity': 0.42 } },
        { id: 'e-obrys', type: 'line', source: 'parcely', filter: reg('E'), paint: { 'line-color': '#FF8A00', 'line-width': sirka(0.8, 2.4), 'line-dasharray': [2.2, 1.2] } },
        { id: 'c-obrys', type: 'line', source: 'parcely', filter: reg('C'), paint: { 'line-color': '#FFD60A', 'line-width': sirka(0.7, 2.6) } },
        { id: 'moje-obrys', type: 'line', source: 'portfolio', paint: { 'line-color': ['get', 'farba'], 'line-width': sirka(2, 4) } },
        { id: 'vyber-plocha', type: 'fill', source: 'vyber', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.22 } },
        { id: 'vyber-obrys', type: 'line', source: 'vyber', paint: { 'line-color': '#ffffff', 'line-width': 3.5 } },
        // vybraná plocha v mieste (ako v aplikácii): diel oranžovo, užívanie červeno, BPEJ žlto prerušovane, revír fialovo so žltou výplňou
        { id: 'e-v-poraste-plocha', type: 'fill', source: 'e-v-poraste', paint: { 'fill-color': '#FF8A00', 'fill-opacity': 0.4 } },
        { id: 'e-v-poraste-obrys', type: 'line', source: 'e-v-poraste', paint: { 'line-color': '#FF8A00', 'line-width': 3.2 } },
        { id: 'agro-plocha', type: 'fill', source: 'agro-vyber-plocha', paint: { 'fill-color': '#FFEB3B', 'fill-opacity': 0.35 } },
        { id: 'agro-tien', type: 'line', source: 'agro-vyber', paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 } },
        { id: 'agro-ciara', type: 'line', source: 'agro-vyber', filter: ['!=', ['get', 'typ'], 'BPEJ'],
          paint: { 'line-color': ['match', ['get', 'typ'], 'DIEL', '#F57C00', 'UZIVANIE', '#E00000', 'PRVOK', '#1B5E20', 'REVIR', '#7B1FA2', 'LES', '#2E7D32', '#ffffff'], 'line-width': 3.6 } },
        { id: 'agro-bpej', type: 'line', source: 'agro-vyber', filter: ['==', ['get', 'typ'], 'BPEJ'], paint: { 'line-color': '#C79A00', 'line-width': 3.6, 'line-dasharray': [2.2, 1.2] } },
        { id: 'rozmery-body', type: 'circle', source: 'rozmery', filter: ['==', ['geometry-type'], 'Point'],
          paint: { 'circle-radius': 5, 'circle-color': '#ffffff', 'circle-stroke-color': '#0E6B4F', 'circle-stroke-width': 2.5 } },
        { id: 'meranie-plocha', type: 'fill', source: 'meranie', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#2f8cff', 'fill-opacity': 0.28 } },
        { id: 'meranie-ciara', type: 'line', source: 'meranie', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#7cc0ff', 'line-width': 3 } },
        { id: 'meranie-body', type: 'circle', source: 'meranie', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': '#2f8cff', 'circle-stroke-width': 3 } },
        { id: 'diely-kody', type: 'symbol', source: 'diely', minzoom: 15.3, layout: { visibility: 'none', 'text-field': ['get', 'kod'], 'text-font': pismo,
          'text-size': ['interpolate', ['linear'], ['zoom'], 15.3, 10, 18, 14] }, paint: { 'text-color': '#FFB74D', 'text-halo-color': '#2a1400', 'text-halo-width': 1.4 } },
        { id: 'bpej-kody', type: 'symbol', source: 'bpej', minzoom: 16, layout: { visibility: 'none', 'text-field': ['get', 'kod'], 'text-font': pismo,
          'text-size': ['interpolate', ['linear'], ['zoom'], 16, 9.5, 18, 12] }, paint: { 'text-color': '#FFE082', 'text-halo-color': '#1d1600', 'text-halo-width': 1.3 } },
        { id: 'reviry-nazvy', type: 'symbol', source: 'reviry-stitky', layout: { visibility: 'none', 'text-field': ['concat', 'Revír ', ['get', 'nazov']], 'text-font': pismo,
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 17, 16], 'text-letter-spacing': 0.04 },
          paint: { 'text-color': '#F3E5F5', 'text-halo-color': '#4A148C', 'text-halo-width': 2 } },
        { id: 'nav-ciara-tien', type: 'line', source: 'navigacia', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.75 } },
        { id: 'nav-ciara', type: 'line', source: 'navigacia', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#2979FF', 'line-width': 4.5, 'line-dasharray': [1.4, 0.9] } },
        { id: 'nav-start-halo', type: 'circle', source: 'navigacia', filter: ['==', ['get', 'typ'], 'start'], paint: { 'circle-radius': 20, 'circle-color': '#2979FF', 'circle-opacity': 0.22 } },
        { id: 'nav-start', type: 'circle', source: 'navigacia', filter: ['==', ['get', 'typ'], 'start'], paint: { 'circle-radius': 8, 'circle-color': '#2979FF', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } },
        { id: 'nav-text', type: 'symbol', source: 'navigacia', filter: ['==', ['get', 'typ'], 'text'], layout: { 'text-field': ['get', 't'], 'text-font': pismo, 'text-size': 16,
          'text-allow-overlap': true, 'text-offset': [0, -1.1] }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#0D47A1', 'text-halo-width': 2.4 } },
        { id: 'bod-tien', type: 'circle', source: 'bod', paint: { 'circle-radius': 16, 'circle-color': '#ffffff', 'circle-opacity': 0.25 } },
        { id: 'bod-kruh', type: 'circle', source: 'bod', paint: { 'circle-radius': 7, 'circle-color': '#0E6B4F', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } },
        { id: 'lesy-cisla', type: 'symbol', source: 'lesy', minzoom: 14.6, layout: { 'text-field': ['get', 'porast'], 'text-font': pismo, 'text-size': 13 }, paint: { 'text-color': '#c8ffe9', 'text-halo-color': '#03100b', 'text-halo-width': 1.6 } },
        { id: 'c-cisla', type: 'symbol', source: 'parcely', minzoom: 16.4, filter: reg('C'), layout: { 'text-field': ['get', 'c'], 'text-font': pismo, 'text-size': 12 }, paint: { 'text-color': '#FFE45C', 'text-halo-color': '#1a1400', 'text-halo-width': 1.4 } },
        { id: 'e-cisla', type: 'symbol', source: 'parcely', minzoom: 16.9, filter: reg('E'), layout: { 'text-field': ['get', 'c'], 'text-font': pismo, 'text-size': 11 }, paint: { 'text-color': '#FFB56B', 'text-halo-color': '#1d0e00', 'text-halo-width': 1.4 } },
        { id: 'rozmery-strany', type: 'symbol', source: 'rozmery', filter: ['==', ['geometry-type'], 'LineString'],
          layout: { 'symbol-placement': 'line-center', 'text-field': ['get', 'd'], 'text-font': pismo, 'text-size': 13, 'text-keep-upright': true,
            'text-offset': [0, -0.8], 'text-allow-overlap': true },
          paint: { 'text-color': '#ffffff', 'text-halo-color': '#0a2e24', 'text-halo-width': 2 } },
        { id: 'rozmery-cisla', type: 'symbol', source: 'rozmery', filter: ['==', ['geometry-type'], 'Point'],
          layout: { 'text-field': ['get', 'n'], 'text-font': pismo, 'text-size': 11, 'text-offset': [0, -1.25], 'text-allow-overlap': true },
          paint: { 'text-color': '#c8ffe9', 'text-halo-color': '#03100b', 'text-halo-width': 1.6 } },
        // offline územie: všetko mimo rámika stmavne, rámik s rohmi na potiahnutie – ako v aplikácii
        { id: 'offline-maska', type: 'fill', source: 'offline-maska', paint: { 'fill-color': '#03110c', 'fill-opacity': 0.62 } },
        { id: 'offline-ram', type: 'line', source: 'offline-ram', filter: ['==', ['geometry-type'], 'LineString'],
          paint: { 'line-color': '#FFD60A', 'line-width': 3, 'line-dasharray': [2.4, 1.4] } },
        { id: 'offline-rohy', type: 'circle', source: 'offline-ram', filter: ['==', ['geometry-type'], 'Point'],
          paint: { 'circle-radius': 7, 'circle-color': '#FFD60A', 'circle-stroke-color': '#1b1400', 'circle-stroke-width': 2.4 } },
      ],
      sky: { 'sky-color': '#0b2a22', 'horizon-color': '#6f9e8e', 'fog-color': '#0b2a22', 'sky-horizon-blend': 0.55, 'horizon-fog-blend': 0.55, 'fog-ground-blend': 0.35 },
    },
    center: info.stred, zoom: male ? 15 : 15.6, pitch: 0, bearing: 0, maxPitch: 66,
    minZoom: 13.4, maxZoom: 19.4, maxBounds: [[z - 0.06, j - 0.035], [v + 0.06, s + 0.035]],
    cooperativeGestures: true, attributionControl: false, dragRotate: true,
    locale: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Mapu priblížite kolieskom so stlačeným Ctrl',
      'CooperativeGesturesHandler.MacHelpText': 'Mapu priblížite kolieskom so stlačeným ⌘',
      'CooperativeGesturesHandler.MobileHelpText': 'Mapu posúvajte dvoma prstami',
      'NavigationControl.ZoomIn': 'Priblížiť', 'NavigationControl.ZoomOut': 'Oddialiť', 'NavigationControl.ResetBearing': 'Otočiť na sever',
    },
  });
  if (!male) map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  window.parcelkoMapa = map;                                  // pre automatické testy webu
  window.parcelkoOkraj = () => okrajKarty();

  // ---------------------------------------------------------------- pomalé otáčanie, kým sa nikto nedotkne (a len keď je mapa vidieť)
  let zastav = () => {}, odloz = () => {};                   // prehliadku zastaví len „Prezerať sám“; dotyk ju len odloží (nižšie)
  // mapa sa ukáže až s načítaným terénom: výška pod kamerou sa určí z výšok terénu (inak by prvý pohľad bol z nesprávnej výšky)
  // na začiatku 2D ako v aplikácii; 3D terén (len ukážka na webe) zapne tlačidlo 3D
  const priprav = () => el.classList.add('pripravena');
  map.once('load', priprav);
  setTimeout(priprav, 5000);

  // ---------------------------------------------------------------- vrstvy
  const SKUPINY = {
    c: ['c-plocha', 'c-obrys', 'c-cisla'], e: ['e-plocha', 'e-obrys', 'e-cisla'], lesy: ['lesy-vypln', 'lesy-obrys', 'lesy-cisla'],
    moje: ['moje-plocha', 'moje-obrys'],
    bpej: ['bpej-plocha', 'bpej-obrys', 'bpej-kody'], diely: ['diely-vypln', 'diely-obrys', 'diely-kody', 'prvky-vypln', 'prvky-obrys'],
    uzivanie: ['uzivanie-plocha', 'uzivanie-obrys'], reviry: ['reviry-plocha', 'reviry-tien', 'reviry-obrys', 'reviry-nazvy'],
  };
  // podklad: ortofoto alebo porastová mapa NLC (jeden z nich)
  const tlacidlaPodkladu = document.querySelectorAll('.cip[data-podklad]');
  function podklad(id) {
    tlacidlaPodkladu.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.podklad === id)));
    map.setLayoutProperty('orto', 'visibility', id === 'orto' ? 'visible' : 'none');
    map.setLayoutProperty('porastova', 'visibility', id === 'porastova' ? 'visible' : 'none');
    // na porastovej mape sú porasty už vyfarbené – vlastná výplň by farby prekryla
    map.setPaintProperty('lesy-vypln', 'fill-opacity', id === 'porastova' ? 0 : 0.32);
  }
  tlacidlaPodkladu.forEach((b) => b.addEventListener('click', () => { odloz(); podklad(b.dataset.podklad); }));
  function vrstva(skupina, zap) {
    const b = document.querySelector(`.cip[data-vrstva="${skupina}"]`);
    if (b) b.setAttribute('aria-pressed', String(zap));
    SKUPINY[skupina].forEach((id) => map.setLayoutProperty(id, 'visibility', zap ? 'visible' : 'none'));
  }
  document.querySelectorAll('.cip[data-vrstva]').forEach((b) => b.addEventListener('click', () => {
    odloz();
    vrstva(b.dataset.vrstva, b.getAttribute('aria-pressed') !== 'true');
  }));

  const pohlad = document.getElementById('pohlad');
  // tlačidlo ako v aplikácii: nápis = režim, do ktorého sa prepne; zvýraznené = 3D zapnuté
  function nastavPohlad(tri, kamera) {
    pohlad.setAttribute('aria-pressed', String(tri));
    pohlad.querySelector('span').textContent = tri ? '2D' : '3D';
    if (tri) {
      map.setTerrain(TEREN); map.easeTo({ pitch: 60, bearing: -20, duration: 1200, ...kamera });
      napoveda.textContent = '3D terén je len ukážka na webe – v aplikácii tlačidlo 3D mapu iba nakloní.';
    }
    else { map.easeTo({ pitch: 0, bearing: 0, duration: 1100, ...kamera }); map.setTerrain(null); }
  }
  pohlad.addEventListener('click', () => { odloz(); nastavPohlad(pohlad.getAttribute('aria-pressed') !== 'true'); });

  // ---------------------------------------------------------------- údaje v mieste – ako panel v aplikácii: voľby C · E · BPEJ · Diel · Užívanie · Prvok · Revír · Porast
  const karta = document.getElementById('karta');
  const obsahKarty = document.getElementById('obsah-karty');
  const napoveda = document.getElementById('napoveda');
  const hero = el.closest('.hero');
  const AGRO = ['diely', 'uzivanie', 'bpej', 'prvky', 'reviry'];
  const agro = Object.fromEntries(AGRO.map((m) => [m, prazdne()]));
  const nacitaneAgro = Promise.all(AGRO.map((m) => fetch(`demo/${m}.geojson`).then((r) => r.json()).then((d) => { agro[m] = d; })))
    .then(() => {
      const nastav = () => {
        AGRO.forEach((m) => map.getSource(m).setData(agro[m]));
        // názov každého revíru raz – na mieste vypočítanom pri príprave údajov (vnútri revíru a v ukážke)
        map.getSource('reviry-stitky').setData({ type: 'FeatureCollection', features: agro.reviry.features.filter((f) => f.properties.stitok)
          .map((f) => ({ type: 'Feature', properties: { nazov: f.properties.nazov }, geometry: { type: 'Point', coordinates: f.properties.stitok } })) });
      };
      if (map.isStyleLoaded()) nastav(); else map.once('load', nastav);
    }).catch(() => {});
  let navCas = 0;
  let offlineCas = 0, offlineZnacka = null;
  const vycisti = () => {
    navCas = 0; offlineCas = 0;
    if (offlineZnacka) { offlineZnacka.remove(); offlineZnacka = null; }
    ['vyber', 'rozmery', 'agro-vyber', 'agro-vyber-plocha', 'bod', 'navigacia', 'e-v-poraste', 'offline-maska', 'offline-ram'].forEach((z) => map.getSource(z).setData(prazdne()));
  };
  const zavri = () => { karta.hidden = true; hero.classList.remove('karta-otvorena'); vycisti(); };
  document.getElementById('zavriet').addEventListener('click', zavri);

  // dĺžky strán a očíslované lomové body vybranej parcely – ako v geometrickom pláne
  function rozmery(f) {
    const prvky = [];
    let n = 0;
    vonkajsie(f.geometry).forEach((kruh) => {
      for (let i = 0; i < kruh.length - 1; i++) {
        const a = kruh[i], b = kruh[i + 1];
        prvky.push({ type: 'Feature', properties: { n: String(++n) }, geometry: { type: 'Point', coordinates: a } });
        const d = dlzka([a, b]);
        if (d >= 1.5) prvky.push({ type: 'Feature', properties: { d: `${cislo(d, 2)} m` }, geometry: { type: 'LineString', coordinates: [a, b] } });
      }
    });
    return { type: 'FeatureCollection', features: prvky };
  }

  // hľadanie v bode podľa údajov (rýchle obálky + bod v mnohouholníku s dierami)
  const obal = (f) => f.obal || (f.obal = vonkajsie(f.geometry).flat().reduce((b, c) => [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[0]), Math.max(b[3], c[1])], [180, 90, -180, -90]));
  const mnohouholniky = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
  const vPrvku = (b, f) => {
    const o = obal(f);
    if (b[0] < o[0] || b[0] > o[2] || b[1] < o[1] || b[1] > o[3]) return false;
    return mnohouholniky(f.geometry).some((p) => vPolygone(b, p[0]) && !p.slice(1).some((d) => vPolygone(b, d)));
  };
  const zapnuta = (sk) => map.getLayoutProperty(SKUPINY[sk][0], 'visibility') !== 'none';
  function vBode(b) {
    const z = [];
    if (zapnuta('c')) parcely.features.filter((f) => f.properties.r === 'C' && vPrvku(b, f)).forEach((f) => z.push({ typ: 'C', f }));
    if (zapnuta('e')) parcely.features.filter((f) => f.properties.r === 'E' && vPrvku(b, f)).forEach((f) => z.push({ typ: 'E', f }));
    const prvy = (m, typ, sk) => { if (!zapnuta(sk)) return; const f = agro[m].features.find((x) => vPrvku(b, x)); if (f) z.push({ typ, f }); };
    prvy('bpej', 'BPEJ', 'bpej'); prvy('diely', 'DIEL', 'diely'); prvy('uzivanie', 'UZIVANIE', 'uzivanie');
    prvy('prvky', 'PRVOK', 'diely'); prvy('reviry', 'REVIR', 'reviry');
    if (zapnuta('lesy')) { const f = lesy.features.find((x) => vPrvku(b, x)); if (f) z.push({ typ: 'LES', f }); }
    return z;
  }
  // po ťuknutí ako v aplikácii: prednostne BPEJ, potom diel, užívanie, prvok, revír (len zapnuté vrstvy), inak parcela
  const PREDNOST = ['BPEJ', 'DIEL', 'UZIVANIE', 'PRVOK', 'REVIR', 'C', 'E', 'LES'];
  const predvolena = (z) => z.indexOf(PREDNOST.map((t) => z.find((x) => x.typ === t)).find(Boolean));
  const nazovVolby = (x) => ({ C: `C ${x.f.properties.c}`, E: `E ${x.f.properties.c}`, BPEJ: `BPEJ ${x.f.properties.kod}`, DIEL: `Diel ${x.f.properties.kod}`,
    UZIVANIE: 'Hranica užívania', PRVOK: 'Krajinný prvok', REVIR: `Revír ${x.f.properties.nazov}`, LES: x.f.properties.porast ? `Porast ${x.f.properties.porast}` : 'Les' }[x.typ]);
  const TRIEDA = { C: 'c', E: 'e', BPEJ: 'bpej', DIEL: 'diel', UZIVANIE: 'uziv', PRVOK: 'prvok', REVIR: 'revir', LES: 'les' };
  const ha = (x) => (x != null ? `${cislo(x, 2)} ha` : '–');
  const datum = (d) => (d ? d.split('-').map(Number).reverse().join('. ') : null);
  const riadok = (dt, dd) => (dd ? `<dt>${dt}</dt><dd>${esc(dd)}</dd>` : '');

  // ukážka, ako Parcelko spracuje výpis z listu vlastníctva – MENÁ SÚ VYMYSLENÉ (len pre ukážku na webe)
  const UKAZKA_LV = {
    'E 15363': { lv: 2741, vlastnici: [['Ján Vzorový', 1, 2], ['Mária Vzorová, r. Ukážková', 1, 4], ['Peter Vzorový', 1, 4]] },
    'C 5669': { lv: 1906, vlastnici: [['Anna Príkladná', 3, 8], ['Jozef Príkladný', 3, 8], ['Eva Ukážková', 1, 4]] },
    'E 5946': { lv: 3318, vlastnici: [['Jozef Ukážkový', 2, 3], ['Helena Ukážková', 1, 3]] },
  };
  // export pre klienta a geodeta (scéna makléra) – formáty ako v aplikácii
  let ukazExport = false;
  const BLOK_EXPORT = `<div class="export-blok"><p class="lv-nadpis">Export pre klienta a geodeta</p><div class="export-cipy">
    <span>PDF / obrázok v mierke · A4, A3</span><span>DXF v S-JTSK</span><span>KMZ · KML</span><span>CSV · TXT súradnice</span><span>GPX · GeoJSON</span></div></div>`;
  function blokLv(p) {
    const lv = UKAZKA_LV[`${p.r} ${p.c}`];
    if (!lv) return '';
    const pocet = lv.vlastnici.length;
    return `<div class="lv-blok"><p class="lv-nadpis">Vlastníci – list vlastníctva č. ${lv.lv}<span class="ukazka-stitok">ukážka · údaje sú vymyslené</span></p>
      <p class="lv-pocet">${pocet} ${pocet === 1 ? 'vlastník' : pocet < 5 ? 'vlastníci' : 'vlastníkov'}</p>
      <ul class="lv-zoznam">${lv.vlastnici.map(([meno, a, b]) => `<li><span>${esc(meno)}</span><b>${a}/${b} · ${cislo(a / b * 100, a / b * 100 < 10 ? 2 : 1).replace(/,0$/, '')} %</b>
        <small>${p.v != null ? `${cislo(p.v * a / b)} m²` : ''}</small></li>`).join('')}</ul></div>`;
  }
  function blokParcely(f) {
    const p = f.properties;
    const kruhy = vonkajsie(f.geometry);
    const obvod = kruhy.reduce((s, k) => s + dlzka(k), 0);
    const body = kruhy.reduce((s, k) => s + k.length - 1, 0);
    const strany = kruhy.flatMap((k) => k.slice(1).map((b, i) => dlzka([k[i], b])));
    const mojaSkupina = portfolio.find((g) => g.f.includes(f));
    return `<h3><span class="stitok-reg ${p.r === 'C' ? 'c' : 'e'}">${p.r}</span>Parcela ${esc(p.c)}</h3>
      <p class="ku">k. ú. ${esc(nazvyKu[p.ku] || p.ku)}${p.r === 'E' ? ' · register E – pôvodný stav' : ''}${mojaSkupina ? ` · moje: ${esc(mojaSkupina.nazov)}` : ''}</p>
      <dl>${p.v != null ? `<dt>Výmera v katastri</dt><dd>${textPlochy(p.v)}</dd>` : ''}
        <dt>Plocha z hraníc (elipsoid)</dt><dd>${textPlochy(kruhy.reduce((s, k) => s + plocha(k.slice(0, -1)), 0))}</dd>
        <dt>Obvod</dt><dd>${cislo(obvod, 2)} m</dd><dt>Lomové body</dt><dd>${body}</dd></dl>
      <p class="strany">Strany ${cislo(Math.min(...strany), 2)} – ${cislo(Math.max(...strany), 2)} m · dĺžky a čísla bodov sú v mape</p>${blokLv(p)}${ukazExport ? BLOK_EXPORT : ''}`;
  }
  // parcely E, ktorých stred leží v poraste – pri ťažbe môžu patriť inému vlastníkovi
  function eVPoraste(f) {
    if (!zapnuta('e')) return [];
    return parcely.features.filter((x) => x.properties.r === 'E' && vPrvku(x.stred || (x.stred = vnutornyBod(x)), f));
  }
  // kto les obhospodaruje – ISLHP (NLC); na webe len právnické osoby, meno fyzickej osoby ukáže aplikácia
  function blokObhospodarovatel(p) {
    if (!p.obh || !p.obh.length) return '';
    return `<div class="obh-blok"><p class="lv-nadpis">Kto les obhospodaruje</p>
      <ul class="obh-zoznam">${p.obh.map((o) => `<li><span>${o.n ? esc(o.n) : 'fyzická osoba – meno v aplikácii'}</span><b>${o.p != null ? `${o.p} %` : ''}</b>
        <small>${[o.ico && `IČO ${o.ico}`, o.od && `od roku ${o.od}`].filter(Boolean).join(' · ')}</small></li>`).join('')}</ul>
      ${p.olh && p.olh.length ? `<p class="obh-olh">Odborný lesný hospodár: <b>${p.olh.map((o) => (o.n ? esc(o.n) : 'meno v aplikácii')).join(', ')}</b></p>` : ''}
      <p class="obh-zdroj">ISLHP · © NLC Zvolen</p></div>`;
  }
  function blokLesa(p, f) {
    return `<h3><span class="stitok-reg les">LES</span>${p.porast ? `Porast ${esc(p.porast)}` : 'Lesný pozemok'}</h3>
      <p class="ku">${esc([p.lhc && `LHC ${p.lhc}`, p.kat].filter(Boolean).join(' · ') || 'lesný porast NLC')}${p.lc ? `<br>lesný celok ${esc(p.lc)}` : ''}</p>
      <dl>${p.ha ? `<dt>Výmera porastu</dt><dd>${cislo(p.ha, 2)} ha</dd>` : ''}${riadok('Druh pozemku', p.drevina)}${riadok('Lesný hosp. plán', p.lhp)}</dl>
${blokObhospodarovatel(p)}${(() => {
        const e = f ? eVPoraste(f) : [];
        return e.length ? `<p class="pozor-e"><strong>V poraste ${e.length === 1 ? 'je 1 parcela' : `je ${e.length} ${e.length < 5 ? 'parcely' : 'parciel'}`} registra E</strong>
          – vyznačené oranžovou: ${e.map((x) => esc(x.properties.c)).join(', ')}. Môžu mať iného vlastníka než okolitý les – pred ťažbou ho overte
          z listu vlastníctva.</p>` : '';
      })()}`;
  }
  function blokBpej(p) {
    return `<h3><span class="stitok-reg bpej">BPEJ</span>${esc(p.kod)}</h3>
      <p class="ku">bonita pôdy · NPPC, informatívne</p>
      <dl>${p.skupina ? `<dt>Skupina kvality</dt><dd>${p.skupina} z 9</dd>` : ''}${riadok('Pôdny typ', p.typ)}${riadok('Pôda', p.vlastnosti)}${riadok('Klimatický región', p.klima)}</dl>
      <p class="strany">Skupina 1 je najkvalitnejšia pôda, 9 najmenej kvalitná.</p>`;
  }
  function blokDiel(p) {
    return `<h3><span class="stitok-reg diel">DIEL</span>Kultúrny diel ${esc(p.kod)}</h3>
      <p class="ku">register poľnohospodárskej pôdy LPIS${p.rok ? ` ${p.rok}` : ''} · MPRV SR, PPA</p>
      <dl>${riadok('Kultúra', p.kultura)}${p.ha != null ? `<dt>Výmera dielu</dt><dd>${ha(p.ha)}</dd>` : ''}${riadok('Lokalita', p.lokalita)}</dl>`;
  }
  function blokUzivanie(p, z) {
    const r = z.find((x) => x.typ === 'C' || x.typ === 'E');
    const n = info.najomne?.[r ? String(r.f.properties.ku) : '806528'];
    return `<h3><span class="stitok-reg uziv">UŽÍV.</span>Hranica užívania</h3>
      <p class="ku">kto tu hospodári · LPIS${p.rok ? ` ${p.rok}` : ''}</p>
      <dl><dt>Užívateľ</dt><dd>${p.uzivatel ? esc(p.uzivatel) : 'fyzická osoba – meno ukáže aplikácia'}</dd>${riadok('IČO', p.ico)}
        ${riadok(p.plodina ? 'Plodina' : 'Kultúra', p.plodina || p.kultura)}${p.ha != null ? `<dt>Deklarovaná výmera</dt><dd>${ha(p.ha)}</dd>` : ''}
        ${n ? `<dt>Obvyklé nájomné</dt><dd>${cislo(n.eurNaHa, 2)} €/ha ročne</dd>` : ''}</dl>
      ${n ? `<p class="strany">Obvyklé nájomné v k. ú. ${esc(n.ku)} (MPRV SR) – podklad pri dohode o nájme.</p>` : ''}`;
  }
  function blokPrvok(p) {
    return `<h3><span class="stitok-reg prvok">PRVOK</span>Krajinný prvok</h3>
      <p class="ku">vynechaný z výmery dielu · LPIS</p><dl>${riadok('Druh', p.druh)}${p.ha != null ? `<dt>Výmera</dt><dd>${cislo(p.ha * 10000, 0)} m²</dd>` : ''}</dl>`;
  }
  function blokRevir(p) {
    return `<h3><span class="stitok-reg revir">REVÍR</span>Poľovný revír ${esc(p.nazov)}</h3>
      <p class="ku">${esc([p.druh, p.okres && `okres ${p.okres}`].filter(Boolean).join(' · '))}</p>
      <dl>${riadok('Užívateľ', p.uzivatel)}${riadok('Užívanie od', datum(p.od))}${p.ha ? `<dt>Výmera revíru</dt><dd>${ha(p.ha)}</dd>` : ''}
        ${riadok('Poľovná oblasť', p.oblast)}${riadok('Rozhodnutie', p.rozhodnutie && p.rozhodnutie + (p.datum ? ` z ${datum(p.datum)}` : ''))}</dl>`;
  }
  const BLOKY = { C: (x) => blokParcely(x.f), E: (x) => blokParcely(x.f), BPEJ: (x) => blokBpej(x.f.properties), DIEL: (x) => blokDiel(x.f.properties),
    UZIVANIE: (x, z) => blokUzivanie(x.f.properties, z), PRVOK: (x) => blokPrvok(x.f.properties), REVIR: (x) => blokRevir(x.f.properties), LES: (x) => blokLesa(x.f.properties, x.f) };
  const V_APLIKACII = {
    C: 'V aplikácii navyše: vlastníci z listu vlastníctva, súradnice lomových bodov v S-JTSK, navigácia až na pozemok a export.',
    E: 'V aplikácii navyše: vlastníci z listu vlastníctva, súradnice lomových bodov v S-JTSK, navigácia až na pozemok a export.',
    BPEJ: 'V aplikácii pri každom ťuknutí; v stiahnutom území vidíte kódy BPEJ v mape aj bez signálu.',
    DIEL: 'V aplikácii aj zlatá výplň dielov s nastaviteľnou priehľadnosťou a výber dielu priamo v teréne.',
    UZIVANIE: 'V aplikácii aj meno užívateľa, ktorý je fyzická osoba, a výber celého bloku, ktorý obhospodaruje.',
    PRVOK: 'V aplikácii aj medze, priekopy a stromoradia vynechané z výmery dielov.',
    REVIR: 'V aplikácii aj výplň vybraného revíru a hranice revírov v teréne – aj offline.',
    LES: 'V aplikácii navyše: meno odborného lesného hospodára, kategória lesa, lesný celok, platnosť LHP a porastová mapa aj offline.',
  };

  // voľné pásmo mapy – podľa toho, čo mapu práve prekrýva: text úvodu, karta, okno prehliadky, tlačidlá vrstiev
  // (každý prvok zaberie tú stranu mapy, pri ktorej jej ubudne najmenej; prvky už ležiace v okraji sa preskočia)
  const PREKRYVY = ['#karta', '.prehliadka', '.hero-text', '.ovladanie', '.meranie-panel'];
  function okrajKarty() {
    const m = el.getBoundingClientRect();
    // na mobile väčší okraj: hore môže mapu pri posúvaní prekryť hlavička, po bokoch bod polohy s kruhom
    const o = male ? { top: 56, bottom: 14, left: 28, right: 28 } : { top: 14, bottom: 14, left: 14, right: 14 };
    for (const sel of PREKRYVY) {
      const x = document.querySelector(sel);
      if (!x || x.hidden) continue;
      const st = getComputedStyle(x);
      // display: contents = na mobile je text úvodu nad mapou a pod ňou, mapu neprekrýva
      if (st.display === 'none' || st.display === 'contents' || st.visibility === 'hidden' || (+st.opacity === 0 && st.pointerEvents === 'none')) continue;
      // pri texte úvodu aj písmená, ktoré presahujú jeho rámec (veľký nadpis)
      let r = x.getBoundingClientRect();
      if (sel === '.hero-text') {
        const rozsah = document.createRange(); rozsah.selectNodeContents(x);
        const t = rozsah.getBoundingClientRect();
        if (t.width && t.height) r = { left: Math.min(r.left, t.left), right: Math.max(r.right, t.right), top: Math.min(r.top, t.top), bottom: Math.max(r.bottom, t.bottom) };
      }
      const l = Math.max(r.left, m.left), p = Math.min(r.right, m.right), h = Math.max(r.top, m.top), d = Math.min(r.bottom, m.bottom);
      if (p - l < 4 || d - h < 4) continue;
      // už je v okraji mapy
      if (l >= m.right - o.right || p <= m.left + o.left || h >= m.bottom - o.bottom || d <= m.top + o.top) continue;
      // strana, pri ktorej mapa stratí najmenej plochy (text vľavo, karta vpravo, tlačidlá dole, okno prehliadky na mobile hore)
      const moznosti = [['left', p - m.left, m.height], ['right', m.right - l, m.height], ['top', d - m.top, m.width], ['bottom', m.bottom - h, m.width]];
      const [strana, hodnota] = moznosti.reduce((a, b) => (b[1] * b[2] < a[1] * a[2] ? b : a));
      o[strana] = Math.max(o[strana], Math.round(hodnota + 14));
    }
    // vždy ostane aspoň 220 × 150 px – inak sa okraje pomerne zmenšia
    const zmensi = (a, b, min, celok) => { const nad = a + b - (celok - min); if (nad > 0) { const k = (celok - min) / (a + b); return [Math.floor(a * k), Math.floor(b * k)]; } return [a, b]; };
    [o.left, o.right] = zmensi(o.left, o.right, 220, m.width);
    [o.top, o.bottom] = zmensi(o.top, o.bottom, 150, m.height);
    return o;
  }
  // pevný pohľad (stred a priblíženie) posunutý do voľného pásma – bez trvalého paddingu mapy
  const posunDoVolna = () => { const o = okrajKarty(); return [(o.left - o.right) / 2, (o.top - o.bottom) / 2]; };
  // celý prvok na obrazovke (parcela v detaile, veľké plochy v rámci ukážky)
  function kameraPre(f, maxZoom = 19.2) {
    const o = obal(f);
    const [z0, j0, v0, s0] = info.obalka;
    const b = [Math.max(o[0], z0 - 0.02), Math.max(o[1], j0 - 0.012), Math.min(o[2], v0 + 0.02), Math.min(o[3], s0 + 0.012)];
    const k = map.cameraForBounds([[b[0], b[1]], [b[2], b[3]]], { padding: okrajKarty(), bearing: 0, maxZoom });
    return k ? { center: k.center, zoom: Math.max(k.zoom, 13.4), offset: [0, 0] } : null;
  }

  // ukáže údaje v mieste: voľby nad kartou, vybraný prvok v karte a zvýraznený na mape (ostatné nie – ako v aplikácii)
  let polozky = [], bodMiesta = null, aktualna = 0;
  function ukazMiesto(z, i, kamera) {
    polozky = z;
    aktualna = i;
    const x = z[i];
    obsahKarty.innerHTML = `<p class="na-mieste">Na tomto mieste${z.length > 1 ? ` · ${z.length} ${z.length < 5 ? 'údaje' : 'údajov'}` : ''}</p>` +
      (z.length > 1 ? `<div class="registre">${z.map((y, j) => `<button type="button" class="${TRIEDA[y.typ]}" data-i="${j}" aria-pressed="${j === i}">${esc(nazovVolby(y))}</button>`).join('')}</div>` : '') +
      `<div class="vybrane">${BLOKY[x.typ](x, z)}</div><p class="v-aplikacii">${V_APLIKACII[x.typ]}</p>`;
    obsahKarty.querySelectorAll('.registre button').forEach((b) => b.addEventListener('click', () => { odloz(); ukazMiesto(polozky, +b.dataset.i, 'ak-treba'); }));
    karta.hidden = false;
    hero.classList.add('karta-otvorena');
    vycisti();
    if (bodMiesta) map.getSource('bod').setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: bodMiesta } }] });
    if (x.typ === 'C' || x.typ === 'E') {
      map.getSource('vyber').setData({ type: 'FeatureCollection', features: [x.f] });
      map.getSource('rozmery').setData(rozmery(x.f));
    } else {
      map.getSource('agro-vyber').setData({ type: 'FeatureCollection', features: mnohouholniky(x.f.geometry).flat()
        .map((k) => ({ type: 'Feature', properties: { typ: x.typ }, geometry: { type: 'LineString', coordinates: k } })) });
      if (x.typ === 'REVIR') map.getSource('agro-vyber-plocha').setData({ type: 'FeatureCollection', features: [x.f] });
      if (x.typ === 'LES') map.getSource('e-v-poraste').setData({ type: 'FeatureCollection', features: eVPoraste(x.f) });
    }
    if (kamera === 'ukazka') {
      // samočinné prepínanie volieb: mapa sa pohne, keď vybraná plocha nie je celá vidieť alebo je na obrazovke primalá
      const o = obal(x.f), hr = map.getBounds();
      const sirkaV = hr.getEast() - hr.getWest(), vyskaV = hr.getNorth() - hr.getSouth();
      const cela = o[0] >= hr.getWest() && o[2] <= hr.getEast() && o[1] >= hr.getSouth() && o[3] <= hr.getNorth();
      const nic = o[2] < hr.getWest() || o[0] > hr.getEast() || o[3] < hr.getSouth() || o[1] > hr.getNorth();
      const drobna = (o[2] - o[0]) < sirkaV / 10 && (o[3] - o[1]) < vyskaV / 10;
      // časť plochy je vidieť: celú ukáže, len keď sa zmestí bez veľkého oddialenia (revír či veľký diel ostanú vybrané na mieste)
      const zmesti = (o[2] - o[0]) * (o[3] - o[1]) <= 4 * sirkaV * vyskaV;
      if (nic || drobna || (!cela && zmesti)) { const k = kameraPre(x.f, 19); if (k) nastavPohlad(false, { ...k, duration: pokojne ? 0 : 900 }); }
    } else if (kamera === 'ak-treba') {
      // pri prepnutí voľby sa mapa pohne, len keď vybraná plocha nie je celá vidieť
      const o = obal(x.f), hr = map.getBounds();
      if (o[0] < hr.getWest() || o[2] > hr.getEast() || o[1] < hr.getSouth() || o[3] > hr.getNorth()) { const k = kameraPre(x.f, 18.6); if (k) nastavPohlad(false, k); }
    } else if (kamera) {
      const k = kamera === true ? kameraPre(x.f) : kamera.offset || !kamera.center ? kamera : { ...kamera, offset: posunDoVolna() };
      if (k) nastavPohlad(false, { ...k, duration: pokojne ? 0 : 1000 });
    }
  }
  // miesto podľa bodu (ťuknutie alebo ukážka): [typ] = ktorá voľba sa vyberie, [kamera] = true (celý prvok) alebo pevný pohľad
  function ukazBod(b, typ, kamera) {
    bodMiesta = b;
    const z = vBode(b);
    if (!z.length) { zavri(); return false; }
    let i = typ ? z.findIndex((x) => x.typ === typ) : -1;
    if (i < 0) i = predvolena(z);
    ukazMiesto(z, i, kamera);
    return true;
  }
  const parcela = (r, c) => parcely.features.find((x) => x.properties.r === r && x.properties.c === c);
  // bod vo vnútri parcely (ťažisko alebo bod medzi ťažiskom a vrcholmi)
  function vnutornyBod(f) {
    const k = vonkajsie(f.geometry)[0];
    const t = [k.reduce((a, c) => a + c[0], 0) / k.length, k.reduce((a, c) => a + c[1], 0) / k.length];
    if (vPrvku(t, f)) return t;
    for (const c of k) for (const q of [0.25, 0.5, 0.75]) { const b = [t[0] + (c[0] - t[0]) * q, t[1] + (c[1] - t[1]) * q]; if (vPrvku(b, f)) return b; }
    return k[0];
  }
  function najdiParcelu(r, cisloParcely, typ) {
    const f = parcela(r, cisloParcely);
    if (!f) return false;
    bodMiesta = vnutornyBod(f);
    const z = vBode(bodMiesta);
    let i = typ ? z.findIndex((x) => x.typ === typ) : z.indexOf(z.find((x) => x.f === f));
    if (i < 0) { z.unshift({ typ: r, f }); i = 0; }
    ukazMiesto(z, i, typ ? kameraPre(f) : true);
    napoveda.textContent = 'Celá parcela s dĺžkami strán a očíslovanými lomovými bodmi – ako v geometrickom pláne.';
    return true;
  }

  // ---------------------------------------------------------------- moje portfólio – parcely označené farbou a menom (ukážka)
  const portfolio = (info.portfolio || []).map((g) => ({ ...g, f: g.parcely.map(([r, c]) => parcela(r, c)).filter(Boolean) }));
  {
    const nastav = () => map.getSource('portfolio').setData({ type: 'FeatureCollection', features: portfolio.flatMap((g) =>
      g.f.map((f) => ({ type: 'Feature', properties: { farba: g.farba, skupina: g.nazov }, geometry: f.geometry }))) });
    if (map.isStyleLoaded()) nastav(); else map.once('load', nastav);
  }
  function kameraNaObal(o, maxZoom = 18, naStred = false) {
    const okraj = okrajKarty();
    // naStred: na počítači zvislo v strede výšky mapy (rovnaký okraj hore aj dole); na mobile v strede voľného miesta nad kartou
    if (naStred && !male) { const v = Math.max(okraj.top, okraj.bottom); okraj.top = v; okraj.bottom = v; }
    const k = map.cameraForBounds([[o[0], o[1]], [o[2], o[3]]], { padding: okraj, bearing: 0, maxZoom })
      || map.cameraForBounds([[o[0], o[1]], [o[2], o[3]]], { padding: 14, bearing: 0, maxZoom });
    if (k) nastavPohlad(false, { center: k.center, zoom: Math.max(k.zoom, 13.4), duration: pokojne ? 0 : 1000 });
  }
  const spojObal = (zoz) => zoz.reduce((b, c) => [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[2]), Math.max(b[3], c[3])], [180, 90, -180, -90]);
  function ukazPortfolio() {
    vycisti(); bodMiesta = null;
    const spolu = portfolio.reduce((n, g) => n + g.f.length, 0);
    const pocet = (n) => `${n} ${n === 1 ? 'parcela' : n < 5 ? 'parcely' : 'parciel'}`;
    obsahKarty.innerHTML = `<p class="na-mieste">Ukážkové portfólio · ${pocet(spolu)}</p><h3>Moje parcely</h3>
      <ul class="portfolio-legenda">${portfolio.map((g) => `<li><i style="background:${g.farba}"></i><b>${esc(g.nazov)}</b>
        <span>${pocet(g.f.length)} · ${textPlochy(g.f.reduce((sum, f) => sum + (f.properties.v || 0), 0))}</span></li>`).join('')}</ul>
      <p class="v-aplikacii">V aplikácii si parcely označíte farbou a menom – ťuknutím, zoznamom čísel z listu vlastníctva alebo z KMZ.
        Portfólio vám pripravíme aj na mieru.</p>`;
    karta.hidden = false;
    hero.classList.add('karta-otvorena');
    kameraNaObal(spojObal(portfolio.flatMap((g) => g.f).map(obal)), 16.5);
  }
  // navigácia k parcele: čiara od miesta, kde stojíte, k najbližšiemu bodu hranice – ako v aplikácii
  const SMERY = ['sever', 'severovýchod', 'východ', 'juhovýchod', 'juh', 'juhozápad', 'západ', 'severozápad'];
  function ukazNavigaciu(odkial, [r, c]) {
    const f = parcela(r, c);
    if (!f) return;
    vycisti(); bodMiesta = null;
    const kx = 111320 * Math.cos(odkial[1] * Math.PI / 180), ky = 110540;
    let naj = null;
    vonkajsie(f.geometry).forEach((k) => {
      for (let i = 0; i < k.length - 1; i++) {
        const ax = (k[i][0] - odkial[0]) * kx, ay = (k[i][1] - odkial[1]) * ky, bx = (k[i + 1][0] - odkial[0]) * kx, by = (k[i + 1][1] - odkial[1]) * ky;
        const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / ((dx * dx + dy * dy) || 1)));
        const px = ax + t * dx, py = ay + t * dy, d = Math.hypot(px, py);
        if (!naj || d < naj.d) naj = { d, b: [odkial[0] + px / kx, odkial[1] + py / ky] };
      }
    });
    const azimut = (Math.atan2((naj.b[0] - odkial[0]) * kx, (naj.b[1] - odkial[1]) * ky) * 180 / Math.PI + 360) % 360;
    const smer = SMERY[Math.round(azimut / 45) % 8];
    const vzd = dlzka([odkial, naj.b]);
    map.getSource('vyber').setData({ type: 'FeatureCollection', features: [f] });
    // čiara rastie od polohy k parcele
    const t0 = performance.now();
    navCas = t0;
    const krok = (t) => {
      if (navCas !== t0) return;
      const q = Math.min(1, Math.max(0, (t - t0) / 1800));
      const koniec = [odkial[0] + (naj.b[0] - odkial[0]) * q, odkial[1] + (naj.b[1] - odkial[1]) * q];
      map.getSource('navigacia').setData({ type: 'FeatureCollection', features: [
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [odkial, koniec] } },
        { type: 'Feature', properties: { typ: 'start' }, geometry: { type: 'Point', coordinates: odkial } },
        ...(q === 1 ? [{ type: 'Feature', properties: { typ: 'text', t: `${cislo(vzd)} m · ${smer}` },
          geometry: { type: 'Point', coordinates: [(odkial[0] + naj.b[0]) / 2, (odkial[1] + naj.b[1]) / 2] } }] : []),
      ] });
      if (q < 1) requestAnimationFrame(krok);
    };
    requestAnimationFrame(krok);
    obsahKarty.innerHTML = `<p class="na-mieste">Navigácia</p><h3><span class="stitok-reg ${r === 'C' ? 'c' : 'e'}">${r}</span>Cesta k parcele ${esc(c)}</h3>
      <p class="ku">z miesta, kde stojíte – podľa GPS</p>
      <dl><dt>Vzdialenosť</dt><dd>${cislo(vzd)} m</dd><dt>Smer</dt><dd>${smer} (${cislo(azimut)}°)</dd><dt>Na pozemku</dt><dd>zatiaľ nie</dd></dl>
      <p class="v-aplikacii">V aplikácii: čiara k najbližšiemu bodu hranice a smer podľa kompasu – keď na pozemok vstúpite, mobil zavibruje
        a ukáže „Ste na pozemku“.</p>`;
    karta.hidden = false;
    hero.classList.add('karta-otvorena');
    const o = obal(f);
    kameraNaObal([Math.min(o[0], odkial[0]), Math.min(o[1], odkial[1]), Math.max(o[2], odkial[0]), Math.max(o[3], odkial[1])], 17.6);
  }

  // ---------------------------------------------------------------- offline územie – ľubovoľné územie a vrstvy do mobilu (ako v aplikácii)
  // priemerná veľkosť dlaždice a rozsah priblížení podľa aplikácie (MapoveVrstvy.kt, sťahuje sa od priblíženia 12 po zvolenú podrobnosť)
  const OFFLINE_VRSTVY = [
    ['Ortofotomapa ZBGIS', null, 26000, 0, 19], ['Katastrálna mapa – parcely C', 'c', 14000, 0, 18], ['Mapa určeného operátu – parcely E', 'e', 9000, 0, 18],
    ['Porastová mapa NLC', null, 8000, 0, 18], ['Lesné porasty NLC', 'lesy', 6000, 13, 19], ['Poľovné revíry', 'reviry', 5000, 10, 19],
    ['Bonita pôdy – BPEJ', 'bpej', 12000, 14, 19], ['Kultúrne diely LPIS', 'diely', 27000, 13, 19], ['Hranice užívania', 'uzivanie', 10000, 13, 19],
  ];
  const OFFLINE_RAM = [19.6585, 48.8160, 19.6730, 48.8238];
  const OFFLINE_ZOOM = 18;
  const dlazdicX = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const dlazdicY = (lat, z) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z); };
  function pocetDlazdic(o, z0, z1) {
    let n = 0;
    for (let z = z0; z <= z1; z++) n += (dlazdicX(o[2], z) - dlazdicX(o[0], z) + 1) * (dlazdicY(o[1], z) - dlazdicY(o[3], z) + 1);
    return n;
  }
  const odhadVrstvy = ([, , priemer, minZ, maxZ]) => { const n = pocetDlazdic(OFFLINE_RAM, Math.max(12, minZ), Math.min(OFFLINE_ZOOM, maxZ)); return [n, n * priemer]; };
  const velkost = (b) => (b >= 1e9 ? `${cislo(b / 1e9, 1)} GB` : `${cislo(b / 1e6, b < 1e7 ? 1 : 0)} MB`);
  function ukazOffline() {
    vycisti(); bodMiesta = null;
    const t0 = performance.now();
    offlineCas = t0;
    const ide = () => offlineCas === t0;
    const [z0, j0, v0, s0] = OFFLINE_RAM;
    const sirkaM = dlzka([[z0, (j0 + s0) / 2], [v0, (j0 + s0) / 2]]), vyskaM = dlzka([[z0, j0], [z0, s0]]);
    const km = (m) => `${cislo(m / 1000, 1)} km`;
    obsahKarty.innerHTML = `<p class="na-mieste">Offline územie</p><h3>Zadné Halny – do mobilu</h3>
      <p class="ku">Rohy rámika potiahnete prstom – stiahne sa všetko vo vnútri</p>
      <dl><dt>Vyznačené územie</dt><dd>${km(sirkaM)} × ${km(vyskaM)}</dd><dt>Odhad</dt><dd class="off-odhad">–</dd></dl>
      <ul class="off-vrstvy">${OFFLINE_VRSTVY.map(([n]) => `<li><i aria-hidden="true"></i>${esc(n)}</li>`).join('')}</ul>
      <div class="off-priebeh" hidden><b></b></div><p class="off-stav">Podrobnosť 18 – detail s lomovými bodmi</p>
      <p class="v-aplikacii">V aplikácii: ľubovoľné územie, vrstvy aj podrobnosť; sťahovanie na pozadí, aktualizácia a prenos na ďalší mobil.
        Bez signálu máte mapy aj parcely C a E – hranice, čísla, výmery, navigáciu.</p>`;
    karta.hidden = false;
    hero.classList.add('karta-otvorena');
    kameraNaObal(OFFLINE_RAM, 16.2, true);
    // rámik rastie zo stredu
    const svet = [[z0 - 1, j0 - 1], [v0 + 1, j0 - 1], [v0 + 1, s0 + 1], [z0 - 1, s0 + 1], [z0 - 1, j0 - 1]];
    const rast = (t) => {
      if (!ide()) return;
      const q = Math.min(1, Math.max(0, (t - t0 - 500) / 1300)), e = 1 - (1 - q) ** 3;
      const cx = (z0 + v0) / 2, cy = (j0 + s0) / 2;
      const a = [cx + (z0 - cx) * e, cy + (j0 - cy) * e], b = [cx + (v0 - cx) * e, cy + (s0 - cy) * e];
      const k = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]], [a[0], a[1]]];
      map.getSource('offline-maska').setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [svet, [...k].reverse()] } });
      map.getSource('offline-ram').setData({ type: 'FeatureCollection', features: [
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: k } },
        ...k.slice(0, 4).map((c) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } }))] });
      if (q < 1) requestAnimationFrame(rast);
    };
    requestAnimationFrame(rast);
    // vrstvy sa zaškrtávajú jedna po druhej, odhad rastie; zapnú sa aj na mape
    let dlazdic = 0, bajtov = 0;
    const odhad = obsahKarty.querySelector('.off-odhad');
    OFFLINE_VRSTVY.forEach((v, i) => setTimeout(() => {
      if (!ide()) return;
      const [n, b] = odhadVrstvy(v);
      dlazdic += n; bajtov += b;
      obsahKarty.querySelectorAll('.off-vrstvy li')[i].classList.add('ano');
      odhad.textContent = `${cislo(dlazdic)} dlaždíc · ≈ ${velkost(bajtov)}`;
      if (v[1]) vrstva(v[1], true);
    }, 1900 + i * 520));
    // sťahovanie na pozadí
    const start = 1900 + OFFLINE_VRSTVY.length * 520 + 300, trvanie = 3200;
    setTimeout(() => {
      if (!ide()) return;
      const pr = obsahKarty.querySelector('.off-priebeh'), stav = obsahKarty.querySelector('.off-stav');
      pr.hidden = false;
      const t1 = performance.now();
      const krok = (t) => {
        if (!ide()) return;
        const q = Math.min(1, (t - t1) / trvanie);
        pr.firstElementChild.style.width = `${q * 100}%`;
        stav.textContent = q < 1 ? `Sťahujem na pozadí… ${Math.round(q * 100)} % · ${cislo(Math.round(dlazdic * q))} z ${cislo(dlazdic)} dlaždíc`
          : `Offline mapa je stiahnutá · ${velkost(bajtov)} · pripravené na použitie bez internetu`;
        stav.classList.toggle('hotovo', q === 1);
        if (q < 1) { requestAnimationFrame(krok); return; }
        const d = document.createElement('div');
        d.className = 'offline-znacka';
        d.innerHTML = '<span aria-hidden="true">✈</span> Offline mapa · bez signálu';
        offlineZnacka = new maplibregl.Marker({ element: d, anchor: 'bottom-left', offset: [4, -8] }).setLngLat([z0, s0]).addTo(map);
      };
      requestAnimationFrame(krok);
    }, start);
  }

  // ---------------------------------------------------------------- meranie
  const tlacidloMerania = document.getElementById('meranie');
  const panelMerania = document.getElementById('meranie-panel');
  let meria = false, body = [];
  function prekresliMeranie() {
    const f = body.map((b) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: b } }));
    if (body.length >= 2) f.unshift({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: body.length >= 3 ? [...body, body[0]] : body } });
    if (body.length >= 3) f.unshift({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...body, body[0]]] } });
    map.getSource('meranie').setData({ type: 'FeatureCollection', features: f });
    document.getElementById('m-obsah').textContent = body.length >= 3 ? textPlochy(plocha(body)) : '–';
    document.getElementById('m-obvod').textContent = body.length >= 2 ? `${cislo(dlzka(body.length >= 3 ? [...body, body[0]] : body), 1)} m` : '–';
  }
  tlacidloMerania.addEventListener('click', () => {
    meria = !meria;
    tlacidloMerania.setAttribute('aria-pressed', String(meria));
    panelMerania.hidden = !meria;
    hero.classList.toggle('meria', meria);
    if (meria) zastav(true); else poslednaAkcia = 0;
    if (meria) { zavri(); napoveda.textContent = 'Ťukajte do mapy – body tvoria plochu, obsah a obvod sa počítajú hneď.'; }
    else { body = []; prekresliMeranie(); }
    map.getCanvas().style.cursor = meria ? 'crosshair' : '';
  });
  document.getElementById('m-zmazat').addEventListener('click', () => { body = []; prekresliMeranie(); });

  map.on('click', (e) => {
    if (meria) { body.push([e.lngLat.lng, e.lngLat.lat]); prekresliMeranie(); return; }
    odloz();
    const b = [e.lngLat.lng, e.lngLat.lat];
    const z = vBode(b);
    if (!z.length) { zavri(); return; }
    bodMiesta = b;
    const i = predvolena(z);
    // parcela sa ukáže celá s rozmermi; pri BPEJ, dieli, užívaní a revíri ostane mapa na mieste
    ukazMiesto(z, i, z[i].typ === 'C' || z[i].typ === 'E');
    napoveda.textContent = z.length > 1 ? 'Voľby nad údajmi prepínajú, čo je vybrané – ako v aplikácii.' : 'Zapnite ďalšie vrstvy a na tom istom mieste uvidíte viac.';
  });
  document.getElementById('hladaj').addEventListener('submit', (e) => {
    e.preventDefault();
    zastav(true);
    const r = document.getElementById('h-reg').value;
    const c = document.getElementById('h-cislo').value.trim().replace(/\s+/g, '');
    if (!najdiParcelu(r, c)) napoveda.textContent = `Parcela ${r} ${c} v ukážke nie je – ukážka obsahuje len Zadné Halny (k. ú. Brezno). V aplikácii hľadáte na celom Slovensku.`;
  });

  // súradnice stredu mapy namiesto nápisu – ako na prístroji
  const sur = document.getElementById('suradnice');
  if (sur) {
    let cakaSur = false;
    const prepis = () => { cakaSur = false; const c = map.getCenter(); sur.children[0].textContent = `${cislo(c.lat, 4)}° s. š.`; sur.children[1].textContent = `${cislo(c.lng, 4)}° v. d.`; };
    map.on('move', () => { if (!cakaSur) { cakaSur = true; requestAnimationFrame(prepis); } });
  }

  // ---------------------------------------------------------------- prehliadka podľa toho, kto ste (stále beží; po dotyku sa na chvíľu zastaví)
  const LUKA = [19.6563, 48.8217];         // lúka Poľnohospodárskeho družstva Ďumbier: C 5669, E 15363, diel 9114/1, revír Čertovica
  const LES = [19.667927, 48.816685];      // porast 454 (LHC Brezno), parcela E 5946, revír Devana
  const POLE = [19.684159, 48.815221];     // orná pôda, parcela C 7415, diel 7209/1 (FAMAGO s.r.o., lucerna)
  const LUKA2 = [19.6644, 48.81619];       // lúka Roľníckeho družstva Ďumbier: C 7509, E 5817/1, diel 8206/3, revír Devana
  const PRED_LESOM = [19.66344, 48.816911]; // lúka pred lesom – štart navigácie k lesnej parcele E 5813/2 (len cez lúku a les)
  const VSETKO_VYP = { c: false, e: false, lesy: false, moje: false, bpej: false, diely: false, uzivanie: false, reviry: false };
  // volby = ktoré voľby sa v scéne samy prepínajú (bez nich všetky); trvanie = pevná dĺžka scény v ms
  const SCENY = [
    { rola: 0, nazov: 'Vlastník a dedič', popis: 'Parcela C aj E na jednom mieste: rozmery ako v geometrickom pláne, vlastníci a podiely z listu vlastníctva, bonita pôdy, kto na nej hospodári a nájomné.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, c: true, e: true, bpej: true, diely: true, uzivanie: true }, akcia: () => ukazBod(LUKA, 'E', true) },
    { rola: 0, nazov: 'Ako sa dostanete k parcele', popis: 'Parcelu nájdete podľa čísla alebo z listu vlastníctva – aj parcelu E, ktorú v teréne nevidno. Parcelko ukáže smer a vzdialenosť a navedie vás až na pozemok.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, e: true, lesy: true }, akcia: () => ukazNavigaciu(PRED_LESOM, ['E', '5813/2']), trvanie: 9000 },
    { rola: 6, nazov: 'Majiteľ lesa', popis: 'Vaša parcela E v lese: hranice v poraste, vlastníci, kto váš les obhospodaruje a kto je odborný lesný hospodár, lesný celok a revír.',
      podklad: 'porastova', vrstvy: { ...VSETKO_VYP, e: true, lesy: true, reviry: true }, akcia: () => ukazBod(LES, 'E', true), volby: ['E', 'LES', 'REVIR'] },
    { rola: 0, nazov: 'Moje portfólio', popis: 'Svoje pozemky si označíte farbou a menom – dom a záhrada, lúky, pole, les. Ručne, zoznamom čísel z listu vlastníctva alebo z KMZ.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, moje: true }, akcia: () => ukazPortfolio() },
    { rola: 1, nazov: 'Kupujúci a maklér', popis: 'Rozmery pozemku ako v geometrickom pláne – dĺžky strán a očíslované lomové body –, výmera, BPEJ a export pre klienta: PDF v mierke, DXF, KMZ či CSV.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, c: true, bpej: true }, akcia: () => najdiParcelu('C', '5401'), export: true, volby: ['C', 'BPEJ'] },
    { rola: 2, nazov: 'Majiteľ lúky a poľa', popis: 'Kto na vašom poli hospodári – firma aj s IČO a plodinou – a obvyklé nájomné v katastrálnom území. Viete, koho žiadať o nájom.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, c: true, e: true, diely: true, uzivanie: true }, akcia: () => ukazBod(POLE, 'UZIVANIE', true) },
    { rola: 3, nazov: 'Poľnohospodár', popis: 'Presné hranice kultúrnych dielov v teréne, BPEJ, krajinné prvky a hranice užívania susedov – so zlatou výplňou ako v ZBGIS.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, bpej: true, diely: true, uzivanie: true }, akcia: () => ukazBod(LUKA2, 'DIEL', true) },
    { rola: 4, nazov: 'Lesník a lesný hospodár', popis: 'Najprv len lesné dielce – potom naskočia parcely C a E. V poraste 454 ležia parcely E iných vlastníkov: pri ťažbe hneď vidíte, kde začína cudzia parcela.',
      podklad: 'porastova', vrstvy: { ...VSETKO_VYP, lesy: true }, akcia: () => ukazBod(LES, 'LES', true), volby: ['LES', 'E'],
      potom: { po: 3600, vrstvy: { c: true, e: true }, akcia: () => ukazBod(LES, 'LES') } },
    { rola: -1, nazov: 'Offline územie', popis: 'Vyznačíte si ľubovoľné územie a vyberiete vrstvy – Parcelko ich stiahne do mobilu. V teréne máte mapy aj parcely C a E aj bez signálu.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP }, akcia: () => ukazOffline(), trvanie: 14500 },
    { rola: 5, nazov: 'Poľovník', popis: 'Revíry Čertovica, Jasienok a Devana s užívateľom a rozhodnutím – na ortofotomape aj na porastovej mape NLC.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, reviry: true }, akcia: () => ukazBod(LUKA, 'REVIR', { center: [19.6668, 48.8236], zoom: male ? 13.4 : 13.85 }),
      potom: { po: 3800, podklad: 'porastova' } },
    { rola: -1, nazov: 'Les, revír a parcely naraz', popis: 'Lesné porasty NLC, poľovný revír a parcely C aj E na jednej mape. Na štátnych portáloch sú tieto údaje roztrúsené po rôznych mapách.',
      podklad: 'porastova', vrstvy: { ...VSETKO_VYP, c: true, e: true, lesy: true, reviry: true },
      akcia: () => ukazBod(LES, 'LES', { center: LES, zoom: male ? 15.4 : 15.9 }) },
    { rola: -1, nazov: 'Pôda, nájom a revír na jednom mieste', popis: 'Bonita pôdy, kultúrny diel, kto hospodári, obvyklé nájomné a poľovný revír – spolu s parcelami C a E, jedným ťuknutím.',
      podklad: 'orto', vrstvy: { ...VSETKO_VYP, c: true, e: true, bpej: true, diely: true, uzivanie: true, reviry: true }, akcia: () => ukazBod(LUKA, 'UZIVANIE', true) },
  ];
  // v každej scéne sa voľby v karte samy prepínajú (C → E → BPEJ → Diel → Užívanie → Revír …), scéna trvá podľa ich počtu
  const KROK_VOLBY = 2600;
  let casovacVolieb = null;
  function prepinajVolby(sc) {
    clearInterval(casovacVolieb);
    if (karta.hidden || polozky.length < 2 || !obsahKarty.querySelector('.registre')) return 0;
    const z = polozky, start = aktualna;
    // poradie volieb od vybranej ďalej (len povolené v scéne), nakoniec späť na prvú
    const poradie = [];
    for (let k = 1; k < z.length; k++) { const j = (start + k) % z.length; if (!sc.volby || sc.volby.includes(z[j].typ)) poradie.push(j); }
    if (sc.volby && poradie.length) poradie.push(start);
    let k = 0;
    casovacVolieb = setInterval(() => {
      if (!bezi || SCENY[scenaI] !== sc || polozky !== z || k >= poradie.length) { clearInterval(casovacVolieb); return; }
      ukazMiesto(z, poradie[k], 'ukazka');
      k++;
    }, KROK_VOLBY);
    return poradie.length + 1;
  }
  const roly = document.querySelectorAll('.som .rola');
  const boxPrehliadky = document.getElementById('prehliadka');
  const tlPrehliadky = document.getElementById('sc-tlacidlo');
  const bodky = document.getElementById('sc-bodky');
  bodky.innerHTML = SCENY.map(() => '<i></i>').join('');
  let bezi = true, casovac = null, casovacPotom = null, scenaI = -1, vidiet = true;          // prehliadka beží vždy sama (pri obmedzených animáciách bez preletov)
  hero.classList.add('prehliadka-bezi');                     // prehliadka beží od začiatku (výška karty, okno prehliadky)
  function ukazScenu(i) {
    scenaI = ((i % SCENY.length) + SCENY.length) % SCENY.length;
    const sc = SCENY[scenaI];
    document.getElementById('sc-nazov').textContent = sc.nazov;
    document.getElementById('sc-popis').textContent = sc.popis;
    bodky.querySelectorAll('i').forEach((b, j) => b.classList.toggle('aktivna', j === scenaI));
    roly.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.rola === sc.rola)));
    ukazExport = !!sc.export;
    podklad(sc.podklad);
    Object.entries(sc.vrstvy).forEach(([k, v]) => vrstva(k, v));
    clearTimeout(casovac); clearTimeout(casovacPotom); clearInterval(casovacVolieb);
    nacitaneAgro.then(() => {
      if (SCENY[scenaI] !== sc) return;
      sc.akcia();
      const n = bezi ? prepinajVolby(sc) : 0;
      const dalsia = (ms) => { clearTimeout(casovac); if (!stojScena) casovac = setTimeout(() => { if (bezi && vidiet) ukazScenu(scenaI + 1); }, ms); };
      if (sc.potom) {
        casovacPotom = setTimeout(() => {
          if (!bezi || SCENY[scenaI] !== sc) return;
          if (sc.potom.podklad) podklad(sc.potom.podklad);
          if (sc.potom.vrstvy) Object.entries(sc.potom.vrstvy).forEach(([k, v]) => vrstva(k, v));
          if (sc.potom.akcia) { sc.potom.akcia(); dalsia(Math.max(5000, prepinajVolby(sc) * KROK_VOLBY + 2000)); }
        }, sc.potom.po);
      }
      dalsia(sc.trvanie || Math.max(7500, n * KROK_VOLBY + 1800, sc.potom ? sc.potom.po + 6000 : 0));
    });
  }
  function nastavPrehliadku(zap) {
    bezi = zap;
    tlPrehliadky.textContent = zap ? 'Prezerať sám' : '▶ Prehliadka';
    tlPrehliadky.setAttribute('aria-pressed', String(zap));
    boxPrehliadky.classList.toggle('nahodna', !zap);
    hero.classList.toggle('prehliadka-bezi', zap);
    clearTimeout(casovac); clearTimeout(casovacPotom); clearInterval(casovacVolieb);
    if (zap) ukazScenu(scenaI + 1);
  }
  // prehliadka sa po dotyku len pozastaví – po chvíli bez akcie pokračuje sama (stále beží)
  // prehliadka beží stále – zastaví ju len „Prezerať sám“ (a nástroje Zmerať a Nájsť); po minúte bez dotyku sa rozbehne znova
  let poslednaAkcia = 0;
  tlPrehliadky.addEventListener('click', (e) => { e.stopPropagation(); poslednaAkcia = Date.now(); nastavPrehliadku(!bezi); });
  zastav = (uplne) => { poslednaAkcia = Date.now(); if (uplne && bezi) nastavPrehliadku(false); };
  // dotyk či posun mapy prehliadku nezastaví – ďalšia scéna príde o 10 s, aby si návštevník stihol pozrieť, čo ťukol
  odloz = () => {
    poslednaAkcia = Date.now();
    if (!bezi) return;
    clearInterval(casovacVolieb); clearTimeout(casovacPotom); clearTimeout(casovac);
    casovac = setTimeout(() => { if (bezi && vidiet) ukazScenu(scenaI + 1); }, 10000);
  };
  // „Som …“ – prehliadka sa nezastaví: preskočí na danú skupinu a beží ďalej sama (animácia hore beží stále)
  const spustOd = (rola) => { scenaI = SCENY.findIndex((sc) => sc.rola === rola) - 1; poslednaAkcia = Date.now(); nastavPrehliadku(true); };
  roly.forEach((b) => b.addEventListener('click', () => spustOd(+b.dataset.rola)));
  // „Ukázať na mape“ pri skupinách nižšie na stránke – presun k mape a ukážka pre danú skupinu
  document.querySelectorAll('.ukaz-rolu').forEach((b) => b.addEventListener('click', () => {
    hero.scrollIntoView({ behavior: pokojne ? 'auto' : 'smooth' });
    spustOd(+b.dataset.rola);
  }));
  setInterval(() => {
    if (!bezi && !meria && vidiet && !document.hidden && Date.now() - poslednaAkcia > 60000) { nastavPrehliadku(true); }
  }, 2000);
  ['mousedown', 'touchstart', 'wheel'].forEach((ev) => map.getCanvas().addEventListener(ev, () => odloz(), { passive: true }));
  if ('IntersectionObserver' in window) {
    // ďalšia scéna len po návrate mapy do obrazu (prvé hlásenie pri spustení scénu neskracuje)
    new IntersectionObserver((z) => {
      const predtym = vidiet;
      vidiet = z[0].isIntersecting;
      if (vidiet && !predtym && bezi && spustena && !stojScena) { clearTimeout(casovac); casovac = setTimeout(() => ukazScenu(scenaI + 1), 2000); }
    }).observe(el);
  }
  // prehliadka sa spustí raz – po načítaní mapy, najneskôr o 2,5 s (pomalé ortofoto ju nezdrží ani nevráti na začiatok)
  let spustena = false;
  const prvaScena = Math.max(0, +(new URLSearchParams(location.search).get('scena')) || 0);
  const stojScena = new URLSearchParams(location.search).has('stoj');          // len na testovanie snímkami
  const spusti = () => { if (spustena) return; spustena = true; if (bezi) ukazScenu(prvaScena); else nastavPrehliadku(false); };
  map.once('load', () => setTimeout(spusti, 300));
  setTimeout(spusti, 2500);

  const KLIKATELNE = ['c-plocha', 'e-plocha', 'bpej-plocha', 'diely-vypln', 'uzivanie-plocha', 'prvky-vypln', 'reviry-plocha', 'lesy-vypln'];
  map.on('mousemove', (e) => {
    if (meria) return;
    const vrstvy = KLIKATELNE.filter((id) => map.getLayoutProperty(id, 'visibility') !== 'none');
    map.getCanvas().style.cursor = map.queryRenderedFeatures(e.point, { layers: vrstvy }).length ? 'pointer' : '';
  });
}
