// Number Island in English: things to count, shapes, and how each math
// question is said.

// Things to count. `one` / `many` are the word for 1 and for more.
export const OBJECTS = [
  { emoji: '🍎', one: 'apple', many: 'apples' },
  { emoji: '⭐', one: 'star', many: 'stars' },
  { emoji: '🐟', one: 'fish', many: 'fish' },
  { emoji: '🎈', one: 'balloon', many: 'balloons' },
  { emoji: '🐞', one: 'ladybug', many: 'ladybugs' },
  { emoji: '🌸', one: 'flower', many: 'flowers' },
  { emoji: '🚗', one: 'car', many: 'cars' },
  { emoji: '🍪', one: 'cookie', many: 'cookies' },
];

export const SHAPES = [
  { emoji: '🔴', name: 'circle' },
  { emoji: '🟦', name: 'square' },
  { emoji: '🔺', name: 'triangle' },
  { emoji: '⭐', name: 'star' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '🔷', name: 'diamond' },
];

// Number words, 0-9 (the writing games say them).
export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

// The pre-writing strokes of Bee Paths, by id (logic/tracing.js PREWRITING_PATHS).
export const STROKE_NAMES = {
  down: 'straight down',
  across: 'straight across',
  rainbow: 'a rainbow',
  circle: 'a circle',
  cross: 'a cross',
  slide: 'a slide',
};

// Pizza Shop and Birthday Cake: the animals who order, and the toppings
// (logic/writingGames.js CUSTOMERS / TOPPINGS, by id). `card` labels the
// topping's button.
export const CUSTOMER_NAMES = { bear: 'Bear', bunny: 'Bunny', fox: 'Fox', panda: 'Panda', frog: 'Frog', monkey: 'Monkey', lion: 'Lion', pig: 'Pig' };
export const TOPPING_NAMES = {
  olive: { one: 'olive slice', many: 'olive slices', card: 'olives' },
  corn: { one: 'corn', many: 'corn', card: 'corn' },
  mushroom: { one: 'mushroom', many: 'mushrooms', card: 'mushroom' },
  pineapple: { one: 'pineapple', many: 'pineapples', card: 'pineapple' },
};

const noun = (object, count) => (count === 1 ? object.one : object.many);
const upTo = (count) => Array.from({ length: count }, (_, i) => i + 1).join(', ');

const an = (word) => (/^[aeiou]/.test(word) ? `an ${word}` : `a ${word}`);
const capital = (word) => word[0].toUpperCase() + word.slice(1);

export const say = {
  // Writing games (Write 1 to 5, Race Track, Bee Paths).
  write: {
    prompt: ({ digit }) => `Write ${digit}`,
    intro: ({ word }) => `Let's write ${word}! Watch me, then start at the green dot.`,
    praise: ({ word }) => `${capital(word)}! You wrote ${word}!`,
    celebrate: ({ digit, emoji }) => (digit === 0 ? '0: nothing at all! 🫙' : `${digit}! ${emoji.repeat(digit)}`),
  },
  drive: {
    prompt: ({ digit }) => `Drive the ${digit}!`,
    intro: ({ word }) => `Let's drive the number ${word}! Start at the traffic light.`,
    praise: ({ word }) => `Vroom! You drove ${an(word)}!`,
  },
  fly: {
    prompt: ({ name }) => `Fly ${name}!`,
    intro: ({ name }) => `Help the bee fly ${name} to the flower. Start at the honey pot.`,
    praise: () => 'Buzz buzz! The bee found the flower!',
  },
  // Pizza Shop. `word` is the number's word, `friend` the customer's name,
  // `topping` a TOPPING_NAMES entry.
  pizza: {
    order: ({ friend, number, word }) => `${friend} wants a pizza with ${word} ${number === 1 ? 'topping' : 'toppings'}! First, rub the dough to roll it out.`,
    rolled: ({ word }) => `Great rolling! Now write ${word} with the sauce. Follow the dots.`,
    more: ({ word }) => `Keep going! Cover the whole ${word}.`,
    messy: ({ word }) => `Oops, the sauce went everywhere! Try to stay on the ${word}.`,
    written: ({ word }) => `${capital(word)}! Now spread the sauce all over the pizza with your finger.`,
    sauced: () => 'Saucy! Now sprinkle the cheese all over.',
    cheesed: ({ friend, word }) => `Cheesy! Now pick a topping. ${friend} wants ${word}.`,
    picked: ({ number, word, topping }) => `Put ${word} ${noun(topping, number)} on the pizza. Drag them from the tray.`,
    right: ({ number, topping }) => `${number} ${noun(topping, number)}! Now drag the pizza into the oven.`,
    tooFewShow: ({ friend, number, placed }) => `${friend} wants ${number}. We have ${placed}. Add more!`,
    tooFew: ({ friend, number, placed }) => `${friend} wants ${number}. We have ${placed}. Add ${number - placed} more!`,
    tooManyShow: ({ friend, number }) => `Too many! ${friend} wants ${number}. Take one off.`,
    tooMany: ({ friend, number, placed }) => `Too many! ${friend} wants ${number}. Take ${placed - number} off.`,
    ovenMiss: () => 'Drag the pizza all the way into the oven!',
    baking: () => 'Into the oven! It is getting hot…',
    ready: () => 'Ding! The pizza is ready. Swipe across it to cut it into slices.',
    cutMiss: () => 'Swipe all the way across the pizza!',
    cutOne: () => 'Chop! One more cut.',
    cutTwo: ({ friend }) => `Four slices! Give the slices to ${friend}. Drag them one by one.`,
    ate: ({ eaten }) => `${capital(NUMBER_WORDS[eaten])} ${eaten === 1 ? 'slice' : 'slices'}! Yum!`,
    allGone: () => 'Four slices! All gone! Thank you, that was yummy!',
    // What the bubble says at each step.
    show: {
      dough: () => '👐 Rub the dough to roll it out!',
      trace: ({ number }) => `Write ${number} with sauce 🥄`,
      sauce: () => '👆 Spread the sauce all over!',
      cheese: () => '🧀 Now the cheese! Spread it all over',
      topping: () => 'Pick a topping!',
      place: ({ number }) => `Put ${number} on the pizza`,
      oven: () => '🔥 Drag the pizza into the oven!',
      baking: () => '🔥 Baking…',
      slice: ({ cuts }) => `🔪 Swipe across to cut (${cuts}/2)`,
      feed: ({ eaten }) => `Feed me the slices! (${eaten}/4)`,
      done: () => '😋 Yum! Thank you!',
    },
    // Said when the idle arrow appears.
    idle: {
      dough: () => 'Rub the dough with your finger to roll it out!',
      trace: ({ word }) => `Write the ${word} with your finger. Follow the dots.`,
      sauce: () => 'Rub your finger all over the pizza to spread the sauce.',
      cheese: () => 'Rub your finger all over the pizza to sprinkle the cheese.',
      topping: () => 'Tap a topping you like.',
      place: ({ topping }) => `Drag ${an(topping.one)} from the tray onto the pizza.`,
      placed: ({ number }) => `${number}! Now tap Done.`,
      oven: () => 'Drag the pizza into the oven.',
      slice: () => 'Swipe your finger across the pizza to cut it.',
      feed: ({ friend }) => `Drag a slice to ${friend}.`,
    },
  },
  // Birthday Cake.
  cake: {
    intro: ({ friend, word }) => `It's ${friend}'s birthday! ${friend} is ${word} today. Write ${word} on the cake with icing.`,
    iced: ({ number, word }) => `Beautiful! Now put ${word} ${number === 1 ? 'candle' : 'candles'} on the cake. Drag them from the tray.`,
    right: ({ number }) => `${number} ${number === 1 ? 'candle' : 'candles'}! Now blow them out. Tap each candle!`,
    tooFewShow: ({ friend, number, placed }) => `${friend} is ${number}. We have ${placed}. Add more!`,
    tooFew: ({ friend, number, placed }) => `${friend} is ${number}. We have ${placed} ${placed === 1 ? 'candle' : 'candles'}. Add ${number - placed} more!`,
    tooManyShow: ({ friend, number }) => `Too many! ${friend} is ${number}. Take one off.`,
    tooMany: ({ friend, number, placed }) => `Too many! ${friend} is ${number}. Take ${placed - number} off.`,
    party: ({ friend }) => `Zero! Happy birthday, ${friend}!`,
    show: {
      icing: ({ friend, number }) => `${friend} is ${number}! Write ${number} in icing`,
      candles: ({ number }) => `Put ${number} 🕯️ on the cake`,
      blow: ({ lit }) => `Blow out the candles! ${lit} left`,
      party: ({ friend }) => `🎉 Happy birthday, ${friend}!`,
    },
  },
  count: {
    prompt: () => 'How many?',
    speech: ({ object }) => `How many ${object.many}?`,
    explain: ({ object, count }) => `Count them one by one: ${upTo(count)}. There ${count === 1 ? 'is' : 'are'} ${count} ${noun(object, count)}!`,
  },
  shape: {
    prompt: ({ shape }) => `Find the ${shape.name}`,
    speech: ({ shape }) => `Tap the ${shape.name}.`,
    explain: ({ shape }) => `This is a ${shape.name}.`,
  },
  more: {
    prompt: () => 'Which has more?',
    speech: ({ object }) => `Which group has more ${object.many}?`,
    explain: ({ object, more, less }) => `${more} ${noun(object, more)} is more than ${less} ${noun(object, less)}.`,
  },
  sequence: {
    prompt: () => 'What comes next?',
    speech: ({ numbers }) => `${numbers.join(', ')}. What comes next?`,
    explain: ({ direction, step, last, answer }) =>
      `The numbers go ${direction} by ${step} each time. ${last} ${direction === 'up' ? 'plus' : 'minus'} ${step} is ${answer}!`,
  },
  bigger: {
    prompt: () => 'Which number is bigger?',
    speech: ({ a, b }) => `Which number is bigger, ${a} or ${b}?`,
    explain: ({ bigger, smaller }) => `${bigger} is bigger than ${smaller}.`,
  },
  add: {
    speech: ({ a, b }) => `What is ${a} plus ${b}?`,
    explain: ({ a, b, sum }) => `Start at ${a} and count on ${b} more: that makes ${sum}.`,
  },
  subtract: {
    speech: ({ a, b }) => `What is ${a} minus ${b}?`,
    explain: ({ a, b, left }) => `Start with ${a} and take away ${b}: ${left} ${left === 1 ? 'is' : 'are'} left.`,
  },
  multiply: {
    speech: ({ a, b }) => `What is ${a} times ${b}?`,
    explain: ({ a, b, product }) => `${a} groups of ${b} make ${product}.`,
  },
  divide: {
    speech: ({ total, divisor }) => `What is ${total} divided by ${divisor}?`,
    explain: ({ total, divisor, quotient }) => `Share ${total} into ${divisor} equal groups: ${quotient} in each, because ${divisor} × ${quotient} = ${total}.`,
  },
  quickLook: {
    prompt: () => 'Quick look!',
    speechSmall: () => 'Look! How many dots?',
    speech: () => 'Quick! How many dots did you see?',
    explain: ({ count }) => `There ${count === 1 ? 'was' : 'were'} ${count} ${count === 1 ? 'dot' : 'dots'}.`,
  },
  numberLine: {
    prompt: ({ target }) => `Where does ${target} go?`,
    speech: ({ target }) => `Tap where ${target} goes on the line.`,
    explain: ({ target, max }) => `${target} goes here: the line runs from 0 to ${max}.`,
  },
};
