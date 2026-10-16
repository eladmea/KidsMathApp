# MathPlay Learning-Games Plan (ages 3–10)

This document describes where MathPlay is heading, why it is designed this way (the research behind it), and **what has been implemented and when**.

- **Plan written:** 2026-10-15
- **Language:** English (all content, narration and phonics)
- **Last updated:** 2026-10-16 (Phase 0 implemented)

---

## 1. Status at a glance

| Phase | Scope | Status | Implemented |
|---|---|---|---|
| Pre-plan | MathPlay quiz (Easy/Medium/Hard), 2-player Memory Game with chip-gap twist | ✅ Done | 2026-08-05 → 2026-08-11 |
| **Phase 0** | Foundation: profiles, age bands, narration, skill map, mastery + spaced review, world map, generic quiz engine, tests | ✅ Done | **2026-10-16** (commit `f4e97ed`) |
| Phase 1 | Math track + Memory Chips variants, solo AI buddy, Number Path Race, Quick Look, Number Line Drop, first mini-games | ⏳ Next | — |
| Phase 2 | Literacy: Sound Snack, Word Builder, Story Strip, recorded letter sounds | 🔜 Planned | — |
| Phase 3 | Science, Logic & Executive Function: Garden Days, Dress for Weather, Push & Roll, Robo Path, Freeze Zoo | 🔜 Planned | — |
| Phase 4 | Social-emotional learning & polish: Feelings Friends, Balloon Breath, sticker book, parent dashboard + time limits | 🔜 Planned | — |
| Phase 5 | Play-testing with 2–3 kids per age band, difficulty tuning | 🔜 Planned | — |

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
| Dot Chips | 3–5 | Dot pattern ↔ numeral | Gap counted by tapping chips | 1 |
| Classic Chips | 5–7 | Number ↔ same number | Original rules | ✅ Pre-plan |
| Fact Chips | 7–10 | `3×4` ↔ `12` | Gap = difference between answers | 1 |
| Fraction Chips | 9–10 | ½ ↔ 2/4 ↔ picture | Gap in quarters/eighths | 1 |
| Letter Chips | 4–6 | Letter ↔ picture | "Alphabet steps" between letters | 2 |

The variants also get a **solo mode against an AI buddy** and a post-game reflection on the chip trade.

### B. Core learning games

| Game | Subject | Ages | Phase |
|---|---|---|---|
| Number Path Race (linear board game) | Math | 3–7 | 1 |
| Quick Look (subitizing flash) | Math | 3–6 | 1 |
| Number Line Drop | Math | 5–10 | 1 |
| Lemonade Stand (money) | Math | 7–10 | 1+ |
| Sound Snack (first sounds) | Literacy | 3–6 | 2 |
| Word Builder (phonics tiles) | Literacy | 5–8 | 2 |
| Story Strip (sequencing) | Literacy | 4–9 | 2 |
| Garden Days (plant needs over real days) | Science | 4–8 | 3 |
| Dress for Weather | Science | 3–6 | 3 |
| Push & Roll | Science | 5–8 | 3 |
| Robo Path (coding) | Logic | 4–10 | 3 |
| Freeze Zoo (go/no-go) | EF | 3–8 | 3 |
| Feelings Friends | SEL | 3–8 | 4 |

### C. Mini-games (60–90 s breaks)

Bubble Pop · Chip Toss · Dance Tap · Color Me · Balloon Breath · Peekaboo Hide & Seek. New simple ideas: **Chip Bridge** (cooperative add/subtract to hit a target) and **Echo Monster** (growing memory sequence).

---

## 6. Session structure

1. **Warm-up** (2 min): spaced review.
2. **New skill** (3–4 min): the buddy demonstrates, then the child and buddy try one together, then the child plays alone.
3. **Mixed practice** (3–4 min): a different mechanic, interleaving new and old skills.
4. 🎈 **Mini-game** (1–1.5 min).
5. **Second subject** (3 min): subjects rotate through the week.
6. **Cool-down**: a calm activity, the stickers earned, and "see you tomorrow!"

Adaptive rules (target):
- 3 wrong answers in a row: drop a level and show a hint.
- 5 right answers in a row: speed up.

Rewards are cosmetic stickers shown *after* the thinking, never shops or pressure timers.

---

## 7. Implementation log

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

### Phase 1: next

Memory Chips variants with a solo AI buddy, Number Path Race, Quick Look, Number Line Drop, and the first 3 mini-games.

---

## 8. Sources

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
