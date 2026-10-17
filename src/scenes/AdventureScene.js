import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { session, startAdventure } from '../services/session';
import { STEP_INFO, currentStep, estimatedMinutes, isFinished, stepRoute, subjectsForDay } from '../logic/adventure';
import { stickersEarnedOn } from '../logic/stickers';
import { getSkill } from '../curriculum/skills';
import { getSubject } from '../curriculum/subjects';
import { skillTitle, stepKind, stepTitle, subjectName } from '../i18n/names';
import { t } from '../i18n/index';

// Today's Adventure: a guided session of a few steps (warm-up review, a new
// skill, mixed practice, a Fun Break game, a second subject, a calm-down),
// fitted to the time left today. Each step opens its round or game; coming
// back here shows the next one. Finishing earns an adventure sticker.
const PATH_Y = 300;

export default class AdventureScene extends BaseScene {
  static key = 'Adventure';

  build() {
    this.bg = this.add.rectangle(0, 0, 10, 10, 0xeaf4ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.report({ step: 'loading' });
    startAdventure().then((adventure) => {
      if (!this.sys.isActive()) return;
      if (!isFinished(adventure) && this.timeUpGate()) return;
      this.show(adventure);
    });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  show(adventure) {
    const { main, second } = subjectsForDay(adventure.day);
    const subject = (id) => `${getSubject(id).emoji} ${subjectName(id)}`;
    this.add.text(30, 150, t('adventure.title'), textStyle(26, COLORS.gray)).setOrigin(0, 0.5);
    this.add.text(1250, 150, t('adventure.about', { minutes: estimatedMinutes(adventure.steps), main: subject(main), second: subject(second) }), textStyle(22, COLORS.gray)).setOrigin(1, 0.5);

    const step = currentStep(adventure);
    const count = adventure.steps.length;
    const gap = Math.min(200, 1100 / count);
    const x0 = SAFE.width / 2 - ((count - 1) * gap) / 2;
    adventure.steps.forEach((s, i) => {
      const x = x0 + i * gap;
      const done = adventure.done.includes(s.id);
      const now = step && s.id === step.id;
      if (i < count - 1) this.add.rectangle(x + gap / 2, PATH_Y, gap - 60, 8, done ? COLORS.green : 0xc9d3ea).setRounded(4);
      this.add.circle(x, PATH_Y, 30, done ? COLORS.green : now ? COLORS.primary : COLORS.white).setStrokeStyle(4, done ? COLORS.greenDark : COLORS.primary);
      this.add.text(x, PATH_Y, done ? '✓' : String(i + 1), textStyle(28, done || now ? COLORS.white : COLORS.primary)).setOrigin(0.5);
      const card = this.add.rectangle(x, PATH_Y + 115, gap - 14, 150, COLORS.white).setRounded(20).setAlpha(done || now ? 1 : 0.6);
      if (now) card.setStrokeStyle(5, COLORS.primary);
      glyph(this, x, PATH_Y + 70, STEP_INFO[s.kind].emoji, 34);
      this.add.text(x, PATH_Y + 112, stepKind(s), textStyle(20, COLORS.gray)).setOrigin(0.5);
      this.add.text(x, PATH_Y + 152, stepTitle(s), textStyle(18, COLORS.ink, { wordWrap: { width: gap - 30 } })).setOrigin(0.5);
    });

    if (isFinished(adventure)) {
      this.showFinale(adventure);
    } else {
      const label = t(adventure.done.length ? 'adventure.next' : 'adventure.start', { kind: stepKind(step) });
      const go = new Button(this, SAFE.width / 2, 610, { label, width: 520, height: 100, color: COLORS.green, onTap: () => this.go(...stepRoute(step)) });
      this.tag('go', go.box);
      const skill = step.kind === 'new' || step.kind === 'second' ? getSkill(step.skillIds[0]) : null;
      this.narrator.say(skill ? t('adventure.sayNextSkill', { kind: stepKind(step), title: skillTitle(skill) }) : t('adventure.sayNext', { kind: stepKind(step) }), { show: label });
    }
    this.report({ step: isFinished(adventure) ? 'finished' : 'path', steps: adventure.steps.map((s) => ({ id: s.id, kind: s.kind })), done: [...adventure.done], current: step ? step.id : null, route: step ? stepRoute(step) : null });
  }

  showFinale(adventure) {
    const today = stickersEarnedOn(session.profile.stickers, adventure.day);
    this.add.rectangle(SAFE.width / 2, 600, 760, 200, COLORS.white).setRounded(28).setStrokeStyle(5, colorOf('#FFD23F'));
    glyph(this, SAFE.width / 2 - 300, 600, '🎉', 80);
    this.add.text(SAFE.width / 2 + 30, 545, t('adventure.complete'), textStyle(36, COLORS.primary)).setOrigin(0.5);
    if (today.length) this.add.text(SAFE.width / 2 + 30, 595, t('adventure.todayStickers', { list: today.map((s) => s.emoji).join(' ') }), textStyle(24)).setOrigin(0.5);
    this.add.text(SAFE.width / 2 + 30, 640, t('adventure.tomorrow'), textStyle(22, COLORS.gray)).setOrigin(0.5);
    this.narrator.say(t('adventure.sayComplete', { name: session.profile.name }), { show: t('adventure.complete') });
  }
}
