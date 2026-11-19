# Game pictures plan: drawn pictures in the games, food first

## Status (done in one pass)

- **Part 1:** done. All 17 ingredients are drawn.
- **Part 2:** done for:
  - the burger, omelette and muffin cooking pictures;
  - the muffin, omelette, smoothie, strawberry and salad serving pictures;
  - the four dishes, also used as the Kitchen Cove skill-stop pictures.

  Not done:
  - **The burger stack's layers** (bun halves, patty) never came out as single pieces,
    so they keep their emoji.
  - **The banana slice and the bread roll** didn't read well. The muffins use the whole
    banana picture, and the hot dog roll keeps its emoji.
- **Part 3:** done for the cup, spoon, jug, scale, mixing bowl and sponge. The cup,
  spoon and jug SVGs are deleted. The fridge, cupboard, oven and sink stay SVGs,
  because their doors open and close and need matching open and closed pictures.
- **Part 4:** done for the mushroom topping, the rolling pin, the baked pizza in the oven
  and the backdrop. Not done:
  - the olive, corn and pineapple (rings, scattered kernels, and faces on every try);
  - the pizza steps, which are painted by the game.
- **Part 5:** only the backdrop. Every cake was drawn with its own candles, so the SVG
  cake stays.
- **Part 6:** not needed. The Fluent food reads well in the questions.
- **Part 7:**
  - Backdrops are in for 19 game screens, each with a colour wash so the game pieces
    stay clear.
  - Kitchen Cove keeps its plain wall, because it draws its own tile pattern, which
    clashed with a picture.
  - Trace Path and Trace Digits share one screen with other tracing games, so they
    keep their colours.
  - The props stay Fluent, because they already read well.


Goal: the games use the same drawn 3D cartoon pictures as the Hot Dogs recipe, the map
and the islands. They replace the Fluent emoji and the hand-drawn SVGs wherever a
drawing reads better. Food goes first because it is the biggest set and the Hot Dogs
recipe already shows the way. Each part below is one PR with before and after shots.

## How every part is done

- **Drawing:** pictures are drawn with `scripts/comfy-picture.mjs` and the ComfyUI house
  prompts. Four seeds each, and the pick is the one that reads best at its real size.
- **Kinds:**
  - `food` for anything eaten;
  - `object` for tools, props and appliances;
  - `backdrop` for a game's screen.
- **Logging:** each picture is logged with its subject and seed in ARCHITECTURE.md, in
  the "Made so far" table.
- **Found by folder, emoji as fallback:**
  - `kitchen/food/<ingredient key>` for Kitchen Cove ingredients;
  - `toppings/<id>` for pizza toppings;
  - `kitchen/<name>` for Kitchen props;
  - `emoji/<code>` only when the emoji means the same thing everywhere in the game.
- **Before the PR:**
  - each picture is checked on a dark and on a wooden background;
  - `npm run lint` and `npm test`;
  - all walkthroughs run once, after the last part of a batch.
- **Not replaced:** the Fluent emoji for animals, faces and feelings. They already read
  well, and the children know them as the buddies. Small marks like 🔒, ⭐ and ✓ also
  stay.

## Part 1: Kitchen Cove ingredients (17 pictures, no code change)

Hot Dogs is done: hot dog, sausage, onion, garlic, chicken, ketchup, egg, cornflour, soy
sauce, oil. These ingredients from the other four recipes still show emoji, also in the
pantry, where any recipe's ingredients can turn up as extras:

| Recipe | Ingredients still to draw |
|---|---|
| Turkey Burgers 🍔 | turkey (minced meat, not 🥩 steak), oats, carrot, olive oil |
| Banana Muffins 🧁 | banana, coconut oil, honey, wholemeal flour, baking soda, cinnamon |
| Vegetable Omelette 🍳 | zucchini, parsley, baking powder |
| Strawberry Smoothie 🥤 | strawberries, milk, yogurt, vanilla |

What the Hot Dogs work taught:
- **Packets and jars:** a plain blank container, with the product's name left out of the
  subject (baking soda, baking powder, oats, flour, vanilla).
- **Powders:** a heap in a small wooden scoop or bowl, never a sack, which fills with
  sweets.
- **Meat:** described by its shape, without the animal's name ("raw minced meat in a
  small round heap").
- **Pairs that must look different side by side:** baking soda and baking powder (white
  and blue tubs), coconut oil and olive oil (white jar and green bottle).

## Part 2: Kitchen Cove cooking and serving (about 15 pictures, small code change)

Today only Hot Dogs has its own cooking picture (`cook.picture`). Everything else being
cooked or served is an emoji: 🥩 in the pan, 🍳, 🧁 in the oven, 🍓 in the blender, and
the 🍔, 🍞, 🥬, 🍅, 🥗 and 🥖 on the plates.

1. **Cooking pictures** (`kitchen/cooking/<recipe>`, kind `food`): turkey patties in a
   pan, an omelette in a pan, muffins in a tray, and a smoothie in a blender jug.
   - Code: each recipe gets `cook.picture`, the same way Hot Dogs already has one.
2. **Serving pictures** (`kitchen/serve/<name>`):
   - the burger stack's layers: bun bottom, lettuce, patty, tomato slice, bun top;
   - a muffin, an omelette slice, a smoothie glass, a bread roll, a strawberry, a banana
     slice and a salad bowl.
   - Code: the serve step draws `art()` with these keys in place of `glyph()` emoji. It
     keeps the emoji as the fallback, so the walkthroughs see no change in behaviour.
3. **The cooked hot dog on its roll**: `emoji/1f32d` is already drawn, so nothing to do.

## Part 3: Kitchen Cove tools and furniture (about 14 pictures)

The fridge, cupboard, oven, sink, cup, spoon and jug are hand-drawn SVGs, and the
measuring tools, bowl, sponge and hands are emoji. Next to the drawn food they look flat.

- **Furniture** (kind `object`, `--size 640`): fridge, cupboard, oven, sink.
  - These are big and get opened, so each needs an open and a closed picture.
  - If a matching pair can't be drawn, keep the SVGs: the open and close animation
    matters more than the style.
- **Tools** (kind `object`):
  - the measuring set: cup, ½ cup, ¼ cup, tablespoon, teaspoon, ½ teaspoon, jug;
  - the kitchen scale, mixing bowl, sponge and blender.
  - The three cups and the three spoons must clearly differ in size: one picture each,
    drawn the same way, then scaled in code (`TOOL_SIZES` already does this).

## Part 4: Pizza Shop (about 9 pictures)

- **Toppings** (`toppings/<id>`, kind `food`): olive (today a drawn circle), corn,
  mushroom, pineapple.
  - Each must read at 40 px on top of the pizza, so each is a single piece seen from
    above.
- **The pizza at each step** (`pizza/dough`, `pizza/sauce`, `pizza/cheese`, `pizza/baked`):
  - Seen from above and round, so the drawn toppings sit on it.
  - The dough is rolled out by painting (`PaintLayer`), so the dough picture shows
    under the paint.
  - Check the step stays clear before replacing more.
- **Props:** rolling pin (today 🥖) and the oven (today 🔥 over a drawn box).
- Backdrop `PizzaShop`: a little pizzeria counter.

## Part 5: Birthday Cake (about 5 pictures)

- `cake/cake`, `cake/candle` and `cake/flame` are SVGs that already swap by file name.
  - The cake is drawn from the side with a flat top where the candles stand.
  - The candle is one plain candle, coloured in code as today.
  - Check the candle positions line up with the new cake top.
- `cake/cupcake` for the 🧁 count, and backdrop `BirthdayCake`: a party table.

## Part 6: food in questions and other games (by need)

Quiz questions count apples, cookies and cheese, and the Garden, Robo Path, Trace Path
and Chip Toss show food too (🍎🍪🧀🍌🍓🍇🍯🍬🥤). These are Fluent pictures that
already read well and are used in many places. The plan:

- Leave them, unless a picture reads badly at its size in a game (to be checked in each
  game's shots).
- Draw only those, as `emoji/<code>` so they change everywhere at once. Before swapping
  one, check every place the emoji appears means the same thing: 🌽 is corn on a pizza
  but cornflour in the kitchen.

## Part 7: the other games' own props and backdrops

After the food, the same approach goes through the rest, one game per PR. The order is
by how often the games are played:

| Game | Props to draw | Backdrop |
|---|---|---|
| Garden Days | seed, sprout, plant stages, flower pot, watering can | a sunny garden bed |
| Chip Toss | the cup and the chip | a fairground stall |
| Memory Chips | the coin chip (front and back) | a cosy table |
| Bubble Pop | the bubble | an underwater scene |
| Robo Path | the robot, cookie and rock tiles | a soft grid floor |
| Trace Path | the bee, honey pot and flower | a meadow |
| Balance Scale | the scale (today drawn shapes) | a market stall |
| Block Tower, Block Fit | blocks stay drawn shapes (their size is the maths) | a playroom floor |
| Letter Catcher, Push Roll | the hat, the ball and the target | a park |
| Number Path Race | the board pieces | a toy board on a table |
| Dance Tap, Freeze Zoo, Bunny Pop, Feelings Friends | animals stay Fluent | a stage, a zoo, a meadow, a cosy room |
| Balloon Breath | the balloon | a calm sky |

Each game keeps its emoji fallback, and each new backdrop gets the colour wash its cards
need, as the hub screens did.

## Order and size

| PR | Content | New pictures | Code |
|---|---|---|---|
| 1 | Part 1, Kitchen ingredients | 17 | none |
| 2 | Part 2, Kitchen cooking and serving | about 15 | small (`cook.picture`, serve art keys) |
| 3 | Part 3, Kitchen tools and furniture | about 14 | small (open and closed states) |
| 4 | Part 4, Pizza Shop | about 9 + backdrop | small (pizza steps) |
| 5 | Part 5, Birthday Cake | about 5 + backdrop | check the candle positions |
| 6+ | Parts 6 and 7, one game per PR | 3–6 each + backdrop | none to small |
