# MathPlay 🧮

Learning games for kids ages 3-10, built around a research-based skill map (learning trajectories, spaced review, read-aloud prompts for pre-readers).

> Built with [Phaser 4](https://phaser.io) for landscape phones and tablets (and any browser). [PHASER_PLAN.md](PHASER_PLAN.md) has the plan and what each phase built; [ARCHITECTURE.md](ARCHITECTURE.md) explains how to change things. The old Expo app it replaced is in the git history (up to commit `86c82f2`).

## Features

- **Player profiles** — "Who's playing?" picker; each child has a name, age (3-10) and animal buddy. Age sets their band: 🌱 Sprouts 3-4, 🧭 Explorers 5-6, 🧱 Builders 7-8, 🏆 Masters 9-10. Progress is saved per child.
- **Read-aloud narration** — prompts are read aloud in the most natural voice the device has (Web Speech API; grown-ups can pick another in the parent dashboard), or from recordings where they exist (see ARCHITECTURE.md). On by default for ages 3-6, toggle 🔊/🔇 on the map. A 🔊 button in every round repeats the question.
- **World map** — five drawn islands in the sea (Number Island, Word Woods, Nature Bay, Puzzle Peak, Feelings Garden) with each child's progress and their avatar, plus Today's Adventure, and a ⭐ Daily Review button when skills are due. Each island is a winding road of skill stops (locked, ready, passed with stars, mastered) ending in a treasure chest that opens once every stop is passed.
- **Skill map** (`curriculum/skills.js`) — ordered skills per subject and band with prerequisites, from *Count to 5* and *Find the Shape* up to *Big Division*. Skills unlock when their same-band prerequisites are passed; kids can peek at other bands.
- **Mastery + spaced review** — a round is passed at ≥ 80%. A skill is **mastered** after passing on **2 different days**. Passed skills return in Daily Review on a Leitner schedule (1, 2, 4, 8, 16 days), interleaving several skills in one round.
- **Worked examples** — until a child passes a skill, each practice round opens with "Let's try one together!": how to play, a question with the answer shown, and why. A ❓ button shows another example any time.
- **Generic quiz engine** — one generator per skill (`curriculum/generators.js`) with optional pictures (count the apples, add two groups, fade out the "taken away" ones), 2-4 big answer buttons, green/red feedback with sounds.
- **Word Woods (reading)** — Rhyme Time, Sound Snack (feed the monster the right first sound), Letter Sounds, Sight Words, Word Builder (letter tiles that play their sounds and blend back into the word), digraph and vowel-team words, Story Strip (put panels in order), Compound Words and Word Parts. Listening tasks are always read aloud.
- **Nature Bay (science)** — Dress for Weather, Where Do I Live?, What Plants Need, Push or Pull?, Push & Roll (hold to push harder and roll farther), Life Cycles, Solid/Liquid/Gas, Food Chains and My Amazing Body.
- **Puzzle Peak (logic)** — Bunny Pop (ages 3-4: whack-a-mole, boop only the bunny), Freeze Zoo (ages 5-6: tap / freeze with a rule switch), a pattern ladder for every age (fill the gap in AB → longer patterns → same pattern in new things → which part repeats → growing patterns → pattern position and number rules), Robo Path and Robot Loops (program a robot with arrow and repeat blocks) and Logic Grids.
- **Garden Days** — grow a plant over real days by reading its daily clue (water, sunlight or soil); it grows one stage per day until it blooms.
- **Number Tracing** — ages 3-4 trace the digits with a finger from a green dot, stroke by stroke, after a pencil shows how (*Write 1 to 5*, then *Write 6 to 9 and 0*).
- **Writing games (ages 3-4)** — 🐝 Bee Paths (pre-writing strokes: down, across, rainbow, circle, cross), 🏁 Race Track Numbers (drive along the digit), 🍕 Pizza Shop (an animal orders a number: roll the dough, write it in sauce, spread sauce and cheese, drag that many toppings, drag the pizza into the oven, slice and feed it; an ingredient bar shows the step, and an arrow reminds the child after 5 seconds) and 🎂 Birthday Cake (write the age in icing, drag the candles, blow them out).
- **Quick Look & Number Line Drop** — subitizing (dots flash, then hide) and number-line estimation (tap where 37 goes on 0-100) skills.
- **Memory Chips** — the number-matching memory game with the bonus-chip twist (see below), now in 6 variants (Dot, Letter, Classic, Plus & Minus, Times & Divide, Fraction Chips), played solo against an AI 🤖 Buddy or with a friend.
- **Number Path Race** — a linear 1-10 / 1-20 number board game: spin, then tap and hear each square you hop through.
- **Feelings Garden (social-emotional)** — Feelings Faces, How Would You Feel?, Feelings Friends (name a friend's feeling, then pick what would help), Fair Play and In Their Shoes.
- **Fun Break** — Bubble Pop, Chip Toss and Dance Tap mini-games. Every 2 learning rounds earn a 🎟️ ticket; each mini-game costs one. **Balloon Breath** (hold to breathe in, let go to breathe out) is a calm-down and always free.
- **Sticker book** — a sticker for passing a skill the first time, a gold one for mastering it, and a flower when a Garden Days plant blooms. Stickers come after the thinking; there is no shop.
- **Parent dashboard** — "Who's playing?" → 👪 Grown-ups, behind a grown-up check (type the answer to a times fact): today's and this week's play time, a daily limit per child, "10 more minutes", progress per island, skills still being practiced, the read-aloud setting and voice, and the play-test report.
- **Soft daily time limit** — about 15 minutes for ages 3-5 and 20 for 6-10 by default (changeable or off). A ⏰ note appears in the last 5 minutes. When time is up the current round can finish, then a gentle goodbye screen offers Balloon Breath and "see you tomorrow".

- **Today's Adventure** — a guided daily session from the map: warm-up review, a new skill, mixed practice, a free mini-game, a second subject and a Balloon Breath cool-down. Subjects rotate by day, rounds are short, and it shrinks to fit the time left today.
- **Play together** — a coach-mode toggle on the map. After each quiz answer a grown-up gets a "Talk about it" prompt, and the next question waits for them.
- **Adaptive difficulty** — in practice rounds, 3 wrong answers in a row step down to the easier skill with a worked example; 5 right in a row step up.
- **Play-test tools** — every answer is logged on the device (time, replays, level, quits). The parent dashboard's 🧪 Play-test report flags skills that look too hard, too easy, unclear or abandoned, keeps session notes, and exports CSV. See [PLAYTEST.md](PLAYTEST.md) for how to run a play-test.

All five islands and the games are playable.

See [PLAN.md](PLAN.md) for the full roadmap, the research behind it, and the implementation log.

## Memory Game rules

Two players (🦁 Player 1 and 🐸 Player 2) take turns flipping two cards from a 6x4 grid of numbers 1-12 (each number appears twice — 24 cards, 12 pairs). The current player's turn is always shown with their color and animal icon so it's obvious whose go it is.

- **Natural match** (both cards show the same number): the pair is cleared, the player scores a point, and they go again.
- **Mismatch** (e.g. 2 and 5): if the player has enough chips to attempt it, they're asked to *calculate* the gap themselves — "how many chips does it take to turn 2 into 5?" — with no cost shown up front. They pick their answer from every number between 1 and however many chips they currently have (so the real answer is always among the options), or tap **⏭ Skip** to walk away without risking any chips.
  - **Guess correctly**: they pay that many chips, the pair is cleared and scored, and those chips are handed to the *other* player — but the turn still passes to the other player (using chips costs you your extra turn, unlike a natural match).
  - **Guess wrong**: they still lose that many chips (gone for good, not given to anyone), the pair flips back face-down and stays in play, and the turn passes to the other player. Wrong math has a real cost.
  - **Skip**: no chips are risked, the pair flips back face-down, and the turn passes.
- **The twist**: forcing a match like 2→5 uses up the board's other "2" and "5" cards' natural partners, leaving an orphaned pair elsewhere with the same 3-chip gap. The chips the first player paid land in the other player's pile — exactly enough for them to close that same gap later, if they calculate it correctly too.
- Each player starts with 🪙 chips equal to the number of pairs on the board (12, by default) — bigger boards mean a bigger bonus-chip pool. If a player doesn't have enough chips to even attempt the gap, the cards just flip back and the turn passes — no guess is offered.
- The game ends when all cards are matched, or when no natural pair is left and nobody has enough chips to close any remaining gap; whoever found the most pairs wins.
- **Variants** — every card has a hidden value and a face. Dot Chips pairs dots with numerals (6 pairs, chips counted out by tapping), Letter Chips pairs letters a-f with pictures that start with them (the gap is counted in alphabet steps), Plus & Minus / Times & Divide Chips pair a fact with its answer (so you work out each card before the gap), and Fraction Chips pair equivalent fractions (each chip is 1/8).
- **Solo mode** — play against 🤖 Buddy, who remembers only some cards and sometimes gets the gap wrong; Buddy gets sharper for older age bands.

## Project structure

How to change pictures, add a language, record the voice, or add a screen or skill: see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

```
index.html                Page shell: full-screen canvas, notch insets, "turn your device" screen
vite.config.js            Build (BASE_URL sets the GitHub Pages path) and test settings
src/main.js               Phaser game config: Scale.EXPAND around a 1280 x 720 safe area, scene list
src/curriculum/           Skill map, age bands, subjects and question generators: structure and logic, no words
src/i18n/<language>/      Every word on screen, one JSON file per feature (+ _meta.json)
src/content/<language>/   Question content per subject: word banks, stories, and how each question is said
src/voice/<language>/     Recorded sentences that replace the device voice (optional; npm run voice:lines)
src/assets/               Pictures (by key or emoji, optional) and sound effects, found by folder
src/logic/                Game rules with no UI: progress/mastery/review, adaptive, adventure, sessions, tracing, writing games, memory game, ...
src/services/             storage (localStorage), speech (recordings first, then the best device voice for the child's language,
                          per-child narration on/off), voiceClips, assets (images and sounds by folder),
                          session (players, signed-in child, progress), router (back history), audio (sound effects), testBridge
src/ui/                   BaseScene (safe-area camera, go/back/swap/reset, ← button), Button, Narrator, StarRow, Dialog,
                          ParentGate (keypad times-fact check), HintArrow + IdleHint, PaintLayer + DragSurface, theme,
                          TraceLayer + TraceRound (finger tracing), DragTray + CountPanel (drag a number of things),
                          RulesCard (a game's rules and Go), GameEnd (a mini-game's last card),
                          QuestionVisual (all 11 picture types), QuizInputs (choices, number line, word builder, story strip)
src/scenes/               Boot, Profiles ("Who's playing?"), CreateProfile, WorldMap, Island, Quiz, Results, StickerBook,
                          TraceDigits, TracePath (Bee Paths, Race Track), PizzaShop, BirthdayCake, BunnyPop, FreezeZoo,
                          RoboPath, PushRoll, FeelingsFriends, Games, GameSetup, Memory, PathRace, Garden, FunBreak,
                          BubblePop, ChipToss, DanceTap, BalloonBreath
                          (every *Scene.js registers itself via scenes/registry.js)
public/                   Web app manifest and Home Screen icons
tests/                    Vitest unit tests for curriculum and logic
e2e/                      Playwright walkthroughs through the window.__mathplay test hook: players, games, learning (the learning
                          loop), writing (the tracing games), pizza (Pizza Shop, Birthday Cake), thinking (Bunny Pop, Freeze Zoo, Robo Path,
                          Push & Roll, Feelings Friends), fun (Games, Fun Break and tickets), grownups (adventure, time limit,
                          dashboard), islands (map, stops, chest), quiz (every quiz skill once), smoke (a deployed site); run.mjs runs them all
```

## Play online

The web version is published to GitHub Pages at **https://eladmea.github.io/KidsMathApp/** and works on any phone, tablet or computer with a browser. It's landscape only. On a phone, use "Add to Home Screen" to open it full screen like an app. Progress is saved per device and browser.

Publishing is automatic (`.github/workflows/deploy-pages.yml`):
- every pull request runs the tests and checks the build;
- every push to `main` (e.g. merging a PR) rebuilds and redeploys the site within a few minutes.

One-time setup: make the repository public (or use a paid plan), set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**, and make `main` the default branch.

⚠️ The Source must be **GitHub Actions**, not "Deploy from a branch". With "Deploy from a branch", GitHub also publishes the raw repository files on every push, and whichever deploy finishes last wins. The raw `index.html` points at `/src/main.js`, which only works on the dev server, so the live site shows just a blank page.

`.github/workflows/e2e.yml` runs every browser walkthrough on pull requests and on main, each on its own machine at the same time (about as long as the slowest one, Quiz). A failed walkthrough uploads its screenshots to the run.

`.github/workflows/smoke-live.yml` opens the live site in Chromium after every deploy. It fails, logging the broken download or script error, when the game doesn't start.

## Running the app

```bash
npm install
npm run dev        # http://localhost:5173, open it on a phone on the same Wi-Fi with --host
npm test           # unit tests
npm run lint       # ESLint
npm run voice:lines -- en   # every line to record, with file names (voice-lines.en.csv)
```

Browser walkthrough (needs a Playwright browser, e.g. `npx playwright install chromium`, or an installed Chromium named by `CHROMIUM=/path/to/chromium`):

```bash
npm run e2e:local                       # builds, serves the build itself, runs every walkthrough at phone,
                                        # tablet and portrait sizes, then stops the server. Runs several at
                                        # once (half the CPUs, up to 4; E2E_JOBS=n to change): ~22 min on
                                        # 4 CPUs, ~35 min with E2E_JOBS=1
npm run e2e:local -- --only quiz.mjs:laptop   # just one (node e2e/run.mjs --list shows the names)
node e2e/players.mjs shots 844 390 phone    # or one walkthrough at one size, against a server you run
                                            # (npx vite preview --port 8765 after a BASE_URL=/KidsMathApp/ build)
```

Add `?fast` to the address to run the game's timers and animations 8x faster (the every-skill walkthrough uses it).

### Test hook

Text on a canvas can't be read by browser tests, so `src/services/testBridge.js` puts `window.__mathplay` on the page. It shows:

- the active scene, and what that scene reports (`state`);
- every line read aloud (`spoken`);
- `box(name)` for tagged buttons and play areas, in page pixels;
- `toPage(x, y)` to turn game coordinates into page pixels.

## Adding recorded letter sounds

Isolated letter sounds are hard for text-to-speech, so Word Builder tiles use tuned spellings ("mmm", "buh"). Those spellings are sentences like any other, so recording them replaces the device voice: see "Record the voice" in [ARCHITECTURE.md](ARCHITECTURE.md).
