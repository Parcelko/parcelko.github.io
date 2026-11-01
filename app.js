/* Parcelko – web: lišta, odhaľovanie sekcií a živá 3D mapa Brezno – Zadné Halny (skutočné údaje katastra a NLC). */
'use strict';

(function () {
  const lista = document.getElementById('lista');
  const naPosun = () => lista.classList.toggle('plna', window.scrollY > 40);
  window.addEventListener('scroll', naPosun, { passive: true });
  naPosun();

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

  // porovnanie: posúvač medzi „len lesná mapa“ a „s parcelami“
  const porovnanie = document.getElementById('porovnanie-obr');
  if (porovnanie) {
    const r = porovnanie.querySelector('input[type="range"]');
    const nastav = (v) => { r.value = v; porovnanie.style.setProperty('--p', v); };
    let dotknute = false;
    r.addEventListener('input', () => { dotknute = true; porovnanie.style.setProperty('--p', r.value); });
    // pri prvom zobrazení sa posúvač raz sám prejde tam a späť – vidno, že sa dá ťahať
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((z) => {
        if (!z[0].isIntersecting) return;
        io.disconnect();
        const body = [50, 18, 82, 50], trvanie = 900;
        let i = 0;
        const dalsi = () => {
          if (dotknute || i >= body.length - 1) return;
          const od = body[i], po = body[i + 1], start = performance.now();
          const krok = (t) => {
            if (dotknute) return;
            const k = Math.min(1, (t - start) / trvanie), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
            nastav(Math.round(od + (po - od) * e));
            if (k < 1) requestAnimationFrame(krok); else { i++; setTimeout(dalsi, 350); }
          };
          requestAnimationFrame(krok);
        };
        setTimeout(dalsi, 600);
      }, { threshold: 0.6 });
      io.observe(porovnanie);
    }
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

  // služba: „Chcem portfólio na mieru“ predvyplní záujem a správu vo formulári
  document.querySelectorAll('[data-zaujem]').forEach((a) => a.addEventListener('click', () => {
    const vyber = document.querySelector('#formular select[name="Záujem"]');
    if (vyber) vyber.value = a.dataset.zaujem;
    const sprava = document.querySelector('#formular textarea[name="Správa"]');
    if (sprava && !sprava.value.trim()) {
      sprava.value = 'Dobrý deň, mám záujem o portfólio pozemkov na mieru.\nKatastrálne územia: \nČo potrebujem (farby, podiely, spoluvlastníci…): ';
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
      },
      layers: [
        { id: 'pozadie', type: 'background', paint: { 'background-color': '#14241e' } },
        { id: 'tien', type: 'hillshade', source: 'tien', paint: { 'hillshade-exaggeration': 0.55, 'hillshade-shadow-color': '#04110c', 'hillshade-highlight-color': '#4f7a69', 'hillshade-accent-color': '#0b2019' } },
        { id: 'orto', type: 'raster', source: 'orto', paint: { 'raster-fade-duration': 250 } },
        { id: 'porastova', type: 'raster', source: 'porastova', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 250 } },
        { id: 'lesy-vypln', type: 'fill', source: 'lesy', paint: { 'fill-color': ['match', ['get', 'farba'],
          0, '#2f7d4f', 1, '#5aa35e', 2, '#86b04a', 3, '#3d8f80', 4, '#6f9f3e', 5, '#2c6e60', '#4f9d5a'], 'fill-opacity': 0.32 } },
        { id: 'lesy-obrys', type: 'line', source: 'lesy', paint: { 'line-color': '#9CF0CC', 'line-width': sirka(1, 2.6), 'line-opacity': 0.9 } },
        { id: 'e-plocha', type: 'fill', source: 'parcely', filter: reg('E'), paint: { 'fill-color': '#FF8A00', 'fill-opacity': 0 } },
        { id: 'c-plocha', type: 'fill', source: 'parcely', filter: reg('C'), paint: { 'fill-color': '#FFD60A', 'fill-opacity': 0 } },
        { id: 'moje-plocha', type: 'fill', source: 'parcely', filter: ['all', reg('C'), ['in', ['get', 'c'], ['literal', moje]]], paint: { 'fill-color': '#FF4FD8', 'fill-opacity': 0.4 } },
        { id: 'e-obrys', type: 'line', source: 'parcely', filter: reg('E'), paint: { 'line-color': '#FF8A00', 'line-width': sirka(0.8, 2.4), 'line-dasharray': [2.2, 1.2] } },
        { id: 'c-obrys', type: 'line', source: 'parcely', filter: reg('C'), paint: { 'line-color': '#FFD60A', 'line-width': sirka(0.7, 2.6) } },
        { id: 'moje-obrys', type: 'line', source: 'parcely', filter: ['all', reg('C'), ['in', ['get', 'c'], ['literal', moje]]], paint: { 'line-color': '#FF8AE6', 'line-width': sirka(2, 4) } },
        { id: 'vyber-plocha', type: 'fill', source: 'vyber', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.22 } },
        { id: 'vyber-obrys', type: 'line', source: 'vyber', paint: { 'line-color': '#ffffff', 'line-width': 3.5 } },
        { id: 'rozmery-body', type: 'circle', source: 'rozmery', filter: ['==', ['geometry-type'], 'Point'],
          paint: { 'circle-radius': 5, 'circle-color': '#ffffff', 'circle-stroke-color': '#0E6B4F', 'circle-stroke-width': 2.5 } },
        { id: 'meranie-plocha', type: 'fill', source: 'meranie', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#2f8cff', 'fill-opacity': 0.28 } },
        { id: 'meranie-ciara', type: 'line', source: 'meranie', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#7cc0ff', 'line-width': 3 } },
        { id: 'meranie-body', type: 'circle', source: 'meranie', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': '#2f8cff', 'circle-stroke-width': 3 } },
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
      ],
      sky: { 'sky-color': '#0b2a22', 'horizon-color': '#6f9e8e', 'fog-color': '#0b2a22', 'sky-horizon-blend': 0.55, 'horizon-fog-blend': 0.55, 'fog-ground-blend': 0.35 },
    },
    center: info.stred, zoom: male ? 15 : 15.6, pitch: 0, bearing: 0, maxPitch: 66,
    minZoom: 13.4, maxZoom: 19.4, maxBounds: [[z - 0.03, j - 0.02], [v + 0.03, s + 0.02]],
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

  // ---------------------------------------------------------------- pomalé otáčanie, kým sa nikto nedotkne (a len keď je mapa vidieť)
  let zastav = () => {};                                     // prehliadku zastaví akákoľvek akcia návštevníka (nižšie)
  // mapa sa ukáže až s načítaným terénom: výška pod kamerou sa určí z výšok terénu (inak by prvý pohľad bol z nesprávnej výšky)
  // na začiatku 2D ako v aplikácii; 3D terén (len ukážka na webe) zapne tlačidlo 3D
  const priprav = () => el.classList.add('pripravena');
  map.once('load', priprav);
  setTimeout(priprav, 5000);

  // ---------------------------------------------------------------- vrstvy
  const SKUPINY = {
    c: ['c-plocha', 'c-obrys', 'c-cisla'], e: ['e-plocha', 'e-obrys', 'e-cisla'], lesy: ['lesy-vypln', 'lesy-obrys', 'lesy-cisla'],
    moje: ['moje-plocha', 'moje-obrys'],
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
  tlacidlaPodkladu.forEach((b) => b.addEventListener('click', () => { zastav(); podklad(b.dataset.podklad); }));
  function vrstva(skupina, zap) {
    const b = document.querySelector(`.cip[data-vrstva="${skupina}"]`);
    if (b) b.setAttribute('aria-pressed', String(zap));
    SKUPINY[skupina].forEach((id) => map.setLayoutProperty(id, 'visibility', zap ? 'visible' : 'none'));
  }
  document.querySelectorAll('.cip[data-vrstva]').forEach((b) => b.addEventListener('click', () => {
    zastav();
    vrstva(b.dataset.vrstva, b.getAttribute('aria-pressed') !== 'true');
  }));

  const pohlad = document.getElementById('pohlad');
  // tlačidlo ako v aplikácii: nápis = režim, do ktorého sa prepne; zvýraznené = 3D zapnuté
  function nastavPohlad(tri, kamera) {
    pohlad.setAttribute('aria-pressed', String(tri));
    pohlad.querySelector('span').textContent = tri ? '2D' : '3D';
    if (tri) { map.setTerrain(TEREN); map.easeTo({ pitch: 60, bearing: -20, duration: 1200, ...kamera }); }
    else { map.easeTo({ pitch: 0, bearing: 0, duration: 1100, ...kamera }); map.setTerrain(null); }
  }
  pohlad.addEventListener('click', () => { zastav(); nastavPohlad(pohlad.getAttribute('aria-pressed') !== 'true'); });

  // ---------------------------------------------------------------- karta parcely (ako panel v aplikácii: C aj E naraz + lesný porast)
  const karta = document.getElementById('karta');
  const obsahKarty = document.getElementById('obsah-karty');
  const napoveda = document.getElementById('napoveda');
  const hero = el.closest('.hero');
  const zavri = () => { karta.hidden = true; hero.classList.remove('karta-otvorena'); map.getSource('vyber').setData(prazdne()); map.getSource('rozmery').setData(prazdne()); };
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

  function blokParcely(f) {
    const p = f.properties;
    const kruhy = vonkajsie(f.geometry);
    const obvod = kruhy.reduce((s, k) => s + dlzka(k), 0);
    const body = kruhy.reduce((s, k) => s + k.length - 1, 0);
    const strany = kruhy.flatMap((k) => k.slice(1).map((b, i) => dlzka([k[i], b])));
    const mojeParcela = p.r === 'C' && moje.includes(p.c);
    return `<div>
      <h3><span class="stitok-reg ${p.r === 'C' ? 'c' : 'e'}">${p.r}</span>Parcela ${esc(p.c)}</h3>
      <p class="ku">k. ú. ${esc(nazvyKu[p.ku] || p.ku)}${p.r === 'E' ? ' · register E – pôvodný stav' : ''}${mojeParcela ? ' · moja parcela' : ''}</p>
      <dl>${p.v != null ? `<dt>Výmera v katastri</dt><dd>${textPlochy(p.v)}</dd>` : ''}
        <dt>Plocha z hraníc (elipsoid)</dt><dd>${textPlochy(kruhy.reduce((s, k) => s + plocha(k.slice(0, -1)), 0))}</dd>
        <dt>Obvod</dt><dd>${cislo(obvod, 2)} m</dd><dt>Lomové body</dt><dd>${body}</dd></dl>
      <p class="strany">Strany ${cislo(Math.min(...strany), 2)} – ${cislo(Math.max(...strany), 2)} m · dĺžky a čísla bodov sú v mape</p></div>`;
  }

  // vybraná parcela: karta, obrys, rozmery a celá parcela na obrazovke (zhora)
  let naMieste = [], lesNaMieste = [];
  function vyber(f, priblizit = true) {
    const ktora = naMieste.indexOf(f);
    obsahKarty.innerHTML =
      (naMieste.length > 1 ? `<div class="registre">${naMieste.map((x, i) =>
        `<button type="button" class="${x.properties.r === 'C' ? 'c' : 'e'}" data-i="${i}" aria-pressed="${i === ktora}">${x.properties.r} ${esc(x.properties.c)}</button>`).join('')}</div>` : '') +
      blokParcely(f) + lesNaMieste.slice(0, 1).map(blokLesa).join('') +
      '<p class="v-aplikacii">V aplikácii navyše: vlastníci z listu vlastníctva, súradnice lomových bodov v S-JTSK, poloha GPS a export.</p>';
    obsahKarty.querySelectorAll('.registre button').forEach((b) => b.addEventListener('click', () => vyber(naMieste[+b.dataset.i])));
    karta.hidden = false;
    hero.classList.add('karta-otvorena');
    map.getSource('vyber').setData({ type: 'FeatureCollection', features: [f] });
    map.getSource('rozmery').setData(rozmery(f));
    if (priblizit) {
      const sur = vonkajsie(f.geometry).flat();
      const obal = sur.reduce((b, c) => [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[0]), Math.max(b[3], c[1])], [180, 90, -180, -90]);
      const okraj = male ? { top: 70, bottom: 70, left: 30, right: 30 } : { top: 110, bottom: 110, left: 90, right: 440 };
      const kamera = map.cameraForBounds([[obal[0], obal[1]], [obal[2], obal[3]]], { padding: okraj, bearing: 0, maxZoom: 19.2 });
      if (kamera) nastavPohlad(false, { center: kamera.center, zoom: kamera.zoom });
    }
    napoveda.textContent = 'Celá parcela s dĺžkami strán a očíslovanými lomovými bodmi – ako v geometrickom pláne.';
  }

  function blokLesa(f) {
    const p = f.properties;
    return `<div class="blok"><h3><span class="stitok-reg les">LES</span>Porast ${esc(p.porast)}</h3>
      <p class="ku">${esc([p.lhc && `LHC ${p.lhc}`, p.kat].filter(Boolean).join(' · '))}</p>
      <dl>${p.ha ? `<dt>Výmera porastu</dt><dd>${cislo(p.ha, 2)} ha</dd>` : ''}${p.drevina ? `<dt>Hlavná drevina</dt><dd>${esc(p.drevina)}</dd>` : ''}</dl></div>`;
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
    zastav();
    if (meria) { zavri(); napoveda.textContent = 'Ťukajte do mapy – body tvoria plochu, obsah a obvod sa počítajú hneď.'; }
    else { body = []; prekresliMeranie(); }
    map.getCanvas().style.cursor = meria ? 'crosshair' : '';
  });
  document.getElementById('m-zmazat').addEventListener('click', () => { body = []; prekresliMeranie(); });

  map.on('click', (e) => {
    zastav();
    if (meria) { body.push([e.lngLat.lng, e.lngLat.lat]); prekresliMeranie(); return; }
    const vrstvy = ['c-plocha', 'e-plocha', 'lesy-vypln'].filter((id) => map.getLayoutProperty(id, 'visibility') !== 'none');
    const najdene = map.queryRenderedFeatures(e.point, { layers: vrstvy });
    const c = najdene.filter((f) => f.layer.id === 'c-plocha').map((f) => parcely.features[f.id]).filter(Boolean);
    const ep = najdene.filter((f) => f.layer.id === 'e-plocha').map((f) => parcely.features[f.id]).filter(Boolean);
    const l = najdene.filter((f) => f.layer.id === 'lesy-vypln').map((f) => lesy.features[f.id]).filter(Boolean);
    const jedinecne = (zoz) => zoz.filter((f, i) => zoz.indexOf(f) === i);
    naMieste = [...jedinecne(c), ...jedinecne(ep)];
    lesNaMieste = jedinecne(l);
    if (!naMieste.length && !lesNaMieste.length) { zavri(); return; }
    if (naMieste.length) { vyber(naMieste[0]); return; }
    obsahKarty.innerHTML = blokLesa(lesNaMieste[0]).replace('class="blok"', 'class=""');
    karta.hidden = false;
  });
  function najdiParcelu(r, cisloParcely) {
    const f = parcely.features.find((x) => x.properties.r === r && x.properties.c === cisloParcely);
    if (!f) return false;
    const sur = vonkajsie(f.geometry)[0];
    const stred = [sur.reduce((s, b) => s + b[0], 0) / sur.length, sur.reduce((s, b) => s + b[1], 0) / sur.length];
    // ostatné parcely v tom istom mieste (C pod parcelou E a naopak) – na prepínanie v karte
    const pod = parcely.features.filter((x) => x !== f && vonkajsie(x.geometry).some((k) => vPolygone(stred, k)));
    naMieste = [f, ...pod].sort((a, b) => a.properties.r.localeCompare(b.properties.r));
    lesNaMieste = lesy.features.filter((x) => vonkajsie(x.geometry).some((k) => vPolygone(stred, k)));
    vyber(f);
    return true;
  }
  document.getElementById('hladaj').addEventListener('submit', (e) => {
    e.preventDefault();
    zastav();
    const r = document.getElementById('h-reg').value;
    const c = document.getElementById('h-cislo').value.trim().replace(/\s+/g, '');
    if (!najdiParcelu(r, c)) napoveda.textContent = `Parcela ${r} ${c} v ukážke nie je – ukážka obsahuje len Zadné Halny (k. ú. Brezno). V aplikácii hľadáte na celom Slovensku.`;
  });
  document.querySelectorAll('[data-ukazka]').forEach((b) => b.addEventListener('click', () => {
    zastav();
    const u = b.dataset.ukazka;
    if (u === 'les') { podklad('porastova'); document.getElementById('h-reg').value = 'E'; document.getElementById('h-cislo').value = '15635'; najdiParcelu('E', '15635'); }
    else if (u === 'moje') { najdiParcelu('C', moje[0]); }
    else { zavri(); nastavPohlad(false, { center: info.stred, zoom: male ? 15 : 15.6 }); }
  }));

  // ---------------------------------------------------------------- automatická prehliadka (zastaví ju akákoľvek akcia návštevníka)
  const okolieE = (() => { const f = parcely.features.find((x) => x.properties.r === 'E' && x.properties.c === '15635'); return f ? vonkajsie(f.geometry)[0][0] : info.stred; })();
  const SCENY = [
    { nazov: 'Ortofoto a parcely registra C', popis: 'Súčasný stav katastra – hranice a čísla parciel priamo na leteckej snímke.',
      podklad: 'orto', vrstvy: { c: true, e: false, lesy: false, moje: false }, kamera: { center: info.stred, zoom: male ? 16 : 16.4 } },
    { nazov: '+ parcely registra E', popis: 'Pôvodné vlastníctvo – aj na lúkach a v lesoch, kde sú hranice vidieť najťažšie.',
      podklad: 'orto', vrstvy: { c: true, e: true, lesy: false, moje: false }, kamera: { center: okolieE, zoom: male ? 16 : 16.3 } },
    { nazov: 'Porastová mapa NLC', popis: 'Lesné porasty s číslami dielcov spolu s parcelami C a E – orientácia v lese aj pri ťažbe.',
      podklad: 'porastova', vrstvy: { c: true, e: true, lesy: true, moje: false }, kamera: { center: okolieE, zoom: male ? 15.4 : 15.8 } },
    { nazov: 'Ťuknutie na parcelu = rozmery', popis: 'Bez merania: dĺžky strán, lomové body, výmera a obvod parcely E 15635 hneď – ako v geometrickom pláne.',
      podklad: 'orto', vrstvy: { c: true, e: true, lesy: false, moje: false }, akcia: () => najdiParcelu('E', '15635') },
    { nazov: 'Moje parcely', popis: 'Svoje parcely si označíte farbou a menom – v teréne ich hneď nájdete podľa polohy.',
      podklad: 'orto', vrstvy: { c: true, e: false, lesy: false, moje: true }, akcia: () => najdiParcelu('C', moje[0]) },
  ];
  const boxPrehliadky = document.getElementById('prehliadka');
  const tlPrehliadky = document.getElementById('sc-tlacidlo');
  const bodky = document.getElementById('sc-bodky');
  bodky.innerHTML = SCENY.map(() => '<i></i>').join('');
  let bezi = true, casovac = null, scenaI = -1, vidiet = true;          // prehliadka beží vždy sama (pri obmedzených animáciách bez preletov)
  function ukazScenu(i) {
    scenaI = i % SCENY.length;
    const sc = SCENY[scenaI];
    document.getElementById('sc-nazov').textContent = sc.nazov;
    document.getElementById('sc-popis').textContent = sc.popis;
    bodky.querySelectorAll('i').forEach((b, j) => b.classList.toggle('aktivna', j === scenaI));
    podklad(sc.podklad);
    Object.entries(sc.vrstvy).forEach(([k, v]) => vrstva(k, v));
    if (sc.akcia) { sc.akcia(); }
    else {
      zavri();
      if (sc.tri) nastavPohlad(true, { ...sc.tri, duration: pokojne ? 0 : 1000 });
      else nastavPohlad(false, { ...sc.kamera, duration: pokojne ? 0 : 1000 });
    }
    clearTimeout(casovac);
    casovac = setTimeout(() => { if (bezi && vidiet) ukazScenu(scenaI + 1); }, 3000);
  }
  function nastavPrehliadku(zap) {
    bezi = zap;
    tlPrehliadky.textContent = zap ? 'Prezerať sám' : '▶ Prehliadka';
    tlPrehliadky.setAttribute('aria-pressed', String(zap));
    boxPrehliadky.classList.toggle('nahodna', !zap);
    clearTimeout(casovac);
    if (zap) ukazScenu(scenaI + 1);
  }
  // prehliadka sa po dotyku len pozastaví – po chvíli bez akcie pokračuje sama (stále beží)
  let poslednaAkcia = 0, rucne = false;
  tlPrehliadky.addEventListener('click', (e) => { e.stopPropagation(); rucne = bezi; poslednaAkcia = Date.now(); nastavPrehliadku(!bezi); });
  zastav = () => { poslednaAkcia = Date.now(); if (bezi) { rucne = false; nastavPrehliadku(false); } };
  setInterval(() => {
    if (!bezi && !meria && vidiet && !document.hidden && Date.now() - poslednaAkcia > (rucne ? 30000 : 12000)) { zavri(); nastavPrehliadku(true); }
  }, 2000);
  ['mousedown', 'touchstart', 'wheel'].forEach((ev) => map.getCanvas().addEventListener(ev, zastav, { passive: true }));
  document.querySelectorAll('.ovladanie .cip, .ukazky .cip, #hladaj button, #karta').forEach((x) => x.addEventListener('click', zastav, true));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((z) => {
      vidiet = z[0].isIntersecting;
      if (vidiet && bezi && spustena) { clearTimeout(casovac); casovac = setTimeout(() => ukazScenu(scenaI + 1), 2000); }
    }).observe(el);
  }
  // prehliadka sa spustí raz – po načítaní mapy, najneskôr o 2,5 s (pomalé ortofoto ju nezdrží ani nevráti na začiatok)
  let spustena = false;
  const spusti = () => { if (spustena) return; spustena = true; if (bezi) ukazScenu(0); else nastavPrehliadku(false); };
  map.once('load', () => setTimeout(spusti, 300));
  setTimeout(spusti, 2500);

  map.on('mousemove', (e) => {
    if (meria) return;
    const vrstvy = ['c-plocha', 'e-plocha'].filter((id) => map.getLayoutProperty(id, 'visibility') !== 'none');
    map.getCanvas().style.cursor = map.queryRenderedFeatures(e.point, { layers: vrstvy }).length ? 'pointer' : '';
  });
}
