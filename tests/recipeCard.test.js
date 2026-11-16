// The printable recipe cards (logic/recipeCard.js): the source's amounts,
// extras, steps and safety notes, in both languages, and only once checked.
import { cardHtml, recipeCard } from '../src/logic/recipeCard';
import { RECIPES, getRecipe } from '../src/logic/recipes/index';
import * as en from '../src/content/en/kitchen';
import * as he from '../src/content/he/kitchen';
import enText from '../src/i18n/en/kitchen.json';
import heText from '../src/i18n/he/kitchen.json';

const make = (id, words = en, text = enText) => recipeCard(getRecipe(id), { words, labels: { ...text.card, title: id } });

describe('recipe cards', () => {
  it('makes a card for every checked recipe, in both languages', () => {
    RECIPES.forEach((recipe) => {
      [[en, enText], [he, heText]].forEach(([words, text]) => {
        const card = make(recipe.id, words, text);
        expect(card.ingredients.length).toBe(recipe.ingredients.length);
        expect(card.steps.length).toBeGreaterThan(3);
        expect(card.makes).toContain(String(recipe.serves));
        [...card.ingredients, ...card.extras].forEach(({ text: line }) => expect(line).not.toMatch(/undefined|NaN|\{/));
      });
    });
  });

  it("shows the source's own amounts, both ways", () => {
    const muffins = make('muffins').ingredients.map((line) => line.text);
    expect(muffins).toContain('80 ml coconut oil (⅓ cup)');
    expect(muffins).toContain('1 cup oats (100 g)');
    expect(make('smoothie').ingredients.map((line) => line.text)).toContain('150 g strawberries (1 cup)');
    expect(make('burgers').ingredients.map((line) => line.text)).toContain('1 onion (120 g)');
    expect(make('muffins', he, heText).ingredients.map((line) => line.text)).toContain('80 מ"ל שמן קוקוס (⅓ כוס)');
  });

  it('adds the extras the game leaves out', () => {
    expect(make('omelette').extras.map((line) => line.text)).toEqual(['¼ cup chopped dill (optional)', 'salt, to taste', 'black pepper, to taste']);
    expect(make('muffins').extras.map((line) => line.text)).toEqual(['A pinch of salt']);
    expect(make('burgers').extras.map((line) => line.text)).toContain('3 tbsp cold water (as needed)');
  });

  it('adds the safety notes each recipe needs', () => {
    const safety = (id) => make(id).safety.join(' ');
    expect(safety('hotdogs')).toMatch(/under 5/);
    expect(safety('hotdogs')).toMatch(/all the way through/);
    expect(safety('smoothie')).toMatch(/Honey/);
    expect(safety('smoothie')).not.toMatch(/raw egg/);
    expect(safety('omelette')).toMatch(/raw egg/);
    expect(safety('omelette')).toMatch(/grown-up/);
  });

  it('writes a page to print, safely escaped, right to left in Hebrew', () => {
    const html = cardHtml(make('hotdogs', he, heText), { lang: 'he', dir: 'rtl' });
    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain('https://food.walla.co.il/item/3111815');
    expect(html).toContain('<bdi dir="ltr">2026-11-16</bdi>');
    expect(html).toContain('<bdi dir="ltr">https://food.walla.co.il/item/3111815</bdi>');
    const muffins = cardHtml(make('muffins', he, heText), { lang: 'he', dir: 'rtl' });
    expect(muffins).toContain('80 מ&quot;ל');
    expect(muffins).not.toContain('80 מ"ל');
  });

  it('makes no card for a recipe nobody has checked', () => {
    expect(recipeCard({ ...getRecipe('smoothie'), verified: null }, { words: en, labels: enText.card })).toBe(null);
  });
});
