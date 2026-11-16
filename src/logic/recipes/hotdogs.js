// Homemade chicken hot dogs (5 to 8; we roll 5).
// Source: וואלה אוכל, "נקניקיות עוף פטנט ביתיות לילדים" (Avi Biton). Amounts
// from a search summary: NOT yet checked against the page. Simmering time
// (20 minutes) is from a related ynet recipe, to check.
// For children under 5, hot dogs are cut lengthwise into thin strips, not
// rings (choking): the printable card says so.
export default {
  id: 'hotdogs',
  emoji: '🌭',
  order: 5,
  source: { url: 'https://food.walla.co.il/item/3111815', site: 'וואלה אוכל' },
  verified: null,
  ingredients: [
    // Two 250 g chicken breasts.
    { key: 'chicken', emoji: '🍗', qty: 500, unit: 'g', piece: 250, kept: 'fridge' },
    { key: 'onion', emoji: '🧅', qty: 1, unit: 'whole', kept: 'cupboard' },
    { key: 'garlic', emoji: '🧄', qty: 2, unit: 'whole', kept: 'cupboard' },
    { key: 'ketchup', emoji: '🥫', qty: 1, unit: 'tbsp', kept: 'fridge' },
    { key: 'egg', emoji: '🥚', qty: 2, unit: 'whole', kept: 'fridge' },
    { key: 'cornflour', emoji: '🌽', qty: 2, unit: 'tbsp', kept: 'cupboard' },
    { key: 'soySauce', emoji: '🍶', qty: 1, unit: 'tbsp', kept: 'cupboard' },
    { key: 'oil', emoji: '🫗', qty: 1, unit: 'tbsp', kept: 'cupboard' },
  ],
  prep: [
    { action: 'cut', on: 'onion', times: 1 },
    { action: 'crack', on: 'egg', times: 2 },
    { action: 'blend', on: 'bowl' },
    { action: 'shape', on: 'sausage', times: 5 },
  ],
  cook: { appliance: 'pot', minutes: 20 },
  // Each roll gets a sausage and becomes a hot dog.
  serve: { kind: 'decorate', dish: '🥖', plates: 5, item: '🌭', count: 5, replace: true },
};
