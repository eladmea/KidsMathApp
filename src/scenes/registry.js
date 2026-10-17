// Every scene registers itself: any src/scenes/*Scene.js is part of the game,
// so adding a scene never means editing a shared list. Boot runs first.
// A game scene that plays skills says which (`static plays = ['PizzaShop']`,
// the skills' `screen` names) and is routed to from the islands.
import { registerGameScene } from '../logic/skillRoutes';

const modules = import.meta.glob('./*Scene.js', { eager: true });

export const SCENES = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => (a.key === 'Boot' ? -1 : b.key === 'Boot' ? 1 : 0));

SCENES.forEach((Scene) => {
  (Scene.plays || []).forEach((screen) => registerGameScene(screen, Scene.key));
});
