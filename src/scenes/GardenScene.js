import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { earnStickers, session } from '../services/session';
import { loadGarden, saveGarden } from '../services/storage';
import { play } from '../services/audio';
import { content } from '../content/index';
import { FLOWER_STAGE, NEEDS, SILLY_CHOICES, STAGES, applyCare, canGrowToday, careOptions, needForDay, newGarden } from '../logic/garden';
import { toDayKey } from '../logic/progress';
import { t } from '../i18n/index';

// Garden Days: grow a plant over real days. Each day it shows a clue (dry
// soil, a dark corner, worn-out soil); pick what it needs and it grows one
// stage, at most once a day. A wrong pick makes it droop and explains why;
// it never dies. A flower earns a sticker and can be replanted.
const POT = { x: 380, y: 420 };
const PANEL_X = 900;

export default class GardenScene extends BaseScene {
  static key = 'Garden';

  build() {
    this.words = content('science');
    this.today = toDayKey();
    this.seed = session.profile.id;
    this.need = needForDay(this.today, this.seed);
    this.garden = null;
    this.panel = [];
    this.plant = null;
    this.stageDots = [];

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xeaf7e4).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.add.text(30, 150, t('garden.title'), textStyle(24, COLORS.gray)).setOrigin(0, 0.5);
    this.flowers = this.add.text(1250, 150, '', textStyle(28)).setOrigin(1, 0.5);
    this.add.circle(POT.x, POT.y, 150, COLORS.white);
    this.add.rectangle(POT.x, POT.y + 110, 170, 70, 0xc96f3b).setRounded(16);
    this.stageName = this.add.text(POT.x, 610, '', textStyle(28, COLORS.greenDark)).setOrigin(0.5);
    this.message = this.add.text(PANEL_X, 650, '', textStyle(24, COLORS.ink, { wordWrap: { width: 600 } })).setOrigin(0.5);
    this.report({ step: 'loading' });
    loadGarden(this.seed).then((stored) => {
      if (!this.sys.isActive()) return;
      this.garden = stored || newGarden();
      this.show();
      this.greet();
    });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  choiceWords(id) {
    return this.words.GARDEN.choices[id];
  }

  greet() {
    const { garden } = this;
    if (garden.stage === FLOWER_STAGE) this.narrator.say(t('garden.bloomed'));
    else if (canGrowToday(garden, this.today)) this.narrator.say(this.words.say.garden.look({ clue: this.choiceWords(this.need).clue }));
    else this.narrator.say(t('garden.sayResting'), { show: t('garden.resting') });
  }

  show() {
    const { garden } = this;
    const stageName = this.words.GARDEN.stages[garden.stage];
    this.flowers.setText(t('garden.flowers', { count: garden.flowers }));
    this.stageDots.forEach((dot) => dot.destroy());
    this.stageDots = STAGES.map((stage, i) => glyph(this, POT.x - 150 + i * 60, 205, stage.emoji, 38).setAlpha(i <= garden.stage ? 1 : 0.3));
    if (this.plant) this.plant.destroy();
    this.plant = glyph(this, POT.x, POT.y - 10, STAGES[garden.stage].emoji, 160);
    if (garden.droopy) this.plant.setAngle(-18).setY(POT.y + 10);
    this.stageName.setText(garden.droopy ? t('garden.droopy', { stage: stageName }) : stageName);

    this.panel.forEach((object) => object.destroy());
    this.panel = [];
    const isFlower = garden.stage === FLOWER_STAGE;
    const canGrow = canGrowToday(garden, this.today) && !isFlower;
    if (canGrow) {
      this.panel.push(this.add.rectangle(PANEL_X, 265, 640, 120, 0xfffbe6).setRounded(24));
      this.panel.push(this.add.text(PANEL_X - 300, 228, t('garden.clue'), textStyle(22, COLORS.gray)).setOrigin(0, 0.5));
      this.panel.push(this.add.text(PANEL_X - 300, 275, this.choiceWords(this.need).clue, textStyle(28, COLORS.ink, { align: 'left', wordWrap: { width: 600 } })).setOrigin(0, 0.5));
      careOptions(this.today).forEach((id, i) => {
        const info = NEEDS[id] || SILLY_CHOICES[id];
        const button = new Button(this, PANEL_X - 155 + (i % 2) * 310, 410 + Math.floor(i / 2) * 120, { label: '', width: 290, height: 100, color: COLORS.white, onTap: () => this.care(id) });
        button.add(glyph(this, -100, 0, info.emoji, 50));
        button.add(this.add.text(-60, 0, this.choiceWords(id).label, textStyle(28)).setOrigin(0, 0.5));
        this.tag(`care:${id}`, button.box);
        this.panel.push(button);
      });
    } else if (isFlower) {
      const replant = new Button(this, PANEL_X, 420, { label: t('garden.replant'), width: 420, height: 100, color: COLORS.greenDark, onTap: () => this.care('replant') });
      this.tag('replant', replant.box);
      this.panel.push(replant);
    } else if (!this.narrator.line) {
      this.message.setText(t('garden.resting'));
    }
    this.report({ step: isFlower ? 'flower' : canGrow ? 'care' : 'resting', stage: garden.stage, droopy: garden.droopy, flowers: garden.flowers, need: this.need });
  }

  async care(choice) {
    const { garden, result } = applyCare(this.garden, choice, this.today, this.seed);
    this.garden = garden;
    await saveGarden(this.seed, garden);
    const say = this.words.say.garden;
    const reason = this.choiceWords(choice) && this.choiceWords(choice).reason;
    let line;
    let shown = null;
    if (result === 'grew') {
      line = say.grew({ reason, stage: this.words.GARDEN.stages[garden.stage] });
      play(this, 'correct');
    } else if (result === 'bloomed') {
      line = say.bloomed({ flowers: garden.flowers });
      play(this, 'correct');
      const earned = await earnStickers([{ kind: 'bloomed', ref: garden.flowers }]);
      // Shown with the sticker; spoken without the picture.
      if (earned.length) shown = `${line} ${say.sticker({ emoji: earned[0].emoji })}`;
    } else if (result === 'wrong') {
      line = say.wrong({ reason });
      play(this, 'wrong');
    } else if (result === 'replanted') {
      line = t('garden.replanted');
    } else {
      line = t('garden.sayResting');
    }
    if (!this.sys.isActive()) return;
    this.message.setText('');
    this.narrator.say(line.replace(/[🌙🌻🌰]/gu, ''), { show: shown || line, force: true });
    this.show();
    this.report({ result });
  }
}
