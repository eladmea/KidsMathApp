import AsyncStorage from '@react-native-async-storage/async-storage';
import { appendEvents } from './playLog';

const PROFILES_KEY = '@mathplay_profiles';
const ACTIVE_PROFILE_KEY = '@mathplay_active_profile';
const PROGRESS_KEY_PREFIX = '@mathplay_progress_';
const GARDEN_KEY_PREFIX = '@mathplay_garden_';
// Play time for every profile: { [profileId]: { 'YYYY-MM-DD': seconds } }.
const PLAY_TIME_KEY = '@mathplay_play_time';
// Play-test events per profile (see utils/playLog.js).
const PLAY_LOG_KEY_PREFIX = '@mathplay_play_log_';
// Today's Adventure per profile (see utils/adventure.js).
const ADVENTURE_KEY_PREFIX = '@mathplay_adventure_';
// The read-aloud voice chosen on this device (null = pick the best automatically).
const VOICE_KEY = '@mathplay_voice';

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Storage failures shouldn't crash a child's game; progress just won't persist.
  }
}

export function loadProfiles() {
  return readJson(PROFILES_KEY, []);
}

export function saveProfiles(profiles) {
  return writeJson(PROFILES_KEY, profiles);
}

export function loadActiveProfileId() {
  return readJson(ACTIVE_PROFILE_KEY, null);
}

export function saveActiveProfileId(profileId) {
  return writeJson(ACTIVE_PROFILE_KEY, profileId);
}

export function loadProgress(profileId) {
  return readJson(PROGRESS_KEY_PREFIX + profileId, {});
}

export function saveProgress(profileId, progress) {
  return writeJson(PROGRESS_KEY_PREFIX + profileId, progress);
}

export function loadGarden(profileId) {
  return readJson(GARDEN_KEY_PREFIX + profileId, null);
}

export function saveGarden(profileId, garden) {
  return writeJson(GARDEN_KEY_PREFIX + profileId, garden);
}

export function loadPlayTime() {
  return readJson(PLAY_TIME_KEY, {});
}

export function savePlayTime(playTime) {
  return writeJson(PLAY_TIME_KEY, playTime);
}

export function loadPlayLog(profileId) {
  return readJson(PLAY_LOG_KEY_PREFIX + profileId, []);
}

// Appends are chained so quick back-to-back writes (an answer, then the end of
// the round) never lose each other.
let playLogWrites = Promise.resolve();
export function appendPlayLog(profileId, events) {
  playLogWrites = playLogWrites.then(async () => {
    const log = await loadPlayLog(profileId);
    await writeJson(PLAY_LOG_KEY_PREFIX + profileId, appendEvents(log, events));
  });
  return playLogWrites;
}

export function clearPlayLog(profileId) {
  playLogWrites = playLogWrites.then(() => writeJson(PLAY_LOG_KEY_PREFIX + profileId, []));
  return playLogWrites;
}

export function loadAdventure(profileId) {
  return readJson(ADVENTURE_KEY_PREFIX + profileId, null);
}

export function saveAdventure(profileId, adventure) {
  return writeJson(ADVENTURE_KEY_PREFIX + profileId, adventure);
}

export function loadVoiceChoice() {
  return readJson(VOICE_KEY, null);
}

export function saveVoiceChoice(voiceId) {
  return writeJson(VOICE_KEY, voiceId);
}

export async function deleteProgress(profileId) {
  try {
    await AsyncStorage.multiRemove([
      PROGRESS_KEY_PREFIX + profileId,
      GARDEN_KEY_PREFIX + profileId,
      PLAY_LOG_KEY_PREFIX + profileId,
      ADVENTURE_KEY_PREFIX + profileId,
    ]);
  } catch (e) {
    // ignore
  }
}
