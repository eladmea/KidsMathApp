// Today's Adventure: the guided daily session from the plan (section 6).
//   1. Warm-up       spaced review of skills that are due
//   2. New skill     the next skill in today's main subject (math or reading)
//   3. Mixed         the new skill mixed with ones already passed
//   4. Mini-game     a free Fun Break game
//   5. Second        the next skill in today's second subject
//   6. Cool-down     Balloon Breath, today's stickers, "see you tomorrow"
// Steps without anything to play are skipped. With a daily time limit, steps
// are dropped from the end (never the cool-down) so the adventure fits the
// time that's left.
import { MINI_GAMES } from '../curriculum/games';
import { getSkill, isQuizSkill, skillsFor } from '../curriculum/skills';
import { getDueReviews, getRecord, hasPassed, recommendNextSkill } from './progress';

export const ADVENTURE_QUESTIONS = 5;
export const MAIN_SUBJECTS = ['math', 'literacy'];
export const SECOND_SUBJECTS = ['science', 'logic', 'sel'];
// Rough minutes per step, used to fit the adventure into the time left.
export const STEP_MINUTES = { warmup: 2, new: 3, mixed: 3, minigame: 1.5, second: 3, cooldown: 1 };
export const STEP_INFO = {
  warmup: { emoji: '⭐', title: 'Warm-up' },
  new: { emoji: '🌟', title: 'New skill' },
  mixed: { emoji: '🔀', title: 'Mixed practice' },
  minigame: { emoji: '🎈', title: 'Fun Break' },
  second: { emoji: '🧭', title: 'Explore' },
  cooldown: { emoji: '😌', title: 'Cool-down' },
};
const MINI_GAME_ROTATION = MINI_GAMES.filter((game) => !game.free);
const MAX_MIXED_EXTRAS = 2;

// Day of the week (0-6) for a 'YYYY-MM-DD' key, without time-zone surprises.
export function weekdayOf(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Main and second subject for a day: math and reading alternate, and the
// second subject rotates through science, logic and feelings.
export function subjectsForDay(dayKey) {
  const weekday = weekdayOf(dayKey);
  return { main: MAIN_SUBJECTS[weekday % MAIN_SUBJECTS.length], second: SECOND_SUBJECTS[weekday % SECOND_SUBJECTS.length] };
}

function nextSkillIn(subject, bandId, progress) {
  return recommendNextSkill(skillsFor({ subject, band: bandId }), progress);
}

function skillStep(kind, skill) {
  return { id: kind, kind, skillIds: [skill.id], screen: skill.screen || null };
}

// The steps for today. Each step: { id, kind, skillIds?, screen?, route? }.
export function planAdventure({ bandId, progress = {}, today, minutesLeft = null }) {
  const subjects = subjectsForDay(today);
  const steps = [];

  const due = getDueReviews(progress, today);
  if (due.length) steps.push({ id: 'warmup', kind: 'warmup', skillIds: due });

  // If the main subject has nothing left to suggest, use the other one.
  const mainSkill =
    nextSkillIn(subjects.main, bandId, progress) ||
    nextSkillIn(MAIN_SUBJECTS.find((s) => s !== subjects.main), bandId, progress);
  if (mainSkill) steps.push(skillStep('new', mainSkill));

  // Mixed: the new skill (if it's a quiz) plus up to two passed quiz skills
  // from the band, so new and old are interleaved.
  const passed = skillsFor({ band: bandId })
    .filter((skill) => isQuizSkill(skill) && skill.id !== mainSkill?.id && hasPassed(getRecord(progress, skill.id)))
    .slice(0, MAX_MIXED_EXTRAS);
  const mixed = [...(isQuizSkill(mainSkill) ? [mainSkill.id] : []), ...passed.map((skill) => skill.id)];
  if (mixed.length >= 2) steps.push({ id: 'mixed', kind: 'mixed', skillIds: mixed });

  const game = MINI_GAME_ROTATION[weekdayOf(today) % MINI_GAME_ROTATION.length];
  steps.push({ id: 'minigame', kind: 'minigame', route: game.route, title: game.title, emoji: game.emoji });

  const secondSkill =
    nextSkillIn(subjects.second, bandId, progress) ||
    SECOND_SUBJECTS.map((s) => nextSkillIn(s, bandId, progress)).find(Boolean);
  if (secondSkill) steps.push(skillStep('second', secondSkill));

  return fitToTime([...steps, { id: 'cooldown', kind: 'cooldown', route: 'BalloonBreath' }], minutesLeft);
}

// Drops steps from the end (keeping the cool-down and at least one other
// step) until the adventure fits in `minutesLeft`. No limit -> unchanged.
export function fitToTime(steps, minutesLeft) {
  if (minutesLeft === null || minutesLeft === undefined) return steps;
  const cooldown = steps[steps.length - 1];
  const rest = steps.slice(0, -1);
  const minutes = (list) => list.reduce((sum, step) => sum + STEP_MINUTES[step.kind], STEP_MINUTES.cooldown);
  while (rest.length > 1 && minutes(rest) > minutesLeft) rest.pop();
  return [...rest, cooldown];
}

export function estimatedMinutes(steps) {
  return Math.ceil(steps.reduce((sum, step) => sum + STEP_MINUTES[step.kind], 0));
}

// [routeName, params] that start a step.
export function stepRoute(step) {
  const params = { adventureStep: step.id };
  if (step.kind === 'minigame') return [step.route, { ...params, adventure: true }];
  if (step.kind === 'cooldown') return ['BalloonBreath', { ...params, coolDown: true, adventure: true }];
  if (step.screen) return [step.screen, { ...params, skillId: step.skillIds[0] }];
  const mode = step.kind === 'warmup' ? 'review' : step.kind === 'mixed' ? 'mixed' : 'practice';
  return ['Quiz', { ...params, skillIds: step.skillIds, mode, count: ADVENTURE_QUESTIONS }];
}

// What the step plays, shown under its kind on the adventure path.
export function stepTitle(step) {
  if (step.kind === 'minigame') return `${step.emoji} ${step.title}`;
  if (step.kind === 'cooldown') return '🎈 Balloon Breath';
  if (step.kind === 'warmup') return `⭐ Review ${step.skillIds.length} skill${step.skillIds.length === 1 ? '' : 's'}`;
  if (step.kind === 'mixed') return `🔀 ${step.skillIds.map((id) => getSkill(id).emoji).join(' ')} mixed`;
  const skill = getSkill(step.skillIds[0]);
  return `${skill.emoji} ${skill.title}`;
}

// Today's adventure record: { day, steps, done: [stepId] }.
export function newAdventure(day, steps) {
  return { day, steps, done: [] };
}

export function completeStep(adventure, stepId) {
  if (!adventure || adventure.done.includes(stepId) || !adventure.steps.some((s) => s.id === stepId)) return adventure;
  return { ...adventure, done: [...adventure.done, stepId] };
}

export function currentStep(adventure) {
  return adventure ? adventure.steps.find((step) => !adventure.done.includes(step.id)) || null : null;
}

export function isFinished(adventure) {
  return Boolean(adventure && adventure.steps.length && adventure.done.length >= adventure.steps.length);
}
