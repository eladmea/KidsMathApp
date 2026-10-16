// Nature Bay (science) question generators, following NGSS K-2 core ideas
// (weather, needs of living things, pushes and pulls) up to life cycles,
// states of matter, food chains and the human body.
import { pick, sample, shuffle } from './random';

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

function listWords(words) {
  return `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`;
}

function dressForWeather() {
  const weather = pick(WEATHER);
  const answer = pick(weather.items);
  const others = sample(
    WEATHER.filter((w) => w.id !== weather.id),
    2
  ).map((w) => pick(w.items));
  const options = shuffle([answer, ...others]);
  return {
    prompt: `It's ${weather.label}!`,
    speech: `It's ${weather.label} today! What should we take: ${listWords(options.map(([, name]) => name))}?`,
    visual: { type: 'picture', emoji: weather.emoji, caption: weather.label },
    answer: answer[0],
    choices: options.map(([emoji]) => emoji),
    choiceStyle: 'picture',
  };
}

function animalHomes() {
  const habitat = pick(ANIMAL_HOMES);
  const [emoji, name] = pick(habitat.animals);
  const homes = shuffle([habitat.home, ...sample(ANIMAL_HOMES.filter((h) => h !== habitat).map((h) => h.home), 2)]);
  return {
    prompt: 'Where do I live?',
    speech: `Where does the ${name} live: ${listWords(homes.map(([, place]) => place))}?`,
    visual: { type: 'picture', emoji, caption: name },
    answer: habitat.home[0],
    choices: homes.map(([e]) => e),
    choiceStyle: 'picture',
  };
}

function plantNeeds() {
  const answer = pick(PLANT_NEEDS);
  const options = shuffle([answer, ...sample(NOT_PLANT_NEEDS, 2)]);
  return {
    prompt: 'What does a plant need?',
    speech: `What does a plant need to grow: ${listWords(options.map(([, name]) => name))}?`,
    visual: { type: 'picture', emoji: '🌱', caption: null },
    answer: answer[0],
    choices: options.map(([e]) => e),
    choiceStyle: 'picture',
  };
}

function pushOrPull() {
  const [emoji, action, answer] = pick(PUSH_PULL);
  return {
    prompt: 'Push or pull?',
    speech: `Is ${action} a push or a pull?`,
    visual: { type: 'picture', emoji, caption: action },
    answer,
    choices: ['push', 'pull'],
    choiceStyle: 'word',
  };
}

function orderQuestion(sets, prompt, speech) {
  return () => {
    const set = pick(sets);
    return {
      type: 'order',
      prompt,
      speech,
      visual: null,
      items: shuffle(set.map(([emoji, caption], id) => ({ id, emoji, caption }))),
      answer: set.map((_, id) => id),
      choices: [],
    };
  };
}

function statesOfMatter() {
  const [emoji, name, answer] = pick(MATTER);
  return {
    prompt: 'Solid, liquid or gas?',
    speech: `Is ${name} a solid, a liquid, or a gas?`,
    visual: { type: 'picture', emoji, caption: name },
    answer,
    choices: ['solid', 'liquid', 'gas'],
    choiceStyle: 'word',
  };
}

function humanBody() {
  const [question, answer, distractors] = pick(BODY);
  return {
    prompt: question,
    speech: question,
    visual: null,
    answer,
    choices: shuffle([answer, ...distractors]),
    choiceStyle: 'word',
  };
}

export const SCIENCE_GENERATORS = {
  'dress-weather': dressForWeather,
  'animal-homes': animalHomes,
  'plant-needs': plantNeeds,
  'push-pull': pushOrPull,
  'life-cycles': orderQuestion(LIFE_CYCLES, 'Put the life cycle in order', 'Put the life cycle in order. What comes first?'),
  'states-of-matter': statesOfMatter,
  'food-chains': orderQuestion(FOOD_CHAINS, 'Build the food chain', 'Build the food chain. Where does the energy start?'),
  'human-body': humanBody,
};
