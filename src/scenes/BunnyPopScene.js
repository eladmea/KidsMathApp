import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import RulesCard from '../ui/RulesCard';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { content } from '../content/index';
import { GAP_MS, HOLES, OTHERS, POPS, SHOW_MS, TARGET, isCorrectResponse, isTarget, makePops } from '../logic/bunnyPop';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Bunny Pop (ages 3-4, holding back): animals pop out of 6 holes one at a
// time. Boop the bunny; leave every other animal alone. A point for each
// right response (a boop or a leave-alone), 16 pops a round.
//   data: { skillId }
const HOLE_AT = (hole) => ({ x: 400 + (hole % 3) * 240, y: 390 + Math.floor(hole / 3) * 220 });

export default class BunnyPopScene extends BaseScene {
  static key = 'BunnyPop';
  static plays = ['BunnyPop'];

  build({ skillId = 'logic-bunny-pop' } = {}) {
    this.skill = getSkill(skillId);
    this.pops = makePops();
    this.index = 0;
    this.score = 0;
    this.up = false;
    this.tapped = false;
    this.animal = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xe4f5d8).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.setCounter(1, POPS, 0);
    this.field = this.add.container(0, 0).setVisible(false);
    this.field.add(this.add.text(640, 215, t('bunnyPop.find'), textStyle(30, COLORS.greenDark)).setOrigin(0.5));
    for (let hole = 0; hole < HOLES; hole++) {
      const { x, y } = HOLE_AT(hole);
      this.field.add(this.add.ellipse(x, y + 6, 180, 60, 0x5b3b20));
      this.field.add(this.add.ellipse(x, y, 180, 56, 0x7a5230));
      const zone = this.add.zone(x, y - 60, 220, 200).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.tapHole(hole));
      this.tag(`hole:${hole}`, zone);
      this.field.add(zone);
    }
    this.feedback = this.add.text(640, 680, '', textStyle(28, COLORS.greenDark)).setOrigin(0.5);

    this.rules = new RulesCard(this, {
      title: t('bunnyPop.rulesTitle'),
      picture: TARGET,
      lines: [t('bunnyPop.rulesTap'), t('bunnyPop.rulesLeave')],
      row: [...OTHERS.slice(0, 4), '✋'],
      onGo: () => this.start(),
    });
    this.narrator.say(t('bunnyPop.intro'), { show: t('bunnyPop.rulesTitle'), force: true });
    this.report({ step: 'rules', total: POPS });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  start() {
    this.rules.destroy();
    this.field.setVisible(true);
    this.narrator.say(t('bunnyPop.find'), { force: true });
    this.popUp();
  }

  popUp() {
    const pop = this.pops[this.index];
    this.tapped = false;
    this.up = true;
    this.feedback.setText('');
    this.setCounter(this.index + 1, POPS, this.score);
    const { x, y } = HOLE_AT(pop.hole);
    this.animal = glyph(this, x, y - 50, pop.animal, 100);
    const full = this.animal.scale;
    this.animal.setScale(full * 0.2);
    this.tweens.add({ targets: this.animal, scale: full, duration: 260, ease: 'Back.easeOut' });
    this.report({ step: 'play', index: this.index, hole: pop.hole, animal: pop.animal, target: isTarget(pop), up: true, score: this.score });
    this.time.delayedCall(SHOW_MS, () => this.hide());
  }

  tapHole(hole) {
    const pop = this.pops[this.index];
    if (!this.up || !pop || hole !== pop.hole || this.tapped) return;
    this.tapped = true;
    if (isTarget(pop)) {
      play(this, 'correct');
      this.animal.destroy();
      this.animal = glyph(this, HOLE_AT(hole).x, HOLE_AT(hole).y - 50, '⭐', 100);
      this.showFeedback('boop', true);
    } else {
      play(this, 'wrong');
      this.oopsMark = glyph(this, HOLE_AT(hole).x + 70, HOLE_AT(hole).y - 110, '✋', 44);
      this.showFeedback('oops', false);
      const { ANIMAL_NAMES, say } = content('logic');
      this.narrator.say(say.bunnyOops({ animal: ANIMAL_NAMES[pop.animal] }), { show: t('bunnyPop.find'), force: true });
    }
    this.report({ tapped: true });
  }

  showFeedback(kind, good) {
    this.feedback.setText(t(`bunnyPop.${kind}`)).setColor(good ? '#2e7d32' : '#ff9a3d');
  }

  hide() {
    const pop = this.pops[this.index];
    this.up = false;
    if (this.animal) this.animal.destroy();
    if (this.oopsMark) this.oopsMark.destroy();
    this.animal = null;
    this.oopsMark = null;
    if (isCorrectResponse(pop, this.tapped)) this.score += 1;
    if (!this.tapped) this.showFeedback(isTarget(pop) ? 'missed' : 'leftAlone', !isTarget(pop));
    this.setCounter(this.index + 1, POPS, this.score);
    this.report({ up: false, score: this.score });
    this.time.delayedCall(GAP_MS, () => {
      this.index += 1;
      if (this.index < POPS) this.popUp();
      else this.finishRound(this.skill.id, this.score, POPS);
    });
  }
}
