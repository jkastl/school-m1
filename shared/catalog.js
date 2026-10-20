/* The lesson index: search and sort over the rows in index.html. The matching and ordering
 * are pure and tested in Node; Catalog.init() wires them to the page. Nothing is remembered:
 * a refresh shows every lesson, newest first.
 */
(function (C) {
  'use strict';

  C.SORTS = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    az: 'A to Z',
    za: 'Z to A',
    subject: 'By subject',
  };

  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Every word of the query has to appear somewhere in the text.
  C.matches = function (text, query) {
    const hay = fold(text);
    return fold(query).split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  };

  // Compare two lessons ({ title, added: 'YYYY-MM-DD', subject }) for a sort key.
  C.compare = function (sort) {
    const byTitle = (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
    switch (sort) {
      case 'oldest': return (a, b) => a.added.localeCompare(b.added) || byTitle(a, b);
      case 'az': return byTitle;
      case 'za': return (a, b) => byTitle(b, a);
      case 'subject': return (a, b) => a.subject.localeCompare(b.subject) || byTitle(a, b);
      default: return (a, b) => b.added.localeCompare(a.added) || byTitle(a, b);
    }
  };

  C.init = function () {
    const list = document.getElementById('lessons');
    const rows = [...list.children].map((li) => ({
      li,
      title: li.dataset.title,
      added: li.dataset.added,
      subject: li.dataset.subject,
      text: `${li.textContent} ${li.dataset.keywords || ''}`,
    }));
    const search = document.getElementById('search');
    const sort = document.getElementById('sort');
    const status = document.getElementById('status');
    const empty = document.getElementById('empty');
    document.getElementById('tools').hidden = false;

    function update() {
      const q = search.value.trim();
      const sorted = rows.slice().sort(C.compare(sort.value));
      let shown = 0;
      for (const r of sorted) {
        list.append(r.li); // re-append in order, so tab order follows what you see
        r.li.hidden = !C.matches(r.text, q);
        if (!r.li.hidden) shown++;
      }
      const noun = rows.length === 1 ? 'lesson' : 'lessons';
      status.textContent = q ? `${shown} of ${rows.length} ${noun} match “${q}”` : `${rows.length} ${noun}`;
      empty.hidden = shown > 0;
    }
    search.addEventListener('input', update);
    sort.addEventListener('change', update);
    document.getElementById('clear').addEventListener('click', () => {
      search.value = '';
      update();
      search.focus();
    });
    update();
  };

  // The script sits at the end of the page, so the rows are already there.
  if (typeof document !== 'undefined') C.init();
})(globalThis.Catalog = globalThis.Catalog || {});
