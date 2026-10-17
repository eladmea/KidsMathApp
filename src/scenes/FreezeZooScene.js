import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import RulesCard from '../ui/RulesCard';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { OWL, SWITCH_AT, TRIALS, isCorrectResponse, isTarget, makeTrials } from '../logic/freezeZoo';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Freeze Zoo (ages 5-6, holding back and switching rules): animals appear
// one at a time. Part 1: tap every animal but freeze for the owl. Part 2
// (halfway): switch, tap only the owl. A point for each right response.
//   data: { skillId }
const SHOW_MS = 1500;
const GAP_MS = 450;
const STAGE = { x: 640, y: 440, radius: 170 };

export default class FreezeZooScene extends BaseScene {
  static key = 'FreezeZoo';
  static plays = ['FreezeZoo'];

  build({ skillId = 'logic-freeze-zoo' } = {}) {
    this.skill = getSkill(skillId);
    this.trials = makeTrials();
    this.index = 0;
    this.score = 0;
    this.visible = false;
    this.tapped = false;
    this.animal = null;
    this.rules = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xeaf7e4).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.setCounter(1, TRIALS, 0, '✓');
    this.reminder = this.add.text(640, 225, '', textStyle(28, COLORS.greenDark)).setOrigin(0.5);
    this.stage = this.add.circle(STAGE.x, STAGE.y, STAGE.radius, COLORS.white).setInteractive({ useHandCursor: true });
    this.stage.on('pointerdown', () => this.tap());
    this.tag('stage', this.stage);
    this.feedback = this.add.text(640, 668, '', textStyle(28, COLORS.greenDark)).setOrigin(0.5);
    this.showRules(1);
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  showRules(part) {
    this.part = part;
    this.reminder.setText('');
    this.feedback.setText('');
    this.rules = new RulesCard(this, {
      title: t(`freezeZoo.rules${part}Title`),
      picture: OWL,
      lines: [t(`freezeZoo.rules${part}Detail`)],
      onGo: () => {
        this.rules.destroy();
        this.rules = null;
        this.reminder.setText(t(`freezeZoo.remind${part}`));
        this.showTrial();
      },
    });
    this.narrator.say(t(`freezeZoo.rules${part}Say`), { show: t(`freezeZoo.rules${part}Title`), force: true });
    this.report({ step: 'rules', part, index: this.index, total: TRIALS, score: this.score });
  }

  showTrial() {
    const trial = this.trials[this.index];
    this.tapped = false;
    this.visible = true;
    this.feedback.setText('');
    this.setCounter(this.index + 1, TRIALS, this.score, '✓');
    this.animal = glyph(this, STAGE.x, STAGE.y, trial.animal, 190);
    this.report({ step: 'play', part: trial.phase, index: this.index, animal: trial.animal, target: isTarget(trial), visible: true, score: this.score });
    this.time.delayedCall(SHOW_MS, () => this.hideTrial());
  }

  tap() {
    if (!this.visible || this.tapped) return;
    this.tapped = true;
    const good = isTarget(this.trials[this.index]);
    play(this, good ? 'correct' : 'wrong');
    this.showFeedback(good ? 'hit' : 'oops', good);
    this.report({ tapped: true });
  }

  showFeedback(kind, good) {
    this.feedback.setText(t(`freezeZoo.${kind}`)).setColor(good ? '#2e7d32' : '#e53935');
  }

  hideTrial() {
    const trial = this.trials[this.index];
    this.visible = false;
    if (this.animal) this.animal.destroy();
    this.animal = null;
    const ok = isCorrectResponse(trial, this.tapped);
    if (ok) this.score += 1;
    if (!this.tapped) this.showFeedback(ok ? 'freezeOk' : 'missed', ok);
    this.setCounter(this.index + 1, TRIALS, this.score, '✓');
    this.report({ visible: false, score: this.score });
    this.time.delayedCall(GAP_MS, () => {
      this.index += 1;
      if (this.index >= TRIALS) this.finishRound(this.skill.id, this.score, TRIALS);
      else if (this.index === SWITCH_AT) this.showRules(2);
      else this.showTrial();
    });
  }
}
