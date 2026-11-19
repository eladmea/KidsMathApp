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
  assets/atlases/         texture atlases of pictures by key (the Fluent emoji)
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

The emoji pictures are Microsoft Fluent Emoji (3D), packed into a few texture atlases in `src/assets/atlases/` so the game starts quickly (one picture file per emoji meant hundreds of downloads before the first screen). After adding a new emoji anywhere in `src/`, run `npm run art:fluent -- <path to a fluentui-emoji checkout>` (the script's header says how to get one) to rebuild them. A picture in `images/emoji/` still wins over the atlas, so a hand-made one stays.

In code, draw pictures with `art(scene, x, y, { key, emoji, size })` or `glyph(scene, x, y, emoji, size)` from `ui/Art.js`, never with `add.text(emoji)`. That way a picture can be swapped without a code change.

A picture from `art()` / `glyph()` may already be scaled to fit its `size`, so grow or shrink it relative to its own `.scale` (`setScale(item.scale * 1.2)`, or tween to the scale it started with), never to a fixed `1`.

For a line of text with emoji in it (a counter like "2 / 5 ⭐ 3", a star row, a header), use `new IconText(scene, x, y, text, style)` from `ui/IconText.js` instead of `add.text`. Each emoji that has a picture is drawn as that picture, and the rest stays text. It takes one line (no word wrap) and has `setText()` and `setOrigin()` like a Text. In Hebrew, the pictures follow the text's right-to-left order.

Sound effects go in `src/assets/sounds/<name>.wav|mp3|ogg`, and you play them with `play(scene, '<name>')`.

Colours and the font live in `ui/theme.js`. Text that must stand out on any background (a score, a number flying up) uses `popStyle(size, color)`, which adds an outline and a drop shadow.

Feedback animations live in `ui/Juice.js`, so every game feels the same: `celebrate(scene, x, y, { number })` on a right answer (sparkles, and the number rising), `oops(scene, x, y)` on a wrong one (a small camera shake and a fading puff, gentle on purpose), `popIn()` / `fadeIn()` for things arriving, `bob()` for a slow idle float, and `settle()` to stop those before a result animation. They follow `?fast`, and skip shaking and floating when the device asks for reduced motion.

---

## Make a picture with ComfyUI

New pictures are made on this PC's **ComfyUI** (`http://127.0.0.1:8188`, workspace `D:\AI\ComfyUI`) with the **DreamShaperXL Turbo-Lightning** model (`DreamShaperXL_Turbo-Lightning.safetensors`). They are drawn as 3D cartoon objects, glossy and simple, so they sit next to the game's Microsoft Fluent 3D emoji. **BiRefNet** (the `comfyui-rmbg` node pack, model `BiRefNet_toonout`) lifts each one off its page. Every agent making a picture uses `scripts/comfy-picture.mjs`, which holds the prompt and the settings, so the pictures stay one family. Canva (used up to November 2026) and PixelLab (pixel art only) are not used any more.

**1. Draw it.** ComfyUI must be running (start it with the comfy-mcp `launch_comfyui` tool, or `comfy launch --background`).

```bash
node scripts/comfy-picture.mjs <image key> "<subject>" [--seed N] [--page-only]
```

- `<subject>` is one thing, written as the game uses it (cornflour is a sack of white powder, not an ear of corn). The script puts it into the house prompt; don't change the prompt for one picture.
- The script sends ComfyUI its own workflow (no template), so these two prompts are all the model is told. `(word:1.4)` gives a word more weight.
  - Prompt: `(3D cartoon game icon:1.4) of a single <subject>, (inanimate food object:1.3), (stylized toy:1.2), simple rounded shapes, smooth glossy flat colours, minimal texture, bright saturated colours, flat even lighting, floating, centred, (pure white background:1.3)`
  - Negative prompt: `(face, eyes, mouth, smile, character, mascot, animal, bird:1.6), (photo, realistic, photorealistic:1.5), detailed texture, (shadow, drop shadow, cast shadow, floor, ground, reflection:1.4), text, label, letters, logo, watermark`
  - Settings: 1024 × 1024, 20 steps, CFG 7, `dpmpp_2m` / `karras`. To compare, the script takes `--steps`, `--cfg`, `--sampler`, `--scheduler`, `--model`, `--prompt`/`--negative` and `--tag` (added to the saved names); `--shape <png> --denoise N` repaints a simple drawing instead of starting from noise. Keep the house settings for game pictures.
- The model draws real-looking objects unless told "cartoon", and "cartoon" makes it give some foods a face (an onion, most often). Draw four seeds and keep one without a face. Writing "no face" or "no eyes" in the prompt draws one.
- Leave "chicken" out of a food's subject: it draws the bird. "Slice of raw pink poultry meat fillet (lying flat:1.2)" works.
- An egg comes out cracked, halved or with a face; "(whole closed egg:1.4), plain light brown oval, standing upright" gives an egg in an egg cup, which reads well.
- A bag or sack of white powder fills with sweets (the prompt's bright colours); "(heap of white flour:1.4) in a small wooden scoop" gives flour in a wooden bowl.
- "Flat even lighting" and "floating" keep the shadow faint; BiRefNet removes what's left.
- Bottles, jars and packets: describe a plain container ("plain red plastic squeeze bottle, blank smooth bottle") and leave the product's name out. With "no label" or the product's name, the model prints a label with nonsense letters.
- About 20 seconds a picture on the RTX 4060, and free, so draw a few seeds (`--seed 1` to `4` with `--page-only`) and keep the one that reads best at 56 px.
- Each try is saved in `.comfy-pages/` (not committed): `<key>.seed<N>.png` (the page) and `<key>.seed<N>.cut.png` (BiRefNet's transparent cutout).

**2. Into the game.** Without `--page-only`, the script finishes with `node scripts/picture-cutout.mjs <cutout> <image key>`. Run that yourself on the try you picked. It trims the margins and saves a 384 px WebP (about 25 KB) at `src/assets/images/<key>.webp`.
- Every picture loads when the game starts, so keep the 384 px size.
- One file per key: when a WebP replaces an SVG or PNG of the same key, delete the old file.
- Check the result on a dark and on a wooden background before committing. Scraps of shadow and a nibbled edge show up there.
- `picture-cutout.mjs` can still cut a picture off a plain white page itself (`--pale` for a light subject), for a page made without BiRefNet.

**Which key.** `emoji/<code points>` replaces that emoji everywhere in the game, and the emoji may mean something else in another game. A Kitchen Cove ingredient therefore uses `kitchen/food/<ingredient key>` instead (`food()` in `ui/KitchenArt.js`), with its emoji as the fallback. For example, 🌽 is the corn topping on a pizza but cornflour in the kitchen.

**Made so far** (add a line for each new picture):

| Key | Subject in the prompt | Seed |
|---|---|---|
| `emoji/1f32d` (🌭) | hot dog: a pink sausage in a long soft bread bun with a wavy line of ketchup | 1 |
| `kitchen/sausage` | plain cooked pink sausage | 3 |
| `kitchen/food/onion` | whole brown onion | 2 |
| `kitchen/food/garlic` | whole white garlic bulb | 3 |
| `kitchen/food/chicken` | slice of raw pink poultry meat fillet (lying flat:1.2) | 3 |
| `kitchen/food/ketchup` | red squeeze bottle of tomato sauce, plain blank red plastic body, white cap | 2 |
| `kitchen/food/egg` | (whole closed egg:1.4), plain light brown oval, standing upright | 2 |
| `kitchen/food/cornflour` | (heap of white flour:1.4) in a small wooden scoop, matte white powder | 4 |
| `kitchen/food/soySauce` | small glass bottle of dark brown sauce with a red cap, plain blank glass | 3 |
| `kitchen/food/oil` | tall glass bottle of golden yellow cooking oil, plain blank glass | 4 |

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
3. **That's all.** The language picker appears on "New player" once there's more than one language, and each child keeps their own. Grown-ups can change each child's language in the Parent Dashboard under ⚙️ Settings → 🌐 Language. The voice speaks the text's language. A separate voice language would mean producing every spoken line, questions included, in a second language, so it isn't built yet.

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
- **Older children's questions are recorded too**, so a level never mixes the recorded voice with the device voice. Only the skills where nearly every question has new numbers (adding and taking away within 100, the number line to 1000: `DEVICE_VOICE_GENERATORS` in `src/services/voiceLines.js`) use the device voice, for the whole level.

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

## Add a recipe (Kitchen Cove)

1. Add `src/logic/recipes/<id>.js`: its ingredients (key, emoji, `qty`, `unit`: `whole`, `cup`, `tbsp`, `tsp`, `ml` or `g`, `piece` grams for the scale, and `kept`: `fridge` or `cupboard`), its `prep` steps, how it is cooked and served, and its `source` URL. Leave `verified: null` until a person has checked every amount against the source page.
   - Measures are Israeli metric: 1 cup = 240 ml, 1 tablespoon = 15 ml, 1 teaspoon = 5 ml (`logic/kitchen.js`).
   - `npm test` checks the recipe at every age level (every amount can be measured with that level's tools).
2. Add a skill to `curriculum/skills.js` with `screen: 'Kitchen'` and `recipe: '<id>'`, and its title to `i18n/<language>/curriculum.json`.
3. Add the new ingredient names, the dish and any new step lines to `content/<language>/kitchen.js`.
4. Kitchen Cove is an open island (`open: true` in `curriculum/subjects.js`): every age sees every recipe, and the child's age band sets the level (`LEVELS` in `logic/kitchen.js`).

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
