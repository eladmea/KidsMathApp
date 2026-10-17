// The writing games' sentences (math content pack) read well.
import { content } from '../src/content/index';
import { CUSTOMERS, TOPPINGS } from '../src/logic/writingGames';

const { CUSTOMER_NAMES, TOPPING_NAMES, say } = content('math', 'en');

describe('writing games in English', () => {
  it('names every customer and topping', () => {
    CUSTOMERS.forEach((c) => expect(CUSTOMER_NAMES[c.id]).toBeTruthy());
    TOPPINGS.forEach((tp) => expect(TOPPING_NAMES[tp.id]).toMatchObject({ one: expect.any(String), many: expect.any(String), card: expect.any(String) }));
  });

  it('counts toppings, slices and candles with the right plural', () => {
    const mushroom = TOPPING_NAMES.mushroom;
    expect(say.pizza.right({ number: 1, topping: mushroom })).toMatch(/^1 mushroom!/);
    expect(say.pizza.right({ number: 3, topping: mushroom })).toMatch(/^3 mushrooms!/);
    expect(say.pizza.ate({ eaten: 1 })).toBe('One slice! Yum!');
    expect(say.pizza.ate({ eaten: 2 })).toBe('Two slices! Yum!');
    expect(say.cake.right({ number: 1 })).toMatch(/^1 candle!/);
    expect(say.pizza.idle.place({ topping: TOPPING_NAMES.olive })).toMatch(/^Drag an olive slice/);
    expect(say.pizza.written({ word: 'three' })).toMatch(/^Three!/);
  });
});
