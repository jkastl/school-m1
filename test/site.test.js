// Structure, privacy, search and lesson-list checks over the whole site. Plain file reads, no browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
require(path.join(ROOT, 'lessons.js'));
require(path.join(ROOT, 'shared', 'catalog.js'));
const LIST = globalThis.LESSON_LIST;
const C = globalThis.Catalog;

// Every file in the repo except git's own, as paths relative to the root.
function walk(dir = '') {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.posix.join(dir, e.name);
    if (e.name === '.git' || e.name === 'node_modules') return [];
    return e.isDirectory() ? walk(rel) : [rel];
  });
}
const files = walk();
const pages = files.filter((f) => f.endsWith('.html'));
// A lesson is any <subject>/<slug>/ folder with a lesson.js; a subject folder holds lessons.
const lessonDirs = files.filter((f) => /^[^/]+\/[^/]+\/lesson\.js$/.test(f)).map((f) => path.posix.dirname(f) + '/');
const subjectDirs = [...new Set(lessonDirs.map((d) => d.split('/')[0]))];

const emoji = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/u;

test('no photos, scans or documents are committed (worksheets stay private)', () => {
  const banned = files.filter((f) => /\.(jpe?g|png|gif|heic|heif|webp|bmp|tiff?|pdf|docx?)$/i.test(f));
  assert.deepEqual(banned, [], 'draw pictures as inline SVG or use emoji instead');
});

const SITE = 'https://jkastl.github.io/school-m1/';
// The only other sites a page may talk to: the anonymous visit counter (shared/stats.js).
const COUNTER = ['https://gc.zgo.at', 'https://jkastl.goatcounter.com'];
const CSP = "default-src 'self'; script-src 'self' https://gc.zgo.at; img-src 'self' data: https://jkastl.goatcounter.com; connect-src https://jkastl.goatcounter.com; object-src 'none'; base-uri 'none'; form-action 'none'";

test('every page can be found and shared, and is locked to this site and the counter', () => {
  for (const f of pages) {
    const html = read(f);
    const url = SITE + f.replace(/index\.html$/, '');
    const up = '../'.repeat(f.split('/').length - 1);
    const title = html.match(/<title>([^<]+)<\/title>/);
    const desc = html.match(/<meta name="description" content="([^"]+)">/);
    assert.match(html, /<html lang="en">/, `${f}: lang`);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/, `${f}: viewport`);
    assert.doesNotMatch(html, /name="robots"/, `${f}: search engines may index it`);
    assert.match(html, /<meta name="referrer" content="no-referrer">/, `${f}: referrer`);
    assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`), `${f}: CSP`);
    assert.ok(title && desc, `${f}: title and description`);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${f}: canonical ${url}`);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`), `${f}: og:url`);
    assert.ok(html.includes(`<meta property="og:title" content="${title[1].split(' · ')[0]}">`), `${f}: og:title`);
    assert.ok(html.includes(`<meta property="og:description" content="${desc[1]}">`), `${f}: og:description`);
    assert.ok(html.includes(`<script src="${up}shared/stats.js" defer></script>`), `${f}: visit counter`);
    assert.doesNotMatch(html, /<script>|<script [^>]*>[^<]+<\/script>|<style>|\sstyle="|\son[a-z]+="/, `${f}: inline script or style (the CSP blocks them)`);
  }
});

test('nothing else loads from other sites, and nothing is stored', () => {
  for (const f of files.filter((x) => /\.(html|css|js)$/.test(x) && !x.startsWith('test/'))) {
    const src = read(f);
    for (const [u] of src.matchAll(/https?:\/\/[^\s"'`)<>]+/g)) {
      const own = u.startsWith(SITE) && f.endsWith('.html');
      const svg = u.startsWith('http://www.w3.org/');
      const counter = COUNTER.some((c) => u.startsWith(c)) && (f === 'shared/stats.js' || f.endsWith('.html'));
      assert.ok(own || svg || counter, `${f}: ${u}`);
    }
    if (f.endsWith('.html')) {
      // In a page, the counter's hosts appear only in the CSP, and this site's address only in
      // the canonical link and og:url.
      const rest = src.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, '');
      assert.ok(!COUNTER.some((c) => rest.includes(c)), `${f}: counter outside the CSP`);
      assert.doesNotMatch(src, /\ssrc="(https?:)?\/\//i, `${f}: external src`);
      for (const [tag] of src.matchAll(/<[^>]*"https?:\/\/[^>]*>/g)) {
        assert.match(tag, /^<(link rel="canonical"|meta property="og:url")/, `${f}: ${tag}`);
      }
    }
    assert.doesNotMatch(src, /url\(\s*['"]?(https?:)?\/\//i, `${f}: external url()`);
    assert.doesNotMatch(src, /@import|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/, `${f}: network call`);
    assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB|document\.cookie/, `${f}: storage (refresh should start clean)`);
  }
});

test('the counter only counts on the real site', () => {
  const stats = read('shared/stats.js');
  assert.match(stats, /if \(!code \|\| !\/\\\.github\\\.io\$\/\.test\(location\.hostname\)\) return;/);
  assert.match(stats, /s\.integrity = "sha384-[A-Za-z0-9+/=]+";/, 'the counter script is pinned');
});

test('the sitemap lists the index, every subject page and every lesson', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const want = [SITE, ...subjectDirs.map((d) => `${SITE}${d}/`), ...lessonDirs.map((d) => SITE + d)];
  assert.deepEqual(locs.slice().sort(), want.sort(), 'one line per page');
  assert.equal(locs[0], SITE, 'the index comes first');
  assert.deepEqual(locs.slice(1), locs.slice(1).sort(), 'then A to Z');
});

test('local links and scripts point at files that exist, relative to the page', () => {
  for (const f of pages) {
    const html = read(f);
    for (const [, attr, url] of html.matchAll(/\s(src|href)="([^"]+)"/g)) {
      if (url.startsWith('#') || url.startsWith('data:') || url.startsWith(SITE)) continue;
      assert.ok(!url.startsWith('/'), `${f}: ${url} must be relative (the site lives under /school-m1/)`);
      let target = path.posix.join(path.posix.dirname(f), url.split('#')[0]);
      if (url.endsWith('/') || url === '') target = path.posix.join(target, 'index.html');
      assert.ok(files.includes(target), `${f}: ${attr}="${url}" -> ${target} is missing`);
    }
  }
});

test('read-aloud text with sound notation like /z/ has its own data-say', () => {
  // A bare .say button reads the text beside it, and speech would read "/z/" as "slash z slash".
  for (const f of pages) {
    const html = read(f);
    for (const [, text] of html.matchAll(/<button class="say"><\/button>\s*<(?:p|div)>([\s\S]*?)<\/(?:p|div)>/g)) {
      assert.doesNotMatch(text, /\/[a-zăĕĭŏŭāēīōū]+\//i, `${f}: "${text.trim().slice(0, 40)}..." needs data-say`);
    }
  }
});

test('emoji only appear as pictures that stand for a word or sound', () => {
  // In pages, a picture is a <span class="pic">; nothing else may carry an emoji.
  for (const f of pages) {
    const html = read(f).replace(/<span class="pic"[^>]*>[^<]*<\/span>/g, '');
    const m = html.match(emoji);
    assert.ok(!m, `${f}: emoji "${m && m[0]}" outside a picture`);
  }
  // Shared code and styles have none at all.
  for (const f of files.filter((x) => /^shared\/.*\.(js|css)$/.test(x) || x === 'lessons.js')) {
    const m = read(f).match(emoji);
    assert.ok(!m, `${f}: emoji "${m && m[0]}"`);
  }
  // In a lesson's script, only quiz pictures may be emoji.
  for (const dir of lessonDirs) {
    let src = read(`${dir}lesson.js`);
    for (const [, pic] of src.matchAll(/(?:pic: |\[\s*'[^']+',\s*)'([^']+)'/g)) src = src.split(`'${pic}'`).join("''");
    const m = src.match(emoji);
    assert.ok(!m, `${dir}lesson.js: emoji "${m && m[0]}" outside a quiz picture`);
  }
});

test('the lesson list matches the lesson folders', () => {
  const paths = LIST.map((l) => l.path);
  assert.deepEqual(paths.slice().sort(), lessonDirs.slice().sort(), 'one list entry per lesson folder');
  assert.equal(new Set(LIST.map((l) => l.title)).size, LIST.length, 'titles are unique');
  for (const l of LIST) {
    assert.match(l.path, /^[a-z0-9-]+\/[a-z0-9-]+\/$/, `${l.title}: path is <subject>/<slug>/`);
    assert.equal(l.path.split('/')[0], C.slug(l.subject), `${l.title}: lives in its subject's folder`);
    assert.match(l.added, /^\d{4}-\d{2}-\d{2}$/, `${l.title}: added`);
    assert.ok(files.includes(`${l.path}index.html`), `${l.title}: index.html`);
    const page = read(`${l.path}index.html`);
    assert.ok(page.includes(`<title>${l.title} · Grade 1 practice</title>`), `${l.title}: page <title>`);
    assert.ok(page.includes(`<h1>${l.title}</h1>`), `${l.title}: page <h1>`);
    assert.ok(page.includes(`<a href="../">${l.subject}</a>`), `${l.title}: breadcrumb names its subject`);
  }
});

test('every subject folder has a page that lists that subject', () => {
  for (const dir of subjectDirs) {
    const subject = LIST.find((l) => l.path.startsWith(`${dir}/`)).subject;
    assert.ok(files.includes(`${dir}/index.html`), `${dir}/index.html is missing`);
    const page = read(`${dir}/index.html`);
    assert.ok(page.includes(`<div id="catalog" data-subject="${subject}" data-base="../"></div>`), `${dir}: catalog for ${subject}`);
    assert.ok(page.includes(`<title>${subject} · Grade 1 practice</title>`) && page.includes(`<h1>${subject}</h1>`), `${dir}: title and h1`);
  }
});

test('every lesson page has the four sections', () => {
  for (const dir of lessonDirs) {
    const page = read(`${dir}index.html`);
    for (const id of ['learn', 'practice', 'world', 'grownups']) {
      assert.match(page, new RegExp(`id="${id}"`), `${dir}: #${id}`);
    }
    assert.match(page, /<nav class="crumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.\/">All lessons<\/a>/, `${dir}: link back to the index`);
  }
});
