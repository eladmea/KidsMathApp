import {
  BUDDY_LEVELS,
  buddyLevel,
  chooseFirstCard,
  chooseSecondCard,
  decideGap,
  forgetCards,
  observeCard,
} from '../src/logic/memoryBuddy';

const card = (id, value, status = 'hidden') => ({ id, value, status, face: { label: String(value) } });
const always = () => 0;
const never = () => 0.999;

describe('buddy memory', () => {
  it('remembers a card only when recall succeeds', () => {
    expect(observeCard({}, card(1, 5), 0.5, always)).toEqual({ 1: 5 });
    expect(observeCard({}, card(1, 5), 0.5, never)).toEqual({});
  });

  it('forgets matched cards', () => {
    expect(forgetCards({ 1: 5, 2: 5, 3: 7 }, [1, 2])).toEqual({ 3: 7 });
  });
});

describe('choosing cards', () => {
  const deck = [card(0, 1), card(1, 2), card(2, 1), card(3, 3), card(4, 2, 'matched')];

  it('goes for a remembered pair first', () => {
    expect(chooseFirstCard(deck, { 0: 1, 2: 1, 3: 3 }, always).value).toBe(1);
  });

  it('ignores remembered cards that are already matched', () => {
    const first = chooseFirstCard(deck, { 1: 2, 4: 2 }, always);
    expect(first.status).toBe('hidden');
    expect(first.id).not.toBe(1); // no hidden pair known, so it explores an unseen card
  });

  it('flips the remembered partner as the second card', () => {
    expect(chooseSecondCard(deck, { 2: 1 }, deck[0], never).id).toBe(2);
  });

  it('never picks the first card again or a face-up card', () => {
    for (let i = 0; i < 50; i++) {
      const second = chooseSecondCard(deck, {}, deck[0]);
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
    }
    expect(buddyLevel('unknown')).toBe(BUDDY_LEVELS.explorers);
  });
});
