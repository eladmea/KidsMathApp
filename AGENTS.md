# Phaser 4 HAS CHANGED

This is a Phaser 4 game (Vite, plain JavaScript). Phaser 4 differs from Phaser 3 in places that matter. For example:

- `RenderTexture` / `DynamicTexture` need `.render()` after drawing;
- masks and FX are now filters;
- `setTintFill` is gone;
- `Math.TAU` is now 2π.

Before writing Phaser code, read the guides that ship with the installed version in `node_modules/phaser/skills/`. Start with `v3-to-v4-migration/SKILL.md`, then the topic you need (`input-keyboard-mouse-touch`, `render-textures`, `scale-and-responsive`, `scenes`, `tweens`, ...). For exact signatures, check `node_modules/phaser/types/phaser.d.ts`.

- Plan and phases: `PHASER_PLAN.md`. The research and design rules are in `PLAN.md`. **How to change things (assets, languages, voice, scenes, skills): `ARCHITECTURE.md`. Follow it.**
- No words in code: UI text through `t()` (`src/i18n/en/<feature>.json`); question words in content packs (`src/content/en/<pack>.js`).
- No emoji drawn directly: use `art()` / `glyph()` from `src/ui/Art.js`.
- Never add things to a shared list: scenes, languages, packs, pictures, sounds and recordings are found by folder.
- Game rules live in `src/curriculum/` and `src/logic/` and must stay free of Phaser, so `npm test` covers them.
- Scenes extend `src/ui/BaseScene.js`: lay out in the 1280 x 720 safe area, and pin edges to `this.view` in `layout()`.
  - Navigate with `go()` / `back()` / `reset()` / `replay()`, never `scene.start` directly, so ← keeps working.
  - Phaser reuses a scene object when the scene starts again, so set every field fresh in `build()`.
  - Never use Phaser's own scene property names for your own fields (`this.input`, `this.time`, `this.tweens`, `this.sound`, `this.add`, `this.cameras`, ...). Overwriting `this.input` silently breaks every tap in the scene.
  - `tag()` the objects a browser test needs to tap.
  - `report()` the scene's state.
- Resize shapes with `setSize(width, height)`. Assigning `rect.width = …` changes nothing on screen in Phaser 4.
- Don't pass functions with optional parameters straight to `.filter`/`.map` (`skills.filter(isAvailable)` passes the index as the language). Wrap them: `.filter((s) => isAvailable(s))`.
- After changing a scene, run `npm run lint`, `npm test` and the walkthroughs (`npm run e2e` against a build; see README), and add checks for new behaviour.
- The old Expo app was removed in P5. If you need how it did something, it is in the git history up to commit `86c82f2`.
