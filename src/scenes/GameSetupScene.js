import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { getLearningGame, recommendedOption } from '../curriculum/games';
import { profileBand } from '../logic/profiles';
import { BUDDY } from '../logic/players';
import { gameTitle, optionLabel, optionNote } from '../i18n/names';
import { t } from '../i18n/index';

// Before Memory Chips or Number Path Race: pick the variant (the one "just
// right" for the child's age band is chosen) and who to play with.
//   data: { gameId }
export default class GameSetupScene extends BaseScene {
  static key = 'GameSetup';

  build({ gameId }) {
    this.game = getLearningGame(gameId);
    this.band = profileBand(session.profile).id;
    this.option = recommendedOption(this.game, this.band).id;
    this.mode = 'solo';
    this.optionButtons = [];
    this.modeButtons = [];

    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    this.addBackButton();
    glyph(this, 470, 70, this.game.emoji, 64);
    this.add.text(520, 70, gameTitle(this.game), textStyle(44)).setOrigin(0, 0.5);
    this.add.text(640, 160, t('hubs.choose'), textStyle(26, COLORS.gray)).setOrigin(0.5);
    const options = this.game.options;
    const perRow = options.length > 3 ? 3 : options.length;
    options.forEach((option, i) => {
      const x = 640 + ((i % perRow) - (perRow - 1) / 2) * 400;
      const y = 245 + Math.floor(i / perRow) * 120;
      const button = new Button(this, x, y, { label: '', width: 380, height: 104, color: COLORS.white, onTap: () => this.pick(option.id) });
      button.add(glyph(this, -150, 0, option.emoji, 50));
      button.add(this.add.text(-110, -18, optionLabel(this.game, option), textStyle(26, COLORS.ink, { align: 'left' })).setOrigin(0, 0.5));
      button.add(this.add.text(-110, 20, optionNote(this.game, option), textStyle(20, COLORS.gray, { align: 'left' })).setOrigin(0, 0.5));
      if (option.bands.includes(this.band)) button.add(this.add.text(180, -36, t('hubs.justRight'), textStyle(16, COLORS.orange)).setOrigin(1, 0.5));
      button.optionId = option.id;
      this.tag(`option:${option.id}`, button.box);
      this.optionButtons.push(button);
    });
    const modeY = 245 + Math.ceil(options.length / perRow) * 120 + 30;
    this.add.text(640, modeY, t('hubs.playWith'), textStyle(26, COLORS.gray)).setOrigin(0.5);
    [
      { id: 'solo', label: `${BUDDY.icon} ${t('twoPlayer.buddy')}` },
      { id: 'duo', label: t('hubs.friend') },
    ].forEach(({ id, label }, i) => {
      const button = new Button(this, 640 + (i - 0.5) * 300, modeY + 70, { label, width: 280, height: 84, fontSize: 30, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.pickMode(id) });
      button.modeId = id;
      this.tag(`mode:${id}`, button.box);
      this.modeButtons.push(button);
    });
    const start = new Button(this, 1080, Math.min(modeY + 70, 650), { label: t('hubs.start'), width: 240, height: 90, color: COLORS.green, onTap: () => this.start() });
    this.tag('start', start.box);
    this.refresh();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  refresh() {
    this.optionButtons.forEach((button) => button.box.setStrokeStyle(button.optionId === this.option ? 6 : 2, button.optionId === this.option ? COLORS.primary : 0xdddddd));
    this.modeButtons.forEach((button) => {
      const on = button.modeId === this.mode;
      button.setColor(on ? COLORS.primary : COLORS.white);
      button.label.setColor(on ? '#ffffff' : '#2d3142');
    });
    this.report({ step: 'setup', game: this.game.id, option: this.option, mode: this.mode });
  }

  pick(id) {
    this.option = id;
    this.refresh();
  }

  pickMode(id) {
    this.mode = id;
    this.refresh();
  }

  start() {
    this.go(this.game.route, { variant: this.option, board: Number(this.option), mode: this.mode });
  }
}
