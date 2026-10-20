/* Handwriting: O o, H h, L l, G g. The shapes live in shared/letters.js; this lesson picks
 * which letters to show and the words under each one. */
(function () {
  'use strict';

  const letters = ['O', 'o', 'H', 'h', 'L', 'l', 'G', 'g'];
  const words = {
    O: 'Octopus · Owl · Orange',
    o: 'octopus · dog · fox',
    H: 'House · Hat · Horse',
    h: 'hat · house · fish',
    L: 'Lion · Lemon · Leaf',
    l: 'lion · lemon · bell',
    G: 'Goat · Gift · Grapes',
    g: 'goat · pig · frog',
  };

  (globalThis.LESSONS = globalThis.LESSONS || {})['handwriting-o-h-l-g'] = { letters, words };
  if (typeof document === 'undefined') return;

  Lesson.init();
  Trace.mount(document.getElementById('trace'), { letters, words });
})();
