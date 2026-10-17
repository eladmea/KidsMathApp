# MathPlay 🧮

Learning games for kids ages 3-10, built around a research-based skill map (learning trajectories, spaced review, read-aloud prompts for pre-readers).

> **Being rebuilt in [Phaser 4](https://phaser.io)** (landscape, phones and tablets). See [PHASER_PLAN.md](PHASER_PLAN.md).
> Right now (phase P1) the Phaser build has players ("Who's playing?", new player, a grown-up check to delete one) and two games: *Count to 5* and the *Pizza Shop* sauce step.
> The feature list below describes the old Expo app, kept in [`legacy/`](legacy/) for reference. It is the target the rebuild works towards.

## Features

- **Player profiles** — "Who's playing?" picker; each child has a name, age (3-10) and animal buddy. Age sets their band: 🌱 Sprouts 3-4, 🧭 Explorers 5-6, 🧱 Builders 7-8, 🏆 Masters 9-10. Progress is saved per child.
- **Read-aloud narration** — prompts are spoken with `expo-speech` in the most natural English voice the device has (grown-ups can pick another in the parent dashboard) (on by default for ages 3-6, toggle 🔊/🔇 on the map). A 🔊 button in every round repeats the question.
- **World map** — subject "islands" (Number Island, Word Woods, Nature Bay, Puzzle Peak, Feelings Garden), a big "▶ next skill" button, and a ⭐ Daily Review button when skills are due.
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
- **Parent dashboard** — behind a grown-up check (type the answer to a times fact): today's and this week's play time, a daily limit per child, "10 more minutes", progress per island, skills still being practiced, and the read-aloud setting.
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

```
index.html                Page shell: full-screen canvas, notch insets, "turn your device" screen
vite.config.js            Build (BASE_URL sets the GitHub Pages path) and test settings
src/main.js               Phaser game config: Scale.EXPAND around a 1280 x 720 safe area, scene list
src/curriculum/           Skill map, age bands, subjects, question generators, phonics, how-to texts (copied from the old app)
src/logic/                Game rules with no UI: progress/mastery/review, adaptive, adventure, sessions, tracing, writing games, memory game, ...
src/services/             storage (localStorage), speech (Web Speech API, best natural voice, per-child narration on/off),
                          session (players, signed-in child, progress), router (back history), audio (sound effects), testBridge
src/ui/                   BaseScene (safe-area camera, go/back/reset, ← button), Button, Narrator, StarRow, Dialog,
                          ParentGate (keypad times-fact check), HintArrow + IdleHint, PaintLayer + DragSurface, theme
src/scenes/               Boot, Profiles ("Who's playing?"), CreateProfile, Home, Quiz (any generator skill), Pizza
public/                   Web app manifest, Home Screen icons, sounds
tests/                    Vitest unit tests for curriculum and logic
e2e/                      Playwright walkthroughs (players, games) through the window.__mathplay test hook; run.mjs runs them all
legacy/                   The old Expo app (reference only; not built or deployed)
```

## Play online

The web version is published to GitHub Pages at **https://eladmea.github.io/KidsMathApp/** and works on any phone, tablet or computer with a browser. It's landscape only. On a phone, use "Add to Home Screen" to open it full screen like an app. Progress is saved per device and browser.

Publishing is automatic (`.github/workflows/deploy-pages.yml`):
- every pull request runs the tests and checks the build;
- every push to `main` (e.g. merging a PR) rebuilds and redeploys the site within a few minutes.

One-time setup: make the repository public (or use a paid plan), set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**, and make `main` the default branch.

⚠️ The Source must be **GitHub Actions**, not "Deploy from a branch". With "Deploy from a branch", GitHub also publishes the raw repository files on every push, and whichever deploy finishes last wins. The raw `index.html` points at `/src/main.js`, which only works on the dev server, so the live site shows just a blank page.

`.github/workflows/smoke-live.yml` opens the live site in Chromium after every deploy. It fails, logging the broken download or script error, when the game doesn't start.

## Running the app

```bash
npm install
npm run dev        # http://localhost:5173, open it on a phone on the same Wi-Fi with --host
npm test           # unit tests
```

Browser walkthrough (needs a Playwright browser, e.g. `npx playwright install chromium`):

```bash
BASE_URL=/KidsMathApp/ npm run build && npx vite preview --port 8765 &
URL=http://localhost:8765/KidsMathApp/ npm run e2e    # every walkthrough at phone, tablet and portrait sizes
node e2e/players.mjs shots 844 390 phone             # or one walkthrough at one size
```

### Test hook

Text on a canvas can't be read by browser tests, so `src/services/testBridge.js` puts `window.__mathplay` on the page. It shows:

- the active scene, and what that scene reports (`state`);
- every line read aloud (`spoken`);
- `box(name)` for tagged buttons and play areas, in page pixels;
- `toPage(x, y)` to turn game coordinates into page pixels.

## Adding recorded letter sounds

Isolated letter sounds are hard for text-to-speech, so Word Builder tiles use tuned spellings ("mmm", "buh") by default. Recorded letter sounds will come back with the Word Builder scene (P2). The old app's hook is `legacy/utils/phonemeAudio.js`.
