import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import Narrator from '../ui/Narrator';
import { DICE } from '../ui/QuestionVisual';
import { glyph } from '../ui/Art';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { speak } from '../services/speech';
import { play } from '../services/audio';
import { content } from '../content/index';
import { chipCostToMatch, createDeck, getVariant, isStalemate, otherPlayer, startingChips } from '../logic/memoryGame';
import { buddyLevel, chooseFirstCard, chooseSecondCard, decideGap, forgetCards, observeCard } from '../logic/memoryBuddy';
import { buildPlayers } from '../logic/players';
import { profileBand } from '../logic/profiles';
import { t } from '../i18n/index';

// Memory Chips: find pairs on a face-down grid. Two cards that don't match
// can still be paired by paying the chips for the gap between them (3 and 7
// cost 4), if you can work it out: right, and the chips go to the other
// player; wrong, and you lose them. Solo against the buddy (who forgets and
// sometimes gets the gap wrong) or with a friend on the same device.
//   data: { variant, mode: 'solo' | 'duo' }
const PEEK_DELAY_MS = 700;
const GUESS_FEEDBACK_DELAY_MS = 1400;
const BUDDY_FIRST_FLIP_MS = 900;
const BUDDY_SECOND_FLIP_MS = 800;
const BUDDY_THINK_MS = 1500;
const GRID = { left: 330, top: 185, width: 920, height: 520, gap: 12 };
const ALPHABET_HELPER = ['a', 'b', 'c', 'd', 'e', 'f'];

// How a card's face is drawn: dice dots, a picture, or its label.
function drawFace(scene, container, face, size, color) {
  if (face.kind === 'dots') {
    const g = scene.add.graphics();
    const cell = (size * 0.7) / 3;
    g.fillStyle(color, 1);
    (DICE[face.count] || []).forEach(([r, c]) => g.fillCircle((c - 1) * cell, (r - 1) * cell, cell * 0.33));
    container.add(g);
  } else if (face.picture) {
    container.add(glyph(scene, 0, 0, face.label, size * 0.55));
  } else {
    const scale = face.label.length <= 2 ? 0.42 : face.label.length <= 4 ? 0.3 : 0.23;
    container.add(scene.add.text(0, 0, face.label, textStyle(Math.round(size * scale), color)).setOrigin(0.5));
  }
}

export default class MemoryScene extends BaseScene {
  static key = 'Memory';

  build({ variant: variantId, mode = 'solo' } = {}) {
    this.variant = getVariant(variantId);
    this.mode = mode === 'duo' ? 'duo' : 'solo';
    this.solo = this.mode === 'solo';
    this.words = content('math').say.memory;
    const { profile } = session;
    this.players = buildPlayers(profile, this.mode);
    Object.values(this.players).forEach((player) => {
      if (!player.name) player.name = t(`twoPlayer.${player.id}`);
    });
    this.level = buddyLevel(profile ? profileBand(profile).id : undefined);
    this.deck = createDeck(this.variant.id, { letters: content('literacy').MEMORY_LETTERS });
    this.flipped = [];
    this.current = this.solo || Math.random() < 0.5 ? 1 : 2;
    this.scores = { 1: 0, 2: 0 };
    const chips = startingChips(this.variant.id);
    this.chips = { 1: chips, 2: chips };
    this.pending = null;
    this.guess = null;
    this.busy = false;
    this.over = false;
    this.memory = {};
    this.buddyTimer = null;
    this.dialog = null;
    this.cards = [];

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xf4f1ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    const option = t(`curriculum.games.memory-chips.options.${this.variant.id}.label`);
    this.add.text(30, 150, option, textStyle(24, COLORS.gray)).setOrigin(0, 0.5);
    this.playerCards = [1, 2].map((n) => this.makePlayerCard(n));
    this.layoutGrid();
    this.refresh();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  get buddyTurn() {
    return this.solo && this.current === 2;
  }

  // ---- drawing ----
  makePlayerCard(n) {
    const y = 270 + (n - 1) * 170;
    const player = this.players[n];
    const box = this.add.rectangle(160, y, 270, 140, colorOf(player.light)).setRounded(24);
    glyph(this, 70, y, player.icon, 56);
    const name = this.add.text(110, y - 22, player.name, textStyle(26, colorOf(player.dark), { align: 'left' })).setOrigin(0, 0.5);
    const stats = this.add.text(110, y + 22, '', textStyle(22, COLORS.ink, { align: 'left' })).setOrigin(0, 0.5);
    return { box, name, stats };
  }

  layoutGrid() {
    const count = this.deck.length;
    this.columns = count > 16 ? 6 : 4;
    const rows = Math.ceil(count / this.columns);
    const { width, height, gap } = GRID;
    this.cardSize = Math.min((width - gap * (this.columns - 1)) / this.columns, (height - gap * (rows - 1)) / rows);
    const gridWidth = this.columns * this.cardSize + (this.columns - 1) * gap;
    this.gridLeft = GRID.left + (width - gridWidth) / 2;
    this.cards = this.deck.map((card, i) => {
      const x = this.gridLeft + (i % this.columns) * (this.cardSize + gap) + this.cardSize / 2;
      const y = GRID.top + Math.floor(i / this.columns) * (this.cardSize + gap) + this.cardSize / 2;
      const container = this.add.container(x, y);
      const box = this.add.rectangle(0, 0, this.cardSize, this.cardSize, COLORS.primary).setRounded(18).setInteractive({ useHandCursor: true });
      box.on('pointerup', () => this.tapCard(card.id));
      this.tag(`card:${card.id}`, box);
      container.add(box);
      return { container, box, face: null, status: null };
    });
  }

  drawCard(card) {
    const view = this.cards[card.id];
    if (view.status === card.status) return;
    view.status = card.status;
    if (view.face) view.face.destroy();
    view.face = this.add.container(0, 0);
    view.container.add(view.face);
    const up = card.status !== 'hidden';
    const matched = card.status === 'matched';
    view.box.setFillStyle(matched ? COLORS.green : up ? COLORS.white : COLORS.primary).setStrokeStyle(4, matched ? COLORS.greenDark : COLORS.white);
    if (up) drawFace(this, view.face, card.face, this.cardSize, matched ? COLORS.white : COLORS.ink);
    else view.face.add(this.add.text(0, 0, '?', textStyle(Math.round(this.cardSize * 0.4), COLORS.white)).setOrigin(0.5));
  }

  refresh() {
    this.deck.forEach((card) => this.drawCard(card));
    [1, 2].forEach((n) => {
      const { box, stats } = this.playerCards[n - 1];
      const active = n === this.current && !this.over;
      box.setStrokeStyle(active ? 6 : 0, colorOf(this.players[n].main)).setScale(active ? 1.04 : 1);
      stats.setText(t('memory.score', { pairs: this.scores[n], chips: this.chips[n] }));
    });
    const player = this.players[this.current];
    if (!this.over) this.narrator.text.setText(this.buddyTurn ? t('twoPlayer.buddyPlaying', { name: player.name }) : t('twoPlayer.turn', { name: `${player.icon} ${player.name}` }));
    this.checkOver();
    this.report(this.snapshot());
    this.scheduleBuddy();
  }

  snapshot() {
    const pending = this.pending && { cost: this.pending.cost, chipsAvailable: this.pending.chipsAvailable, lowId: this.pending.lowId, highId: this.pending.highId };
    return {
      step: this.over ? 'over' : this.pending ? 'gap' : 'flip',
      variant: this.variant.id,
      guessStyle: this.variant.guessStyle,
      mode: this.mode,
      current: this.current,
      buddyTurn: this.buddyTurn,
      busy: this.busy,
      scores: { ...this.scores },
      chips: { ...this.chips },
      deck: this.deck.map(({ id, value, status }) => ({ id, value, status })),
      flipped: this.flipped.map((card) => card.id),
      pending,
      guess: this.guess,
      winner: this.over ? this.winner() : null,
    };
  }

  // ---- playing ----
  tapCard(id) {
    if (this.buddyTurn) return;
    this.flip(this.deck[id]);
  }

  flip(card) {
    if (this.busy || this.over || this.pending || card.status !== 'hidden' || this.flipped.length >= 2) return;
    this.memory = observeCard(this.memory, card, this.level.recall);
    card.status = 'flipped';
    this.flipped.push(card);
    speak(this.words.face(card.face), { force: false });
    if (this.flipped.length === 2) {
      this.busy = true;
      const [first, second] = this.flipped;
      this.time.delayedCall(PEEK_DELAY_MS, () => (first.value === second.value ? this.matchPair(first, second) : this.mismatch(first, second)));
    }
    this.refresh();
  }

  matchPair(first, second) {
    this.memory = forgetCards(this.memory, [first.id, second.id]);
    first.status = 'matched';
    second.status = 'matched';
    this.scores[this.current] += 1;
    this.flipped = [];
    this.busy = false;
    play(this, 'correct');
    this.refresh();
  }

  mismatch(first, second) {
    const [low, high] = first.value < second.value ? [first, second] : [second, first];
    this.pending = {
      lowId: low.id,
      highId: high.id,
      low,
      high,
      cost: chipCostToMatch(low.value, high.value),
      chipsAvailable: this.chips[this.current],
      opponent: otherPlayer(this.current),
    };
    this.guess = null;
    this.showGapDialog();
    const canAttempt = this.pending.chipsAvailable >= this.pending.cost;
    if (canAttempt && !this.buddyTurn) {
      this.narrator.say(this.words.gap({ low: this.words.face(low.face), high: this.words.face(high.face) }), { show: this.narrator.text.text, force: true });
    }
    this.refresh();
  }

  answer(guess) {
    if (!this.pending || this.guess !== null) return;
    this.guess = guess;
    const { low, high, cost, opponent } = this.pending;
    const right = guess === cost;
    const me = this.players[this.current];
    const other = this.players[opponent];
    const line = right ? this.words.right({ cost, name: `${other.icon} ${other.name}` }) : this.words.wrong({ cost, name: me.name });
    this.dialogFeedback(line, right);
    play(this, right ? 'correct' : 'wrong');
    if (!this.buddyTurn) this.narrator.say(right ? this.words.sayRight() : this.words.sayWrong({ cost }), { show: this.narrator.text.text, force: true });
    this.report({ guess, right });
    this.time.delayedCall(GUESS_FEEDBACK_DELAY_MS, () => {
      if (right) {
        this.memory = forgetCards(this.memory, [low.id, high.id]);
        low.value = high.value;
        low.status = 'matched';
        high.status = 'matched';
        this.chips[this.current] -= cost;
        this.chips[opponent] += cost;
        this.scores[this.current] += 1;
      } else {
        low.status = 'hidden';
        high.status = 'hidden';
        this.chips[this.current] = Math.max(0, this.chips[this.current] - cost);
      }
      this.endTurn();
    });
  }

  skip() {
    if (!this.pending || this.guess !== null) return;
    this.pending.low.status = 'hidden';
    this.pending.high.status = 'hidden';
    this.endTurn();
  }

  endTurn() {
    this.closeDialog();
    this.pending = null;
    this.guess = null;
    this.flipped = [];
    this.busy = false;
    this.current = otherPlayer(this.current);
    this.refresh();
  }

  // ---- the buddy ----
  scheduleBuddy() {
    if (!this.buddyTurn || this.over || this.buddyTimer) return;
    if (this.pending) {
      if (this.guess !== null || this.pending.chipsAvailable < this.pending.cost) {
        if (this.guess === null) this.buddyTimer = this.time.delayedCall(BUDDY_THINK_MS, () => this.buddyDone(() => this.skip()));
        return;
      }
      this.buddyTimer = this.time.delayedCall(BUDDY_THINK_MS, () =>
        this.buddyDone(() => {
          const guess = decideGap({ ...this.pending, accuracy: this.level.accuracy, attempt: this.level.attempt });
          if (guess === null) this.skip();
          else this.answer(guess);
        })
      );
      return;
    }
    if (this.busy || this.flipped.length >= 2) return;
    const delay = this.flipped.length === 0 ? BUDDY_FIRST_FLIP_MS : BUDDY_SECOND_FLIP_MS;
    this.buddyTimer = this.time.delayedCall(delay, () =>
      this.buddyDone(() => {
        const card = this.flipped.length === 0 ? chooseFirstCard(this.deck, this.memory) : chooseSecondCard(this.deck, this.memory, this.flipped[0]);
        if (card) this.flip(card);
      })
    );
  }

  buddyDone(action) {
    this.buddyTimer = null;
    action();
  }

  // ---- the gap question ----
  showGapDialog() {
    const { low, high, cost, chipsAvailable } = this.pending;
    const player = this.players[this.current];
    const dialog = new Dialog(this, { width: 820, height: 600, title: t('memory.notAPair') });
    this.dialog = dialog;
    dialog.card.setStrokeStyle(6, colorOf(player.main));
    const mini = (x, face) => {
      const holder = this.add.container(x, -170);
      holder.add(this.add.rectangle(0, 0, 96, 96, COLORS.white).setRounded(16).setStrokeStyle(3, 0x9aa5c4));
      drawFace(this, holder, face, 96, COLORS.ink);
      dialog.add(holder);
    };
    mini(-90, low.face);
    dialog.add(this.add.text(0, -170, '➜', textStyle(44, COLORS.gray)).setOrigin(0.5));
    mini(90, high.face);
    if (chipsAvailable < cost) {
      dialog.add(this.add.text(0, -40, this.words.tooFew({ cost, name: player.name, chips: chipsAvailable }), textStyle(28, COLORS.ink, { wordWrap: { width: 720 } })).setOrigin(0.5));
      if (!this.buddyTurn) this.dialogButton('ok', 0, 180, t('memory.ok'), colorOf(player.main), () => this.skip(), 220);
      return;
    }
    const question = this.words.question({ name: `${player.icon} ${player.name}`, low: low.face.label, high: high.face.label });
    dialog.add(this.add.text(0, -85, question, textStyle(26, COLORS.ink, { wordWrap: { width: 740 } })).setOrigin(0.5));
    let y = -35;
    if (this.variant.unitNote) {
      dialog.add(this.add.text(0, y, t(`memory.unitNote.${this.variant.id}`), textStyle(20, COLORS.gray)).setOrigin(0.5));
      y += 30;
    }
    if (this.variant.helper === 'alphabet') {
      dialog.add(this.add.text(0, y, ALPHABET_HELPER.join('  '), textStyle(30, COLORS.primary)).setOrigin(0.5));
      y += 36;
    }
    if (this.buddyTurn) dialog.add(this.add.text(0, y + 10, t('memory.thinking', { name: player.name }), textStyle(24, COLORS.gray)).setOrigin(0.5));
    this.pickerTop = y + 40;
    if (this.variant.guessStyle === 'chips') this.chipCounter(this.pickerTop);
    else this.numberPicker(this.pickerTop);
    if (!this.buddyTurn) this.dialogButton('skip', 300, 250, t('memory.skip'), COLORS.gray, () => this.skip(), 160, 64);
    this.feedbackText = this.add.text(0, 210, '', textStyle(24, COLORS.greenDark, { wordWrap: { width: 600 } })).setOrigin(0.5);
    dialog.add(this.feedbackText);
  }

  dialogButton(name, x, y, label, color, onTap, width = 200, height = 72) {
    const button = new Button(this, x, y, { label, width, height, fontSize: 28, color, onTap });
    this.dialog.add(button);
    this.tag(name, button.box);
    return button;
  }

  // Classic and older variants: tap the number.
  numberPicker(top) {
    const count = this.pending.chipsAvailable;
    const perRow = Math.min(count, 10);
    this.guessButtons = Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      const x = (i % perRow - (perRow - 1) / 2) * 66;
      const y = top + Math.floor(i / perRow) * 66;
      const button = this.dialogButton(`guess:${n}`, x, y, String(n), COLORS.white, () => this.answer(n), 58, 58);
      button.label.setColor('#2d3142');
      if (this.buddyTurn) button.setEnabled(false);
      button.value = n;
      return button;
    });
  }

  // Pre-readers: tap a chip for each step, then pay.
  chipCounter(top) {
    const max = this.pending.chipsAvailable;
    this.counted = 0;
    const perRow = Math.min(max, 12);
    this.coins = Array.from({ length: max }, (_, i) => {
      const coin = glyph(this, (i % perRow - (perRow - 1) / 2) * 54, top + Math.floor(i / perRow) * 54, '🪙', 40).setAlpha(0.35);
      this.dialog.add(coin);
      return coin;
    });
    const rows = Math.ceil(max / perRow);
    const area = this.add.rectangle(0, top + ((rows - 1) * 54) / 2, perRow * 54 + 20, rows * 54 + 10, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    area.on('pointerup', () => this.addCoin());
    this.dialog.add(area);
    this.tag('coins', area);
    if (this.buddyTurn) return;
    const y = top + rows * 54 + 30;
    this.dialogButton('undo-coin', -150, y, '↩', COLORS.gray, () => this.setCoins(this.counted - 1), 100, 64);
    this.payButton = this.dialogButton('pay', 60, y, t('memory.pay', { count: 0 }), COLORS.gray, () => this.counted > 0 && this.answer(this.counted), 240, 64);
  }

  addCoin() {
    if (this.buddyTurn || this.guess !== null || this.counted >= this.pending.chipsAvailable) return;
    this.setCoins(this.counted + 1);
    speak(String(this.counted), { force: true });
  }

  setCoins(count) {
    if (this.guess !== null) return;
    this.counted = Math.max(0, count);
    this.coins.forEach((coin, i) => coin.setAlpha(i < this.counted ? 1 : 0.35));
    if (this.payButton) this.payButton.setLabel(t('memory.pay', { count: this.counted })).setColor(this.counted ? COLORS.green : COLORS.gray);
    this.report({ counted: this.counted });
  }

  dialogFeedback(line, right) {
    if (!this.dialog) return;
    if (this.guessButtons && this.variant.guessStyle !== 'chips') {
      this.guessButtons.forEach((button) => {
        button.setEnabled(false);
        if (button.value === this.pending.cost) button.setColor(COLORS.green).setAlpha(1);
        else if (button.value === this.guess) button.setColor(COLORS.red).setAlpha(1);
      });
    }
    if (this.coins) this.coins.forEach((coin, i) => coin.setAlpha(i < this.guess ? 1 : 0.35));
    this.feedbackText.setText(line).setColor(right ? '#2e7d32' : '#e53935');
  }

  closeDialog() {
    if (this.dialog) this.dialog.destroy();
    this.dialog = null;
    this.guessButtons = null;
    this.coins = null;
    this.payButton = null;
  }

  // ---- the end ----
  winner() {
    const [a, b] = [this.scores[1], this.scores[2]];
    return a === b ? 0 : a > b ? 1 : 2;
  }

  checkOver() {
    if (this.over) return;
    const done = this.deck.every((card) => card.status === 'matched');
    const stuck = !done && this.flipped.length === 0 && !this.pending && isStalemate(this.deck, this.chips);
    if (!done && !stuck) return;
    this.over = true;
    if (this.buddyTimer) this.buddyTimer.remove();
    this.buddyTimer = null;
    this.time.delayedCall(500, () => this.showResults(stuck));
  }

  showResults(stuck) {
    const winner = this.winner();
    const title = winner ? t('twoPlayer.wins', { name: `${this.players[winner].icon} ${this.players[winner].name}` }) : t('twoPlayer.tie');
    const dialog = new Dialog(this, { width: 660, height: 520, title });
    this.dialog = dialog;
    dialog.add(glyph(this, 0, -100, winner ? '🏆' : '🤝', 90));
    let y = -20;
    if (stuck) {
      dialog.add(this.add.text(0, y, t('memory.stuck'), textStyle(22, COLORS.gray, { wordWrap: { width: 560 } })).setOrigin(0.5));
      y += 50;
    }
    [1, 2].forEach((n) => {
      const { icon, name } = this.players[n];
      dialog.add(this.add.text(0, y, this.words.pairs({ name: `${icon} ${name}`, count: this.scores[n] }), textStyle(28)).setOrigin(0.5));
      y += 44;
    });
    this.dialogButton('again', -140, 190, t('twoPlayer.playAgain'), COLORS.primary, () => this.replay(), 250, 84);
    this.dialogButton('map', 140, 190, t('common.map'), COLORS.gray, () => this.back(), 250, 84);
    play(this, 'correct');
    speak(t(winner ? 'twoPlayer.sayWin' : 'twoPlayer.sayTie'), { force: true });
    this.report({ step: 'over', winner, stuck });
  }
}
