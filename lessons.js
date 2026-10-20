/* Every lesson, one entry each. The index, the subject pages and the tests all read this list,
 * so adding a lesson here is all it takes to list it.
 *   path      the lesson's folder: <subject folder>/<lesson slug>/
 *   title     the page's <h1>, and the start of its <title>
 *   subject   the subject; its folder is the name in lowercase (Reading -> reading/)
 *   added     the day it was added, YYYY-MM-DD
 *   keywords  extra search words: the words or letters taught, other names for the skill
 */
globalThis.LESSON_LIST = [
  { path: 'reading/digraph-sh/', title: 'Digraph sh', subject: 'Reading', added: '2026-10-20', keywords: 'phonics digraphs sh sound quiet ship fish' },
  { path: 'reading/heart-words-set-1/', title: 'Heart Words, set 1', subject: 'Reading', added: '2026-10-20', keywords: 'sight words high frequency tricky words is for that he was his are in it on' },
  { path: 'reading/vowels-long-short-i-u/', title: 'Long and short vowels: i and u', subject: 'Reading', added: '2026-10-20', keywords: 'phonics vowels long short says its name itch up' },
  { path: 'writing/handwriting-o-h-l-g/', title: 'Handwriting: O o, H h, L l, G g', subject: 'Writing', added: '2026-10-20', keywords: 'letter formation tracing star line moon line earth line rocket capital lowercase' },
];
