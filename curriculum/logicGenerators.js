// Puzzle Peak (logic) question generators: patterns and logic-grid puzzles.
import { pick, sample, shuffle } from './random';

const PATTERN_SETS = [
  ['🔴', '🔵', '🟡'],
  ['🍎', '🍌', '🍇'],
  ['🐶', '🐱', '🐭'],
  ['⭐', '🌙', '☀️'],
  ['🟥', '🟩', '🟦'],
];

// Repeating units, easiest first.
const UNITS_EASY = ['AB', 'AAB', 'ABB'];
const UNITS_HARD = ['ABC', 'AABB', 'ABAC', 'ABBC'];

function patterns(units) {
  return () => {
    const set = pick(PATTERN_SETS);
    const unit = pick(units);
    const symbol = (letter) => set['ABC'.indexOf(letter)];
    const length = unit.length * 2 + 1 + Math.floor(Math.random() * unit.length);
    const sequence = Array.from({ length: length + 1 }, (_, i) => symbol(unit[i % unit.length]));
    const answer = sequence.pop();
    const used = [...new Set(unit.split('').map(symbol))];
    const choices = shuffle(used.length >= 2 ? used : [...used, set.find((s) => !used.includes(s))]);
    return {
      prompt: `${sequence.join(' ')} ?`,
      speech: 'What comes next in the pattern?',
      visual: null,
      answer,
      choices,
      choiceStyle: 'picture',
    };
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
  'patterns-easy': patterns(UNITS_EASY),
  'patterns-hard': patterns(UNITS_HARD),
  'logic-grids': logicGrids,
};
