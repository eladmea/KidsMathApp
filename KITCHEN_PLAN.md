# Kitchen Island: plan

A new island where children cook healthy recipes by following a recipe card:
take the ingredients out of the fridge and cupboard, measure them
("2 cups of oats", "1 tablespoon of honey"), cook, clean up while it bakes,
then serve a nice-looking dish to a friend. The maths is counting, measuring,
fractions, sharing equally, scaling a recipe and reading a timer.

Status: **plan only, nothing built yet.**

---

## 1. The recipes

Four real, healthy recipes. Ingredient lists are taken from the sources, and
the amounts are rounded to kid-friendly numbers. The changes are listed so
the recipe card can say "adapted from …", and a grown-up could cook it for real.

### 🫐 Berry Banana Smoothie (no heat, for the youngest)
Source: a common kid smoothie formula (e.g. [Kids Activity Zone](https://kidsactivityzone.com/berry-smoothie/), [Picky Eater Blog](https://pickyeaterblog.com/healthy-banana-berry-smoothie/)).

| Ingredient | Amount | Where |
|---|---|---|
| Banana | 1 | cupboard (fruit bowl) |
| Berries (strawberries, blueberries) | 1 cup | fridge |
| Plain yogurt | ½ cup | fridge |
| Milk | ½ cup | fridge |
| Honey | 1 tablespoon | cupboard |

Steps: peel the banana → measure → blender (hold the button) → pour into 2 glasses → put a berry and a straw on top.

### 🧁 Banana Oat Muffins (the "cupcakes")
Source: [Yummy Toddler Food, Banana Oatmeal Muffins](https://www.yummytoddlerfood.com/banana-oatmeal-muffins/): no flour and no oil.

| Ingredient | Original | In the game |
|---|---|---|
| Rolled oats | 2 cups | 2 cups |
| Ripe bananas | 2 medium | 2 |
| Plain Greek yogurt | 6 oz | ¾ cup (3 × ¼ cup for older children) |
| Maple syrup | ⅓ cup | ¼ cup (less sugar, and a fraction children know) |
| Eggs | 2 | 2 |
| Baking soda | 1 tsp | 1 teaspoon |
| Cinnamon, vanilla | some | 1 teaspoon each |

Steps: grind the oats in the blender → add the rest → blend → fill 12 muffin cups (one scoop each) → **oven** (grown-up helper) → set the timer for 20 minutes → **clean up while it bakes** → decorate each muffin with blueberries.

### 🍳 Veggie Omelette
Source: Spinach, Tomato and Cheese Omelette ([Panlasang Pinoy](https://panlasangpinoy.com/?p=43158)), with the milk splash from [Abbey's Kitchen](https://www.abbeyskitchen.com/?p=177683).

| Ingredient | Original | In the game |
|---|---|---|
| Eggs | 2 | 2 |
| Milk | 1 tbsp (Abbey's) | 1 tablespoon |
| Baby spinach | ¾ cup | ½ cup (a round handful) |
| Tomato | 1 small | 1, cut into 4 pieces |
| Grated cheddar | ½ cup | 2 tablespoons (less fat and salt) |

Steps: crack the eggs (tap) → whisk (stir) → cut the tomato in half, then in half again → **stove** (grown-up helper) → pour, add the vegetables and cheese → fold in **half** → slide onto the plate, with tomato pieces on the side.

### 🍔 Turkey Oat Burgers
Source: [Mayo Clinic, Barbecue Turkey Burger](https://www.mayoclinic.org/healthy-lifestyle/recipes/barbecue-turkey-burger/rcp-20197677): oats in the patty, whole-wheat bun.

| Ingredient | Original (2 burgers) | In the game (4 burgers) |
|---|---|---|
| Ground turkey breast | ½ lb | 1 pound (1 pack) |
| Chopped onion | 1 cup | 1 cup |
| Dry oats | ½ cup | 1 cup |
| Ketchup | ¼ cup | ¼ cup |
| Brown sugar | 2 tbsp | 1 tablespoon honey (less sugar) |
| Spices (chili powder, paprika …) | 1 tsp … ¼ tsp | 1 teaspoon paprika, ½ teaspoon garlic powder (no cayenne) |
| Whole-wheat buns | 2 | 4, plus lettuce and tomato slices |

Doubling the original is itself an older children's level ("the recipe makes 2, we need 4").
Steps: mix → **split the mixture into 4 equal patties** → stove, flip → build each burger in order: bun, lettuce, patty, tomato, bun.

> Sources were read from search results. This session's network blocks the
> recipe sites, so the amounts are worth checking once against each page
> before they go into the game.

**"Healthy" without labelling food bad.** Following child-feeding guidance, the game never calls a food bad or junk. The healthy part is in the recipes themselves: fruit, vegetables, whole grains, less sugar. The extra items in the fridge and cupboard are other recipes' ingredients, not candy to resist.

**Safety habits built in:** every recipe starts with *wash your hands* (a quick scrub) and ends with cleaning up. The oven, stove and knife steps show a grown-up helper (a 🧑‍🍳 hand that does the hot or sharp part while the child taps), and the spoken line says "Ask a grown-up to help with the oven."

---

## 2. How a game goes: the stations

One scene, `KitchenScene` (`static plays = ['Kitchen']`). Each recipe is data that lists its steps, so the scene runs those stations in order. The camera pans along one long kitchen: **fridge and cupboard → counter → stove/oven → sink → table**.

| # | Station | What the child does | Maths | Reuses |
|---|---|---|---|---|
| 0 | **Recipe card** | Sees the picture recipe (ingredient + number + measuring tool) and hears it read | reading amounts | Narrator, RulesCard |
| 1 | **Wash hands** | Scrubs the hands under the tap until the bubbles fill up | — | coverage (`coverAt`/`coverageRatio`) |
| 2 | **Gather** | Taps the fridge and cupboard doors open and drags what the card shows to the counter. Things you count have to match the count (2 eggs, 2 bananas). Something wrong gets a gentle "That's not in our recipe" and goes back | counting, matching | new `Pantry` (finite items, not the endless `DragTray`) |
| 3 | **Measure** | Picks the right tool (cup, ½ cup, ¼ cup, tablespoon, teaspoon) and scoops into the bowl; the bowl fills and a tally shows the scoops. "¾ cup" with only a ¼ cup = 3 scoops | units, fractions, repeated addition | new `MeasureStation` |
| 4 | **Prepare** (per recipe) | Crack (tap), stir/whisk (circle drag), chop (swipe, like the pizza cuts), peel, shape patties (split into N equal parts) | halves and quarters, equal sharing | `isCut`, stir gesture |
| 5 | **Cook** | Oven or stove or blender: the grown-up helper puts it in, and the child turns the timer dial to the number on the card (20 min). Flips the patty or folds the omelette in half | reading a number on a dial or clock | new `TimerDial` |
| 6 | **Clean up** (while the timer runs) | Puts each ingredient away (**cold → fridge, dry → cupboard**), drags bowls and spoons into the sink, wipes the counter until it shines. When the timer rings, cooking is done | sorting, a countdown | `Pantry` (reversed), coverage |
| 7 | **Serve & decorate** | Plates the dish and decorates it: blueberries on each muffin, a berry and a straw on the smoothie, building the burger in order. A friend (`CUSTOMERS`) eats it, and celebrate() | counting to a number, order | DragTray, Juice |

**Points** (`finishRound(skillId, points, total)`), one for each:
everything gathered right the first time, every measure right the first time, cleaned up before the timer rang, served as the card asked. 4 points per recipe; passing works like the other games.

**Hints:** `IdleHint` points at the next ingredient, door or tool. A second wrong scoop shows the right tool glowing. No timers that can make a child lose: the oven timer only paces the clean-up.

---

## 3. Levels by age (the skills on the island)

The same four recipes come back harder in each band (`kitchenLevel` on the skill, like `towerLevel`).

| Band | Skill (recipe) | What changes |
|---|---|---|
| 🌱 Sprouts 3-4 | 🫐 Smoothie | Whole numbers only: "1 banana, 5 strawberries, 2 scoops of yogurt". One tool (a scoop). No timer dial: the blender is a big button |
| 🌱 Sprouts 3-4 | 🧁 Muffins (easy) | Count 2 bananas and 2 eggs; fill 6 muffin cups one each (one-to-one); 3 blueberries on each |
| 🧭 Explorers 5-6 | 🍳 Omelette | Cups and spoons as whole units; cut the tomato into 2 then 4; fold in half; timer up to 10 |
| 🧭 Explorers 5-6 | 🧁 Muffins | The real recipe in whole units; 12 cups; set the timer to 20 |
| 🧱 Builders 7-8 | 🍔 Burgers | ½ and ¼ cups, tablespoon vs teaspoon; split the mixture into 4 equal patties; 4 burgers × 5 layers |
| 🧱 Builders 7-8 | 🫐 Smoothie for 4 | Double every amount (½ cup → 1 cup) |
| 🏆 Masters 9-10 | 🧁 Muffins, ¼-cup only | Make ¾ and 2 cups with a ¼ cup (how many scoops?); double or halve the batch; 24 muffins into 2 tins |
| 🏆 Masters 9-10 | 🍔 Burgers from the original | The card makes 2, the party is 4 (or 6): scale ½ lb, 1 cup, ½ cup; timer in minutes and seconds |

---

## 4. Where the code goes (following ARCHITECTURE.md)

**New files (found by folder, no list to edit):**

| File | What |
|---|---|
| `src/logic/kitchen.js` | Phaser-free rules: amounts as whole quarters (`{ unit: 'cup', quarters: 3 }`, so there are no float bugs), `scaleRecipe(recipe, factor)`, `scoopsFor(amount, tool)`, `checkGather(counter, recipe)`, `isCold(item)` for put-away, `splitEqually(total, parts)`, `levelRecipe(recipe, kitchenLevel)` |
| `src/logic/recipes/*.js` | One file per recipe (`smoothie.js`, `muffins.js`, `omelette.js`, `burgers.js`): ingredients (key, emoji, amount, unit, where it is kept), steps, and the dish it makes. Found with `import.meta.glob`, so a fifth recipe is a new file. No words in them |
| `tests/kitchen.test.js` | Scaling, scoop counts, gather checks, every recipe valid at every level (amounts in quarters, every step known, every ingredient has a place) |
| `src/scenes/KitchenScene.js` | The scene: runs the recipe's stations in order, `tag()`s doors, items, tools, dial and sink, and `report()`s the station and counts |
| `src/ui/kitchen/Pantry.js`, `MeasureStation.js`, `TimerDial.js`, `StirGesture.js` | The station pieces, so the scene stays small (Pizza Shop is already 800 lines) |
| `src/i18n/en/kitchen.json` | UI text: station titles, "Ask a grown-up to help", buttons |
| `src/content/en/kitchen.js` | Ingredient and dish names, units with plurals ("1 cup / 2 cups", "½ cup"), and `say` phrases. Spoken lines follow the voice rules: what varies goes in its own sentence ("Oats. Two cups."), and every value can be listed for recording |
| `src/assets/images/kitchen/*.svg` | Pictures there is no emoji for: **fridge (open and closed), cupboard, counter, oven, stove, sink, measuring cups ½ / ¼, spoons, muffin tin, timer dial**. Drawn with `art()` and an emoji fallback, like `cake/*.svg` |
| `e2e/kitchen.mjs` | Walkthrough: open the island, cook the smoothie start to finish through the tags, check `report()` at each station, and one wrong ingredient going back |

Ingredients mostly have Fluent emoji (🥚 🥛 🍌 🫐 🍓 🥬 🍅 🧀 🧅 🍯 🧂 🥣 🧁 🍔 🍳 🥤). Oats and ground turkey have none, so they get a jar and a pack picture in `kitchen/`. Then run `npm run art:fluent` to add the new emoji to the atlas.

**The few shared places a new island has to touch.** An island is a subject, and subjects are still a list. These edits can't be avoided:

1. `src/curriculum/subjects.js`: add `{ id: 'kitchen', emoji: '🍳', color: '#E8613C', light: '#FFE3D6' }`.
2. `src/curriculum/skills.js`: the 8 skills above, plus `'Kitchen'` in `SKILL_SCREENS`.
3. `src/scenes/WorldMapScene.js`: `ISLANDS` has five places in one row. Six need a new layout: **two rows of three**, or a smaller `SIZE`. The avatar and progress badges follow.
4. `src/scenes/ParentDashboardScene.js`: the sixth progress row (`TOP + 285`) runs into the hint at `TOP + 290`. Move the hint down or tighten the rows.
5. `src/logic/adventure.js`: add `'kitchen'` to `SECOND_SUBJECTS` so the daily adventure sometimes cooks (or leave it out at first, see the questions).
6. `src/i18n/en/curriculum.json`: the island name (`subjects.kitchen`) and the skill titles; `voiceLines.js` picks the island name up by itself.

A cleaner option, worth doing first or alongside: move island positions into `subjects.js` (or lay them out automatically from how many there are), so the next island only needs `subjects.js`.

**Hebrew:** game skills show for every language as soon as the scene exists (`isAvailable` only checks `GAME_SCENES`), so without a Hebrew `kitchen` pack the island would show English words. Either add `src/content/he/kitchen.js` (כוס, חצי כוס, כף, כפית, with number gender handled in the pack) in the same change, or add an `isAvailable` check that a game skill's `pack` exists in the language, so it shows 🚧 until it does. I recommend the check: it is small, and it protects later games too.

---

## 5. Phases

| Phase | Scope | Done when |
|---|---|---|
| **K0 Rules** | `logic/kitchen.js`, the four recipe files, unit tests | `npm test` covers scaling, scoops, checks and every recipe at every level |
| **K1 Island + Smoothie** | Subject, map layout for 6, dashboard row, the scene with Wash → Gather → Measure → Blend → Clean → Serve, `Pantry`, `MeasureStation`, placeholder art, i18n + content, the pack check for Hebrew, `e2e/kitchen.mjs` | A 3-year-old can make the smoothie on a tablet; lint, tests and walkthroughs pass |
| **K2 Muffins** | Oven, `TimerDial`, clean-up during baking, filling the tin, decorating | Muffins at the Sprouts and Explorers levels |
| **K3 Omelette + Burgers** | Crack, whisk, chop, stove, fold, flip, equal patties, building in order | All four recipes play |
| **K4 Harder levels** | Fractions with one tool, doubling and halving, minutes and seconds | Builders and Masters levels; generated amounts tested |
| **K5 Art, voice, Hebrew** | Final SVGs (fridge, cupboard, oven, sink), sounds (sizzle, blender, timer ding), recorded lines, Hebrew pack | Play-test with children (PLAYTEST.md) |

---

## 6. Questions before building

1. **Ages:** all four bands as above, or start with the younger ones (Smoothie and Muffins only)?
2. **Amounts:** rounded kid-friendly amounts with "adapted from …" (recommended), or the exact original amounts (for example ⅓ cup and 6 oz), which are harder to show with a game's scoops?
3. **Clean-up:** put away + dishes in the sink + wipe the counter, all three every time? Or one clean-up job per recipe, so a round stays under about 5 minutes for the youngest?
4. **Daily adventure:** should the Kitchen join it straight away, or stay a free-play island first?
5. **"Cook it for real":** later, a printable recipe card in the Parent Dashboard so a family can make the same dish together?
