// Strawberry banana smoothie, 2 glasses. No heat, so it is the first recipe.
// Source: מתכון קל, "שייק תות ובננה". Amounts from a search summary of the
// page: NOT yet checked against the page itself (see `verified`).
export default {
  id: 'smoothie',
  emoji: '🥤',
  order: 1,
  source: { url: 'https://matkonkal.co.il/recipe/%D7%A9%D7%99%D7%99%D7%A7-%D7%AA%D7%95%D7%AA-%D7%91%D7%A0%D7%A0%D7%94', site: 'מתכון קל' },
  verified: null,
  ingredients: [
    { key: 'banana', emoji: '🍌', qty: 1, unit: 'whole', kept: 'cupboard' },
    // About 10 strawberries.
    { key: 'strawberries', emoji: '🍓', qty: 150, unit: 'g', piece: 15, kept: 'fridge' },
    { key: 'milk', emoji: '🥛', qty: 250, unit: 'ml', kept: 'fridge' },
    // Spooned onto the scale, 25 g a spoonful.
    { key: 'yogurt', emoji: '🥣', qty: 100, unit: 'g', piece: 25, kept: 'fridge' },
  ],
  prep: [{ action: 'peel', on: 'banana', times: 1 }],
  cook: { appliance: 'blender' },
  serve: { kind: 'decorate', dish: '🥤', plates: 2, item: '🍓', count: 2 },
};
