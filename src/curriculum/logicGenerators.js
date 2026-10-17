// Puzzle Peak (logic) question generators: patterns and logic-grid puzzles.
import { pick, sample, shuffle } from './random';

// Patterns follow the patterning learning trajectory (Clements & Sarama;
// Rittle-Johnson et al.): fill a gap in an AB pattern (age 3) -> extend AB,
// AAB, ABB (4) -> longer cores (5) -> the same pattern in new things
// (abstraction, 5-6) -> name the repeating part (unit, 6-7) -> growing
// patterns (7-8) -> position and number rules (functional thinking, 9-10).
export const PATTERN_SETS = [
  [['🔴', 'red'], ['🔵', 'blue'], ['🟡', 'yellow']],
  [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes']],
  [['🐶', 'dog'], ['🐱', 'cat'], ['🐭', 'mouse']],
  [['⭐', 'star'], ['🌙', 'moon'], ['☀️', 'sun']],
  [['🟥', 'red square'], ['🟩', 'green square'], ['🟦', 'blue square']],
];

const UNITS_MORE = ['AB', 'AAB', 'ABB'];
const UNITS_HARD = ['ABC', 'AABB', 'ABB', 'AAB', 'ABBC'];
// Structures used for "same pattern, new look" and "which part repeats?".
const UNITS_ABSTRACT = ['AB', 'AAB', 'ABB', 'ABC', 'AABB'];

function symbolsFor(set, unit) {
  return unit.split('').map((letter) => set['ABC'.indexOf(letter)]);
}

function repeat(unit, length) {
  return Array.from({ length }, (_, i) => unit[i % unit.length]);
}

function listWords(words) {
  return words.join(', ');
}

// Ages 3-4 (start): an AB pattern with 3 or more full repeats and one gap,
// usually in the middle (filling a gap is easier than extending). Two
// choices: the two things in the pattern.
function patternsAB() {
  const set = pick(PATTERN_SETS);
  const items = repeat(symbolsFor(set, 'AB'), 6 + (Math.random() < 0.5 ? 0 : 2));
  const atEnd = Math.random() < 0.3;
  const gap = atEnd ? items.length - 1 : 1 + Math.floor(Math.random() * (items.length - 2));
  const [answer, answerName] = items[gap];
  const spoken = items.map(([, name], i) => (i === gap ? 'something' : name));
  return {
    prompt: atEnd ? 'What comes next?' : "What's missing?",
    speech: `${listWords(spoken)}. ${atEnd ? 'What comes next?' : 'What goes in the gap?'}`,
    visual: { type: 'pattern', items: items.map(([emoji]) => emoji), gap },
    answer,
    explain: `It goes ${set[0][1]}, ${set[1][1]}, ${set[0][1]}, ${set[1][1]}… so ${answerName} goes there!`,
    choices: shuffle([set[0][0], set[1][0]]),
    choiceStyle: 'picture',
    speakAlways: true,
  };
}

// Extend a pattern: what comes next? Shows 2-3 full repeats.
function extendPattern(units, { gapChance = 0 } = {}) {
  return () => {
    const set = pick(PATTERN_SETS);
    const unit = pick(units);
    const symbols = symbolsFor(set, unit);
    // Two full repeats and a bit more, short enough to fit on one line.
    const length = unit.length * 2 + Math.floor(Math.random() * 2);
    const items = repeat(symbols, length + 1);
    const inMiddle = Math.random() < gapChance;
    const gap = inMiddle ? 1 + Math.floor(Math.random() * (items.length - 2)) : items.length - 1;
    const [answer, answerName] = items[gap];
    const used = [...new Set(unit.split(''))].map((letter) => set['ABC'.indexOf(letter)]);
    // Two-thing patterns get the third thing as an extra choice.
    const options = used.length >= 3 ? used : [...used, set.find((s) => !used.includes(s))];
    const core = symbols.map(([, name]) => name);
    return {
      prompt: inMiddle ? "What's missing?" : 'What comes next?',
      speech: `${listWords(items.map(([, name], i) => (i === gap ? 'something' : name)))}. ${inMiddle ? 'What goes in the gap?' : 'What comes next?'}`,
      visual: { type: 'pattern', items: items.map(([emoji]) => emoji), gap, unitLength: unit.length },
      answer,
      explain: `The part that repeats is ${listWords(core)}. So ${answerName} goes there.`,
      choices: shuffle(options.map(([emoji]) => emoji)),
      choiceStyle: 'picture',
    };
  };
}

// Rows are always 6 long, so length never gives the answer away.
const ROW_LENGTH = 6;
function rowOf(set, unit) {
  return repeat(symbolsFor(set, unit), ROW_LENGTH).map(([emoji]) => emoji).join('');
}

// Ages 5-6: abstraction. Which row has the same pattern, made of other things?
function patternMatch() {
  const [shown, other] = sample(PATTERN_SETS, 2);
  const unit = pick(UNITS_ABSTRACT);
  const wrongUnits = sample(UNITS_ABSTRACT.filter((u) => u !== unit), 2);
  const answer = rowOf(other, unit);
  return {
    prompt: 'Find the same pattern!',
    speech: 'Look at the pattern. Which row has the same pattern, made of different things?',
    visual: { type: 'pattern', items: repeat(symbolsFor(shown, unit), ROW_LENGTH).map(([e]) => e), gap: null },
    answer,
    explain: `Both go ${unit.split('').join(' ')}, ${unit.split('').join(' ')}: the same pattern with new things.`,
    choices: shuffle([answer, ...wrongUnits.map((u) => rowOf(other, u))]),
    choiceStyle: 'pattern',
  };
}

// Ages 6-8: which part repeats? The answer is the smallest repeating part
// from the start; the wrong ones are a shorter and a longer start.
function patternUnit() {
  const set = pick(PATTERN_SETS);
  const unit = pick(UNITS_ABSTRACT.filter((u) => u.length >= 3));
  // Three repeats (two for 4-long units), so it fits on one line.
  const items = repeat(symbolsFor(set, unit), unit.length * (unit.length >= 4 ? 2 : 3)).map(([e]) => e);
  const answer = items.slice(0, unit.length).join('');
  const shorter = items.slice(0, unit.length - 1).join('');
  const longer = items.slice(0, unit.length + 1).join('');
  return {
    prompt: 'Which part repeats?',
    speech: 'Which part of the pattern keeps repeating?',
    visual: { type: 'pattern', items, gap: null, unitLength: unit.length, showUnits: false },
    answer,
    explain: `${answer} repeats again and again.`,
    choices: shuffle([answer, shorter, longer]),
    choiceStyle: 'pattern',
  };
}

const GROWING_RULES = [
  { start: 1, add: 1 },
  { start: 1, add: 2 },
  { start: 2, add: 2 },
  { start: 2, add: 3 },
  { start: 3, add: 3 },
  { start: 1, add: 3 },
];

// Ages 7-8: growing patterns. How many blocks in the next step?
function growingPatterns() {
  const { start, add } = pick(GROWING_RULES);
  const steps = [0, 1, 2].map((i) => start + i * add);
  const answer = start + 3 * add;
  return {
    prompt: 'How many in the next step?',
    speech: `Step one has ${steps[0]}, step two has ${steps[1]}, step three has ${steps[2]}. How many in step four?`,
    visual: { type: 'growing', steps, emoji: pick(['🟦', '🟧', '🟩', '⭐', '🍪']) },
    answer,
    explain: `It grows by ${add} each step: ${steps[2]} + ${add} = ${answer}.`,
    choices: buildChoicesNear(answer, [steps[2] + 1, answer + add, steps[2]]),
  };
}

// Four numeric choices around the answer, preferring typical slips.
function buildChoicesNear(answer, slips) {
  const choices = new Set([answer]);
  slips.filter((n) => n > 0 && n !== answer).forEach((n) => choices.size < 4 && choices.add(n));
  for (let d = 1; choices.size < 4; d++) {
    if (answer + d > 0) choices.add(answer + d);
    if (choices.size < 4 && answer - d > 0) choices.add(answer - d);
  }
  return shuffle([...choices]);
}

// Ages 9-10: position. Numbered ABC pattern: what is the Nth thing?
function patternPosition() {
  const set = pick(PATTERN_SETS);
  const unit = pick(['AB', 'ABC', 'AAB', 'ABB']);
  const symbols = symbolsFor(set, unit);
  const shownLength = unit.length * 2;
  const position = shownLength + 3 + Math.floor(Math.random() * 15);
  const [answer, answerName] = symbols[(position - 1) % unit.length];
  const used = [...new Set(symbols.map(([e]) => e))];
  const options = used.length >= 3 ? used : [...used, set.find(([e]) => !used.includes(e))[0]];
  return {
    prompt: `What is number ${position}?`,
    speech: `The pattern keeps going. What will be number ${position}?`,
    visual: { type: 'pattern', items: repeat(symbols, shownLength).map(([e]) => e), gap: null, numbered: true },
    answer,
    explain: `The pattern repeats every ${unit.length}. Jump ${unit.length} at a time: number ${position} lands on ${answerName}.`,
    choices: shuffle(options),
    choiceStyle: 'picture',
  };
}

const NUMBER_RULES = [
  // [make terms, describe]
  () => {
    const start = 1 + Math.floor(Math.random() * 3);
    const terms = [start, start * 2, start * 4, start * 8];
    return { terms, next: start * 16, rule: 'doubles each time (× 2)' };
  },
  () => {
    const start = 1 + Math.floor(Math.random() * 5);
    // Five terms, so it can't also be read as "add the two before"
    // (2, 3, 5, 8 alone could be either).
    const terms = [start, start + 1, start + 3, start + 6, start + 10];
    return { terms, next: start + 15, rule: 'adds 1, then 2, then 3, then 4, then 5' };
  },
  () => {
    const start = 2 + Math.floor(Math.random() * 6);
    const terms = [start, start + 3, start + 2, start + 5, start + 4];
    return { terms, next: start + 7, rule: 'goes up 3, down 1, up 3, down 1' };
  },
  () => {
    const n = 1 + Math.floor(Math.random() * 3);
    const terms = [n, n + 1, n + 2, n + 3].map((k) => k * k);
    return { terms, next: (n + 4) * (n + 4), rule: 'is square numbers (1×1, 2×2, 3×3…)' };
  },
  () => {
    const step = pick([4, 6, 7, 9, 11, 12]);
    const start = step + Math.floor(Math.random() * 10);
    const terms = [start, start + step, start + 2 * step, start + 3 * step];
    return { terms, next: start + 4 * step, rule: `adds ${step} each time` };
  },
];

// Ages 9-10: find the rule, then the next number.
function numberRules() {
  const { terms, next, rule } = pick(NUMBER_RULES)();
  const last = terms[terms.length - 1];
  return {
    prompt: `${terms.join(', ')}, ?`,
    speech: `${terms.join(', ')}. What comes next?`,
    visual: null,
    answer: next,
    explain: `The pattern ${rule}, so next is ${next}.`,
    choices: buildChoicesNear(next, [next + 1, next - 1, last + (last - terms[terms.length - 2])]),
  };
}

const NAMES = ['Ana', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay'];
const PETS = [['🐶', 'dog'], ['🐱', 'cat'], ['🐟', 'fish'], ['🐰', 'rabbit'], ['🐢', 'turtle']];

function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  );
}

// clue: { person, pet, has } — "person has / does not have pet".
function consistent(assignment, clues) {
  return clues.every(({ person, pet, has }) => (assignment[person] === pet) === has);
}

// All pet assignments (person index -> pet index) that fit the clues.
export function solveLogicGrid(size, clues) {
  return permutations([...Array(size).keys()]).filter((assignment) => consistent(assignment, clues));
}

// Three friends, three pets: build clues until exactly one answer fits, drop
// any clue that isn't needed, then ask about someone no clue names directly.
export function makeLogicGrid(size = 3) {
  for (;;) {
    const truth = shuffle([...Array(size).keys()]);
    const candidates = shuffle(
      [...Array(size).keys()].flatMap((person) =>
        [...Array(size).keys()].map((pet) => ({ person, pet, has: truth[person] === pet }))
      )
    );
    const clues = [];
    for (const clue of candidates) {
      if (solveLogicGrid(size, clues).length === 1) break;
      if (solveLogicGrid(size, [...clues, clue]).length < solveLogicGrid(size, clues).length) clues.push(clue);
    }
    for (let i = clues.length - 1; i >= 0; i--) {
      const without = clues.filter((_, j) => j !== i);
      if (solveLogicGrid(size, without).length === 1) clues.splice(i, 1);
    }
    const directlyNamed = new Set(clues.filter((c) => c.has).map((c) => c.person));
    const askable = [...Array(size).keys()].filter((p) => !directlyNamed.has(p));
    if (askable.length && clues.length >= 2) {
      return { truth, clues, ask: pick(askable) };
    }
  }
}

function logicGrids() {
  const names = sample(NAMES, 3);
  const pets = sample(PETS, 3);
  const { truth, clues, ask } = makeLogicGrid(3);
  const lines = clues.map(
    ({ person, pet, has }) => `${names[person]} ${has ? 'has' : 'does not have'} the ${pets[pet][1]}.`
  );
  return {
    prompt: `${lines.join('\n')}\nWhich pet is ${names[ask]}'s?`,
    speech: `${lines.join(' ')} Which pet belongs to ${names[ask]}?`,
    visual: { type: 'picture', emoji: pets.map(([e]) => e).join(' '), caption: names.join(' · ') },
    answer: pets[truth[ask]][0],
    choices: pets.map(([e]) => e),
    choiceStyle: 'picture',
  };
}

export const LOGIC_GENERATORS = {
  'patterns-ab': patternsAB,
  'patterns-easy': extendPattern(UNITS_MORE, { gapChance: 0.3 }),
  'patterns-hard': extendPattern(UNITS_HARD),
  'pattern-match': patternMatch,
  'pattern-unit': patternUnit,
  'growing-patterns': growingPatterns,
  'pattern-position': patternPosition,
  'number-rules': numberRules,
  'logic-grids': logicGrids,
};
