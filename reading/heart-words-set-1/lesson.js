/* Heart Words, set 1. The word list is the one source for the Learn cards and every activity.
 * In parts, a leading * marks a heart (tricky) part: ['w', '*a', '*s'] is "was" with two hearts.
 */
(function () {
  'use strict';

  const WORDS = [
    { word: 'in', parts: ['i', 'n'] },
    { word: 'it', parts: ['i', 't'] },
    { word: 'on', parts: ['o', 'n'] },
    { word: 'is', parts: ['i', '*s'], why: 'The s says /z/.', say: 'is. The s sounds like zzz.' },
    { word: 'for', parts: ['f', '*or'], why: 'The o and r say /or/ together.', say: 'for. The o and r say or.' },
    { word: 'that', parts: ['*th', 'a', 't'], why: 'The t and h say /th/ together. You will learn th soon!', say: 'that. The t and h say th.' },
    { word: 'he', parts: ['h', '*e'], why: 'The e says its name, /ē/.', say: 'he. The e says its name: ee.' },
    { word: 'was', parts: ['w', '*a', '*s'], why: 'The a says /ŭ/ and the s says /z/.', say: 'was. The a sounds like uh, and the s sounds like zzz.' },
    { word: 'his', parts: ['h', 'i', '*s'], why: 'The s says /z/.', say: 'his. The s sounds like zzz.' },
    { word: 'are', parts: ['*are'], why: 'The whole word is the heart part! a, r, e say /ar/.', say: 'are. The whole word is the heart part.' },
  ];

  // Which letters (by index) are in a heart part.
  function heartLetters(w) {
    const out = [];
    let i = 0;
    for (const p of w.parts) {
      const heart = p.startsWith('*');
      const len = heart ? p.length - 1 : p.length;
      for (let k = 0; k < len; k++, i++) if (heart) out.push(i);
    }
    return out;
  }

  const quizzes = {
    listen: {
      ask: 'Tap the word you hear.',
      shuffleChoices: true,
      items: [
        ['is', 'it', 'his', 'in'], ['it', 'is', 'in', 'he'], ['in', 'on', 'it', 'is'],
        ['on', 'in', 'are', 'for'], ['he', 'his', 'is', 'that'], ['his', 'is', 'he', 'was'],
        ['was', 'are', 'his', 'for'], ['for', 'on', 'are', 'that'], ['that', 'he', 'it', 'was'],
        ['are', 'was', 'for', 'on'],
      ].map(([answer, ...others]) => ({
        pic: 'listen', hideWord: true, say: answer, choices: [answer, ...others], answer, yes: `Yes! ${answer}.`,
      })),
    },
    // Each sentence has one choice that fits; the others are heart words that don't.
    sentences: {
      items: [
        { word: ['The cat ', null, ' on the mat.'], pic: '🐱', choices: ['is', 'for', 'he'], answer: 'is', yes: 'The cat is on the mat.' },
        { word: ['This gift is ', null, ' you.'], pic: '🎁', choices: ['are', 'for', 'he'], answer: 'for', yes: 'This gift is for you.' },
        { word: [null, ' is a big dog.'], pic: '🐶', choices: ['Are', 'For', 'That'], answer: 'That', yes: 'That is a big dog.' },
        { word: ['The pigs ', null, ' in the mud.'], pic: '🐷', choices: ['is', 'are', 'his'], answer: 'are', yes: 'The pigs are in the mud.' },
        { word: ['It ', null, ' hot yesterday.'], pic: '☀️', choices: ['was', 'are', 'for'], answer: 'was', yes: 'It was hot yesterday.' },
        { word: [null, ' can run fast.'], pic: '🏃', choices: ['Are', 'He', 'For'], answer: 'He', yes: 'He can run fast.' },
        { word: ['The man got ', null, ' hat.'], pic: '🎩', choices: ['are', 'he', 'his'], answer: 'his', yes: 'The man got his hat.' },
        { word: ['The fish is ', null, ' the tank.'], pic: '🐠', choices: ['in', 'he', 'for'], answer: 'in', yes: 'The fish is in the tank.' },
        { word: ['The bug is ', null, ' the log.'], pic: '🐛', choices: ['are', 'on', 'he'], answer: 'on', yes: 'The bug is on the log.' },
        { word: ['Is ', null, ' a bug?'], pic: '🐞', choices: ['it', 'are', 'for'], answer: 'it', yes: 'Is it a bug?' },
      ].map((it) => ({ ...it, sentence: true, hint: 'Read it with each word. Which one sounds right?' })),
    },
  };

  (globalThis.LESSONS = globalThis.LESSONS || {})['heart-words-set-1'] = { WORDS, quizzes, heartLetters };
  if (typeof document === 'undefined') return;

  const L = Lesson;
  L.init();
  L.mountQuizzes(quizzes);

  // A word as tiles, one per part, with a heart over each tricky part.
  function partTiles(w) {
    return L.el('span', { class: 'tiles' }, w.parts.map((p) => (p.startsWith('*')
      ? L.el('span', { class: 'tile heart', text: p.slice(1) })
      : L.el('span', { class: 'tile', text: p }))));
  }

  // Learn: tap a card to hear the word (and why it's tricky).
  const why = document.getElementById('heart-why');
  WORDS.forEach((w) => {
    const box = document.getElementById(w.why ? 'heart-words' : 'plain-words');
    box.append(L.el('button', {
      type: 'button', class: 'word-card', 'aria-label': w.word,
      onclick: () => {
        L.speak(w.say || w.word);
        if (w.why) why.textContent = `${w.word}: ${w.why}`;
      },
    }, partTiles(w)));
  });

  // Practice 1: find the heart part.
  const finder = document.getElementById('finder');
  let order, at, stars;
  function finderStart() { order = L.shuffle(WORDS); at = 0; stars = 0; finderShow(false); }
  function finderShow(speakNow) {
    const w = order[at];
    const answer = heartLetters(w);
    const picked = new Set();
    let tries = 0;
    finder.textContent = '';
    const top = L.el('div', { class: 'quiz-top' }, [
      L.el('span', { text: `${at + 1} of ${order.length}` }),
      L.el('span', { class: 'quiz-stars', text: '★'.repeat(stars), 'aria-label': `${stars} stars` }),
    ]);
    const letters = [...w.word].map((ch, i) => L.el('button', {
      type: 'button', class: 'tile', 'aria-pressed': 'false', 'aria-label': `letter ${ch}`,
      onclick: (e) => {
        const b = e.currentTarget;
        if (picked.has(i)) picked.delete(i); else picked.add(i);
        b.classList.toggle('picked', picked.has(i));
        b.setAttribute('aria-pressed', String(picked.has(i)));
      },
    }, ch));
    const wordBox = L.el('div', { class: 'tiles finder-letters', role: 'group', 'aria-label': `Letters in ${w.word}` }, letters);
    const card = L.el('div', { class: 'quiz-card' }, [
      wordBox,
      L.el('button', { type: 'button', class: 'say wide', onclick: () => L.speak(w.word) }, [L.speakerIcon(), L.el('span', { text: 'Hear it' })]),
    ]);
    const fb = L.el('p', { class: 'feedback', 'aria-live': 'polite' });
    const next = L.el('div', { class: 'quiz-next' });
    const checkBtn = L.el('button', { type: 'button', class: 'btn', onclick: () => check(false) }, 'Check');
    const noneBtn = L.el('button', { type: 'button', class: 'btn ghost', onclick: () => check(true) }, 'No tricky part');
    const actions = L.el('div', { class: 'row finder-actions' }, [checkBtn, noneBtn]);

    function check(none) {
      const got = none ? [] : [...picked].sort((a, b) => a - b);
      if (!none && !got.length) {
        fb.className = 'feedback try';
        fb.textContent = 'Tap the tricky letters first, or tap No tricky part.';
        L.autoSpeak(fb.textContent);
        return;
      }
      tries++;
      const right = got.length === answer.length && got.every((v, i) => v === answer[i]);
      if (right || tries >= 3) {
        if (right && tries === 1) stars++;
        wordBox.replaceWith(partTiles(w));
        actions.remove();
        fb.className = 'feedback ' + (right ? 'good' : 'try');
        const msg = w.why
          ? `${right ? 'Yes! ' : 'Here it is. '}${w.why}`
          : (right ? 'Yes! No tricky part. You can sound it out.' : 'This one has no tricky part. You can sound it out!');
        fb.textContent = msg;
        L.autoSpeak(right ? (w.why ? `Yes! ${w.say}` : msg) : (w.say || msg));
        top.lastChild.textContent = '★'.repeat(stars);
        top.lastChild.setAttribute('aria-label', `${stars} stars`);
        const last = at === order.length - 1;
        const nb = L.el('button', {
          type: 'button', class: 'btn',
          onclick: () => { if (last) finderDone(); else { at++; finderShow(true); } },
        }, last ? 'Finish' : 'Next →');
        next.append(nb);
        nb.focus({ preventScroll: true });
      } else {
        fb.className = 'feedback try';
        fb.textContent = none
          ? 'Look again. Something in this word sounds different.'
          : answer.length
            ? 'Almost! Say the word slowly. Which letters sound different?'
            : 'Every letter here makes the sound you know. Try No tricky part.';
        L.autoSpeak(fb.textContent);
        card.classList.remove('wiggle');
        void card.offsetWidth;
        card.classList.add('wiggle');
      }
    }

    finder.append(top, card, actions, fb, next);
    if (speakNow) L.autoSpeak(w.word);
  }
  function finderDone() {
    finder.textContent = '';
    const msg = `You did it! You got ${stars} ${stars === 1 ? 'star' : 'stars'}.`;
    const again = L.el('button', { type: 'button', class: 'btn', onclick: finderStart }, 'Play again ↻');
    finder.append(L.el('div', { class: 'quiz-done' }, [
      L.el('span', { class: 'big', 'aria-hidden': 'true', text: '★' }),
      L.el('p', { text: msg }),
      L.el('p', { class: 'quiz-help', text: 'A star means you got it on the first try.' }),
      L.el('div', { class: 'row' }, again),
    ]));
    L.autoSpeak(msg);
    L.burst();
    again.focus({ preventScroll: true });
  }
  finderStart();

  // Practice 4: flash cards. Read it, then check by listening.
  const flash = document.getElementById('flash');
  let deck, card;
  function flashStart() { deck = L.shuffle(WORDS); card = 0; flashShow(); }
  function flashShow() {
    const w = deck[card];
    flash.textContent = '';
    const last = card === deck.length - 1;
    const heard = L.el('p', { class: 'feedback', 'aria-live': 'polite' });
    flash.append(
      L.el('div', { class: 'quiz-top' }, L.el('span', { text: `${card + 1} of ${deck.length}` })),
      L.el('div', { class: 'quiz-card flash-card' }, L.el('p', { class: 'quiz-word flash-word', text: w.word })),
      L.el('div', { class: 'row flash-actions' }, [
        L.el('button', {
          type: 'button', class: 'btn ghost',
          onclick: () => { L.speak(w.word); heard.textContent = `It says “${w.word}”. Did you get it?`; },
        }, [L.speakerIcon(), 'Check']),
        L.el('button', {
          type: 'button', class: 'btn',
          onclick: () => {
            if (!last) { card++; flashShow(); return; }
            flash.textContent = '';
            const again = L.el('button', { type: 'button', class: 'btn', onclick: flashStart }, 'Shuffle and go again ↻');
            flash.append(L.el('div', { class: 'quiz-done' }, [
              L.el('span', { class: 'big', 'aria-hidden': 'true', text: '★' }),
              L.el('p', { text: `You read all ${deck.length} words!` }),
              L.el('div', { class: 'row' }, again),
            ]));
            L.autoSpeak(`You read all ${deck.length} words!`);
            L.burst();
          },
        }, last ? 'Done' : 'Next word →'),
      ]),
      heard,
    );
  }
  flashStart();
})();
