// Kitchen Cove in English: the names of ingredients, tools, places and
// dishes, how an amount is said ("half a cup", "150 grams"), and the lines
// the cook hears. The recipes' numbers are in logic/recipes/.
// Spoken lines are short sentences, so recordings are reused: an
// ingredient's name and its amount are two sentences ("Oats. 2 cups.").

// Ingredients by key (logic/recipes/*.js). `one` / `many` are the word for 1
// and for more; `the` is how a step names it.
export const INGREDIENTS = {
  banana: { one: 'banana', many: 'bananas' },
  strawberries: { one: 'strawberry', many: 'strawberries' },
  milk: { one: 'milk', many: 'milk' },
  yogurt: { one: 'yogurt', many: 'yogurt' },
  honey: { one: 'honey', many: 'honey' },
  egg: { one: 'egg', many: 'eggs' },
  oats: { one: 'oats', many: 'oats' },
  coconutOil: { one: 'coconut oil', many: 'coconut oil' },
  bakingPowder: { one: 'baking powder', many: 'baking powder' },
  spinach: { one: 'spinach', many: 'spinach' },
  cheese: { one: 'cheese', many: 'cheese' },
  oliveOil: { one: 'olive oil', many: 'olive oil' },
  cherryTomato: { one: 'cherry tomato', many: 'cherry tomatoes' },
  turkey: { one: 'ground turkey', many: 'ground turkey' },
  onion: { one: 'onion', many: 'onions' },
  carrot: { one: 'carrot', many: 'carrots' },
  garlic: { one: 'garlic clove', many: 'garlic cloves' },
  chicken: { one: 'chicken breast', many: 'chicken breast' },
  ketchup: { one: 'ketchup', many: 'ketchup' },
  cornflour: { one: 'cornflour', many: 'cornflour' },
  soySauce: { one: 'soy sauce', many: 'soy sauce' },
  oil: { one: 'oil', many: 'oil' },
  // Only on the printable card (a recipe's `cardOnly`).
  water: { one: 'cold water', many: 'cold water' },
  parsley: { one: 'chopped parsley', many: 'chopped parsley' },
  cumin: { one: 'ground cumin', many: 'ground cumin' },
  paprika: { one: 'sweet paprika', many: 'sweet paprika' },
  salt: { one: 'salt', many: 'salt' },
  pepper: { one: 'black pepper', many: 'black pepper' },
  bakingSoda: { one: 'baking soda', many: 'baking soda' },
};

// The dish each recipe makes (said in "Let's make ...").
export const DISHES = {
  smoothie: 'a strawberry banana smoothie',
  muffins: 'banana oat muffins',
  omelette: 'a spinach omelette',
  burgers: 'turkey burgers',
  hotdogs: 'chicken hot dogs',
};

// Measuring tools (logic/kitchen.js TOOLS): `label` on the tool, `a` when said.
export const TOOLS = {
  cup: { label: '🥛 1 cup', a: 'the cup' },
  halfCup: { label: '🥛 ½ cup', a: 'the half cup' },
  quarterCup: { label: '🥛 ¼ cup', a: 'the quarter cup' },
  tbsp: { label: '🥄 tbsp', a: 'the tablespoon' },
  tsp: { label: '🥄 tsp', a: 'the teaspoon' },
  halfTsp: { label: '🥄 ½ tsp', a: 'the half teaspoon' },
  jug: { label: '🫙 ml', a: 'the jug' },
  scale: { label: '⚖️ g', a: 'the scale' },
};

const FRACTION_SIGNS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
// A number with a half or quarter, written short: 1.5 -> "1½".
export function fraction(qty) {
  const whole = Math.floor(qty);
  const part = FRACTION_SIGNS[qty - whole] || '';
  return whole ? `${whole}${part}` : part || '0';
}
const UNIT_SHORT = { cup: ['cup', 'cups'], tbsp: ['tbsp', 'tbsp'], tsp: ['tsp', 'tsp'], ml: ['ml', 'ml'], g: ['g', 'g'] };

// An amount on the recipe card: "2 cups", "½ cup", "150 g", "×2".
export function shortAmount({ qty, unit }) {
  if (unit === 'whole') return `× ${qty}`;
  const [one, many] = UNIT_SHORT[unit];
  return `${fraction(qty)} ${qty > 1 ? many : one}`;
}

const UNIT_WORDS = { cup: ['cup', 'cups'], tbsp: ['tablespoon', 'tablespoons'], tsp: ['teaspoon', 'teaspoons'], ml: ['milliliters', 'milliliters'], g: ['grams', 'grams'] };
// An amount said aloud: "Half a cup." "2 cups." "150 grams." "2 eggs."
export function amount({ qty, unit }, ingredient) {
  if (unit === 'whole') return `${qty} ${qty === 1 ? ingredient.one : ingredient.many}.`;
  const [one, many] = UNIT_WORDS[unit];
  const whole = Math.floor(qty);
  const part = qty - whole;
  if (!whole && part === 0.5) return `Half a ${one}.`;
  if (!whole && part === 0.25) return `A quarter ${one}.`;
  if (!whole && part === 0.75) return `Three quarters of a ${one}.`;
  if (part === 0.5) return `${whole} and a half ${many}.`;
  return `${qty} ${qty === 1 ? one : many}.`;
}

const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
// "Oats." "Cherry tomatoes."
// A line on the recipe card: "2 cups oats", "2 eggs".
export function cardLine({ qty, unit }, ingredient) {
  if (unit === 'whole') return `${qty} ${qty === 1 ? ingredient.one : ingredient.many}`;
  return `${shortAmount({ qty, unit })} ${ingredient.many}`;
}

export const name = (ingredient) => `${capital(ingredient.many)}.`;

// The step lines, by prep action (logic/kitchen.js PREP_KINDS). `on` is what
// the action is done to: an ingredient's key, or bowl / tin / burger / sausage.
const ACTIONS = {
  peel: () => 'Peel the banana. Tap it.',
  mash: () => 'Mash the bananas. Rub them with your finger.',
  crack: ({ times }) => (times === 1 ? 'Crack the egg into the bowl. Tap it.' : `Crack ${times} eggs into the bowl. Tap each one.`),
  stir: () => 'Stir it all together. Rub round and round.',
  whisk: () => 'Whisk the egg. Rub round and round.',
  grate: () => 'Grate the carrot. Rub it up and down.',
  blend: () => 'Blend it smooth. Rub round and round.',
  fill: ({ times }) => `Fill the ${times} muffin cups. One scoop in each.`,
  cut: ({ on, times }) => (on === 'cherryTomato' ? `Cut ${times} cherry tomatoes in half. Tap each one.` : 'Cut the onion. Tap it.'),
  wilt: () => 'Wilt the spinach in a hot pot. Tap the pot.',
  shape: ({ on, times }) => (on === 'burger' ? `Shape ${times} burgers. Tap the bowl ${times} times.` : `Roll ${times} sausages. Tap the bowl ${times} times.`),
};

const APPLIANCE_LINES = {
  blender: 'Into the blender! Hold the button.',
  oven: 'A grown-up puts it in the oven.',
  stove: 'A grown-up puts the pan on the stove.',
  pot: 'A grown-up puts them in a pot of hot water.',
};

const CLEANUP_LINES = {
  putAway: 'While it cooks, let’s clean up! Put everything back. Cold things go in the fridge. The rest goes in the cupboard.',
  dishes: 'While it cooks, let’s clean up! Put the dishes in the sink.',
  wipe: 'While it cooks, let’s clean up! Wipe the counter. Rub until it shines.',
};

export const say = {
  kitchen: {
    intro: ({ dish }) => `Let’s make ${dish}! Here is the recipe.`,
    wash: () => 'First, wash your hands! Rub them under the tap.',
    washed: () => 'Clean hands!',
    gather: () => 'Now take everything on the recipe from the fridge and the cupboard. Tap the doors to open them.',
    notInRecipe: () => 'That’s not in our recipe. It goes back.',
    enough: () => 'We have enough of those.',
    gathered: () => 'We have everything!',
    measure: () => 'Now let’s measure.',
    pickTool: () => 'Which tool do we need?',
    wrongTool: ({ tool }) => `Not ${tool}. Try another one.`,
    tooMuch: () => 'Too much! Tap the arrow to take one back.',
    notEnough: () => 'Not enough yet. Add more.',
    measured: () => 'Perfect!',
    prep: ACTIONS,
    grownUp: () => 'Ask a grown-up to help with this.',
    cook: ({ appliance }) => APPLIANCE_LINES[appliance],
    setTimer: ({ minutes }) => `Set the timer to ${minutes} minutes.`,
    timerWrong: ({ minutes }) => `The recipe says ${minutes} minutes.`,
    blending: () => 'Keep holding!',
    cleanup: ({ job }) => CLEANUP_LINES[job],
    wrongPlace: () => 'Not there. Where do we keep it?',
    cleaned: () => 'All clean!',
    ding: () => 'Ding! It’s ready!',
    decorate: ({ count, item }) => `Now decorate it. Put on ${count} ${count === 1 ? item.one : item.many}.`,
    stack: () => 'Build it in order. Bottom bun first!',
    wrongLayer: () => 'Not that one yet. What comes next?',
    served: () => 'It looks delicious! Thank you, chef!',
  },
};

// What the decoration is called (by emoji) in "Put on 2 strawberries.".
export const DECORATIONS = {
  '🍓': { one: 'strawberry', many: 'strawberries' },
  '🍅': { one: 'tomato half', many: 'tomato halves' },
  '🌭': { one: 'sausage', many: 'sausages' },
};
