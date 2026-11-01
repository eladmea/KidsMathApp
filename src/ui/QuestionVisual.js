import { COLORS, textStyle } from './theme';
import { t } from '../i18n/index';
import { glyph } from './Art';
import { playButton } from './PlayButton';
import { tag } from '../services/testBridge';

// Pictures that let pre-readers count, listen and look instead of reading.
// drawVisual() builds one inside a box of `width` x `height` centred on
// (x, y) and returns its container (or null for questions without one).
//   reveal     the answer to show in place of a "?" (after answering, or in a
//              worked example)
//   result     'correct' | 'wrong' | null once the child has answered
//   showSteps  label the jumps between numbers (worked examples)
//   onSay      say(text) reads aloud: a visual with `say` (the word or sound
//              being asked about) gets a ▶ that says it
export function drawVisual(scene, x, y, visual, { width = 600, height = 420, reveal = null, result = null, showSteps = false, onSay = null } = {}) {
  if (!visual) return null;
  const box = scene.add.container(x, y);
  const draw = DRAW[visual.type];
  if (!draw) return null;
  draw(scene, box, visual, { width, height, reveal, result, showSteps });
  const at = PLAY_AT[visual.type];
  if (onSay && visual.say && at) {
    const parts = playButton(scene, at.x, at.y, () => onSay(visual.say));
    box.add(parts);
    tag('say:target', parts[0]);
  }
  return box;
}

// Where a visual's ▶ goes: beside the picture card's word, under the
// monster's speech bubble.
const PLAY_AT = { picture: { x: 160, y: 110 }, snackMonster: { x: 140, y: 20 } };

const text = (scene, x, y, value, size, color = COLORS.ink, extra) => scene.add.text(x, y, String(value), textStyle(size, color, extra)).setOrigin(0.5);
// Pictures (emoji, or their image from src/assets/images/emoji/ when added).
const pic = (scene, x, y, emoji, size) => glyph(scene, x, y, emoji, size);

function card(scene, box, width, height) {
  box.add(scene.add.rectangle(0, 0, width, height, COLORS.white, 0.9).setRounded(28));
}

// Up to five per row, like a ten frame, centred on (cx, cy).
function emojiGrid(scene, box, emoji, count, { size, cx = 0, cy = 0, perRow = 5, fadedFrom = count, pop = true }) {
  const gap = size * 1.18;
  const rows = Math.ceil(count / perRow);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const item = pic(scene, cx + ((i % perRow) - (inRow - 1) / 2) * gap, cy + (row - (rows - 1) / 2) * gap, emoji, size);
    if (i >= fadedFrom) item.setAlpha(0.22);
    if (pop) {
      // A picture's own scale fits it to `size`, so grow back to that, not 1.
      const full = item.scale;
      item.setScale(0);
      scene.tweens.add({ targets: item, scale: full, duration: 220, delay: i * 60, ease: 'Back.easeOut' });
    }
    box.add(item);
  }
  return { width: Math.min(count, perRow) * gap, height: rows * gap };
}

// Dice layouts (row, col in a 3 x 3 grid): familiar patterns help subitizing.
export const DICE = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]],
};

function drawDots(scene, box, count, layout) {
  const g = scene.add.graphics();
  if (layout === 'tenFrame') {
    const cell = 76;
    const left = -2.5 * cell;
    const top = -cell;
    g.fillStyle(COLORS.white, 1).fillRoundedRect(left - 8, top - 8, cell * 5 + 16, cell * 2 + 16, 16);
    g.lineStyle(4, 0x9aa5c4, 1);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) g.strokeRect(left + c * cell, top + r * cell, cell, cell);
    g.fillStyle(COLORS.primary, 1);
    for (let i = 0; i < count; i++) g.fillCircle(left + (i % 5) * cell + cell / 2, top + Math.floor(i / 5) * cell + cell / 2, cell * 0.34);
  } else {
    const size = 240;
    const cell = size / 3;
    g.fillStyle(COLORS.white, 1).fillRoundedRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 28);
    g.lineStyle(4, 0x9aa5c4, 1).strokeRoundedRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 28);
    g.fillStyle(COLORS.primary, 1);
    (DICE[count] || []).forEach(([r, c]) => g.fillCircle(-size / 2 + c * cell + cell / 2, -size / 2 + r * cell + cell / 2, cell * 0.32));
  }
  box.add(g);
  return g;
}

const DRAW = {
  objects(scene, box, v) {
    emojiGrid(scene, box, v.emoji, v.count, { size: v.count <= 5 ? 100 : 76 });
  },

  sum(scene, box, v) {
    // Two groups (three per row) with a big + between them.
    const size = Math.max(v.a, v.b) > 6 ? 46 : 56;
    const groupWidth = (count) => Math.min(Math.max(count, 1), 3) * size * 1.18;
    emojiGrid(scene, box, v.emoji, v.a, { size, cx: -(groupWidth(v.a) / 2 + 50), perRow: 3 });
    box.add(text(scene, 0, 0, '+', 72, COLORS.primary));
    emojiGrid(scene, box, v.emoji, v.b, { size, cx: groupWidth(v.b) / 2 + 50, perRow: 3 });
  },

  takeAway(scene, box, v) {
    // The last `b` are faded out: "take away" made visible.
    emojiGrid(scene, box, v.emoji, v.a, { size: v.a > 5 ? 66 : 80, fadedFrom: v.a - v.b });
  },

  dots(scene, box, v, { reveal }) {
    const dots = drawDots(scene, box, v.count, v.layout);
    // The dots hide after a moment, so children subitize instead of counting.
    // A worked example (reveal set) keeps them up to study.
    if (!v.flashMs || reveal !== null) return;
    const hidden = text(scene, 0, 0, '👀 ?', 72).setVisible(false);
    box.add(hidden);
    scene.time.delayedCall(v.flashMs, () => {
      if (!box.active) return;
      dots.setVisible(false);
      hidden.setVisible(true);
      box.setData('hidden', true);
    });
  },

  // Number blocks on a staircase that climbs when the numbers go up and steps
  // down when they go down, so the direction shows before any reading.
  sequence(scene, box, v, { width, reveal, showSteps }) {
    const values = [...v.numbers, reveal ?? '?'];
    const up = v.direction === 'up';
    const block = Math.min(110, (width - 40) / values.length - 18);
    const base = 90;
    const rise = 34;
    const heightOf = (i) => base + (up ? i : values.length - 1 - i) * rise;
    const tallest = base + (values.length - 1) * rise;
    const floor = tallest / 2 + 30;
    box.add(text(scene, 0, -floor - 40, up ? t('quiz.goingUp') : t('quiz.goingDown'), 28, up ? COLORS.greenDark : COLORS.orange));
    values.forEach((value, i) => {
      const x = (i - (values.length - 1) / 2) * (block + 18);
      const h = heightOf(i);
      const mystery = i === values.length - 1;
      const color = mystery ? (reveal !== null ? COLORS.green : COLORS.orange) : COLORS.white;
      box.add(scene.add.rectangle(x, floor - h / 2, block, h, color).setRounded(14).setStrokeStyle(4, mystery ? color : 0x9aa5c4));
      box.add(text(scene, x, floor - h + 34, value, String(value).length >= 3 ? 30 : 40, mystery ? COLORS.white : COLORS.ink));
      if (i > 0 && showSteps) {
        const px = x - (block + 18) / 2;
        box.add(text(scene, px, floor - Math.max(h, heightOf(i - 1)) - 24, `${up ? '+' : '−'}${v.step}`, 24, COLORS.primary));
      }
    });
  },

  // A pattern as big tiles on one line (a pattern broken over two lines is
  // much harder to see). `gap` is the "?" tile; `numbered` adds positions.
  pattern(scene, box, v, { width, reveal }) {
    const count = v.items.length + (v.numbered ? 1 : 0);
    const tile = Math.max(34, Math.min(96, (width - 30) / count - 8));
    v.items.forEach((item, i) => {
      const x = (i - (count - 1) / 2) * (tile + 8);
      const isGap = i === v.gap;
      const filled = isGap && reveal !== null;
      const color = filled ? 0xd9f7e6 : isGap ? 0xffe9d4 : COLORS.white;
      box.add(scene.add.rectangle(x, 0, tile, tile, color).setRounded(12).setStrokeStyle(4, isGap ? (filled ? COLORS.green : COLORS.orange) : 0xd6dbe8));
      box.add(isGap && !filled ? text(scene, x, 0, '?', tile * 0.62, COLORS.orange) : pic(scene, x, 0, isGap ? reveal : item, tile * 0.62));
      if (v.numbered) box.add(text(scene, x, tile / 2 + 18, i + 1, 18, COLORS.gray));
    });
    if (v.numbered) {
      const x = ((count - 1) / 2) * (tile + 8);
      box.add(scene.add.rectangle(x, 0, tile, tile, COLORS.white).setRounded(12).setStrokeStyle(4, 0xd6dbe8));
      box.add(text(scene, x, 0, '…', tile * 0.5, COLORS.gray));
    }
  },

  // Each step is a stack that grows by the same amount.
  growing(scene, box, v, { width, height, reveal }) {
    const all = [...v.steps, reveal];
    const tallest = Math.max(...all.filter((n) => n !== null));
    const block = Math.min(42, (height - 90) / tallest);
    const column = Math.min(140, width / all.length);
    const floor = (tallest * block) / 2 + 10;
    all.forEach((count, i) => {
      const x = (i - (all.length - 1) / 2) * column;
      if (count === null) {
        box.add(text(scene, x, floor - 40, '?', 64, COLORS.orange));
      } else {
        for (let k = 0; k < count; k++) box.add(pic(scene, x, floor - block / 2 - k * block, v.emoji, block * 0.9));
      }
      box.add(text(scene, x, floor + 26, t('quiz.step', { number: i + 1 }), 22, COLORS.gray));
    });
  },

  picture(scene, box, v, { width, height }) {
    card(scene, box, Math.min(width, 420), Math.min(height, 340));
    box.add(pic(scene, 0, v.caption ? -30 : 0, v.emoji, 150));
    if (v.caption) box.add(text(scene, 0, 110, v.caption, 30, COLORS.ink, { wordWrap: { width: 380 } }));
  },

  listen(scene, box) {
    box.add(pic(scene, 0, -30, '👂', 150));
    box.add(text(scene, 0, 100, t('quiz.listen'), 40, COLORS.primary));
  },

  // The Sound Snack monster: hungry, then yum (right) or yuck (wrong).
  snackMonster(scene, box, v, { result }) {
    const face = result === 'correct' ? '😋' : result === 'wrong' ? '🤢' : '👾';
    const words = result === 'correct' ? t('quiz.yum') : result === 'wrong' ? t('quiz.yuck') : `${v.sound}!`;
    box.add(pic(scene, -70, 0, face, 170));
    box.add(scene.add.rectangle(140, -90, 180, 90, COLORS.white).setRounded(40));
    box.add(text(scene, 140, -90, words, 40, COLORS.primary));
  },
};
