import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { session, spendTicket } from '../services/session';
import { MINI_GAMES } from '../curriculum/games';
import { roundsUntilNextTicket } from '../logic/funTickets';
import { miniGameDescription, miniGameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Fun Break: mini-games paid for with tickets, which finishing learning
// rounds earns. Balloon Breath (calming down) is always free.
export default class FunBreakScene extends BaseScene {
  static key = 'FunBreak';

  build() {
    if (this.timeUpGate()) return;
    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff0f6).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.add.text(30, 150, t('hubs.funBreak'), textStyle(28, COLORS.gray)).setOrigin(0, 0.5);
    const tickets = session.profile.funTickets || 0;
    this.tickets = tickets;
    this.toGo = roundsUntilNextTicket(session.profile);
    this.add.text(1250, 150, t('hubs.tickets', { count: tickets }), textStyle(32)).setOrigin(1, 0.5);
    this.narrator.say(tickets > 0 ? t('hubs.pick') : t('hubs.earn', { count: this.toGo }));
    MINI_GAMES.forEach((game, i) => {
      const x = 640 + (i - (MINI_GAMES.length - 1) / 2) * 295;
      const locked = tickets === 0 && !game.free;
      const card = new Button(this, x, 430, { label: '', width: 270, height: 380, color: COLORS.white, onTap: () => this.start(game) });
      card.add(glyph(this, 0, -100, locked ? '🔒' : game.emoji, 100));
      card.add(this.add.text(0, 10, miniGameTitle(game), textStyle(30, COLORS.primary)).setOrigin(0.5));
      card.add(this.add.text(0, 90, miniGameDescription(game), textStyle(20, COLORS.ink, { wordWrap: { width: 230 } })).setOrigin(0.5));
      if (game.free) card.add(this.add.text(0, 160, t('hubs.free'), textStyle(22, COLORS.greenDark)).setOrigin(0.5));
      if (locked) card.setAlpha(0.6);
      this.tag(`mini:${game.id}`, card.box);
    });
    this.report({ step: 'fun-break', tickets, toGo: this.toGo });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  async start(game) {
    if (game.free || (await spendTicket())) {
      this.go(game.route);
      return;
    }
    this.narrator.say(t('hubs.sayEarn', { count: this.toGo }), { show: t('hubs.earn', { count: this.toGo }), force: true });
    this.report({ refused: game.id });
  }
}
