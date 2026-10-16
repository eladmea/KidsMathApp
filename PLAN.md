# MathPlay Learning-Games Plan (ages 3–10)

This document describes where MathPlay is heading, why it is designed this way (the research behind it), and **what has been implemented and when**.

- **Plan written:** 2026-10-15
- **Language:** English (all content, narration and phonics)
- **Last updated:** 2026-10-16 (Phase 6: Today's Adventure guided session and Play together coach mode)

---

## 1. Status at a glance

| Phase | Scope | Status | Implemented |
|---|---|---|---|
| Pre-plan | MathPlay quiz (Easy/Medium/Hard), 2-player Memory Game with chip-gap twist | ✅ Done | 2026-08-05 → 2026-08-11 |
| **Phase 0** | Foundation: profiles, age bands, narration, skill map, mastery + spaced review, world map, generic quiz engine, tests | ✅ Done | **2026-10-16** (commit `f4e97ed`) |
| **Phase 1** | Math track + Memory Chips variants, solo AI buddy, Number Path Race, Quick Look, Number Line Drop, first mini-games | ✅ Done | **2026-10-16** (commit `c4e1e07`) |
| **Phase 2** | Literacy: Sound Snack, Word Builder, Story Strip, Letter Chips, letter-sound playback | ✅ Done | **2026-10-16** (commit `c5c6411`) |
| **Phase 3** | Science, Logic & Executive Function: Garden Days, Dress for Weather, Push & Roll, Robo Path, Freeze Zoo | ✅ Done | **2026-10-16** (commit `5636426`) |
| **Phase 4** | Social-emotional learning & polish: Feelings Garden, Feelings Friends, Balloon Breath, sticker book, parent dashboard + soft time limits | ✅ Done | **2026-10-16** (commit `217d84c`) |
| **Phase 5a** | Play-test tools: adaptive difficulty, play-test log and report, CSV export, play-test guide | ✅ Done | **2026-10-16** (commit `1eeeae8`) |
| Phase 5b | Play-tests with 2–3 children per age band, then difficulty tuning from the results | ⏳ Next (needs real sessions) | — |
| **Phase 6** | Guided daily session (section 6) and a "play together" mode | ✅ Done | **2026-10-16** (commit `PHASE6`) |
| Phase 7 | Curriculum gaps against section 4, in two parts (7a math, 7b literacy, science and logic) | 🔜 Planned, after 5b | — |
| Phase 8 | Polish and release: remaining mini-games, voice recordings, app icon, accessibility, store builds | 🔜 Planned | — |

---

## 2. Goals

1. Every game is **fun and educational**.
2. Content and order are based on **reliable research** about how children learn at each age.
3. Game types **vary** and cover all the main subjects: math, literacy, science, logic/executive function and social-emotional skills.
4. **Mini-games** break up the purely educational structure.
5. The original **Memory Chips** game (the user's invention) is merged in and extended, alongside new simple games.

---

## 3. Research → design rules

| # | Finding | Design rule |
|---|---|---|
| 1 | **Four Pillars** (Hirsh-Pasek et al., 2015): apps teach best when they are *active* (minds-on), *engaged* (no distractions), *meaningful* and *socially interactive*, with a clear learning goal | Each game has one stated skill goal. Rewards never interrupt thinking. Keep 2-player and parent co-play modes |
| 2 | **Learning trajectories** (Clements & Sarama): math develops through predictable levels (subitizing → counting → cardinality → arithmetic), and RCTs show positive effects | A **skill map** of ordered levels with prerequisites. Children advance by level, not by age alone |
| 3 | **Linear number board games** (Siegler & Ramani, 2008–2012): about 1 hour of a linear 1–10 board game improved preschoolers' counting, numeral ID, magnitude comparison and number-line estimation | Number Path Race is the core of the 3–6 math track |
| 4 | **National Reading Panel**: phonemic awareness and letter knowledge are the strongest early-reading predictors, and systematic phonics brings the largest gains | Literacy order: rhyme/sounds (spoken) → letter sounds → blend/segment → decodable words → sentences → comprehension |
| 5 | **Spaced & interleaved practice** (Rohrer et al.): mixing problem types and spreading practice over days beats blocked drills | Daily Review mixes skills. Mastery requires passing on **2 separate days** |
| 6 | **Executive function** (Diamond): games exercising working memory, inhibition and flexibility can build EF | Go/no-go and rule-switch games. Memory games train working memory |
| 7 | **AAP media guidance**: about 1 hour/day of quality media for ages 2–5, ideally watched with a parent | Session lengths of about 10–15 min (ages 3–5) and 15–20 min (6–10), a "play together" mode, gentle goodbyes |
| 8 | **CASEL 5** social-emotional competencies predict friendships and achievement | One SEL thread: feelings, calming, turn-taking, fairness |
| 9 | **Standards**: Common Core (counting & cardinality → operations), NGSS K–2 (push/pull, weather, needs of living things) | Fill each age band's content from these |

The evidence for SEL games and EF games is weaker than for the board-game, phonics and spacing findings. Treat those games as enrichment rather than proven interventions.

---

## 4. Age bands and curriculum spine

| | 🌱 **Sprouts 3–4** | 🧭 **Explorers 5–6** | 🧱 **Builders 7–8** | 🏆 **Masters 9–10** |
|---|---|---|---|---|
| Interaction | Voice-only, big targets | Voice + short words | Reading, voice on tap | Full text, timers allowed |
| Math | Subitize 1–5, count to 10, more/less, shapes, AB patterns | Count to 100, +/− within 10, number line 0–20 | Fluency within 20, place value, +/− within 100, time, money, arrays | ×/÷ within 100, fractions, area/perimeter, multi-step problems |
| Literacy | Rhymes, first sounds, letter names | Letter sounds, CVC blending, sight words | Digraphs, spelling patterns, sentences, story order | Prefixes/suffixes, vocabulary, grammar, comprehension |
| Science & world | Animals & homes, colors, sizes, weather | Plant needs, push/pull, seasons | Life cycles, materials, maps | Ecosystems, energy, geography, human body |
| Logic / EF | Sorting, matching, Freeze game | Sequencing, robot paths | Coding loops, logic grids | Multi-step puzzles, strategy |
| SEL | Name feelings | Feelings ↔ situations, calm breathing | Fairness, turn-taking | Perspective-taking, negotiation |

---

## 5. Game catalogue

### A. Memory Chips family (the original game, extended)

All variants share the chip-gap engine: on a mismatch, the player calculates the gap to force the match, and the chips paid go to the opponent.

| Variant | Ages | Pairs | Twist | Phase |
|---|---|---|---|---|
| Dot Chips | 3–5 | Dot pattern ↔ numeral | Gap counted by tapping chips | ✅ 1 |
| Classic Chips | 5–7 | Number ↔ same number | Original rules | ✅ Pre-plan |
| Fact Chips (Plus & Minus / Times & Divide) | 7–10 | `3+4` ↔ `7`, `3×4` ↔ `12` | Work out each card, then the gap | ✅ 1 |
| Fraction Chips | 9–10 | `1/2` ↔ `4/8` | Gap counted in eighths | ✅ 1 |
| Letter Chips | 4–6 | Letter ↔ picture | "Alphabet steps" between letters | ✅ 2 |

The variants also get a **solo mode against an AI buddy** and a post-game reflection on the chip trade.

### B. Core learning games

| Game | Subject | Ages | Phase |
|---|---|---|---|
| Number Path Race (linear board game) | Math | 3–7 | ✅ 1 |
| Quick Look (subitizing flash) | Math | 3–6 | ✅ 1 |
| Number Line Drop | Math | 5–10 | ✅ 1 |
| Lemonade Stand (money) | Math | 7–10 | 7a |
| Sound Snack (first sounds) | Literacy | 3–6 | ✅ 2 |
| Word Builder (phonics tiles) | Literacy | 5–8 | ✅ 2 |
| Story Strip (sequencing) | Literacy | 4–9 | ✅ 2 |
| Garden Days (plant needs over real days) | Science | 4–8 | ✅ 3 |
| Dress for Weather | Science | 3–6 | ✅ 3 |
| Push & Roll | Science | 5–8 | ✅ 3 |
| Robo Path (coding) | Logic | 4–10 | ✅ 3 |
| Freeze Zoo (go/no-go) | EF | 3–8 | ✅ 3 |
| Feelings Friends | SEL | 5–8 | ✅ 4 |

### C. Mini-games (60–90 s breaks)

Bubble Pop ✅ · Chip Toss ✅ · Dance Tap ✅ · Balloon Breath ✅ (free calm-down) · Color Me (8) · Peekaboo Hide & Seek (8). New simple ideas: **Chip Bridge** (cooperative add/subtract to hit a target) and **Echo Monster** (growing memory sequence), both in Phase 8.

---

## 6. Session structure

1. **Warm-up** (2 min): spaced review.
2. **New skill** (3–4 min): the buddy demonstrates, then the child and buddy try one together, then the child plays alone.
3. **Mixed practice** (3–4 min): a different mechanic, interleaving new and old skills.
4. 🎈 **Mini-game** (1–1.5 min).
5. **Second subject** (3 min): subjects rotate through the week.
6. **Cool-down**: a calm activity, the stickers earned, and "see you tomorrow!"

✅ Built in Phase 6 as **Today's Adventure** (see section 8).

Adaptive rules (✅ Phase 5, practice rounds):
- 3 wrong answers in a row: drop a level and show a hint.
- 5 right answers in a row: step up a level.

Rewards are cosmetic stickers shown *after* the thinking, never shops or pressure timers.

---

## 7. Roadmap after Phase 5

A review on 2026-10-16 found parts of this plan that no phase delivered. Phases 6–8 cover them.

**Order.** Phase 6 doesn't depend on play-test results, so it can start straight away. Phase 7 should wait for Phase 5b: the research behind this plan says to test with children before adding much more content, and the play-test report shows which skills need easier or harder neighbours.

### Phase 5b: Play-tests and tuning

- Run sessions with 2–3 children per age band, on at least 2 different days each, following [PLAYTEST.md](PLAYTEST.md).
- Collect the CSV exports and notes. Tune skills that are flagged by 2+ children (generator ranges, distractors, prompts, prerequisites, default time limits).
- Log each change, and the evidence behind it, under Phase 5 in section 8.

### Phase 6: Guided daily session and play-together mode ✅

Done on 2026-10-16; see the Phase 6 entry in section 8.

### Phase 7: Curriculum gaps (section 4)

**7a: Math**
- 7–8: place value (tens and ones), telling time, money with **Lemonade Stand**, arrays.
- 9–10: fractions (compare, equivalent fractions, fractions of a set), area and perimeter, multi-step word problems.

**7b: Literacy, science and logic**
- Literacy: letter names (3–4); sentence building and spelling patterns (7–8); vocabulary, grammar and short reading comprehension (9–10).
- Science: seasons (5–6), simple maps (7–8), energy and geography (9–10).
- Logic: sorting and matching (3–4), sequencing (5–6), easier logic grids (7–8).
- Each new skill needs a generator, a how-to line, an exactly-one-answer test and a place in the prerequisite map, as in Phases 1–4.

### Phase 8: Polish and release

- The remaining mini-games: Color Me, Peekaboo Hide & Seek, **Chip Bridge** (cooperative add/subtract to a target) and **Echo Monster** (a growing memory sequence).
- Real voice recordings for letter sounds (the playback path is ready in `utils/phonemeAudio.js`).
- A real native app icon and splash screen.
- An accessibility pass: screen-reader labels, colour contrast, text size, reduced motion.
- Offline support for the web app, and optionally App Store / Play Store builds.

---

## 8. Implementation log

### Pre-plan (2026-08-05 → 2026-08-11)

| Date | Commit | Change |
|---|---|---|
| 2026-08-05 | `d5945de` | MathPlay: Expo math practice app for ages 5–9 (Easy/Medium/Hard quiz, stars, high scores) |
| 2026-08-05 | `ab627e8` | Web support dependencies |
| 2026-08-08 | `f6e9fa8` | 2-player Memory Game with bonus-chip trading twist |
| 2026-08-11 | `a725ab1` | Grid overflow fix; chip cost becomes a math challenge |
| 2026-08-11 | `7d7db54` | Chip-corrected matches no longer grant an extra turn |
| 2026-08-11 | `af0fb21` | Full chip-range guessing, bigger board, scaled chip pool |

### Phase 0: Foundation (implemented 2026-10-16, commit `f4e97ed`)

**Delivered:**
- **Child profiles**: name, age 3–10 and animal buddy, with progress saved per child. Age maps to a band. Screens: `ProfilesScreen`, `CreateProfileScreen`; state lives in `context/ProfileContext.js`.
- **Read-aloud narration** via `expo-speech`. It's on by default for ages 3–6, toggled on the map, and every question has a 🔊 repeat button. Code: `utils/useNarrator.js`.
- **Skill map** in `curriculum/skills.js`, covering 5 subject islands. Number Island is playable with 17 skills, from *Count to 5* to *Big Division*. The other islands list their planned games as "coming soon".
- **Question generator per skill** in `curriculum/generators.js`, replacing `questionGenerator.js`. Includes pictures for pre-readers: counting objects, adding groups, and faded "take-away" objects.
- **Progress engine** in `utils/progress.js`:
  - A round is passed at 80% or more.
  - A skill is mastered after passing on 2 different days.
  - Daily Review follows a Leitner schedule (1, 2, 4, 8, 16 days) and interleaves skills.
  - Skills unlock when their same-band prerequisites are passed.
- **World map** home screen showing the islands, the next recommended skill and Daily Review, plus a per-island skill list with band tabs and a generic skill-driven quiz. Results celebrate newly mastered and unlocked skills.
- The Easy/Medium/Hard quiz and its high scores are **replaced** by the skill map.
- Migrated to `react-native-safe-area-context`.
- **Tests**: jest-expo with 77 unit tests (generators, skill map, progress, sessions, profiles, memory-game chip math). Run them with `npm test`.

**Verification:**
- All unit tests pass.
- The web build was driven end to end in headless Chromium: create profile → play → unlock → next-day review → mastery → Memory Chips → second profile. No page errors.

**Notes and deviations:**
- The Expo v57 docs site couldn't be reached from the build environment. Package versions were taken from Expo's bundled compatibility list, and the `expo-speech` API from its type definitions.
- `jest-expo` is pinned to `57.0.3` with `@react-native/jest-preset` `0.86.2`, because newer jest-expo patches conflict with React Native 0.86.2.
- The "next skill" button points to the next skill **not yet passed**. Passed skills return through Daily Review on a later day, which is what masters them.
- Not yet covered: in-round adaptive difficulty, session time limits and the parent dashboard (Phase 4).

### Phase 1: Math track, Memory Chips family, mini-games (implemented 2026-10-16, commit `c4e1e07`)

**Delivered:**
- **Memory Chips family** (`utils/memoryGame.js`). Every card now has a numeric `value`, used for matching and chip gaps, and a `face`, which is what the child sees. Variants:
  - **Dot Chips** (3–6): 6 pairs, dots ↔ numeral. The gap is counted out by tapping chips one at a time, with each count read aloud.
  - **Classic Chips**: the original game, unchanged.
  - **Plus & Minus Chips** (7–8): `3+4` ↔ `7`.
  - **Times & Divide Chips** (9–10): `3×4` ↔ `12`, `56÷8` ↔ `7`.
  - **Fraction Chips** (9–10): 8 pairs of equivalent fractions; each chip is 1/8.

  The chip question shows both cards and is read aloud on the child's turn.
- **Solo play against an AI buddy 🤖** (`utils/memoryBuddy.js`). The buddy remembers only some cards and sometimes misjudges or skips a gap. Its skill rises with the child's age band.
- **Stalemate fix.** A game now ends when no natural pair is left and neither player can afford any remaining gap. This could deadlock the original game, because wrong guesses destroy chips.
- **Number Path Race** (`screens/PathRaceScreen.js`, `utils/pathRace.js`), based on Siegler & Ramani:
  - Linear 1–10 board with a 1–2 spinner, or 1–20 with a 1–3 spinner.
  - The child taps each square in order while it is spoken. A wrong tap highlights the right square and says it.
  - Play against Buddy or a friend.
- **Quick Look**: a subitizing skill. Dice patterns flash for 1.5 s (ages 3–4), or a ten frame for 2 s (ages 5–6).
- **Number Line Drop**: tap where a number goes on an empty line from 0 to 10, 100 or 1000. Shows 🪂 where the child tapped and 🎯 where the number really is. Lives in the generic quiz engine, so it works in Daily Review too.
- **Game setup screen**: choose a variant (marked "⭐ Just right" for the child's band) and play with Buddy or a friend.
- **Fun Break mini-games**: Bubble Pop (gold bubbles read a fun fact), Chip Toss (time your toss into a moving cup) and Dance Tap (tap the glowing pad on the beat).
  - Every 2 finished learning rounds earn a 🎟️ ticket, and each mini-game costs one ticket.
  - The Memory Chips and Path Race learning games stay free.
- **World map** now lists the learning games and the Fun Break with the child's ticket count.
- **Tests**: 124 unit tests, adding coverage for variant decks (fact and fraction faces are checked against their values), buddy choices, stalemate detection, path race and tickets.

**Verification:**
- Browser walkthrough on the web build, all checks passing with no page errors:
  - A full Dot Chips game against Buddy, including paying chips correctly.
  - A full Number Path Race.
  - Two 10/10 Number Line rounds, with a ticket earned on the second.
  - All 3 mini-games, ticket spending, and Quick Look's flash.
- The Phase 0 walkthrough was re-run as a regression check.

**Notes:**
- React Native Web press events have no `locationX`. The number line falls back to `pageX` minus the line's measured position.
- In Dot Chips the chip question also shows the numerals in text. Pre-readers rely on the picture cards and narration.
- Not yet covered: in-round adaptive difficulty, parent dashboard and session limits (Phase 4).

### Phase 2: Literacy (implemented 2026-10-16, commit `c5c6411`)

**Delivered:** Word Woods is playable, with 10 skills in National Reading Panel order. Children hear sounds first, then link sounds to letters, then blend sounds into words, then read sentences and word parts.

| Band | Skill | How it plays |
|---|---|---|
| 3–4 | **Rhyme Time** | "What rhymes with cat?" Three pictures, all named aloud |
| 3–4 | **Sound Snack** | Feed the 👾 monster the picture that starts with a sound (s, m, t, p, f, n first). It says "Yum!" 😋 or "Yuck!" 🤢 |
| 5–6 | **Letter Sounds** | "Which letter says sss?" or "What letter does snake start with?" |
| 5–6 | **Sight Words** | Hear a Dolch sight word, tap it among four |
| 5–6 | **Word Builder** | Picture plus spoken word. Tap letter tiles into slots, each tile plays its sound, then the sounds blend back: "sss, uh, nnn… sun!" |
| 7–8 | **sh ch th wh** | Which digraph does the picture start with? |
| 7–8 | **Word Builder: Teams** | Build words with digraph and vowel-team tiles (`sh·i·p`, `m·oo·n`, `r·ai·n`) |
| 7–8 | **Story Strip** | Tap 4 captioned panels in order (egg → chick → hen, bedtime routine, weather…). Tapping a panel takes it back |
| 9–10 | **Compound Words** | Which split makes "rainbow"? (`rain + bow`) |
| 9–10 | **Word Parts** | What does "unhappy", "reread" or "fearless" mean? |

- **Letter Chips** (Memory Chips, ages 5–6): letters a–f are paired with pictures that start with them (b ↔ 🐻). The gap is counted in alphabet steps, with an a–f strip shown as a helper.
- **Listening tasks are always read aloud.** Rhymes, sounds, sight words and spelling can't be done without hearing the word, so they speak even when a profile's narration is off.
- **Letter-sound playback** (`utils/phonemeAudio.js`). Bundled recordings are played when registered. Otherwise text-to-speech uses tuned spellings ("mmm", "buh", "shh") from `curriculum/phonics.js`.
- The **map** now suggests the next skill **per subject**. Previously literacy would only have been suggested after every math skill was passed.
- **New question types** in the quiz engine: `build` (letter tiles) and `order` (story panels), plus picture, letter and word answer styles. The quiz area now scrolls for taller questions.
- **Tests**: 151 unit tests. Literacy tests check that:
  - every picture starts with its sound and every rhyme family really rhymes;
  - tiles spell their word and each question has exactly one right answer;
  - every Letter Chips picture starts with its letter.

**Verification:**
- Browser walkthrough on the web build, all checks passing with no page errors:
  - Rhyme Time, Sound Snack (Yum/Yuck), Letter Sounds unlocking Word Builder, a full Word Builder round including the blend, and Sight Words.
  - A Letter Chips gap question with the helper.
  - Story Strip with an undo.
  - Listening narration staying on for an 8-year-old with narration off.
- The Phase 0 and Phase 1 walkthroughs were re-run as regression checks.

**Notes:**
- **Real voice recordings are not included.** This build environment has no voice or TTS engine, and isolated phonemes need a human voice to sound right. The playback path is ready: drop audio files into `assets/phonemes/` and register them in `PHONEME_RECORDINGS`. Until then, the tuned TTS spellings are used.
- Emoji in the word banks are limited to Unicode 13 or older so they render on older devices.

### Publishing: GitHub Pages (added 2026-10-16, commit `faf3f7c`)

- `.github/workflows/deploy-pages.yml` runs on GitHub Actions.
  - Every pull request runs the unit tests and checks that the web build still compiles.
  - Every push to `main` also deploys to **https://eladmea.github.io/KidsMathApp/**.
- `app.config.js` sets the web base path (`/KidsMathApp`) only for that build, so local `npx expo start` is unchanged.
- One-time repo setup done by the owner: the repository is public, **Settings → Pages → Source = GitHub Actions**, and the default branch is `main`.
- The first deploy attempts failed at the final publish step while those settings were being changed. Build and tests passed every time.

### Phase 3: Science, logic and executive function (implemented 2026-10-16, commit `5636426`)

**Delivered:** Nature Bay and Puzzle Peak are playable in every age band.

| Band | Nature Bay (science) | Puzzle Peak (logic / EF) |
|---|---|---|
| 3–4 | **Dress for Weather**: sunny, rainy or snowy, pick what to take. **Where Do I Live?**: match animals to ocean, desert, ice or forest | **Freeze Zoo** (game): tap animals but freeze for the 🦉, then the rule switches to "tap only the owl". **What Comes Next?**: AB / AAB / ABB patterns |
| 5–6 | **What Plants Need**: water, sunlight, soil or air vs. silly options. **Push or Pull?** **Push & Roll** (game, unlocked by Push or Pull): hold to push, a harder push rolls farther; stop on the 🎯 (K-PS2-1) | **Robo Path** (game): program a robot with arrow blocks to reach the 🍪. **Tricky Patterns**: ABC / AABB / ABAC |
| 7–8 | **Life Cycles**: put 4 stages in order (hen, butterfly, frog, apple tree, human). **Solid, Liquid, Gas** | **Robot Loops** (game): bigger grid, repeat blocks (➡️×3) and a block limit |
| 9–10 | **Food Chains**: order sun → plant → plant-eater → predator. **My Amazing Body**: heart, lungs, brain and more | **Logic Grids**: three friends, three pets, clues → who owns what. Every puzzle is checked to have exactly one answer and to need every clue |

- **Garden Days** (learning game for all ages): give the plant what today's clue says it needs (water, sunlight or fresh soil). It grows one stage per real day, from 🌰 to 🌻.
  - A wrong choice makes it droop and explains why; the plant never dies.
  - After it blooms, plant a new seed. This builds in spaced return visits.
- **Game-screen skills**: a skill can now be played on its own screen (`screen` in the skill map) instead of the quiz. Freeze Zoo, Robo Path, Robot Loops and Push & Roll report results through the normal Results screen, so mastery, unlocks and Fun Break tickets all work. They are left out of Daily Review, which mixes quiz questions only.
- **Home Screen support** for the web version (`scripts/prepare-pages.js`, run by the deploy): a web app manifest, a new web-only icon (`assets/web/`) and a theme colour. "Add to Home Screen" now opens the game full screen with its own icon. The script also writes `404.html` and `.nojekyll`.
- **Tests**: 185 unit tests. New tests check that:
  - every Robo Path and loop puzzle is solvable within its block limit;
  - Freeze Zoo scores taps and freezes correctly in both rule phases;
  - Push & Roll judges pushes correctly and Garden Days grows only once per day;
  - every science question has exactly one right answer and every logic grid has a unique solution.

**Verification:**
- Browser walkthrough against a build served exactly as GitHub Pages serves it (under `/KidsMathApp/`), all checks passing with no page errors or failed requests:
  - Dress for Weather 10/10, Freeze Zoo 24/24 including the rule switch, Robo Path 6/6.
  - Push or Pull unlocking Push & Roll, then 8/8 on target.
  - Garden Days growing on day 1, resting, then growing on day 2.
  - Robot Loops 6/6 within block limits, Life Cycles 10/10, Logic Grids 10/10.
- The manifest and icons load. The Phase 0–2 walkthroughs were re-run as regression checks.

**Notes:**
- The native app icon (`assets/icon.png`) is still Expo's template placeholder. Only the web Home Screen icon was replaced.
- Not yet covered: in-round adaptive difficulty, parent dashboard and session limits (Phase 4).

### Play-testing fixes: feedback, worked examples, number sequences (2026-10-16)

Changes made after the first play-test of the live site:

- **Answer feedback**
  - The green/red result now appears before the sound and voice start. Stopping speech and starting audio can stall a phone's screen, which made presses feel slow.
  - Answer buttons visibly sink and tint while pressed.
  - The result stays up for 1.4 s on a right answer and 2.2 s on a wrong one, so the child can see which answer was right (it was 0.9 s).
- **Worked example ("Let's try one together!")**
  - Until a child has passed a skill, a practice round opens with an unscored example: how to play (`curriculum/howTo.js`, one line per quiz game), the question with the answer filled in, and a 💡 "Why?" explanation.
  - A ❓ button in the quiz header shows another example any time.
- **What Comes Next?**
  - Sequences now go **up or down**.
  - The numbers sit on a **staircase** that climbs or descends, with ↗/↘ arrows and a "⬆️ Going up / ⬇️ Going down" label.
  - The worked example also shows the +1/−1 step between blocks.
  - After answering, the "?" block fills in with the answer.
- **New skill: Skip Counting** (ages 7–8): the same staircase, counting up or down by 2s, 5s or 10s.
- The Puzzle Peak pattern skill is renamed **Pattern Play**, so it no longer shares the "What Comes Next?" name.
- **Tests:** 189 unit tests, adding sequence direction and step tests and a check that every quiz game has a how-to line.
- **Verification:**
  - Touch-screen browser check (Pixel 5 emulation): the press shows in about 10 ms, and results stay up 1.4 s (right) and 2.2 s (wrong).
  - The worked example and the ❓ button work.
  - The Phase 0–3 walkthroughs pass.

- **Number Line Drop praise** (follow-up): a correct tap now says "Bullseye!" (exact) or rotating praise such as "Great job! 45 lives right there! 🎉" instead of "Close!". A miss says "Good try! … 45 lives here."

### Phase 4: Social-emotional learning and polish (implemented 2026-10-16, commit `217d84c`)

**Delivered:** Feelings Garden is playable in every age band, following the CASEL 5 order in the curriculum spine.

| Band | Skill | How it plays |
|---|---|---|
| 3–4 | **Feelings Faces** | "Which face looks sad?" Three faces (happy, sad, angry, scared, surprised, sleepy). Always read aloud |
| 5–6 | **How Would You Feel?** | A short situation with a picture ("Your balloon floats away"). Tap the face that fits |
| 5–6 | **Feelings Friends** (game, unlocked by How Would You Feel?) | A friend says what happened. Name their feeling, then pick what would help (a hug, slow breaths together, "You can play with us!") |
| 7–8 | **Fair Play** | Sharing, taking turns, being a good sport, saying sorry |
| 9–10 | **In Their Shoes** | Richer feeling words (proud, left out, nervous, relieved, embarrassed) and what to say or do |

- Wrong answers are never ones that could fairly fit. Every situation lists the feelings that would also make sense, and those are never offered as wrong choices.
- **Balloon Breath** (Fun Break, always free): hold the button to breathe in and fill the balloon, let go to breathe out. A breath counts once held 3 s or more; a quick one gets "try a slower breath". Five slow breaths end the game. It doesn't count as play time.
- **Sticker book** (`utils/stickers.js`, `screens/StickerBookScreen.js`):
  - A sticker for passing a skill the first time, a gold one for mastering it, and a flower when a Garden Days plant blooms. Each event earns its sticker once.
  - Stickers appear on the Results screen *after* the round and fill pages of 12. Tapping one says how it was earned. There is no shop.
- **Parent dashboard** (`screens/ParentDashboardScreen.js`), linked from "Who's playing?":
  - A grown-up check first: type the answer to a times fact (6–9 × 6–9). A wrong answer gets a new question.
  - For each child: minutes played today and over the last 7 days, the daily limit (off, 10–60 min), "➕ 10 more minutes today", progress per island for their band, skills still being practiced, sticker count and the read-aloud setting.
- **Soft daily time limit** (`utils/playTime.js`):
  - Defaults to 15 minutes for ages 3–5 and 20 for ages 6–10, from the AAP guidance.
  - Play time is counted while a child is on a playing screen and the app is in the foreground. It is not counted on the player picker, the parent screens, the goodbye screen or Balloon Breath.
  - A ⏰ note appears on the map in the last 5 minutes.
  - When time runs out, the current round is allowed to finish. Its Results screen then offers "👋 Time for a break" instead of Play Again, and the map sends the child to a goodbye screen: today's stickers, Balloon Breath as a cool-down, "Switch player", and "Grown-ups: +10 min" behind the grown-up check.
- **Tests**: 216 unit tests. New tests check that:
  - every SEL question has exactly one right answer, and no feeling that would also fit is offered as wrong;
  - every Feelings Friends turn has one helpful choice and wrong feelings that don't fit;
  - Balloon Breath fills and judges breaths correctly, and is the only free mini-game;
  - stickers are awarded once per event, with gold and flower stickers;
  - play time adds up per day, the limit counts down, and bonus time lasts only for today;
  - the grown-up check accepts only the right typed answer.

**Verification:**
- Browser walkthrough against a build served exactly as GitHub Pages serves it (under `/KidsMathApp/`), all checks passing with no page errors or failed requests:
  - Feelings Faces 10/10, earning a sticker shown on Results and in the sticker book.
  - How Would You Feel? 10/10, unlocking Feelings Friends, then Feelings Friends 7/8 with a gentle correction for an unhelpful choice.
  - Balloon Breath: a quick breath not counted, five slow breaths finishing it, no ticket spent.
  - Time limit: a child with 30 s left finished her round, play time reached 15 min, Results offered the goodbye, and reopening the app went straight to the goodbye screen. A wrong grown-up answer was refused; a right one added 10 minutes and returned to the map.
  - No play time counted while on the player picker (32 s wait).
  - Dashboard: both children listed, 15 of 25 minutes shown, limits changed and saved.
  - A Garden Days bloom earned a 🌻 sticker.
- Regression checks: a math quiz and Memory Chips setup open as before. The full Phase 0–3 walkthroughs were not re-run this time.

**Notes:**
- No skill is "coming soon" any more. Tests that used a Feelings Garden skill as the example of an unplayable one now use a made-up skill.
- `applySession` now also returns `newlyPassed`, which the sticker book uses.
- Play time is stored separately from profiles (`@mathplay_play_time`), so the 15-second play-time ticks never change the profile object that screens watch. Garden Days now reloads only when the player changes.
- The limit is soft by design. A child can still finish a long game such as Memory Chips after time runs out; the goodbye comes when they return to the map.
- The SEL evidence is weaker than for the math and reading games (see section 3). Treat these games as enrichment.

### Phase 5a: Play-testing tools and adaptive difficulty (implemented 2026-10-16, commit `1eeeae8`)

The play-tests themselves need real children, so this part of Phase 5 builds what the sessions and the tuning afterwards rely on.

**Delivered:**
- **In-round adaptive difficulty** (`utils/adaptive.js`), in practice rounds of quiz skills:
  - 3 wrong answers in a row step down a level and open a worked example of the easier skill ("⬇️ Let's practice ➕ Add within 10 for a bit").
  - 5 right answers in a row step up ("⬆️ Back to…" or "⚡ Level up!").
  - A level is a neighbouring skill on the learning trajectory: the skill's first quiz prerequisite (easier), or a same-subject skill that builds on it, preferring one where it is the first prerequisite (Add within 20 → Add within 100).
  - A round moves at most one level from where it started. A skill with no easier neighbour gets the worked example only.
  - Questions are tallied to the skill actually practiced, so mastery stays honest.
  - Daily Review and game-screen skills don't adapt.
- **Play-test log** (`utils/playLog.js`), kept on the device per child (newest 3000 events):
  - every quiz answer, with skill, level, right/wrong, response time and 🔊 replays;
  - every finished round, including game-screen skills;
  - practice quizzes left early;
  - level changes;
  - grown-ups' notes.
- **Play-test report** (Parent dashboard → child → 🧪 Play-test report):
  - per-skill tries, accuracy, median answer time and replays per question;
  - ⬇️/⚡ level-change counts and rounds left early;
  - flags once there are 10+ tries: **too hard** (under 60% right), **too easy** (95%+ and under 3 s), **unclear** (replayed on half the tries) and **drop-off** (a third of rounds left early);
  - session notes, and clearing a child's log.
- **CSV export** of every child's events: a download on the web, the share sheet on phones (`utils/exportFile.js`).
- **[PLAYTEST.md](PLAYTEST.md)**: a printable guide with session lengths per band, what to watch for, per-band questions, how to read the report, and what to change for each kind of finding.
- **Tests**: 227 unit tests. New tests cover:
  - level neighbours, streaks, step-down and step-up limits, and swapping the remaining questions;
  - the log cap, medians, every flag, game-skill rounds, notes and CSV quoting.

**Verification:**
- Browser walkthrough of the Pages build, all checks passing with no page errors:
  - In Add within 20: 2 replays, then 3 wrong answers stepped down to Add within 10 with a worked example. 5 right answers stepped back up. The round ended 7/10.
  - 10 answers were logged with times, replays and levels. Progress and round events were recorded for both skills.
  - Leaving Story Strip early logged a quit.
  - The report showed the step-down and the quit, a note saved, and the CSV export downloaded with all 16 events. Clearing the log emptied it.
- The Phase 4 walkthroughs were re-run on this build and pass.

**Notes:**
- Because questions are tallied by skill, 5 right answers at the easier or harder level count as a passed round for that skill, as in Daily Review.
- Game-screen skills (Freeze Zoo, Robo Path, Push & Roll, Feelings Friends) log only finished rounds: no per-answer events, and no quits.

**Next:** Phase 5b, the play-tests with [PLAYTEST.md](PLAYTEST.md). Record each tuning change and its evidence here.

### Phase 6: Today's Adventure and Play together (implemented 2026-10-16, commit `PHASE6`)

**Delivered:**
- **Today's Adventure** (`utils/adventure.js`, `screens/AdventureScreen.js`): the guided session from section 6, started from the map ("🗺️ Start today's adventure"):

  | Step | What it plays |
  |---|---|
  | ⭐ Warm-up | Skills due for review (skipped if none) |
  | 🌟 New skill | The next skill in today's main subject, with its worked example |
  | 🔀 Mixed practice | The new skill mixed with up to 2 passed skills (needs at least 2 skills) |
  | 🎈 Fun Break | A free mini-game, rotating by day |
  | 🧭 Explore | The next skill in today's second subject |
  | 😌 Cool-down | Balloon Breath, then a finale with today's stickers and "see you tomorrow" |

  - Quiz steps are 5-question rounds. Game-screen skills play their normal round.
  - The main subject alternates math and reading by weekday. The second subject rotates through science, logic and feelings.
  - **Fits the time left:** with a daily limit, steps are dropped from the end (never the cool-down) until the estimate fits. For example, 4 minutes left gives Warm-up + Cool-down.
  - Results show "▶ Continue adventure" instead of Play Again. Breaks count as done when the child comes back.
  - The plan is fixed for the day once started, and progress survives closing the app. The map button shows "Continue adventure (4/6)" and then "✓ Today's Adventure done!".
  - Finishing earns a 🗺️ adventure sticker. The parent dashboard shows on how many of the last 7 days the adventure was finished.
- **Play together** (coach mode, `curriculum/talkPrompts.js`): a "👪 Play together" toggle on the map, on until the player changes.
  - In quiz rounds the child answers. After each answer the grown-up sees a "Talk about it" card: a prompt for that subject, depending on whether the answer was right or wrong (e.g. "Ask: how did you work it out?", "Stretch out the sounds together"), plus the explanation.
  - The next question waits for "Next ▶", so there is time to talk. Prompts are shown, not read aloud, because they're for the grown-up.
  - Answers played together are marked in the play-test log, and the report counts them.
- Answer buttons now have the button role for screen readers.
- Content fix: the Fair Play question with a slide picture now asks about the slide, not a swing.
- **Tests**: 236 unit tests. New tests cover:
  - the subject rotation;
  - plans for new and experienced players, and for every band and weekday;
  - fitting the time left;
  - step routes;
  - done-step tracking;
  - the adventure sticker;
  - coach prompts for every subject.

**Verification:**
- Browser walkthrough of the Pages build with the clock set to a Tuesday, all checks passing with no page errors:
  - An 8-year-old's six-step adventure: Warm-up review → Add within 20 → mixed practice → Dance Tap (free, no ticket used) → Fair Play with Play together on → Balloon Breath → the finale with a 🗺️ sticker.
  - Random answers set off the adaptive step-down mid-adventure, as designed.
  - Coach mode showed its intro and a talk card, and didn't advance until "Next".
  - A child with 4 minutes left got Warm-up + Cool-down.
  - The dashboard counted the adventure.
- The Phase 4 and 5 walkthroughs were re-run on this build and pass.

**Notes:**
- Coach mode covers quiz rounds. Memory Chips and Number Path Race already have their own 2-player modes; the other game screens don't show talk prompts yet.
- A break step counts as done even if the child leaves it early: breaks are optional by design.
- Step times are rough estimates (`STEP_MINUTES`). Phase 5b play-tests should check them.

---

## 9. Sources

- Hirsh-Pasek et al. (2015), *Putting Education in "Educational" Apps*: https://www.psychologicalscience.org/publications/educational-apps.html
- Clements & Sarama, learning trajectories: https://en.wikipedia.org/wiki/Douglas_Clements · https://amte.net/node/2301
- Siegler & Ramani, linear board games: https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf · WWC review: https://ies.ed.gov/ncee/wwc/study/78079
- National Reading Panel findings: https://www.nichd.nih.gov/publications/pubs/nrp/findings
- Rohrer et al., interleaved math practice: https://ies.ed.gov/use-work/awards/interleaved-mathematics-practice
- Executive-function interventions review: https://pmc.ncbi.nlm.nih.gov/articles/PMC4200392/
- AAP 2016 media recommendations: https://sites.gsu.edu/bestpractices/2016/10/26/american-academy-of-pediatrics-announces-new-recommendations-for-childrens-media-use
- CCSS K–2 progression (counting & cardinality, operations): https://www.rcsdk12.org/cms/lib/NY01001156/Centricity/Domain/61/ccss_progression_cc_oa_k2_2001_05_08.pdf
- CASEL framework: https://casel.org/casel-gateway-preschool-thru-high-school-sel
- NGSS kindergarten: https://educ.state.ak.us/standards/science/Kindergarten%20Science.pdf
