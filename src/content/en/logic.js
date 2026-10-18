// Puzzle Peak in English: the things patterns are made of, names and pets
// for logic grids, and how each question is said.

// Pattern things: [emoji, spoken name].
export const PATTERN_SETS = [
  [['🔴', 'red'], ['🔵', 'blue'], ['🟡', 'yellow']],
  [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes']],
  [['🐶', 'dog'], ['🐱', 'cat'], ['🐭', 'mouse']],
  [['⭐', 'star'], ['🌙', 'moon'], ['☀️', 'sun']],
  [['🟥', 'red square'], ['🟩', 'green square'], ['🟦', 'blue square']],
];

export const NAMES = ['Ana', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay'];
export const PETS = [['🐶', 'dog'], ['🐱', 'cat'], ['🐟', 'fish'], ['🐰', 'rabbit'], ['🐢', 'turtle']];

// One short sentence per thing ("Dog. Cat. Something."), so each word is
// recorded once and reused in every pattern.
const spoken = (names) => names.map((name) => name[0].toUpperCase() + name.slice(1)).join('. ');

// Bunny Pop and Freeze Zoo's animals, by emoji.
export const ANIMAL_NAMES = {
  '🐸': 'frog',
  '🐷': 'pig',
  '🐱': 'cat',
  '🐶': 'dog',
  '🐵': 'monkey',
  '🦊': 'fox',
  '🐼': 'panda',
  '🐔': 'chicken',
  '🐰': 'bunny',
  '🦁': 'lion',
  '🦉': 'owl',
};

export const say = {
  // Bunny Pop: tapped an animal that isn't the bunny.
  bunnyOops: ({ animal }) => `That's the ${animal}. Only boop the bunny!`,
  gap: 'something',
  missing: { prompt: () => "What's missing?", question: () => 'What goes in the gap?' },
  next: { prompt: () => 'What comes next?', question: () => 'What comes next?' },
  pattern: {
    speech: ({ names, question }) => `${spoken(names)}. ${question}`,
    explainAB: ({ a, b, answer }) => `It goes ${a}, ${b}, ${a}, ${b}… so ${answer} goes there!`,
    explainCore: ({ core, answer }) => `The part that repeats is ${spoken(core)}. So ${answer} goes there.`,
  },
  match: {
    prompt: () => 'Find the same pattern!',
    speech: () => 'Look at the pattern. Which row has the same pattern, made of different things?',
    explain: ({ letters }) => `Both go ${letters}, ${letters}: the same pattern with new things.`,
  },
  unit: {
    prompt: () => 'Which part repeats?',
    speech: () => 'Which part of the pattern keeps repeating?',
    explain: ({ unit }) => `${unit} repeats again and again.`,
  },
  growing: {
    prompt: () => 'How many in the next step?',
    speech: ({ steps }) => `Step one has ${steps[0]}, step two has ${steps[1]}, step three has ${steps[2]}. How many in step four?`,
    explain: ({ add, last, answer }) => `It grows by ${add} each step: ${last} + ${add} = ${answer}.`,
  },
  position: {
    prompt: ({ position }) => `What is number ${position}?`,
    speech: ({ position }) => `The pattern keeps going. What will be number ${position}?`,
    explain: ({ length, position, answer }) => `The pattern repeats every ${length}. Jump ${length} at a time: number ${position} lands on ${answer}.`,
  },
  rules: {
    speech: ({ terms }) => `${terms.join(', ')}. What comes next?`,
    explain: ({ rule, next }) => `The pattern ${rule}, so next is ${next}.`,
    double: () => 'doubles each time (× 2)',
    growingSteps: () => 'adds 1, then 2, then 3, then 4, then 5',
    zigzag: () => 'goes up 3, down 1, up 3, down 1',
    squares: () => 'is square numbers (1×1, 2×2, 3×3…)',
    addEach: ({ step }) => `adds ${step} each time`,
  },
  grid: {
    clue: ({ name, has, pet }) => `${name} ${has ? 'has' : 'does not have'} the ${pet}.`,
    prompt: ({ clues, name }) => `${clues.join('\n')}\nWhich pet is ${name}'s?`,
    speech: ({ clues, name }) => `${clues.join(' ')} Which pet belongs to ${name}?`,
  },
};
