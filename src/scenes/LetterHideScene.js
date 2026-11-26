import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { art } from '../ui/Art';
import { celebrate, oops, popIn } from '../ui/Juice';
import { COLORS, popStyle, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { content } from '../content/index';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';
import { PLACES, foundLine, letterSpeech, makeRound, movedAway, nextPlace, spots } from '../logic/letterHide';

// Letter Hide and Seek (Word Woods, ages 3-4): a room with four things in it
// (a kitchen, a forest, a park...). The letter shows big, a puff of cloud
// covers the things, and the letter is gone: it hid in the thing whose name
// starts with it. The letter waits at the top, and the narrator names it.
// Tap a thing (or drag it away) to look behind, under or in it. An empty one
// says its name ("Ball. Not here!"), so the child hears its first sound; after
// two misses the narrator says what to look for. Each thing hides the letter
// once, so a round is four letters, and a letter found with no miss scores.
//   data: { skillId, place } (place: room, kitchen, forest or park; by default
//   a new one each round)
const THING_SIZE = 200;
const CARD = { x: 640, y: 212, size: 132 };
const HIDDEN_SIZE = 110;
const HINT_AFTER = 2;
// The first letter waits for the intro to be said.
const FIRST_WHERE_MS = 6200;
const WHERE_MS = 2400;
const BACK_HOME_MS = 1300;
const NEXT_MS = 3200;

export default class LetterHideScene extends BaseScene {
  static key = 'LetterHide';

  static plays = ['LetterHide'];

  // The place this round is played in: the one asked for, or the next one in
  // turn (chosen in prepare()), so "Again" opens somewhere new.
  static placeFor(data = {}) {
    return data.place || LetterHideScene.place || 'room';
  }

  static backdropName(data) {
    return `LetterHide-${LetterHideScene.placeFor(data)}`;
  }

  // The round is picked before the scene opens, so its words and letters
  // download first (services/voicePreload.js).
  static prepare(data = {}) {
    if (!data.place) LetterHideScene.place = nextPlace(LetterHideScene.place);
    const pack = content('literacy');
    const round = makeRound(LetterHideScene.placeFor(data), pack);
    LetterHideScene.prepared = { data, round };
    return round.things.flatMap((thing) => [thing.word, foundLine(pack, thing), letterSpeech(pack, thing.letter)]);
  }

  static voiceGroups() {
    return ['letters'];
  }

  build({ skillId = 'lit-letter-hide' } = {}) {
    this.skill = getSkill(skillId);
    this.pack = content('literacy');
    const prepared = LetterHideScene.prepared && LetterHideScene.prepared.data === this.startData ? LetterHideScene.prepared : null;
    LetterHideScene.prepared = null;
    this.round = prepared ? prepared.round : makeRound(LetterHideScene.placeFor(this.startData), this.pack);
    this.index = 0;
    this.score = 0;
    this.wrong = 0;
    this.busy = true;
    this.target = null;

    this.addBackdrop(PLACES[this.round.place].color, { wash: 0.3 });
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);

    // The letter to find, at the top. Tapping it says it again.
    this.cardLetter = this.add.text(0, 4, '', textStyle(96, COLORS.primaryDark)).setOrigin(0.5);
    this.card = this.add.container(CARD.x, CARD.y, [
      this.add.rectangle(0, 0, CARD.size, CARD.size, COLORS.white).setRounded(28).setStrokeStyle(6, COLORS.yellow),
      this.cardLetter,
    ]).setDepth(5).setVisible(false);
    this.card.setSize(CARD.size, CARD.size).setInteractive({ useHandCursor: true });
    this.card.on('pointerup', () => !this.busy && this.sayWhere());
    this.tag('card', this.card);

    // The hidden letter, under the things until it's found.
    this.hiddenLetter = this.add.container(0, 0, [
      this.add.rectangle(0, 0, HIDDEN_SIZE, HIDDEN_SIZE, COLORS.white).setRounded(24).setStrokeStyle(6, COLORS.green),
      this.add.text(0, 4, '', textStyle(78, COLORS.greenDark)).setOrigin(0.5),
    ]).setDepth(1).setVisible(false);

    const homes = spots(this.round.things.length);
    this.things = this.round.things.map((thing, i) => {
      const picture = art(this, homes[i].x, homes[i].y, { key: thing.key, emoji: thing.emoji, size: THING_SIZE }).setDepth(2);
      picture.thing = thing;
      picture.home = homes[i];
      picture.restScale = picture.scale;
      picture.away = false;
      picture.setInteractive({ useHandCursor: true });
      this.input.setDraggable(picture);
      picture.on('pointerdown', () => (picture.dragged = false));
      picture.on('pointerup', () => !picture.dragged && this.look(picture));
      this.tag(`thing:${thing.id}`, picture);
      return picture;
    });
    this.input.dragDistanceThreshold = 10;
    this.input.on('dragstart', (pointer, picture) => {
      picture.dragged = true;
      picture.holding = true;
    });
    this.input.on('drag', (pointer, picture, x, y) => this.drag(picture, x, y));
    this.input.on('dragend', (pointer, picture) => {
      picture.holding = false;
      // A thing let go before it showed anything goes back.
      if (!picture.away) this.goHome(picture);
      else if (picture !== this.target) this.time.delayedCall(BACK_HOME_MS / 2, () => this.comeBack(picture));
    });

    this.narrator.say(t('letterHide.intro'), { show: t('letterHide.instructions'), force: true });
    this.hideLetter(FIRST_WHERE_MS);
  }

  // ---- hiding ----
  // The letter shows big in the middle, a cloud covers the things while they
  // wiggle, and the letter is gone. Then it waits at the top to be found.
  hideLetter(whereAfter = WHERE_MS) {
    this.busy = true;
    this.wrong = 0;
    this.target = this.things.find((picture) => picture.thing.id === this.round.finds[this.index]);
    const letter = this.target.thing.letter;
    this.things.forEach((picture) => this.goHome(picture, true));
    this.hiddenLetter.setVisible(false);
    this.card.setVisible(false);
    this.cardLetter.setText(letter);
    this.hiddenLetter.list[1].setText(letter);
    if (this.index > 0) this.narrator.say(t('letterHide.hiding'), { force: true });
    this.setCounter(this.index + 1, this.round.finds.length, this.score);

    const big = this.add.text(640, 380, letter, popStyle(170, COLORS.yellow)).setOrigin(0.5).setDepth(10);
    popIn(this, big, { duration: 420 });
    const row = spots(this.things.length);
    const clouds = row.map((spot) => this.add.ellipse(spot.x, spot.y, THING_SIZE * 1.5, THING_SIZE * 1.15, COLORS.white).setAlpha(0).setDepth(8));
    this.tweens.add({ targets: clouds, alpha: 0.96, delay: 900, duration: 380 });
    this.tweens.add({ targets: big, scale: 0, alpha: 0, delay: 1250, duration: 420, ease: 'Back.easeIn', onComplete: () => big.destroy() });
    this.things.forEach((picture) => this.tweens.add({ targets: picture, angle: { from: -7, to: 7 }, delay: 900, duration: 110, yoyo: true, repeat: 4, onComplete: () => picture.setAngle(0) }));
    this.tweens.add({ targets: clouds, alpha: 0, delay: 1900, duration: 420, onComplete: () => clouds.forEach((cloud) => cloud.destroy()) });
    this.time.delayedCall(2300, () => {
      this.card.setVisible(true);
      popIn(this, this.card);
      this.busy = false;
      this.reportFind();
    });
    this.time.delayedCall(Math.max(whereAfter, 2300), () => this.target && !this.target.away && this.sayWhere());
  }

  // "Where is the letter hiding? Samekh." (two sentences, each recorded).
  sayWhere() {
    const letter = letterSpeech(this.pack, this.target.thing.letter);
    this.narrator.say(`${t('letterHide.where')} ${letter}.`, { show: t('letterHide.where'), force: true });
  }

  reportFind() {
    this.report({
      step: 'find',
      place: this.round.place,
      index: this.index,
      total: this.round.finds.length,
      score: this.score,
      letter: this.target.thing.letter,
      target: this.target.thing.id,
      wrong: this.wrong,
      things: this.things.map((picture) => ({ id: picture.thing.id, word: picture.thing.word, letter: picture.thing.letter, hide: picture.thing.hide, x: picture.home.x, y: picture.home.y })),
    });
  }

  // ---- looking ----
  drag(picture, x, y) {
    if (this.busy || picture.away) return;
    picture.setPosition(x, y).setDepth(4);
    if (movedAway(picture.home, x, y)) this.look(picture, { dragged: true });
  }

  // A thing is moved (tapped, or dragged far enough): is the letter there?
  look(picture, { dragged = false } = {}) {
    if (this.busy || picture.away) return;
    picture.away = true;
    if (!dragged) this.moveAside(picture);
    if (picture === this.target) return this.found(picture, { dragged });
    this.wrong += 1;
    oops(this, picture.home.x, picture.home.y, { shake: false });
    // Its name ("Ball."), so the child hears its first sound.
    const hint = this.wrong >= HINT_AFTER;
    this.narrator.say(hint ? `${picture.thing.word}. ${t('letterHide.notHere')} ${t('letterHide.look')}` : `${picture.thing.word}. ${t('letterHide.notHere')}`, { show: t('letterHide.notHere'), force: true });
    if (hint) this.time.delayedCall(700, () => this.nudge(this.target));
    if (!picture.holding) this.time.delayedCall(BACK_HOME_MS, () => this.comeBack(picture));
    this.reportFind();
  }

  // Behind: it slides aside. Under: it lifts up. In: it tips over.
  moveAside(picture) {
    const { home } = picture;
    const hide = picture.thing.hide;
    picture.setDepth(4);
    if (hide === 'behind') this.tweens.add({ targets: picture, x: home.x + (home.x < 640 ? -150 : 150), y: home.y - 20, angle: home.x < 640 ? -8 : 8, duration: 360, ease: 'Back.easeOut' });
    else if (hide === 'under') this.tweens.add({ targets: picture, y: home.y - 170, angle: -10, duration: 380, ease: 'Back.easeOut' });
    else this.tweens.add({ targets: picture, angle: home.x < 640 ? -25 : 25, x: home.x + (home.x < 640 ? -40 : 40), duration: 320, ease: 'Back.easeOut' });
  }

  comeBack(picture) {
    if (picture.holding || picture === this.target) return;
    this.goHome(picture);
  }

  goHome(picture, now = false) {
    this.tweens.killTweensOf(picture);
    const done = () => {
      picture.away = false;
      picture.setDepth(2);
    };
    if (now) {
      picture.setPosition(picture.home.x, picture.home.y).setAngle(0).setScale(picture.restScale);
      return done();
    }
    this.tweens.add({ targets: picture, x: picture.home.x, y: picture.home.y, angle: 0, scale: picture.restScale, duration: 320, ease: 'Sine.easeInOut', onComplete: done });
  }

  // The thing with the letter wiggles, after two misses.
  nudge(picture) {
    if (!picture || picture.away) return;
    this.tweens.add({ targets: picture, angle: { from: -9, to: 9 }, duration: 140, yoyo: true, repeat: 5, onComplete: () => !picture.away && picture.setAngle(0) });
  }

  found(picture, { dragged = false } = {}) {
    this.busy = true;
    if (this.wrong === 0) this.score += 1;
    const { home } = picture;
    // In something: the letter jumps out of it. Otherwise it was there all along.
    const jumps = picture.thing.hide === 'in' && !dragged;
    this.hiddenLetter.setPosition(home.x, home.y).setDepth(jumps ? 5 : 1).setScale(0.5).setVisible(true);
    this.tweens.add({ targets: this.hiddenLetter, scale: 1, y: jumps ? home.y - 170 : home.y, duration: 420, ease: 'Back.easeOut' });
    celebrate(this, home.x, home.y - 40);
    play(this, 'correct');
    this.narrator.say(`${t('letterHide.found')} ${foundLine(this.pack, picture.thing)}`, { show: `${t('letterHide.found')} ${picture.thing.word}`, force: true });
    this.setCounter(this.index + 1, this.round.finds.length, this.score);
    this.report({ step: 'found', index: this.index, target: picture.thing.id, score: this.score, clean: this.wrong === 0 });
    this.time.delayedCall(NEXT_MS, () => {
      this.index += 1;
      if (this.index >= this.round.finds.length) this.finishRound(this.skill.id, this.score, this.round.finds.length);
      else this.hideLetter();
    });
  }
}
