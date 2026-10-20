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
- No tracking and no third-party requests: no analytics, fonts, CDNs or embeds. The font (Andika)
  is self-hosted. Every page carries a `noindex` robots tag, `no-referrer`, and a Content Security
  Policy that blocks every other origin. Read-aloud prefers voices that run on the device.
- Nothing is saved: no cookies, `localStorage`, `sessionStorage`, IndexedDB, or state in the URL.

### 2. Check what's already here

1. List the topics on the source sheet. **Ignore unit, section, lesson and page numbers**; they
   say nothing about the topic and differ between programs.
2. For each topic, search the index and the lessons, e.g.
   `grep -ril "digraph\|heart word" index.html lessons/`.
3. **Default to a new lesson**, even when a similar one exists (`heart-words-set-2` next to
   `heart-words-set-1`). Change an existing lesson only when the new material is truly the same
   (same letters, words or skill), or when asked to improve that lesson.

### 3. Write for the grade (grade 1)

Six- and seven-year-olds who are just starting to read.

- **One lesson per topic.** A sheet with four topics becomes four lessons.
- **Kid-facing text** is short and plain, uses decodable words where it can, and is big (1.25rem
  or more). Every kid-facing paragraph sits in a `.say-line` with a 🔊 button.
- **Match the classroom's words** from the sheet (heart words; the star, moon and earth lines;
  "land the rocket"), so home and school sound the same. Say it in your own words, though,
  and don't copy the sheet's pictures.
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

A lesson is a folder, `lessons/<slug>/`, with `index.html` and `lesson.js`. Name the slug by topic
and content, lowercase with hyphens: `digraph-sh`, `heart-words-set-1`, `handwriting-o-h-l-g`,
`vowels-long-short-i-u`. Start by copying the closest lesson.

The page has four parts, in this order, with these ids:

1. `#learn`: the explainer. Short, with tap-to-hear cards.
2. `#practice`: the activities.
3. `#world`: In the real world.
4. `#grownups`: a closed `<details class="grownups">`.

Copy the `<head>` from an existing lesson (robots, referrer, CSP, viewport, title, description,
icon) and keep the "← All lessons" link and the Auto-read toggle in the top bar. Give the
`<body>` a theme class (`theme-heart`, `theme-write`, `theme-sh`, `theme-vowel`, or add one in
`shared/site.css`).

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
| `shared/catalog.js`, `catalog.css` | `Catalog`: search and sort on the index |
| `shared/fonts/` | Andika, a font made for early readers (single-story *a* and *g*), with its license |

**Quiz items.** A quiz is `{ items, choices, ask, shuffleChoices }`, and each item is:

```js
{
  word: 'ship',            // shown big; an array with null for a blank: [null, 'ip']
  pic: '🚢',               // emoji, or the name of a drawing in Lesson.pictures
  say: 'ship',             // what 🔊 says (defaults to the word, with "blank" for blanks)
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

### 6. Add it to the index

Copy a `<li>` in `<ul id="lessons">` in [`index.html`](index.html) and change its values:

```html
<li data-added="2026-10-20" data-subject="Reading" data-title="Digraph sh" data-keywords="phonics digraphs sh sound">
  <span class="lesson-icon emoji" aria-hidden="true">🤫</span>
  <div class="lesson-body">
    <h2 class="lesson-name"><a href="lessons/digraph-sh/">Digraph sh</a></h2>
    <p class="lesson-desc">One or two sentences on what it covers.</p>
    <p class="lesson-meta"><span class="pill">Reading</span><span>Phonics · Digraphs</span><time datetime="2026-10-20">Added Oct 20, 2026</time></p>
  </div>
</li>
```

- `data-title` must match the link text, the page's `<h1>` and the start of its `<title>`.
- `data-added` and `<time>` are the day the lesson was added. Keep rows newest first (same day:
  A to Z), which is the order the page shows with JavaScript off.
- `data-subject` is the pill: Reading, Writing, Math, Science, and so on.
- `data-keywords` are extra search words that aren't on the row (the words taught, other names
  for the skill).

The tests check all of this. Search matches every word typed, across the row and its keywords.
Sorting offers newest, oldest, A to Z, Z to A, and subject.

### 7. Accessibility

- Real `<button>`s and links, with tap targets of 48px or more and a visible focus ring.
- Feedback goes in an `aria-live` region and never relies on color alone (✔, words, crossed out).
- Decorative emoji are `aria-hidden`; pictures that carry meaning have the word next to them.
- Respect `prefers-reduced-motion` (no star shower, no rocket). Work at phone width (390px).
- Everything works by keyboard except finger tracing, which has the "Show me" demo instead.

### 8. Test it

```sh
python3 -m http.server     # then open http://localhost:8000/
node --test 'test/*.test.js'
```

The tests (Node 20 or later, no dependencies) check the privacy rules (no photos, no outside
requests, no storage, robots and CSP on every page), that links resolve, the index rows, every
quiz's answers, the heart-word parts, the letter shapes and the tracing scores. GitHub Actions runs
them on every push. Before calling a lesson done, also open it at phone width and play every
activity to the end.

### 9. Version and publish

The version and date in the index footer are updated by hand, in the same commit as the change:

- **Patch** (`1.0.0` → `1.0.1`): a typo, wording, or a fixed answer.
- **Minor** (`1.0.0` → `1.1.0`): adding, removing or renaming a lesson, or a new shared feature.
- **Major** (`1.0.0` → `2.0.0`): a redesign or restructure.

GitHub Pages publishes `main` as-is (`.nojekyll` turns off Jekyll), usually within a minute.

## Layout

```
index.html          the lesson index (search and sort)
lessons/<slug>/     one folder per lesson: index.html and lesson.js
shared/             styles, scripts and the font every page uses
test/               node:test suite
CLAUDE.md           points Claude at these instructions
```
