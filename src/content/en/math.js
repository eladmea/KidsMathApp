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

const noun = (object, count) => (count === 1 ? object.one : object.many);
const upTo = (count) => Array.from({ length: count }, (_, i) => i + 1).join(', ');

export const say = {
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
