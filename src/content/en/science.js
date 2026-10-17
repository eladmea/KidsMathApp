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

export function listWords(words) {
  return `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`;
}

export const CHOICES = { push: 'push', pull: 'pull', solid: 'solid', liquid: 'liquid', gas: 'gas' };

export const say = {
  weather: {
    prompt: ({ weather }) => `It's ${weather.label}!`,
    speech: ({ weather, options }) => `It's ${weather.label} today! What should we take: ${listWords(options)}?`,
  },
  homes: {
    prompt: () => 'Where do I live?',
    speech: ({ animal, homes }) => `Where does the ${animal} live: ${listWords(homes)}?`,
  },
  plants: {
    prompt: () => 'What does a plant need?',
    speech: ({ options }) => `What does a plant need to grow: ${listWords(options)}?`,
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
