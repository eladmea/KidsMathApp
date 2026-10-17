import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { speak } from '../services/speech';
import { LEARNING_GAMES } from '../curriculum/games';
import { gameDescription, gameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// The learning games (free to play): Memory Chips, Garden Days and Number
// Path Race. Games with variants open their setup first.
export default class GamesScene extends BaseScene {
  static key = 'Games';

  build() {
    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    this.addBackButton();
    this.add.text(640, 70, t('hubs.games'), textStyle(48)).setOrigin(0.5);
    LEARNING_GAMES.forEach((game, i) => {
      const x = 640 + (i - (LEARNING_GAMES.length - 1) / 2) * 390;
      const card = new Button(this, x, 400, { label: '', width: 360, height: 420, color: COLORS.white, onTap: () => this.open(game) });
      card.add(glyph(this, 0, -110, game.emoji, 110));
      card.add(this.add.text(0, 10, gameTitle(game), textStyle(34, COLORS.primary)).setOrigin(0.5));
      card.add(this.add.text(0, 100, gameDescription(game), textStyle(22, COLORS.ink, { wordWrap: { width: 310 } })).setOrigin(0.5));
      this.tag(`game:${game.id}`, card.box);
    });
    speak(t('hubs.sayGames'));
    this.report({ step: 'games', games: LEARNING_GAMES.map((g) => g.id) });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  open(game) {
    if (game.direct) this.go(game.route);
    else this.go('GameSetup', { gameId: game.id });
  }
}
