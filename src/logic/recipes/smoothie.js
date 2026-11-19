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
  cook: { appliance: 'blender' },
  serve: { kind: 'decorate', dish: '🥤', plates: 4, item: '🍓', count: 4, dishPicture: 'kitchen/serve/smoothie', itemPicture: 'kitchen/serve/strawberry' },
  cardOnly: [
    { key: 'lemonJuice', qty: 1, unit: 'tbsp', optional: true },
    { key: 'ice', qty: 0.25, unit: 'cup', optional: true },
  ],
};
