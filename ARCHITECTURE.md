# MathPlay architecture

How the game is put together, and how to make the common changes. The rule
throughout: **things are found by folder, not listed in code**, so a change
means adding or replacing files. Two features rarely touch the same file.

```
src/
  main.js                 game config (scenes come from scenes/registry.js)
  scenes/                 one file per screen: *Scene.js registers itself
  ui/                     shared pieces (BaseScene, Button, Narrator, Art, inputs, visuals)
  services/               session, storage, speech, voiceClips, assets, audio, router, testBridge
  logic/                  game rules with no Phaser (unit-tested)
  curriculum/             skills, subjects, age bands, question generators (no words)
  i18n/<language>/*.json  every word on screen, one file per feature
  content/<language>/*.js question content per subject: words, sentences, word banks
  voice/<language>/       recorded sentences (optional, replaces the device voice)
  assets/images/          pictures by key (optional, replaces emoji)
  assets/sounds/          sound effects by name
```

---

## Change a picture

Drop an image (PNG, WebP, JPG or SVG) into `src/assets/images/`. Its path is its key:

| File | Replaces |
|---|---|
| `islands/math.png` | the Number Island picture on the map |
| `skills/math-pizza.png` | the Pizza Shop card on its island |
| `emoji/1f34e.png` | the 🍎 emoji everywhere a picture is drawn: questions, picture answers, avatars |
| `@he/islands/math.png` | that picture, but only in Hebrew (art with words on it) |

Emoji file names are the emoji's code points in hex, joined with `-`. Variation selectors are dropped. For example:

| Emoji | File name |
|---|---|
| 🍎 | `1f34e` |
| 🐻‍❄️ | `1f43b-200d-2744` |
| ❤️ | `2764` |

`emojiKey()` in `services/assets.js` works out the name for you. Anything without a picture keeps its emoji, so art can arrive one file at a time.

In code, draw pictures with `art(scene, x, y, { key, emoji, size })` or `glyph(scene, x, y, emoji, size)` from `ui/Art.js`, never with `add.text(emoji)`. That way a picture can be swapped without a code change.

Sound effects go in `src/assets/sounds/<name>.wav|mp3|ogg`, and you play them with `play(scene, '<name>')`.

Colours and the font live in `ui/theme.js`.

---

## Add a language

1. **UI text.** Copy `src/i18n/en/` to `src/i18n/<code>/`, for example `he`. Translate the JSON values but keep the keys.
   - In `_meta.json`, set `name` (shown in the picker), `dir` (`"rtl"` for Hebrew or Arabic) and `speech` (the BCP 47 code for voices, for example `"he-IL"`).
   - Keys you leave out fall back to English.
   - Plurals are objects with forms `one` / `two` / `few` / `many` / `other` (`Intl.PluralRules`), and `{name}` fills in a value.
2. **Question content.** Add `src/content/<code>/<pack>.js` for each subject the language has: `math`, `literacy`, `science`, `logic`, `sel`.
   - A pack exports the same names as the English one: the data tables plus `say`, the phrase functions.
   - Phrase functions are plain JavaScript, so each language handles its own grammar (plural nouns, Hebrew number gender, word order).
   - A pack can also export `generators` to replace a question generator for that language, for example a different reading curriculum. Then it doesn't need to match English's data.
   - A subject without a pack shows its quiz skills as 🚧 Soon in that language. A question never comes out in the wrong language.
3. **That's all.** The language picker appears on "New player" once there's more than one language, and each child keeps their own. Grown-ups can change a child's language on the Parent Dashboard.

`npm test` checks the language files:
- every key the code uses exists in English;
- other languages only use keys English has;
- other packs offer what English's do.

Right-to-left (`dir: "rtl"`, e.g. Hebrew):
- Every Phaser text is drawn right to left by `ui/rtlText.js` (rules in `logic/bidi.js`). Don't use Phaser's own `rtl` style: it right-aligns every line.
- Sums stay left to right inside a sentence ("כמה זה 5 − 2?"), and lines with no Hebrew letters are untouched.
- The page's `lang` and `dir` follow the language, so name fields and notes type right to left.
- Layouts are not mirrored: pictures, number lines and sums read left to right in Hebrew too. Rows the child reads in order (quiz answers, Word Builder slots and tiles, story panels) run right to left, so the first one read aloud is on the right (`side()` in `ui/QuizInputs.js`).
- Hebrew text addresses the child in the plural ("בחרו", "בואו נספור"), so it is never only for boys or only for girls.

---

## Record the voice

The game speaks sentence by sentence. Each sentence has a **clip ID** made from its text. A recording saved as `src/voice/<language>/<clip id>.mp3` (or `.m4a`, `.ogg`, `.wav`) plays instead of the device's text-to-speech. Anything not recorded still uses the device voice, so recordings can be added a few at a time.

English recordings are made with a free AI voice (Kokoro) by **`voice-generator/`**, a separate folder that isn't part of the game. Use it like this:

```bash
npm run voice:lines -- en --txt            # every sentence to record -> voice-generator/sentences_english.txt
cd voice-generator && python generate.py --install   # records the new ones, copies them into src/voice/en/
```

Hebrew works the same way with `he` and `sentences_hebrew.txt`, using a Hebrew Kokoro model (`--file sentences_hebrew.txt`). See `voice-generator/README.md` for setup.

`npm run voice:lines -- en` (without `--txt`) writes a CSV instead, with where each line is used. `--missing` lists only what isn't recorded yet.

**Writing text that is spoken.** Recordings are per sentence, so spoken text should reuse sentences:
- **No names in spoken lines.** "Hi! Pick an island to play.", not "Hi, Mia!". The screen can still show the name: `narrator.say(spoken, { show: shown })`.
- **Put what varies in its own short sentence.** "Bear wants a pizza! Three toppings, please!" rather than one sentence with both. Read choices as one sentence each ("Ring. Tree. Or goat?") and numbers on their own ("Which number is bigger? 81. Or 64?").
- **A new spoken template** (`{count}` and so on) needs its values listed in `templateValues()` in `src/services/voiceLines.js`. Game phrases from a content pack are listed in the same file. `npm test` fails if a spoken template has no values.
- **Questions for ages 7-10 aren't recorded.** Those children read for themselves (read-aloud is off by default), so their questions use the device voice when 🔊 is tapped.

Letter sounds for Word Builder (`soundSpeech` in the literacy pack: "mmm", "buh") are sentences too, so they are recorded the same way.

---

## Add a screen or a game

1. Create `src/scenes/<Name>Scene.js` extending `ui/BaseScene.js` with `static key = '<Name>'`. It is registered automatically.
2. A game that plays skills declares them: `static plays = ['PizzaShop']`, matching the skills' `screen` in `curriculum/skills.js`. Its island cards then open it instead of showing 🚧 Soon. `npm test` fails if a skill names a screen no scene plays.
   - For a game round, BaseScene gives you:
     - `addGameHeader(skill)` (title and counter) and `setCounter(index, total, score)`;
     - `finishRound(skillId, score, total)`, which opens Results, saves the round and offers "Again".
   - `ui/RulesCard` explains a game before Go, and `ui/GameEnd` is a mini-game's last card.
3. **Text:**
   - Put it in `src/i18n/en/<feature>.json` (a new file, so it doesn't conflict) and read it with `t('<feature>.<key>', values)`.
   - Words that belong to the game's content (names, word lists, stories) go in a content pack instead.
4. **Pictures:** use `art()` / `glyph()`.
5. **Rules:** put them in `src/logic/` with unit tests, free of Phaser.
6. **Browser test:** `tag()` what a test must tap, `report()` the scene's state, and add a walkthrough under `e2e/`.

## Add a quiz skill

1. Add the skill to `curriculum/skills.js`: `id`, `subject`, `band`, `emoji`, `generator`, `prereqs`.
2. Add its title to `i18n/en/curriculum.json` (`skills.<id>`), and its how-to line under `howTo.<generator>`.
3. Write the generator in the subject's `*Generators.js`. Read its words from the pack (`content('<pack>')`) and add the words and `say` phrases to `content/en/<pack>.js`.

---

## Rules that keep it safe to change

- **Never edit a shared list to add something.** Scenes, languages, content packs, pictures, sounds and recordings are all found by folder.
- **No words in code.** Text goes through `t()` (UI) or a content pack (questions). `npm test` fails on a missing key.
- **No emoji drawn directly.** Use `art()` / `glyph()`.
- **Game rules stay free of Phaser** (`src/logic`, `src/curriculum`), so `npm test` covers them.
- **Scenes:**
  - Phaser reuses a scene object, so set every field fresh in `build()`.
  - Never name a field after a Phaser scene property (`this.input`, `this.time`, `this.sound`, …).
  - Navigate with `go()` / `back()` / `swap()` / `reset()`.
- **Before a PR:** `npm run lint`, `npm test`, and the walkthroughs (`npm run e2e` against a build; see README).
