// Kitchen Island: the rules of cooking a recipe, free of Phaser (unit-tested
// in tests/kitchen.test.js). The recipes themselves are data files in
// logic/recipes/, found by folder: a new file is a new recipe.
//
// Measures are metric, Israeli style: 1 cup = 240 ml, 1 tablespoon = 15 ml,
// 1 teaspoon = 5 ml. An ingredient's amount is { qty, unit } with unit one of
//   'whole'  counted things (2 eggs): taken from the fridge one by one
//   'cup' | 'tbsp' | 'tsp' | 'ml'   volumes, measured with cups, spoons or the jug
//   'g'      weights, put on the scale `piece` grams at a time
// Fractions are halves and quarters only, so they stay exact numbers.

export const CUP_ML = 240;
export const TBSP_ML = 15;
export const TSP_ML = 5;

// The measuring tools on the counter. `ml` is what one scoop holds; the jug
// pours `step` ml a tap (worked out per amount) and the scale weighs pieces.
export const TOOLS = {
  cup: { id: 'cup', family: 'cup', ml: CUP_ML },
  halfCup: { id: 'halfCup', family: 'cup', ml: CUP_ML / 2 },
  quarterCup: { id: 'quarterCup', family: 'cup', ml: CUP_ML / 4 },
  tbsp: { id: 'tbsp', family: 'spoon', ml: TBSP_ML },
  tsp: { id: 'tsp', family: 'spoon', ml: TSP_ML },
  halfTsp: { id: 'halfTsp', family: 'spoon', ml: TSP_ML / 2 },
  jug: { id: 'jug', family: 'jug' },
  scale: { id: 'scale', family: 'scale' },
};

// Where things are kept, and the places a station happens.
export const PLACES = ['fridge', 'cupboard'];
export const CLEANUP_JOBS = ['putAway', 'dishes', 'wipe'];
// Smaller amounts of liquid than this are measured with spoons, not the jug.
export const JUG_FROM_ML = 50;

// The age bands' kitchen levels: which tools are out, and how much help the
// child gets.
//   pickTool   the child chooses the tool (younger children get the right one)
//   check      the child taps ✓ when they think it is enough (younger
//              children's measuring stops by itself at the right amount)
//   mark       the jug and the scale show where to stop
export const LEVELS = {
  sprouts: { id: 'sprouts', tools: ['cup', 'halfCup', 'quarterCup', 'tbsp', 'tsp', 'halfTsp', 'jug', 'scale'], pickTool: false, check: false, mark: true },
  explorers: { id: 'explorers', tools: ['cup', 'halfCup', 'tbsp', 'tsp', 'halfTsp', 'jug', 'scale'], pickTool: true, check: true, mark: true },
  builders: { id: 'builders', tools: ['cup', 'halfCup', 'quarterCup', 'tbsp', 'tsp', 'halfTsp', 'jug', 'scale'], pickTool: true, check: true, mark: false },
  // Only the quarter cup: 2 cups is 8 scoops.
  masters: { id: 'masters', tools: ['quarterCup', 'tbsp', 'tsp', 'halfTsp', 'jug', 'scale'], pickTool: true, check: true, mark: false },
};

export function kitchenLevel(bandId) {
  return LEVELS[bandId] || LEVELS.sprouts;
}

// ---- amounts ----
export const isMeasured = (ingredient) => ingredient.unit !== 'whole';

// A volume in ml (null for whole things and weights).
export function toMl({ qty, unit }) {
  switch (unit) {
    case 'cup':
      return qty * CUP_ML;
    case 'tbsp':
      return qty * TBSP_ML;
    case 'tsp':
      return qty * TSP_ML;
    case 'ml':
      return qty;
    default:
      return null;
  }
}

// What the jug, the scale or a scoop adds up to: ml for volumes, g for weights.
export const target = (ingredient) => (ingredient.unit === 'g' ? ingredient.qty : toMl(ingredient));

// The tool family that measures an ingredient.
export function familyOf(ingredient) {
  if (ingredient.unit === 'g') return 'scale';
  if (ingredient.unit === 'cup') return 'cup';
  if (ingredient.unit === 'ml') return ingredient.qty >= JUG_FROM_ML ? 'jug' : 'spoon';
  if (ingredient.unit === 'tbsp' || ingredient.unit === 'tsp') return 'spoon';
  return null;
}

// How much the jug pours a tap: the biggest round step that reaches the
// amount exactly in at most 10 taps (250 ml -> 50 ml x 5).
export function jugStep(ml) {
  const fits = [100, 50, 25, 10, 5].filter((step) => ml % step === 0);
  return fits.find((step) => ml / step <= 10) || fits[fits.length - 1] || 1;
}

// How much one tap of `toolId` adds for this ingredient (ml or g), or null
// if that tool doesn't measure it.
export function toolAmount(ingredient, toolId) {
  const tool = TOOLS[toolId];
  if (!tool || tool.family !== familyOf(ingredient)) return null;
  if (tool.family === 'jug') return jugStep(target(ingredient));
  if (tool.family === 'scale') return ingredient.piece || ingredient.qty;
  return tool.ml;
}

// The tools of a level that can measure an ingredient exactly.
export function toolsFor(ingredient, level) {
  return level.tools.filter((toolId) => {
    const amount = toolAmount(ingredient, toolId);
    return amount !== null && Number.isInteger(Math.round((target(ingredient) / amount) * 1e6) / 1e6);
  });
}

// The tool a younger child is handed: the one that takes the fewest scoops.
export function bestTool(ingredient, level) {
  const tools = toolsFor(ingredient, level);
  return tools.reduce((best, toolId) => (best === null || toolAmount(ingredient, toolId) > toolAmount(ingredient, best) ? toolId : best), null);
}

export const scoopsFor = (ingredient, toolId) => Math.round(target(ingredient) / toolAmount(ingredient, toolId));

// A measure in progress: the scoops so far (tool ids). `add` refuses a tool
// that doesn't measure this ingredient (a cup for 25 g of cheese).
export function startMeasure(ingredient) {
  return { ingredient, scoops: [] };
}

export function measured(measure) {
  return measure.scoops.reduce((sum, toolId) => sum + toolAmount(measure.ingredient, toolId), 0);
}

// -> 'wrongTool' | 'added' | 'enough' | 'tooMuch'
export function addScoop(measure, toolId) {
  if (toolAmount(measure.ingredient, toolId) === null) return 'wrongTool';
  measure.scoops.push(toolId);
  return measureStatus(measure) === 'right' ? 'enough' : measureStatus(measure) === 'over' ? 'tooMuch' : 'added';
}

export function undoScoop(measure) {
  measure.scoops.pop();
}

// -> 'under' | 'right' | 'over'
export function measureStatus(measure) {
  const sum = Math.round(measured(measure) * 1000);
  const goal = Math.round(target(measure.ingredient) * 1000);
  return sum === goal ? 'right' : sum < goal ? 'under' : 'over';
}

// ---- gathering ----
// What goes on the counter: one of each measured ingredient (its carton or
// bag) and `qty` of each counted one.
export function shoppingList(recipe) {
  return recipe.ingredients.map((ingredient) => ({ key: ingredient.key, count: isMeasured(ingredient) ? 1 : ingredient.qty }));
}

// -> 'take' (needed, and there is room for more) | 'enough' (we have all of
// it already) | 'notInRecipe'
export function gatherCheck(recipe, counter, key) {
  const wanted = shoppingList(recipe).find((item) => item.key === key);
  if (!wanted) return 'notInRecipe';
  return (counter[key] || 0) < wanted.count ? 'take' : 'enough';
}

export function gatherDone(recipe, counter) {
  return shoppingList(recipe).every(({ key, count }) => (counter[key] || 0) === count);
}

// The fridge and cupboard hold the recipe's ingredients and some from the
// other recipes (never a "bad" food: just things this recipe doesn't use).
// Counted things have a few spare, so taking the right number matters.
export function pantryStock(recipe, others, { extras = 4, spare = 2, random = Math.random } = {}) {
  const own = recipe.ingredients.map((ingredient) => ({ ...ingredient, stock: isMeasured(ingredient) ? 1 : ingredient.qty + spare }));
  const used = new Set(own.map((item) => item.key));
  const pool = [];
  others.forEach((other) =>
    other.ingredients.forEach((ingredient) => {
      if (!used.has(ingredient.key) && !pool.some((item) => item.key === ingredient.key)) pool.push(ingredient);
    })
  );
  const picked = shuffle(pool, random).slice(0, extras).map((ingredient) => ({ ...ingredient, stock: 1, extra: true }));
  return [...own, ...picked];
}

// ---- the prep, cooking and serving steps ----
// Each prep action is a tap per thing (crack 2 eggs) or a rub until done
// (stir the bowl).
export const PREP_KINDS = {
  peel: 'tap',
  crack: 'tap',
  cut: 'tap',
  shape: 'tap',
  fill: 'tap',
  wilt: 'tap',
  mash: 'rub',
  stir: 'rub',
  whisk: 'rub',
  grate: 'rub',
  blend: 'rub',
};
// Steps a grown-up helps with (hot or sharp).
export const GROWN_UP = new Set(['cut', 'wilt']);
export const APPLIANCES = ['blender', 'oven', 'stove', 'pot'];
// Appliances with a timer (the blender is held instead).
export const TIMED = new Set(['oven', 'stove', 'pot']);

export const prepKind = (action) => PREP_KINDS[action.action];

// Setting the timer: the dial goes up and down in steps of `timerStep`
// minutes, so a younger child counts taps.
export const timerStep = (minutes) => (minutes > 10 && minutes % 5 === 0 ? 5 : 1);

// Serving: 'decorate' puts `count` things on the dish; 'stack' builds it in
// the right order.
export function stackCheck(layers, placed, layer) {
  return layers[placed.length] === layer;
}

// ---- clean-up: one job per round, a different one from last time ----
export function pickCleanup(last, random = Math.random) {
  const choices = CLEANUP_JOBS.filter((job) => job !== last);
  return choices[Math.floor(random() * choices.length)];
}

// Putting away: each leftover goes back where it is kept.
export const keptIn = (ingredient) => ingredient.kept;
// What is left on the counter to put away: the measured ingredients'
// cartons and bags (counted things were used up).
export const leftovers = (recipe) => recipe.ingredients.filter(isMeasured);
// The tools the round used, for the dishes.
export function usedTools(measures) {
  return [...new Set(measures.flatMap((measure) => measure.scoops))];
}

// ---- points: one each for gathering and measuring without a mistake, the
// clean-up job, and serving right ----
export const POINTS_PER_RECIPE = 4;

// ---- checks a recipe file must pass (tests/kitchen.test.js) ----
export function recipeProblems(recipe) {
  const problems = [];
  const keys = new Set();
  recipe.ingredients.forEach((ingredient) => {
    if (keys.has(ingredient.key)) problems.push(`${ingredient.key} twice`);
    keys.add(ingredient.key);
    if (!PLACES.includes(ingredient.kept)) problems.push(`${ingredient.key}: kept in ${ingredient.kept}`);
    if (!['whole', 'cup', 'tbsp', 'tsp', 'ml', 'g'].includes(ingredient.unit)) problems.push(`${ingredient.key}: unit ${ingredient.unit}`);
    if (!Number.isInteger(ingredient.qty * 4)) problems.push(`${ingredient.key}: ${ingredient.qty} is not in quarters`);
    if (ingredient.unit === 'whole' && !Number.isInteger(ingredient.qty)) problems.push(`${ingredient.key}: half a thing`);
    if (ingredient.unit === 'g' && ingredient.piece && ingredient.qty % ingredient.piece) problems.push(`${ingredient.key}: ${ingredient.qty} g in ${ingredient.piece} g pieces`);
    Object.values(LEVELS).forEach((level) => {
      if (isMeasured(ingredient) && !toolsFor(ingredient, level).length) problems.push(`${ingredient.key}: no tool at ${level.id}`);
    });
  });
  recipe.prep.forEach((action) => {
    if (!PREP_KINDS[action.action]) problems.push(`prep ${action.action}`);
    if (prepKind(action) === 'tap' && !(action.times > 0)) problems.push(`prep ${action.action}: how many taps`);
  });
  if (!APPLIANCES.includes(recipe.cook.appliance)) problems.push(`cook ${recipe.cook.appliance}`);
  if (TIMED.has(recipe.cook.appliance) && !(recipe.cook.minutes > 0)) problems.push('cook: no minutes');
  const { serve } = recipe;
  if (serve.kind === 'decorate' && !(serve.count > 0)) problems.push('serve: no count');
  if (serve.kind === 'stack' && !(serve.layers && serve.layers.length > 1)) problems.push('serve: no layers');
  if (!['decorate', 'stack'].includes(serve.kind)) problems.push(`serve ${serve.kind}`);
  if (!recipe.source || !/^https:\/\//.test(recipe.source.url)) problems.push('no source');
  return problems;
}

// A printable card is only for a recipe a person checked against its source.
export const hasVerifiedCard = (recipe) => Boolean(recipe.verified && recipe.verified.date && recipe.verified.by);

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
