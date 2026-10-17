import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import StarRow from '../ui/StarRow';
import { COLORS, textStyle } from '../ui/theme';
import { recordRound } from '../services/session';
import { speak } from '../services/speech';
import { calculateStars } from '../logic/scoring';
import { RESULT_LINES } from '../logic/quizRound';
import { getSkill } from '../curriculum/skills';

// The end of a quiz round: stars, the score, and anything new (a skill
// passed or mastered, skills it unlocked, stickers). Saves the round.
//   data: { skillIds, mode, score, total, tallies, replay } (replay = the
//   quiz's own data, for "Again")
export default class ResultsScene extends BaseScene {
  constructor() {
    super('Results');
  }

  build({ mode, score, total, tallies, replay }) {
    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    const stars = calculateStars(score, total);
    this.add.text(SAFE.width / 2, 80, RESULT_LINES[stars], textStyle(56, COLORS.primary)).setOrigin(0.5);
    new StarRow(this, SAFE.width / 2, 190, stars, 100);
    this.add.text(SAFE.width / 2, 290, `You got ${score} out of ${total}`, textStyle(40)).setOrigin(0.5);
    this.news = this.add.text(SAFE.width / 2, 340, '', textStyle(30, COLORS.ink, { lineSpacing: 10 })).setOrigin(0.5, 0);
    const again = new Button(this, SAFE.width / 2 - 180, 620, { label: '🔁 Again', width: 320, color: COLORS.primary, onTap: () => this.swap('Quiz', replay) });
    const map = new Button(this, SAFE.width / 2 + 180, 620, { label: '🗺️ Map', width: 320, color: COLORS.green, onTap: () => this.back() });
    this.tag('again', again.box);
    this.tag('map', map.box);
    if (stars === 3) this.celebrate();
    this.report({ step: 'saving', stars, score, total });

    recordRound(tallies, mode).then((result) => {
      if (!this.sys.isActive()) return;
      const lines = [
        ...result.newlyMastered.map((id) => `🏅 Mastered: ${getSkill(id).title}`),
        ...result.newlyPassed.filter((id) => !result.newlyMastered.includes(id)).map((id) => `✅ Passed: ${getSkill(id).title}`),
        ...(result.earnedStickers.length ? [`🌟 New sticker${result.earnedStickers.length > 1 ? 's' : ''}: ${result.earnedStickers.map((s) => s.emoji).join(' ')}`] : []),
        ...result.newlyUnlocked.map((id) => `🔓 New: ${getSkill(id).emoji} ${getSkill(id).title}`),
      ];
      this.news.setText(lines.slice(0, 4).join('\n'));
      const mastered = result.newlyMastered.map((id) => getSkill(id).title);
      speak([RESULT_LINES[stars], `You got ${score} out of ${total}.`, mastered.length ? `You mastered ${mastered.join(' and ')}!` : '', result.earnedStickers.length ? 'You got a new sticker!' : ''].filter(Boolean).join(' '));
      this.report({
        step: 'results',
        newlyPassed: result.newlyPassed,
        newlyMastered: result.newlyMastered,
        newlyUnlocked: result.newlyUnlocked,
        stickers: result.earnedStickers.map((s) => s.emoji),
      });
    });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  celebrate() {
    for (let i = 0; i < 28; i++) {
      const piece = this.add.text(SAFE.width / 2, 190, ['🎉', '⭐', '🎈', '✨'][i % 4], textStyle(48)).setOrigin(0.5);
      this.tweens.add({
        targets: piece,
        x: SAFE.width / 2 + Math.cos(i * 1.3) * (360 + (i % 4) * 70),
        y: 190 + Math.sin(i * 1.3) * (200 + (i % 3) * 50),
        alpha: 0,
        duration: 1600,
        ease: 'Cubic.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }
}
