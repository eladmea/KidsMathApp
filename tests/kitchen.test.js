// Kitchen Island's rules (logic/kitchen.js) and every recipe file.
import {
  LEVELS,
  addScoop,
  bestTool,
  dressSpot,
  familyOf,
  gaugeAxis,
  gatherCheck,
  gatherDone,
  hasVerifiedCard,
  jugStep,
  kitchenLevel,
  levelRecipe,
  leftovers,
  measureStatus,
  pantryStock,
  pickCleanup,
  recipeProblems,
  scoopsFor,
  shoppingList,
  startMeasure,
  stackCheck,
  target,
  timerStep,
  toMl,
  toolsFor,
  undoScoop,
  usedTools,
} from '../src/logic/kitchen';
import { RECIPES, getRecipe } from '../src/logic/recipes/index';

const cups = (qty) => ({ key: 'oats', qty, unit: 'cup', kept: 'cupboard' });

describe('kitchen measures', () => {
  it('uses Israeli metric cups and spoons', () => {
    expect(toMl({ qty: 1, unit: 'cup' })).toBe(240);
    expect(toMl({ qty: 0.5, unit: 'cup' })).toBe(120);
    expect(toMl({ qty: 2, unit: 'tbsp' })).toBe(30);
    expect(toMl({ qty: 0.5, unit: 'tsp' })).toBe(2.5);
    expect(toMl({ qty: 250, unit: 'ml' })).toBe(250);
    expect(toMl({ qty: 100, unit: 'g' })).toBe(null);
  });

  it('counts scoops: 2 cups is 2 cups, or 8 quarter cups', () => {
    expect(scoopsFor(cups(2), 'cup')).toBe(2);
    expect(scoopsFor(cups(2), 'quarterCup')).toBe(8);
    expect(scoopsFor(cups(0.5), 'halfCup')).toBe(1);
    // 25 ml of oil is 5 teaspoons; a tablespoon doesn't fit it exactly.
    const oil = { key: 'oliveOil', qty: 25, unit: 'ml' };
    expect(toolsFor(oil, LEVELS.builders)).toEqual(['tsp', 'halfTsp']);
    expect(scoopsFor(oil, 'tsp')).toBe(5);
  });

  it('hands younger children the tool with the fewest scoops', () => {
    expect(bestTool(cups(2), LEVELS.sprouts)).toBe('cup');
    expect(bestTool(cups(0.5), LEVELS.sprouts)).toBe('halfCup');
    expect(bestTool(cups(2), LEVELS.masters)).toBe('quarterCup');
    expect(bestTool({ qty: 250, unit: 'ml' }, LEVELS.sprouts)).toBe('jug');
    expect(bestTool({ qty: 150, unit: 'g', piece: 15 }, LEVELS.sprouts)).toBe('scale');
  });

  it('numbers the jug and the scale so the amount is easy to read', () => {
    expect(gaugeAxis(250)).toEqual({ max: 350, label: 50, minor: 25 });
    expect(gaugeAxis(80)).toEqual({ max: 120, label: 20, minor: 10 });
    expect(gaugeAxis(150)).toEqual({ max: 200, label: 25, minor: 5 });
    expect(gaugeAxis(500)).toEqual({ max: 700, label: 100, minor: 50 });
    // Every jug and scale amount in the recipes falls on a mark.
    RECIPES.flatMap((recipe) => recipe.ingredients)
      .filter((ingredient) => ['jug', 'scale'].includes(familyOf(ingredient)))
      .forEach((ingredient) => {
        const axis = gaugeAxis(target(ingredient));
        expect([ingredient.key, target(ingredient) % axis.minor]).toEqual([ingredient.key, 0]);
        expect(axis.max).toBeGreaterThan(target(ingredient));
      });
  });

  it('pours the jug in round steps', () => {
    expect(jugStep(250)).toBe(50);
    expect(jugStep(500)).toBe(100);
    expect(jugStep(30)).toBe(10);
    expect(jugStep(1000)).toBe(100);
    expect(jugStep(75)).toBe(25);
  });

  it('adds scoops up, refuses the wrong tool, and can take one back', () => {
    const m = startMeasure(cups(0.75));
    expect(addScoop(m, 'tsp')).toBe('wrongTool');
    expect(addScoop(m, 'scale')).toBe('wrongTool');
    expect(addScoop(m, 'halfCup')).toBe('added');
    expect(addScoop(m, 'halfCup')).toBe('tooMuch');
    expect(measureStatus(m)).toBe('over');
    undoScoop(m);
    expect(addScoop(m, 'quarterCup')).toBe('enough');
    expect(measureStatus(m)).toBe('right');
    // Mixed spoons: 1 tablespoon and 2 teaspoons is 25 ml.
    const oil = startMeasure({ qty: 25, unit: 'ml' });
    ['tbsp', 'tsp'].forEach((tool) => addScoop(oil, tool));
    expect(addScoop(oil, 'tsp')).toBe('enough');
    expect(usedTools([m, oil])).toEqual(['halfCup', 'quarterCup', 'tbsp', 'tsp']);
  });

  it('weighs in pieces on the scale', () => {
    const strawberries = { key: 'strawberries', qty: 150, unit: 'g', piece: 15 };
    expect(target(strawberries)).toBe(150);
    expect(scoopsFor(strawberries, 'scale')).toBe(10);
    const m = startMeasure(strawberries);
    for (let i = 0; i < 9; i++) expect(addScoop(m, 'scale')).toBe('added');
    expect(addScoop(m, 'scale')).toBe('enough');
  });

  it('gives each age band its level, and older children fewer tools', () => {
    expect(kitchenLevel('sprouts').pickTool).toBe(false);
    expect(kitchenLevel('masters').tools).not.toContain('cup');
    expect(kitchenLevel('nobody')).toBe(LEVELS.sprouts);
  });
});

describe('a party: the oldest children double the recipe', () => {
  it('doubles every amount and keeps the card’s own amount', () => {
    const muffins = levelRecipe(getRecipe('muffins'), LEVELS.masters);
    expect(muffins.factor).toBe(2);
    const oats = muffins.ingredients.find((i) => i.key === 'oats');
    expect([oats.qty, oats.unit, oats.base]).toEqual([2, 'cup', { qty: 1, unit: 'cup' }]);
    expect(muffins.ingredients.find((i) => i.key === 'coconutOil').qty).toBe(160);
    expect(muffins.prep.find((a) => a.action === 'crack').times).toBe(4);
    expect(levelRecipe(getRecipe('smoothie'), LEVELS.masters).prep[0].times).toBe(4);
    // Twice the strawberries, in pieces twice the size: still 10 on the scale.
    const strawberries = levelRecipe(getRecipe('smoothie'), LEVELS.masters).ingredients.find((i) => i.key === 'strawberries');
    expect(scoopsFor(strawberries, 'scale')).toBe(10);
    // 2 cups with only the quarter cup: 8 scoops.
    expect(scoopsFor(oats, bestTool(oats, LEVELS.masters))).toBe(8);
  });

  it('leaves the other levels as the recipe says', () => {
    const smoothie = levelRecipe(getRecipe('smoothie'), LEVELS.builders);
    expect(smoothie.factor).toBe(1);
    expect(smoothie.ingredients).toBe(getRecipe('smoothie').ingredients);
  });

  it('puts every doubled jug and scale amount on a mark', () => {
    RECIPES.map((recipe) => levelRecipe(recipe, LEVELS.masters))
      .flatMap((recipe) => recipe.ingredients)
      .filter((ingredient) => ['jug', 'scale'].includes(familyOf(ingredient)))
      .forEach((ingredient) => expect([ingredient.key, target(ingredient) % gaugeAxis(target(ingredient)).minor]).toEqual([ingredient.key, 0]));
  });
});

describe('gathering and cleaning', () => {
  const smoothie = getRecipe('smoothie');

  it('takes the right things, and the right number of counted ones', () => {
    const counter = {};
    expect(gatherCheck(smoothie, counter, 'egg')).toBe('notInRecipe');
    expect(gatherCheck(smoothie, counter, 'banana')).toBe('take');
    counter.banana = 1;
    expect(gatherCheck(smoothie, counter, 'banana')).toBe('take');
    counter.banana = 2;
    expect(gatherCheck(smoothie, counter, 'banana')).toBe('enough');
    expect(gatherDone(smoothie, counter)).toBe(false);
    shoppingList(smoothie).forEach(({ key, count }) => (counter[key] = count));
    expect(gatherDone(smoothie, counter)).toBe(true);
  });

  it('stocks the fridge and cupboard with spares and other recipes’ things', () => {
    const stock = pantryStock(getRecipe('muffins'), RECIPES, { random: () => 0.3 });
    expect(stock.find((item) => item.key === 'egg').stock).toBe(4);
    expect(stock.filter((item) => item.extra).length).toBe(4);
    expect(new Set(stock.map((item) => item.key)).size).toBe(stock.length);
  });

  it('picks a different clean-up job from last time', () => {
    for (let i = 0; i < 20; i++) expect(pickCleanup('wipe', Math.random)).not.toBe('wipe');
    expect(leftovers(smoothie).map((item) => item.key)).toEqual(['strawberries', 'milk', 'yogurt', 'honey', 'vanilla']);
  });

  it('builds a burger in order', () => {
    const layers = getRecipe('burgers').serve.layers;
    expect(stackCheck(layers, [], layers[0])).toBe(true);
    expect(stackCheck(layers, [layers[0]], layers[2])).toBe(false);
  });

  it('dresses the smoothie: one straw, rim fruit until the rim is full', () => {
    const { choices } = smoothie.serve;
    const placed = [];
    const add = (id) => {
      const spot = dressSpot(choices, placed, id);
      if (spot) placed.push({ id, ...spot });
      return spot;
    };
    expect(add('straw')).toEqual({ place: 'back', spot: 0 });
    expect(add('straw')).toBe(null);
    expect(add('umbrella')).toEqual({ place: 'back', spot: 1 });
    expect(add('cream')).toEqual({ place: 'cap', spot: 0 });
    ['strawberry', 'kiwi', 'strawberry', 'cherry'].forEach((id, i) => expect(add(id)).toEqual({ place: 'rim', spot: i }));
    expect(add('strawberry')).toBe(null);
    expect(add('mint')).toEqual({ place: 'top', spot: 0 });
    // Taking one off frees its spot.
    placed.splice(placed.findIndex((one) => one.id === 'kiwi'), 1);
    expect(add('strawberry')).toEqual({ place: 'rim', spot: 1 });
  });

  it('fries the burger patties in a pan (the bun comes at serving)', () => {
    expect(getRecipe('burgers').cook).toMatchObject({ appliance: 'stove', dish: '🥩' });
    // Hot dogs: the sausages cook without their rolls.
    expect(getRecipe('hotdogs').cook).toMatchObject({ appliance: 'pot', picture: 'kitchen/sausage' });
  });

  it('sets timers in counted steps', () => {
    expect(timerStep(20)).toBe(5);
    expect(timerStep(10)).toBe(1);
  });
});

describe('recipes', () => {
  it('has the five recipes, each with a source', () => {
    expect(RECIPES.map((recipe) => recipe.id)).toEqual(['smoothie', 'muffins', 'omelette', 'burgers', 'hotdogs']);
  });

  it.each(RECIPES.map((recipe) => [recipe.id, recipe]))('%s is a valid recipe at every level', (id, recipe) => {
    expect(recipeProblems(recipe)).toEqual([]);
  });

  it('fits each recipe in the fridge (9 places) and the cupboard (10)', () => {
    RECIPES.forEach((recipe) => {
      expect(recipe.ingredients.filter((i) => i.kept === 'fridge').length).toBeLessThanOrEqual(9);
      expect(recipe.ingredients.filter((i) => i.kept === 'cupboard').length).toBeLessThanOrEqual(10);
    });
  });

  it('keeps every amount the same wherever an ingredient is kept', () => {
    const kept = {};
    RECIPES.forEach((recipe) =>
      recipe.ingredients.forEach(({ key, kept: place, emoji }) => {
        if (kept[key]) expect([key, place, emoji]).toEqual([key, ...kept[key]]);
        kept[key] = [place, emoji];
      })
    );
  });

  it('names every ingredient, including the card-only ones', async () => {
    for (const language of ['en', 'he']) {
      const { INGREDIENTS } = await import(`../src/content/${language}/kitchen.js`);
      RECIPES.forEach((recipe) => [...recipe.ingredients, ...(recipe.cardOnly || [])].forEach(({ key }) => expect([language, key, Boolean(INGREDIENTS[key])]).toEqual([language, key, true])));
    }
  });

  it('has every recipe checked against its source page', () => {
    RECIPES.forEach((recipe) => expect([recipe.id, hasVerifiedCard(recipe)]).toEqual([recipe.id, true]));
  });

  it('shows no printable card until the recipe has been checked', () => {
    RECIPES.forEach((recipe) => expect(hasVerifiedCard(recipe)).toBe(Boolean(recipe.verified)));
    expect(hasVerifiedCard({ verified: { date: '2026-11-20', by: 'a grown-up', checkedUrl: 'https://x' } })).toBe(true);
    expect(hasVerifiedCard({ verified: null })).toBe(false);
  });
});
