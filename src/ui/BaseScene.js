import Phaser from 'phaser';
import { reportScene, reportState, tag } from '../services/testBridge';
import { stop as stopSpeech } from '../services/speech';
import * as router from '../services/router';
import { enterScene } from '../services/playClock';
import { isTimeUp } from '../services/session';
import Button from './Button';
import IconText from './IconText';
import { COLORS, textStyle } from './theme';
import { skillTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Every scene is laid out in a fixed 1280 x 720 "safe area" that is always
// fully visible. The canvas grows (Scale.EXPAND) to fill wider phones or
// squarer tablets, and the camera keeps the safe area centred, so the extra
// space shows more background instead of black bars. `this.view` is the whole
// visible area in the same coordinates, for things pinned to the screen edges
// and for backgrounds.
export const SAFE = { width: 1280, height: 720 };

// Browser tests open the game with ?fast: timers and tweens run 8x faster.
const TEST_SPEED = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast') ? 8 : 1;

// Each scene names itself with `static key = 'Quiz'` (the registry in
// scenes/registry.js picks every scene up, so nothing else needs editing).
export default class BaseScene extends Phaser.Scene {
  constructor() {
    super(new.target.key);
  }

  create(data) {
    this.built = false;
    this.leaving = false;
    this.startData = data || {};
    this.backButton = null;
    reportScene(this.scene.key);
    enterScene(this.scene.key);
    this.view = new Phaser.Geom.Rectangle(0, 0, SAFE.width, SAFE.height);
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fitCamera, this);
      stopSpeech();
    });
    this.time.timeScale = TEST_SPEED;
    this.tweens.timeScale = TEST_SPEED;
    this.fitCamera();
    this.build(this.startData);
    this.built = true;
    this.fitCamera();
  }

  // Fits the camera to the screen and re-pins the edge-anchored objects.
  fitCamera() {
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    camera.setSize(width, height);
    camera.centerOn(SAFE.width / 2, SAFE.height / 2);
    this.view.setTo((SAFE.width - width) / 2, (SAFE.height - height) / 2, width, height);
    if (!this.built || this.leaving) return;
    if (this.backButton) this.backButton.setPosition(this.view.x + 70, this.view.y + 70);
    this.layout();
  }

  // Scenes create their objects here (called once)...
  build() {}

  // ...and pin edge-anchored objects to `this.view` here (on every resize).
  layout() {}

  // Name an object for browser tests.
  tag(name, object) {
    return tag(name, object);
  }

  report(patch) {
    reportState(patch);
  }

  // The round ← button in the top-left corner. Goes back by default.
  addBackButton(onTap = () => this.back()) {
    this.backButton = new Button(this, 0, 0, { label: '←', width: 84, height: 84, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap });
    this.backButton.setDepth(40);
    this.tag('back', this.backButton.box);
    return this.backButton;
  }

  // The places a child picks what to play next (the map, an island, the game
  // lists) call this first: once today's time is up they go to the goodbye
  // screen instead. A round already started is never cut short.
  timeUpGate() {
    if (!isTimeUp()) return false;
    this.leaving = true;
    this.reset('TimeUp');
    return true;
  }

  // A game's header under the ← button: the skill's title on the left, and
  // a counter on the right ("2 / 5   ⭐ 1", see setCounter).
  addGameHeader(skill) {
    this.addHeader(skill.emoji, skillTitle(skill));
  }

  // The same for anything else (a mini-game): headerCounter.setText() shows
  // its counter.
  addHeader(emoji, title) {
    this.headerTitle = new IconText(this, 30, 150, t('quiz.title', { emoji, title }), textStyle(24, COLORS.gray)).setOrigin(0, 0.5);
    this.headerCounter = new IconText(this, 1250, 150, '', textStyle(28)).setOrigin(1, 0.5);
  }

  // `index` counts from 1.
  setCounter(index, total, score, icon = '⭐') {
    this.headerCounter.setText(`${t('common.progress', { index, total })}   ${icon} ${score}`);
  }

  // The end of a game's round: Results saves it and offers "Again".
  finishRound(skillId, score, total) {
    this.swap('Results', {
      skillIds: [skillId],
      mode: 'practice',
      score,
      total,
      tallies: { [skillId]: { correct: score, total } },
      replay: { key: this.scene.key, data: this.startData },
      adventureStep: this.startData.adventureStep,
    });
  }

  // Opens another scene; back() returns here with the same data.
  go(key, data = {}) {
    router.push({ key: this.scene.key, data: this.startData });
    this.scene.start(key, data);
  }

  // Back to the scene this one was opened from (the map if there is none).
  back() {
    const previous = router.pop();
    if (previous) this.scene.start(previous.key, previous.data);
    else this.scene.start('WorldMap');
  }

  // Replaces this scene with another in the same place in the history (a
  // finished quiz becomes its results; "back" from either goes to the same
  // place).
  swap(key, data = {}) {
    this.scene.start(key, data);
  }

  // Starts a scene with a fresh history (e.g. after picking a player).
  reset(key, data = {}) {
    router.clear();
    this.scene.start(key, data);
  }

  // Plays this scene again from the start, keeping its place in the history.
  replay(data = this.startData) {
    this.scene.restart(data);
  }
}
