// The session service on top of a stand-in localStorage.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
};

const { session, loadSession, addProfile, selectProfile, removeProfile, updateProfile, recordRound } = await import('../src/services/session');
const { isNarrationOn } = await import('../src/services/speech');
const storage = await import('../src/services/storage');

const PASS = { 'math-count-5': { correct: 9, total: 10 } };

describe('session service', () => {
  beforeEach(async () => {
    store.clear();
    await loadSession();
  });

  it('starts with nobody signed in', async () => {
    await addProfile({ name: 'Mia', age: 4, avatar: '🦁' });
    await loadSession();
    expect(session.profiles).toHaveLength(1);
    expect(session.profile).toBeNull();
  });

  it('adds a player, signs them in and sets narration from their age', async () => {
    const mia = await addProfile({ name: '  Mia ', age: 4, avatar: '🦁' });
    expect(mia.name).toBe('Mia');
    expect(session.profile.id).toBe(mia.id);
    expect(isNarrationOn()).toBe(true);
    await addProfile({ name: 'Leo', age: 8, avatar: '🐸' });
    expect(isNarrationOn()).toBe(false);
    await selectProfile(mia.id);
    expect(isNarrationOn()).toBe(true);
  });

  it('saves rounds per player', async () => {
    const mia = await addProfile({ name: 'Mia', age: 4, avatar: '🦁' });
    const { newlyPassed } = await recordRound(PASS);
    expect(newlyPassed).toEqual(['math-count-5']);
    const leo = await addProfile({ name: 'Leo', age: 8, avatar: '🐸' });
    expect(session.progress).toEqual({});
    await selectProfile(mia.id);
    expect(session.progress['math-count-5'].correct).toBe(9);
    expect(await storage.loadProgress(leo.id)).toEqual({});
  });

  it('remembers a narration change', async () => {
    const mia = await addProfile({ name: 'Mia', age: 4, avatar: '🦁' });
    await updateProfile({ narration: false });
    expect(isNarrationOn()).toBe(false);
    await loadSession();
    await selectProfile(mia.id);
    expect(session.profile.narration).toBe(false);
    expect(isNarrationOn()).toBe(false);
  });

  it('deletes a player with all their saved data', async () => {
    const mia = await addProfile({ name: 'Mia', age: 4, avatar: '🦁' });
    await recordRound(PASS);
    await storage.savePlayTime({ [mia.id]: { '2026-10-17': 60 } });
    const leo = await addProfile({ name: 'Leo', age: 8, avatar: '🐸' });
    await removeProfile(mia.id);
    expect(session.profiles.map((p) => p.id)).toEqual([leo.id]);
    expect(await storage.loadProgress(mia.id)).toEqual({});
    expect(await storage.loadPlayTime()).toEqual({});
    expect(session.profile.id).toBe(leo.id);
    await removeProfile(leo.id);
    expect(session.profile).toBeNull();
    expect([...store.keys()].filter((key) => key.includes(mia.id) || key.includes(leo.id))).toEqual([]);
  });
});
