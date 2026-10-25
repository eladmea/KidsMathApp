// A line of text with pictures in it: the emoji that have a picture become
// their own runs, everything else stays text.
//   iconRuns('2 / 5   ⭐ 3', (e) => e === '⭐')
//     -> [{ text: '2 / 5   ' }, { icon: '⭐' }, { text: ' 3' }]
// A right-to-left line (one with Hebrew letters, when `rtl`) comes back in
// drawing order, right to left, so "⚙️ הגדרות" draws the gear on the right.
import { RTL_LETTER } from './bidi';

// One emoji: a pictograph with its variation selector, keycap, skin tone or
// joined parts (🐻‍❄️). Plain symbols in the U+2600 block (☆ ✓) count too.
const EMOJI = /(?:\p{Extended_Pictographic}|[☀-➿])(?:️|⃣|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*/gu;

export function iconRuns(text, isPicture, rtl = false) {
  const runs = [];
  const addText = (part) => {
    if (!part) return;
    const last = runs[runs.length - 1];
    if (last && last.text !== undefined) last.text += part;
    else runs.push({ text: part });
  };
  let from = 0;
  for (const match of String(text).matchAll(EMOJI)) {
    addText(text.slice(from, match.index));
    if (isPicture(match[0])) runs.push({ icon: match[0] });
    else addText(match[0]);
    from = match.index + match[0].length;
  }
  addText(String(text).slice(from));
  if (!rtl || !RTL_LETTER.test(text) || !runs.some((run) => run.icon)) return runs;
  // Drawn right to left, a run's leading space belongs on its right.
  const mirror = (part) => part.replace(/^(\s*)([\s\S]*?)(\s*)$/, (all, before, core, after) => after + core + before);
  return runs.reverse().map((run) => (run.icon ? run : { text: mirror(run.text) }));
}
