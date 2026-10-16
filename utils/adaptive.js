// In-round adaptive difficulty (plan section 6): in a practice round,
// 3 wrong answers in a row step down a level and show a hint; 5 right answers
// in a row step up a level. A "level" is a neighbouring skill on the learning
// trajectory: the skill's prerequisite (easier) or a skill that builds on it
// (harder). So questions are always tallied to the skill actually practiced,
// and mastery stays honest. A round moves at most one level from where it
// started.
import { SKILLS, isQuizSkill, getSkill } from '../curriculum/skills';

export const STEP_DOWN_AFTER = 3;
export const STEP_UP_AFTER = 5;

// The first quiz-skill prerequisite, if any.
export function easierSkill(skill) {
  return skill.prereqs.map(getSkill).find(isQuizSkill) || null;
}

// A quiz skill in the same subject that builds on this one, preferring one
// where it is the first prerequisite (Add within 20 -> Add within 100, not
// Subtract within 20).
export function harderSkill(skill) {
  const candidates = SKILLS.filter(
    (other) => other.subject === skill.subject && isQuizSkill(other) && other.prereqs.includes(skill.id)
  );
  if (!candidates.length) return null;
  return candidates.reduce((best, other) =>
    other.prereqs.indexOf(skill.id) < best.prereqs.indexOf(skill.id) ? other : best
  );
}

// The skill a round at `level` (-1, 0 or +1) practices.
export function skillForLevel(baseSkill, level) {
  if (level < 0) return easierSkill(baseSkill) || baseSkill;
  if (level > 0) return harderSkill(baseSkill) || baseSkill;
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
export function adapt({ level, streak }, isCorrect, baseSkill) {
  const nextStreakValue = nextStreak(streak, isCorrect);
  if (nextStreakValue <= -STEP_DOWN_AFTER) {
    const target = level - 1;
    if (target >= -1 && skillForLevel(baseSkill, target) !== skillForLevel(baseSkill, level)) {
      return { level: target, streak: 0, change: 'down' };
    }
    return { level, streak: 0, change: 'hint' };
  }
  if (nextStreakValue >= STEP_UP_AFTER) {
    const target = level + 1;
    if (target <= 1 && skillForLevel(baseSkill, target) !== skillForLevel(baseSkill, level)) {
      return { level: target, streak: 0, change: 'up' };
    }
  }
  return { level, streak: nextStreakValue, change: null };
}
