// Which scene plays a skill, and whether it's available yet. Quiz skills all
// use the Quiz scene, in any language that has their content pack. Game
// skills each have their own scene; a game scene says which skills it plays
// (`static plays = ['PizzaShop']`), and scenes/registry.js registers it here.
import { isQuizSkill } from '../curriculum/skills';
import { GENERATOR_PACK } from '../curriculum/generators';
import { hasContent } from '../content/index';
import { getLanguage } from '../i18n/index';

// skill.screen (the old app's screen name) -> Phaser scene key.
export const GAME_SCENES = {};

export function registerGameScene(screen, sceneKey) {
  GAME_SCENES[screen] = sceneKey;
}

export function isAvailable(skill, language = getLanguage()) {
  if (!skill) return false;
  if (isQuizSkill(skill)) return hasContent(GENERATOR_PACK[skill.generator], language);
  return Boolean(GAME_SCENES[skill.screen]);
}

// { key, data } to start a skill, or null if it isn't available yet.
export function skillScene(skill, mode = 'practice') {
  if (!isAvailable(skill)) return null;
  if (isQuizSkill(skill)) return { key: 'Quiz', data: { skillIds: [skill.id], mode } };
  return { key: GAME_SCENES[skill.screen], data: { skillId: skill.id } };
}
