/* Shared lesson code: read-aloud, the multiple-choice quiz every lesson uses, and a little
 * celebration. Attaches to globalThis.Lesson. The pure parts (shuffle, checkQuiz) also run in
 * Node for the tests; everything that touches the page waits for Lesson.init().
 * Nothing is saved anywhere: a refresh starts every activity fresh.
 */
(function (L) {
  'use strict';

  // ---------- pure helpers ----------

  // Fisher-Yates. Pass rand for repeatable tests; the page uses Math.random.
  L.shuffle = function (list, rand) {
    const r = rand || Math.random;
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  L.normChoices = function (choices) {
    return (choices || []).map((c) => (typeof c === 'string' ? { value: c, label: c } : c));
  };

  // Plain text of an item's word, with blanks as "blank" (for speaking) or "___" (for display).
  L.wordText = function (word, blank) {
    if (Array.isArray(word)) return word.map((p) => (p === null ? blank : p)).join('');
    return word || '';
  };

  // Problems with a quiz's data, as readable strings; an empty list means it's fine.
  L.checkQuiz = function (quiz) {
    const errs = [];
    const items = quiz.items || [];
    if (!items.length) errs.push('no items');
    items.forEach((it, i) => {
      const tag = `item ${i + 1} (${L.wordText(it.word, '_') || it.say || '?'})`;
      const choices = L.normChoices(it.choices || quiz.choices);
      if (choices.length < 2) errs.push(`${tag}: fewer than two choices`);
      const values = choices.map((c) => c.value);
      if (new Set(values).size !== values.length) errs.push(`${tag}: duplicate choices`);
      if (!values.includes(it.answer)) errs.push(`${tag}: answer "${it.answer}" is not a choice`);
      if (!it.word && !it.say) errs.push(`${tag}: nothing to show or say`);
      if (it.hideWord && !it.say) errs.push(`${tag}: hidden word with nothing to say`);
    });
    return errs;
  };

  // ---------- speech ----------

  const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  let voice = null;
  let autoRead = true;

  function pickVoice() {
    if (!synth) return;
    const en = synth.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
    // Prefer voices that run on the device, so nothing spoken leaves it.
    voice = en.find((v) => v.localService && /en[-_]US/i.test(v.lang))
      || en.find((v) => v.localService)
      || en.find((v) => /en[-_]US/i.test(v.lang))
      || en[0] || null;
  }

  L.canSpeak = function () { return !!synth; };

  // Speak now, cutting off anything still being said.
  L.speak = function (text) {
    if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
    u.rate = 0.85;
    u.pitch = 1.05;
    synth.speak(u);
  };

  // Speak only if auto-read is on (used for things the page says on its own).
  L.autoSpeak = function (text) {
    if (autoRead) L.speak(text);
  };

  // ---------- small DOM helpers ----------

  L.el = function (tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of [].concat(kids || [])) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  };

  // Interface icons are drawn, not emoji. Authored here, so innerHTML is safe.
  const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 9.2h3.8L12 5.3v13.4l-4.7-3.9H3.5z" fill="currentColor"/><path d="M15.2 9a4.2 4.2 0 0 1 0 6M17.8 6.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  L.speakerIcon = function () {
    const s = L.el('span', { class: 'icon' });
    s.innerHTML = SPEAKER;
    return s;
  };

  L.sayButton = function (text, label) {
    return L.el('button', {
      type: 'button', class: 'say', 'aria-label': label || 'Hear it', title: label || 'Hear it',
      onclick: () => L.speak(typeof text === 'function' ? text() : text),
    }, L.speakerIcon());
  };

  // Drawings for quiz pictures that no emoji shows well.
  L.pictures = {
    listen: SPEAKER.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" class="listen"'),
    cube: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12 86 30 50 48 14 30Z" fill="#8fc1ff"/><path d="M14 30 50 48V90L14 72Z" fill="#3d7fe0"/><path d="M86 30 50 48V90L86 72Z" fill="#2459a8"/><path d="M50 12 86 30V72L50 90 14 72V30ZM14 30 50 48 86 30M50 48V90" fill="none" stroke="#173a70" stroke-width="3" stroke-linejoin="round"/></svg>',
    edge: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 40H90V50H10Z" fill="#c98a4b"/><path d="M18 50H26V88H18ZM74 50H82V88H74Z" fill="#a5672d"/><path d="M8 38H92" stroke="#e8432e" stroke-width="7" stroke-linecap="round"/><path d="M60 22 68 32" stroke="#e8432e" stroke-width="4" stroke-linecap="round"/><path d="M66 18 70 30" stroke="#e8432e" stroke-width="4" stroke-linecap="round"/></svg>',
  };

  L.picture = function (pic) {
    const box = L.el('div', { class: 'quiz-pic', 'aria-hidden': 'true' });
    if (pic && L.pictures[pic]) box.innerHTML = L.pictures[pic];
    else box.textContent = pic || '';
    return box;
  };

  // A shower of stars, unless the device asks for less motion.
  L.burst = function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const b = L.el('div', { class: 'burst', 'aria-hidden': 'true' });
    for (let i = 0; i < 18; i++) {
      const s = L.el('span', { class: `c${i % 3}`, text: '★' });
      s.style.left = `${Math.random() * 96}%`;
      s.style.animationDelay = `${Math.random() * 0.5}s`;
      b.append(s);
    }
    document.body.append(b);
    setTimeout(() => b.remove(), 2400);
  };

  // ---------- the quiz ----------
  // opts: { items, choices, ask, shuffle (default true), autoSay (default true) }
  // item: { word, pic, say, hideWord, sentence, choices, answer, yes, hint, help }
  // word is a string, or an array where null marks a blank: ['__', null] -> "ship" with "sh" missing.
  L.quiz = function (root, opts) {
    const cheers = ['Yes!', 'You got it!', 'Great job!', 'Nice!', 'Super!'];
    let order, at, stars, tries;

    function start(speakFirst) {
      order = opts.shuffle === false ? opts.items.slice() : L.shuffle(opts.items);
      at = 0;
      stars = 0;
      show(speakFirst);
    }

    function show(speakNow) {
      const it = order[at];
      tries = 0;
      root.textContent = '';
      const sayText = it.say || L.wordText(it.word, 'blank');
      const card = L.el('div', { class: 'quiz-card' }, [
        L.picture(it.pic),
        it.hideWord ? null : wordNode(it),
        it.help ? L.el('p', { class: 'quiz-help', text: it.help }) : null,
        L.el('button', {
          type: 'button', class: 'say wide',
          onclick: () => L.speak(sayText),
        }, [L.speakerIcon(), L.el('span', { text: it.hideWord ? 'Hear the word' : 'Hear it' })]),
      ]);
      // With no speech at all, a listening question needs a grown-up to read the word.
      if (it.hideWord && !L.canSpeak()) {
        card.append(L.el('p', { class: 'quiz-help', text: `Grown-up: read this word out loud: "${sayText}"` }));
      }
      const fb = L.el('p', { class: 'feedback', 'aria-live': 'polite' });
      const next = L.el('div', { class: 'quiz-next' });
      const choices = L.normChoices(it.choices || opts.choices);
      const shown = opts.shuffleChoices ? L.shuffle(choices) : choices;
      const btns = shown.map((c) => L.el('button', {
        type: 'button', class: 'choice', 'data-value': c.value,
        onclick: (e) => pick(c, e.currentTarget),
      }, [c.label, c.sub ? L.el('small', { text: c.sub }) : null]));

      function pick(c, btn) {
        tries++;
        if (c.value === it.answer) {
          btn.classList.add('right');
          btns.forEach((b) => { b.disabled = true; });
          if (tries === 1) stars++;
          const msg = it.yes || cheers[Math.floor(Math.random() * cheers.length)];
          fb.className = 'feedback good';
          fb.textContent = msg;
          L.autoSpeak(msg);
          paintTop();
          const last = at === order.length - 1;
          const nb = L.el('button', {
            type: 'button', class: 'btn',
            onclick: () => { if (last) done(); else { at++; show(true); } },
          }, last ? 'Finish' : 'Next →');
          next.append(nb);
          nb.focus({ preventScroll: true });
        } else {
          btn.classList.add('wrong');
          btn.disabled = true;
          const msg = it.hint && tries > 1 ? it.hint : (tries > 1 ? 'Try another one!' : 'Not quite. Try again!');
          fb.className = 'feedback try';
          fb.textContent = msg;
          L.autoSpeak(msg);
          card.classList.remove('wiggle');
          void card.offsetWidth;
          card.classList.add('wiggle');
        }
      }

      const top = L.el('div', { class: 'quiz-top' }, [
        L.el('span', { class: 'quiz-count' }),
        L.el('span', { class: 'quiz-stars' }),
      ]);
      function paintTop() {
        top.firstChild.textContent = `${at + 1} of ${order.length}`;
        top.lastChild.textContent = '★'.repeat(stars);
        top.lastChild.setAttribute('aria-label', `${stars} ${stars === 1 ? 'star' : 'stars'}`);
      }
      paintTop();
      const ask = it.ask || opts.ask;
      root.append(top, card);
      if (ask) root.append(L.el('p', { class: 'quiz-ask', text: ask }));
      root.append(L.el('div', { class: 'quiz-choices', role: 'group', 'aria-label': 'Answers' }, btns), fb, next);
      if (speakNow && opts.autoSay !== false) L.autoSpeak(sayText);
    }

    function wordNode(it) {
      const p = L.el('p', { class: 'quiz-word' + (it.sentence ? ' quiz-sentence' : '') });
      if (Array.isArray(it.word)) {
        it.word.forEach((part) => {
          p.append(part === null ? L.el('span', { class: 'blank', 'aria-label': 'blank', text: ' ' }) : part);
        });
      } else p.textContent = it.word;
      return p;
    }

    function done() {
      root.textContent = '';
      const all = stars === order.length;
      const msg = all ? `You did it! ${stars} stars!` : `You did it! You got ${stars} ${stars === 1 ? 'star' : 'stars'}.`;
      const again = L.el('button', { type: 'button', class: 'btn', onclick: () => start(true) }, 'Play again ↻');
      root.append(L.el('div', { class: 'quiz-done' }, [
        L.el('span', { class: 'big', 'aria-hidden': 'true', text: '★' }),
        L.el('p', { text: msg }),
        L.el('p', { class: 'quiz-help', text: 'A star means you got it on the first try.' }),
        L.el('div', { class: 'row' }, again),
      ]));
      L.autoSpeak(msg);
      L.burst();
      again.focus({ preventScroll: true });
    }

    start(false);
  };

  // Mount every <div data-quiz="name"> on the page with quizzes[name].
  L.mountQuizzes = function (quizzes) {
    document.querySelectorAll('[data-quiz]').forEach((el) => L.quiz(el, quizzes[el.dataset.quiz]));
  };

  // ---------- page setup ----------

  L.init = function () {
    if (synth) {
      pickVoice();
      if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', pickVoice);
    } else {
      document.documentElement.classList.add('no-speech');
    }
    // Buttons in the page's HTML that talk: any button with data-say reads it out, and a .say
    // button in a .say-line with no data-say reads the text beside it.
    document.querySelectorAll('button[data-say], .say-line > button.say').forEach((b) => {
      b.type = 'button';
      if (b.classList.contains('say')) {
        if (!b.textContent.trim()) b.append(L.speakerIcon());
        if (!b.hasAttribute('aria-label')) b.setAttribute('aria-label', 'Read this out loud');
        b.title = b.getAttribute('aria-label');
      }
      b.addEventListener('click', () => {
        let text = b.dataset.say;
        if (!text) {
          const line = b.closest('.say-line');
          text = [...line.children].filter((c) => c !== b).map((c) => c.textContent).join(' ');
        }
        L.speak(text.replace(/\s+/g, ' ').trim());
      });
    });
    // <span data-pic="edge"> placeholders get their drawing.
    document.querySelectorAll('[data-pic]').forEach((n) => {
      if (L.pictures[n.dataset.pic]) n.innerHTML = L.pictures[n.dataset.pic];
    });
    const toggle = document.querySelector('.read-toggle');
    if (toggle) {
      if (!synth) toggle.hidden = true;
      const paint = () => {
        toggle.setAttribute('aria-pressed', String(autoRead));
        toggle.textContent = autoRead ? 'Auto-read: on' : 'Auto-read: off';
      };
      toggle.addEventListener('click', () => {
        autoRead = !autoRead;
        if (!autoRead && synth) synth.cancel();
        paint();
      });
      paint();
    }
  };
})(globalThis.Lesson = globalThis.Lesson || {});
