# MathPlay → Phaser migration plan

- **Written:** 2026-10-17
- **Goal:** rebuild MathPlay as a Phaser game. We don't keep the Expo / React Native screens, components or assets. Islands get designed later, inside Phaser.
- **Engine:** Phaser 4.2.1 (latest on npm), bundled with Vite 8. Tests use Vitest; the browser walkthrough uses Playwright.
- **Decided 2026-10-17:**
  - landscape on phones and tablets;
  - the logic is copied over;
  - the old app is kept for reference only: it isn't in use, so we can move or break it to get a clean structure;
  - plain JavaScript.

---

## 1. Why Phaser

Most of the play-test bugs came from forcing games into a UI framework:

- drags cancelled by web text selection;
- `onPressIn` missing quick taps;
- paint coverage lost on fast strokes;
- stale closures in once-created PanResponders;
- the emoji-and-`View` drawing of the pizza, cake and islands.

Phaser fixes these by design:

- **One input model:** pointer events work the same for mouse, touch and pen, with drag-and-drop and hit areas built in.
- **Real drawing:** `Graphics` and `RenderTexture` paint the sauce, cheese, tracing and icing. Pixel coverage can be read straight off the canvas.
- **A game loop:** tweens, timelines, particles, physics (Bunny Pop, Push & Roll, Bubble Pop) and a camera for scrolling islands.
- **Scenes:** each game is a self-contained scene with its own load, start and shutdown.
- **Sprites and atlases:** this is where the island art and a consistent visual style will come from.

---

## 2. What we keep vs. drop

| Keep (port as-is) | Drop (rewrite) |
|---|---|
| `curriculum/*`: skill map, age bands, subjects, all question generators, phonics, how-to texts, talk prompts | All `screens/*` (28) and `components/*` (27) |
| Pure logic in `utils/*`: progress/mastery/Leitner, adaptive, adventure, session, scoring, stickers, garden, tracing paths, writing-game helpers, memory game + buddy, path race, bunny pop, freeze zoo, robo path, push roll, balloon breath, feelings friends, play log, play time, parent gate maths | React Navigation, AsyncStorage, expo-speech, expo-audio, react-native-web |
| The jest test suite for those modules (~300 tests) | `theme.js`, `useNarrator`, `useIdleHint`, `useSoundEffects` (React hooks) |
| `PLAN.md` research and design rules (section 3 onwards) | All current emoji-as-art drawing |

**Decided:** copy the logic over instead of rewriting it. It doesn't depend on React, it's research-based and it's covered by tests. None of the UI layer survives.

---

## 3. Target architecture

The how-to for each kind of change lives in [ARCHITECTURE.md](ARCHITECTURE.md). The short version: everything is found by folder, so adding a scene, language, content pack, picture, sound or recording means adding files, not editing a shared list.

```
(repo root)               Vite + Phaser project
  legacy/                 the old Expo app (reference only, not built or deployed)
  index.html
  src/
    main.js               Phaser.Game config (scenes come from scenes/registry.js)
    scenes/               one file per screen; *Scene.js registers itself, games declare `static plays`
    ui/                   Phaser UI kit (see 3.2), Art (image-or-emoji pictures)
    services/             session, storage, speech (recordings first, then device voice), voiceClips,
                          assets (images and sounds by folder), audio, router, testBridge
    logic/                game rules with no Phaser (unit-tested)
    curriculum/           skills, subjects, bands, question generators: structure and logic, no words
    i18n/<language>/      every word on screen: one JSON file per feature, plus _meta.json
    content/<language>/   question content per subject (math, literacy, science, logic, sel)
    voice/<language>/     recorded sentences by clip id (optional)
    assets/images/        pictures by key or emoji code point (optional; @<language>/ overrides)
    assets/sounds/        sound effects by name
    parent/               HTML overlay for the grown-up area (see 3.4, P5)
  tests/                  Vitest unit tests (also checks language keys and content packs)
  e2e/                    Playwright walkthroughs through the window.__mathplay test hook
  scripts/voice-lines.mjs lists every line to record for a language
```

### 3.1 Core decisions

| Topic | Recommendation | Why |
|---|---|---|
| Language | **Decided:** plain JS (ES modules), with JSDoc where it helps | The ported logic is JS, so no conversion step |
| Layout | **Decided:** landscape on phones and tablets. 1280×720 design size with `Scale.EXPAND`: the 16:9 safe area always shows, and wider phones (19.5:9) or squarer tablets (4:3) see more background instead of black bars. UI is anchored to the safe area's edges, plus the device notch insets. A "please turn your device" screen appears in portrait | One layout covers every device without letterboxing |
| Native apps | **Capacitor** wraps the web build for iOS and Android | One codebase, and native TTS and storage plugins |
| Tests | Vitest for logic (the jest tests run nearly unchanged), Playwright for scenes | Fast; same browser setup as now |
| Fonts | One rounded kid-friendly web font (e.g. Fredoka) | Emoji stays only where it's content, e.g. feelings |
| Art | Start with simple vector placeholder sprites. Later, a CC0 pack (e.g. Kenney) or custom art in texture atlases | Unblocks gameplay; the island design pass comes later |

### 3.2 UI kit (`src/ui/`)

These are built once and used by every scene:

- **Basic pieces:** `Button` (big, bouncy, with a sound), `Panel`, `StarRow`, `ProgressBar`, `ScoreCounter`.
- **`NarratorBubble`:** speaks and shows a line, with a "say it again" button.
- **`HintArrow` + `IdleHint`:** the bouncing reminder after 5 seconds without input. Phaser's timer replaces `useIdleHint`.
- **`DragTray`:** items you drag onto drop zones, using Phaser drag events.
- **`TraceLayer`:** a dot guide plus a `RenderTexture` trail. It supports strict stroke order and free order (coverage and on-number checks from `tracing.js`), the "watch me" demo and a follower sprite (bee, car).
- **`PaintLayer`:** a free brush on a `RenderTexture` with a pixel-coverage check (sauce, cheese, icing).
- **`AnswerGrid`:** the quiz answer choices.
- **Quiz inputs:** `NumberLine`, `WordBuilder`, `StoryStrip`.
- **Shared screens:** `ExampleCard` (worked example), `ResultsPopup`, `ParentGate`.
- **`SceneRouter`:** `go(scene, params)` and `back()`, with a history stack. This replaces React Navigation.

### 3.3 Scenes

| Scene | Replaces |
|---|---|
| Boot / Preload | Asset loading, voice detection |
| Profiles, CreateProfile | ProfilesScreen, CreateProfileScreen (name entry through a DOM input) |
| WorldMap | WorldMapScreen. A placeholder grid until the island design |
| Island | SkillListScreen. A plain stage list until the island design |
| Quiz | QuizScreen + QuestionVisual + all input types (generic, driven by generators) |
| Results, TimeUp | ResultsScreen, TimeUpScreen |
| TraceDigits, TracePath | Write 1–5 / 6–9, Bee Paths |
| PathRace | Race Track Numbers |
| PizzaShop, BirthdayCake | The writing games |
| MemoryGame, GameSetup | Memory Chips, setup and AI buddy |
| BunnyPop, FreezeZoo, RoboPath, PushRoll | Logic and science games |
| FeelingsFriends, Garden, BalloonBreath | Social-emotional games |
| MiniGames, BubblePop, DanceTap, ChipToss | Mini-games |
| Adventure | Today's Adventure + play-together coach |
| StickerBook | StickerBookScreen |

### 3.4 Grown-up area

Phaser is a poor fit for forms and text. The parent dashboard, playtest report, CSV export, time limits and voice picker become a plain **HTML overlay** above the canvas. A parent gate in Phaser protects it.

### 3.5 Things the canvas changes

- **Screen readers:** a canvas has no accessibility labels. Narration covers the kids. For accessibility we add an optional hidden DOM layer that mirrors the main buttons.
- **Tests:** Playwright can't find canvas text. A test-only `window.__mathplay` bridge exposes:
  - the current scene and its state;
  - named object positions, so tests can click or drag at real coordinates;
  - the spoken lines.

  The current walkthroughs (walk1–11) get rewritten against this bridge.
- **Saved data:** existing players' progress isn't carried over (fresh start; the old app isn't in use). The storage keys get a version prefix, so later changes can migrate.

---

## 4. Phases

Each phase ends with tests passing, a web build, a Playwright walkthrough and a PR.

| Phase | Scope | Done when |
|---|---|---|
| **P0 Spike** ✅ merged (#18), real-device check later | Move the Expo app to `legacy/`. Set up Vite + Phaser 4 at the root. Copy the logic into `src/logic/` with its tests. Build one quiz skill (Count to 5) and the Pizza sauce trace (PaintLayer + TraceLayer). Try it on a phone and a tablet | Drags, painting and TTS feel right on touch; layout and orientation confirmed |
| **P1 Foundation** ✅ merged (#19) | Scale/safe area, storage, speech, audio, session, SceneRouter, UI kit, test bridge. Profiles and CreateProfile scenes. GitHub Pages deploy of the new build at `/KidsMathApp/`, replacing the old app | A child can pick a profile and hear the greeting |
| **P2 Core learning loop** ✅ merged (#22) | WorldMap and Island placeholders. The generic Quiz scene with every question visual and input type. Worked examples, Results, stars, stickers, adaptive steps, review and mixed rounds | Every quiz skill in all 5 subjects is playable and saves progress |
| **P2.5 Architecture for change** ✅ built | Assets by folder (images by key or emoji, per-language overrides, sounds). Every word in language files (`i18n/`) or per-language content packs (`content/`), with a language per child and a picker. Recorded voice by sentence with device-voice fallback, plus the `voice:lines` script. Scenes self-register, and games declare the skills they play. ESLint in CI. See ARCHITECTURE.md | A new language, picture or recording is just new files; tests catch missing words |
| **P3 Writing & drag games** | TraceDigits, Bee Paths, Race Track, Pizza Shop (full flow: stations, oven drag, slices, feeding), Birthday Cake | The sprouts (3–4) math band is fully playable |
| **P4 Remaining games** | Memory Chips (+ setup, buddy), Bunny Pop, Freeze Zoo, Robo Path, Push & Roll, Feelings Friends, Garden, Balloon Breath, Bubble Pop, Dance Tap, Chip Toss | Every skill and mini-game from the old app exists |
| **P5 Sessions & grown-ups** | Today's Adventure + coach mode, soft time limits, TimeUp, parent overlay (dashboard, report, CSV, limits, voices) | Matches the old app feature for feature |
| **P6 Clean-up** | Delete `legacy/` once nothing in it is needed as a reference. Update README, PLAYTEST.md, PLAN.md, AGENTS.md (Phaser docs instead of Expo) | One codebase |
| **P7 Islands & art** | Design the islands in Phaser: tilemap or illustrated islands, camera scrolling, the stage path, avatar, chest. Plus the art pass, sound and music | Your island design, done properly |
| **P8 Native apps** | Capacitor iOS/Android builds, native TTS and storage, app icon, store builds (the old Phase 8) | Installable apps |

**From P3 on**, each rebuilt game follows ARCHITECTURE.md:
- its text goes in its own `i18n/en/<game>.json`;
- its names and word lists go in a content pack;
- pictures go through `art()`;
- it declares `static plays`.

The old game logic in `src/logic/` still has English words in it (Memory Chips letters, Feelings Friends stories, Garden clues). Those move into content packs as each game is rebuilt.

Old **Phase 5b** play-test rounds pause during P0–P5, then continue on the Phaser build. **Phase 7** (curriculum gaps) is mostly logic and generator work, so it can run alongside from P2.

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| TTS differs between browsers and devices | Port the existing voice ranking. P0 tests it on a real phone. Native plugin under Capacitor |
| Without art, everything looks worse than the emoji version | Placeholder sprites with a consistent palette from P1. Art pass in P7 |
| Text input (names) on a canvas | DOM input element over the canvas |
| A rewrite stalls feature work | The old app isn't in use, so there's nothing to keep running. The logic keeps its tests the whole time |
| Bundle size on slow connections | Phaser custom build, plus atlases loaded per scene |

---

## 6. Progress log

### P0 Spike: built 2026-10-17 (branch `claude/phaser-p0`)

**What was done**
- **Old app:** moved into `legacy/`, untouched.
- **New Vite + Phaser 4.2.1 project** at the root:
  - `src/curriculum` and `src/logic` copied over unchanged.
  - Three small changes to make them run without the old app:
    - `playerColors` moved into `logic/players.js`;
    - `numberLineFeedback` moved out of a component into `logic/numberLine.js`;
    - the tests' `require()` calls became imports.
  - 290 tests pass under Vitest. The 13 old speech-engine tests were dropped because that engine was rewritten.
- **Layout:**
  - `Scale.EXPAND` with the camera centred on a 1280×720 safe area, so the canvas fills any landscape screen with no black bars;
  - notch insets via CSS;
  - a "please turn your device" screen in portrait;
  - a fullscreen button that also tries to lock landscape.
- **Services:**
  - storage: localStorage, keys prefixed `mathplay2:`;
  - speech: Web Speech API with the same natural-voice ranking, sentence queue, failed-voice fallback, iOS unlock on the first tap, and a stop when the tab is hidden;
  - session;
  - the `window.__mathplay` test hook.
- **UI pieces:** Button (fires on finger-up, so quick taps count), Narrator bubble with 🔊 replay, HintArrow + IdleHint (5-second reminder), PaintLayer (a RenderTexture brush that fills gaps on fast strokes) + DragSurface (keeps following the finger outside the area until it lifts).
- **Scenes:**
  - Home;
  - Quiz: generic, using any generator, with the how-to card, 10 questions, explanation on a wrong answer, stars and saved progress;
  - Pizza: write the number in sauce in any stroke order, judged by the result; too messy starts over; then spread the sauce with a meter; 2 pizzas per round, progress saved.
- **Deploy:** the GitHub Pages workflow now builds with Vite. A web app manifest sets landscape and fullscreen.
- **Walkthrough** (`e2e/p0.mjs`), all checks passing:

  | Size | Checks passed |
  |---|---|
  | Phone landscape, 844×390 | 14/14 |
  | Tablet, 1180×820 | 14/14 |
  | Laptop, 1366×768 | 13/13 (before the orientation check was added) |
  | Portrait phone | 1/1 |

**Findings**
- Drags, painting and taps behave without any of the old web workarounds (text selection, stale closures, missed quick taps).
- Phaser 4 RenderTextures need `render()` after stamping. That is noted in AGENTS.md, which now points at the guides that ship in `node_modules/phaser/skills/`.
- Phaser adds about 357 KB gzipped (in its own cached chunk). The game code is 26 KB.

**Still to check before calling P0 done:** play it on a real phone and tablet (touch feel, voice quality, fullscreen and orientation lock).

### P1 Foundation: built 2026-10-17 (branch `claude/phaser-p1`, on top of P0)

**What was done**
- **Players:**
  - Boot opens "Who's playing?" each visit, or the welcome screen when there are no players.
  - CreateProfile has a real text field over the canvas, so phones show their keyboard and Enter saves. Name is required; age 3–10 shows the band; buddy from 10 animals.
  - Home has a player chip to switch players.
  - Removing a player sits behind "Grown-ups: manage players": a keypad times-fact check (a wrong answer gets a new question), then a confirm. It deletes the player's progress, garden, log, adventure and play time.
- **Narration on/off per child:** on by default for ages 3–6, off for readers. 🔊/🔇 on Home, saved with the player. The narrator's 🔊 always reads.
- **Router:** `go()` / `back()` / `reset()` / `replay()` in BaseScene with a back history. The standard ← button comes from `addBackButton()`.
- **Sound effects:** correct/wrong chimes through Phaser's sound manager, loaded in Boot.
- **UI pieces:** StarRow, Dialog (a modal that blocks taps behind it), ParentGate.
- **Tests:**
  - Unit tests for the session service (on a stand-in localStorage) and the router: 296 in total.
  - The walkthroughs share `e2e/helpers.mjs`. `npm run e2e` runs them all:

    | Walkthrough | Phone | Tablet |
    |---|---|---|
    | `players.mjs` | 28/28 | 28/28 |
    | `games.mjs` | 14/14 | 14/14 |

    The portrait check passes 2/2.

**Still to check on a device (later, as agreed):** the phone keyboard over the name field in landscape, and sound volume next to speech.

### P2 Core learning loop: built 2026-10-17 (branch `claude/phaser-p2`)

**What was done**
- **World map** (placeholder art):
  - five island cards, each with passed / total for the child's band, mastered count and the next skill;
  - Daily Review when reviews are due;
  - the sticker book;
  - the player chip, narration switch and fullscreen.
- **Island scene:**
  - age-band tabs;
  - skill cards with stars, the next skill highlighted, 🔒 locked ("First, play …") and 🚧 Soon for games not rebuilt yet (`logic/skillRoutes.js` says which scene plays which skill).
- **Quiz scene, rebuilt for every generator:**
  - 11 picture types (`ui/QuestionVisual.js`): objects, sum, take-away, flashing dice/ten-frame dots, number staircase, pattern row, growing pattern, picture, listen, Sound Snack monster.
  - 4 answer types (`ui/QuizInputs.js`): choices (picture / letter / word / pattern styles), number line, word builder with tile sounds and blending, story strip.
  - Worked example until the skill is passed, plus ❓ for another.
  - Adaptive steps: 3 wrong → step down or a hint example; 5 right → level up, never beyond the child's band.
  - Practice / review / mixed modes, listening prompts always read aloud, and the explanation after a wrong answer.
  - Play-log events: answer, level, quit and round.
- **Results:** stars, score, passed / mastered / unlocked skills and new stickers. Again or back to the island.
- **Sticker book**, 12 to a page.
- **Logic:** `logic/quizRound.js` (answer checking, example narration, pacing, notes) and `logic/skillRoutes.js`. Stickers and round logging live in the session service.
- **Bugs the walkthroughs caught:**
  - storing the quiz's answer input in `this.input` overwrote Phaser's input system, so no taps worked;
  - Phaser reuses scene objects, so a finished round's step leaked into "Again".

  Both are now noted in AGENTS.md.

**Tests**
- 310 unit tests.
- `e2e/quiz.mjs` plays **every one of the 54 quiz skills** through map → island → quiz → results, with one wrong answer each, expecting 9/10 and 3 stars, plus screenshots. It takes about 5 minutes with `?fast`.
- `e2e/learning.mjs` checks the learning loop at normal speed:
  - island statuses and messages, and band tabs;
  - the worked example, the hint after 3 wrong, the level up after 5 right;
  - 2-star and 3-star results, passing, unlocking and stickers;
  - the quit log, and Daily Review mixing due skills;
  - the wrong-answer look for the number line, word builder, story strip and sums.
- `players.mjs` and `games.mjs` are updated for the map and islands.

**Not in P2 (later phases):** coach / play-together mode (P5), Fun Break tickets (P4), recorded letter sounds.

### P2.5 Architecture for change: built 2026-10-17 (branch `claude/architecture`)

Asked for before moving on: change assets easily, add languages easily, replace the device voice with recordings (later in other languages too), and keep the code modular with few shared files to conflict on.

**What was done**
- **Assets** (`services/assets.js`, `ui/Art.js`):
  - Images in `src/assets/images/` are keyed by path (`islands/math`, `skills/<id>`) or by emoji code point (`emoji/1f34e` replaces 🍎 everywhere), with `@<language>/` overrides.
  - Sounds in `src/assets/sounds/` are found by name.
  - Question pictures, picture answers, avatars, island and skill cards all draw through `art()` and fall back to the emoji.
- **Languages** (`i18n/`):
  - `t(key, values)` with plural forms (`Intl.PluralRules`), list joining (`Intl.ListFormat`) and English fallback.
  - Languages are found by folder, with `_meta.json` giving the name, text direction and speech code.
  - All UI text sits in per-feature JSON. Skill, island, band, game, how-to and coach words are in `curriculum.json`, and the curriculum data keeps only structure.
  - Text is drawn right-to-left for `rtl` languages.
  - Each child has a language; the picker appears on New Player once there are two or more.
- **Question content** (`content/`):
  - The five subject packs hold the word banks and `say` phrase functions, so each language handles its own grammar.
  - The generators are language-neutral.
  - A pack can replace generators; a language without a pack shows those skills as Soon.
- **Voice** (`services/voiceClips.js`, `services/speech.js`):
  - Sentences are spoken in a queue. A sentence with a recording (`src/voice/<language>/<clip id>.mp3`) plays the recording, and the rest use the device voice in the child's language (voice ranking now works for any language).
  - A watchdog keeps a stuck utterance from stalling the queue.
  - `npm run voice:lines -- <language>` writes a CSV of every line with its file name: 5,513 English lines, most common first.
- **Fewer conflicts:**
  - `scenes/registry.js` loads every `*Scene.js`; scenes name themselves with `static key`; games declare `static plays`.
  - Nothing central is edited to add a scene, game, language, pack, picture, sound or recording.
- **ESLint** (`npm run lint`), now also in CI.

**Checked**
- 328 unit tests, including:
  - every `t()` key exists in English;
  - other languages only use English keys, and their packs match English's;
  - skills without a pack are unavailable;
  - clip IDs, emoji keys, and voice ranking per language.
- A temporary recording and island image, built and opened in the browser: the map showed the image instead of 🔢; "Who's playing?" used the device voice, then "Tap your picture." played the recording. Both were removed afterwards.

**Not done yet**
- Mirroring layouts for right-to-left languages (only the text direction flips): to do with the first RTL language.
- Translating `index.html`'s loading and error messages (shown before the game loads).
- The old game logic's words (see above): moved as each game is rebuilt.
