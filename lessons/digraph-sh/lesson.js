/* Digraph sh: the three practice activities. Data first (the tests check it), then the page. */
(function () {
  'use strict';

  const YES = { value: 'yes', label: '🤫 Yes', sub: 'I hear sh' };
  const NO = { value: 'no', label: '🙅 No', sub: 'no sh' };
  const START = { value: 'start', label: 'sh _ _', sub: 'at the start' };
  const END = { value: 'end', label: '_ _ sh', sub: 'at the end' };

  const quizzes = {
    hear: {
      choices: [YES, NO],
      hint: 'Say it slowly. Do your lips push out for shhh?',
      items: [
        { word: 'ship', pic: '🚢', answer: 'yes', yes: 'Yes! ship starts with sh.' },
        { word: 'shell', pic: '🐚', answer: 'yes', yes: 'Yes! shell starts with sh.' },
        { word: 'fish', pic: '🐟', answer: 'yes', yes: 'Yes! fish ends with sh.' },
        { word: 'sheep', pic: '🐑', answer: 'yes', yes: 'Yes! sheep starts with sh.' },
        { word: 'brush', pic: '🪥', answer: 'yes', yes: 'Yes! brush ends with sh.' },
        { word: 'sun', pic: '☀️', answer: 'no', yes: 'Right! sun has s, but no sh.' },
        { word: 'hat', pic: '🎩', answer: 'no', yes: 'Right! hat has h, but no sh.' },
        { word: 'snake', pic: '🐍', answer: 'no', yes: 'Right! snake has sss, not shhh.' },
        { word: 'house', pic: '🏠', answer: 'no', yes: 'Right! house has an h and an s, but they are not together.' },
        { word: 'sock', pic: '🧦', answer: 'no', yes: 'Right! sock has s, but no sh.' },
      ],
    },
    where: {
      choices: [START, END],
      items: [
        { word: 'ship', pic: '🚢', answer: 'start', yes: 'Yes! sh is at the start of ship.' },
        { word: 'shoe', pic: '👟', answer: 'start', yes: 'Yes! sh is at the start of shoe.' },
        { word: 'shell', pic: '🐚', answer: 'start', yes: 'Yes! sh is at the start of shell.' },
        { word: 'shark', pic: '🦈', answer: 'start', yes: 'Yes! sh is at the start of shark.' },
        { word: 'sheep', pic: '🐑', answer: 'start', yes: 'Yes! sh is at the start of sheep.' },
        { word: 'fish', pic: '🐟', answer: 'end', yes: 'Yes! sh is at the end of fish.' },
        { word: 'brush', pic: '🪥', answer: 'end', yes: 'Yes! sh is at the end of brush.' },
        { word: 'cash', pic: '💵', answer: 'end', yes: 'Yes! sh is at the end of cash.' },
        { word: 'trash', pic: '🗑️', answer: 'end', yes: 'Yes! sh is at the end of trash.' },
        { word: 'splash', pic: '💦', answer: 'end', yes: 'Yes! sh is at the end of splash.' },
      ],
    },
    // Every wrong choice still makes a real-looking word, so the picture decides it.
    build: {
      ask: 'Which sound is missing?',
      items: [
        { word: [null, 'ip'], say: 'ship', pic: '🚢', choices: ['sh', 's', 'h'], answer: 'sh', yes: 'Yes! sh, ip: ship.' },
        { word: ['fi', null], say: 'fish', pic: '🐟', choices: ['t', 'sh', 'x'], answer: 'sh', yes: 'Yes! fi, sh: fish.' },
        { word: [null, 'ell'], say: 'shell', pic: '🐚', choices: ['b', 't', 'sh'], answer: 'sh', yes: 'Yes! sh, ell: shell.' },
        { word: ['ca', null], say: 'cash', pic: '💵', choices: ['sh', 't', 'p'], answer: 'sh', yes: 'Yes! ca, sh: cash.' },
        { word: [null, 'op'], say: 'shop', pic: '🏪', choices: ['h', 'sh', 't'], answer: 'sh', yes: 'Yes! sh, op: shop.' },
        { word: ['di', null], say: 'dish', pic: '🍽️', choices: ['g', 'p', 'sh'], answer: 'sh', yes: 'Yes! di, sh: dish.' },
        { word: ['wi', null], say: 'wish', pic: '🌠', choices: ['sh', 'n', 'g'], answer: 'sh', yes: 'Yes! wi, sh: wish.' },
      ],
    },
  };
  // A quiz-wide hint applies to every item that doesn't have its own.
  for (const q of Object.values(quizzes)) {
    if (q.hint) q.items.forEach((it) => { it.hint = it.hint || q.hint; });
  }

  (globalThis.LESSONS = globalThis.LESSONS || {})['digraph-sh'] = { quizzes };
  if (typeof document === 'undefined') return;

  Lesson.init();
  Lesson.mountQuizzes(quizzes);
})();
