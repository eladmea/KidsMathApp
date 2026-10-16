# MathPlay 🧮

A colorful Expo React Native learning-games app for kids ages 3-10, built around a research-based skill map (learning trajectories, spaced review, read-aloud prompts for pre-readers).

## Features

- **Player profiles** — "Who's playing?" picker; each child has a name, age (3-10) and animal buddy. Age sets their band: 🌱 Sprouts 3-4, 🧭 Explorers 5-6, 🧱 Builders 7-8, 🏆 Masters 9-10. Progress is saved per child.
- **Read-aloud narration** — prompts are spoken with `expo-speech` (on by default for ages 3-6, toggle 🔊/🔇 on the map). A 🔊 button in every round repeats the question.
- **World map** — subject "islands" (Number Island, Word Woods, Nature Bay, Puzzle Peak, Feelings Garden), a big "▶ next skill" button, and a ⭐ Daily Review button when skills are due.
- **Skill map** (`curriculum/skills.js`) — ordered skills per subject and band with prerequisites, from *Count to 5* and *Find the Shape* up to *Big Division*. Skills unlock when their same-band prerequisites are passed; kids can peek at other bands.
- **Mastery + spaced review** — a round is passed at ≥ 80%. A skill is **mastered** after passing on **2 different days**. Passed skills return in Daily Review on a Leitner schedule (1, 2, 4, 8, 16 days), interleaving several skills in one round.
- **Worked examples** — until a child passes a skill, each practice round opens with "Let's try one together!": how to play, a question with the answer shown, and why. A ❓ button shows another example any time.
- **Generic quiz engine** — one generator per skill (`curriculum/generators.js`) with optional pictures (count the apples, add two groups, fade out the "taken away" ones), 2-4 big answer buttons, green/red feedback with sounds.
- **Word Woods (reading)** — Rhyme Time, Sound Snack (feed the monster the right first sound), Letter Sounds, Sight Words, Word Builder (letter tiles that play their sounds and blend back into the word), digraph and vowel-team words, Story Strip (put panels in order), Compound Words and Word Parts. Listening tasks are always read aloud.
- **Nature Bay (science)** — Dress for Weather, Where Do I Live?, What Plants Need, Push or Pull?, Push & Roll (hold to push harder and roll farther), Life Cycles, Solid/Liquid/Gas, Food Chains and My Amazing Body.
- **Puzzle Peak (logic)** — Freeze Zoo (tap / freeze self-control game with a rule switch), patterns, Robo Path and Robot Loops (program a robot with arrow and repeat blocks) and Logic Grids.
- **Garden Days** — grow a plant over real days by reading its daily clue (water, sunlight or soil); it grows one stage per day until it blooms.
- **Quick Look & Number Line Drop** — subitizing (dots flash, then hide) and number-line estimation (tap where 37 goes on 0-100) skills.
- **Memory Chips** — the number-matching memory game with the bonus-chip twist (see below), now in 6 variants (Dot, Letter, Classic, Plus & Minus, Times & Divide, Fraction Chips), played solo against an AI 🤖 Buddy or with a friend.
- **Number Path Race** — a linear 1-10 / 1-20 number board game: spin, then tap and hear each square you hop through.
- **Fun Break** — Bubble Pop, Chip Toss and Dance Tap mini-games. Every 2 learning rounds earn a 🎟️ ticket; each mini-game costs one.

Number Island, Word Woods, Nature Bay, Puzzle Peak and the games are playable now; Feelings Garden shows its planned games as "coming soon".

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
App.js                    Providers + navigation stack
app.config.js             Sets the web base path for the GitHub Pages build
.github/workflows/        Test + deploy to GitHub Pages
scripts/prepare-pages.js  Manifest, Home Screen icons, 404 page for Pages
context/
  ProfileContext.js       Profiles, active player, progress (AsyncStorage-backed)
curriculum/
  ageBands.js             Age bands (3-4, 5-6, 7-8, 9-10)
  subjects.js             Subject islands
  skills.js               Skill map with prerequisites
  generators.js           Question generator per skill (math) + registry
  scienceGenerators.js    Nature Bay questions
  logicGenerators.js      Puzzle Peak questions (patterns, logic grids)
  literacyGenerators.js   Question generators for Word Woods
  phonics.js              Word banks, letter sounds, stories
  random.js               Shared random helpers
  games.js                Learning games + mini-games catalogue
screens/
  ProfilesScreen.js       Who's playing?
  CreateProfileScreen.js  New player
  WorldMapScreen.js       Home: islands, next skill, daily review
  SkillListScreen.js      Skills of one island, by band
  QuizScreen.js           Generic skill-driven round
  ResultsScreen.js        Stars, mastered/unlocked celebration
  GameSetupScreen.js      Pick a game variant + Buddy or a friend
  MemoryGameScreen.js     Memory Chips (all variants, solo or duo)
  PathRaceScreen.js       Number Path Race
  MiniGamesScreen.js      Fun Break hub (tickets)
  BubblePopScreen.js / ChipTossScreen.js / DanceTapScreen.js
  FreezeZooScreen.js / RoboPathScreen.js / PushRollScreen.js   Game-screen skills
  GardenScreen.js         Garden Days
components/               Buttons, cards, QuestionVisual, DotPattern, NumberLineInput,
                          WordBuilderInput, StoryStripInput, memory-game pieces
utils/
  progress.js             Pure mastery / spaced-review / unlock logic
  session.js              Builds (interleaved) rounds, tallies per skill
  profiles.js             Profile helpers
  storage.js              AsyncStorage persistence
  useNarrator.js          Text-to-speech hook (expo-speech)
  phonemeAudio.js         Letter sounds: bundled recordings, else tuned TTS
  useSoundEffects.js      Sound effect playback hook
  memoryGame.js           Memory Chips variants, decks, chip-gap math, stalemate check
  memoryBuddy.js          Solo-mode AI buddy
  pathRace.js             Number Path Race rules
  funTickets.js           Fun Break ticket rules
  players.js              Player names/icons (child, Buddy, friend)
  roboPath.js / freezeZoo.js / pushRoll.js / garden.js   Rules for the Phase 3 games
  skillRounds.js          Game-screen skills report results like the quiz
  scoring.js / theme.js / constants.js
__tests__/                Jest tests for generators, skill map, progress, sessions, memory game, buddy, path race, tickets, literacy, science, logic, Phase 3 games
assets/sounds/            correct.wav / wrong.wav
```

## Play online

The web version is published to GitHub Pages at **https://eladmea.github.io/KidsMathApp/** and works on any phone, tablet or computer with a browser (on a phone, use "Add to Home Screen" to open it like an app). Progress is saved per device/browser.

Publishing is automatic (`.github/workflows/deploy-pages.yml`):
- every pull request runs the tests and checks the web build;
- every push to `main` (e.g. merging a PR) rebuilds and redeploys the site within a few minutes.

The deploy also runs `scripts/prepare-pages.js`, which adds a web app manifest and Home Screen icon (`assets/web/`), so "Add to Home Screen" opens the game full screen with its own icon.

One-time setup (already done for this repo): make the repository public (or use a paid plan), set **Settings → Pages → Source** to **GitHub Actions**, and make `main` the default branch.

## Running the app

```bash
npm install
npx expo start
```

Run the tests with:

```bash
npm test
```

Scan the QR code with the **Expo Go** app on your phone (Android/iOS) to run it, or press `a` / `i` in the terminal for an emulator/simulator.

## Adding recorded letter sounds

Isolated letter sounds are hard for text-to-speech, so Word Builder tiles use tuned spellings ("mmm", "buh") by default. To use real recordings, add audio files to `assets/phonemes/` and register them in `PHONEME_RECORDINGS` in `utils/phonemeAudio.js`, e.g. `m: require('../assets/phonemes/m.mp3')`. Registered sounds play instead of the TTS fallback.

## Note on sound playback

The task asked for `expo-av`, but that package is deprecated by Expo (removed in favor of `expo-audio`/`expo-video`) and this project is on Expo SDK 57, where `expo-av` is on its way out. The app uses **`expo-audio`** instead — same behavior (a happy chime on correct answers, a gentle tone on wrong ones), just via the currently supported API.
