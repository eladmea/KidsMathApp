// Display names for curriculum things (skills, islands, age bands, games),
// in the current language. The curriculum data itself only holds ids, emoji
// and structure; its words live in src/i18n/<language>/curriculum.json.
import { has, raw, t } from './index';

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
