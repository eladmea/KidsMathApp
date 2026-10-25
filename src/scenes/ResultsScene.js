import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import StarRow from '../ui/StarRow';
import { COLORS, textStyle } from '../ui/theme';
import { completeAdventureStep, recordRound } from '../services/session';
import { speak } from '../services/speech';
import { calculateStars } from '../logic/scoring';
import { resultLine } from '../logic/quizRound';
import { getSkill } from '../curriculum/skills';
import { list, t } from '../i18n/index';
import { skillTitle } from '../i18n/names';
import { play } from '../services/audio';
import { glyph } from '../ui/Art';

// When the first star appears (after "Yaaay!") and the time between stars.
const STARS_FROM = 600;
const STAR_GAP = 450;

// The end of a round (a quiz or a game): stars, the score, and anything new
// (a skill passed or mastered, skills it unlocked, stickers). Saves the round.
//   data: { skillIds, mode, score, total, tallies, replay, adventureStep }
//   (replay = { key, data } of the scene that played the round, for
//   "Again"; adventureStep when the round is a step of Today's Adventure)
export default class ResultsScene extends BaseScene {
  static key = 'Results';


  build({ mode, score, total, tallies, replay, adventureStep }) {
    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    const stars = calculateStars(score, total);
    this.cheer();
    // The stars fill in one by one, each a little higher chime, then confetti.
    new StarRow(this, SAFE.width / 2, 170, stars, 90).reveal(stars, {
      delay: STARS_FROM,
      gap: STAR_GAP,
      onStar: (n) => {
        play(this, 'star', { detune: (n - 1) * 200 });
        this.report({ shownStars: n });
        if (n === stars && stars >= 2) this.celebrate(stars === 3 ? 28 : 14);
      },
    });
    this.add.text(SAFE.width / 2, 258, resultLine(stars), textStyle(42, COLORS.primary)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 308, t('results.score', { score, total }), textStyle(34)).setOrigin(0.5);
    this.news = this.add.text(SAFE.width / 2, 352, '', textStyle(30, COLORS.ink, { lineSpacing: 10 })).setOrigin(0.5, 0);
    const again = new Button(this, SAFE.width / 2 - 180, 620, { label: t('common.again'), width: 320, color: COLORS.primary, onTap: () => this.swap(replay.key, replay.data) });
    const map = new Button(this, SAFE.width / 2 + 180, 620, { label: t('common.map'), width: 320, color: COLORS.green, onTap: () => this.back() });
    this.tag('again', again.box);
    this.tag('map', map.box);
    this.report({ step: 'saving', stars, shownStars: 0, score, total });

    recordRound(tallies, mode).then(async (result) => {
      // A step of Today's Adventure: done once its round is saved.
      if (adventureStep) await completeAdventureStep(adventureStep);
      if (!this.sys.isActive()) return;
      const lines = [
        ...result.newlyMastered.map((id) => t('results.mastered', { title: skillTitle(id) })),
        ...result.newlyPassed.filter((id) => !result.newlyMastered.includes(id)).map((id) => t('results.passed', { title: skillTitle(id) })),
        ...(result.earnedStickers.length ? [t('results.stickers', { count: result.earnedStickers.length, list: result.earnedStickers.map((s) => s.emoji).join(' ') })] : []),
        ...(result.earnedTicket ? [t('results.ticket')] : []),
        ...result.newlyUnlocked.map((id) => t('results.unlocked', { emoji: getSkill(id).emoji, title: skillTitle(id) })),
      ];
      this.news.setText(lines.slice(0, 4).join('\n'));
      const mastered = result.newlyMastered.map(skillTitle);
      speak([t('results.yay'), resultLine(stars), t('results.sayScore', { score, total }), mastered.length ? t('results.sayMastered', { titles: list(mastered) }) : '', result.earnedStickers.length ? t('results.saySticker') : '', result.earnedTicket ? t('results.sayTicket') : ''].filter(Boolean).join(' '));
      this.report({
        step: 'results',
        newlyPassed: result.newlyPassed,
        newlyMastered: result.newlyMastered,
        newlyUnlocked: result.newlyUnlocked,
        stickers: result.earnedStickers.map((s) => s.emoji),
        ticket: result.earnedTicket,
      });
    });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // "Yaaay!" bounces in with a jingle, then keeps wiggling.
  cheer() {
    const yay = this.add.text(SAFE.width / 2, 66, t('results.yay'), textStyle(78, COLORS.orange, { stroke: '#ffffff', strokeThickness: 12 })).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: yay, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: yay, angle: { from: -4, to: 4 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500 });
    play(this, 'cheer');
  }

  celebrate(count) {
    for (let i = 0; i < count; i++) {
      const piece = glyph(this, SAFE.width / 2, 170, ['🎉', '⭐', '🎈', '✨'][i % 4], 48);
      this.tweens.add({
        targets: piece,
        x: SAFE.width / 2 + Math.cos(i * 1.3) * (360 + (i % 4) * 70),
        y: 170 + Math.sin(i * 1.3) * (200 + (i % 3) * 50),
        alpha: 0,
        duration: 1600,
        ease: 'Cubic.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }
}
