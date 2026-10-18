// Number Tracing: children trace each digit with a finger, stroke by stroke,
// starting at the green dot, the way handwriting is taught (top first, then
// the usual stroke order). Paths are in a 100 x 140 box.

export const BOX = { width: 100, height: 140 };

// Each digit is one or more strokes; each stroke is a polyline.
export const DIGIT_STROKES = {
  0: [[[50, 12], [28, 28], [20, 70], [28, 112], [50, 128], [72, 112], [80, 70], [72, 28], [50, 12]]],
  1: [[[32, 34], [54, 12], [54, 128]]],
  2: [[[24, 40], [34, 18], [54, 10], [72, 20], [76, 42], [62, 70], [24, 128], [80, 128]]],
  3: [[[24, 26], [44, 10], [68, 16], [74, 42], [50, 64], [76, 86], [72, 116], [48, 130], [24, 118]]],
  4: [
    [[60, 12], [22, 90], [84, 90]],
    [[62, 44], [62, 130]],
  ],
  5: [
    [[30, 12], [28, 62], [52, 54], [74, 72], [74, 108], [52, 128], [26, 118]],
    [[30, 12], [78, 12]],
  ],
  6: [[[70, 14], [46, 20], [28, 54], [24, 96], [40, 128], [64, 126], [76, 102], [66, 78], [42, 76], [26, 94]]],
  7: [[[22, 14], [80, 14], [44, 130]]],
  8: [[[70, 26], [50, 10], [30, 24], [34, 50], [66, 82], [74, 110], [50, 130], [26, 110], [34, 82], [66, 50], [70, 26]]],
  9: [[[74, 42], [62, 14], [38, 14], [26, 40], [42, 64], [74, 48], [74, 130]]],
};

// Things to count once a digit is written ("Three! 🐞🐞🐞").
export const COUNT_EMOJI = ['🐞', '🍓', '⭐', '🐟', '🎈', '🍪', '🐥', '🌸', '🚗', '🦋'];

export const STEP = 6;
// How close (in box units) the finger must pass to a checkpoint. Generous:
// small fingers on a tablet wobble (about a third of a stroke's box width).
export const HIT_RADIUS = 18;
// How close the first touch must be to the green start dot.
export const START_RADIUS = 26;
// A stroke counts once this share of its checkpoints were reached in order.
export const COMPLETE_RATIO = 0.9;
// Checkpoints the finger may skip ahead (a quick swipe still counts).
const LOOKAHEAD = 4;
export const DIGITS_PER_ROUND = 5;

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// Evenly spaced checkpoints along a polyline, including both ends.
export function sampleStroke(points, step = STEP) {
  const samples = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [from, to] = [points[i - 1], points[i]];
    const length = distance(from, to);
    const count = Math.max(1, Math.round(length / step));
    for (let k = 1; k <= count; k++) {
      samples.push([from[0] + ((to[0] - from[0]) * k) / count, from[1] + ((to[1] - from[1]) * k) / count]);
    }
  }
  return samples;
}

export function digitCheckpoints(digit) {
  return DIGIT_STROKES[digit].map((stroke) => sampleStroke(stroke));
}

export function startsAtDot(checkpoints, point) {
  return distance(checkpoints[0], point) <= START_RADIUS;
}

// How far along the stroke the finger has got: the index of the next
// checkpoint to reach. Moving near one of the next few checkpoints advances.
export function advance(checkpoints, reached, point) {
  let next = reached;
  for (let i = reached; i < Math.min(checkpoints.length, reached + LOOKAHEAD + 1); i++) {
    if (distance(checkpoints[i], point) <= HIT_RADIUS) next = i + 1;
  }
  return next;
}

export function isStrokeDone(checkpoints, reached) {
  return reached >= Math.ceil(checkpoints.length * COMPLETE_RATIO);
}

// Runs a whole drag (list of points) over a stroke: { started, reached, done }.
export function traceStroke(checkpoints, points) {
  if (!points.length || !startsAtDot(checkpoints, points[0])) return { started: false, reached: 0, done: false };
  const reached = points.reduce((acc, point) => advance(checkpoints, acc, point), 0);
  return { started: true, reached, done: isStrokeDone(checkpoints, reached) };
}

// A round's digits: the level's digits in counting order, then shuffled
// extras if the level is short (e.g. 0-5 plays 1, 2, 3, 4, 5).
export const TRACE_LEVELS = {
  small: [1, 2, 3, 4, 5],
  big: [6, 7, 8, 9, 0],
};

export function makeRound(level) {
  return [...TRACE_LEVELS[level]].slice(0, DIGITS_PER_ROUND);
}

// A digit counts as written well with at most one restart.
export const MAX_RESTARTS_FOR_POINT = 1;

// ---- Pre-writing strokes (Bee Paths) ----
// The strokes digits are built from, in the order children usually master
// copying them (Beery VMI): vertical line (~2y10m), horizontal line (~3y),
// circle (~3y), cross (~4y), diagonals (~4-5y). A gentle rainbow arc sits
// between lines and the circle.
function arc(cx, cy, r, fromDeg, toDeg, steps = 12) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    return [Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))];
  });
}

export const PREWRITING_PATHS = [
  { id: 'down', strokes: [[[50, 14], [50, 126]]] },
  { id: 'across', strokes: [[[12, 70], [88, 70]]] },
  // Over the top from left to right, like a rainbow.
  { id: 'rainbow', strokes: [arc(50, 92, 38, 180, 360)] },
  // Counter-clockwise from the top, the way letters like c, o and a start.
  { id: 'circle', strokes: [arc(50, 70, 36, 270, -90, 20)] },
  { id: 'cross', strokes: [[[50, 20], [50, 120]], [[14, 70], [86, 70]]] },
  { id: 'slide', strokes: [[[16, 22], [84, 118]]] },
];

export function pathCheckpoints(path) {
  return path.strokes.map((stroke) => sampleStroke(stroke));
}

// ---- Number pools for the writing games ----
// 1-5 to start; once Write 1 to 5 is passed, all digits (0 only where it
// makes sense: you can't put 0 candles on a cake, but you can drive a 0).
export function numberPool({ bigNumbers = false, allowZero = false } = {}) {
  const pool = bigNumbers ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5];
  return allowZero && bigNumbers ? [...pool, 0] : pool;
}

export function pickDistinct(pool, count, rng = Math.random) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

// ---- Free-order writing (Pizza Shop sauce) ----
// Writing a number in sauce is judged by the result, not the stroke order:
// it counts once most of the number's dots are covered and most of the sauce
// is on the number (not spread over the whole pizza). Any order, direction
// or number of lifts is fine.
export const FREE_COVER = 0.8;
export const FREE_ON_NUMBER = 0.7;
// A sauce point is "on the number" within this distance of its path.
export const FREE_ON_RADIUS = 16;
// Judge neatness only once there's enough sauce to judge.
const FREE_MIN_POINTS = 12;

export function freeTraceStart(strokes) {
  return { strokes, covered: strokes.map((stroke) => stroke.map(() => false)), points: 0, onNumber: 0 };
}

// Adds one finger point: covers nearby dots and counts whether it's on the
// number. Returns a new state.
export function freeTraceAdd(state, point) {
  let nearest = Infinity;
  const covered = state.strokes.map((stroke, s) =>
    stroke.map((cp, i) => {
      const d = Math.hypot(cp[0] - point[0], cp[1] - point[1]);
      if (d < nearest) nearest = d;
      return state.covered[s][i] || d <= HIT_RADIUS;
    })
  );
  return {
    ...state,
    covered,
    points: state.points + 1,
    onNumber: state.onNumber + (nearest <= FREE_ON_RADIUS ? 1 : 0),
  };
}

// { cover, onNumber, done, messy }: `messy` = the dots are covered but too
// much sauce went off the number.
export function freeTraceResult(state) {
  const all = state.covered.flat();
  const cover = all.length ? all.filter(Boolean).length / all.length : 0;
  const onNumber = state.points ? state.onNumber / state.points : 0;
  const enough = state.points >= FREE_MIN_POINTS;
  return {
    cover,
    onNumber,
    done: cover >= FREE_COVER && (onNumber >= FREE_ON_NUMBER || !enough),
    messy: cover >= FREE_COVER && enough && onNumber < FREE_ON_NUMBER,
  };
}
