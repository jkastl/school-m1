/* Letter shapes for handwriting lessons, drawn on three lines: the star line (top), the moon
 * line (dashed middle) and the earth line (bottom). Coordinates are in the trace stage's
 * viewBox (0 0 240 215), y pointing down. Attaches to globalThis.Letters.
 *
 * Each letter is a list of steps, in writing order. A step is one move of the pencil:
 *   n    stroke number shown on the guide (a new number means a new stroke)
 *   cue  the short classroom-style cue, said out loud while it draws
 *   tip  the same move in plain words
 *   seg  ['line', x1, y1, x2, y2] or ['arc', cx, cy, rx, ry, fromDeg, toDeg]
 *   num      optional [x, y] for the stroke number, when the spot just outside the letter is crowded
 *   arrowAt  optional spot for the direction arrow, 0 to 1 along the move (default 0.35, curves 0.2)
 * Arc angles are screen angles: 0 is right, 90 is down. Going from a bigger angle to a smaller
 * one moves counterclockwise, which is how O, G and g are written.
 *
 * To add a letter, add it here (tests check that it sits on the right lines), then list it in
 * the lesson that teaches it.
 */
(function (Letters) {
  'use strict';

  Letters.LINES = { star: 30, moon: 90, earth: 150, bottom: 205 };
  Letters.SIZE = { width: 240, height: 215 };

  Letters.shapes = {
    O: {
      say: 'capital O',
      size: 'tall',
      steps: [
        { n: 1, cue: 'Orbit Planet O', tip: 'Start at the star line. Go left, around, and back to the top.', seg: ['arc', 135, 90, 52, 60, -90, -450] },
      ],
    },
    o: {
      say: 'little o',
      size: 'small',
      steps: [
        { n: 1, cue: 'Orbit around Planet O', tip: 'Start at the moon line. Go left, around, and back to the top.', seg: ['arc', 135, 120, 28, 30, -90, -450] },
      ],
    },
    H: {
      say: 'capital H',
      size: 'tall',
      steps: [
        { n: 1, cue: 'Land the rocket', tip: 'Start at the star line. Go straight down to the earth line.', seg: ['line', 95, 30, 95, 150] },
        { n: 2, cue: 'Land the rocket', tip: 'Start at the star line again. Go straight down.', seg: ['line', 175, 30, 175, 150] },
        { n: 3, cue: 'Thrust forward', tip: 'Go across on the moon line.', seg: ['line', 95, 90, 175, 90] },
      ],
    },
    h: {
      say: 'little h',
      size: 'tall',
      steps: [
        { n: 1, cue: 'Land the rocket', tip: 'Start at the star line. Go straight down.', seg: ['line', 112, 30, 112, 150] },
        { n: 1, cue: 'Take off to the moon', tip: 'Go back up the same line, almost to the moon line.', seg: ['line', 112, 150, 112, 108] },
        { n: 2, cue: 'Thrust forward', tip: 'Make a hump over to the right.', seg: ['arc', 136, 108, 24, 18, 180, 360], num: [136, 128] },
        { n: 2, cue: 'Land the rocket', tip: 'Go straight down to the earth line.', seg: ['line', 160, 108, 160, 150] },
      ],
    },
    L: {
      say: 'capital L',
      size: 'tall',
      steps: [
        { n: 1, cue: 'Land the rocket', tip: 'Start at the star line. Go straight down.', seg: ['line', 105, 30, 105, 150] },
        { n: 2, cue: 'Thrust forward', tip: 'Go across on the earth line.', seg: ['line', 105, 150, 170, 150] },
      ],
    },
    l: {
      say: 'little l',
      size: 'tall',
      steps: [
        { n: 1, cue: 'Land the rocket', tip: 'Start at the star line. Go straight down to the earth line.', seg: ['line', 135, 30, 135, 150] },
      ],
    },
    G: {
      say: 'capital G',
      size: 'tall',
      steps: [
        { n: 1, cue: 'Start to orbit Planet O', tip: 'Start near the top. Go left, down, and around to the moon line.', seg: ['arc', 135, 90, 52, 60, -40, -360] },
        { n: 2, cue: 'Thrust backward', tip: 'Go back in along the moon line.', seg: ['line', 187, 90, 140, 90] },
      ],
    },
    g: {
      say: 'little g',
      size: 'tail',
      steps: [
        { n: 1, cue: 'Orbit Planet O', tip: 'Start just under the moon line. Go left and around.', seg: ['arc', 135, 120, 28, 30, -40, -360], num: [147, 79] },
        { n: 1, cue: 'Take off to the moon', tip: 'Go up to the moon line.', seg: ['line', 163, 120, 163, 90], arrowAt: 0.5 },
        { n: 2, cue: 'Plunge past the Earth', tip: 'Go straight down, past the earth line.', seg: ['line', 163, 90, 163, 180], num: [177, 128], arrowAt: 0.6 },
        { n: 2, cue: 'Curve back. Stop.', tip: 'Hook back to the left and stop.', seg: ['arc', 143, 180, 20, 20, 0, 180] },
      ],
    },
  };
})(globalThis.Letters = globalThis.Letters || {});
