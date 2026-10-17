import { islandOutline } from '../logic/islandPath';
import { COLORS } from './theme';

// Draws an island: a shadow in the water, a sandy beach and the land, from
// the same wobbly outline (logic/islandPath.js), so an island keeps its
// shape. Returns a Graphics centred on (x, y).
//   drawIsland(scene, x, y, { width, height, seed, land, sand })
export function drawIsland(scene, x, y, { width, height, seed = 1, land = 0x8fd16a, sand = COLORS.sand, shore = 0xffffff }) {
  const g = scene.add.graphics({ x, y });
  const outline = islandOutline(seed, width, height);
  const scaled = (factor, dy = 0) => outline.map((p) => ({ x: p.x * factor, y: p.y * factor + dy }));
  g.fillStyle(0x000000, 0.12).fillPoints(scaled(1.04, 10), true, true);
  g.fillStyle(shore, 0.55).fillPoints(scaled(1.08), true, true);
  g.fillStyle(sand, 1).fillPoints(scaled(1), true, true);
  g.fillStyle(land, 1).fillPoints(scaled(0.84, -4), true, true);
  return g;
}
