/* The lesson list on the index and the subject pages: a compact table with search, subject
 * filters and sortable columns, built from LESSON_LIST (lessons.js). The matching, ordering and
 * date formatting are pure and tested in Node. Nothing is remembered: a refresh shows every
 * lesson, newest first.
 *
 * Mount it on <div id="catalog">. data-base is the path back to the site root ("../" on a
 * subject page) and data-subject, when set, shows only that subject.
 */
(function (C) {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // A subject's folder name: "Reading" -> "reading".
  C.slug = (subject) => subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // "2026-10-20" -> ["Oct 20", "2026"], read straight from the string so time zones can't shift it.
  C.date = function (iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return [`${MONTHS[m - 1]} ${d}`, String(y)];
  };

  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Every word of the query has to appear somewhere in the text.
  C.matches = function (text, query) {
    const hay = fold(text);
    return fold(query).split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  };

  // The way each column sorts when you first pick it.
  C.FIRST = { title: 'asc', subject: 'asc', added: 'desc' };

  // Compare two lessons by a column; ties fall back to the title, A to Z.
  C.compare = function (key, dir) {
    const byTitle = (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
    const by = { title: byTitle, subject: (a, b) => a.subject.localeCompare(b.subject), added: (a, b) => a.added.localeCompare(b.added) }[key] || byTitle;
    const sign = dir === 'desc' ? -1 : 1;
    return (a, b) => sign * by(a, b) || byTitle(a, b);
  };

  // Subjects in a list, A to Z, with how many lessons each has.
  C.subjects = function (list) {
    const n = {};
    list.forEach((l) => { n[l.subject] = (n[l.subject] || 0) + 1; });
    return Object.keys(n).sort().map((name) => ({ name, count: n[name] }));
  };

  C.init = function (root, list) {
    const el = (tag, attrs, kids) => {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'text') node.textContent = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      }
      [].concat(kids || []).forEach((kid) => kid !== null && node.append(kid));
      return node;
    };
    const base = root.dataset.base || '';
    const fixed = root.dataset.subject || '';
    const lessons = list.filter((l) => !fixed || l.subject === fixed);
    let sort = { key: 'added', dir: 'desc' };
    let only = '';

    const search = el('input', { type: 'search', id: 'search', placeholder: 'Search lessons', autocomplete: 'off', spellcheck: 'false' });
    const status = el('p', { class: 'status', 'aria-live': 'polite' });
    const tbody = el('tbody');
    const empty = el('div', { class: 'empty', hidden: '' }, [
      el('p', { text: 'No lessons match that.' }),
      el('button', { type: 'button', class: 'btn ghost', onclick: () => { search.value = ''; update(); search.focus(); } }, 'Clear search'),
    ]);

    // Subject filters, on the index only, and only once there's more than one subject.
    const subjects = C.subjects(lessons);
    const chips = fixed || subjects.length < 2 ? null : el('div', { class: 'chips', role: 'group', 'aria-label': 'Subject' },
      [{ name: '', label: 'All', count: lessons.length }].concat(subjects.map((s) => ({ ...s, label: s.name })))
        .map((s) => el('button', {
          type: 'button', class: 'chip', 'aria-pressed': String(s.name === only), 'data-subject': s.name,
          onclick: () => { only = s.name; update(); },
        }, [s.label, el('span', { class: 'n', text: String(s.count) })])));

    const cols = [['title', 'Lesson']].concat(fixed ? [] : [['subject', 'Subject']], [['added', 'Added']]);
    const heads = cols.map(([key, label]) => el('th', { scope: 'col', class: `col-${key}` },
      el('button', {
        type: 'button', class: 'sort',
        onclick: () => {
          sort = sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: C.FIRST[key] };
          update();
        },
      }, [label, el('span', { class: 'arrow', 'aria-hidden': 'true' })])));

    const rows = lessons.map((l) => {
      const [day, year] = C.date(l.added);
      const tr = el('tr', {}, [
        el('td', { class: 'col-title' }, el('a', { href: base + l.path, text: l.title })),
        fixed ? null : el('td', { class: 'col-subject' }, el('a', { href: `${base}${C.slug(l.subject)}/`, text: l.subject })),
        el('td', { class: 'col-added' }, el('time', { datetime: l.added }, [day, el('span', { class: 'year', text: `, ${year}` })])),
      ]);
      return { l, tr, text: `${l.title} ${l.subject} ${l.keywords || ''}` };
    });

    root.append(...[
      el('div', { class: 'tools' }, el('label', { class: 'search' }, [el('span', { class: 'visually-hidden', text: 'Search lessons' }), search])),
      chips, status,
      el('table', { class: 'lessons' }, [el('thead', {}, el('tr', {}, heads)), tbody]),
      empty,
    ].filter(Boolean));

    function update() {
      const q = search.value.trim();
      let shown = 0;
      for (const r of rows.slice().sort((a, b) => C.compare(sort.key, sort.dir)(a.l, b.l))) {
        tbody.append(r.tr); // re-append in order, so tab order follows what you see
        r.tr.hidden = !(C.matches(r.text, q) && (!only || r.l.subject === only));
        if (!r.tr.hidden) shown++;
      }
      cols.forEach(([key], i) => {
        const on = sort.key === key;
        if (on) heads[i].setAttribute('aria-sort', sort.dir === 'asc' ? 'ascending' : 'descending');
        else heads[i].removeAttribute('aria-sort');
        heads[i].querySelector('.arrow').textContent = on ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
      });
      if (chips) chips.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.subject === only)));
      const pool = only ? rows.filter((r) => r.l.subject === only).length : rows.length;
      const noun = `${only ? only + ' ' : ''}${pool === 1 ? 'lesson' : 'lessons'}`;
      status.textContent = q ? `${shown} of ${pool} ${noun} match “${q}”` : `${pool} ${noun}`;
      empty.hidden = shown > 0;
    }
    search.addEventListener('input', update);
    update();
  };

  // The script sits at the end of the page, after lessons.js and the #catalog box.
  if (typeof document !== 'undefined') {
    const root = document.getElementById('catalog');
    if (root) C.init(root, globalThis.LESSON_LIST || []);
  }
})(globalThis.Catalog = globalThis.Catalog || {});
