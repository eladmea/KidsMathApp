// How a line of right-to-left text (Hebrew, Arabic) is drawn: as a
// right-to-left "isolate" (Unicode bidi controls, which have no width), so
// the browser orders it right to left while the game keeps measuring and
// aligning it as usual. Sums inside it stay left to right ("כמה זה 5 − 2?"
// never shows "2 − 5"), and lines with no right-to-left letters
// ("5 − 2 = ?", "MathPlay") are left alone.
export const RTL_LETTER = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const RLI = '\u2067';
const LRI = '\u2066';
const PDI = '\u2069';
// A number with operators and more numbers (or a ?): "3 + 4", "12:30", "3–6", "7 × 8 = ?".
const SUM = /\d+(?:\s*[+\-−–×÷=<>:/]\s*(?:\d+|\?))+/g;

export function rtlLine(line) {
  if (!RTL_LETTER.test(line)) return line;
  return RLI + line.replace(SUM, (sum) => LRI + sum + PDI) + PDI;
}
