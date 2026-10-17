# MathPlay play-test guide

A guide for running Phase 5: play-testing with **2–3 children per age band**, then tuning difficulty. Print it, or keep it open on a second device.

The app records every answer on the device the child plays on. The **Parent dashboard** is on "Who's playing?": tap **👪 Grown-ups** and answer the grown-up question. Your job is to watch what the numbers can't show: confusion, boredom, delight, and where the child looks for help.

---

## Before the session

- [ ] Ask the parent's permission, and tell the child it's a game test: "You're helping us find what's too hard or too easy. You can't get it wrong."
- [ ] Use a fresh profile per child, with their real age. Each age band starts at its own skills.
- [ ] Turn the sound up. Read-aloud is on by default for ages 3–6.
- [ ] Open **Parent dashboard → Daily limit** and set the session length below. When time is up, the app ends the session gently by itself.

| Band | Ages | Session | Sessions per child |
|---|---|---|---|
| 🌱 Sprouts | 3–4 | 10–15 min | 2, on different days |
| 🧭 Explorers | 5–6 | 15 min | 2–3, on different days |
| 🧱 Builders | 7–8 | 15–20 min | 2–3, on different days |
| 🏆 Masters | 9–10 | 20 min | 2–3, on different days |

Mastery needs passes on **2 different days**, and Garden Days grows once a day. One session can't test either, so plan at least two days per child.

## During the session

- Sit beside the child, but **don't help** unless they ask twice or get upset. Note when you had to step in.
- Let them choose where to go on the map. Nudge only if a subject is never visited.
- Think-aloud prompts (use sparingly): "What do you think you have to do here?" · "How did you know?" · "Was that easy or tricky?"

### Watch for

| Sign | What it may mean | Write down |
|---|---|---|
| Taps before the question finishes | Guessing, or the question is too easy | Skill name, roughly how often |
| Presses 🔊 again and again | The prompt is unclear or too long | The exact prompt |
| Looks at you, frowns, freezes | Doesn't know what to do | Screen name, what they tried |
| ⬇️ "Let's practice…" appears | Adaptive difficulty stepped down after 3 wrong answers | Did the hint help? |
| ⚡ "Level up!" appears | Stepped up after 5 right answers | Did the harder level feel fair? |
| Leaves a round (←) | Bored, frustrated or confused | Why, if they tell you |
| Smiles, laughs, asks for more | Working well | Which game |
| Asks to skip the Fun Break | Rewards may be in the way | — |

Add notes as you go in **Parent dashboard → child → 🧪 Play-test report → Session notes**. They are saved with the data.

### Per-band focus

- **Sprouts (3–4):** Can they play without reading? Are the tap targets big enough? Do Feelings Faces, Sound Snack and Bunny Pop make sense from speech alone? Can they trace digits in Number Tracing? Which pre-writing stroke in Bee Paths is hardest? Can they drag toppings and candles, and do they count while placing them? Do they understand "tap each square" in Number Path Race?
- **Explorers (5–6):** Does Word Builder's sound blending click? Is Robo Path's arrow programming clear without help? Is Freeze Zoo's rule switch fair at this age? Does Feelings Friends' "what could help" feel natural?
- **Builders (7–8):** Are the Plus & Minus Chips gaps too slow to work out? Is Story Strip ordering obvious? Are the Fair Play choices too obvious?
- **Masters (9–10):** Are Times & Divide and Fraction Chips challenging but fair? Do Logic Grids need paper? Are In Their Shoes answers too easy for this age?

## After the session

1. Ask the child: "What was your favourite? What was the most boring? Was anything too hard?"
2. Open **Parent dashboard → 🧪 Play-test report** for the child and look at the flags:
   - **too hard**: under 60% right after 10+ tries.
   - **too easy**: 95%+ right and under 3 s per answer.
   - **unclear**: the question was replayed on half the tries or more.
   - **drop-off**: a third or more of the rounds were left early.
   - ⬇️ / ⚡ counts show how often adaptive difficulty stepped down or up.
3. Tap **⬇️ Export play-test data (CSV)** on the dashboard after each day. It has one row per answer, round, quit, level change and note, for every child. Collect the files from all testers in one folder.
4. Clear a child's log only after exporting (**Clear play-test log**).

## Tuning afterwards

Bring the exported CSVs and notes back, and tune skill by skill:

| Finding (across 2+ children) | Likely change |
|---|---|
| Flagged *too hard* in its own band | Smaller numbers or fewer choices in its generator (`curriculum/*Generators.js`), a clearer how-to line (`curriculum/howTo.js`), or a prerequisite added in `curriculum/skills.js` |
| Flagged *too easy* in its own band | Larger range, harder distractors, or move it to an earlier band |
| *Unclear* | Rewrite the prompt and speech, or add a picture |
| *Drop-off* | Shorter rounds, more feedback, or a different mechanic |
| Steps down a lot | The gap to the prerequisite is too big. Add an in-between skill |
| Time limits feel wrong | Change the defaults in `utils/playTime.js` |

Record each change and the evidence behind it in `PLAN.md` under Phase 5.
