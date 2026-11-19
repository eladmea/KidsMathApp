import { coverFit } from '../src/logic/backdrop';
import { BACKDROPS, backdropKey, loadBackdrop } from '../src/services/assets';

describe('backdrops', () => {
  const picture = { width: 1280, height: 720 };

  it('fills the safe area exactly', () => {
    expect(coverFit(picture, { x: 0, y: 0, width: 1280, height: 720 })).toEqual({ x: 640, y: 360, scale: 1 });
  });

  it('covers a wider phone with no gap at the sides', () => {
    const view = { x: -200, y: 0, width: 1680, height: 720 };
    const { x, y, scale } = coverFit(picture, view);
    expect(picture.width * scale).toBeGreaterThanOrEqual(view.width);
    expect(picture.height * scale).toBeGreaterThanOrEqual(view.height);
    expect([x, y]).toEqual([640, 360]);
  });

  it('covers a squarer tablet with no gap at the top or bottom', () => {
    const view = { x: 0, y: -120, width: 1280, height: 960 };
    const { scale } = coverFit(picture, view);
    expect(picture.height * scale).toBe(960);
    expect(picture.width * scale).toBeGreaterThan(1280);
  });

  it('are named after their scene', () => {
    Object.keys(BACKDROPS).forEach((name) => expect(name).toMatch(/^[A-Z][A-Za-z]*(-[a-z]+)?$/));
  });

  it('leave a scene without one alone', async () => {
    const textures = { exists: () => false, addImage: () => expect.fail('nothing to add') };
    await loadBackdrop(textures, 'NoSuchScene');
    expect(backdropKey('Profiles')).toBe('backdrop:Profiles');
  });
});
