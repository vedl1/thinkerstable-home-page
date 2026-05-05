// Thinkers Table — The Ticker
// Vanilla JS: RSS wiring, horizontal stage navigation, mega menu, table cursor.

const PODCAST_RSS_URL = 'https://anchor.fm/s/bc46e210/podcast/rss';
const SPOTIFY_SHOW = 'https://open.spotify.com/show/2NO20Xotti7YZObF6ZxBA7';
const TOTAL_STAGES = 5;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE_POINTER = window.matchMedia('(pointer: coarse)').matches;
const SMALL_VIEWPORT = window.matchMedia('(max-width: 720px)').matches;

/* ---------- helpers (adapted from legacy) ---------- */
function stripHTML(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

function formatDate(s) {
  try {
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function parseDurationSeconds(content) {
  if (!content) return 0;
  const hms = content.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (hms) return (+hms[1]) * 3600 + (+hms[2]) * 60 + (+hms[3]);
  const ms = content.match(/^(\d{1,3}):(\d{2})$/m);
  if (ms) return (+ms[1]) * 60 + (+ms[2]);
  const min = content.match(/(\d+)\s*min/i);
  if (min) return (+min[1]) * 60;
  return 0;
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function extractEpisodeNumber(title) {
  const m = title?.match(/ep\.?\s*(\d+)/i);
  return m ? m[1].padStart(3, '0') : null;
}

function extractCoverImage(item) {
  if (item.thumbnail) return item.thumbnail;
  if (item.enclosure?.url && /\.(jpg|jpeg|png|webp)$/i.test(item.enclosure.url)) return item.enclosure.url;
  if (item.image?.url) return item.image.url;
  const c = item.description || item.content || '';
  const img = c.match(/<img[^>]+src="([^"]+)"/i);
  if (img) return img[1];
  return null;
}

function extractPullQuote(text) {
  if (!text) return null;
  const m = text.match(/[""]([^""]{20,180})[""]/) || text.match(/"([^"]{20,180})"/);
  return m ? m[1] : null;
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

/* ---------- RSS fetch ---------- */
async function fetchEpisodes() {
  try {
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(PODCAST_RSS_URL)}`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.status !== 'ok' || !Array.isArray(d.items)) throw new Error('rss bad status');
    return d.items.map((item, idx, arr) => {
      const desc = stripHTML(item.description || item.content || '');
      const epNum = extractEpisodeNumber(item.title) || String(arr.length - idx).padStart(3, '0');
      const seconds = parseDurationSeconds(item.itunes_duration || item.description || item.content);
      return {
        n: epNum,
        title: item.title || 'Untitled',
        guest: (item.title || '').split(/[—\-,]/)[0].trim() || item.title || 'Episode',
        description: desc,
        pull: extractPullQuote(desc) || truncate(desc, 140),
        date: formatDate(item.pubDate),
        rawDate: item.pubDate,
        durationSeconds: seconds,
        duration: formatDuration(seconds),
        link: item.link || SPOTIFY_SHOW,
        cover: extractCoverImage(item),
      };
    });
  } catch (err) {
    console.warn('[ticker] RSS fetch failed:', err);
    return null;
  }
}

/* ---------- DOM render ---------- */
function renderHero(eps) {
  if (!eps?.length) return;
  const latest = eps[0];
  const epsCount = document.getElementById('counter-eps');
  const hoursCount = document.getElementById('counter-hours');
  const corner = document.getElementById('hero-corner');
  const label = document.getElementById('hero-label');
  const media = document.getElementById('hero-media');
  const placeholder = document.getElementById('hero-placeholder');

  if (epsCount) epsCount.textContent = String(eps.length).padStart(3, '0');
  if (hoursCount) {
    const total = eps.reduce((sum, e) => sum + (e.durationSeconds || 0), 0);
    const hours = total / 3600;
    hoursCount.innerHTML = `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)}<span>h</span>`;
  }
  if (corner) corner.textContent = `EP · ${latest.n}`;
  if (label) label.textContent = truncate(latest.title.toLowerCase(), 60);
  if (media) media.href = latest.link;
  if (latest.cover && placeholder) {
    placeholder.classList.add('has-cover');
    const img = document.createElement('img');
    img.className = 'tt-cover';
    img.src = latest.cover;
    img.alt = '';
    img.loading = 'eager';
    placeholder.insertBefore(img, placeholder.firstChild);
  }
}

function renderEpisodes(eps) {
  const rail = document.getElementById('eps-rail');
  const metaLatest = document.getElementById('meta-latest');
  if (!rail) return;
  rail.innerHTML = '';
  if (!eps?.length) {
    rail.innerHTML = '<div class="ep-rail-loading mono-label">Episodes unavailable — check back soon.</div>';
    return;
  }
  if (metaLatest) metaLatest.textContent = eps[0].date || '—';

  eps.forEach((ep) => {
    const tile = document.createElement('a');
    tile.className = 'ep-tile';
    tile.href = ep.link;
    tile.target = '_blank';
    tile.rel = 'noopener noreferrer';
    tile.innerHTML = `
      <div class="ep-tile-media">
        <div class="tt-placeholder ${ep.cover ? 'has-cover' : ''}">
          ${ep.cover ? `<img class="tt-cover" src="${ep.cover}" alt="" loading="lazy"/>` : ''}
          <div class="tt-ph-corner">EP · ${ep.n}</div>
          <div class="tt-play"></div>
          <div class="tt-ph-label">${truncate(ep.guest.toLowerCase(), 40)}</div>
        </div>
        <div class="ep-tile-overlay">
          <div class="mono-label">${ep.duration} · ${ep.date}</div>
          <div class="ep-tile-play">
            <span>PLAY EPISODE</span>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 4-8 4z" fill="currentColor"/></svg>
          </div>
        </div>
      </div>
      <div class="ep-tile-body">
        <div class="ep-tile-topline">
          <span class="mono-label">EP · ${ep.n}</span>
          <span class="mono-label">${ep.duration}</span>
        </div>
        <h3 class="ep-tile-guest">${truncate(ep.title, 64)}</h3>
        <p class="ep-tile-pull">${ep.pull ? `"${ep.pull}"` : ''}</p>
        <div class="ep-tile-meta">
          <span>${ep.date}</span>
          <span>·</span>
          <span>video · audio</span>
        </div>
      </div>
    `;
    rail.appendChild(tile);
  });

  const end = document.createElement('div');
  end.className = 'ep-rail-end';
  end.innerHTML = `
    <div class="mono-label">End of rail</div>
    <a href="${SPOTIFY_SHOW}" class="serif-link" target="_blank" rel="noopener noreferrer">browse the archive →</a>
  `;
  rail.appendChild(end);
}

function renderTicker(eps) {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  let line;
  if (eps?.length) {
    const items = eps.slice(0, 5).map((ep, i) => {
      const tag = i === 0 ? 'NEW' : 'ON TAPE';
      return `◆ ${tag} · ep.${ep.n} · ${ep.title.toLowerCase()}`;
    });
    items.push(`◆ subscribe · the letter`);
    line = items.join('   ·   ');
  } else {
    line = '◆ thinkers table · stories from deeptech operators · subscribe to the letter';
  }
  track.innerHTML = `<span>${line}   ·   ${line}   ·   ${line}</span>`;
}

function renderLetterPreview(eps) {
  if (!eps?.length) return;
  const quoteEl = document.getElementById('letter-quote');
  const citeEl = document.getElementById('letter-cite');
  for (const ep of eps) {
    const q = extractPullQuote(ep.description);
    if (q) {
      if (quoteEl) quoteEl.textContent = `"${q}"`;
      if (citeEl) citeEl.textContent = `From Ep · ${ep.n}`;
      return;
    }
  }
}

/* ---------- Stage navigation ---------- */
function setupStages() {
  const track = document.getElementById('track');
  const stageCurrent = document.getElementById('stage-current');
  const stageTotal = document.getElementById('stage-total');
  const railButtons = document.querySelectorAll('#stage-rail button[data-goto]');
  if (stageTotal) stageTotal.textContent = String(TOTAL_STAGES).padStart(2, '0');
  let stage = 0;

  const goto = (i) => {
    const target = Math.max(0, Math.min(TOTAL_STAGES - 1, i));
    if (SMALL_VIEWPORT) {
      const sec = document.querySelector(`.stage[data-stage="${target}"]`);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (track) track.scrollTo({ left: target * window.innerWidth, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  };

  const updateStage = (i) => {
    stage = i;
    if (stageCurrent) stageCurrent.textContent = String(i + 1).padStart(2, '0');
    railButtons.forEach((b) => b.classList.toggle('on', Number(b.dataset.goto) === i));
  };

  if (track) {
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / window.innerWidth);
      if (i !== stage) updateStage(Math.max(0, Math.min(TOTAL_STAGES - 1, i)));
    }, { passive: true });

    if (!REDUCED_MOTION && !SMALL_VIEWPORT) {
      track.addEventListener('wheel', (e) => {
        const inner = e.target.closest && e.target.closest('.stage-eps-rail, .stage-table-rail');
        if (inner) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            inner.scrollBy({ left: e.deltaY * 1.4, behavior: 'auto' });
          }
          return;
        }
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          track.scrollBy({ left: e.deltaY * 3.4, behavior: 'auto' });
        }
      }, { passive: false });
    }
  }

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goto(Number(el.dataset.goto));
      closeMenu();
    });
  });

  if (!SMALL_VIEWPORT) {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goto(stage + 1);
      else if (e.key === 'ArrowLeft') goto(stage - 1);
    });
  }

  return { goto, updateStage };
}

/* ---------- Mega menu ---------- */
function openMenu() { document.getElementById('mega')?.classList.add('is-open'); }
function closeMenu() { document.getElementById('mega')?.classList.remove('is-open'); }

function setupMenu() {
  document.getElementById('brand-btn')?.addEventListener('click', openMenu);
  document.getElementById('menu-btn')?.addEventListener('click', openMenu);
  document.getElementById('mega-bg')?.addEventListener('click', closeMenu);
  document.getElementById('mega-close')?.addEventListener('click', closeMenu);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    else if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey) {
      const mega = document.getElementById('mega');
      if (mega) mega.classList.toggle('is-open');
    }
  });
}

/* ---------- Hero parallax ---------- */
function setupHeroParallax() {
  if (REDUCED_MOTION || COARSE_POINTER) return;
  const stage = document.getElementById('stage-opening');
  const media = document.getElementById('hero-media');
  if (!stage || !media) return;
  stage.addEventListener('mousemove', (e) => {
    const r = stage.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width;
    const my = (e.clientY - r.top) / r.height;
    media.style.transform = `translate(${(mx - 0.5) * 30}px, ${(my - 0.5) * 18}px)`;
  });
  stage.addEventListener('mouseleave', () => { media.style.transform = ''; });
}

/* ---------- Table-icon cursor ---------- */
function setupCursor() {
  if (COARSE_POINTER || SMALL_VIEWPORT) return;
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  document.documentElement.classList.add('tb-cursor-on');

  let raf = 0, lastX = 0, lastY = 0;
  const apply = () => {
    raf = 0;
    cursor.style.transform = `translate(${lastX}px, ${lastY}px)`;
  };

  window.addEventListener('mousemove', (e) => {
    lastX = e.clientX; lastY = e.clientY;
    cursor.classList.add('is-visible');
    const t = e.target;
    const interactive = t.closest && (t.closest('button, a, input, textarea, iframe'));
    const playable = t.closest && t.closest('.ep-tile, .stage-hero-media');
    if (playable) {
      cursor.classList.add('is-play');
      cursor.style.opacity = '1';
    } else if (interactive) {
      cursor.classList.remove('is-play');
      cursor.style.opacity = '0';
    } else {
      cursor.classList.remove('is-play');
      cursor.style.opacity = '1';
    }
    if (!raf) raf = requestAnimationFrame(apply);
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
}

/* ---------- Boot ---------- */
async function boot() {
  setupStages();
  setupMenu();
  setupHeroParallax();
  setupCursor();

  // Loading state for ticker
  renderTicker(null);

  const eps = await fetchEpisodes();
  if (eps && eps.length) {
    renderHero(eps);
    renderEpisodes(eps);
    renderTicker(eps);
    renderLetterPreview(eps);
  } else {
    renderEpisodes(null);
  }

  // Recompute on resize so scroll math stays sane
  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const track = document.getElementById('track');
      if (!track || SMALL_VIEWPORT) return;
      const stage = Number(document.getElementById('stage-current')?.textContent || 1) - 1;
      track.scrollTo({ left: stage * window.innerWidth, behavior: 'auto' });
    }, 150);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
