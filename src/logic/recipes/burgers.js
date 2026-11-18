// Turkey oat burgers: the source's turkey and oat meatball mixture, shaped
// into 5 burgers instead of 20 meatballs (our change).
// Source: Sweet Scent, "קציצות הודו עם שיבולת שועל" (6 servings). Checked
// against the page on 2026-11-16. The game uses the main ingredients; the
// seasonings are in `cardOnly` (for the printable card). The page fries the
// onion first in 1 tbsp of the oil, rests the mixture 25-30 minutes in the
// fridge, then bakes at 190 °C for 20-22 minutes (turning after 12), or
// fries 3-4 minutes a side. The game fries them: the patties go in the pan
// (not the oven, and without the bun), 4 minutes a side. The olive oil is "25 ml (2 tablespoons)" there;
// the game measures the 25 ml.
export default {
  id: 'burgers',
  emoji: '🍔',
  order: 4,
  serves: 6,
  source: { url: 'https://sweetscent.co.il/turkey-meatballs-with-oats-recipe-2/', site: 'Sweet Scent' },
  verified: { date: '2026-11-16', by: 'Claude, from the source page', checkedUrl: 'https://sweetscent.co.il/turkey-meatballs-with-oats-recipe-2/' },
  ingredients: [
    // Two 250 g packs of ground turkey breast.
    { key: 'turkey', emoji: '🥩', qty: 500, unit: 'g', piece: 250, kept: 'fridge' },
    // Fine oats, 25 g a scoop.
    { key: 'oats', emoji: '🌾', qty: 100, unit: 'g', piece: 25, kept: 'cupboard', alt: { qty: 1, unit: 'cup' } },
    { key: 'onion', emoji: '🧅', qty: 1, unit: 'whole', kept: 'cupboard', alt: { qty: 120, unit: 'g' } },
    { key: 'carrot', emoji: '🥕', qty: 1, unit: 'whole', kept: 'fridge', alt: { qty: 80, unit: 'g' } },
    { key: 'garlic', emoji: '🧄', qty: 2, unit: 'whole', kept: 'cupboard' },
    { key: 'egg', emoji: '🥚', qty: 1, unit: 'whole', kept: 'fridge' },
    // 25 ml: 5 teaspoons (or a tablespoon and 2 teaspoons).
    { key: 'oliveOil', emoji: '🫒', qty: 25, unit: 'ml', kept: 'cupboard', alt: { qty: 2, unit: 'tbsp' } },
  ],
  prep: [
    { action: 'cut', on: 'onion', times: 1 },
    { action: 'grate', on: 'carrot' },
    { action: 'crack', on: 'egg', times: 1 },
    { action: 'stir', on: 'bowl' },
    { action: 'shape', on: 'burger', times: 5 },
  ],
  // `dish`: what shows in the pan, and what shaping makes (the patties; the
  // buns come at serving).
  cook: { appliance: 'stove', minutes: 4, dish: '🥩' },
  // On the source's list, not played in the game. Water is "as needed";
  // baking soda is optional there; frying oil has no amount.
  cardOnly: [
    { key: 'water', qty: 3, unit: 'tbsp', asNeeded: true },
    { key: 'parsley', qty: 20, unit: 'g' },
    { key: 'cumin', qty: 1, unit: 'tsp' },
    { key: 'paprika', qty: 1, unit: 'tsp' },
    { key: 'salt', qty: 0.5, unit: 'tsp' },
    { key: 'pepper', qty: 0.25, unit: 'tsp' },
    { key: 'bakingSoda', qty: 0.5, unit: 'tsp', optional: true },
  ],
  serve: { kind: 'stack', dish: '🍔', layers: ['🍞', '🥬', '🥩', '🍅', '🍞'] },
};
