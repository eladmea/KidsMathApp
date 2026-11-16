// Turkey oat burgers: the source's turkey and oat meatball mixture, shaped
// into 5 burgers instead of 20 meatballs (our change).
// Source: Sweet Scent, "קציצות הודו עם שיבולת שועל". Amounts from a search
// summary: NOT yet checked against the page. The cooking time for burgers is
// the game's (10 minutes), to check.
export default {
  id: 'burgers',
  emoji: '🍔',
  order: 4,
  source: { url: 'https://sweetscent.co.il/turkey-meatballs-with-oats-recipe-2/', site: 'Sweet Scent' },
  verified: null,
  ingredients: [
    // Two 250 g packs of ground turkey breast.
    { key: 'turkey', emoji: '🥩', qty: 500, unit: 'g', piece: 250, kept: 'fridge' },
    // Fine oats, 25 g a scoop.
    { key: 'oats', emoji: '🌾', qty: 100, unit: 'g', piece: 25, kept: 'cupboard' },
    { key: 'onion', emoji: '🧅', qty: 1, unit: 'whole', kept: 'cupboard' },
    { key: 'carrot', emoji: '🥕', qty: 1, unit: 'whole', kept: 'fridge' },
    { key: 'garlic', emoji: '🧄', qty: 2, unit: 'whole', kept: 'cupboard' },
    { key: 'egg', emoji: '🥚', qty: 1, unit: 'whole', kept: 'fridge' },
    // 25 ml: 5 teaspoons (or a tablespoon and 2 teaspoons).
    { key: 'oliveOil', emoji: '🫒', qty: 25, unit: 'ml', kept: 'cupboard' },
  ],
  prep: [
    { action: 'cut', on: 'onion', times: 1 },
    { action: 'grate', on: 'carrot' },
    { action: 'crack', on: 'egg', times: 1 },
    { action: 'stir', on: 'bowl' },
    { action: 'shape', on: 'burger', times: 5 },
  ],
  cook: { appliance: 'stove', minutes: 10 },
  serve: { kind: 'stack', dish: '🍔', layers: ['🍞', '🥬', '🥩', '🍅', '🍞'] },
};
