# MathPlay 🧮

A colorful Expo React Native math practice app for kids ages 5-9.

## Features

- **Home screen** — app title, Easy/Medium/Hard difficulty selector, big Start button, and a saved high score for the selected difficulty.
- **Quiz screen** — one question at a time (addition/subtraction on Easy, multiplication/division on Medium/Hard), 4 big multiple-choice buttons, a "Question X of 10" progress bar, and a running score counter.
- **Results screen** — 1-3 stars based on score, with Play Again and Back to Home buttons.
- Correct answers flash green with a checkmark and a happy chime; wrong answers flash red with an X and a gentle try-again tone.
- High scores are saved per difficulty with `AsyncStorage` and persist between sessions.

## Project structure

```
App.js                    Navigation container + stack
screens/
  HomeScreen.js
  QuizScreen.js
  ResultsScreen.js
components/
  BigButton.js
  DifficultySelector.js
  AnswerButton.js
  ProgressBar.js
  ScoreCounter.js
  StarRating.js
utils/
  questionGenerator.js    Random question generation per difficulty
  scoring.js              Star rating calculation
  storage.js              AsyncStorage high-score persistence
  useSoundEffects.js       Sound effect playback hook
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
