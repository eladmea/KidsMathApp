import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import { openParentGate } from '../ui/ParentGate';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { grantMoreTime, session } from '../services/session';
import { speak } from '../services/speech';
import { BONUS_MINUTES } from '../logic/playTime';
import { toDayKey } from '../logic/progress';
import { stickersEarnedOn } from '../logic/stickers';
import { t } from '../i18n/index';

// The gentle goodbye when today's play time is used up: today's stickers,
// a calm-down breath, switching player, or (behind the grown-up check) 10
// more minutes.
export default class TimeUpScene extends BaseScene {
  static key = 'TimeUp';

  build() {
    const { profile } = session;
    this.bg = this.add.rectangle(0, 0, 10, 10, 0x2b3a67).setOrigin(0, 0);
    glyph(this, SAFE.width / 2, 110, '🌙', 110);
    this.add.text(SAFE.width / 2, 225, t('timeUp.title', { name: profile.name }), textStyle(46, COLORS.white)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 285, t('timeUp.subtitle'), textStyle(30, 0xdfe6ff)).setOrigin(0.5);
    const stickers = stickersEarnedOn(profile.stickers, toDayKey());
    if (stickers.length) {
      this.add.rectangle(SAFE.width / 2, 385, 640, 110, COLORS.white, 0.95).setRounded(24);
      this.add.text(SAFE.width / 2, 355, t('timeUp.stickers'), textStyle(22, COLORS.gray)).setOrigin(0.5);
      this.add.text(SAFE.width / 2, 405, stickers.map((s) => s.emoji).join(' '), textStyle(40)).setOrigin(0.5);
    }
    const buttons = [
      { name: 'breathe', label: t('timeUp.breathe'), color: COLORS.primary, onTap: () => this.go('BalloonBreath', { coolDown: true }) },
      { name: 'switch-player', label: t('timeUp.switchPlayer'), color: 0x8e5ce0, onTap: () => this.reset('Profiles') },
      { name: 'more-time', label: t('timeUp.moreTime', { minutes: BONUS_MINUTES }), color: COLORS.gray, onTap: () => this.askForTime() },
    ];
    buttons.forEach(({ name, label, color, onTap }, i) => {
      const button = new Button(this, SAFE.width / 2 + (i - 1) * 400, 560, { label, width: 370, height: 96, fontSize: 30, color, onTap });
      this.tag(name, button.box);
    });
    speak(t('timeUp.say'));
    this.report({ step: 'time-up', stickers: stickers.length });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  askForTime() {
    openParentGate(this, {
      title: t('timeUp.gateTitle', { minutes: BONUS_MINUTES }),
      onPass: async () => {
        await grantMoreTime();
        this.reset('WorldMap');
      },
    });
  }
}
