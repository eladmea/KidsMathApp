# Image credits

Pictures from [Kenney](https://kenney.nl), CC0 (public domain). Credit is not
required, but it is kind.

| File | Pack | Source file | Changes |
|---|---|---|---|
| `emoji/2b50.png` (⭐) | [Game Icons](https://kenney.nl/assets/game-icons) | `PNG/White/2x/star.png` | trimmed, coloured yellow with an orange outline, 256 px |
| `emoji/1f3cd.png` (🏍️), `emoji/1f6fb.png` (🛻), `emoji/1f69b.png` (🚛) | [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) 3D, MIT | `assets/Motorcycle/3D/motorcycle_3d.png`, `assets/Pickup truck/3D/pickup_truck_3d.png`, `assets/Articulated lorry/3D/articulated_lorry_3d.png` | resized to 160 px (Race Track vehicles not yet in the atlases; `npm run art:fluent` leaves pictures here alone) |
| `emoji/2606.png` (☆) | [Game Icons](https://kenney.nl/assets/game-icons) | `PNG/White/2x/star.png` | trimmed, coloured pale yellow with a gold outline, 256 px |

## Emoji pictures

The emoji atlases in `src/assets/atlases/` (`emoji-*.webp`) are made from
[Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (3D
style), MIT License, Copyright (c) Microsoft Corporation. Resized to 160 px and
packed into sheets by `npm run art:fluent` (`scripts/fluent-emoji.mjs`). People
and hands use the default skin tone.

## Birthday Cake

`cake/cake.svg`, `cake/candle.svg` and `cake/flame.svg` were drawn for this game
(same license as the game). Replace any of them with a PNG or WebP of the same
name to change the art; the scene keeps working.

## Kitchen Cove

`kitchen/fridge.svg`, `kitchen/cupboard.svg`, `kitchen/oven.svg`, `kitchen/sink.svg`,
`kitchen/cup.svg`, `kitchen/spoon.svg` and `kitchen/jug.svg` were drawn for this game
(same license as the game). Replace any of them with a PNG, WebP or SVG of the
same name to change the art; the scene keeps working, and without a picture it
draws simple shapes instead.
