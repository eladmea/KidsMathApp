// Vegetable omelette (חביתת ירק), 4 servings.
// Source: Gila Cooking, "חביתת ירק בטיגון עם גזר, קישוא ופטרוזיליה". Checked
// against the page on 2026-11-16: 4 large eggs, 1 small onion (chopped), 1
// medium carrot (grated), 1 small zucchini (grated, squeezed), ¼ cup chopped
// parsley, ¼ cup dill (optional), 2 tbsp whole-wheat flour, 1 tsp baking
// powder, salt and pepper, 2 tbsp canola oil. Fried 4-5 minutes, turned, then
// 3-4 minutes more. Served with bread and a fresh salad.
export default {
  id: 'omelette',
  emoji: '🍳',
  order: 3,
  serves: 4,
  source: { url: 'https://gilacooking.co.il/vegetable-omelette-recipe/', site: 'Gila Cooking' },
  verified: { date: '2026-11-16', by: 'Claude, from the source page', checkedUrl: 'https://gilacooking.co.il/vegetable-omelette-recipe/' },
  ingredients: [
    { key: 'egg', emoji: '🥚', qty: 4, unit: 'whole', kept: 'fridge' },
    { key: 'onion', emoji: '🧅', qty: 1, unit: 'whole', kept: 'cupboard' },
    { key: 'carrot', emoji: '🥕', qty: 1, unit: 'whole', kept: 'fridge' },
    { key: 'zucchini', emoji: '🥒', qty: 1, unit: 'whole', kept: 'fridge' },
    { key: 'parsley', emoji: '🌿', qty: 0.25, unit: 'cup', kept: 'fridge' },
    { key: 'wholeFlour', emoji: '🍞', qty: 2, unit: 'tbsp', kept: 'cupboard' },
    { key: 'bakingPowder', emoji: '🧂', qty: 1, unit: 'tsp', kept: 'cupboard' },
    { key: 'oil', emoji: '🫗', qty: 2, unit: 'tbsp', kept: 'cupboard' },
  ],
  prep: [
    { action: 'crack', on: 'egg', times: 4 },
    { action: 'whisk', on: 'bowl' },
    { action: 'cut', on: 'onion', times: 1 },
    { action: 'grate', on: 'carrot' },
    { action: 'grate', on: 'zucchini' },
    { action: 'stir', on: 'bowl' },
  ],
  // The first side: 4-5 minutes (then turned for 3-4 more).
  cook: { appliance: 'stove', minutes: 5, picture: 'kitchen/cooking/omelette' },
  // Served with a fresh salad, as the page suggests.
  serve: { kind: 'decorate', dish: '🍳', plates: 4, item: '🥗', count: 4, dishPicture: 'kitchen/serve/omelette', itemPicture: 'kitchen/serve/salad' },
  cardOnly: [
    { key: 'dill', qty: 0.25, unit: 'cup', optional: true },
    { key: 'salt', toTaste: true },
    { key: 'pepper', toTaste: true },
  ],
};
