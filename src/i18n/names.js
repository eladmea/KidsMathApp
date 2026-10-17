// Display names for curriculum things (skills, islands, age bands, games),
// in the current language. The curriculum data itself only holds ids, emoji
// and structure; its words live in src/i18n/<language>/curriculum.json.
import { has, raw, t } from './index';
import { getSkill } from '../curriculum/skills';

const idOf = (thing) => (typeof thing === 'string' ? thing : thing && thing.id);

export const skillTitle = (skill) => t(`curriculum.skills.${idOf(skill)}`);
export const subjectName = (subject) => t(`curriculum.subjects.${idOf(subject)}`);
export const bandName = (band) => t(`curriculum.bands.${idOf(band)}`);
export const gameTitle = (game) => t(`curriculum.games.${idOf(game)}.title`);
export const gameDescription = (game) => t(`curriculum.games.${idOf(game)}.description`);
export const optionLabel = (game, option) => t(`curriculum.games.${idOf(game)}.options.${idOf(option)}.label`);
export const optionNote = (game, option) => t(`curriculum.games.${idOf(game)}.options.${idOf(option)}.note`);
export const miniGameTitle = (game) => t(`curriculum.miniGames.${idOf(game)}.title`);
export const miniGameDescription = (game) => t(`curriculum.miniGames.${idOf(game)}.description`);

// The one-line "how to play" for a quiz generator, or null if it has none.
export function howTo(generatorId) {
  return generatorId && has(`curriculum.howTo.${generatorId}`) ? t(`curriculum.howTo.${generatorId}`) : null;
}

// "Play together" prompts for the grown-up (shown, not spoken).
export const coachIntro = () => t('curriculum.coach.intro');

export function talkPrompt(subject, isCorrect, index = 0) {
  const prompts = raw('curriculum.coach.prompts');
  const set = (prompts[subject] || prompts.math)[isCorrect ? 'right' : 'wrong'];
  return set[index % set.length];
}

export const talkSubjects = () => Object.keys(raw('curriculum.coach.prompts'));

// Today's Adventure: a step's kind ("Warm-up") and what it plays.
export const stepKind = (step) => t(`adventure.kinds.${step.kind}`);

export function stepTitle(step) {
  if (step.kind === 'minigame') return `${step.emoji} ${miniGameTitle(step.gameId)}`;
  if (step.kind === 'cooldown') return `🎈 ${miniGameTitle('balloon-breath')}`;
  if (step.kind === 'warmup') return t('adventure.review', { count: step.skillIds.length });
  if (step.kind === 'mixed') return t('adventure.mixed', { emoji: step.skillIds.map((id) => getSkill(id).emoji).join(' ') });
  const skill = getSkill(step.skillIds[0]);
  return `${skill.emoji} ${skillTitle(skill)}`;
}
