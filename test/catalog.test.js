// Searching and sorting the lesson index.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.join(__dirname, '..', 'shared', 'catalog.js'));
const C = globalThis.Catalog;

test('search matches every word, ignoring case and vowel marks', () => {
  const text = 'Long and short vowels: i and u · Reading · Phonics · ĭ ī ŭ ū';
  assert.ok(C.matches(text, ''));
  assert.ok(C.matches(text, 'VOWELS'));
  assert.ok(C.matches(text, 'reading vowel'));
  assert.ok(!C.matches(text, 'reading writing'));
  assert.ok(C.matches('ā says its name', 'a says'));
  assert.ok(C.matches(text, '  short   long '));
});

const rows = [
  { title: 'Heart Words, set 1', added: '2026-10-20', subject: 'Reading' },
  { title: 'Digraph sh', added: '2026-10-20', subject: 'Reading' },
  { title: 'Counting to 100', added: '2026-11-02', subject: 'Math' },
  { title: 'Handwriting: O o', added: '2026-10-01', subject: 'Writing' },
];
const order = (sort) => rows.slice().sort(C.compare(sort)).map((r) => r.title);

test('sorts', () => {
  assert.deepEqual(order('newest'), ['Counting to 100', 'Digraph sh', 'Heart Words, set 1', 'Handwriting: O o']);
  assert.deepEqual(order('oldest'), ['Handwriting: O o', 'Digraph sh', 'Heart Words, set 1', 'Counting to 100']);
  assert.deepEqual(order('az'), ['Counting to 100', 'Digraph sh', 'Handwriting: O o', 'Heart Words, set 1']);
  assert.deepEqual(order('za'), ['Heart Words, set 1', 'Handwriting: O o', 'Digraph sh', 'Counting to 100']);
  assert.deepEqual(order('subject'), ['Counting to 100', 'Digraph sh', 'Heart Words, set 1', 'Handwriting: O o']);
  assert.deepEqual(order('anything else'), order('newest'));
});

test('every sort the page offers is handled', () => {
  assert.deepEqual(Object.keys(C.SORTS), ['newest', 'oldest', 'az', 'za', 'subject']);
});
