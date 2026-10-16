import { createProfile, isValidName, profileBand, MAX_NAME_LENGTH } from '../utils/profiles';

describe('profiles', () => {
  it('turns narration on by default for children who are not reading yet', () => {
    expect(createProfile({ name: 'Mia', age: 4, avatar: '🦊' }).narration).toBe(true);
    expect(createProfile({ name: 'Noa', age: 6, avatar: '🦊' }).narration).toBe(true);
    expect(createProfile({ name: 'Ari', age: 8, avatar: '🦊' }).narration).toBe(false);
  });

  it('trims and caps the name, and gives unique ids', () => {
    const a = createProfile({ name: '  A very very long name indeed  ', age: 5, avatar: '🐼' }, 1);
    const b = createProfile({ name: 'B', age: 5, avatar: '🐼' }, 1);
    expect(a.name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    expect(a.name.startsWith('A very')).toBe(true);
    expect(a.id).not.toBe(b.id);
  });

  it('derives the band from age', () => {
    expect(profileBand({ age: 9 }).id).toBe('masters');
  });

  it('rejects blank names', () => {
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('Sam')).toBe(true);
  });
});
