// Downloads the recordings a scene will say before the scene opens, so the
// voice never waits on the network mid-game (a level's questions, an
// island's greeting, a game's every line).
//
// Which recordings: src/voice/<language>/groups.json, written by
// `npm run voice:lines` (see services/voiceLines.js): the groups each scene
// speaks from, found in its code, and the recordings in each group. A scene
// whose lines depend on its data adds groups with a static method:
//   static voiceGroups(data) { return ['letters']; }   (QuizScene)
// A scene whose lines are made just before it opens (a quiz round's
// questions) makes them in `static prepare(data)` and returns them; their
// recordings are downloaded too. The manifest is fetched once per language,
// when first needed.
import { CLIPS, clipUrl } from './voiceClips';
import { splitSentences } from '../logic/voices';
import { preloadClips } from './speech';
import { getLanguage } from '../i18n/index';

const manifests = import.meta.glob('../voice/*/groups.json', { import: 'default' });
const loaded = new Map();

function manifest(language) {
  if (!loaded.has(language)) {
    const load = manifests[`../voice/${language}/groups.json`];
    loaded.set(language, load ? load().catch(() => null) : Promise.resolve(null));
  }
  return loaded.get(language);
}

// The recording urls for a scene (by key), extra groups and lines.
export async function sceneClipUrls(sceneKey, { groups: extraGroups = [], lines = [] } = {}, language = getLanguage()) {
  const urls = new Set();
  lines.forEach((line) => splitSentences(line).forEach((sentence) => {
    const url = clipUrl(sentence, language);
    if (url) urls.add(url);
  }));
  const found = await manifest(language);
  if (found) {
    const clips = CLIPS[language] || {};
    [...(found.scenes[sceneKey] || []), ...extraGroups].forEach((group) => (found.groups[group] || []).forEach((id) => clips[id] && urls.add(clips[id])));
  }
  return [...urls];
}

// Downloads them; resolves with how many once all are in (or failed).
export async function preloadScene(sceneKey, extra = {}, options = {}) {
  const urls = await sceneClipUrls(sceneKey, extra);
  return preloadClips(urls, options);
}
