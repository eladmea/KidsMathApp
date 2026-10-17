// Saved data, one JSON value per key. localStorage on the web; the Capacitor
// apps will swap in native storage behind the same functions. Every function
// is async so that swap needs no changes elsewhere.
import { appendEvents } from '../logic/playLog';

// v2: the Phaser app. Data from the old app (v1) isn't carried over.
const PREFIX = 'mathplay2:';
const KEYS = {
  profiles: 'profiles',
  activeProfile: 'active-profile',
  progress: (id) => `progress:${id}`,
  garden: (id) => `garden:${id}`,
  playTime: 'play-time',
  playLog: (id) => `play-log:${id}`,
  adventure: (id) => `adventure:${id}`,
  voice: 'voice',
};

async function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // Storage failures shouldn't crash a child's game; progress just won't persist.
  }
}

async function remove(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch (e) {
    // ignore
  }
}

export const loadProfiles = () => readJson(KEYS.profiles, []);
export const saveProfiles = (profiles) => writeJson(KEYS.profiles, profiles);
export const loadActiveProfileId = () => readJson(KEYS.activeProfile, null);
export const saveActiveProfileId = (id) => writeJson(KEYS.activeProfile, id);
export const loadProgress = (id) => readJson(KEYS.progress(id), {});
export const saveProgress = (id, progress) => writeJson(KEYS.progress(id), progress);
export const loadGarden = (id) => readJson(KEYS.garden(id), null);
export const saveGarden = (id, garden) => writeJson(KEYS.garden(id), garden);
export const loadPlayTime = () => readJson(KEYS.playTime, {});
export const savePlayTime = (playTime) => writeJson(KEYS.playTime, playTime);
export const loadPlayLog = (id) => readJson(KEYS.playLog(id), []);
export const loadAdventure = (id) => readJson(KEYS.adventure(id), null);
export const saveAdventure = (id, adventure) => writeJson(KEYS.adventure(id), adventure);
export const loadVoiceChoice = () => readJson(KEYS.voice, null);
export const saveVoiceChoice = (voiceId) => writeJson(KEYS.voice, voiceId);

// Appends are chained so quick back-to-back writes never lose each other.
let playLogWrites = Promise.resolve();
export function appendPlayLog(id, events) {
  playLogWrites = playLogWrites.then(async () => {
    const log = await loadPlayLog(id);
    await writeJson(KEYS.playLog(id), appendEvents(log, events));
  });
  return playLogWrites;
}

export function clearPlayLog(id) {
  playLogWrites = playLogWrites.then(() => remove(KEYS.playLog(id)));
  return playLogWrites;
}

export async function deleteProgress(id) {
  await Promise.all([KEYS.progress(id), KEYS.garden(id), KEYS.playLog(id), KEYS.adventure(id)].map(remove));
}
