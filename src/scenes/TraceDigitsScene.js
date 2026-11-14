import TraceRound from '../ui/TraceRound';
import { COLORS } from '../ui/theme';
import { content } from '../content/index';
import { COUNT_EMOJI, digitCheckpoints, makeRound } from '../logic/tracing';
import { t } from '../i18n/index';

// Write 1 to 5 / Write 6 to 9 and 0: trace each digit stroke by stroke from
// the green dot, after a pencil shows how. Then count that many things.
// The child picks the colour they write with from the crayons on the left.

// The crayon colours, in two rows of four; the first is the starting one.
const PALETTE = [COLORS.orange, COLORS.red, COLORS.pink, 0x9c5de0, COLORS.primary, 0x29b6c8, COLORS.green, COLORS.yellow];

export default class TraceDigitsScene extends TraceRound {
  static key = 'TraceDigits';
  static plays = ['TraceDigits'];

  get picker() {
    return { title: t('tracing.pickColor'), options: PALETTE, columns: 4, size: 60, gap: 78, tagPrefix: 'color', apply: (layer, color) => layer.setTrailColor(color) };
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
    return { look: { trail: this.choice }, startMarker: null, endMarker: null };
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
