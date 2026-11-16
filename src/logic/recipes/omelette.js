// Baked spinach omelette, 1 serving.
// Source: mako, "אתגר האוכל הבריא: יום 2" (a one-serving version of
// "חביתת תרד ועגבניות אפויה"). Amounts from a search summary: NOT yet checked
// against the page. 20 minutes is from the summary; the oven temperature
// wasn't in it.
export default {
  id: 'omelette',
  emoji: '🍳',
  order: 3,
  source: { url: 'https://www.mako.co.il/food-cooking_magazine/Article-f24855d922ba151006.htm', site: 'mako' },
  verified: null,
  ingredients: [
    // A handful is about 50 g.
    { key: 'spinach', emoji: '🥬', qty: 200, unit: 'g', piece: 50, kept: 'fridge' },
    { key: 'egg', emoji: '🥚', qty: 1, unit: 'whole', kept: 'fridge' },
    // Bulgarian cheese 5%, in 5 g crumbs.
    { key: 'cheese', emoji: '🧀', qty: 25, unit: 'g', piece: 5, kept: 'fridge' },
    { key: 'oliveOil', emoji: '🫒', qty: 0.5, unit: 'tsp', kept: 'cupboard' },
    { key: 'cherryTomato', emoji: '🍅', qty: 5, unit: 'whole', kept: 'fridge' },
  ],
  prep: [
    { action: 'wilt', on: 'spinach', times: 1 },
    { action: 'crack', on: 'egg', times: 1 },
    { action: 'whisk', on: 'bowl' },
    // 5 tomatoes, each cut in half: 10 halves.
    { action: 'cut', on: 'cherryTomato', times: 5 },
  ],
  cook: { appliance: 'oven', minutes: 20 },
  serve: { kind: 'decorate', dish: '🍳', plates: 1, item: '🍅', count: 10 },
};
