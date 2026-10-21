# school-m1

Explainers and practice activities for first grade.

**[jkastl.github.io/school-m1](https://jkastl.github.io/school-m1/)**

[![Tests](https://github.com/jkastl/school-m1/actions/workflows/tests.yml/badge.svg)](https://github.com/jkastl/school-m1/actions/workflows/tests.yml)

Each lesson explains one topic, gives a few interactive activities, connects it to the real world,
and ends with notes for grown-ups. The site isn't listed on the main site's index. There's no
build step, no dependencies, no accounts, and nothing is saved: a refresh starts every activity fresh.

## Build instructions

These are the shared rules for every lesson. They're written so a sibling repo
(`school-<letter><grade>`) can copy this whole section and change only **This repo**.

### This repo

- **Grade:** 1. The number at the end of the repo name is the grade. The letter only keeps
  siblings' repos apart; it appears in the URL and nowhere else.
- **Site:** <https://jkastl.github.io/school-m1/>, from GitHub Pages on `main` (the root folder).
- **Page titles:** `<Lesson title> · Grade 1 practice`. The index is titled `Grade 1 practice`.

### 1. Privacy comes first

This repo is public, and git history keeps everything, so these rules beat every other rule here.

- Never include anything specific to or personal about a child or their family: no names (not
  even the letter in the repo name), photos, voices, birthdays, ages, places, schedules, or
  anything they said or wrote.
- Never name the school, teacher, class, district, town, or the program or publisher printed on a
  worksheet. Write "in class," not the program's name.
- Never commit the source material: no photos, scans or PDFs of worksheets. Rebuild each topic in
  your own words and drawings. `.gitignore` blocks image and document files, and a test fails if
  one sneaks in. Draw pictures as inline SVG (`Lesson.pictures`) or use emoji.
- Example sentences use generic people ("the man", "he"), never names.
- One outside service only: the site's anonymous visit counter ([GoatCounter](https://www.goatcounter.com/),
  no cookies, no personal data), loaded by `shared/stats.js` on every page. It's a copy of the main
  site's file and does nothing off `github.io`, so local testing never counts. Nothing else comes
  from another site: no other analytics, fonts, CDNs or embeds. The font (Andika) is self-hosted.
- Every page carries `no-referrer` and a Content Security Policy that allows only this site and
  the counter (`gc.zgo.at` for its script, `jkastl.goatcounter.com` for the count). Read-aloud
  prefers voices that run on the device.
- Pages are open to search engines, so anything on them can turn up in search results. That's one
  more reason to keep every page free of anything personal.
- Nothing is saved: no cookies, `localStorage`, `sessionStorage`, IndexedDB, or state in the URL.

### 2. Check what's already here

1. List the topics on the source sheet. **Ignore unit, section, lesson and page numbers**; they
   say nothing about the topic and differ between programs.
2. For each topic, search the lesson list and the lessons, e.g.
   `grep -ril "digraph\|heart word" lessons.js */`.
3. **Default to a new lesson**, even when a similar one exists (`heart-words-set-2` next to
   `heart-words-set-1`). Change an existing lesson only when the new material is truly the same
   (same letters, words or skill), or when asked to improve that lesson.

### 3. Write for the grade (grade 1)

Six- and seven-year-olds who are just starting to read.

- **One lesson per topic.** A sheet with four topics becomes four lessons.
- **Kid-facing text** is short and plain, uses decodable words where it can, and is big (1.25rem
  or more). Every kid-facing paragraph sits in a `.say-line` with a speaker button.
- **Match the classroom's words** from the sheet (heart words; the star, moon and earth lines;
  "land the rocket"), so home and school sound the same. Say it in your own words, though,
  and don't copy the sheet's pictures.
- **Pictures, not decoration.** Emoji appear only as pictures that stand for a word or a sound:
  quiz pictures, and the few explainer cards that need one (a snake for /s/, an apple for short
  *a*). In a page, each one is a `<span class="pic" aria-hidden="true">`. Never put emoji in
  headings, buttons, lists, feedback or the lesson list. Interface icons (the speaker, the star,
  moon and earth markers, hearts) are drawn in SVG or CSS, and stars are the ★ character. A test
  enforces this.
- **Pictures with one obvious name:** 🚢 for *ship*, not a boat that could be *boat*. If no emoji
  fits, draw one in `Lesson.pictures`. Check that the emoji is a few years old so it shows on
  older tablets.
- **Kind feedback:** "Not quite. Try again!", never "wrong". Unlimited tries, no timers, and a
  star only for getting it on the first try.
- **Size:** two to four activities per lesson, six to ten items each.
- **Real-world examples in every lesson:** five to eight concrete ones (at home, the store, the
  park, in the car) and at least one thing to go and find or do.
- **For grown-ups:** what the skill is, how to help, common mix-ups, and anything the page leaves
  to class on purpose (for example, the vowel actions kids learn in class).
- **Be accurate:** check each word's sounds (the *u* in *music* is long; *house* has an *h* and an
  *s* but no /sh/). Every quiz item must have exactly one right answer.

### 4. What a lesson looks like

A lesson is a folder inside its subject's folder, `<subject>/<slug>/`, with `index.html` and
`lesson.js`, so its address reads `/school-m1/reading/digraph-sh/`. The subject folder is the
subject's name in lowercase (`reading`, `writing`, `math`; `social-studies` for two words). Name
the slug by topic and content, lowercase with hyphens: `digraph-sh`, `heart-words-set-1`,
`handwriting-o-h-l-g`, `vowels-long-short-i-u`. Start by copying the closest lesson.

The page has four parts, in this order, with these ids:

1. `#learn`: the explainer. Short, with tap-to-hear cards.
2. `#practice`: the activities.
3. `#world`: In the real world.
4. `#grownups`: a closed `<details class="grownups">`.

Copy the `<head>` from an existing lesson (viewport, referrer, CSP, title, description, the
canonical link and sharing tags with this page's own address, the counter script, icon) and keep
the top bar: the breadcrumb (All lessons / *Subject*) and the Auto-read toggle.
Give the `<body>` a theme class (`theme-heart`, `theme-write`, `theme-sh`, `theme-vowel`, or add
one in `shared/site.css`).

`lesson.js` puts its data first and registers it, so the tests can load it in Node, then stops
when there's no page:

```js
(function () {
  'use strict';
  const quizzes = { /* ... */ };
  (globalThis.LESSONS = globalThis.LESSONS || {})['my-slug'] = { quizzes };
  if (typeof document === 'undefined') return;
  Lesson.init();
  Lesson.mountQuizzes(quizzes); // fills every <div class="quiz" data-quiz="name">
})();
```

### 5. Shared code

| File | What it does |
|---|---|
| `shared/site.css` | Colors (light and dark), type, cards, buttons, quiz, tiles, grown-up notes |
| `shared/lesson.js` | `Lesson`: read-aloud, the quiz, `[data-say]` buttons, pictures, the star shower |
| `shared/letters.js` | `Letters`: handwriting shapes on the star, moon and earth lines |
| `shared/trace.js`, `trace.css` | `Trace`: the "Show me" demo, finger tracing and the star check |
| `lessons.js` | `LESSON_LIST`: every lesson, read by the index, the subject pages and the tests |
| `shared/catalog.js`, `catalog.css` | `Catalog`: the compact lesson table, with search, subject filters and sorting |
| `shared/fonts/` | Andika, a font made for early readers (single-story *a* and *g*), with its license |

**Quiz items.** A quiz is `{ items, choices, ask, shuffleChoices }`, and each item is:

```js
{
  word: 'ship',            // shown big; an array with null for a blank: [null, 'ip']
  pic: '🚢',               // emoji, or the name of a drawing in Lesson.pictures
  say: 'ship',             // what the speaker says (defaults to the word, "blank" for blanks)
  choices: ['sh', 's'],    // or set them once for the whole quiz
  answer: 'sh',
  yes: 'Yes! ship.',       // shown and said when right
  hint: 'Say it slowly.',  // shown from the second wrong try
  hideWord: true,          // listening items: hear it, don't see it
  sentence: true,          // smaller type for a sentence
}
```

Choices are strings or `{ value, label, sub }`. Run the tests after any change to a quiz; they
check that each item's answer is one of its choices.

**Talking buttons.** A `<button class="say">` inside a `.say-line` reads the text next to it.
Give it a `data-say` when that text has sound notation like /z/ (speech would say "slash"), or
when it should say something else. Any button with `data-say` talks when tapped.

**Handwriting.** Add letters to `shared/letters.js` (the header there explains the format and
the cues), then list them in the lesson's `lesson.js`. The tests check that each letter sits on
the right lines and that its steps join up.

### 6. Add it to the list

Add one line to [`lessons.js`](lessons.js), at the top (newest first):

```js
{ path: 'reading/digraph-sh/', title: 'Digraph sh', subject: 'Reading', added: '2026-10-20', keywords: 'phonics digraphs sh sound' },
```

- `path` is the lesson's folder, inside its subject's folder.
- `title` must match the page's `<h1>` and the start of its `<title>`.
- `subject` must match the folder (`Reading` lives in `reading/`), and the lesson's breadcrumb.
- `added` is the day the lesson was added.
- `keywords` are extra search words that aren't in the title: the words or letters taught, and
  other names for the skill.

Then add the lesson's address to [`sitemap.xml`](sitemap.xml), one `<url>` line, after the index
and in A to Z order. Search engines find it there: the main site's `robots.txt` points at this
sitemap, since crawlers only read `robots.txt` at the domain root.

The index and the subject's page both read the list, so nothing else needs touching. The index is a compact
table (lesson, subject, date added) with search, a filter per subject, and columns you can sort.
It opens newest first. Search matches every word typed, across the title, subject and keywords.

**A new subject** gets a folder with an `index.html` that lists just that subject: copy
`reading/index.html` and change the subject in its `<title>`, `<h1>`, description, canonical
link, sharing tags and `data-subject`, and add its address to `sitemap.xml`. The tests check
that every subject has one and that every lesson is listed once, in both lists.

### 7. Accessibility

- Real `<button>`s and links, with tap targets of 48px or more and a visible focus ring.
- Feedback goes in an `aria-live` region and never relies on color alone (words, crossed out).
- Pictures are `aria-hidden`, with the word they stand for next to them or spoken by the button.
- Respect `prefers-reduced-motion` (no star shower, no moving pen tip). Work at phone width (390px).
- Everything works by keyboard except finger tracing, which has the "Show me" demo instead.

### 8. Test it

```sh
python3 -m http.server     # then open http://localhost:8000/
node --test 'test/*.test.js'
```

The tests (Node 20 or later, no dependencies) check the privacy rules (no photos, no outside
requests but the counter, no storage, the CSP on every page), each page's canonical address,
sharing tags and counter, the sitemap, that links resolve, that the lesson list
matches the folders, the subject pages, emoji only as pictures, every quiz's answers, the
heart-word parts, the letter shapes, the tracing scores, and search and sort. GitHub Actions runs
them on every push. Before calling a lesson done, also open it at phone width and play every
activity to the end.

### 9. Version and publish

The version and date in the index footer are updated by hand, in the same commit as the change:

- **Patch** (`2.0.0` → `2.0.1`): a typo, wording, or a fixed answer.
- **Minor** (`2.0.0` → `2.1.0`): adding, removing or renaming a lesson, or a new shared feature.
- **Major** (`2.0.0` → `3.0.0`): a redesign, or a change that moves pages to new addresses.

GitHub Pages publishes `main` as-is (`.nojekyll` turns off Jekyll), usually within a minute.

## Layout

```
index.html          the lesson index (search, subject filters, sorting)
lessons.js          the list of every lesson
sitemap.xml         every page's address, for search engines
<subject>/          one folder per subject (reading/, writing/), with a page listing it
<subject>/<slug>/   one folder per lesson: index.html and lesson.js
shared/             styles, scripts and the font every page uses (stats.js is the counter)
test/               node:test suite
CLAUDE.md           points Claude at these instructions
```
