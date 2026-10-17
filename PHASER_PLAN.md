# MathPlay → Phaser migration plan

- **Written:** 2026-10-17
- **Goal:** rebuild MathPlay as a Phaser game. We don't keep the Expo / React Native screens, components or assets. Islands get designed later, inside Phaser.
- **Engine:** Phaser 4 (4.1 "Salusa" is the latest release found, from April 2026). Bundled with Vite.

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

**Recommendation:** port the logic rather than rewrite it. It doesn't depend on React, it's research-based and it's covered by tests, so moving it costs about a day. "No need to save the structure" still holds, because none of the UI layer survives.

---

## 3. Target architecture

```
mathplay/                 (new Vite project; replaces the Expo app at the end)
  index.html
  src/
    main.js               Phaser.Game config, scale, scene list
    logic/                ported curriculum/ + utils/ (unchanged, tested)
    services/
      storage.js          localStorage on web, Capacitor Preferences on native
      speech.js           Web Speech API; native TTS plugin on device (port of speechEngine/voices)
      audio.js            sound effects through Phaser's sound manager
      session.js          active profile, progress cache, play-time limits
    ui/                   Phaser UI kit (see 3.2)
    scenes/               one file per scene (see 3.3)
    parent/               HTML overlay for the grown-up area (see 3.4)
  public/assets/          atlases, audio, fonts
  tests/                  vitest unit tests + Playwright scene tests
```

### 3.1 Core decisions (recommended defaults; flag any you want changed)

| Topic | Recommendation | Why |
|---|---|---|
| Language | Plain JS (ES modules), with JSDoc where it helps | The ported logic is JS, so no conversion step |
| Layout | **Landscape, 1280×720 design size, `Scale.FIT`** with a safe area | Kids mostly play on tablets and phones held sideways, and it suits game scenes. The current app is portrait, so this needs your OK |
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
- **Saved data:** existing players' progress isn't carried over (fresh start, as agreed). The storage keys get a version prefix, so later changes can migrate.

---

## 4. Phases

Each phase ends with tests passing, a web build, a Playwright walkthrough and a PR.

| Phase | Scope | Done when |
|---|---|---|
| **P0 Spike** | Vite + Phaser 4 project. Port `logic/`. Build one quiz skill (Count to 5) and the Pizza sauce trace (PaintLayer + TraceLayer). Try it on a phone and a tablet | Drags, painting and TTS feel right on touch; layout and orientation confirmed |
| **P1 Foundation** | Scale/safe area, storage, speech, audio, session, SceneRouter, UI kit, test bridge. Profiles and CreateProfile scenes. GitHub Pages deploy of the new build at `/KidsMathApp/next/`, with the old app still live at `/KidsMathApp/` | A child can pick a profile and hear the greeting |
| **P2 Core learning loop** | WorldMap and Island placeholders. The generic Quiz scene with every question visual and input type. Worked examples, Results, stars, stickers, adaptive steps, review and mixed rounds | Every quiz skill in all 5 subjects is playable and saves progress |
| **P3 Writing & drag games** | TraceDigits, Bee Paths, Race Track, Pizza Shop (full flow: stations, oven drag, slices, feeding), Birthday Cake | The sprouts (3–4) math band is fully playable |
| **P4 Remaining games** | Memory Chips (+ setup, buddy), Bunny Pop, Freeze Zoo, Robo Path, Push & Roll, Feelings Friends, Garden, Balloon Breath, Bubble Pop, Dance Tap, Chip Toss | Every skill and mini-game from the old app exists |
| **P5 Sessions & grown-ups** | Today's Adventure + coach mode, soft time limits, TimeUp, parent overlay (dashboard, report, CSV, limits, voices) | Matches the old app feature for feature |
| **P6 Switch over** | Move the new build to `/KidsMathApp/`. Delete the Expo app, React deps and old walkthroughs. Update README, PLAYTEST.md, PLAN.md, AGENTS.md (Phaser docs instead of Expo) | One codebase |
| **P7 Islands & art** | Design the islands in Phaser: tilemap or illustrated islands, camera scrolling, the stage path, avatar, chest. Plus the art pass, sound and music | Your island design, done properly |
| **P8 Native apps** | Capacitor iOS/Android builds, native TTS and storage, app icon, store builds (the old Phase 8) | Installable apps |

Old **Phase 5b** play-test rounds pause during P0–P5, then continue on the Phaser build. **Phase 7** (curriculum gaps) is mostly logic and generator work, so it can run alongside from P2.

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| TTS differs between browsers and devices | Port the existing voice ranking. P0 tests it on a real phone. Native plugin under Capacitor |
| Without art, everything looks worse than the emoji version | Placeholder sprites with a consistent palette from P1. Art pass in P7 |
| Text input (names) on a canvas | DOM input element over the canvas |
| A rewrite stalls feature work | The old app stays live until P6. The logic keeps its tests the whole time |
| Bundle size on slow connections | Phaser custom build, plus atlases loaded per scene |
