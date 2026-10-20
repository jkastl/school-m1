// The lesson list: searching, sorting, subjects and dates.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.join(__dirname, '..', 'shared', 'catalog.js'));
const C = globalThis.Catalog;

test('search matches every word, ignoring case and vowel marks', () => {
  const text = 'Long and short vowels: i and u · Reading · phonics ĭ ī ŭ ū';
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
const order = (key, dir) => rows.slice().sort(C.compare(key, dir)).map((r) => r.title);

test('sorts by each column, ties A to Z', () => {
  assert.deepEqual(order('added', 'desc'), ['Counting to 100', 'Digraph sh', 'Heart Words, set 1', 'Handwriting: O o']);
  assert.deepEqual(order('added', 'asc'), ['Handwriting: O o', 'Digraph sh', 'Heart Words, set 1', 'Counting to 100']);
  assert.deepEqual(order('title', 'asc'), ['Counting to 100', 'Digraph sh', 'Handwriting: O o', 'Heart Words, set 1']);
  assert.deepEqual(order('title', 'desc'), ['Heart Words, set 1', 'Handwriting: O o', 'Digraph sh', 'Counting to 100']);
  assert.deepEqual(order('subject', 'asc'), ['Counting to 100', 'Digraph sh', 'Heart Words, set 1', 'Handwriting: O o']);
  assert.deepEqual(order('subject', 'desc'), ['Handwriting: O o', 'Digraph sh', 'Heart Words, set 1', 'Counting to 100']);
  assert.deepEqual(C.FIRST, { title: 'asc', subject: 'asc', added: 'desc' });
});

test('subjects, folders and dates', () => {
  assert.deepEqual(C.subjects(rows), [{ name: 'Math', count: 1 }, { name: 'Reading', count: 2 }, { name: 'Writing', count: 1 }]);
  assert.equal(C.slug('Reading'), 'reading');
  assert.equal(C.slug('Social Studies'), 'social-studies');
  assert.deepEqual(C.date('2026-10-20'), ['Oct 20', '2026']);
  assert.deepEqual(C.date('2027-01-05'), ['Jan 5', '2027']);
});
