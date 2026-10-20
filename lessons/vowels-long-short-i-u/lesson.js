/* Long and short vowels: i and u. Every word is picked so its picture has one obvious name. */
(function () {
  'use strict';

  const MARK = { 'short-i': 'ĭ', 'long-i': 'ī', 'short-u': 'ŭ', 'long-u': 'ū' };
  const SAY = {
    'short-i': 'short i, like itch',
    'long-i': 'long i. It says its name',
    'short-u': 'short u, like up',
    'long-u': 'long u. It says its name',
  };

  function item(word, pic, sound, letter) {
    const [len, v] = sound.split('-');
    return {
      word, pic, answer: letter ? len : sound,
      yes: `Yes! ${word} has ${SAY[sound]}.`,
      hint: `Say it slowly: ${word}. Does the ${v} say its name?`,
    };
  }
  const choice = (sound, letter) => {
    const [len, v] = sound.split('-');
    return { value: letter ? len : sound, label: MARK[sound], sub: `${len} ${v}` };
  };

  const quizzes = {
    i: {
      choices: [choice('short-i', true), choice('long-i', true)],
      items: [
        ['pig', '🐷', 'short-i'], ['fish', '🐟', 'short-i'], ['gift', '🎁', 'short-i'],
        ['milk', '🥛', 'short-i'], ['lips', '👄', 'short-i'],
        ['kite', '🪁', 'long-i'], ['bike', '🚲', 'long-i'], ['ice', '🧊', 'long-i'],
        ['pie', '🥧', 'long-i'], ['tiger', '🐯', 'long-i'],
      ].map(([w, p, s]) => item(w, p, s, true)),
    },
    u: {
      choices: [choice('short-u', true), choice('long-u', true)],
      items: [
        ['sun', '☀️', 'short-u'], ['bug', '🐛', 'short-u'], ['duck', '🦆', 'short-u'],
        ['bus', '🚌', 'short-u'], ['drum', '🥁', 'short-u'],
        ['unicorn', '🦄', 'long-u'], ['music', '🎵', 'long-u'], ['cube', 'cube', 'long-u'],
        ['computer', '💻', 'long-u'],
      ].map(([w, p, s]) => item(w, p, s, true)),
    },
    // One-syllable words only, so each word has just the one vowel sound to listen for.
    mixed: {
      ask: 'Which vowel sound do you hear?',
      choices: ['short-i', 'long-i', 'short-u', 'long-u'].map((s) => choice(s, false)),
      items: [
        ['brick', '🧱', 'short-i'], ['chick', '🐤', 'short-i'],
        ['fire', '🔥', 'long-i'], ['tie', '👔', 'long-i'],
        ['truck', '🚚', 'short-u'], ['cup', '🥤', 'short-u'],
        ['cube', 'cube', 'long-u'],
      ].map(([w, p, s]) => item(w, p, s, false)),
    },
  };

  // Every vowel sound, for "show the action".
  const SOUNDS = [
    ['ă', 'short a, like apple'], ['ā', 'long a, it says its name'],
    ['ĕ', 'short e, like edge'], ['ē', 'long e, it says its name'],
    ['ĭ', 'short i, like itch'], ['ī', 'long i, it says its name'],
    ['ŏ', 'short o, like octopus'], ['ō', 'long o, it says its name'],
    ['ŭ', 'short u, like up'], ['ū', 'long u, it says its name'],
  ];

  (globalThis.LESSONS = globalThis.LESSONS || {})['vowels-long-short-i-u'] = { quizzes, SOUNDS };
  if (typeof document === 'undefined') return;

  Lesson.init();
  Lesson.mountQuizzes(quizzes);

  const prompt = document.getElementById('action-prompt');
  let last = -1;
  document.getElementById('action-btn').addEventListener('click', () => {
    let i;
    do i = Math.floor(Math.random() * SOUNDS.length); while (i === last);
    last = i;
    const [mark, name] = SOUNDS[i];
    prompt.textContent = '';
    prompt.append(Lesson.el('span', { class: 'mark', text: mark }), ` Show the action for ${name}!`);
    Lesson.speak(`Show the action for ${name}!`);
  });
})();
