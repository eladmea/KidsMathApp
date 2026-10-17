import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { showGameEnd } from '../ui/GameEnd';
import { glyph } from '../ui/Art';
import { COLORS, colorOf } from '../ui/theme';
import { play } from '../services/audio';
import { content } from '../content/index';
import { gameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Bubble Pop (Fun Break): pop the rising bubbles for 45 seconds. Every
// ninth bubble is golden and tells a fun fact.
const GAME_SECONDS = 45;
const SPAWN_MS = 650;
const GOLDEN_EVERY = 9;
const BUBBLE_COLORS = ['#8EC5FF', '#FFB3D1', '#B8F0C8', '#FFE08A', '#D2B8FF'];
const AREA = { left: 40, right: 1240, top: 190, bottom: 720 };

export default class BubblePopScene extends BaseScene {
  static key = 'BubblePop';

  build() {
    this.facts = content('science').FUN_FACTS;
    this.popped = 0;
    this.left = GAME_SECONDS;
    this.spawned = 0;
    this.factIndex = Math.floor(Math.random() * this.facts.length);
    this.bubbles = new Map();
    this.nextId = 0;
    this.over = false;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xe6f4ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addHeader('🫧', gameTitle('bubble-pop'));
    this.narrator.say(t('mini.bubble.intro'));
    this.showCounter();
    this.clock = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });
    this.spawner = this.time.addEvent({ delay: SPAWN_MS, loop: true, callback: () => this.spawn() });
    this.report({ step: 'play', popped: 0, left: this.left, bubbles: [] });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  showCounter() {
    this.headerCounter.setText(`🫧 ${this.popped}   ⏱ ${Math.max(0, this.left)}`);
  }

  tick() {
    this.left -= 1;
    this.showCounter();
    if (this.left <= 0) this.end();
  }

  spawn() {
    this.spawned += 1;
    const size = 70 + Math.random() * 45;
    const x = AREA.left + size / 2 + Math.random() * (AREA.right - AREA.left - size);
    const golden = this.spawned % GOLDEN_EVERY === 0;
    const id = this.nextId++;
    const color = golden ? 0xffd23f : colorOf(BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]);
    const bubble = this.add.container(x, AREA.bottom + size / 2);
    const ball = this.add.circle(0, 0, size / 2, color, 0.9).setStrokeStyle(golden ? 5 : 2, golden ? 0xf2a900 : COLORS.white);
    const shine = this.add.circle(-size * 0.18, -size * 0.2, size * 0.12, COLORS.white, 0.8);
    bubble.add([ball, shine]);
    if (golden) bubble.add(glyph(this, 0, 0, '⭐', size * 0.4));
    ball.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pop(id));
    this.tag(`bubble:${id}`, ball);
    const tween = this.tweens.add({
      targets: bubble,
      y: AREA.top - size,
      duration: 4200 + Math.random() * 2500,
      onComplete: () => this.remove(id),
    });
    this.bubbles.set(id, { bubble, tween, golden });
    this.reportBubbles();
  }

  reportBubbles() {
    this.report({ popped: this.popped, left: this.left, bubbles: [...this.bubbles.entries()].map(([id, b]) => ({ id, golden: b.golden })) });
  }

  remove(id) {
    const entry = this.bubbles.get(id);
    if (!entry) return;
    entry.tween.remove();
    entry.bubble.destroy();
    this.bubbles.delete(id);
    this.reportBubbles();
  }

  pop(id) {
    const entry = this.bubbles.get(id);
    if (!entry || this.over) return;
    this.popped += 1;
    play(this, 'correct');
    this.remove(id);
    this.showCounter();
    if (entry.golden) {
      const fact = this.facts[this.factIndex % this.facts.length];
      this.factIndex += 1;
      this.narrator.say(t('mini.bubble.fact', { fact }), { show: `✨ ${fact}`, force: true });
      this.report({ fact });
    }
  }

  end() {
    this.over = true;
    this.clock.remove();
    this.spawner.remove();
    [...this.bubbles.keys()].forEach((id) => this.remove(id));
    this.report({ step: 'over', popped: this.popped });
    showGameEnd(this, { emoji: '🎉', headline: t('mini.bubble.end', { count: this.popped }), detail: t('mini.bubble.endDetail') });
  }
}
