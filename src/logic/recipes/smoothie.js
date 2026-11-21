// Strawberry banana smoothie, 4 glasses. No heat, so it is the first recipe.
// Source: Gila Cooking, "תות בננה בבלנדר עם יוגורט, וניל ודבש". Checked
// against the page on 2026-11-16: 2 very ripe medium bananas, 1 cup (150 g)
// strawberries, 1 cup (240 ml) milk, ½ cup (120 g) plain yogurt, 2 tbsp honey
// or silan, ½ tsp vanilla extract; optional 1 tbsp lemon juice, and ¼ cup ice
// with fresh strawberries. Blended about a minute.
export default {
  id: 'smoothie',
  emoji: '🥤',
  order: 1,
  serves: 4,
  source: { url: 'https://gilacooking.co.il/strawberry-banana-smoothie-recipe/', site: 'Gila Cooking' },
  verified: { date: '2026-11-16', by: 'Claude, from the source page', checkedUrl: 'https://gilacooking.co.il/strawberry-banana-smoothie-recipe/' },
  ingredients: [
    { key: 'banana', emoji: '🍌', qty: 2, unit: 'whole', kept: 'cupboard' },
    // 150 g on the scale: about 10 strawberries.
    { key: 'strawberries', emoji: '🍓', qty: 150, unit: 'g', piece: 15, kept: 'fridge', alt: { qty: 1, unit: 'cup' } },
    { key: 'milk', emoji: '🥛', qty: 1, unit: 'cup', kept: 'fridge', alt: { qty: 240, unit: 'ml' } },
    { key: 'yogurt', emoji: '🥣', qty: 0.5, unit: 'cup', kept: 'fridge', alt: { qty: 120, unit: 'g' } },
    { key: 'honey', emoji: '🍯', qty: 2, unit: 'tbsp', kept: 'cupboard' },
    { key: 'vanilla', emoji: '🫙', qty: 0.5, unit: 'tsp', kept: 'cupboard' },
  ],
  prep: [{ action: 'peel', on: 'banana', times: 2 }],
  // What whirls in the blender: the peeled bananas and the strawberries.
  cook: {
    appliance: 'blender',
    color: 0xf28cb0,
    pieces: [
      { key: 'kitchen/food/bananaPeeled', emoji: '🍌', count: 2, size: 70 },
      { key: 'kitchen/serve/strawberry', emoji: '🍓', count: 5, size: 42 },
    ],
  },
  // One big glass, dressed the way the child likes it.
  serve: {
    kind: 'dress',
    dish: '🥤',
    dishPicture: 'kitchen/serve/smoothieCup',
    choices: [
      { id: 'straw', emoji: '🥤', place: 'back', picture: 'kitchen/deco/straw' },
      { id: 'umbrella', emoji: '⛱️', place: 'back', picture: 'kitchen/deco/umbrella' },
      { id: 'cream', emoji: '🍦', place: 'cap', picture: 'kitchen/deco/cream' },
      { id: 'strawberry', emoji: '🍓', place: 'rim', picture: 'kitchen/serve/strawberry' },
      { id: 'cherry', emoji: '🍒', place: 'rim', picture: 'kitchen/deco/cherry' },
      { id: 'kiwi', emoji: '🥝', place: 'rim', picture: 'kitchen/deco/kiwi' },
      { id: 'blueberries', emoji: '🫐', place: 'top', picture: 'kitchen/deco/blueberries' },
      { id: 'mint', emoji: '🌿', place: 'top', picture: 'kitchen/deco/mint' },
    ],
  },
  cardOnly: [
    { key: 'lemonJuice', qty: 1, unit: 'tbsp', optional: true },
    { key: 'ice', qty: 0.25, unit: 'cup', optional: true },
  ],
};
