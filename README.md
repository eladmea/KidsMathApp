# MathPlay 🧮

A colorful Expo React Native learning-games app for kids ages 3-10, built around a research-based skill map (learning trajectories, spaced review, read-aloud prompts for pre-readers).

## Features

- **Player profiles** — "Who's playing?" picker; each child has a name, age (3-10) and animal buddy. Age sets their band: 🌱 Sprouts 3-4, 🧭 Explorers 5-6, 🧱 Builders 7-8, 🏆 Masters 9-10. Progress is saved per child.
- **Read-aloud narration** — prompts are spoken with `expo-speech` (on by default for ages 3-6, toggle 🔊/🔇 on the map). A 🔊 button in every round repeats the question.
- **World map** — subject "islands" (Number Island, Word Woods, Nature Bay, Puzzle Peak, Feelings Garden), a big "▶ next skill" button, and a ⭐ Daily Review button when skills are due.
- **Skill map** (`curriculum/skills.js`) — ordered skills per subject and band with prerequisites, from *Count to 5* and *Find the Shape* up to *Big Division*. Skills unlock when their same-band prerequisites are passed; kids can peek at other bands.
- **Mastery + spaced review** — a round is passed at ≥ 80%. A skill is **mastered** after passing on **2 different days**. Passed skills return in Daily Review on a Leitner schedule (1, 2, 4, 8, 16 days), interleaving several skills in one round.
- **Generic quiz engine** — one generator per skill (`curriculum/generators.js`) with optional pictures (count the apples, add two groups, fade out the "taken away" ones), 2-4 big answer buttons, green/red feedback with sounds.
- **Memory Chips** — the 2-player number-matching memory game with the bonus-chip twist (see below).

Number Island is playable now; the other islands show their planned games as "coming soon".

## Memory Game rules

Two players (🦁 Player 1 and 🐸 Player 2) take turns flipping two cards from a 6x4 grid of numbers 1-12 (each number appears twice — 24 cards, 12 pairs). The current player's turn is always shown with their color and animal icon so it's obvious whose go it is.

- **Natural match** (both cards show the same number): the pair is cleared, the player scores a point, and they go again.
- **Mismatch** (e.g. 2 and 5): if the player has enough chips to attempt it, they're asked to *calculate* the gap themselves — "how many chips does it take to turn 2 into 5?" — with no cost shown up front. They pick their answer from every number between 1 and however many chips they currently have (so the real answer is always among the options), or tap **⏭ Skip** to walk away without risking any chips.
  - **Guess correctly**: they pay that many chips, the pair is cleared and scored, and those chips are handed to the *other* player — but the turn still passes to the other player (using chips costs you your extra turn, unlike a natural match).
  - **Guess wrong**: they still lose that many chips (gone for good, not given to anyone), the pair flips back face-down and stays in play, and the turn passes to the other player. Wrong math has a real cost.
  - **Skip**: no chips are risked, the pair flips back face-down, and the turn passes.
- **The twist**: forcing a match like 2→5 uses up the board's other "2" and "5" cards' natural partners, leaving an orphaned pair elsewhere with the same 3-chip gap. The chips the first player paid land in the other player's pile — exactly enough for them to close that same gap later, if they calculate it correctly too.
- Each player starts with 🪙 chips equal to the number of pairs on the board (12, by default) — bigger boards mean a bigger bonus-chip pool. If a player doesn't have enough chips to even attempt the gap, the cards just flip back and the turn passes — no guess is offered.
- The game ends when all cards are matched; whoever found the most pairs wins.

## Project structure

```
App.js                    Providers + navigation stack
context/
  ProfileContext.js       Profiles, active player, progress (AsyncStorage-backed)
curriculum/
  ageBands.js             Age bands (3-4, 5-6, 7-8, 9-10)
  subjects.js             Subject islands
  skills.js               Skill map with prerequisites
  generators.js           Question generator per skill
screens/
  ProfilesScreen.js       Who's playing?
  CreateProfileScreen.js  New player
  WorldMapScreen.js       Home: islands, next skill, daily review
  SkillListScreen.js      Skills of one island, by band
  QuizScreen.js           Generic skill-driven round
  ResultsScreen.js        Stars, mastered/unlocked celebration
  MemoryGameScreen.js
components/               Buttons, cards, QuestionVisual, memory-game pieces
utils/
  progress.js             Pure mastery / spaced-review / unlock logic
  session.js              Builds (interleaved) rounds, tallies per skill
  profiles.js             Profile helpers
  storage.js              AsyncStorage persistence
  useNarrator.js          Text-to-speech hook (expo-speech)
  useSoundEffects.js      Sound effect playback hook
  memoryGame.js           Memory game deck generation + chip-cost math
  scoring.js / theme.js / constants.js
__tests__/                Jest tests for generators, skill map, progress, sessions, memory game
assets/sounds/            correct.wav / wrong.wav
```

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

## Note on sound playback

The task asked for `expo-av`, but that package is deprecated by Expo (removed in favor of `expo-audio`/`expo-video`) and this project is on Expo SDK 57, where `expo-av` is on its way out. The app uses **`expo-audio`** instead — same behavior (a happy chime on correct answers, a gentle tone on wrong ones), just via the currently supported API.
