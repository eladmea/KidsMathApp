import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { speak } from '../services/speech';
import { content } from '../content/index';
import { makeRound, roundTotal } from '../logic/feelingsFriends';
import { getSkill } from '../curriculum/skills';

// Feelings Friends (ages 5-6): a friend says what happened. Name how they
// feel (3 faces), then pick what would help (one kind choice, two unkind).
// A point for each, 4 friends a round.
//   data: { skillId }
const FEEDBACK_MS = { right: 1800, wrong: 2800 };
const FRIEND_AT = { x: 190, y: 330 };

export default class FeelingsFriendsScene extends BaseScene {
  static key = 'FeelingsFriends';
  static plays = ['FeelingsFriends'];

  build({ skillId = 'sel-feelings-friends' } = {}) {
    this.skill = getSkill(skillId);
    this.words = content('sel');
    this.turns = makeRound();
    this.total = roundTotal(this.turns);
    this.index = 0;
    this.score = 0;
    this.choices = [];
    this.friendArt = null;
    this.mood = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff4e6).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.bubble = this.add.rectangle(760, 265, 820, 120, COLORS.white).setRounded(28).setInteractive({ useHandCursor: true });
    this.bubble.on('pointerup', () => speak(this.storyLine(), { force: true }));
    this.tag('story', this.bubble);
    this.bubbleName = this.add.text(370, 232, '', textStyle(22, COLORS.gray)).setOrigin(0, 0.5);
    this.bubbleText = this.add.text(370, 280, '', textStyle(28, COLORS.ink, { align: 'left', wordWrap: { width: 760 } })).setOrigin(0, 0.5);
    this.question = this.add.text(760, 375, '', textStyle(34, COLORS.primary)).setOrigin(0.5);
    this.message = this.add.text(FRIEND_AT.x, 560, '', textStyle(24, COLORS.ink, { wordWrap: { width: 320 } })).setOrigin(0.5, 0);
    this.startFriend();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  get turn() {
    return this.turns[this.index];
  }

  friendWords() {
    return this.words.FRIENDS[this.turn.friend.id];
  }

  feelingWord(id) {
    return this.words.FEELINGS[id].word;
  }

  questionLine() {
    const { name } = this.friendWords();
    return this.step === 'feeling' ? this.words.say.friends.feelQuestion({ name }) : this.words.say.friends.helpQuestion({ name });
  }

  storyLine() {
    const { name, story } = this.friendWords();
    return this.step === 'feeling' ? this.words.say.friends.story({ name, story, question: this.questionLine() }) : this.questionLine();
  }

  startFriend() {
    const { friend } = this.turn;
    if (this.friendArt) this.friendArt.destroy();
    this.friendArt = glyph(this, FRIEND_AT.x, FRIEND_AT.y, friend.emoji, 160);
    const { name, story } = this.friendWords();
    this.bubbleName.setText(`${this.words.say.friends.says({ name })} 🔊`);
    this.bubbleText.setText(story);
    this.setStep('feeling');
  }

  setStep(step) {
    this.step = step;
    this.picked = null;
    this.message.setText('');
    this.setMood(step === 'help' ? this.words.FEELINGS[this.turn.friend.feeling].emoji : null);
    this.question.setText(this.questionLine());
    this.setCounter(this.index + 1, this.turns.length, this.score, '💛');
    this.choices.forEach((choice) => choice.destroy());
    this.choices = step === 'feeling' ? this.feelingChoices() : this.helpChoices();
    this.narrator.say(this.storyLine(), { show: this.questionLine() });
    this.report({ step, index: this.index, total: this.turns.length, score: this.score, friend: this.turn.friend.id, answer: this.answerId() });
  }

  answerId() {
    return this.step === 'feeling' ? this.turn.friend.feeling : this.turn.helpChoices.find((o) => o.helpful).id;
  }

  setMood(emoji) {
    if (this.mood) this.mood.destroy();
    this.mood = emoji ? glyph(this, FRIEND_AT.x + 95, FRIEND_AT.y - 85, emoji, 64) : null;
  }

  feelingChoices() {
    return this.turn.feelingChoices.map((id, i) => {
      const x = 560 + i * 200;
      const button = new Button(this, x, 500, { label: '', width: 170, height: 170, color: COLORS.white, onTap: () => this.pickFeeling(id) });
      button.add(glyph(this, 0, -14, this.words.FEELINGS[id].emoji, 100));
      button.add(this.add.text(0, 62, this.feelingWord(id), textStyle(22)).setOrigin(0.5));
      this.tag(`choice:${id}`, button.box);
      button.choiceId = id;
      return button;
    });
  }

  helpChoices() {
    const words = this.friendWords();
    return this.turn.helpChoices.map((option, i) => {
      const button = new Button(this, 760, 455 + i * 100, { label: '', width: 680, height: 86, color: COLORS.white, onTap: () => this.pickHelp(option) });
      button.add(glyph(this, -300, 0, option.emoji, 48));
      button.add(this.add.text(-255, 0, words[option.kind][option.index], textStyle(28, COLORS.ink)).setOrigin(0, 0.5));
      this.tag(`choice:${option.id}`, button.box);
      button.choiceId = option.id;
      return button;
    });
  }

  pickFeeling(id) {
    const { name, story } = this.friendWords();
    const feeling = this.feelingWord(this.turn.friend.feeling);
    const right = id === this.turn.friend.feeling;
    const say = this.words.say.friends;
    this.answer(id, right, right ? say.feelRight({ name, feeling }) : say.feelWrong({ name, feeling, story }));
  }

  pickHelp(option) {
    const words = this.friendWords();
    const helpful = this.turn.helpChoices.find((o) => o.helpful);
    const say = this.words.say.friends;
    this.answer(option.id, option.helpful, option.helpful ? say.helpRight() : say.helpWrong({ name: words.name, helpful: words.helps[helpful.index] }));
  }

  answer(id, right, line) {
    if (this.picked !== null) return;
    this.picked = id;
    if (right) this.score += 1;
    const answer = this.answerId();
    this.choices.forEach((choice) => {
      choice.setEnabled(false);
      if (choice.choiceId === answer) choice.setColor(0xc8f2cf).setAlpha(1);
      else if (choice.choiceId === id) choice.setColor(0xffd0d0).setAlpha(1);
      else choice.setAlpha(0.45);
    });
    if (this.step === 'help') this.setMood('💛');
    this.message.setText(line);
    play(this, right ? 'correct' : 'wrong');
    this.narrator.say(line, { show: this.questionLine(), force: true });
    this.setCounter(this.index + 1, this.turns.length, this.score, '💛');
    this.report({ picked: id, right, score: this.score });
    this.time.delayedCall(FEEDBACK_MS[right ? 'right' : 'wrong'], () => this.next());
  }

  next() {
    if (this.step === 'feeling') return this.setStep('help');
    this.index += 1;
    if (this.index >= this.turns.length) this.finishRound(this.skill.id, this.score, this.total);
    else this.startFriend();
  }
}
