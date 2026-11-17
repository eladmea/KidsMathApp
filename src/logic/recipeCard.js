// The printable recipe card for families (Parent Dashboard → Settings →
// Recipe cards): the source's own amounts, the extras the game leaves out,
// short steps, safety notes and the source link. Free of Phaser and of the
// browser: the scene passes in the language's words and labels, and gets
// back the card's lines and a self-contained HTML page to print or save.
import { hasVerifiedCard } from './kitchen';

const RAW = new Set(['egg', 'turkey', 'chicken']);
const MEAT = new Set(['turkey', 'chicken']);
const NEEDS_GROWN_UP = new Set(['oven', 'stove', 'pot']);

// The card's lines. `words` is the kitchen content pack; `labels` are the
// card's UI words (i18n kitchen.card.*), with {name} / {count} / {date}
// filled in here.
export function recipeCard(recipe, { words, labels }) {
  if (!hasVerifiedCard(recipe)) return null;
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
  const names = (key) => words.INGREDIENTS[key];
  const ingredients = recipe.ingredients.map((ingredient) => {
    const line = words.cardLine(ingredient, names(ingredient.key));
    return { emoji: ingredient.emoji, text: ingredient.alt ? `${line} (${words.shortAmount(ingredient.alt)})` : line };
  });
  const extras = (recipe.cardOnly || []).map((ingredient) => {
    const name = names(ingredient.key).many;
    let text;
    if (ingredient.toTaste) text = fill(labels.toTaste, { name });
    else if (ingredient.pinch) text = fill(labels.pinch, { name });
    else text = words.cardLine(ingredient, names(ingredient.key));
    if (ingredient.optional) text += ` ${labels.optional}`;
    if (ingredient.asNeeded) text += ` ${labels.asNeeded}`;
    return { text };
  });
  const keys = new Set(recipe.ingredients.map((ingredient) => ingredient.key));
  const safety = [labels.safety.washHands];
  if ([...keys].some((key) => RAW.has(key))) safety.push(labels.safety.rawFood);
  if (NEEDS_GROWN_UP.has(recipe.cook.appliance) || recipe.prep.some((action) => action.action === 'cut')) safety.push(labels.safety.grownUp);
  if ([...keys].some((key) => MEAT.has(key))) safety.push(labels.safety.cookThrough);
  if (keys.has('honey')) safety.push(labels.safety.honey);
  (recipe.safety || []).forEach((id) => safety.push(labels.safety[id]));
  return {
    id: recipe.id,
    emoji: recipe.emoji,
    title: labels.title,
    makes: fill(labels.makes, { count: recipe.serves }),
    ingredients,
    extras,
    steps: words.RECIPE_STEPS[recipe.id],
    safety,
    source: { site: recipe.source.site, url: recipe.source.url },
    checked: fill(labels.checked, { date: recipe.verified.date }),
    labels,
  };
}

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// A page that prints on one sheet (A4 or Letter) and reads well on a phone.
export function cardHtml(card, { lang = 'en', dir = 'ltr' } = {}) {
  const { labels } = card;
  const list = (items) => items.map((item) => `<li>${item.emoji ? `<span class="e">${escape(item.emoji)}</span> ` : ''}${escape(item.text)}</li>`).join('');
  return `<!doctype html>
<html lang="${escape(lang)}" dir="${escape(dir)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(card.title)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #fff; color: #2d3142; font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
  h1 { margin: 0 0 4px; font-size: 30px; }
  .makes { color: #6b6f80; margin: 0 0 18px; }
  h2 { font-size: 19px; margin: 18px 0 6px; border-bottom: 2px solid #ffd9b8; padding-bottom: 2px; }
  ul, ol { margin: 0; padding-inline-start: 22px; }
  li { margin: 3px 0; }
  ul.ingredients { list-style: none; padding-inline-start: 0; columns: 2; column-gap: 24px; }
  ul.ingredients li { break-inside: avoid; }
  .e { display: inline-block; width: 1.4em; }
  .extras { color: #4b4f60; }
  .safety li { color: #8a3b12; }
  footer { margin-top: 20px; font-size: 13px; color: #6b6f80; overflow-wrap: anywhere; }
  @media (max-width: 520px) { ul.ingredients { columns: 1; } }
  @media print { main { padding: 0; } a { color: inherit; } }
</style>
</head>
<body>
<main>
  <h1>${escape(card.emoji)} ${escape(card.title)}</h1>
  <p class="makes">${escape(card.makes)}</p>
  <h2>${escape(labels.ingredients)}</h2>
  <ul class="ingredients">${list(card.ingredients)}</ul>
  ${card.extras.length ? `<ul class="extras">${list(card.extras)}</ul>` : ''}
  <h2>${escape(labels.method)}</h2>
  <ol>${card.steps.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>
  <h2>${escape(labels.safetyTitle)}</h2>
  <ul class="safety">${card.safety.map((line) => `<li>${escape(line)}</li>`).join('')}</ul>
  <footer>${escape(labels.source)}: <a href="${escape(card.source.url)}">${escape(card.source.site)}</a> · <bdi dir="ltr">${escape(card.source.url)}</bdi><br>${escape(card.checked).replace(/(\d{4}-\d{2}-\d{2})/, '<bdi dir="ltr">$1</bdi>')}</footer>
</main>
</body>
</html>
`;
}
