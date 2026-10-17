// Which scene plays a skill. Quiz skills all use the Quiz scene; game skills
// each have their own scene once it has been rebuilt (the rest show "coming
// soon" until then).
import { isQuizSkill } from '../curriculum/skills';

// skill.screen (the old app's screen name) -> Phaser scene key.
export const GAME_SCENES = {
  PizzaShop: 'Pizza',
};

export function isAvailable(skill) {
  return Boolean(skill && (isQuizSkill(skill) || GAME_SCENES[skill.screen]));
}

// { key, data } to start a skill, or null if it isn't available yet.
export function skillScene(skill, mode = 'practice') {
  if (!skill) return null;
  if (isQuizSkill(skill)) return { key: 'Quiz', data: { skillIds: [skill.id], mode } };
  const key = GAME_SCENES[skill.screen];
  return key ? { key, data: { skillId: skill.id } } : null;
}
