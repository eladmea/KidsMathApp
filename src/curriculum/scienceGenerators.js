// Nature Bay (science) question generators, following NGSS K-2 core ideas
// (weather, needs of living things, pushes and pulls) up to life cycles,
// states of matter, food chains and the human body.
import { pick, sample, shuffle } from './random';
import { content } from '../content/index';

// The words come from the language's science pack (src/content/<language>/science.js).
const science = () => content('science');


function dressForWeather() {
  const { WEATHER, say } = science();
  const weather = pick(WEATHER);
  const answer = pick(weather.items);
  const others = sample(
    WEATHER.filter((w) => w.id !== weather.id),
    2
  ).map((w) => pick(w.items));
  const options = shuffle([answer, ...others]);
  return {
    prompt: say.weather.prompt({ weather }),
    speech: say.weather.speech({ weather, options: options.map(([, name]) => name) }),
    visual: { type: 'picture', emoji: weather.emoji, caption: weather.label },
    answer: answer[0],
    choices: options.map(([emoji]) => emoji),
    choiceStyle: 'picture',
  };
}

function animalHomes() {
  const { ANIMAL_HOMES, say } = science();
  const habitat = pick(ANIMAL_HOMES);
  const [emoji, name] = pick(habitat.animals);
  const homes = shuffle([habitat.home, ...sample(ANIMAL_HOMES.filter((h) => h !== habitat).map((h) => h.home), 2)]);
  return {
    prompt: say.homes.prompt(),
    speech: say.homes.speech({ animal: name, homes: homes.map(([, place]) => place) }),
    visual: { type: 'picture', emoji, caption: name },
    answer: habitat.home[0],
    choices: homes.map(([e]) => e),
    choiceStyle: 'picture',
  };
}

function plantNeeds() {
  const { PLANT_NEEDS, NOT_PLANT_NEEDS, say } = science();
  const answer = pick(PLANT_NEEDS);
  const options = shuffle([answer, ...sample(NOT_PLANT_NEEDS, 2)]);
  return {
    prompt: say.plants.prompt(),
    speech: say.plants.speech({ options: options.map(([, name]) => name) }),
    visual: { type: 'picture', emoji: '🌱', caption: null },
    answer: answer[0],
    choices: options.map(([e]) => e),
    choiceStyle: 'picture',
  };
}

function pushOrPull() {
  const { PUSH_PULL, CHOICES, say } = science();
  const [emoji, action, answer] = pick(PUSH_PULL);
  return {
    prompt: say.pushPull.prompt(),
    speech: say.pushPull.speech({ action }),
    visual: { type: 'picture', emoji, caption: action },
    answer: CHOICES[answer],
    choices: [CHOICES.push, CHOICES.pull],
    choiceStyle: 'word',
  };
}

function orderQuestion(setsKey, phrases) {
  return () => {
    const pack = science();
    const set = pick(pack[setsKey]);
    return {
      type: 'order',
      prompt: pack.say[phrases].prompt(),
      speech: pack.say[phrases].speech(),
      visual: null,
      items: shuffle(set.map(([emoji, caption], id) => ({ id, emoji, caption }))),
      answer: set.map((_, id) => id),
      choices: [],
    };
  };
}

function statesOfMatter() {
  const { MATTER, CHOICES, say } = science();
  const [emoji, name, answer] = pick(MATTER);
  return {
    prompt: say.matter.prompt(),
    speech: say.matter.speech({ name }),
    visual: { type: 'picture', emoji, caption: name },
    answer: CHOICES[answer],
    choices: [CHOICES.solid, CHOICES.liquid, CHOICES.gas],
    choiceStyle: 'word',
  };
}

function humanBody() {
  const { BODY } = science();
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
  'life-cycles': orderQuestion('LIFE_CYCLES', 'lifeCycle'),
  'states-of-matter': statesOfMatter,
  'food-chains': orderQuestion('FOOD_CHAINS', 'foodChain'),
  'human-body': humanBody,
};
