import TraceRound from '../ui/TraceRound';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { content } from '../content/index';
import { COUNT_EMOJI, digitCheckpoints, makeRound } from '../logic/tracing';
import { t } from '../i18n/index';

// Write 1 to 5 / Write 6 to 9 and 0: trace each digit stroke by stroke from
// the green dot, after a pencil shows how. Then count that many things.
// The child picks the colour they write with from the crayons on the left.

// The crayon colours, in two rows of four; the first is the starting one.
const PALETTE = [COLORS.orange, COLORS.red, COLORS.pink, 0x9c5de0, COLORS.primary, 0x29b6c8, COLORS.green, COLORS.yellow];
const SWATCH_RADIUS = 30;
const SWATCH_GAP = 78;
const PALETTE_X = 250;
const PALETTE_Y = 580;

export default class TraceDigitsScene extends TraceRound {
  static key = 'TraceDigits';
  static plays = ['TraceDigits'];

  build(data) {
    // Set before the round builds: the first digit's layer reads it.
    this.trailColor = PALETTE[0];
    super.build(data);
    this.addPalette();
  }

  addPalette() {
    this.add.text(PALETTE_X, PALETTE_Y - 68, t('tracing.pickColor'), textStyle(26, COLORS.ink)).setOrigin(0.5);
    this.swatches = PALETTE.map((color, i) => {
      const x = PALETTE_X + ((i % 4) - 1.5) * SWATCH_GAP;
      const y = PALETTE_Y + Math.floor(i / 4) * SWATCH_GAP;
      const swatch = this.add.circle(x, y, SWATCH_RADIUS, color).setStrokeStyle(5, COLORS.white);
      swatch.setInteractive({ useHandCursor: true });
      swatch.on('pointerup', () => this.pickColor(color));
      this.tag(`color:${i}`, swatch);
      return swatch;
    });
    this.markSwatch();
  }

  pickColor(color) {
    if (color === this.trailColor) return;
    this.trailColor = color;
    if (this.layer) this.layer.setTrailColor(color);
    play(this, 'ding');
    this.markSwatch();
    this.report({ trailColor: color });
  }

  // The chosen crayon is bigger, with a dark ring.
  markSwatch() {
    this.swatches.forEach((swatch, i) => {
      const chosen = PALETTE[i] === this.trailColor;
      swatch.setStrokeStyle(chosen ? 6 : 5, chosen ? COLORS.ink : COLORS.white);
      this.tweens.add({ targets: swatch, scale: chosen ? 1.2 : 1, duration: 150, ease: 'Back.easeOut' });
    });
  }

  get colors() {
    return { background: 0xeef6ff, card: COLORS.white };
  }

  makeItems() {
    const { NUMBER_WORDS, say } = content('math');
    return makeRound(this.skill.traceLevel).map((digit) => {
      const word = NUMBER_WORDS[digit];
      return {
        key: `d${digit}`,
        strokes: digitCheckpoints(digit),
        prompt: say.write.prompt({ digit }),
        intro: say.write.intro({ word }),
        praise: say.write.praise({ word }),
        celebrate: say.write.celebrate({ digit, emoji: COUNT_EMOJI[digit] }),
      };
    });
  }

  lookOf() {
    return { look: { trail: this.trailColor }, startMarker: null, endMarker: null };
  }

  idleText() {
    return t('tracing.watch');
  }

  hintText(kind) {
    if (kind === 'start') return { show: t('tracing.startDot'), say: t('tracing.sayStartDot') };
    if (kind === 'next') return { show: t('tracing.nextLine'), say: t('tracing.sayNextLine') };
    return { show: t('tracing.almostDigit'), say: t('tracing.sayAlmostDigit') };
  }
}
