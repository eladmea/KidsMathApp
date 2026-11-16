// Homemade chicken hot dogs (5 to 8; we roll 5).
// Source: וואלה אוכל, "נקניקיות עוף פטנט ביתיות לילדים" (Avi Biton).
// Checked against the page on 2026-11-16: 500 g chicken breast, 1 small
// onion, 2 garlic cloves, 1 tbsp ketchup, 2 medium eggs (or 1 large),
// 1½ tsp cornflour, 2 tbsp soy sauce, 1 tbsp oil, salt and pepper (no
// amount); rolled in cling film, simmered about 15 minutes on low heat,
// cooled in ice water, then seared in a little canola oil.
// For children under 5, hot dogs are cut lengthwise into thin strips, not
// rings (choking): the printable card says so.
export default {
  id: 'hotdogs',
  emoji: '🌭',
  order: 5,
  source: { url: 'https://food.walla.co.il/item/3111815', site: 'וואלה אוכל' },
  verified: { date: '2026-11-16', by: 'Claude, from the source page', checkedUrl: 'https://food.walla.co.il/item/3111815' },
  ingredients: [
    // Two 250 g chicken breasts.
    { key: 'chicken', emoji: '🍗', qty: 500, unit: 'g', piece: 250, kept: 'fridge' },
    { key: 'onion', emoji: '🧅', qty: 1, unit: 'whole', kept: 'cupboard' },
    { key: 'garlic', emoji: '🧄', qty: 2, unit: 'whole', kept: 'cupboard' },
    { key: 'ketchup', emoji: '🥫', qty: 1, unit: 'tbsp', kept: 'fridge' },
    { key: 'egg', emoji: '🥚', qty: 2, unit: 'whole', kept: 'fridge' },
    { key: 'cornflour', emoji: '🌽', qty: 1.5, unit: 'tsp', kept: 'cupboard' },
    { key: 'soySauce', emoji: '🍶', qty: 2, unit: 'tbsp', kept: 'cupboard' },
    { key: 'oil', emoji: '🫗', qty: 1, unit: 'tbsp', kept: 'cupboard' },
  ],
  prep: [
    { action: 'cut', on: 'onion', times: 1 },
    { action: 'crack', on: 'egg', times: 2 },
    { action: 'blend', on: 'bowl' },
    { action: 'shape', on: 'sausage', times: 5 },
  ],
  cook: { appliance: 'pot', minutes: 15 },
  // Each roll gets a sausage and becomes a hot dog.
  serve: { kind: 'decorate', dish: '🥖', plates: 5, item: '🌭', count: 5, replace: true },
};
