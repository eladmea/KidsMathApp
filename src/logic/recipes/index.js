// Every recipe in this folder, in their `order`. A new file is a new recipe
// (it still needs a skill in curriculum/skills.js and its words in the
// kitchen content pack).
const modules = import.meta.glob('./*.js', { eager: true });

export const RECIPES = Object.entries(modules)
  .filter(([path]) => path !== './index.js')
  .map(([, module]) => module.default)
  .sort((a, b) => a.order - b.order);

export const getRecipe = (id) => RECIPES.find((recipe) => recipe.id === id);
