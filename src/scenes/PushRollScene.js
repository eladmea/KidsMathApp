import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { FULL_POWER_MS, SHOTS, judgeShot, makeZone, powerForHold, rollDistance } from '../logic/pushRoll';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Push & Roll (ages 5-6, forces): hold the button to push the ball; a
// longer hold is a harder push and the ball rolls farther. Stop it on the
// target. A point for each hit, 8 shots a round.
//   data: { skillId }
const TRACK = { left: 140, right: 1140, y: 360, height: 110 };
const BALL = 70;
const TRAVEL = TRACK.right - TRACK.left - BALL;
const ROLL_MS = 900;
const NEXT_SHOT_MS = 1500;
const METER_WIDTH = 520;

export default class PushRollScene extends BaseScene {
  static key = 'PushRoll';
  static plays = ['PushRoll'];

  build({ skillId = 'sci-push-roll' } = {}) {
    this.skill = getSkill(skillId);
    this.shot = 0;
    this.hits = 0;
    this.phase = 'aim';
    this.holdStart = 0;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xe8f6ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.add.text(640, 230, t('pushRoll.instructions'), textStyle(28)).setOrigin(0.5);
    this.add.rectangle((TRACK.left + TRACK.right) / 2, TRACK.y, TRACK.right - TRACK.left, TRACK.height, 0x8bd17c).setRounded(24);
    this.zone = this.add.rectangle(0, TRACK.y, 10, TRACK.height - 16, 0xffd23f, 0.75).setRounded(14);
    this.zoneMark = glyph(this, 0, TRACK.y, '🎯', 40);
    this.ball = glyph(this, 0, TRACK.y, '⚽', BALL);
    this.add.rectangle(640, 470, METER_WIDTH, 26, COLORS.white).setRounded(13);
    this.meter = this.add.rectangle(640 - METER_WIDTH / 2, 470, 0, 26, COLORS.orange).setOrigin(0, 0.5).setRounded(13);
    this.meterLabel = this.add.text(640, 508, '', textStyle(22, COLORS.gray)).setOrigin(0.5);
    this.feedback = this.add.text(640, 555, '', textStyle(30, COLORS.greenDark)).setOrigin(0.5);

    this.push = this.add.rectangle(640, 645, 380, 100, COLORS.primary).setRounded(30).setStrokeStyle(4, COLORS.white).setInteractive({ useHandCursor: true });
    this.pushLabel = this.add.text(640, 645, t('pushRoll.hold'), textStyle(34, COLORS.white)).setOrigin(0.5);
    this.tag('push', this.push);
    this.push.on('pointerdown', () => this.startPush());
    const release = () => this.releasePush();
    this.input.on('pointerup', release);
    this.events.once('shutdown', () => this.input.off('pointerup', release));

    this.narrator.say(t('pushRoll.intro'), { show: t('pushRoll.instructions'), force: true });
    this.newShot();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  newShot() {
    this.zoneSpan = makeZone();
    this.phase = 'aim';
    const left = TRACK.left + BALL / 2 + this.zoneSpan.start * TRAVEL;
    const width = this.zoneSpan.width * TRAVEL;
    this.zone.setPosition(left + width / 2, TRACK.y).setSize(width, TRACK.height - 16);
    this.zoneMark.setPosition(left + width / 2, TRACK.y);
    this.ball.setPosition(TRACK.left + BALL / 2, TRACK.y);
    this.showPower(0);
    this.feedback.setText('');
    this.push.setFillStyle(COLORS.primary).setAlpha(1);
    this.pushLabel.setText(t('pushRoll.hold'));
    this.setCounter(this.shot + 1, SHOTS, this.hits, '🎯');
    this.report({ step: 'aim', shot: this.shot, total: SHOTS, hits: this.hits, zone: this.zoneSpan, fullPowerMs: FULL_POWER_MS });
  }

  showPower(power) {
    this.meter.setSize(METER_WIDTH * power, 26);
    this.meterLabel.setText(t(power < 0.34 ? 'pushRoll.soft' : power < 0.67 ? 'pushRoll.medium' : 'pushRoll.hard'));
  }

  // Real time, so the hold feels the same at any game speed.
  held() {
    return powerForHold(performance.now() - this.holdStart);
  }

  startPush() {
    if (this.phase !== 'aim') return;
    this.phase = 'charging';
    this.holdStart = performance.now();
    this.push.setFillStyle(COLORS.orange);
    this.pushLabel.setText(t('pushRoll.pushing'));
    this.charging = this.time.addEvent({ delay: 30, loop: true, callback: () => this.showPower(this.held()) });
    this.report({ step: 'charging' });
  }

  releasePush() {
    if (this.phase !== 'charging') return;
    this.charging.remove();
    const power = this.held();
    this.showPower(power);
    this.phase = 'rolling';
    this.push.setAlpha(0.5);
    const position = rollDistance(power);
    this.report({ step: 'rolling', power });
    this.tweens.add({
      targets: this.ball,
      x: TRACK.left + BALL / 2 + position * TRAVEL,
      angle: 360 * 2 * position,
      duration: ROLL_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => this.judge(position),
    });
  }

  judge(position) {
    const result = judgeShot(position, this.zoneSpan);
    if (result === 'hit') {
      this.hits += 1;
      play(this, 'correct');
    } else {
      play(this, 'wrong');
    }
    this.feedback.setText(t(`pushRoll.${result}`)).setColor(result === 'hit' ? '#2e7d32' : '#e53935');
    this.narrator.say(t(result === 'hit' ? 'pushRoll.sayHit' : `pushRoll.${result}`), { show: t('pushRoll.instructions'), force: true });
    this.setCounter(this.shot + 1, SHOTS, this.hits, '🎯');
    this.report({ step: 'result', result, position, hits: this.hits });
    this.time.delayedCall(NEXT_SHOT_MS, () => {
      this.shot += 1;
      if (this.shot >= SHOTS) this.finishRound(this.skill.id, this.hits, SHOTS);
      else this.newShot();
    });
  }
}
