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
- **Mismatch** (e.g. 2 and 5): the player is offered a trade — spend bonus chips equal to the difference (3 chips, in this example) to bump the lower number up to the higher one, turning them into a matching pair. If they take the trade, they score the pair and go again.
- **The twist**: whatever chips are spent to force a match are handed straight to the *other* player. Forcing a match like 2→5 uses up the board's other "2" and "5" cards' natural partners, so it leaves an orphaned pair elsewhere with the same 3-point gap — the chips transferred are exactly enough for the other player to close that gap later. Chips aren't consumed by the game, they just move between players.
- Each player starts with 🪙 10 bonus chips. If a player can't afford (or declines) the trade, the cards flip back over and the turn passes to the other player.
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
  ChipOfferModal.js
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
