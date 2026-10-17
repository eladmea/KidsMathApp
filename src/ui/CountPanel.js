import Button from './Button';
import DragTray from './DragTray';
import { COLORS, textStyle } from './theme';
import { tag } from '../services/testBridge';
import { t } from '../i18n/index';

// Putting a number of things somewhere (toppings, candles): how many so far,
// "Take one off", the tray to drag more from, and Done. Returns the objects
// made, for the scene to destroy when the count changes or the step ends.
//   countPanel(scene, x, { count, draw, target, onDrop, onTakeOne, onDone })
// `draw` and `target` are as for DragTray.
export function countPanel(scene, x, { count, draw, target, onDrop, onTakeOne, onDone }) {
  const number = scene.add.text(x - 20, 270, String(count), textStyle(40)).setOrigin(1, 0.5);
  const icon = draw(scene, x + 20, 270, 40);
  const objects = [number, icon];
  if (count) {
    const takeOne = new Button(scene, x, 340, { label: t('tray.takeOne'), width: 260, height: 64, fontSize: 24, color: COLORS.white, textColor: COLORS.red, onTap: onTakeOne });
    tag('take-one', takeOne.box);
    objects.push(takeOne);
  }
  const tray = new DragTray(scene, x - 30, 440, { draw, label: t('tray.dragMe'), target, onDrop });
  tag('tray', tray.box);
  const done = new Button(scene, x, 560, { label: t('tray.done'), width: 240, height: 84, color: COLORS.green, onTap: onDone });
  tag('done', done.box);
  objects.push(tray, done);
  return objects;
}
