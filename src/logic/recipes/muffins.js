// Banana yogurt oat muffins, 12, with no flour.
// Source: אוכל זה החיים, "מאפינס בננה יוגורט שיבולת שועל ללא קמח". Amounts
// from a search summary of the page: NOT yet checked against the page.
// The page also uses vanilla, cinnamon and salt, amounts not seen, so the
// game leaves them out until it is checked. Bake time not seen either: the
// 20 minutes on the timer is the game's, to check.
export default {
  id: 'muffins',
  emoji: '🧁',
  order: 2,
  source: { url: 'https://foodislife.co.il/recipes/banana-and-oatmeal-muffins', site: 'אוכל זה החיים' },
  verified: null,
  ingredients: [
    { key: 'banana', emoji: '🍌', qty: 2, unit: 'whole', kept: 'cupboard' },
    { key: 'yogurt', emoji: '🥣', qty: 1, unit: 'cup', kept: 'fridge' },
    { key: 'honey', emoji: '🍯', qty: 0.5, unit: 'cup', kept: 'cupboard' },
    { key: 'egg', emoji: '🥚', qty: 2, unit: 'whole', kept: 'fridge' },
    { key: 'oats', emoji: '🌾', qty: 2, unit: 'cup', kept: 'cupboard' },
    { key: 'coconutOil', emoji: '🥥', qty: 0.5, unit: 'cup', kept: 'cupboard' },
    { key: 'bakingPowder', emoji: '🧂', qty: 1, unit: 'tbsp', kept: 'cupboard' },
  ],
  prep: [
    { action: 'mash', on: 'banana' },
    { action: 'crack', on: 'egg', times: 2 },
    { action: 'stir', on: 'bowl' },
    { action: 'fill', on: 'tin', times: 12 },
  ],
  cook: { appliance: 'oven', celsius: 180, minutes: 20 },
  serve: { kind: 'decorate', dish: '🧁', plates: 6, item: '🍓', count: 6 },
};
