// Right-to-left lines: Hebrew is isolated right to left, sums inside stay
// left to right, and lines without Hebrew are untouched.
import { rtlLine } from '../src/logic/bidi';

const RLI = '\u2067';
const LRI = '\u2066';
const PDI = '\u2069';

describe('rtlLine', () => {
  it('leaves lines without right-to-left letters alone', () => {
    expect(rtlLine('5 − 2 = ?')).toBe('5 − 2 = ?');
    expect(rtlLine('MathPlay 🎉')).toBe('MathPlay 🎉');
  });

  it('draws Hebrew right to left', () => {
    expect(rtlLine('שלום!')).toBe(`${RLI}שלום!${PDI}`);
  });

  it('keeps sums and ranges left to right inside Hebrew', () => {
    expect(rtlLine('כמה זה 5 − 2?')).toBe(`${RLI}כמה זה ${LRI}5 − 2${PDI}?${PDI}`);
    expect(rtlLine('גילאי 3–6')).toBe(`${RLI}גילאי ${LRI}3–6${PDI}${PDI}`);
    expect(rtlLine('7 × 8 = ? מה התשובה')).toBe(`${RLI}${LRI}7 × 8 = ?${PDI} מה התשובה${PDI}`);
  });
});
