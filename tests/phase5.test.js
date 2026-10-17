import { STEP_DOWN_AFTER, STEP_UP_AFTER, adapt, easierSkill, harderSkill, nextStreak, skillForLevel } from '../src/logic/adaptive';
import { replaceRemaining, buildSession } from '../src/logic/session';
import { MAX_EVENTS, appendEvents, median, notesOf, daysPlayed, skillReport, toCsv } from '../src/logic/playLog';
import { SKILLS, getSkill, isQuizSkill } from '../src/curriculum/skills';

const add20 = getSkill('math-add-20');

function answer(skillId, correct, ms = 2000, replays = 0, day = '2026-10-16') {
  return { type: 'answer', at: 1, day, skillId, correct, ms, replays };
}

describe('adaptive levels', () => {
  it('steps along the learning trajectory', () => {
    expect(easierSkill(add20).id).toBe('math-add-10');
    expect(harderSkill(add20).id).toBe('math-add-100');
    expect(harderSkill(getSkill('math-sub-20')).id).toBe('math-sub-100');
    expect(easierSkill(getSkill('math-count-5'))).toBeNull();
    expect(skillForLevel(add20, 0)).toBe(add20);
    expect(skillForLevel(getSkill('math-count-5'), -1).id).toBe('math-count-5');
  });

  it('only ever steps to quiz skills in the same subject', () => {
    SKILLS.filter(isQuizSkill).forEach((skill) => {
      const easier = easierSkill(skill);
      const harder = harderSkill(skill);
      if (easier) expect(isQuizSkill(easier)).toBe(true);
      if (harder) {
        expect(isQuizSkill(harder)).toBe(true);
        expect(harder.subject).toBe(skill.subject);
      }
    });
  });

  it('counts streaks both ways', () => {
    expect(nextStreak(0, true)).toBe(1);
    expect(nextStreak(2, true)).toBe(3);
    expect(nextStreak(2, false)).toBe(-1);
    expect(nextStreak(-2, false)).toBe(-3);
  });

  it(`steps down after ${STEP_DOWN_AFTER} wrong and up after ${STEP_UP_AFTER} right, at most one level`, () => {
    let state = { level: 0, streak: 0 };
    for (let i = 0; i < STEP_DOWN_AFTER - 1; i++) {
      state = adapt(state, false, add20);
      expect(state.change).toBeNull();
    }
    state = adapt(state, false, add20);
    expect(state).toEqual({ level: -1, streak: 0, change: 'down' });
    // Already one level down: more wrong answers only bring hints.
    for (let i = 0; i < STEP_DOWN_AFTER; i++) state = adapt(state, false, add20);
    expect(state).toEqual({ level: -1, streak: 0, change: 'hint' });
    for (let i = 0; i < STEP_UP_AFTER; i++) state = adapt(state, true, add20);
    expect(state).toEqual({ level: 0, streak: 0, change: 'up' });
    for (let i = 0; i < STEP_UP_AFTER; i++) state = adapt(state, true, add20);
    expect(state).toMatchObject({ level: 1, change: 'up' });
    for (let i = 0; i < STEP_UP_AFTER; i++) state = adapt(state, true, add20);
    expect(state.level).toBe(1);
    expect(state.change).toBeNull();
  });

  it('gives a hint instead when there is no easier level', () => {
    let state = { level: 0, streak: 0 };
    const count5 = getSkill('math-count-5');
    for (let i = 0; i < STEP_DOWN_AFTER; i++) state = adapt(state, false, count5);
    expect(state).toEqual({ level: 0, streak: 0, change: 'hint' });
  });

  it('swaps only the remaining questions to the new skill', () => {
    const questions = buildSession(['math-add-20']);
    const next = replaceRemaining(questions, 4, getSkill('math-add-10'));
    expect(next).toHaveLength(questions.length);
    expect(next.slice(0, 4)).toEqual(questions.slice(0, 4));
    next.slice(4).forEach((q, i) => {
      expect(q.skillId).toBe('math-add-10');
      expect(q.id).toBe(4 + i);
    });
  });
});

describe('play-test log', () => {
  it('keeps at most MAX_EVENTS events', () => {
    const log = appendEvents([], Array.from({ length: MAX_EVENTS + 5 }, (_, i) => ({ type: 'answer', at: i })));
    expect(log).toHaveLength(MAX_EVENTS);
    expect(log[0].at).toBe(5);
  });

  it('computes medians', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(3);
  });

  it('flags skills that look too hard, too easy, unclear or abandoned', () => {
    const log = [
      ...Array.from({ length: 10 }, (_, i) => answer('math-add-20', i < 5)),
      ...Array.from({ length: 10 }, () => answer('math-count-5', true, 1200)),
      ...Array.from({ length: 10 }, (_, i) => answer('lit-rhymes', i < 8, 4000, 1)),
      { type: 'round', at: 1, day: '2026-10-16', skillId: 'logic-freeze-zoo', correct: 20, total: 24 },
      { type: 'quit', at: 1, day: '2026-10-16', skillId: 'logic-freeze-zoo', answered: 3, total: 24 },
      { type: 'quit', at: 1, day: '2026-10-17', skillId: 'logic-freeze-zoo', answered: 1, total: 24 },
      { type: 'level', at: 1, day: '2026-10-16', skillId: 'math-add-20', change: 'down', toSkillId: 'math-add-10' },
    ];
    const rows = Object.fromEntries(skillReport(log).map((row) => [row.skillId, row]));
    expect(rows['math-add-20'].flags).toEqual(['too hard']);
    expect(rows['math-add-20'].stepsDown).toBe(1);
    expect(rows['math-count-5'].flags).toEqual(['too easy']);
    expect(rows['math-count-5'].medianMs).toBe(1200);
    expect(rows['lit-rhymes'].flags).toEqual(['unclear']);
    expect(rows['lit-rhymes'].accuracy).toBeCloseTo(0.8);
    // Game-screen skills are judged by their round totals.
    expect(rows['logic-freeze-zoo'].attempts).toBe(24);
    expect(rows['logic-freeze-zoo'].flags).toEqual(['drop-off']);
  });

  it('does not flag skills with too few answers', () => {
    const rows = skillReport(Array.from({ length: 5 }, () => answer('math-add-20', false)));
    expect(rows[0].flags).toEqual([]);
  });

  it('collects notes, counts days and exports CSV', () => {
    const log = [answer('math-add-20', true), { type: 'note', at: 2, day: '2026-10-18', text: 'Liked it, "fast"' }];
    expect(notesOf(log)).toHaveLength(1);
    expect(daysPlayed(log)).toBe(1);
    const csv = toCsv([{ profile: 'Mia', events: log }]).split('\n');
    expect(csv[0].split(',')[0]).toBe('profile');
    expect(csv).toHaveLength(3);
    expect(csv[1].startsWith('Mia,answer,2026-10-16')).toBe(true);
    expect(csv[2]).toContain('"Liked it, ""fast"""');
  });
});
