import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { art, glyph } from '../ui/Art';
import { celebrate } from '../ui/Juice';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { speak } from '../services/speech';
import { content } from '../content/index';
import { bubblePool, catchTile, getLevel, makeTargets, nextBubble, touches } from '../logic/letterCatcher';
import { getSkill } from '../curriculum/skills';
import { isRtl, t } from '../i18n/index';

// Letter Catcher (Word Woods): a kid in a hat moves along the bottom with ◀ ▶
// (on screen, or the arrow keys) and throws a ball straight up with the
// throw button (or Space). Letters float in bubbles; catch the word's
// letters in order. Any other letter bounces the ball off and says its
// sound, with no penalty. The letter needed next always floats in the bottom
// row, so no other bubble can be in its way: the game is finding the right
// letter, not getting past the others. A point for each word caught without a wrong hit.
//   data: { skillId }
const KID = { y: 618, min: 360, max: 1080, speed: 420 };
const BALL = { radius: 16, speed: 900, top: 236 };
const BUBBLE = { radius: 38, count: 6, rows: [294, 378, 462], min: 380, max: 1060 };
const SLOT = { y: 212, size: 60, gap: 12 };
const NEXT_WORD_MS = 1600;

const sound = (tile) => (content('literacy').soundSpeech || ((g) => g))(tile);

export default class LetterCatcherScene extends BaseScene {
  static key = 'LetterCatcher';
  static plays = ['LetterCatcher'];

  build({ skillId = 'lit-catch-letter' } = {}) {
    this.skill = getSkill(skillId);
    this.levelId = this.skill.catchLevel || 'letter';
    this.level = getLevel(this.levelId);
    const pack = content('literacy');
    this.targets = makeTargets(this.levelId, pack);
    this.pool = bubblePool(this.levelId, pack);
    this.wordIndex = 0;
    this.score = 0;
    this.caught = 0;
    this.wrong = 0;
    this.bubbles = [];
    this.slots = [];
    this.ball = null;
    this.moving = 0;
    this.busy = true;
    this.clock = 0;
    this.lastReport = 0;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xe6f7ea).setOrigin(0, 0);
    this.ground = this.add.rectangle(0, 0, 10, 10, 0x9bd48a).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.wordRow = this.add.container(0, 0);

    // The kid in a hat, and the ball in hand.
    this.kid = this.add.container(720, KID.y, [glyph(this, 0, 0, '🧒', 96), glyph(this, 0, -60, '🎩', 58)]);
    // Held up over the hat, where it is thrown from.
    this.inHand = this.add.circle(0, -112, BALL.radius, COLORS.yellow).setStrokeStyle(4, COLORS.orange);
    this.kid.add(this.inHand);

    // On-screen controls: hold an arrow to move, tap to throw.
    this.controls = [
      this.holdButton('left', 90, -1),
      this.holdButton('right', 240, 1),
    ];
    this.throwButton = new Button(this, 1170, 640, { label: t('letterCatcher.throw'), width: 200, height: 96, fontSize: 30, color: COLORS.orange, onTap: () => this.throwBall() });
    this.tag('throw', this.throwButton.box);
    if (this.input.keyboard) {
      this.arrowKeys = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on('keydown-SPACE', () => this.throwBall());
      this.events.once('shutdown', () => this.input.keyboard.off('keydown-SPACE'));
    }

    const intro = this.levelId === 'letter' ? 'letterCatcher.introLetter' : 'letterCatcher.introWord';
    this.narrator.say(t(intro), { show: t('letterCatcher.instructions'), force: true });
    this.newWord();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
    this.ground.setPosition(v.x, KID.y + 44).setSize(v.width, v.bottom - (KID.y + 44));
  }

  holdButton(name, x, direction) {
    const button = new Button(this, x, 640, { label: t(`letterCatcher.${name}`), width: 130, height: 96, fontSize: 44, color: COLORS.primary });
    button.box.on('pointerdown', () => (this.moving = direction));
    ['pointerup', 'pointerout'].forEach((event) => button.box.on(event, () => this.moving === direction && (this.moving = 0)));
    this.tag(name, button.box);
    return button;
  }

  // ---- a word ----
  newWord() {
    this.bubbles.forEach((bubble) => bubble.destroy());
    this.bubbles = [];
    this.wordRow.removeAll(true);
    this.target = this.targets[this.wordIndex];
    this.caught = 0;
    this.wrong = 0;
    const tiles = this.target.tiles;
    const widths = tiles.map((tile) => SLOT.size + (tile.length - 1) * 30);
    const total = widths.reduce((a, b) => a + b, 0) + SLOT.gap * (tiles.length - 1);
    // The picture, then the slots in reading order (right to left in Hebrew).
    let x = 640 - total / 2 + 50;
    this.wordRow.add(art(this, 640 - total / 2 - 30, SLOT.y, { emoji: this.target.emoji, size: 62 }));
    const order = tiles.map((tile, i) => ({ tile, i, width: widths[i] }));
    if (isRtl()) order.reverse();
    this.slots = [];
    order.forEach(({ tile, i, width }) => {
      const box = this.add.rectangle(x + width / 2, SLOT.y, width, SLOT.size, COLORS.white).setRounded(16).setStrokeStyle(4, 0x7bc47f);
      const text = this.add.text(x + width / 2, SLOT.y, '', textStyle(40, COLORS.greenDark)).setOrigin(0.5);
      this.wordRow.add([box, text]);
      // Ages 3-4 see the letter to catch, faintly, so they can match its shape.
      if (this.levelId === 'letter') this.wordRow.add(this.add.text(x + width / 2, SLOT.y, tile, textStyle(40, COLORS.ink)).setOrigin(0.5).setAlpha(0.25));
      this.slots[i] = { box, text, tile };
      x += width + SLOT.gap;
    });
    for (let i = 0; i < BUBBLE.count; i++) this.addBubble();
    this.lowerNeeded();
    this.busy = false;
    // Say the word (and, for one letter, its sound); 🔊 says it again.
    const spoken = this.levelId === 'letter' ? `${this.target.word}. ${sound(tiles[0])}.` : this.target.word;
    if (this.wordIndex > 0) this.narrator.say(spoken, { show: t('letterCatcher.instructions'), force: true });
    else this.time.delayedCall(2600, () => this.target === this.targets[0] && this.narrator.say(spoken, { show: t('letterCatcher.instructions'), force: true }));
    this.setCounter(this.wordIndex + 1, this.level.words, this.score, '⚾');
    this.report({ step: 'play', word: this.target.word, tiles: tiles, index: this.wordIndex, total: this.level.words, score: this.score, level: this.levelId });
    this.reportPlay(true);
  }

  needed() {
    return this.target.tiles[this.caught];
  }

  addBubble() {
    const tile = nextBubble(this.needed(), this.bubbles.map((b) => b.tile), this.pool);
    // The needed letter in the bottom row; others in the row with the fewest
    // bubbles. Either way at the spot farthest from the others there.
    const counts = BUBBLE.rows.map((y) => this.bubbles.filter((b) => !b.popping && b.baseY === y).length);
    const row = tile === this.needed() ? BUBBLE.rows.length - 1 : counts.indexOf(Math.min(...counts));
    const others = this.bubbles.filter((b) => !b.popping && b.baseY === BUBBLE.rows[row]).map((b) => b.x);
    const spots = Array.from({ length: 12 }, (_, i) => BUBBLE.min + (i / 11) * (BUBBLE.max - BUBBLE.min));
    const roomiest = (x) => Math.min(Infinity, ...others.map((o) => Math.abs(o - x)));
    const x = spots.sort((a, b) => roomiest(b) - roomiest(a) || Math.random() - 0.5)[Math.floor(Math.random() * 2)];
    const bubble = this.add.container(x, BUBBLE.rows[row], [
      this.add.circle(0, 0, BUBBLE.radius, COLORS.white, 0.88).setStrokeStyle(4, 0x8fd3f4),
      this.add.text(0, 0, tile, textStyle(tile.length > 1 ? 32 : 40, COLORS.ink)).setOrigin(0.5),
    ]);
    bubble.tile = tile;
    bubble.baseY = BUBBLE.rows[row];
    bubble.speed = (25 + Math.random() * 30) * (Math.random() < 0.5 ? -1 : 1);
    bubble.phase = Math.random() * Math.PI * 2;
    bubble.setScale(0.2);
    this.tweens.add({ targets: bubble, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.bubbles.push(bubble);
    return bubble;
  }

  // ---- the ball ----
  throwBall() {
    if (this.busy || this.ball) return;
    this.ball = this.add.circle(this.kid.x, KID.y - 112, BALL.radius, COLORS.yellow).setStrokeStyle(4, COLORS.orange).setDepth(5);
    this.inHand.setVisible(false);
    this.report({ thrown: true });
  }

  dropBall() {
    if (this.ball) this.ball.destroy();
    this.ball = null;
    this.inHand.setVisible(true);
  }

  update(time, delta) {
    if (!this.built) return;
    // Game time (?fast runs it 8x, like the tweens).
    const dt = (delta / 1000) * this.time.timeScale;
    this.clock += dt;
    const keys = this.arrowKeys;
    const direction = keys && keys.left.isDown ? -1 : keys && keys.right.isDown ? 1 : this.moving;
    if (direction) this.kid.x = Math.min(KID.max, Math.max(KID.min, this.kid.x + direction * KID.speed * dt));
    this.bubbles.forEach((bubble) => {
      if (bubble.popping) return;
      bubble.x += bubble.speed * dt;
      if (bubble.x < BUBBLE.min || bubble.x > BUBBLE.max) {
        bubble.speed *= -1;
        bubble.x = Math.min(BUBBLE.max, Math.max(BUBBLE.min, bubble.x));
      }
      bubble.y = bubble.baseY + Math.sin(this.clock * 2 + bubble.phase) * 8;
    });
    this.separateBubbles();
    if (this.ball && !this.ball.bouncing) {
      this.ball.y -= BALL.speed * dt;
      // The lowest bubble in the ball's way is the one it meets.
      const hit = this.bubbles.filter((b) => !b.popping && touches(this.ball, b, BUBBLE.radius + BALL.radius)).sort((a, b) => b.y - a.y)[0];
      if (hit) this.hit(hit);
      else if (this.ball.y < BALL.top) this.dropBall();
    }
    this.reportPlay();
  }

  // The bubble with the letter needed next drifts down to the bottom row, and
  // a bottom-row bubble rises to take its place.
  lowerNeeded() {
    const bottom = BUBBLE.rows[BUBBLE.rows.length - 1];
    const needed = this.bubbles.find((b) => !b.popping && b.tile === this.needed());
    if (!needed || needed.baseY === bottom) return;
    const swap = this.bubbles.find((b) => !b.popping && b.baseY === bottom);
    if (swap) this.tweens.add({ targets: swap, baseY: needed.baseY, duration: 500, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: needed, baseY: bottom, duration: 500, ease: 'Sine.easeInOut' });
  }

  // Bubbles in the same row bump off each other instead of overlapping.
  separateBubbles() {
    const live = this.bubbles.filter((b) => !b.popping);
    live.forEach((a, i) => live.slice(i + 1).forEach((b) => {
      if (a.baseY !== b.baseY || Math.abs(a.x - b.x) >= BUBBLE.radius * 2 + 8) return;
      const [left, right] = a.x < b.x ? [a, b] : [b, a];
      left.speed = -Math.abs(left.speed);
      right.speed = Math.abs(right.speed);
      const push = (BUBBLE.radius * 2 + 8 - (right.x - left.x)) / 2;
      left.x = Math.max(BUBBLE.min, left.x - push);
      right.x = Math.min(BUBBLE.max, right.x + push);
    }));
  }

  // What a browser test needs to aim: the kid and the bubbles, a few times a second.
  reportPlay(now = false) {
    if (!now && this.clock - this.lastReport < 0.08) return;
    this.lastReport = this.clock;
    this.report({
      kidX: Math.round(this.kid.x),
      needed: this.target ? this.needed() : null,
      caught: this.caught,
      wrong: this.wrong,
      ball: Boolean(this.ball),
      bubbles: this.bubbles.filter((b) => !b.popping).map((b) => ({ tile: b.tile, x: Math.round(b.x), y: Math.round(b.y), speed: b.speed })),
    });
  }

  hit(bubble) {
    const result = catchTile(this.target.tiles, this.caught, bubble.tile);
    speak(sound(bubble.tile), { force: true });
    if (!result.right) {
      // Bounces off: no penalty, but the word doesn't score.
      this.wrong += 1;
      const ball = this.ball;
      ball.bouncing = true;
      this.tweens.add({ targets: bubble, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => bubble.setAngle(0) });
      this.tweens.add({ targets: ball, y: KID.y - 112, alpha: 0.3, duration: 380, ease: 'Quad.easeIn', onComplete: () => this.dropBall() });
      this.report({ step: 'play', lastHit: { tile: bubble.tile, right: false }, wrong: this.wrong });
      return;
    }
    this.dropBall();
    this.caught = result.caught;
    bubble.popping = true;
    this.bubbles = this.bubbles.filter((b) => b !== bubble);
    const slot = this.slots[this.caught - 1];
    celebrate(this, bubble.x, bubble.y);
    this.tweens.add({ targets: bubble, x: slot.box.x, y: slot.box.y, scale: 0.5, alpha: 0, duration: 320, ease: 'Quad.easeIn', onComplete: () => {
      bubble.destroy();
      slot.text.setText(slot.tile);
      slot.box.setStrokeStyle(5, COLORS.green);
    } });
    this.report({ step: 'play', lastHit: { tile: bubble.tile, right: true }, caught: this.caught });
    if (result.done) return this.wordDone();
    this.addBubble();
    this.lowerNeeded();
  }

  wordDone() {
    this.busy = true;
    if (this.wrong === 0) this.score += 1;
    play(this, 'correct');
    this.time.delayedCall(450, () => speak(this.target.word, { force: true }));
    this.narrator.say(t('letterCatcher.great'), { show: this.target.word });
    this.setCounter(this.wordIndex + 1, this.level.words, this.score, '⚾');
    this.report({ step: 'word', score: this.score, clean: this.wrong === 0 });
    this.time.delayedCall(NEXT_WORD_MS, () => {
      this.wordIndex += 1;
      if (this.wordIndex >= this.level.words) this.finishRound(this.skill.id, this.score, this.level.words);
      else this.newWord();
    });
  }
}
