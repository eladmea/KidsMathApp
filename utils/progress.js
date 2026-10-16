// Pure mastery + spaced-review logic (no storage here, so it's easy to test).
//
// A skill record looks like:
//   { attempts, correct, bestScore, passedDays: ['YYYY-MM-DD', ...],
//     box, lastPlayed, dueDate }
//
// - A round is "passed" at >= 80% correct.
// - A skill is MASTERED once it's been passed on 2 different days (spacing
//   beats cramming), and stays in the review queue afterwards.
// - `box` is a Leitner box: passing moves it up (longer gap until the next
//   review), struggling moves it back down.
import { SKILLS, getSkill, isPlayable, isQuizSkill } from '../curriculum/skills';

export const PASS_RATIO = 0.8;
export const STRUGGLE_RATIO = 0.5;
export const MASTERY_DAYS = 2;
export const REVIEW_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];
const MAX_BOX = REVIEW_INTERVAL_DAYS.length - 1;
const MAX_PASSED_DAYS_KEPT = 10;

const EMPTY_RECORD = {
  attempts: 0,
  correct: 0,
  bestScore: 0,
  passedDays: [],
  box: 0,
  lastPlayed: null,
  dueDate: null,
};

function pad(n) {
  return String(n).padStart(2, '0');
}

export function toDayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(dayKey, days) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function getRecord(progress, skillId) {
  return (progress && progress[skillId]) || EMPTY_RECORD;
}

export function hasPassed(record) {
  return record.passedDays.length >= 1;
}

export function isMastered(record) {
  return record.passedDays.length >= MASTERY_DAYS;
}

// 0 = not tried, 1 = tried, 2 = passed once, 3 = mastered.
export function skillStars(record) {
  if (isMastered(record)) return 3;
  if (hasPassed(record)) return 2;
  if (record.attempts > 0) return 1;
  return 0;
}

export function applyRound(record, { correct, total }, today) {
  const ratio = total > 0 ? correct / total : 0;
  const passed = ratio >= PASS_RATIO;

  let box = record.box;
  if (passed) {
    box = Math.min(MAX_BOX, box + 1);
  } else if (ratio < STRUGGLE_RATIO) {
    box = Math.min(box, 1);
  }

  const passedDays =
    passed && !record.passedDays.includes(today)
      ? [...record.passedDays, today].slice(-MAX_PASSED_DAYS_KEPT)
      : record.passedDays;

  return {
    attempts: record.attempts + total,
    correct: record.correct + correct,
    bestScore: Math.max(record.bestScore, correct),
    passedDays,
    box,
    lastPlayed: today,
    dueDate: addDays(today, REVIEW_INTERVAL_DAYS[box]),
  };
}

// tallies: { [skillId]: { correct, total } }
// Returns the new progress plus which skills were newly mastered/unlocked so
// the results screen can celebrate them.
export function applySession(progress, tallies, today, bandId) {
  const next = { ...progress };
  const newlyMastered = [];
  Object.entries(tallies).forEach(([skillId, tally]) => {
    if (!tally.total) return;
    const before = getRecord(progress, skillId);
    const after = applyRound(before, tally, today);
    next[skillId] = after;
    if (!isMastered(before) && isMastered(after)) newlyMastered.push(skillId);
  });

  const newlyUnlocked = bandId
    ? unlockedSkillIds(bandId, next).filter((id) => !unlockedSkillIds(bandId, progress).includes(id))
    : [];

  return { progress: next, newlyMastered, newlyUnlocked };
}

// A skill unlocks once every prerequisite *in the same band* has been passed.
export function missingPrereqs(skill, progress) {
  return skill.prereqs.filter((prereqId) => {
    const prereq = getSkill(prereqId);
    return prereq && prereq.band === skill.band && !hasPassed(getRecord(progress, prereqId));
  });
}

export function isUnlocked(skill, progress) {
  return missingPrereqs(skill, progress).length === 0;
}

function unlockedSkillIds(bandId, progress) {
  return SKILLS.filter((skill) => skill.band === bandId && isPlayable(skill) && isUnlocked(skill, progress)).map(
    (skill) => skill.id
  );
}

// In skill-map order: the first unlocked skill not passed yet, so the child
// keeps moving forward (passed skills come back via Daily Review on a later
// day, which is what masters them). Falls back to the first unmastered one.
export function recommendNextSkill(skills, progress) {
  const candidates = skills.filter((skill) => isPlayable(skill) && isUnlocked(skill, progress));
  return (
    candidates.find((skill) => !hasPassed(getRecord(progress, skill.id))) ||
    candidates.find((skill) => !isMastered(getRecord(progress, skill.id))) ||
    null
  );
}

// Skills the child has passed before whose review date has arrived, most
// overdue first.
export function getDueReviews(progress, today, limit = 3) {
  return Object.entries(progress || {})
    .filter(([skillId, record]) => isQuizSkill(getSkill(skillId)) && hasPassed(record) && record.dueDate <= today)
    .sort(([, a], [, b]) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
    .slice(0, limit)
    .map(([skillId]) => skillId);
}
