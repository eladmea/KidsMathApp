import { generateQuestion } from '../curriculum/generators';
import { getSkill } from '../curriculum/skills';
import { adapt, harderSkill, skillForLevel, STEP_UP_AFTER } from '../utils/adaptive';
import { pickBestVoice, rankVoice, rankVoices } from '../utils/voices';
import {
  DIGIT_STROKES,
  DIGITS_PER_ROUND,
  TRACE_LEVELS,
  advance,
  digitCheckpoints,
  makeRound,
  sampleStroke,
  startsAtDot,
  traceStroke,
} from '../utils/tracing';

describe('Quick Look for ages 3-4', () => {
  it('only ever shows and offers 1 to 5, for longer', () => {
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion('quick-look-5');
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(5);
      q.choices.forEach((c) => expect(c).toBeLessThanOrEqual(5));
      expect(q.visual.flashMs).toBeGreaterThanOrEqual(2500);
    }
  });

  it('never levels up into an older age band', () => {
    const quickLook = getSkill('math-quick-look-5');
    expect(harderSkill(quickLook).id).toBe('math-quick-look-10');
    expect(harderSkill(quickLook, 'sprouts')).toBeNull();
    expect(skillForLevel(quickLook, 1, 'sprouts')).toBe(quickLook);
    let state = { level: 0, streak: 0 };
    for (let i = 0; i < STEP_UP_AFTER * 2; i++) state = adapt(state, true, quickLook, 'sprouts');
    expect(state.level).toBe(0);
    // Inside the band, stepping up still works.
    expect(harderSkill(getSkill('math-count-5'), 'sprouts').id).toBe('math-count-10');
    expect(harderSkill(getSkill('math-quick-look-5'), 'explorers').id).toBe('math-quick-look-10');
  });
});

describe('voice choice', () => {
  const voices = [
    { identifier: 'a', name: 'Fred', language: 'en-US', quality: 'Default' },
    { identifier: 'b', name: 'Samantha', language: 'en-US', quality: 'Default' },
    { identifier: 'c', name: 'Samantha (Enhanced)', language: 'en-US', quality: 'Enhanced' },
    { identifier: 'd', name: 'Microsoft Aria Online (Natural) - English (United States)', language: 'en-US', quality: 'Default' },
    { identifier: 'e', name: 'Google US English', language: 'en-US', quality: 'Default' },
    { identifier: 'f', name: 'Thomas', language: 'fr-FR', quality: 'Enhanced' },
    { identifier: 'g', name: 'Zarvox', language: 'en-US', quality: 'Default' },
  ];

  it('prefers natural, then enhanced, then Google voices, and skips novelty or other-language ones', () => {
    expect(rankVoices(voices).map((v) => v.identifier).slice(0, 4)).toEqual(['d', 'c', 'e', 'b']);
    expect(pickBestVoice(voices)).toBe('d');
    expect(rankVoices(voices).map((v) => v.identifier)).not.toContain('f');
    expect(rankVoice(voices[6])).toBeLessThan(0);
    expect(rankVoice(voices[0])).toBeLessThan(0);
  });

  it('copes with no usable voices', () => {
    expect(pickBestVoice([])).toBeNull();
    expect(pickBestVoice([voices[5], voices[6]])).toBeNull();
    expect(pickBestVoice([{ identifier: 'x', name: 'Daniel', language: 'en_GB', quality: 'Default' }])).toBe('x');
  });
});

describe('Number Tracing', () => {
  it('has strokes for every digit that trace cleanly along their own path', () => {
    for (let d = 0; d <= 9; d++) {
      const strokes = digitCheckpoints(d);
      expect(strokes.length).toBeGreaterThan(0);
      strokes.forEach((cps) => {
        expect(traceStroke(cps, cps).done).toBe(true);
        cps.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(140);
        });
      });
    }
  });

  it('requires starting at the green dot and following the whole stroke', () => {
    const [stroke] = digitCheckpoints(7);
    expect(traceStroke(stroke, [[90, 90], ...stroke]).started).toBe(false);
    expect(startsAtDot(stroke, [stroke[0][0] + 5, stroke[0][1] + 5])).toBe(true);
    // Jumping from the start to the end doesn't count.
    expect(traceStroke(stroke, [stroke[0], stroke[stroke.length - 1]]).done).toBe(false);
    // Stopping halfway doesn't count.
    expect(traceStroke(stroke, stroke.slice(0, Math.floor(stroke.length / 2))).done).toBe(false);
    // A slightly wobbly trace still counts.
    const wobbly = stroke.map(([x, y], i) => [x + (i % 2 ? 5 : -5), y + 3]);
    expect(traceStroke(stroke, wobbly).done).toBe(true);
  });

  it('advances only along the path, never by skipping far ahead', () => {
    // Checkpoints every 10 units; a touch reaches those within 14 units.
    const cps = sampleStroke([[0, 0], [0, 100]], 10);
    expect(advance(cps, 0, [0, 0])).toBe(2);
    expect(advance(cps, 1, [0, 90])).toBe(1);
    expect(advance(cps, 1, [0, 20])).toBe(4);
  });

  it('plays 1-5 first, then 6-9 and 0', () => {
    expect(makeRound('small')).toEqual([1, 2, 3, 4, 5]);
    expect(makeRound('big')).toEqual([6, 7, 8, 9, 0]);
    expect(Object.values(TRACE_LEVELS).flat().sort()).toEqual(Object.keys(DIGIT_STROKES).map(Number).sort());
    expect(makeRound('small')).toHaveLength(DIGITS_PER_ROUND);
    expect(getSkill('math-write-6-9').prereqs).toEqual(['math-write-1-5']);
  });
});
