// Healthy banana oat muffins for children, 12.
// Source: Gila Cooking, "מאפינס בריאות עם שיבולת שועל ובננות". Checked against
// the page on 2026-11-16: 2 ripe bananas, 2 medium eggs, ⅓ cup (80 ml)
// coconut or canola oil, ¼ cup (60 ml) honey or maple, 1 cup (100 g) fine
// oats, ½ cup (60 g) whole-wheat flour, ½ tsp baking soda, ½ tsp cinnamon, a
// pinch of salt, optional ⅓ cup dark chocolate chips (the game leaves out the
// salt, which has no amount, and the chips). Baked at 180 °C for 18-20 minutes.
// The oil and honey are measured in ml (⅓ cup isn't a cup the game has).
export default {
  id: 'muffins',
  emoji: '🧁',
  order: 2,
  serves: 12,
  source: { url: 'https://gilacooking.co.il/healthy-muffins-for-kids-recipe/', site: 'Gila Cooking' },
  verified: { date: '2026-11-16', by: 'Claude, from the source page', checkedUrl: 'https://gilacooking.co.il/healthy-muffins-for-kids-recipe/' },
  ingredients: [
    { key: 'banana', emoji: '🍌', qty: 2, unit: 'whole', kept: 'cupboard' },
    { key: 'egg', emoji: '🥚', qty: 2, unit: 'whole', kept: 'fridge' },
    { key: 'coconutOil', emoji: '🥥', qty: 80, unit: 'ml', kept: 'cupboard', alt: { qty: 1 / 3, unit: 'cup' } },
    { key: 'honey', emoji: '🍯', qty: 60, unit: 'ml', kept: 'cupboard', alt: { qty: 0.25, unit: 'cup' } },
    { key: 'oats', emoji: '🌾', qty: 1, unit: 'cup', kept: 'cupboard', alt: { qty: 100, unit: 'g' } },
    { key: 'wholeFlour', emoji: '🍞', qty: 0.5, unit: 'cup', kept: 'cupboard', alt: { qty: 60, unit: 'g' } },
    { key: 'bakingSoda', emoji: '🧂', qty: 0.5, unit: 'tsp', kept: 'cupboard' },
    { key: 'cinnamon', emoji: '🪵', qty: 0.5, unit: 'tsp', kept: 'cupboard' },
  ],
  prep: [
    { action: 'mash', on: 'banana' },
    { action: 'crack', on: 'egg', times: 2 },
    { action: 'stir', on: 'bowl' },
    { action: 'fill', on: 'tin', times: 12 },
  ],
  cook: { appliance: 'oven', celsius: 180, minutes: 20 },
  serve: { kind: 'decorate', dish: '🧁', plates: 6, item: '🍌', count: 6 },
  cardOnly: [{ key: 'salt', pinch: true }],
};
