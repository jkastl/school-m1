// Structure, privacy and index checks over the whole site. Plain file reads, no browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

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
const lessons = fs.readdirSync(path.join(ROOT, 'lessons')).filter((d) => fs.statSync(path.join(ROOT, 'lessons', d)).isDirectory());

test('no photos, scans or documents are committed (worksheets stay private)', () => {
  const banned = files.filter((f) => /\.(jpe?g|png|gif|heic|heif|webp|bmp|tiff?|pdf|docx?)$/i.test(f));
  assert.deepEqual(banned, [], 'draw pictures as inline SVG or use emoji instead');
});

test('every page is private, safe and self-contained', () => {
  for (const f of pages) {
    const html = read(f);
    assert.match(html, /<html lang="en">/, `${f}: lang`);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/, `${f}: viewport`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, `${f}: noindex`);
    assert.match(html, /<meta name="referrer" content="no-referrer">/, `${f}: referrer`);
    assert.match(html, /<meta http-equiv="Content-Security-Policy" content="default-src 'self';[^"]*connect-src 'none'/, `${f}: CSP`);
    assert.match(html, /<title>[^<]+<\/title>/, `${f}: title`);
    assert.doesNotMatch(html, /<script>|<script [^>]*>[^<]+<\/script>|<style>|\sstyle="|\son[a-z]+="/, `${f}: inline script or style (the CSP blocks them)`);
  }
});

test('nothing loads from other sites, and nothing is stored', () => {
  for (const f of files.filter((x) => /\.(html|css|js)$/.test(x) && !x.startsWith('test/'))) {
    const src = read(f);
    assert.doesNotMatch(src, /(src|href)="(https?:)?\/\//i, `${f}: external src/href`);
    assert.doesNotMatch(src, /url\(\s*['"]?(https?:)?\/\//i, `${f}: external url()`);
    assert.doesNotMatch(src, /@import|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/, `${f}: network call`);
    assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB|document\.cookie/, `${f}: storage (refresh should start clean)`);
  }
});

test('local links and scripts point at files that exist, relative to the page', () => {
  for (const f of pages) {
    const html = read(f);
    for (const [, attr, url] of html.matchAll(/\s(src|href)="([^"]+)"/g)) {
      if (url.startsWith('#') || url.startsWith('data:')) continue;
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

test('every lesson folder has a page, a script and exactly one index row', () => {
  const index = read('index.html');
  const rows = [...index.matchAll(/<li data-added="([^"]+)" data-subject="([^"]+)" data-title="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)]
    .map(([, added, subject, title, body]) => ({ added, subject, title, href: (body.match(/href="lessons\/([^/"]+)\/"/) || [])[1], body }));
  assert.equal(rows.length, lessons.length, 'one row per lesson folder');
  for (const slug of lessons) {
    assert.ok(files.includes(`lessons/${slug}/index.html`), `${slug}: index.html`);
    assert.ok(files.includes(`lessons/${slug}/lesson.js`), `${slug}: lesson.js`);
    assert.equal(rows.filter((r) => r.href === slug).length, 1, `${slug}: one index row`);
  }
  for (const r of rows) {
    assert.match(r.added, /^\d{4}-\d{2}-\d{2}$/, `${r.title}: data-added`);
    assert.ok(r.body.includes(`<time datetime="${r.added}">`), `${r.title}: <time> matches data-added`);
    assert.ok(r.body.includes(`>${r.title}</a>`), `${r.title}: link text matches data-title`);
    const page = read(`lessons/${r.href}/index.html`);
    assert.ok(page.includes(`<title>${r.title} · Grade 1 practice</title>`), `${r.title}: page <title>`);
    assert.match(page, new RegExp(`<h1>.*</span> ${r.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`), `${r.title}: page <h1>`);
  }
  // Rows sit newest first (same day: A to Z), which is what the page shows without JavaScript.
  const want = rows.slice().sort((a, b) => b.added.localeCompare(a.added) || a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
  assert.deepEqual(rows.map((r) => r.title), want.map((r) => r.title), 'rows out of order');
});

test('every lesson page has the four sections', () => {
  for (const slug of lessons) {
    const page = read(`lessons/${slug}/index.html`);
    for (const id of ['learn', 'practice', 'world', 'grownups']) {
      assert.match(page, new RegExp(`id="${id}"`), `${slug}: #${id}`);
    }
    assert.match(page, /<a class="back" href="\.\.\/\.\.\/">/, `${slug}: link back to the index`);
  }
});
