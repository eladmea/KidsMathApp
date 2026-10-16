import {
  addDays,
  applyRound,
  applySession,
  getDueReviews,
  getRecord,
  isMastered,
  isUnlocked,
  missingPrereqs,
  recommendNextSkill,
  skillStars,
  toDayKey,
  REVIEW_INTERVAL_DAYS,
} from '../utils/progress';
import { getSkill, skillsFor } from '../curriculum/skills';

const DAY1 = '2026-10-15';
const DAY2 = '2026-10-16';
const PASS = { correct: 9, total: 10 };
const FAIL = { correct: 3, total: 10 };
const MEH = { correct: 6, total: 10 };

describe('dates', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays(DAY1, 0)).toBe(DAY1);
  });

  it('formats local dates as YYYY-MM-DD', () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('applyRound', () => {
  const empty = getRecord({}, 'math-count-5');

  it('moves up a box and schedules review when passed', () => {
    const r = applyRound(empty, PASS, DAY1);
    expect(r.box).toBe(1);
    expect(r.dueDate).toBe(addDays(DAY1, REVIEW_INTERVAL_DAYS[1]));
    expect(r.passedDays).toEqual([DAY1]);
    expect(r.attempts).toBe(10);
    expect(r.correct).toBe(9);
    expect(r.bestScore).toBe(9);
  });

  it('only counts one pass per day toward mastery', () => {
    const r = applyRound(applyRound(empty, PASS, DAY1), PASS, DAY1);
    expect(r.passedDays).toEqual([DAY1]);
    expect(isMastered(r)).toBe(false);
  });

  it('masters a skill after passing on two different days', () => {
    const r = applyRound(applyRound(empty, PASS, DAY1), PASS, DAY2);
    expect(isMastered(r)).toBe(true);
    expect(skillStars(r)).toBe(3);
  });

  it('drops back to box 1 when struggling, but holds on a middling round', () => {
    let r = empty;
    for (let i = 0; i < 4; i++) r = applyRound(r, PASS, addDays(DAY1, i));
    expect(r.box).toBe(4);
    expect(applyRound(r, MEH, DAY2).box).toBe(4);
    expect(applyRound(r, FAIL, DAY2).box).toBe(1);
  });

  it('reports stars for tried/passed', () => {
    expect(skillStars(empty)).toBe(0);
    expect(skillStars(applyRound(empty, FAIL, DAY1))).toBe(1);
    expect(skillStars(applyRound(empty, PASS, DAY1))).toBe(2);
  });
});

describe('unlocking', () => {
  it('locks a skill until same-band prereqs are passed', () => {
    const count10 = getSkill('math-count-10');
    expect(isUnlocked(count10, {})).toBe(false);
    expect(missingPrereqs(count10, {})).toEqual(['math-count-5']);
    const progress = { 'math-count-5': applyRound(getRecord({}, 'x'), PASS, DAY1) };
    expect(isUnlocked(count10, progress)).toBe(true);
  });

  it('treats prereqs from an easier band as already met', () => {
    // add-10 (explorers) requires more-less (sprouts).
    expect(isUnlocked(getSkill('math-add-10'), {})).toBe(true);
  });
});

describe('applySession', () => {
  it('reports newly mastered and newly unlocked skills', () => {
    const day1 = applySession({}, { 'math-count-5': PASS }, DAY1, 'sprouts');
    expect(day1.newlyMastered).toEqual([]);
    expect(day1.newlyUnlocked.sort()).toEqual(['math-count-10', 'math-more-less']);

    const day2 = applySession(day1.progress, { 'math-count-5': PASS }, DAY2, 'sprouts');
    expect(day2.newlyMastered).toEqual(['math-count-5']);
    expect(day2.newlyUnlocked).toEqual([]);
  });

  it('ignores empty tallies and does not mutate the input', () => {
    const before = {};
    const { progress } = applySession(before, { 'math-count-5': { correct: 0, total: 0 } }, DAY1, 'sprouts');
    expect(progress).toEqual({});
    expect(before).toEqual({});
  });
});

describe('recommendNextSkill', () => {
  it('suggests the first unlocked skill not passed yet', () => {
    const skills = skillsFor({ band: 'sprouts' });
    expect(recommendNextSkill(skills, {}).id).toBe('math-count-5');

    const passedOnce = applyRound(getRecord({}, 'x'), PASS, DAY1);
    expect(recommendNextSkill(skills, { 'math-count-5': passedOnce }).id).toBe('math-shapes');
  });

  it('falls back to passed-but-unmastered skills once everything is passed', () => {
    const skills = skillsFor({ band: 'sprouts', subject: 'math' });
    const passedOnce = applyRound(getRecord({}, 'x'), PASS, DAY1);
    const mastered = applyRound(passedOnce, PASS, DAY2);
    const progress = Object.fromEntries(skills.map((s) => [s.id, mastered]));
    progress['math-more-less'] = passedOnce;
    expect(recommendNextSkill(skills, progress).id).toBe('math-more-less');
    progress['math-more-less'] = mastered;
    expect(recommendNextSkill(skills, progress)).toBeNull();
  });

  it('returns null when nothing is playable', () => {
    expect(recommendNextSkill(skillsFor({ subject: 'sel' }), {})).toBeNull();
  });
});

describe('getDueReviews', () => {
  it('returns passed skills whose review date has arrived, most overdue first', () => {
    const passedDay1 = applyRound(getRecord({}, 'x'), PASS, DAY1); // due DAY2
    const passedEarlier = applyRound(getRecord({}, 'x'), PASS, '2026-10-10'); // due 10-11
    const failed = applyRound(getRecord({}, 'x'), FAIL, DAY1);
    const progress = {
      'math-count-5': passedDay1,
      'math-shapes': passedEarlier,
      'math-count-10': failed,
    };
    expect(getDueReviews(progress, DAY1)).toEqual(['math-shapes']);
    expect(getDueReviews(progress, DAY2)).toEqual(['math-shapes', 'math-count-5']);
    expect(getDueReviews(progress, DAY2, 1)).toEqual(['math-shapes']);
  });
});
