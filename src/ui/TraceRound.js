import BaseScene, { SAFE } from './BaseScene';
import Button from './Button';
import Narrator from './Narrator';
import TraceLayer from './TraceLayer';
import { COLORS, textStyle } from './theme';
import { play } from '../services/audio';
import { MAX_RESTARTS_FOR_POINT } from '../logic/tracing';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

const CELEBRATE_MS = 2200;
// A reminder arrow over the start dot after this long without a touch.
const IDLE_MS = 5000;
const TRACE_WIDTH = 330;

// A round of tracing items (digits to write, roads to drive, bee paths):
// one item at a time, a point for each one done with at most one restart,
// then the Results scene. Subclasses give the items and how they look:
//   makeItems()      [{ key, strokes, prompt, intro, praise, celebrate? }]
//   lookOf(item)     { look, startMarker, endMarker } for the TraceLayer
//   hintText(kind)   { show, say } for 'start' | 'next' | 'almost'
//   idleText()       what the message line says before the first touch
//   colors           { background, card }
//   data: { skillId }
export default class TraceRound extends BaseScene {
  build({ skillId }) {
    this.skill = getSkill(skillId);
    this.items = this.makeItems();
    this.index = 0;
    this.points = 0;
    this.layer = null;
    this.idle = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, this.colors.background).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.card = this.add.rectangle(SAFE.width / 2, 190 + (TRACE_WIDTH * 1.4) / 2, TRACE_WIDTH + 40, TRACE_WIDTH * 1.4 + 40, this.colors.card).setRounded(30);
    this.prompt = this.add.text(1000, 300, '', textStyle(54, COLORS.primary, { wordWrap: { width: 420 } })).setOrigin(0.5);
    this.message = this.add.text(1000, 420, '', textStyle(26, COLORS.ink, { wordWrap: { width: 420 } })).setOrigin(0.5);
    this.again = new Button(this, 250, 420, { label: t('tracing.showAgain'), width: 300, height: 80, fontSize: 28, color: COLORS.white, textColor: COLORS.primary, onTap: () => this.layer && this.layer.demo() });
    this.tag('show-again', this.again.box);
    this.showItem();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  showItem() {
    if (this.layer) this.layer.destroy();
    const item = this.items[this.index];
    this.celebrating = false;
    const { look, startMarker, endMarker } = this.lookOf(item);
    this.layer = new TraceLayer(this, SAFE.width / 2 - TRACE_WIDTH / 2, 190, TRACE_WIDTH, {
      strokes: item.strokes,
      look,
      startMarker,
      endMarker,
      onHint: (kind) => this.hint(kind),
      onComplete: (result) => this.done(result),
      onTouch: () => this.restartIdle(),
    });
    this.prompt.setText(item.prompt);
    this.message.setText(this.idleText()).setColor('#2d3142');
    this.setCounter(this.index + 1, this.items.length, this.points);
    this.narrator.say(item.intro, { show: item.prompt, force: true });
    this.restartIdle();
    this.report({ step: 'trace', index: this.index, total: this.items.length, key: item.key, points: this.points, ...this.layer.state() });
  }

  // The start-here arrow, after a few seconds without a touch.
  restartIdle() {
    if (this.idle) this.idle.remove();
    if (this.layer) this.layer.pointAtStart(false);
    this.idle = this.time.delayedCall(IDLE_MS, () => {
      if (!this.layer || this.celebrating) return;
      this.layer.pointAtStart(true);
      this.report({ reminder: true });
    });
  }

  hint(kind) {
    const { show, say } = this.hintText(kind);
    this.message.setText(show).setColor('#2d3142');
    this.narrator.say(say, { show: this.items[this.index].prompt, force: true });
    if (kind === 'almost') play(this, 'wrong');
    this.report({ hint: kind, ...this.layer.state() });
  }

  done({ restarts }) {
    const item = this.items[this.index];
    this.celebrating = true;
    if (this.idle) this.idle.remove();
    if (restarts <= MAX_RESTARTS_FOR_POINT) this.points += 1;
    play(this, item.sound || 'correct');
    this.narrator.say(item.praise, { force: true });
    this.message.setText(item.celebrate || item.praise).setColor('#2e7d32');
    this.tweens.add({ targets: this.message, scale: { from: 1.25, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    this.report({ step: 'done', index: this.index, points: this.points, restarts });
    this.time.delayedCall(CELEBRATE_MS, () => {
      this.index += 1;
      if (this.index < this.items.length) this.showItem();
      else this.finish();
    });
  }

  finish() {
    this.finishRound(this.skill.id, this.points, this.items.length);
  }
}
