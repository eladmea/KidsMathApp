import {
  AHEAD_SLIP,
  BUDDY_LEVELS,
  buddyLevel,
  buddySlip,
  chooseFirstCard,
  chooseSecondCard,
  decideGap,
  forgetCards,
  observeCard,
} from '../src/logic/memoryBuddy';

const card = (id, value, status = 'hidden') => ({ id, value, status, face: { label: String(value) } });
const always = () => 0;
const never = () => 0.999;
// Memory as the buddy keeps it, oldest first: mem({ 0: 1, 2: 1 }).
const mem = (entries) => Object.entries(entries).map(([id, value]) => ({ id: Number(id), value }));

describe('buddy memory', () => {
  it('remembers a card only when recall succeeds', () => {
    expect(observeCard([], card(1, 5), { recall: 0.5 }, always)).toEqual([{ id: 1, value: 5 }]);
    expect(observeCard([], card(1, 5), { recall: 0.5 }, never)).toEqual([]);
  });

  it('holds only the last `span` cards: older ones fade', () => {
    let memory = [];
    [card(1, 5), card(2, 6), card(3, 7)].forEach((c) => (memory = observeCard(memory, c, { recall: 1, span: 2 }, always)));
    expect(memory.map((m) => m.id)).toEqual([2, 3]);
  });

  it('seeing a remembered card again makes it the newest', () => {
    const memory = observeCard(mem({ 1: 5, 2: 6 }), card(1, 5), { recall: 1, span: 2 }, always);
    expect(memory.map((m) => m.id)).toEqual([2, 1]);
    expect(observeCard(memory, card(3, 7), { recall: 1, span: 2 }, always).map((m) => m.id)).toEqual([1, 3]);
  });

  it('forgets matched cards', () => {
    expect(forgetCards(mem({ 1: 5, 2: 5, 3: 7 }), [1, 2])).toEqual([{ id: 3, value: 7 }]);
  });
});

describe('choosing cards', () => {
  const deck = [card(0, 1), card(1, 2), card(2, 1), card(3, 3), card(4, 2, 'matched')];

  it('goes for a remembered pair first', () => {
    expect(chooseFirstCard(deck, mem({ 0: 1, 2: 1, 3: 3 }), always).value).toBe(1);
  });

  it('ignores remembered cards that are already matched', () => {
    const first = chooseFirstCard(deck, mem({ 1: 2, 4: 2 }), always);
    expect(first.status).toBe('hidden');
    expect(first.id).not.toBe(1); // no hidden pair known, so it explores an unseen card
  });

  it('flips the remembered partner as the second card', () => {
    expect(chooseSecondCard(deck, mem({ 2: 1 }), deck[0], never).id).toBe(2);
  });

  it('sometimes slips: turns another card although it knows the partner', () => {
    const second = chooseSecondCard(deck, mem({ 2: 1 }), deck[0], always, 0.5);
    expect(second.id).not.toBe(2);
    expect(second.status).toBe('hidden');
    expect(chooseSecondCard(deck, mem({ 2: 1 }), deck[0], never, 0.5).id).toBe(2);
  });

  it('cannot slip when the partner is the only card left', () => {
    const last = [card(0, 1, 'up'), card(1, 1), card(2, 2, 'matched')];
    expect(chooseSecondCard(last, mem({ 1: 1 }), last[0], always, 1).id).toBe(1);
  });

  it('never picks the first card again or a face-up card', () => {
    for (let i = 0; i < 50; i++) {
      const second = chooseSecondCard(deck, [], deck[0], Math.random, 0.5);
      expect(second.id).not.toBe(0);
      expect(second.status).toBe('hidden');
    }
  });
});

describe('decideGap', () => {
  const level = { accuracy: 0.8, attempt: 0.7 };

  it('skips when it cannot afford the gap', () => {
    expect(decideGap({ cost: 5, chipsAvailable: 4, ...level }, always)).toBeNull();
  });

  it('pays the right amount when it attempts and is accurate', () => {
    expect(decideGap({ cost: 3, chipsAvailable: 8, ...level }, always)).toBe(3);
  });

  it('sometimes skips by choice', () => {
    expect(decideGap({ cost: 3, chipsAvailable: 8, ...level }, never)).toBeNull();
  });

  it('wrong guesses stay within its chips and differ from the cost', () => {
    const rolls = [0, 0.9, 0.5];
    let i = 0;
    const rng = () => rolls[i++ % rolls.length];
    const guess = decideGap({ cost: 3, chipsAvailable: 6, ...level }, rng);
    expect(guess).not.toBe(3);
    expect(guess).toBeGreaterThanOrEqual(1);
    expect(guess).toBeLessThanOrEqual(6);
  });

  it('gets stronger with age band', () => {
    const order = ['sprouts', 'explorers', 'builders', 'masters'];
    for (let i = 1; i < order.length; i++) {
      expect(BUDDY_LEVELS[order[i]].recall).toBeGreaterThan(BUDDY_LEVELS[order[i - 1]].recall);
      expect(BUDDY_LEVELS[order[i]].span).toBeGreaterThan(BUDDY_LEVELS[order[i - 1]].span);
      expect(BUDDY_LEVELS[order[i]].slip).toBeLessThan(BUDDY_LEVELS[order[i - 1]].slip);
    }
    expect(buddyLevel('unknown')).toBe(BUDDY_LEVELS.explorers);
  });
});

describe('buddySlip', () => {
  const level = BUDDY_LEVELS.explorers;

  it('slips more while the buddy is ahead', () => {
    expect(buddySlip(level, 1, 1)).toBe(level.slip);
    expect(buddySlip(level, 0, 2)).toBe(level.slip);
    expect(buddySlip(level, 3, 1)).toBeCloseTo(level.slip + AHEAD_SLIP);
  });

  it('never slips every time', () => {
    expect(buddySlip({ slip: 0.7 }, 5, 0)).toBeLessThan(1);
  });
});
