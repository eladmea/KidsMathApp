// Colours and type shared by every scene.

export const FONT = 'Fredoka, system-ui, sans-serif';

export const COLORS = {
  sky: 0x8fd3f4,
  sea: 0x6bc2ec,
  sand: 0xf6dfa4,
  cream: 0xfff7e6,
  white: 0xffffff,
  ink: 0x2d3142,
  primary: 0x4a6fe3,
  primaryDark: 0x3552b5,
  green: 0x4caf50,
  greenDark: 0x2e7d32,
  red: 0xe53935,
  orange: 0xff9a3d,
  yellow: 0xffd23f,
  pink: 0xff6fa8,
  gray: 0x9e9e9e,
  dough: 0xf3d29b,
  crust: 0xd9a35f,
  sauce: 0xd9412f,
};

export const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

// Text style helper: text(48) is a big bold dark label.
export function textStyle(size, color = COLORS.ink, extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color: hex(color), align: 'center', ...extra };
}

// '#3DDC84' -> 0x3ddc84 (the curriculum stores colours as CSS strings).
export const colorOf = (css) => parseInt(css.slice(1), 16);
