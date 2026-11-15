import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { drawVisual } from '../ui/QuestionVisual';
import { makeInput } from '../ui/QuizInputs';
import { COLORS, popStyle, textStyle } from '../ui/theme';
import { celebrate, oops, pulse } from '../ui/Juice';
import { logEvents, session } from '../services/session';
import { testQuestionCount } from '../services/testBridge';
import { preload, preloadLines, speak, stop as stopSpeech } from '../services/speech';
import { play } from '../services/audio';
import { buildSession, replaceRemaining, tallyBySkill } from '../logic/session';
import { getRecord, hasPassed, toDayKey } from '../logic/progress';
import { profileBand } from '../logic/profiles';
import { adapt, skillForLevel } from '../logic/adaptive';
import { answerLine, exampleSpeech, feedbackDelay, isCorrectAnswer, levelNote } from '../logic/quizRound';
import { getSkill, isQuizSkill } from '../curriculum/skills';
import { generateQuestion } from '../curriculum/generators';
import { howTo } from '../curriculum/howTo';
import { t } from '../i18n/index';
import { skillTitle, talkPrompt } from '../i18n/names';
import { content } from '../content/index';

// How the narrator says a letter tile's sound, in the current language.
const sound = (grapheme) => (content('literacy').soundSpeech || ((g) => g))(grapheme);
// A built word, blended back after the answer: "kuh, aah, tuh… cat!"
const blendLine = (question) => (question.type === 'build' ? t('quiz.blend', { sounds: question.parts.map(sound).join(', '), word: question.word }) : null);
// Everything a question can say: itself, its answer, its picture words and
// captions (said on a tap), and a built word blended back.
const questionLines = (question) =>
  [question.speech, question.explain || answerLine(question), ...(question.choiceWords || []), ...(question.items || []).map((item) => item.caption), question.visual && question.visual.say, blendLine(question)].filter(Boolean);

// How long a new level's questions may wait for their recordings (then
// the device voice says what hasn't arrived).
const NEW_LEVEL_WAIT_MS = 3000;

const titleOf = (mode, skill) => (mode === 'practice' ? t('quiz.title', { emoji: skill.emoji, title: skillTitle(skill) }) : t(`quiz.${mode}`));

// Where the picture and the answers go, by question type (the picture on the
// left and answers on the right when there's a picture; answers across the
// screen when there isn't).
function areas(question) {
  const hasVisual = Boolean(question.visual);
  if (question.type === 'numberLine') return { input: { x: 640, y: 430, width: 1100, height: 300 } };
  if (question.type === 'order') return { input: { x: 640, y: 440, width: 1180, height: 320 } };
  if (question.type === 'build') return { visual: { x: 300, y: 440, width: 480, height: 420 }, input: { x: 900, y: 450, width: 660, height: 440 } };
  if (!hasVisual) return { input: { x: 640, y: 450, width: 1180, height: 400 } };
  return { visual: { x: 340, y: 445, width: 600, height: 450 }, input: { x: 955, y: 450, width: 570, height: 430 } };
}

// A quiz round for one skill (practice) or several mixed (review, mixed).
// Practice rounds open with a worked example until the skill is passed, and
// adapt: 3 wrong in a row steps down a level with an example, 5 right in a
// row steps up. Ends on the Results scene.
//   data: { skillIds, mode = 'practice', count }
export default class QuizScene extends BaseScene {
  static key = 'Quiz';

  // Before the round opens (BaseScene.open), its questions are made here so
  // exactly their recordings can be downloaded first; build() then uses
  // them. Returns every line the round can say.
  static prepare(data = {}) {
    const { skillIds = [], count } = data;
    const questions = buildSession(skillIds, count ?? testQuestionCount());
    const base = getSkill(skillIds[0]);
    const example = base && base.generator ? { ...generateQuestion(base.generator), id: 'example' } : null;
    QuizScene.prepared = { data, questions, example };
    const lines = [...questions, example].filter(Boolean).flatMap(questionLines);
    return [...lines, base && howTo(base.generator)].filter(Boolean);
  }

  // The letter sounds the 🔊 buttons on letter tiles say, and with a grown-up
  // playing along ("Play together") the coaching lines.
  static voiceGroups() {
    return ['letters', ...(session.coaching ? ['t:curriculum'] : [])];
  }

  build({ skillIds, mode = 'practice', count }) {
    // Phaser reuses the scene object between rounds: start every field fresh.
    this.step = null;
    this.locked = false;
    this.answers = null;
    this.visual = null;
    this.timer = null;
    this.skillIds = skillIds;
    this.mode = mode;
    this.baseSkill = getSkill(skillIds[0]);
    this.bandId = profileBand(session.profile).id;
    this.adaptive = mode === 'practice' && isQuizSkill(this.baseSkill);
    this.level = 0;
    this.streak = 0;
    // Made by prepare() for this start, or now (a scene started directly).
    const prepared = QuizScene.prepared && QuizScene.prepared.data === this.startData ? QuizScene.prepared : null;
    QuizScene.prepared = null;
    this.questions = prepared ? prepared.questions : buildSession(skillIds, count ?? testQuestionCount());
    this.firstExample = prepared ? prepared.example : null;
    this.results = [];
    this.index = 0;
    this.finished = false;
    this.replays = 0;

    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    this.addBackButton(() => this.quit());
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30, onReplay: () => (this.replays += 1) });
    this.title = this.add.text(30, 150, titleOf(mode, this.baseSkill), textStyle(26, COLORS.gray)).setOrigin(0, 0.5);
    this.score = this.add.text(1250, 150, '', popStyle(32, COLORS.yellow)).setOrigin(1, 0.5);
    this.dots = this.questions.map((_, i) => this.add.circle(SAFE.width / 2 - ((this.questions.length - 1) * 30) / 2 + i * 30, 150, 10, COLORS.gray, 0.3));
    this.note = this.add.text(SAFE.width / 2, 196, '', textStyle(24, COLORS.primary)).setOrigin(0.5);
    this.help = new Button(this, 1200, 70, { label: '❓', width: 84, height: 84, fontSize: 40, color: COLORS.white, onTap: () => this.showExample(false) });
    this.tag('example', this.help.box);
    this.shown = [];

    const skill = this.currentSkill();
    if (this.adaptive && skill.generator && !hasPassed(getRecord(session.progress, skill.id))) this.showExample();
    else this.showQuestion();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // Keeps the title / progress row just under the narrator bubble, which grows
  // for long prompts.
  placeRow() {
    const bottom = this.narrator.y + this.narrator.bubble.y + this.narrator.bubble.height / 2;
    const y = Math.max(150, bottom + 26);
    [this.title, this.score, ...this.dots].forEach((object) => object.setY(y));
    this.note.setY(y + 44);
  }

  currentSkill() {
    return this.adaptive ? skillForLevel(this.baseSkill, this.level, this.bandId) : this.baseSkill;
  }

  clear() {
    this.shown.forEach((object) => object && object.destroy());
    this.shown = [];
    if (this.visual) this.visual.destroy();
    this.visual = null;
    if (this.answers) this.answers.destroy();
    this.answers = null;
    if (this.timer) this.timer.remove();
  }

  // ---- Worked example: how to play, a question with the answer filled in ----
  // `fromRound`: the round itself asks for it (a hint after wrong answers);
  // the ❓ button can't open one while an answer is showing.
  // `made`: an example made (and its recordings downloaded) beforehand.
  showExample(fromRound = false, made = null) {
    if (this.step === 'feedback' && !fromRound) return;
    const skill = this.currentSkill();
    if (!skill.generator) return;
    this.clear();
    this.step = 'example';
    const howToLine = howTo(skill.generator);
    // The first example was made (and its recordings downloaded) in prepare().
    const ready = this.firstExample && skill.generator === getSkill(this.skillIds[0]).generator ? this.firstExample : null;
    this.firstExample = null;
    const question = made || ready || this.makeExample();
    this.help.setVisible(false);
    this.narrator.say(exampleSpeech(howToLine, question), { show: [howToLine, question.prompt].filter(Boolean).join('\n'), force: Boolean(question.speakAlways) });
    this.placeRow();
    this.dots.forEach((dot) => dot.setVisible(false));
    this.score.setText('');
    this.title.setText(t('quiz.together')).setColor('#FF9A3D');
    const place = areas(question);
    if (place.visual) this.shown.push(drawVisual(this, place.visual.x, place.visual.y - 20, question.visual, { ...place.visual, reveal: question.answer, result: 'correct', showSteps: true }));
    this.answers = makeInput(this, { ...place.input, y: place.input.y - 20 }, question, { onSubmit: () => {}, onSound: (text) => speak(text, { force: true }) });
    this.answers.showSolution();
    const go = new Button(this, SAFE.width / 2, 668, { label: t('common.letsPlay'), width: 420, height: 80, fontSize: 34, color: COLORS.green, onTap: () => this.showQuestion() });
    go.setDepth(10);
    this.shown.push(go);
    this.tag('start', go.box);
    this.report({ step: 'example', skillId: skill.id, type: question.type });
  }

  // ---- A question ----
  showQuestion() {
    this.clear();
    const question = this.questions[this.index];
    this.step = 'question';
    this.locked = false;
    this.replays = 0;
    this.shownAt = Date.now();
    this.title.setText(titleOf(this.mode, this.currentSkill())).setColor('#9E9E9E');
    this.dots.forEach((dot, i) => dot.setVisible(true).setFillStyle(i < this.index ? (this.results[i] ? COLORS.green : COLORS.orange) : i === this.index ? COLORS.primary : COLORS.gray, i <= this.index ? 1 : 0.3));
    this.score.setText(t('quiz.score', { score: this.results.filter(Boolean).length }));
    this.help.setVisible(this.adaptive && Boolean(howTo(this.currentSkill().generator)));
    // Listening tasks are read aloud even with narration off.
    this.narrator.say(question.speech, { show: question.prompt, force: Boolean(question.speakAlways) });
    // The next question's recordings download while this one is answered.
    const next = this.questions[this.index + 1];
    if (next) preload(next.speech);
    this.placeRow();

    this.place = areas(question);
    this.visual = this.place.visual ? drawVisual(this, this.place.visual.x, this.place.visual.y, question.visual, { ...this.place.visual, onSay: (text) => speak(text, { force: true }) }) : null;
    this.answers = makeInput(this, this.place.input, question, {
      onSubmit: (answer) => this.answer(answer),
      onSound: (text) => speak(text.length <= 2 ? sound(text) : text, { force: true }),
      onWord: (text) => speak(text, { force: true }),
    });
    this.answers.appear();
    this.report({
      step: 'question',
      index: this.index,
      total: this.questions.length,
      skillId: question.skillId,
      type: question.type,
      prompt: question.prompt,
      answer: question.answer,
      choices: question.choices,
      choiceWords: question.choiceWords || null,
      sayTarget: (question.visual && question.visual.say) || null,
      parts: question.parts,
      tiles: question.tiles,
      items: question.items,
      line: this.answers.geometry,
      level: this.level,
      mode: this.mode,
    });
  }

  answer(choice) {
    if (this.locked) return;
    this.locked = true;
    this.step = 'feedback';
    const question = this.questions[this.index];
    const right = isCorrectAnswer(question, choice);
    this.results[this.index] = right;

    const adapted = this.adaptive ? adapt({ level: this.level, streak: this.streak }, right, this.baseSkill, this.bandId) : null;
    if (adapted) this.streak = adapted.streak;
    const now = Date.now();
    const events = [{ type: 'answer', at: now, day: toDayKey(), skillId: question.skillId, baseSkillId: this.baseSkill.id, mode: this.mode, correct: right, ms: now - this.shownAt, replays: this.replays, level: this.level, coach: session.coaching }];
    const nextSkill = adapted?.change ? skillForLevel(this.baseSkill, adapted.level, this.bandId) : null;
    if (adapted?.change) events.push({ type: 'level', at: now, day: toDayKey(), skillId: this.baseSkill.id, change: adapted.change, toSkillId: nextSkill.id });
    logEvents(events);

    stopSpeech();
    play(this, right ? 'correct' : 'wrong');
    this.answers.showResult(choice, right);
    this.juice(question, choice, right);
    // Redraw the picture with the answer filled in (and the monster's face).
    if (this.visual) {
      this.visual.destroy();
      this.visual = drawVisual(this, this.place.visual.x, this.place.visual.y, question.visual, { ...this.place.visual, reveal: question.answer, result: right ? 'correct' : 'wrong' });
    }
    if (question.type === 'build') {
      // Blend the sounds back into the word: "kuh, aah, tuh… cat!"
      this.time.delayedCall(400, () => speak(blendLine(question), { force: true }));
    } else if (!right && question.explain) {
      this.narrator.say(question.explain);
    }
    this.dots[this.index].setFillStyle(right ? COLORS.green : COLORS.orange, 1);
    this.score.setText(t('quiz.score', { score: this.results.filter(Boolean).length }));
    this.report({ step: 'feedback', right, change: adapted?.change || null });
    if (session.coaching) this.showTalkPrompt(question, right, () => this.next(adapted, nextSkill));
    else this.timer = this.time.delayedCall(feedbackDelay(question, right), () => this.next(adapted, nextSkill));
  }

  // Sparkles from the right answer (and its number rising), or a gentle shake
  // and a puff on the wrong one.
  juice(question, choice, right) {
    const middle = { x: this.place.input.x, y: this.place.input.y };
    const at = (value) => (this.answers.buttonFor && this.answers.buttonFor(value)) || middle;
    if (right) {
      const spot = at(question.answer);
      celebrate(this, spot.x, spot.y, { number: question.answer });
      pulse(this, this.score);
    } else {
      const spot = at(choice);
      oops(this, spot.x, spot.y);
    }
    this.report({ juice: { index: this.index, effect: right ? 'celebrate' : 'oops' } });
  }

  // "Play together": a prompt for the grown-up to talk about the answer; the
  // round waits for Next.
  showTalkPrompt(question, right, next) {
    const subject = getSkill(question.skillId).subject;
    const card = this.add.container(SAFE.width / 2, 655).setDepth(60);
    card.add(this.add.rectangle(0, 0, 1000, 110, 0xfff4d6).setRounded(24).setStrokeStyle(4, 0xf2b441));
    card.add(this.add.text(-470, 0, `👪 ${talkPrompt(subject, right, this.index)}`, textStyle(24, COLORS.ink, { align: 'left', wordWrap: { width: 700 } })).setOrigin(0, 0.5));
    const button = new Button(this, 390, 0, { label: t('quiz.coachNext'), width: 190, height: 80, fontSize: 30, color: COLORS.primary, onTap: () => {
      card.destroy();
      next();
    } });
    card.add(button);
    this.tag('coach-next', button.box);
    this.report({ step: 'talk', right });
  }

  makeExample() {
    return { ...generateQuestion(this.currentSkill().generator), id: 'example' };
  }

  next(adapted, nextSkill) {
    this.index += 1;
    if (this.index >= this.questions.length) return this.finish();
    const change = adapted?.change;
    const newLevel = change === 'up' || change === 'down';
    if (newLevel) {
      this.questions = replaceRemaining(this.questions, this.index, nextSkill);
      this.level = adapted.level;
    }
    const note = change ? levelNote(change, nextSkill, adapted.level) : null;
    this.note.setText(note || '');
    this.report({ note, level: this.level });
    // A run of wrong answers gets a worked example of the (easier) skill.
    const example = (change === 'down' || change === 'hint') && this.currentSkill().generator ? this.makeExample() : null;
    const show = () => (example ? this.showExample(true, example) : this.showQuestion());
    if (!newLevel && !example) return show();
    // New questions or a new example: their recordings download first (the
    // level note shows meanwhile), so the voice doesn't wait mid-question.
    const lines = [...(newLevel ? this.questions.slice(this.index).flatMap(questionLines) : []), ...(example ? [exampleSpeech(howTo(this.currentSkill().generator), example), ...questionLines(example)] : [])];
    const round = this.questions;
    const index = this.index;
    Promise.race([preloadLines(lines), new Promise((resolve) => setTimeout(resolve, NEW_LEVEL_WAIT_MS))]).then(() => {
      // Unless the player left (or the scene restarted) meanwhile.
      if (this.sys.isActive() && !this.finished && this.questions === round && this.index === index) show();
    });
  }

  finish() {
    this.finished = true;
    const score = this.results.filter(Boolean).length;
    this.swap('Results', {
      skillIds: this.skillIds,
      mode: this.mode,
      score,
      total: this.questions.length,
      tallies: tallyBySkill(this.questions, this.results),
      replay: { key: 'Quiz', data: this.startData },
      adventureStep: this.startData.adventureStep,
    });
  }

  // Leaving a practice round early is logged as a quit.
  quit() {
    if (!this.finished && this.mode === 'practice') {
      logEvents([{ type: 'quit', at: Date.now(), day: toDayKey(), skillId: this.baseSkill.id, mode: this.mode, answered: this.results.length, total: this.questions.length }]);
    }
    this.back();
  }
}
