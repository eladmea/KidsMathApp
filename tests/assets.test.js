import { SOUNDS, emojiKey } from '../src/services/assets';

describe('assets by folder', () => {
  it('names emoji images by code point', () => {
    expect(emojiKey('🍎')).toBe('emoji/1f34e');
    // Variation selectors don't matter: ❤️ and ❤ share a picture.
    expect(emojiKey('❤️')).toBe('emoji/2764');
    expect(emojiKey('🐻‍❄️')).toBe('emoji/1f43b-200d-2744');
  });

  it('finds the sound effects by file name', () => {
    expect(Object.keys(SOUNDS).sort()).toEqual(['correct', 'wrong']);
  });
});
