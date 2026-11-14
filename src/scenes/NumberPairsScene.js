import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import IconText from '../ui/IconText';
import Narrator from '../ui/Narrator';
import { DICE } from '../ui/QuestionVisual';
import { glyph } from '../ui/Art';
import { celebrate, pulse, tapSpark } from '../ui/Juice';
import { COLORS, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { speak } from '../services/speech';
import { play } from '../services/audio';
import { content } from '../content/index';
import { getLevel, isMatch, isSlip, makeDeck, soloScore, winner } from '../logic/numberPairs';
import { buddyLevel, buddySlip, chooseFirstCard, chooseSecondCard, forgetCards, observeCard } from '../logic/memoryBuddy';
import { buildPlayers } from '../logic/players';
import { profileBand } from '../logic/profiles';
import { getSkill } from '../curriculum/skills';
import { getLearningGame } from '../curriculum/games';
import { gameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Number Pairs: cards lie face down; turn two over and keep them when they
// show the same number (dots and a numeral, or a numeral and its word).
// On Number Island it is played alone and scored: a point per pair, less one
// for each slip (missing a partner already seen). From the Games list it is
// played against the buddy or a friend: a pair keeps your turn, most pairs
// wins.
//   data: { skillId } (island) or { variant, mode: 'solo' | 'duo' } (Games)
const AREA = { x: 640, top: 232, width: 1120, height: 468 };
const GAP = 14;
const FLIP_MS = 110;
const SHOW_MS = 900;
const BUDDY_FIRST_MS = 900;
const BUDDY_SECOND_MS = 800;
const NEXT_MS = 1500;
// A found pair: a moment to see it, then both cards fly to the finder's
// pile (by the score), and the score goes up as they land.
const COLLECT_DELAY_MS = 450;
const COLLECT_MS = 520;
const COLLECT_GAP_MS = 110;
const PILE_SCALE = 0.3;

export default class NumberPairsScene extends BaseScene {
  static key = 'NumberPairs';
  static plays = ['NumberPairs'];

  build({ skillId = null, variant = null, mode = 'solo' } = {}) {
    this.skill = skillId ? getSkill(skillId) : null;
    this.levelId = this.skill ? this.skill.pairsLevel : variant || 'dots5';
    this.level = getLevel(this.levelId);
    // Alone on the island; against the buddy or a friend from the Games list.
    this.versus = !this.skill;
    this.mode = mode;
    this.players = this.versus ? buildPlayers(session.profile, mode) : null;
    this.turn = 1;
    this.pairs = { 1: 0, 2: 0 };
    this.found = 0;
    this.slips = 0;
    // What the scores show: they catch up as each pair lands on its pile.
    this.shown = { pairs: { 1: 0, 2: 0 }, found: 0 };
    this.piles = { 1: 0, 2: 0 };
    // Turns judged so far, reported with each result, so a test can wait for
    // the next one (a pair's 'pair' step only lasts half a second).
    this.judged = 0;
    this.seen = new Set();
    this.first = null;
    this.busy = true;
    this.over = false;
    this.memory = [];
    this.buddy = buddyLevel(profileBand(session.profile).id);
    this.words = content('math').NUMBER_WORDS;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xf3efff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    if (this.skill) {
      this.addGameHeader(this.skill);
    } else {
      const game = getLearningGame('number-pairs');
      this.addHeader(game.emoji, gameTitle(game));
      this.scores = [1, 2].map((n) => new IconText(this, n === 1 ? 330 : 950, 190, '', textStyle(28)).setOrigin(0.5, 0.5));
    }

    this.deck = makeDeck(this.levelId);
    this.cards = this.layoutCards();
    this.narrator.say(t(this.level.faces.includes('word') ? 'numberPairs.introWords' : 'numberPairs.introDots'), { show: t('numberPairs.instructions'), force: true });
    this.refresh();
    if (this.level.peekMs) this.peek();
    else this.startTurn();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // ---- the cards ----
  layoutCards() {
    const count = this.deck.length;
    const cols = count / 2;
    const width = Math.min(200, (AREA.width - GAP * (cols - 1)) / cols);
    const height = Math.min(210, (AREA.height - GAP) / 2);
    return this.deck.map((data, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = AREA.x + (col - (cols - 1) / 2) * (width + GAP);
      const y = AREA.top + height / 2 + row * (height + GAP);
      const card = this.add.container(x, y);
      // Not `data`: a game object's `data` is Phaser's own data manager.
      card.info = data;
      card.back = this.add.container(0, 0, [
        this.add.rectangle(0, 0, width, height, 0x8e5ce0).setRounded(20).setStrokeStyle(5, COLORS.white),
        this.add.text(0, 0, '?', textStyle(Math.round(height * 0.32), COLORS.white)).setOrigin(0.5),
      ]);
      card.frame = this.add.rectangle(0, 0, width, height, COLORS.white).setRounded(20).setStrokeStyle(5, 0xd8cdf2);
      card.face = this.add.container(0, 0, [card.frame, ...this.drawFace(data, width, height)]).setVisible(false);
      card.add([card.back, card.face]);
      card.setSize(width, height).setInteractive({ useHandCursor: true });
      // The size a "pair!" bounce returns to, whatever moment it starts in.
      card.restScale = 1;
      card.on('pointerup', () => this.pick(card));
      this.tag(`card:${data.id}`, card);
      return card;
    });
  }

  drawFace({ value, face }, width, height) {
    if (face === 'numeral') return [this.add.text(0, 0, String(value), textStyle(Math.round(Math.min(height * 0.45, width * 0.5)), COLORS.ink)).setOrigin(0.5)];
    if (face === 'word') {
      const size = width < 150 ? 24 : 30;
      return [this.add.text(0, 0, this.words[value], textStyle(size, COLORS.primary, { wordWrap: { width: width - 16 } })).setOrigin(0.5)];
    }
    // Dots: dice spots up to 6, then two rows of five (a ten frame).
    const g = this.add.graphics().fillStyle(0xff6fa8, 1);
    if (value <= 6) {
      const cell = Math.min(width, height) * 0.24;
      DICE[value].forEach(([r, c]) => g.fillCircle((c - 1) * cell, (r - 1) * cell, cell * 0.36));
    } else {
      const cell = (width * 0.86) / 5;
      for (let i = 0; i < value; i++) g.fillCircle((i % 5 - 2) * cell, (Math.floor(i / 5) - 0.5) * cell * 1.1, cell * 0.36);
    }
    return [g];
  }

  // Turns a card over (face up or down) with a quick flip.
  turnOver(card, up) {
    this.tweens.killTweensOf(card);
    this.tweens.chain({
      targets: card,
      tweens: [
        { scaleX: 0, duration: FLIP_MS, ease: 'Sine.easeIn', onComplete: () => {
          card.back.setVisible(!up);
          card.face.setVisible(up);
        } },
        { scaleX: 1, duration: FLIP_MS, ease: 'Sine.easeOut' },
      ],
    });
  }

  // ---- a head start: every card face up for a moment ----
  peek() {
    this.cards.forEach((card) => {
      card.back.setVisible(false);
      card.face.setVisible(true);
    });
    this.narrator.say(t('numberPairs.peek'), { show: t('numberPairs.instructions') });
    this.report({ step: 'peek' });
    this.time.delayedCall(this.level.peekMs, () => {
      this.cards.forEach((card) => this.turnOver(card, false));
      this.time.delayedCall(FLIP_MS * 2, () => this.startTurn());
    });
  }

  // ---- turns ----
  buddyTurn() {
    return this.versus && this.mode === 'solo' && this.turn === 2;
  }

  startTurn() {
    this.busy = false;
    this.first = null;
    this.refresh();
    this.report({ step: this.buddyTurn() ? 'buddy' : 'play' });
    if (this.buddyTurn()) this.playBuddy();
  }

  pick(card) {
    if (this.busy || this.over || this.buddyTurn() || card.info.status !== 'hidden') return;
    this.reveal(card);
  }

  reveal(card) {
    card.info.status = 'up';
    this.turnOver(card, true);
    const seenBefore = new Set(this.seen);
    this.seen.add(card.info.id);
    if (this.versus && this.mode === 'solo') this.memory = observeCard(this.memory, card.info, this.buddy);
    if (!this.first) {
      this.first = card;
      this.report({ up: [card.info.id] });
      return;
    }
    const first = this.first;
    this.busy = true;
    this.report({ up: [first.info.id, card.info.id] });
    this.time.delayedCall(FLIP_MS * 2 + 200, () => this.judge(first, card, seenBefore));
  }

  judge(first, second, seenBefore) {
    this.judged += 1;
    if (isMatch(first.info, second.info)) {
      [first, second].forEach((card) => {
        card.info.status = 'matched';
        card.frame.setStrokeStyle(6, COLORS.green);
        card.disableInteractive();
        pulse(this, card, { to: 1.12 });
      });
      this.collect([first, second], this.turn);
      this.found += 1;
      this.pairs[this.turn] += 1;
      this.memory = forgetCards(this.memory, [first.info.id, second.info.id]);
      play(this, 'correct');
      speak(String(first.info.value));
      celebrate(this, (first.x + second.x) / 2, (first.y + second.y) / 2);
      this.refresh();
      this.report({ step: 'pair', value: first.info.value, judged: this.judged, result: 'pair' });
      if (this.found === this.level.pairs) return this.time.delayedCall(COLLECT_DELAY_MS + COLLECT_MS + COLLECT_GAP_MS + 500, () => this.finish());
      // A pair keeps the turn.
      return this.time.delayedCall(500, () => this.startTurn());
    }
    if (!this.versus && isSlip(first.info, second.info, seenBefore, this.deck)) this.slips += 1;
    this.report({ step: 'miss', slips: this.slips, judged: this.judged, result: 'miss' });
    this.time.delayedCall(SHOW_MS, () => {
      [first, second].forEach((card) => {
        card.info.status = 'hidden';
        this.turnOver(card, false);
      });
      if (this.versus) this.turn = this.turn === 1 ? 2 : 1;
      this.time.delayedCall(FLIP_MS * 2, () => this.startTurn());
    });
  }

  // ---- a found pair goes to the finder's pile ----
  // Where pile card n of `player` lands: just right of their score (against
  // someone), or left of the pairs counter in the corner (alone), each card a
  // little further along so the pile shows how many.
  pileSpot(player, n) {
    if (!this.versus) {
      const bounds = this.headerCounter.getBounds();
      return { x: bounds.left - 46 - n * 9, y: bounds.centerY + 2 - n * 2 };
    }
    const bounds = this.scores[player - 1].getBounds();
    return { x: bounds.right + 46 + n * 9, y: bounds.centerY + 2 - n * 2 };
  }

  collect(cards, player) {
    this.time.delayedCall(COLLECT_DELAY_MS, () => {
      cards.forEach((card, i) => {
        const place = this.piles[player];
        const spot = this.pileSpot(player, place);
        this.piles[player] += 1;
        this.tweens.killTweensOf(card);
        card.setDepth(30);
        const last = i === cards.length - 1;
        this.tweens.add({
          targets: card,
          x: spot.x,
          y: spot.y,
          scale: PILE_SCALE,
          angle: (i === 0 ? -1 : 1) * (4 + Math.random() * 5),
          duration: COLLECT_MS,
          delay: i * COLLECT_GAP_MS,
          ease: 'Cubic.easeInOut',
          onComplete: () => {
            card.setDepth(5 + place);
            if (last) this.landed(player, spot);
          },
        });
      });
    });
  }

  // The pair is on the pile: now the score goes up.
  landed(player, spot) {
    if (this.over) return;
    this.shown.pairs[player] += 1;
    this.shown.found += 1;
    this.refresh();
    play(this, 'ding');
    tapSpark(this, spot.x, spot.y);
    const label = this.versus ? this.scores[player - 1] : this.headerCounter;
    const scale = label.scale;
    this.tweens.add({ targets: label, scale: scale * 1.25, duration: 140, yoyo: true, ease: 'Quad.easeOut', onComplete: () => label.setScale(scale) });
  }

  playBuddy() {
    this.busy = true;
    this.time.delayedCall(BUDDY_FIRST_MS, () => {
      if (this.over) return;
      const first = chooseFirstCard(this.deck, this.memory);
      this.reveal(this.cards[first.id]);
      this.busy = true;
      this.time.delayedCall(BUDDY_SECOND_MS, () => {
        if (this.over) return;
        const second = chooseSecondCard(this.deck, this.memory, first, Math.random, buddySlip(this.buddy, this.pairs[2], this.pairs[1]));
        this.reveal(this.cards[second.id]);
      });
    });
  }

  name(n) {
    const player = this.players[n];
    return player.name || t(player.id === 'buddy' ? 'twoPlayer.buddy' : `twoPlayer.${player.id}`);
  }

  refresh() {
    if (this.versus) {
      [1, 2].forEach((n, i) => {
        const on = this.turn === n && !this.over;
        this.scores[i].setText(t('numberPairs.score', { icon: this.players[n].icon, name: this.name(n), count: this.shown.pairs[n] }));
        this.scores[i].setColor(on ? this.players[n].main : '#9e9e9e').setScale(on ? 1.12 : 1);
      });
    }
    this.headerCounter.setText(t('common.progress', { index: this.shown.found, total: this.level.pairs }));
    this.report({
      level: this.levelId,
      versus: this.versus,
      mode: this.mode,
      turn: this.turn,
      found: this.found,
      total: this.level.pairs,
      pairs: { ...this.pairs },
      shown: { ...this.shown.pairs },
      piles: { ...this.piles },
      cards: this.deck.map(({ id, value, face, status }) => ({ id, value, face, status })),
    });
  }

  // ---- the end ----
  finish() {
    this.over = true;
    this.shown = { pairs: { ...this.pairs }, found: this.found };
    this.refresh();
    if (!this.versus) {
      const score = soloScore(this.level.pairs, this.slips);
      this.narrator.say(t('numberPairs.done'), { show: t('numberPairs.done') });
      this.report({ step: 'done', score, slips: this.slips });
      this.time.delayedCall(NEXT_MS, () => this.finishRound(this.skill.id, score, this.level.pairs));
      return;
    }
    const won = winner(this.pairs);
    const title = won ? t('twoPlayer.wins', { name: `${this.players[won].icon} ${this.name(won)}` }) : t('twoPlayer.tie');
    speak(t(won ? 'twoPlayer.sayWin' : 'twoPlayer.sayTie'), { force: true });
    const dialog = new Dialog(this, { width: 620, height: 380, title });
    dialog.add(glyph(this, 0, -30, won ? '🏆' : '🤝', 90));
    // The map is the way on; playing again is the smaller choice.
    const again = new Button(this, -165, 115, { label: t('twoPlayer.playAgain'), width: 200, height: 70, fontSize: 26, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.replay() });
    const map = new Button(this, 105, 110, { label: t('common.map'), width: 300, height: 92, fontSize: 38, color: COLORS.green, onTap: () => this.back() });
    dialog.add([again, map]);
    this.tag('again', again.box);
    this.tag('map', map.box);
    this.report({ step: 'over', winner: won });
  }
}
