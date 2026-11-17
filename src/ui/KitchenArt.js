import { textStyle } from './theme';
import { art } from './Art';
import { texture } from '../services/assets';

// Kitchen Cove's furniture: the fridge and cupboard (with doors that open),
// the counter, the sink and the appliances. Each returns a Container centred
// on (x, y). Where there is a picture (src/assets/images/kitchen/<name>.svg)
// it is drawn over the shapes; the shapes stay underneath for the taps, the
// shelves and the doors' opening. Remove a picture and the shapes show.
// `long` is the picture's longer side, in game pixels.
const picture = (scene, key, x, y, long) => (texture(scene, key) ? art(scene, x, y, { key, size: long / 1.15 }) : null);

const WHITE_GOODS = { body: 0xe9f1f6, edge: 0x9fb4c2, inside: 0xfbfdff, shelf: 0xc9d8e2, handle: 0x7d93a3 };
const WOOD = { body: 0xc98d5a, edge: 0x8f5a2f, inside: 0xf3e2c8, shelf: 0xb07a48, handle: 0x6e4524 };

// A fridge or cupboard: shelves inside, and doors over them that open
// (open()) and close (close()). `shelfY(i)` is a shelf's top, `width` the
// room on it. `doors` are the tappable door shapes.
function storage(scene, x, y, { width, height, shelves, look, label, doors: doorCount, key }) {
  const box = scene.add.container(x, y);
  const body = scene.add.rectangle(0, 0, width + 16, height + 16, look.body).setRounded(18).setStrokeStyle(4, look.edge);
  const inside = scene.add.rectangle(0, 0, width, height, look.inside).setRounded(10);
  box.add([body, inside]);
  const gap = height / shelves;
  const shelfY = (i) => -height / 2 + gap * (i + 1) - 6;
  for (let i = 0; i < shelves; i++) box.add(scene.add.rectangle(0, shelfY(i) + 4, width - 10, 6, look.shelf).setRounded(3));
  // Things on the shelves go in here, under the doors.
  const items = scene.add.container(0, 0);
  box.add(items);
  const doors = [];
  const doorWidth = width / doorCount;
  for (let i = 0; i < doorCount; i++) {
    const left = i === 0;
    const door = scene.add.rectangle(left ? -width / 2 : width / 2, 0, doorWidth, height, look.body).setOrigin(left ? 0 : 1, 0.5).setStrokeStyle(4, look.edge).setRounded(10);
    const handleX = left ? -width / 2 + doorWidth - 18 : width / 2 - doorWidth + 18;
    const handle = scene.add.rectangle(handleX, doorCount === 1 ? -height * 0.2 : 0, 10, Math.min(90, height * 0.3), look.handle).setRounded(5);
    box.add([door, handle]);
    doors.push({ door, handle });
  }
  // The closed picture covers the doors; it lifts away when they open.
  // Sized by its longer side (the fridge is tall).
  const cover = picture(scene, key, 0, 0, Math.max(width, height) + 20);
  if (cover) box.add(cover);
  const text = scene.add.text(0, height / 2 + 30, label, textStyle(22, 0x6e5a48)).setOrigin(0.5);
  box.add(text);
  let isOpen = false;
  return {
    box,
    items,
    shelfY,
    width,
    height,
    doors: doors.map(({ door }) => door),
    get isOpen() {
      return isOpen;
    },
    open() {
      if (isOpen) return;
      isOpen = true;
      if (cover) cover.setVisible(false);
      doors.forEach(({ door, handle }) => {
        scene.tweens.add({ targets: door, scaleX: 0.12, duration: 260, ease: 'Back.easeOut' });
        handle.setVisible(false);
      });
    },
    close() {
      isOpen = false;
      if (cover) cover.setVisible(true);
      doors.forEach(({ door, handle }) => {
        door.setScale(1);
        handle.setVisible(true);
      });
    },
  };
}

export const drawFridge = (scene, x, y, label) => storage(scene, x, y, { width: 200, height: 430, shelves: 3, look: WHITE_GOODS, label, doors: 1, key: 'kitchen/fridge' });
export const drawCupboard = (scene, x, y, label) => storage(scene, x, y, { width: 360, height: 200, shelves: 2, look: WOOD, label, doors: 2, key: 'kitchen/cupboard' });

// The counter: a top and a front, from (left, top), `width` wide.
export function drawCounter(scene, left, top, width, height = 720 - top) {
  const g = scene.add.graphics();
  g.fillStyle(0xb98a5c, 1).fillRect(left, top + 18, width, height);
  g.fillStyle(0xe8d3b0, 1).fillRoundedRect(left - 8, top, width + 16, 26, 8);
  g.lineStyle(3, 0xa77a4d, 1).strokeRoundedRect(left - 8, top, width + 16, 26, 8);
  return g;
}

// A sink with a tap. `basin` is where dishes go.
export function drawSink(scene, x, y, label) {
  const box = scene.add.container(x, y);
  const basin = scene.add.rectangle(0, 20, 230, 120, 0xb9c6cf).setRounded(26).setStrokeStyle(6, 0x8a9aa6);
  const water = scene.add.rectangle(0, 30, 190, 80, 0xd8eef8).setRounded(20);
  const pipe = scene.add.rectangle(0, -78, 18, 70, 0x9aa8b2).setRounded(8);
  const spout = scene.add.rectangle(24, -110, 66, 18, 0x9aa8b2).setRounded(8);
  const text = scene.add.text(0, 112, label, textStyle(22, 0x6e5a48)).setOrigin(0.5);
  box.add([basin, water, pipe, spout]);
  // The picture's basin lines up with the shapes' basin.
  const sink = picture(scene, 'kitchen/sink', 0, -22, 240);
  if (sink) box.add(sink);
  box.add(text);
  return { box, basin };
}

// The appliances. Each has `inside`: where the dish shows while it cooks.
export function drawAppliance(scene, x, y, kind) {
  const box = scene.add.container(x, y);
  let inside;
  if (kind === 'oven') {
    const oven = picture(scene, 'kitchen/oven', 0, 0, 280);
    if (oven) {
      box.add(oven);
      // The dish shows through the picture's window.
      inside = scene.add.rectangle(0, 30, 196, 120, 0x000000, 0);
      box.add(inside);
      return { box, inside };
    }
    box.add(scene.add.rectangle(0, 0, 280, 240, 0x5b5552).setRounded(24).setStrokeStyle(6, 0x3e3936));
    inside = scene.add.rectangle(0, 20, 200, 130, 0x2a2624).setRounded(16);
    box.add(inside);
    [0, 1, 2].forEach((i) => box.add(scene.add.circle(-60 + i * 60, -92, 10, 0xc8c2be)));
  } else if (kind === 'stove') {
    box.add(scene.add.rectangle(0, 50, 300, 140, 0x6a6a72).setRounded(18).setStrokeStyle(5, 0x46464d));
    inside = scene.add.ellipse(-10, -10, 200, 70, 0x2f2f33).setStrokeStyle(8, 0x1f1f22);
    box.add([scene.add.rectangle(120, -14, 110, 18, 0x2f2f33).setRounded(8), inside]);
  } else if (kind === 'pot') {
    box.add(scene.add.rectangle(0, 70, 300, 100, 0x6a6a72).setRounded(18));
    inside = scene.add.rectangle(0, -10, 210, 150, 0xa7b3bb).setRounded(22).setStrokeStyle(6, 0x7b8790);
    box.add([inside, scene.add.rectangle(-122, -40, 36, 16, 0x7b8790).setRounded(6), scene.add.rectangle(122, -40, 36, 16, 0x7b8790).setRounded(6)]);
  } else {
    // The blender: a jar on a base.
    inside = scene.add.rectangle(0, -40, 150, 190, 0xdff2fb, 0.85).setRounded(20).setStrokeStyle(5, 0x9fc6d8);
    box.add([inside, scene.add.rectangle(0, 85, 190, 70, 0x4f5d6b).setRounded(18), scene.add.rectangle(0, -145, 120, 22, 0x4f5d6b).setRounded(8)]);
  }
  return { box, inside };
}
