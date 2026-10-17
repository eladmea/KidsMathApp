import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { COLORS, textStyle } from '../ui/theme';
import { session, recordRound } from '../services/session';
import { buildSession, tallyBySkill } from '../logic/session';
import { getRecord, hasPassed, skillStars } from '../logic/progress';
import { getSkill } from '../curriculum/skills';
import { HOW_TO } from '../curriculum/howTo';

const PRAISE = ['Yes!', 'Great job!', 'You got it!', 'Super!', 'Awesome!'];
const NEXT_RIGHT_MS = 1300;
const NEXT_WRONG_MS = 2600;

// A quiz round for any skill with a question generator: a worked "how to"
// card (until the skill is passed), then ten questions with picture, spoken
// prompt and big answer buttons, then the stars.
//   data: { skillId }
export default class QuizScene extends BaseScene {
  constructor() {
    super('Quiz');
  }

  build({ skillId }) {
    this.skill = getSkill(skillId);
    this.questions = buildSession([skillId]);
    this.results = [];
    this.index = 0;

    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    this.back = new Button(this, 0, 0, { label: '←', width: 84, height: 84, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.go('Home') });
    this.tag('back', this.back.box);
    this.narrator = new Narrator(this, SAFE.width / 2, 70, { width: 860 });
    this.dots = this.questions.map((_, i) => this.add.circle(SAFE.width / 2 - 135 + i * 30, 138, 10, COLORS.gray, 0.35));
    this.picture = this.add.container(SAFE.width / 2, 330);
    this.answers = [];

    const record = getRecord(session.progress, skillId);
    const howTo = HOW_TO[this.skill.generator];
    if (howTo && !hasPassed(record)) this.showHowTo(howTo);
    else this.showQuestion();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
    this.back.setPosition(v.x + 70, v.y + 70);
  }

  showHowTo(text) {
    this.report({ step: 'howTo' });
    this.narrator.say(text, { show: `${this.skill.emoji} ${this.skill.title}` });
    const card = this.add.text(SAFE.width / 2, 330, text, textStyle(40, COLORS.ink, { wordWrap: { width: 820 }, lineSpacing: 10 })).setOrigin(0.5);
    const go = new Button(this, SAFE.width / 2, 560, {
      label: "Got it! Let's play ▶",
      width: 460,
      color: COLORS.green,
      onTap: () => {
        card.destroy();
        go.destroy();
        this.showQuestion();
      },
    });
    this.tag('start', go.box);
  }

  showQuestion() {
    const question = this.questions[this.index];
    this.locked = false;
    this.dots[this.index].setFillStyle(COLORS.primary, 1);
    this.narrator.say(question.speech, { show: question.prompt });
    this.drawPicture(question.visual);

    this.answers.forEach((button) => button.destroy());
    const count = question.choices.length;
    const width = Math.min(240, (1100 - (count - 1) * 24) / count);
    this.answers = question.choices.map((choice, i) => {
      const x = SAFE.width / 2 + (i - (count - 1) / 2) * (width + 24);
      const button = new Button(this, x, 600, {
        label: String(choice),
        width,
        height: 140,
        fontSize: String(choice).length > 3 ? 36 : 72,
        color: COLORS.white,
        textColor: COLORS.ink,
        onTap: () => this.answer(choice, button),
      });
      button.choice = choice;
      this.tag(`choice:${choice}`, button.box);
      return button;
    });
    this.report({ step: 'question', index: this.index, total: this.questions.length, prompt: question.prompt, choices: question.choices, answer: question.answer });
  }

  drawPicture(visual) {
    this.picture.removeAll(true);
    if (!visual || visual.type !== 'objects') return;
    // Rows of up to five, like a ten frame.
    const perRow = 5;
    const size = 96;
    const rows = Math.ceil(visual.count / perRow);
    for (let i = 0; i < visual.count; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, visual.count - row * perRow);
      const x = (i % perRow - (inRow - 1) / 2) * (size + 20);
      const y = (row - (rows - 1) / 2) * (size + 20);
      const item = this.add.text(x, y, visual.emoji, textStyle(size)).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: item, scale: 1, duration: 220, delay: i * 70, ease: 'Back.easeOut' });
      this.picture.add(item);
    }
  }

  answer(choice, button) {
    if (this.locked) return;
    this.locked = true;
    const question = this.questions[this.index];
    const right = choice === question.answer;
    this.results[this.index] = right;
    this.dots[this.index].setFillStyle(right ? COLORS.green : COLORS.orange, 1);
    if (right) {
      button.setColor(COLORS.green).pop();
      button.label.setColor('#ffffff');
      this.narrator.say(`${PRAISE[this.index % PRAISE.length]} ${question.answer}!`);
    } else {
      button.setColor(COLORS.orange).shake();
      const correct = this.answers.find((b) => b.choice === question.answer);
      correct.setColor(COLORS.green).pop();
      correct.label.setColor('#ffffff');
      this.narrator.say(question.explain || `It's ${question.answer}.`);
    }
    this.report({ step: 'feedback', right });
    this.time.delayedCall(right ? NEXT_RIGHT_MS : NEXT_WRONG_MS, () => this.next());
  }

  next() {
    this.index += 1;
    if (this.index < this.questions.length) this.showQuestion();
    else this.finish();
  }

  async finish() {
    this.answers.forEach((button) => button.destroy());
    this.picture.removeAll(true);
    const correct = this.results.filter(Boolean).length;
    const { newlyPassed } = await recordRound(tallyBySkill(this.questions, this.results));
    const stars = skillStars(getRecord(session.progress, this.skill.id));
    const line = newlyPassed.length ? `You passed ${this.skill.title}!` : correct >= 8 ? 'Great playing!' : 'Good practice! Try again to get more stars.';
    this.narrator.say(`You got ${correct} out of ${this.questions.length}. ${line}`);
    this.add.text(SAFE.width / 2, 300, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), textStyle(110, COLORS.yellow)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 420, `${correct} / ${this.questions.length}`, textStyle(64)).setOrigin(0.5);
    const again = new Button(this, SAFE.width / 2 - 170, 580, { label: '🔁 Again', width: 300, color: COLORS.primary, onTap: () => this.scene.restart({ skillId: this.skill.id }) });
    const home = new Button(this, SAFE.width / 2 + 170, 580, { label: '🏠 Home', width: 300, color: COLORS.green, onTap: () => this.go('Home') });
    this.tag('again', again.box);
    this.tag('home', home.box);
    this.report({ step: 'results', correct, stars, passed: newlyPassed.includes(this.skill.id) });
    if (correct >= 8) this.celebrate();
  }

  celebrate() {
    for (let i = 0; i < 24; i++) {
      const piece = this.add.text(SAFE.width / 2, 300, ['🎉', '⭐', '🎈'][i % 3], textStyle(48)).setOrigin(0.5);
      this.tweens.add({
        targets: piece,
        x: SAFE.width / 2 + Math.cos(i) * (300 + (i % 4) * 80),
        y: 300 + Math.sin(i) * (220 + (i % 3) * 40),
        alpha: 0,
        duration: 1400,
        ease: 'Cubic.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }
}
