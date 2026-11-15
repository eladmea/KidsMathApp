// The preload manifest (src/voice/<language>/groups.json, written by
// `npm run voice:lines`): which recordings each scene downloads before it
// opens. It must match the scenes' code and name only real recordings.
import en from '../src/voice/en/groups.json';
import he from '../src/voice/he/groups.json';
import { sceneGroups } from '../src/services/voiceLines';
import { CLIPS } from '../src/services/voiceClips';
import { sceneClipUrls } from '../src/services/voicePreload';

const MANIFESTS = { en, he };

describe('voice preload manifest', () => {
  it('is up to date with the scenes (run `npm run voice:lines -- <language>` after changing one)', () => {
    const scenes = sceneGroups();
    Object.values(MANIFESTS).forEach((manifest) => expect(manifest.scenes).toEqual(scenes));
  });

  it('names only recordings that exist', () => {
    Object.entries(MANIFESTS).forEach(([language, manifest]) => {
      Object.values(manifest.groups).flat().forEach((id) => expect(CLIPS[language][id]).toBeTruthy());
    });
  });

  it("gives each game its own lines, and a quiz its round's lines", async () => {
    const pizza = await sceneClipUrls('PizzaShop', {}, 'en');
    const withThree = await sceneClipUrls('PizzaShop', { groups: ['say:pizza:3'] }, 'en');
    expect(pizza.length).toBeGreaterThan(40);
    // A round's numbers add their own lines ("Put three mushrooms on...").
    expect(withThree.length).toBeGreaterThan(pizza.length + 20);
    expect(en.scenes.PizzaShop).toEqual(expect.arrayContaining(['say:pizza', 't:pizza', 't:tray', 'numbers']));
    expect(en.scenes.TracePath).toEqual(expect.arrayContaining(['say:drive', 'say:fly']));
    const round = await sceneClipUrls('Quiz', { lines: ['What rhymes with rock? Clock.'] }, 'en');
    expect(round.length).toBeGreaterThan(2);
    expect(round.some((url) => /what-rhymes-with-rock/.test(url))).toBe(true);
  });
});
