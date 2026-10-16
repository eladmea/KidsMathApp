// In-round adaptive difficulty (plan section 6): in a practice round,
// 3 wrong answers in a row step down a level and show a hint; 5 right answers
// in a row step up a level. A "level" is a neighbouring skill on the learning
// trajectory: the skill's prerequisite (easier) or a skill that builds on it
// (harder). So questions are always tallied to the skill actually practiced,
// and mastery stays honest. A round moves at most one level from where it
// started, and never steps up into an older age band than the child's (a
// 3-year-old who aces Quick Look stays on 1-5 dots, not the 5-6 ten frame).
import { SKILLS, isQuizSkill, getSkill } from '../curriculum/skills';
import { AGE_BANDS } from '../curriculum/ageBands';

const BAND_ORDER = AGE_BANDS.map((band) => band.id);

function withinBand(skill, bandId) {
  return !bandId || BAND_ORDER.indexOf(skill.band) <= BAND_ORDER.indexOf(bandId);
}

export const STEP_DOWN_AFTER = 3;
export const STEP_UP_AFTER = 5;

// The first quiz-skill prerequisite, if any.
export function easierSkill(skill) {
  return skill.prereqs.map(getSkill).find(isQuizSkill) || null;
}

// A quiz skill in the same subject that builds on this one, preferring one
// where it is the first prerequisite (Add within 20 -> Add within 100, not
// Subtract within 20).
export function harderSkill(skill, bandId = null) {
  const candidates = SKILLS.filter(
    (other) =>
      other.subject === skill.subject && isQuizSkill(other) && other.prereqs.includes(skill.id) && withinBand(other, bandId)
  );
  if (!candidates.length) return null;
  return candidates.reduce((best, other) =>
    other.prereqs.indexOf(skill.id) < best.prereqs.indexOf(skill.id) ? other : best
  );
}

// The skill a round at `level` (-1, 0 or +1) practices. `bandId` is the
// child's age band, which a step up never goes beyond.
export function skillForLevel(baseSkill, level, bandId = null) {
  if (level < 0) return easierSkill(baseSkill) || baseSkill;
  if (level > 0) return harderSkill(baseSkill, bandId) || baseSkill;
  return baseSkill;
}

// Streak: positive = right answers in a row, negative = wrong in a row.
export function nextStreak(streak, isCorrect) {
  if (isCorrect) return streak > 0 ? streak + 1 : 1;
  return streak < 0 ? streak - 1 : -1;
}

// After an answer: the new level and streak, and what changed:
// 'down' (stepped down, show a hint), 'hint' (no easier level, just a hint),
// 'up' (stepped up), or null.
export function adapt({ level, streak }, isCorrect, baseSkill, bandId = null) {
  const nextStreakValue = nextStreak(streak, isCorrect);
  if (nextStreakValue <= -STEP_DOWN_AFTER) {
    const target = level - 1;
    if (target >= -1 && skillForLevel(baseSkill, target, bandId) !== skillForLevel(baseSkill, level, bandId)) {
      return { level: target, streak: 0, change: 'down' };
    }
    return { level, streak: 0, change: 'hint' };
  }
  if (nextStreakValue >= STEP_UP_AFTER) {
    const target = level + 1;
    if (target <= 1 && skillForLevel(baseSkill, target, bandId) !== skillForLevel(baseSkill, level, bandId)) {
      return { level: target, streak: 0, change: 'up' };
    }
  }
  return { level, streak: nextStreakValue, change: null };
}
