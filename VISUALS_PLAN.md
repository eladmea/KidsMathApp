# Visuals plan: replace and improve the pictures

Goal: the whole game looks like one illustrated world, in the 3D cartoon style of the
Microsoft Fluent emoji and of the ComfyUI pictures already in the Kitchen. We start
where every child starts, with the welcome page and the islands, and then go through the
rest of the game in the order children meet it.

Every phase ends as its own PR with before and after shots, so the look can be judged
and changed early.

## Rules for every phase

- **One family of pictures.** Objects are drawn with `scripts/comfy-picture.mjs` in the
  house style (ARCHITECTURE.md, "Make a picture with ComfyUI") and logged in its table.
  The Fluent emoji stay for the small icons that already look right (🔒, 🏅, ⭐, the
  buddies).
- **Found by folder, with emoji as the fallback.** `art()` already looks for
  `islands/<subject>` and `skills/<skill id>` before drawing the emoji, so most pictures
  need no code change. Each one is just a file dropped in.
- **Tablets first.** Every picture in `src/assets/images` loads when the game starts.
  - Objects stay 384 px WebP, about 25 KB each.
  - Big backdrops need the loading change in phase 0 before any is added.
- **Each phase is checked the same way:**
  - before shots and after shots at 1280 × 720 and at phone size (844 × 390);
  - each picture shown on its real background;
  - `npm run lint`, `npm test` and the walkthroughs for the scenes it touches.

## Phase 0: tools for more than food (done)

Done as planned. `object` was added next to `food`, so the Kitchen pictures keep their exact prompt. The island and beach prompts were fixed in two tries each.


The house prompt is written for food: "(inanimate food object:1.3)". Islands, a chest
and backdrops need their own wording, so the script gets kinds, each with a fixed house
prompt:

| Kind | For | Page | Cut out |
|---|---|---|---|
| `object` (now the default) | food, chests, props, skill pictures | 1024 × 1024 | yes, BiRefNet, 384 px |
| `place` | an island seen from above at three-quarters, floating on plain white | 1024 × 1024 | yes, 512 px |
| `backdrop` | a full scene behind the UI: sky, sea, beach, with quiet space where the buttons go | 1344 × 768, scaled to 1280 × 720 | no, WebP about 120 KB |

- **New option:** `--kind object|place|backdrop` in `scripts/comfy-picture.mjs`.
  ARCHITECTURE.md gets the two new prompts and the lessons learned for them.
- **Backdrops load with their scene, not at start.** A new `src/assets/backdrops/<scene>.webp`
  folder is loaded in that scene's preload, the same way recordings are fetched before
  they are needed. If there is no file, the scene keeps its plain colour.
  - This changes `services/assets.js` and `BaseScene`, so it gets a unit test and a
    walkthrough check that the game still starts with no backdrops at all.
- **One picture try per kind, to fix the prompts:** an island and a beach backdrop.
  Changes to the prompts are agreed with you before phase 1 starts.

## Phase 1: welcome and "Who's playing?" (done)

What was done:
- the overlap is fixed;
- the beach backdrop is on both screens, with a cream card over the form;
- the "Who's playing?" sign;
- bigger cards;
- the chosen buddy drawn as a picture;
- the grown-ups links on white tags.

What changed from the plan:
- The New player card uses the Fluent ➕ picture. A drawn one wasn't needed.
- "Manage players" was already behind the grown-up check, so both links stay. Manage now has its own ✏️ icon.


Scenes: `CreateProfileScene` (Welcome / New player) and `ProfilesScene`.

What's wrong today:
- **Welcome:** a plain cream page. The second row of buddies runs into the Language row
  (koala to penguin sit on top of "English / עברית"). This is a layout bug to fix first.
- **Who's playing?:**
  - a plain blue page with a lot of empty space;
  - the cards are small;
  - "Grown-ups: manage players" and "Grown-ups" use the same 👪 icon.

Plan:
1. **Fix the overlap.** Lay out the buddy grid from the number of buddies, so the
   Language row always sits below it. Add a walkthrough check that no rows overlap.
2. **Backdrop `profiles`:** a sunny beach at the edge of the sea, with the islands small
   on the horizon. This is the first look at the world the child is about to enter.
   CreateProfile uses the same backdrop with a soft cream panel over the form.
3. **Welcome sign:** a `place` picture of a wooden sign or a little boat at the jetty
   where "Who's playing?" sits. The words stay text, drawn over it through `t()`.
4. **Player cards:** bigger cards (the buddy at about 130 px), each with a light colour
   wash in its age band's colour. The "New player" card gets a picture (`ui/new-player`)
   instead of the plain green block.
5. **Grown-ups:** one way in, with a key or lock picture (`ui/grown-ups`). "Manage
   players" moves behind the parent gate.

## Phase 2: the world map (done)

What was done:
- six island pictures;
- the painted sea, in place of the flat colour and the drawn clouds;
- the buddy bobbing in a boat beside its home island.

"As planned" except:
- The islands came out alike, all palm trees and lagoons. Each subject's own things (blocks, puzzle pieces, the heart pond, the beach hut) tell them apart, together with the name ribbon.
- The top bar and bottom row have no extra frame: their white buttons already read well on the sea.


Scene: `WorldMapScene`.

What's wrong today:
- The islands are flat pale blobs with a text-like emoji on them (🔢, 🔤, 🌿, 💛, 🧩, 🍳).
- The sea is one flat colour with "〰" text waves.

Plan:
1. **Six island pictures** (`islands/<subject>`, kind `place`), each with its own look:
   - Number Island: blocks and number shapes;
   - Word Woods: trees with letter leaves;
   - Nature Bay: a lagoon and plants;
   - Feelings Garden: flowers and a heart-shaped pond;
   - Puzzle Peak: a hill of puzzle pieces;
   - Kitchen Cove: a beach hut kitchen.

   When a picture exists, `drawIsland()` is skipped, the island keeps its bob, and the
   name ribbon and progress counts stay as they are.
2. **Backdrop `worldmap`:** open sea with a soft painted texture, darker toward the
   bottom. The animated waves and clouds stay on top. Clouds become 2 or 3 `object`
   pictures in place of the white circles.
3. **The child's buddy** stands on its home island in a little boat (`ui/boat`, buddy in
   front), so it reads as "you are here".
4. **The top bar and the bottom row** keep their buttons, with a light frame so they sit
   on the picture rather than float over it.

## Phase 3: inside an island (done, except skill pictures)

What was done:
- a painted close-up for each island;
- on it, the road gets a light edge and the stop names get white labels;
- chest pictures for closed and open.

Still to do:
- **Skill stop pictures** (item 4) aren't drawn yet. The Fluent emoji still read well on the stops.
- **The close-ups are busier than planned:** the model wouldn't leave a clear sandy middle. Simpler pictures are a good follow-up.


Scene: `IslandScene`.

What's wrong today:
- One huge flat blob fills the screen.
- The road is drawn lines.
- The chest is the 🎁 and 👑 emoji.

Plan:
1. **Six island backdrops** (`backdrop` kind, `island-<subject>`): the island close up,
   from above, with an open sandy area where the stops' road goes. Each matches its map
   picture. This needs the stop positions to stay inside a clear zone; the zone gets
   checked in the walkthrough.
2. **The road** is drawn as stepping stones or a sandy path (an SVG or `object` pictures)
   in place of dotted lines.
3. **Treasure chest:** two `object` pictures (`ui/chest-closed`, `ui/chest-open`) with
   the open one used for the reward moment.
4. **Skill stops:** 70 skills fall back to their Fluent emoji, and these already read
   well, so they are done last and in batches, one island per PR. The ones that read
   worst come first: number tiles like 🔢 and 1234, letter blocks, and grey or abstract
   emoji.

## Phase 4: the rest of the game, in the order children meet it (started)

What was done:
- Every scene now draws its background with `addBackdrop`, so dropping `src/assets/backdrops/<Scene>.webp` in is all a game needs.
- Backdrops are in for Games, Sticker Book, Fun Break, Today's Adventure and Results, each with a colour wash so their cards stay readable.

Still to do:
- the game scenes' own backdrops and props;
- the remaining Kitchen recipes.


1. Today's Adventure, Results and the reward screens (stars, stickers, Fun Break tickets).
2. The Games hub and the Sticker Book.
3. Each game scene, one PR per few scenes:
   - its backdrop;
   - its own props (the Kitchen's fridge, cupboard and tools are still SVGs, and the
     other Kitchen recipes are next after Hot Dogs).
4. The Parent Dashboard stays plain and clear on purpose. It only gets the new grown-ups
   icon.

## Decisions for you

- **Backdrops or plain colours?** Painted backdrops make the biggest difference, but they
  add about 120 KB per scene, loaded with that scene. The alternative is keeping the flat
  colours and only adding the island and object pictures.
- **Skill pictures:** replace all 70 stop emoji over time, or only the ones that read
  badly?
- **Order after phase 3:** follow the plan above, or start with the games your children
  play most?
