// Letter shapes sit on the right lines, and tracing scores behave.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.join(__dirname, '..', 'shared', 'letters.js'));
require(path.join(__dirname, '..', 'shared', 'trace.js'));
const { shapes, LINES, SIZE } = globalThis.Letters;
const T = globalThis.Trace;

const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;

test('letters sit on the star, moon and earth lines', () => {
  for (const [k, s] of Object.entries(shapes)) {
    const b = T.bounds(s);
    const top = s.size === 'tall' ? LINES.star : LINES.moon;
    assert.ok(near(b.top, top), `${k}: top ${b.top}, want ${top}`);
    if (s.size === 'tail') {
      assert.ok(b.bottom > LINES.earth + 20 && b.bottom <= LINES.bottom, `${k}: should plunge past the earth line (${b.bottom})`);
    } else {
      assert.ok(near(b.bottom, LINES.earth, 7), `${k}: bottom ${b.bottom}, want ${LINES.earth}`);
    }
    assert.ok(b.left >= 40 && b.right <= SIZE.width - 10, `${k}: stays clear of the icons and the edge`);
  }
});

test('steps are numbered in order and connected within a stroke', () => {
  for (const [k, s] of Object.entries(shapes)) {
    assert.equal(s.steps[0].n, 1, k);
    s.steps.forEach((st, i) => {
      assert.ok(st.cue && st.tip, `${k} step ${i + 1}: cue and tip`);
      if (!i) return;
      const prev = s.steps[i - 1];
      assert.ok(st.n === prev.n || st.n === prev.n + 1, `${k} step ${i + 1}: number jumps`);
      if (st.n === prev.n) {
        const end = T.segPoints(prev.seg).slice(-1)[0];
        const start = T.segPoints(st.seg)[0];
        assert.ok(Math.hypot(end.x - start.x, end.y - start.y) < 0.5, `${k} step ${i + 1}: doesn't start where the last one ended`);
      }
    });
  }
});

test('circles go counterclockwise from the top, like Orbit Planet O', () => {
  for (const k of ['O', 'o']) {
    const pts = T.segPoints(shapes[k].steps[0].seg);
    assert.ok(near(pts[0].y, k === 'O' ? LINES.star : LINES.moon), `${k}: starts at the top`);
    assert.ok(pts[5].x < pts[0].x, `${k}: heads left first`);
  }
});

test('resample spaces points evenly and keeps both ends', () => {
  const pts = T.resample([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 7 }], 2);
  assert.deepEqual(pts[0], { x: 0, y: 0 });
  assert.deepEqual(pts[pts.length - 1], { x: 10, y: 7 });
  for (let i = 1; i < pts.length - 1; i++) {
    assert.ok(Math.abs(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) - 2) < 1e-9);
  }
  assert.ok(near(T.length(pts), 17, 1.5));
});

test('a careful trace gets three stars', () => {
  for (const [k, s] of Object.entries(shapes)) {
    const strokes = s.steps.map((st) => T.resample(T.segPoints(st.seg), 5));
    const sc = T.score(T.target(s), strokes, 10);
    assert.equal(sc.stars, 3, `${k}: ${JSON.stringify(sc)}`);
  }
});

test('a wobbly trace still counts, a far-off one does not', () => {
  const O = shapes.O;
  const pts = T.resample(T.segPoints(O.steps[0].seg), 3);
  const wobbly = pts.map((p, i) => ({ x: p.x + (i % 2 ? 6 : -6), y: p.y }));
  assert.equal(T.score(T.target(O), [wobbly], 10).stars, 3);
  const shifted = pts.map((p) => ({ x: p.x + 30, y: p.y }));
  assert.ok(T.score(T.target(O), [shifted], 10).stars <= 1);
});

test('half a letter, the wrong letter, a scribble and nothing', () => {
  const O = shapes.O;
  const half = T.resample(T.segPoints(['arc', 135, 90, 52, 60, -90, -270]), 3);
  assert.equal(T.score(T.target(O), [half], 10).stars, 1);

  const l = shapes.l.steps.map((st) => T.resample(T.segPoints(st.seg), 3));
  assert.ok(T.score(T.target(shapes.H), l, 10).stars < 3, 'an l is not an H');

  const scribble = T.score(T.target(O), [[{ x: 40, y: 200 }, { x: 70, y: 205 }]], 10);
  assert.deepEqual([scribble.inked, scribble.stars], [true, 0]);

  const none = T.score(T.target(O), [], 10);
  assert.deepEqual([none.inked, none.stars], [false, 0]);
});

test('messages fit the score', () => {
  assert.match(T.message({ inked: false, stars: 0 }), /first/);
  assert.match(T.message({ inked: true, stars: 0 }), /isn't on the letter/);
  assert.match(T.message({ inked: true, stars: 1, coverage: 0.4 }), /Good try/);
  assert.match(T.message({ inked: true, stars: 2, coverage: 0.7 }, true), /touch every part.*green dot, too/);
  assert.match(T.message({ inked: true, stars: 2, coverage: 0.9 }, false), /stay on the gray letter.*Next time/);
  assert.match(T.message({ inked: true, stars: 3, coverage: 1 }, true), /Out of this world/);
});
