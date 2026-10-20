// Every lesson's data: quizzes have a right answer among their choices, and so on.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
require(path.join(ROOT, 'shared', 'lesson.js'));
require(path.join(ROOT, 'shared', 'letters.js'));
const L = globalThis.Lesson;

// Lessons live in <subject>/<slug>/ and register under their slug.
const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .flatMap((e) => fs.readdirSync(path.join(ROOT, e.name)).map((slug) => path.join(ROOT, e.name, slug)))
  .filter((d) => fs.existsSync(path.join(d, 'lesson.js')));
const slugs = dirs.map((d) => path.basename(d));
for (const d of dirs) require(path.join(d, 'lesson.js'));
const LESSONS = globalThis.LESSONS;

test('each lesson script registers under its folder name', () => {
  assert.deepEqual(Object.keys(LESSONS).sort(), slugs.slice().sort());
});

test('every quiz is answerable', () => {
  for (const slug of slugs) {
    for (const [name, quiz] of Object.entries(LESSONS[slug].quizzes || {})) {
      assert.deepEqual(L.checkQuiz(quiz), [], `${slug} / ${name}`);
      for (const it of quiz.items) {
        // A plain lowercase word as a picture must be one of the shared drawings, not a typo.
        if (it.pic && /^[a-z]+$/.test(it.pic)) assert.ok(L.pictures[it.pic], `${slug} / ${name}: no drawing "${it.pic}"`);
      }
    }
  }
});

test('checkQuiz catches broken items', () => {
  const errs = L.checkQuiz({
    choices: ['a', 'b'],
    items: [{ word: 'x', answer: 'c' }, { word: 'y', answer: 'a', choices: ['a'] }, { hideWord: true, answer: 'a' }],
  });
  assert.equal(errs.length, 4, errs.join('\n'));
});

test('quiz words with blanks read naturally', () => {
  assert.equal(L.wordText([null, 'ip'], 'blank'), 'blankip');
  assert.equal(L.wordText(['The cat ', null, ' on the mat.'], '___'), 'The cat ___ on the mat.');
  assert.equal(L.wordText('ship'), 'ship');
});

test('shuffle is a permutation and leaves the input alone', () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out = L.shuffle(list, rand);
  assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(out.slice().sort(), list);
  assert.notDeepEqual(out, list);
});

test('heart words: parts spell the word, and heart parts come with a reason', () => {
  const { WORDS, heartLetters } = LESSONS['heart-words-set-1'];
  for (const w of WORDS) {
    assert.equal(w.parts.map((p) => p.replace('*', '')).join(''), w.word, w.word);
    const hearts = heartLetters(w);
    if (hearts.length) assert.ok(w.why && w.say, `${w.word}: why and say`);
    else assert.ok(!w.why, `${w.word}: no reason without a heart part`);
  }
  const was = WORDS.find((w) => w.word === 'was');
  assert.deepEqual(heartLetters(was), [1, 2]);
  assert.deepEqual(heartLetters(WORDS.find((w) => w.word === 'that')), [0, 1]);
  assert.deepEqual(heartLetters(WORDS.find((w) => w.word === 'in')), []);
});

test('handwriting: every letter has a shape and words to go with it', () => {
  const { letters, words } = LESSONS['handwriting-o-h-l-g'];
  for (const k of letters) {
    assert.ok(globalThis.Letters.shapes[k], `no shape for ${k}`);
    assert.ok(words[k], `no words for ${k}`);
  }
});
