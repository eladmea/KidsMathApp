import TraceRound from '../ui/TraceRound';
import { COLORS } from '../ui/theme';
import { content } from '../content/index';
import { session } from '../services/session';
import { PREWRITING_PATHS, digitCheckpoints, numberPool, pathCheckpoints, pickDistinct } from '../logic/tracing';
import { ROADS_PER_ROUND, VEHICLES } from '../logic/writingGames';
import { getRecord, hasPassed } from '../logic/progress';
import { t } from '../i18n/index';

const BEE_PATHS_PER_ROUND = 5;

// Two games that trace a path with something riding under the finger:
//   Race Track Numbers (traceGame 'race'): drive a car along a digit, from
//   the traffic light to the flag. All digits once Write 1 to 5 is passed.
//   Bee Paths (traceGame 'bee'): the pre-writing strokes digits are made of
//   (down, across, rainbow, circle, cross), from the honey pot to the flower.
const MODES = {
  race: {
    colors: { background: 0xddf3d0, card: 0xb7dfa2 },
    marker: '🚦',
    startMarker: '🚦',
    endMarker: '🏁',
    sayStart: 'tracing.sayStartLight',
    look: (item) => ({ dot: 24, guide: 0x9c9c9c, guideCurrent: 0x8a8a8a, done: 0x5e5e5e, follower: item.vehicle }),
    items() {
      const { NUMBER_WORDS, say } = content('math');
      const bigNumbers = hasPassed(getRecord(session.progress, 'math-write-1-5'));
      return pickDistinct(numberPool({ bigNumbers, allowZero: true }), ROADS_PER_ROUND).map((digit, i) => {
        const word = NUMBER_WORDS[digit];
        return {
          key: `d${digit}`,
          strokes: digitCheckpoints(digit),
          vehicle: VEHICLES[(digit + i) % VEHICLES.length],
          prompt: say.drive.prompt({ digit }),
          intro: say.drive.intro({ word }),
          praise: say.drive.praise({ word }),
        };
      });
    },
  },
  bee: {
    colors: { background: 0xe3f3ff, card: COLORS.white },
    marker: '🍯',
    startMarker: '🍯',
    endMarker: '🌸',
    sayStart: 'tracing.sayStartHoney',
    look: () => ({ dot: 12, guide: 0xf6de8d, guideCurrent: 0xf2cf5b, done: 0xe8a800, follower: '🐝' }),
    items() {
      const { STROKE_NAMES, say } = content('math');
      return PREWRITING_PATHS.slice(0, BEE_PATHS_PER_ROUND).map((path) => {
        const name = STROKE_NAMES[path.id];
        return { key: path.id, strokes: pathCheckpoints(path), prompt: say.fly.prompt({ name }), intro: say.fly.intro({ name }), praise: say.fly.praise() };
      });
    },
  },
};

export default class TracePathScene extends TraceRound {
  static key = 'TracePath';
  static plays = ['TracePath'];

  get mode() {
    return MODES[this.skill.traceGame];
  }

  get colors() {
    return this.mode.colors;
  }

  makeItems() {
    return this.mode.items();
  }

  lookOf(item) {
    return { look: this.mode.look(item), startMarker: this.mode.startMarker, endMarker: this.mode.endMarker };
  }

  idleText() {
    return t('tracing.watchMarker', { marker: this.mode.marker });
  }

  hintText(kind) {
    if (kind === 'start') return { show: t('tracing.startMarker', { marker: this.mode.marker }), say: t(this.mode.sayStart) };
    if (kind === 'next') return { show: t('tracing.nextLineShort'), say: t('tracing.sayNextLine') };
    return { show: t('tracing.almostPath'), say: t('tracing.almostPath') };
  }
}
