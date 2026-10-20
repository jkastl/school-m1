/* Letter tracing: the geometry and scoring (pure, tested in Node) and the tracing stage that
 * handwriting lessons mount. Needs shared/letters.js (globalThis.Letters) and, on a page,
 * shared/lesson.js. Attaches to globalThis.Trace.
 */
(function (T) {
  'use strict';
  const RAD = Math.PI / 180;
  const NS = 'http://www.w3.org/2000/svg';

  // ---------- geometry ----------

  // Points along one segment from its start to its end (arcs every 2 degrees).
  T.segPoints = function (seg) {
    if (seg[0] === 'line') {
      const [, x1, y1, x2, y2] = seg;
      return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    }
    const [, cx, cy, rx, ry, a0, a1] = seg;
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 2));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = (a0 + ((a1 - a0) * i) / n) * RAD;
      pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    }
    return pts;
  };

  const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

  T.length = function (pts) {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
    return s;
  };

  // The same path with a point every `step` units, so short and long moves weigh the same.
  T.resample = function (pts, step) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = dist(a, b);
      let t = step - carry;
      while (t <= d) {
        out.push({ x: a.x + ((b.x - a.x) * t) / d, y: a.y + ((b.y - a.y) * t) / d });
        t += step;
      }
      carry = d - (t - step);
    }
    const last = pts[pts.length - 1];
    if (dist(out[out.length - 1], last) > 1e-6) out.push(last);
    return out;
  };

  const r1 = (v) => Math.round(v * 10) / 10;
  T.pathD = function (seg) {
    return T.segPoints(seg).map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join(' ');
  };

  T.target = function (shape, step) {
    return [].concat(...shape.steps.map((s) => T.resample(T.segPoints(s.seg), step || 3)));
  };

  T.bounds = function (shape) {
    const pts = T.target(shape, 1);
    return {
      top: Math.min(...pts.map((p) => p.y)),
      bottom: Math.max(...pts.map((p) => p.y)),
      left: Math.min(...pts.map((p) => p.x)),
      right: Math.max(...pts.map((p) => p.x)),
    };
  };

  // How well some strokes (lists of points) cover a letter.
  //   coverage: share of the letter with ink within r of it
  //   precision: share of the ink within 1.6 r of the letter
  T.score = function (target, strokes, r) {
    const rr = r || 10;
    const ink = [].concat(...strokes.filter((s) => s.length).map((s) => T.resample(s, 2)));
    if (!ink.length) return { inked: false, coverage: 0, precision: 0, stars: 0 };
    const near = (p, list, lim) => list.some((q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 <= lim * lim);
    const coverage = target.filter((p) => near(p, ink, rr)).length / target.length;
    const precision = ink.filter((q) => near(q, target, rr * 1.6)).length / ink.length;
    let stars = 0;
    if (coverage >= 0.85 && precision >= 0.75) stars = 3;
    else if (coverage >= 0.6 && precision >= 0.5) stars = 2;
    else if (coverage >= 0.2) stars = 1;
    return { inked: true, coverage, precision, stars };
  };

  // Kind words for a score. started: whether the first stroke began near the green dot.
  T.message = function (score, started) {
    if (!score.inked) return 'Trace the letter with your finger first. Start at the green dot!';
    if (!score.stars) return 'Hmm, that isn\'t on the letter yet. Start at the green dot and follow the gray letter.';
    let msg;
    if (score.stars === 3) msg = 'Out of this world!';
    else if (score.stars === 2) msg = score.coverage < 0.85 ? 'Nice work! Try to touch every part of the letter.' : 'Nice work! Try to stay on the gray letter.';
    else msg = 'Good try! Follow the gray letter from the green dot.';
    if (score.stars > 1) msg += started ? ' You started at the green dot, too.' : ' Next time, start at the green dot.';
    return msg;
  };

  // ---------- the tracing stage ----------

  // The class's markers for the three lines, drawn around (0, 0) in a 20 by 20 box.
  const STAR = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 3.6 : 8.6, a = (-90 + i * 36) * RAD;
    return `${r1(r * Math.cos(a))} ${r1(r * Math.sin(a))}`;
  }).join(' ');
  T.ICONS = {
    star: `<path d="M${STAR}Z" fill="#f2b705"/>`,
    moon: '<path d="M4 -6.93A8 8 0 1 0 4 6.93A8.5 8.5 0 0 1 4 -6.93Z" fill="#2a9d96"/>',
    earth: '<circle r="8" fill="#2f74d0"/><ellipse cx="-2.6" cy="-2.2" rx="3.3" ry="2.5" fill="#3aa75b"/><ellipse cx="3.2" cy="3.4" rx="2.7" ry="2" fill="#3aa75b"/>',
  };

  function svg(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    return n;
  }

  // opts: { letters: ['O', 'o', ...], words: { O: 'text shown under the stage', ... } }
  T.mount = function (root, opts) {
    const Lz = globalThis.Lesson;
    const LN = globalThis.Letters.LINES;
    const { width: W, height: H } = globalThis.Letters.SIZE;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shape, key, strokes = [], drawing = null, playToken = 0, solo = false;

    // Letter picker.
    const picks = Lz.el('div', { class: 'letter-picks', role: 'group', 'aria-label': 'Pick a letter' });
    opts.letters.forEach((k) => {
      picks.append(Lz.el('button', {
        type: 'button', class: 'letter-pick', 'aria-pressed': 'false', 'aria-label': globalThis.Letters.shapes[k].say,
        'data-letter': k, onclick: () => choose(k, true),
      }, k));
    });

    // The stage: lines, the gray letter with arrows and numbers, the demo, and the child's ink.
    const stage = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'trace-svg', role: 'img' });
    const lines = svg('g', { class: 'g-lines' });
    ['star', 'moon', 'earth'].forEach((name) => {
      const y = LN[name];
      lines.append(svg('line', { x1: 34, y1: y, x2: W - 4, y2: y, class: `g-line g-${name}` }));
      const g = svg('g', { transform: `translate(16 ${y})` });
      g.innerHTML = T.ICONS[name];
      lines.append(g);
    });
    // The same markers wherever the page asks for one: <span data-line-icon="moon">.
    document.querySelectorAll('[data-line-icon]').forEach((n) => {
      n.innerHTML = `<svg viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">${T.ICONS[n.dataset.lineIcon]}</svg>`;
    });
    const ghost = svg('g', { class: 'g-ghost' });
    const marks = svg('g', { class: 'g-marks' });
    const demo = svg('g', { class: 'g-demo' });
    const ink = svg('g', { class: 'g-ink' });
    const tip = svg('circle', { r: 5.5, class: 'g-tip', visibility: 'hidden' });
    stage.append(lines, ghost, marks, demo, ink, tip);

    const cue = Lz.el('p', { class: 'trace-cue', 'aria-live': 'polite' });
    const steps = Lz.el('ol', { class: 'trace-steps' });
    const result = Lz.el('p', { class: 'feedback', 'aria-live': 'polite' });
    const words = Lz.el('p', { class: 'trace-words' });
    const showBtn = Lz.el('button', { type: 'button', class: 'btn', onclick: play }, 'Show me');
    const clearBtn = Lz.el('button', { type: 'button', class: 'btn ghost', onclick: clear }, 'Clear');
    const checkBtn = Lz.el('button', { type: 'button', class: 'btn ghost', onclick: check }, 'How did I do?');
    const soloBtn = Lz.el('button', {
      type: 'button', class: 'btn ghost', 'aria-pressed': 'false',
      onclick: () => { solo = !solo; soloBtn.setAttribute('aria-pressed', String(solo)); root.classList.toggle('solo', solo); },
    }, 'Hide the gray letter');

    root.append(
      picks,
      Lz.el('div', { class: 'trace-main' }, [
        Lz.el('div', { class: 'trace-stage' }, [stage, words]),
        Lz.el('div', { class: 'trace-side' }, [
          cue,
          Lz.el('div', { class: 'row' }, [showBtn, clearBtn]),
          Lz.el('div', { class: 'row' }, [checkBtn, soloBtn]),
          result,
          steps,
        ]),
      ]),
    );

    function choose(k, fromClick) {
      key = k;
      shape = globalThis.Letters.shapes[k];
      playToken++;
      picks.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.letter === k)));
      stage.setAttribute('aria-label', `Writing lines with ${shape.say} to trace`);
      ghost.textContent = '';
      marks.textContent = '';
      steps.textContent = '';
      const b = T.bounds(shape);
      const mid = { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 };
      const placed = [];
      shape.steps.forEach((s, i) => {
        ghost.append(svg('path', { d: T.pathD(s.seg), class: 'ghost' }));
        arrow(s.seg, s.arrowAt !== undefined ? s.arrowAt : (s.seg[0] === 'arc' ? 0.2 : 0.35));
        if (i === 0 || shape.steps[i - 1].n !== s.n) number(s, i, mid, placed);
        const say = `${s.cue}. ${s.tip}`;
        steps.append(Lz.el('li', { 'data-n': s.n }, [
          Lz.sayButton(say, `Hear step ${i + 1}`),
          Lz.el('span', {}, [Lz.el('strong', { text: s.cue }), ' ', s.tip]),
        ]));
      });
      words.textContent = (opts.words && opts.words[k]) || '';
      cue.textContent = `Watch, then trace ${shape.say}.`;
      clear();
      if (fromClick) Lz.autoSpeak(`${shape.say}. Press show me, then trace it.`);
    }

    // A small arrowhead part way along a move (early on curves, so the way round shows from
    // the start), pointing the way the pencil goes.
    function arrow(seg, at) {
      const pts = T.resample(T.segPoints(seg), 1);
      const i = Math.floor((pts.length - 1) * at);
      const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      marks.append(svg('path', {
        d: 'M-5 -5 L4 0 L-5 5', class: 'g-arrow',
        transform: `translate(${r1(pts[i].x)} ${r1(pts[i].y)}) rotate(${r1(ang)})`,
      }));
    }

    // A stroke's number sits just outside the letter (or at s.num), with a dot where the pencil
    // goes down. A stroke that carries straight on from the last one gets no second dot.
    function number(s, i, mid, placed) {
      const p = T.segPoints(s.seg)[0];
      const prev = i > 0 && T.segPoints(shape.steps[i - 1].seg).slice(-1)[0];
      const lifted = !prev || Math.hypot(prev.x - p.x, prev.y - p.y) > 1;
      if (lifted) marks.append(svg('circle', { cx: r1(p.x), cy: r1(p.y), r: i === 0 ? 7 : 5, class: i === 0 ? 'g-start' : 'g-dot' }));
      let at;
      if (s.num) at = { x: s.num[0], y: s.num[1] };
      else {
        const dx = p.x - mid.x, dy = p.y - mid.y, d = Math.hypot(dx, dy) || 1;
        // Step further out until it clears the numbers already placed.
        for (let k = 15; k < 60; k += 6) {
          at = { x: p.x + (dx / d) * k, y: p.y + (dy / d) * k };
          if (!placed.some((q) => Math.hypot(q.x - at.x, q.y - at.y) < 16)) break;
        }
      }
      placed.push(at);
      const t = svg('text', { x: r1(at.x), y: r1(at.y), class: 'g-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = s.n;
      marks.append(t);
    }

    function clear() {
      strokes = [];
      ink.textContent = '';
      demo.textContent = '';
      result.textContent = '';
      result.className = 'feedback';
      tip.setAttribute('visibility', 'hidden');
      playToken++;
      steps.querySelectorAll('li').forEach((li) => li.classList.remove('now'));
    }

    const wait = (ms) => new Promise((res) => setTimeout(res, ms));

    async function play() {
      clear();
      const token = playToken;
      const items = [...steps.children];
      for (let i = 0; i < shape.steps.length; i++) {
        if (token !== playToken) return;
        const s = shape.steps[i];
        items.forEach((li, j) => li.classList.toggle('now', j === i));
        cue.textContent = `${i + 1}. ${s.cue}`;
        Lz.autoSpeak(s.cue);
        await wait(reduced ? 900 : 450);
        if (token !== playToken) return;
        const path = svg('path', { d: T.pathD(s.seg), class: 'demo' });
        demo.append(path);
        const len = path.getTotalLength();
        if (reduced) { await wait(700); continue; }
        path.style.strokeDasharray = `${len} ${len}`;
        path.style.strokeDashoffset = len;
        tip.setAttribute('visibility', 'visible');
        const ms = Math.max(600, (len / 95) * 1000);
        const t0 = performance.now();
        await new Promise((res) => {
          function frame(now) {
            if (token !== playToken) return res();
            const k = Math.min(1, (now - t0) / ms);
            path.style.strokeDashoffset = len * (1 - k);
            const p = path.getPointAtLength(len * k);
            tip.setAttribute('cx', r1(p.x));
            tip.setAttribute('cy', r1(p.y));
            if (k < 1) requestAnimationFrame(frame); else res();
          }
          requestAnimationFrame(frame);
        });
        await wait(250);
      }
      if (token !== playToken) return;
      tip.setAttribute('visibility', 'hidden');
      items.forEach((li) => li.classList.remove('now'));
      cue.textContent = `Your turn! Trace ${shape.say}, starting at the green dot.`;
      Lz.autoSpeak('Your turn! Start at the green dot.');
    }

    function check() {
      const sc = T.score(T.target(shape, 3), strokes.map((s) => s.pts), 10);
      const first = T.segPoints(shape.steps[0].seg)[0];
      const begin = strokes.length && strokes[0].pts[0];
      const started = !!begin && Math.hypot(begin.x - first.x, begin.y - first.y) <= 20;
      const msg = T.message(sc, started);
      result.className = 'feedback ' + (sc.stars >= 2 ? 'good' : 'try');
      result.textContent = (sc.stars ? '★'.repeat(sc.stars) + ' ' : '') + msg;
      Lz.autoSpeak(msg);
      if (sc.stars === 3) Lz.burst();
    }

    // Drawing: one pointer at a time (a palm or second finger is ignored).
    function toSvg(e) {
      const m = stage.getScreenCTM().inverse();
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
      return { x: r1(p.x), y: r1(p.y) };
    }
    stage.addEventListener('pointerdown', (e) => {
      if (drawing || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      // Drawing stops the demo and wipes it, so the child traces over the gray letter.
      playToken++;
      demo.textContent = '';
      tip.setAttribute('visibility', 'hidden');
      steps.querySelectorAll('li').forEach((li) => li.classList.remove('now'));
      stage.setPointerCapture(e.pointerId);
      const line = svg('polyline', { class: 'ink' });
      ink.append(line);
      drawing = { id: e.pointerId, line, pts: [toSvg(e)] };
      strokes.push(drawing);
      line.setAttribute('points', `${drawing.pts[0].x},${drawing.pts[0].y}`);
      result.textContent = '';
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drawing || e.pointerId !== drawing.id) return;
      const p = toSvg(e);
      const last = drawing.pts[drawing.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1) return;
      drawing.pts.push(p);
      drawing.line.setAttribute('points', drawing.pts.map((q) => `${q.x},${q.y}`).join(' '));
    });
    const end = (e) => { if (drawing && e.pointerId === drawing.id) drawing = null; };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    choose(opts.letters[0], false);
  };
})(globalThis.Trace = globalThis.Trace || {});
