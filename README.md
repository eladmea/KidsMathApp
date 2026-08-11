# MathPlay 🧮

A colorful Expo React Native math practice app for kids ages 5-9.

## Features

- **Home screen** — app title, Easy/Medium/Hard difficulty selector, big Start button, and a saved high score for the selected difficulty.
- **Quiz screen** — one question at a time (addition/subtraction on Easy, multiplication/division on Medium/Hard), 4 big multiple-choice buttons, a "Question X of 10" progress bar, and a running score counter.
- **Results screen** — 1-3 stars based on score, with Play Again and Back to Home buttons.
- Correct answers flash green with a checkmark and a happy chime; wrong answers flash red with an X and a gentle try-again tone.
- High scores are saved per difficulty with `AsyncStorage` and persist between sessions.
- **2-Player Memory Game** — a number-matching memory game with a "bonus chip" twist (see below).

## Memory Game rules

Two players (🦁 Player 1 and 🐸 Player 2) take turns flipping two cards from a 4x4 grid of numbers 1-8 (each number appears twice). The current player's turn is always shown with their color and animal icon so it's obvious whose go it is.

- **Natural match** (both cards show the same number): the pair is cleared, the player scores a point, and they go again.
- **Mismatch** (e.g. 2 and 5): if the player has enough chips to attempt it, they're asked to *calculate* the gap themselves — "how many chips does it take to turn 2 into 5?" — and pick the answer from 4 choices. This is the math practice: no cost is shown up front, they have to work out `5 - 2` on their own.
  - **Guess correctly**: they pay that many chips, the pair is cleared and scored, those chips are handed to the *other* player, and the correct player goes again.
  - **Guess wrong**: they still lose that many chips (gone for good, not given to anyone), the pair flips back face-down and stays in play, and the turn passes to the other player. Wrong math has a real cost.
- **The twist**: forcing a match like 2→5 uses up the board's other "2" and "5" cards' natural partners, leaving an orphaned pair elsewhere with the same 3-chip gap. The chips the first player paid land in the other player's pile — exactly enough for them to close that same gap later, if they calculate it correctly too.
- Each player starts with 🪙 10 bonus chips. If a player doesn't have enough chips to even attempt the gap, the cards just flip back and the turn passes — no guess is offered.
- The game ends when all cards are matched; whoever found the most pairs wins.

## Project structure

```
App.js                    Navigation container + stack
screens/
  HomeScreen.js
  QuizScreen.js
  ResultsScreen.js
  MemoryGameScreen.js
components/
  BigButton.js
  DifficultySelector.js
  AnswerButton.js
  ProgressBar.js
  ScoreCounter.js
  StarRating.js
  MemoryCard.js
  PlayerBanner.js
  PlayerStatsRow.js
  ChipGuessModal.js
  MemoryResultsModal.js
utils/
  questionGenerator.js    Random question generation per difficulty
  scoring.js              Star rating calculation
  storage.js              AsyncStorage high-score persistence
  useSoundEffects.js       Sound effect playback hook
  memoryGame.js           Memory game deck generation + chip-cost math
  theme.js / constants.js
assets/sounds/            correct.wav / wrong.wav
```

## Running the app

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (Android/iOS) to run it, or press `a` / `i` in the terminal for an emulator/simulator.

## Note on sound playback

The task asked for `expo-av`, but that package is deprecated by Expo (removed in favor of `expo-audio`/`expo-video`) and this project is on Expo SDK 57, where `expo-av` is on its way out. The app uses **`expo-audio`** instead — same behavior (a happy chime on correct answers, a gentle tone on wrong ones), just via the currently supported API.
