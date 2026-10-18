// Nature Bay in English: weather, habitats, plants, pushes and pulls, life
// cycles, matter, food chains and the body, and how each question is said.

// Weather -> what to wear or bring.
export const WEATHER = [
  { id: 'sunny', emoji: '☀️', label: 'sunny', items: [['🕶️', 'sunglasses'], ['🧢', 'a cap'], ['🩳', 'shorts']] },
  { id: 'rainy', emoji: '🌧️', label: 'rainy', items: [['☂️', 'an umbrella']] },
  { id: 'snowy', emoji: '❄️', label: 'snowy', items: [['🧤', 'gloves'], ['🧣', 'a scarf'], ['🧥', 'a warm coat']] },
];

export const ANIMAL_HOMES = [
  { home: ['🌊', 'the ocean'], animals: [['🐟', 'fish'], ['🐙', 'octopus'], ['🐳', 'whale'], ['🦀', 'crab']] },
  { home: ['🏜️', 'the desert'], animals: [['🐪', 'camel'], ['🦂', 'scorpion'], ['🦎', 'lizard']] },
  { home: ['❄️', 'the icy cold'], animals: [['🐧', 'penguin'], ['🐻‍❄️', 'polar bear'], ['🦭', 'seal']] },
  { home: ['🌳', 'the forest'], animals: [['🐿️', 'squirrel'], ['🦉', 'owl'], ['🦌', 'deer'], ['🦔', 'hedgehog']] },
];

export const PLANT_NEEDS = [['💧', 'water'], ['☀️', 'sunlight'], ['🟫', 'soil'], ['💨', 'air']];
export const NOT_PLANT_NEEDS = [['🍕', 'pizza'], ['🍬', 'candy'], ['🧸', 'a teddy bear'], ['📺', 'TV'], ['👟', 'shoes']];

export const PUSH_PULL = [
  ['🛒', 'moving a shopping cart forward', 'push'],
  ['⚽', 'kicking a ball', 'push'],
  ['🛝', 'sliding down', 'push'],
  ['🚪', 'opening a door toward you', 'pull'],
  ['🪁', 'flying a kite on a string', 'pull'],
  ['🐕', 'walking a dog on a leash', 'pull'],
  ['🧲', 'a magnet grabbing a paper clip', 'pull'],
  ['🎈', 'tugging a balloon down', 'pull'],
];

export const LIFE_CYCLES = [
  [['🥚', 'A hen lays an egg.'], ['🐣', 'A chick hatches.'], ['🐥', 'The chick grows feathers.'], ['🐔', 'It becomes a hen.']],
  [['🥚', 'A butterfly lays a tiny egg.'], ['🐛', 'A caterpillar hatches and eats.'], ['💤', 'It rests in a chrysalis.'], ['🦋', 'A butterfly comes out.']],
  [['🥚', 'Frog eggs float in a pond.'], ['🐟', 'A tadpole swims with its tail.'], ['🦵', 'The tadpole grows legs.'], ['🐸', 'It becomes a frog.']],
  [['🌰', 'A seed is planted.'], ['🌱', 'It sprouts roots and a shoot.'], ['🌳', 'It grows into a tree.'], ['🍎', 'The tree grows fruit with seeds.']],
  [['👶', 'A baby is born.'], ['🧒', 'The baby grows into a child.'], ['🧑', 'The child grows into an adult.'], ['🧓', 'The adult grows old.']],
];

export const MATTER = [
  ['🧊', 'ice', 'solid'], ['🪨', 'a rock', 'solid'], ['🧱', 'a brick', 'solid'], ['🥄', 'a spoon', 'solid'],
  ['💧', 'water', 'liquid'], ['🥛', 'milk', 'liquid'], ['🍯', 'honey', 'liquid'], ['🧃', 'juice', 'liquid'],
  ['💨', 'air', 'gas'], ['♨️', 'steam', 'gas'], ['🎈', 'the air in a balloon', 'gas'],
];

export const FOOD_CHAINS = [
  [['☀️', 'The sun gives energy.'], ['🌿', 'Grass uses sunlight to grow.'], ['🐰', 'A rabbit eats the grass.'], ['🦊', 'A fox eats the rabbit.']],
  [['🌱', 'Leaves grow in the sun.'], ['🐛', 'A caterpillar eats the leaves.'], ['🐦', 'A bird eats the caterpillar.'], ['🦅', 'A hawk eats the bird.']],
  [['🌾', 'Grain grows in a field.'], ['🐭', 'A mouse eats the grain.'], ['🐍', 'A snake eats the mouse.'], ['🦉', 'An owl eats the snake.']],
  [['🌊', 'Tiny ocean plants use sunlight.'], ['🦐', 'Shrimp eat the tiny plants.'], ['🐟', 'A fish eats the shrimp.'], ['🦈', 'A shark eats the fish.']],
];

export const BODY = [
  ['Which part pumps blood around your body?', 'heart', ['lungs', 'brain', 'stomach']],
  ['Which part helps you breathe?', 'lungs', ['heart', 'bones', 'stomach']],
  ['Which part helps you think and remember?', 'brain', ['heart', 'lungs', 'muscles']],
  ['Where does food go after you swallow it?', 'stomach', ['lungs', 'brain', 'heart']],
  ['What holds your body up and protects it?', 'bones', ['stomach', 'lungs', 'skin']],
  ['What helps your body move by pulling on bones?', 'muscles', ['brain', 'stomach', 'lungs']],
  ['What covers and protects your whole body?', 'skin', ['bones', 'heart', 'brain']],
];

// "A cap. An umbrella. Or gloves": one short sentence per option, so each
// can be recorded once and reused.
export function listWords(words) {
  return words.map((word, i) => (i === words.length - 1 ? `Or ${word}` : word[0].toUpperCase() + word.slice(1))).join('. ');
}

export const CHOICES = { push: 'push', pull: 'pull', solid: 'solid', liquid: 'liquid', gas: 'gas' };

// Garden Days (logic/garden.js, by id): each stage's name, and each care
// choice's label, clue (for real needs) and reason.
export const GARDEN = {
  stages: ['seed', 'sprout', 'young plant', 'leafy plant', 'bud', 'flower'],
  choices: {
    water: { label: 'Water', clue: 'The soil is dry and the leaves are floppy.', reason: 'Plants drink water through their roots.' },
    sun: { label: 'Sunlight', clue: 'It is sitting in a dark corner.', reason: 'Plants use sunlight to make their food.' },
    soil: { label: 'Fresh soil', clue: 'The leaves look pale and the soil is worn out.', reason: 'Good soil gives plants nutrients.' },
    candy: { label: 'Candy', reason: "Plants don't eat candy!" },
    music: { label: 'Loud music', reason: "Plants don't need loud music to grow." },
  },
};

// Bubble Pop's golden bubbles.
export const FUN_FACTS = [
  'An octopus has three hearts!',
  'Honey never goes bad.',
  'A group of flamingos is called a flamboyance.',
  'Sea otters hold hands while they sleep.',
  'Bananas are berries, but strawberries are not!',
  'A snail can sleep for three years.',
  'Butterflies taste with their feet.',
  'Cows have best friends.',
  'The heart of a blue whale is as big as a small car.',
  'Koalas sleep up to 20 hours a day.',
];

export const say = {
  // Garden Days. `stage` is a stage's name, `reason` a choice's reason.
  garden: {
    look: ({ clue }) => `Look at your plant. ${clue} What does it need?`,
    grew: ({ reason, stage }) => `Yes! ${reason} It grew into ${/^[aeiou]/.test(stage) ? 'an' : 'a'} ${stage}! Come back tomorrow to help it grow more. 🌙`,
    bloomed: ({ flowers }) => `🌻 It bloomed! You have grown ${flowers} ${flowers === 1 ? 'flower' : 'flowers'}!`,
    sticker: ({ emoji }) => `You earned a sticker: ${emoji}`,
    wrong: ({ reason }) => `Hmm, not that. ${reason} Read the clue again!`,
  },
  weather: {
    prompt: ({ weather }) => `It's ${weather.label}!`,
    speech: ({ weather, options }) => `It's ${weather.label} today! What should we take? ${listWords(options)}?`,
  },
  homes: {
    prompt: () => 'Where do I live?',
    speech: ({ animal, homes }) => `Where does the ${animal} live? ${listWords(homes)}?`,
  },
  plants: {
    prompt: () => 'What does a plant need?',
    speech: ({ options }) => `What does a plant need to grow? ${listWords(options)}?`,
  },
  pushPull: {
    prompt: () => 'Push or pull?',
    speech: ({ action }) => `Is ${action} a push or a pull?`,
  },
  lifeCycle: {
    prompt: () => 'Put the life cycle in order',
    speech: () => 'Put the life cycle in order. What comes first?',
  },
  foodChain: {
    prompt: () => 'Build the food chain',
    speech: () => 'Build the food chain. Where does the energy start?',
  },
  matter: {
    prompt: () => 'Solid, liquid or gas?',
    speech: ({ name }) => `Is ${name} a solid, a liquid, or a gas?`,
  },
};
