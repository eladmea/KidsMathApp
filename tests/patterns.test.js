import { generateQuestion } from '../src/curriculum/generators';
import { howTo } from '../src/curriculum/howTo';
import { getSkill, skillsFor } from '../src/curriculum/skills';

const RUNS = 400;

// The smallest repeat length that explains the whole row (at least 2 full
// repeats), or null if none does.
function period(items) {
  for (let p = 1; p <= items.length / 2; p++) {
    if (items.every((item, i) => i < p || item === items[i - p])) return p;
  }
  return null;
}

function filled(q, choice) {
  return q.visual.items.map((item, i) => (i === q.visual.gap ? choice : item));
}

describe('pattern ladder by age', () => {
  it('has a pattern skill in every age band, in trajectory order', () => {
    const ladder = [
      ['logic-patterns', 'sprouts', 'patterns-ab'],
      ['logic-patterns-more', 'sprouts', 'patterns-easy'],
      ['logic-patterns-hard', 'explorers', 'patterns-hard'],
      ['logic-pattern-match', 'explorers', 'pattern-match'],
      ['logic-pattern-unit', 'builders', 'pattern-unit'],
      ['logic-growing', 'builders', 'growing-patterns'],
      ['logic-pattern-position', 'masters', 'pattern-position'],
      ['logic-number-rules', 'masters', 'number-rules'],
    ];
    ladder.forEach(([id, band, generator]) => {
      expect(getSkill(id)).toMatchObject({ band, generator });
      expect(howTo(generator)).toBeTruthy();
    });
    expect(getSkill('logic-patterns-more').prereqs).toEqual(['logic-patterns']);
    ['sprouts', 'explorers', 'builders', 'masters'].forEach((band) => {
      expect(skillsFor({ subject: 'logic', band }).filter((s) => /pattern|growing|number-rules/.test(s.id)).length).toBeGreaterThan(0);
    });
  });

  it('ages 3-4 start with AB only: 2 choices, 3+ full repeats, mostly a gap in the middle', () => {
    let middle = 0;
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('patterns-ab');
      expect(q.choices).toHaveLength(2);
      expect(new Set(q.visual.items).size).toBe(2);
      expect(q.visual.items.length).toBeGreaterThanOrEqual(6);
      expect(period(filled(q, q.answer))).toBe(2);
      if (q.visual.gap < q.visual.items.length - 1) middle += 1;
      expect(q.speakAlways).toBe(true);
    }
    expect(middle / RUNS).toBeGreaterThan(0.5);
  });

  it.each(['patterns-ab', 'patterns-easy', 'patterns-hard'])('%s: exactly one choice completes the pattern', (id) => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(id);
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      const completing = q.choices.filter((choice) => period(filled(q, choice)) !== null);
      expect(completing).toEqual([q.answer]);
      // At least two full repeats are visible before the gap is filled.
      expect(q.visual.items.length).toBeGreaterThanOrEqual(2 * period(filled(q, q.answer)) + 1);
    }
  });

  it('same pattern, new look: exactly one row has the same structure, all rows the same length', () => {
    const shape = (items) => {
      const seen = [];
      return items.map((x) => {
        if (!seen.includes(x)) seen.push(x);
        return seen.indexOf(x);
      }).join('');
    };
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('pattern-match');
      const target = shape(q.visual.items);
      const rows = q.choices.map((row) => Array.from(row.matchAll(/\p{Extended_Pictographic}️?|\S/gu), (m) => m[0]));
      expect(new Set(rows.map((r) => r.length)).size).toBe(1);
      expect(rows.filter((r) => shape(r) === target)).toHaveLength(1);
      const answerRow = rows[q.choices.indexOf(q.answer)];
      expect(shape(answerRow)).toBe(target);
      // New things: no emoji shared with the shown pattern.
      expect(answerRow.some((x) => q.visual.items.includes(x))).toBe(false);
    }
  });

  it('which part repeats: the answer is the smallest unit, the others are not units', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('pattern-unit');
      const items = q.visual.items;
      const unitLength = period(items);
      expect(q.answer).toBe(items.slice(0, unitLength).join(''));
      expect(new Set(q.choices).size).toBe(3);
      expect(unitLength).toBeGreaterThanOrEqual(3);
    }
  });

  it('growing patterns grow by a constant amount and offer 4 choices', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('growing-patterns');
      const [a, b, c] = q.visual.steps;
      expect(b - a).toBe(c - b);
      expect(q.answer).toBe(c + (c - b));
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
    }
  });

  it('pattern detective: the answer is the item at that position', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('pattern-position');
      const items = q.visual.items;
      const p = period(items);
      const position = Number(q.prompt.match(/number (\d+)/)[1]);
      expect(position).toBeGreaterThan(items.length);
      expect(q.answer).toBe(items[(position - 1) % p]);
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it('number rules: 4 distinct choices including the next number', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('number-rules');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      q.choices.forEach((c) => expect(c).toBeGreaterThan(0));
    }
  });
});

describe('pattern rows fit on one line', () => {
  it.each(['patterns-ab', 'patterns-easy', 'patterns-hard', 'pattern-match', 'pattern-unit', 'pattern-position'])(
    '%s shows at most 10 tiles',
    (id) => {
      for (let i = 0; i < 300; i++) {
        const q = generateQuestion(id);
        expect(q.visual.items.length + (q.visual.numbered ? 1 : 0)).toBeLessThanOrEqual(10);
      }
    }
  );
});

describe('number rules are unambiguous', () => {
  // Other rules a child might reasonably see: constant step, constant ratio,
  // "add the two before", and growing differences.
  const otherReadings = (terms) => {
    const n = terms.length;
    const readings = [];
    const d = terms[n - 1] - terms[n - 2];
    if (terms.every((t, i) => i === 0 || t - terms[i - 1] === d)) readings.push(terms[n - 1] + d);
    const r = terms[n - 1] / terms[n - 2];
    if (Number.isInteger(r) && terms.every((t, i) => i === 0 || t === terms[i - 1] * r)) readings.push(terms[n - 1] * r);
    if (terms.every((t, i) => i < 2 || t === terms[i - 1] + terms[i - 2])) readings.push(terms[n - 1] + terms[n - 2]);
    return readings;
  };

  it('no other common rule fits the shown numbers with a different answer among the choices', () => {
    for (let i = 0; i < 2000; i++) {
      const q = generateQuestion('number-rules');
      const terms = q.prompt.replace(', ?', '').split(', ').map(Number);
      otherReadings(terms).forEach((other) => {
        if (other !== q.answer) expect(q.choices).not.toContain(other);
      });
    }
  });
});
