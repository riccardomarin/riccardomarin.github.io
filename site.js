/* =====================================================================
   Riccardo Marin — website26
   This script reads the content folders (publications/, blog/, teaching/,
   bio.md) and fills the page. You should not need to edit it.
   ===================================================================== */

const ME = 'Riccardo Marin'; // highlighted in author lists

/* ---------- Theme: light by default, dark on request ---------- */
function isDark() { return document.documentElement.dataset.theme === 'dark'; }
function setupThemeToggle() {
  document.querySelectorAll('.theme-toggle').forEach(function (b) {
    b.textContent = isDark() ? 'light' : 'dark';
    b.addEventListener('click', function () {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      document.querySelectorAll('.theme-toggle').forEach(function (x) { x.textContent = next === 'dark' ? 'light' : 'dark'; });
    });
  });
}

/* ---------- Reading files ---------- */
async function fetchText(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) { const err = new Error(path + ': ' + r.status); err.status = r.status; throw err; }
  return (await r.text()).replace(/\r\n?/g, '\n');
}

// Lines of list.txt, without blanks and # comments.
async function readList(folder) {
  const txt = await fetchText(folder + '/list.txt');
  return txt.split('\n').map(function (l) { return l.trim().replace(/\.md$/, ''); })
    .filter(function (l) { return l && !l.startsWith('#'); });
}

// Splits a file into its header (between the two --- lines) and its body.
// Header lines are "key: value"; a key with an empty value followed by
// indented "name: value" lines becomes a small list (used for links and terms).
function parse(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (!m) return { meta: meta, body: text.trim() };
  let group = null;
  m[1].split('\n').forEach(function (line) {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const sub = line.match(/^\s+(.+?):\s+(.*)$/);
    if (sub && group) {
      if (!Array.isArray(meta[group])) meta[group] = [];
      meta[group].push([sub[1].trim(), sub[2].trim()]);
      return;
    }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) return;
    meta[kv[1]] = kv[2].trim();
    group = kv[2].trim() === '' ? kv[1] : null;
  });
  return { meta: meta, body: m[2].trim() };
}

// Each name in list.txt is either a file (folder/name.md) or, when `file` is given,
// a subfolder (folder/name/file). Missing entries are skipped with a console warning.
// item.base is the folder that the entry's own paths (media, bibtex) are relative to.
async function readFolder(folder, file) {
  const names = await readList(folder);
  const items = await Promise.all(names.map(async function (name) {
    try {
      const base = file ? folder + '/' + name : folder;
      const item = parse(await fetchText(file ? base + '/' + file : base + '/' + name + '.md'));
      item.name = name;
      item.base = base;
      return item;
    } catch (e) { console.warn('Skipped', folder + '/' + name + '.md', e); return null; }
  }));
  return items.filter(Boolean);
}

// Bilingual posts: English first, then the Italian original after a line "<!-- italiano -->".
function splitLanguages(body) {
  const parts = body.split(/^<!--\s*italiano\s*-->\s*$/m);
  return { en: parts[0].trim(), it: (parts[1] || '').trim() };
}

/* ---------- Small helpers ---------- */
function md(text) { return window.marked ? marked.parse(text) : '<p>' + text + '</p>'; }
function mdInline(text) { return window.marked ? marked.parseInline(text) : text; }

// Paths in a content file are relative to its folder, unless they are full URLs.
function resolve(folder, path) {
  return /^(https?:)?\/\//.test(path) || path.startsWith('/') || path.startsWith('mailto:') ? path : folder + '/' + path;
}

function formatDate(iso, lang) {
  const p = iso.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Typographic touch: acronyms such as TUM, ECCV, 3DV are set in small caps.
function smallCaps(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const re = /\b[A-Z0-9]*[A-Z][A-Z0-9]*[A-Z][A-Z0-9]*\b/g;
  const has = new RegExp(re.source);
  nodes.forEach(function (n) {
    if (!has.test(n.nodeValue) || n.parentNode.closest('abbr, code, pre')) return;
    const span = document.createElement('span');
    span.innerHTML = n.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(re, '<abbr>$&</abbr>');
    n.replaceWith.apply(n, Array.from(span.childNodes));
  });
}

// The divider above each section: the k-th Laplacian eigenfunction cos(kπx) on a segment.
function eigenDivider(k) {
  const pts = [];
  for (let i = 0; i <= 400; i++) pts.push((i / 2).toFixed(1) + ',' + (7 - 5.5 * Math.cos(Math.PI * k * i / 400)).toFixed(2));
  return '<svg class="eig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(' ') + '"/></svg>';
}

function media(src, alt) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (/\.(mp4|webm|mov)$/i.test(src)) {
    return '<video src="' + src + '" ' + (reduce ? 'controls' : 'autoplay') + ' muted loop playsinline preload="metadata" aria-label="' + alt + '"></video>';
  }
  return '<img src="' + src + '" alt="' + alt + '" loading="lazy">';
}

/* ---------- Sections ---------- */
function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return; } catch (e) {}
  const ta = document.createElement('textarea'); // fallback for older browsers
  ta.value = text; document.body.appendChild(ta); ta.select();
  document.execCommand('copy'); ta.remove();
}

async function renderPublications(el) {
  const items = await readFolder('publications', 'paper.md');
  const bibs = await Promise.all(items.map(function (p) {
    return fetchText(p.base + '/cite.bib').then(function (t) { return t.trim(); }).catch(function () { return ''; });
  }));
  el.innerHTML = items.map(function (p, i) {
    const m = p.meta, links = Array.isArray(m.links) ? m.links : [];
    const main = links.length ? links[0][1] : '#';
    const authors = (m.authors || '').split(',').map(function (a) {
      a = a.trim(); return a === ME ? '<span class="me">' + a + '</span>' : a;
    }).join(', ');
    const notes = (m.notes || '').split(',').map(function (n) { return n.trim(); }).filter(Boolean)
      .map(function (n) { return '<span class="note">' + n + '</span>'; }).join('');
    return '<article class="pub">' +
      (m.media ? '<a class="thumb" href="' + main + '">' + media(resolve(p.base, m.media), m.title) + '</a>' : '<div></div>') +
      '<div><h3><a href="' + main + '">' + m.title + '</a></h3>' +
      '<p class="authors">' + authors + '</p>' +
      '<p class="venue"><em>' + (m.venue || '') + '</em>' + notes + '</p>' +
      (p.body ? '<p class="tldr">' + mdInline(p.body) + '</p>' : '') +
      '<p class="links">' + links.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + '</a>'; }).join(' ') +
      (bibs[i] ? '<button type="button" class="bib-toggle" aria-expanded="false">bibtex</button>' : '') + '</p>' +
      (bibs[i] ? '<div class="bib" hidden><button type="button" class="copy">copy</button><pre>' + escapeHtml(bibs[i]) + '</pre></div>' : '') +
      '</div></article>';
  }).join('');
  el.querySelectorAll('.venue').forEach(smallCaps);
  el.querySelectorAll('.pub').forEach(function (article) {
    const toggle = article.querySelector('.bib-toggle'), box = article.querySelector('.bib');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      box.hidden = !box.hidden;
      toggle.setAttribute('aria-expanded', String(!box.hidden));
    });
    const copy = box.querySelector('.copy');
    copy.addEventListener('click', async function () {
      await copyText(box.querySelector('pre').textContent);
      copy.textContent = 'copied';
      setTimeout(function () { copy.textContent = 'copy'; }, 1500);
    });
  });
}

async function renderBlog(el) {
  const items = await readFolder('blog');
  items.sort(function (a, b) { return (b.meta.date || '').localeCompare(a.meta.date || ''); });
  el.innerHTML = '<ul class="posts">' + items.map(function (p) {
    const langs = splitLanguages(p.body);
    const bilingual = langs.en && langs.it ? '<span class="langs">en · it</span>' : '';
    return '<li><time datetime="' + p.meta.date + '">' + formatDate(p.meta.date) + '</time>' +
      '<span><a href="post.html?p=' + encodeURIComponent(p.name) + '">' + p.meta.title + '</a>' + bilingual + '</span>' +
      (p.meta.subtitle ? '<span class="sub">' + p.meta.subtitle + '</span>' : '') + '</li>';
  }).join('') + '</ul>';
}

async function renderTeaching(el) {
  const items = await readFolder('teaching');
  const html = await Promise.all(items.map(async function (c) {
    const m = c.meta;
    let thumb = '';
    if (m.thumb && /\.svg$/i.test(m.thumb)) thumb = await fetchText(resolve('teaching', m.thumb)); // inline, so it follows the palette
    else if (m.thumb) thumb = '<img src="' + resolve('teaching', m.thumb) + '" alt="" loading="lazy">';
    const terms = (Array.isArray(m.terms) ? m.terms : []).map(function (t) { return t[1] ? '<a href="' + t[1] + '">' + t[0] + '</a>' : t[0]; }).join(' · ');
    return '<article class="pub course">' +
      '<a class="thumb" href="' + (m.url || '#') + '">' + thumb + '</a>' +
      '<div><h3><a href="' + (m.url || '#') + '">' + m.title + '</a></h3>' +
      '<p class="venue"><em>' + (m.institution || '') + '</em>' + (m.role ? ' · ' + m.role : '') + '</p>' +
      (terms ? '<p class="terms">' + terms + '</p>' : '') +
      (c.body ? '<p class="tldr">' + mdInline(c.body) + '</p>' : '') +
      '</div></article>';
  }));
  el.innerHTML = html.join('');
}

async function renderBio(el) {
  el.innerHTML = md(await fetchText('bio.md'));
  smallCaps(el);
}

async function fill(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  try { await fn(el); }
  catch (e) {
    // A section whose folder (or list.txt) is not on the site is hidden, with its menu link.
    const section = el.closest('section');
    if (e.status === 404 && section) {
      document.querySelectorAll('.nav a[href="#' + section.id + '"]').forEach(function (a) { a.remove(); });
      section.remove();
      return;
    }
    console.error(e);
    el.innerHTML = '<p class="error">Could not load this section. If you opened the file directly, ' +
      'start a local server instead (see README.md).</p>';
  }
}

/* ---------- Single post page ---------- */
async function renderPost() {
  const el = document.getElementById('post');
  const name = new URLSearchParams(location.search).get('p');
  try {
    if (!name || !/^[\w-]+$/.test(name)) throw new Error('no post');
    const p = parse(await fetchText('blog/' + name + '.md'));
    const text = splitLanguages(p.body);
    const bilingual = Boolean(text.en && text.it);

    function show(lang) {
      const it = lang === 'it';
      const title = (it && p.meta.title_it) || p.meta.title;
      const subtitle = (it && p.meta.subtitle_it) || p.meta.subtitle;
      const body = (it ? text.it : text.en) || text.it;
      el.lang = it || !text.en ? 'it' : 'en';
      document.title = title + ' — Riccardo Marin';
      el.innerHTML = '<h1 class="post-title">' + title + '</h1>' +
        (subtitle ? '<p class="post-sub">' + subtitle + '</p>' : '') +
        (p.meta.date ? '<p class="post-date"><time datetime="' + p.meta.date + '">' + formatDate(p.meta.date, el.lang) + '</time></p>' : '') +
        (bilingual ? '<p class="lang-note"><em>' + (it ? 'Testo originale in italiano.' : 'Translated from the Italian original.') + '</em> ' +
          '<span class="lang-switch"><button type="button" data-lang="en" aria-pressed="' + !it + '">English</button> · ' +
          '<button type="button" data-lang="it" aria-pressed="' + it + '">Italiano</button></span></p>' : '') +
        '<div class="post-body">' + md(body.replace(/\]\((?!https?:|\/|#|mailto:)/g, '](blog/')) + '</div>';
      smallCaps(el.querySelector('.post-body'));
      el.querySelectorAll('.lang-switch button').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.dataset.lang === lang) return;
          const url = new URL(location.href);
          if (b.dataset.lang === 'it') url.searchParams.set('lang', 'it'); else url.searchParams.delete('lang');
          history.replaceState(null, '', url);
          show(b.dataset.lang);
        });
      });
    }
    show(new URLSearchParams(location.search).get('lang') === 'it' ? 'it' : 'en');
  } catch (e) {
    console.error(e);
    el.innerHTML = '<p class="error">Post not found. <a href="./">Back to the homepage</a>.</p>';
  }
}

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', function () {
  setupThemeToggle();
  document.querySelectorAll('section[data-k]').forEach(function (s) {
    s.insertAdjacentHTML('afterbegin', eigenDivider(Number(s.dataset.k)));
  });
  document.querySelectorAll('.intro').forEach(smallCaps);
  if (document.getElementById('post')) { renderPost(); return; }
  fill('publications-list', renderPublications);
  fill('blog-list', renderBlog);
  fill('teaching-list', renderTeaching);
  fill('bio-text', renderBio);
});
