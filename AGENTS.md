# Phaser 4 HAS CHANGED

This is a Phaser 4 game (Vite, plain JavaScript). Phaser 4 differs from Phaser 3 in places that matter. For example:

- `RenderTexture` / `DynamicTexture` need `.render()` after drawing;
- masks and FX are now filters;
- `setTintFill` is gone;
- `Math.TAU` is now 2π.

Before writing Phaser code, read the guides that ship with the installed version in `node_modules/phaser/skills/`. Start with `v3-to-v4-migration/SKILL.md`, then the topic you need (`input-keyboard-mouse-touch`, `render-textures`, `scale-and-responsive`, `scenes`, `tweens`, ...). For exact signatures, check `node_modules/phaser/types/phaser.d.ts`.

- Plan and phases: `PHASER_PLAN.md`. The research and design rules are in `PLAN.md`.
- Game rules live in `src/curriculum/` and `src/logic/` and must stay free of Phaser, so `npm test` covers them.
- Scenes extend `src/ui/BaseScene.js`: lay out in the 1280 x 720 safe area, and pin edges to `this.view` in `layout()`.
  - Navigate with `go()` / `back()` / `reset()` / `replay()`, never `scene.start` directly, so ← keeps working.
  - `tag()` the objects a browser test needs to tap.
  - `report()` the scene's state.
- After changing a scene, run `npm test` and the walkthroughs (`npm run e2e` against a build; see README), and add checks for new behaviour.
- `legacy/` is the old Expo app, for reference only.
