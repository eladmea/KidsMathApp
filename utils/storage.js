import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = '@mathplay_profiles';
const ACTIVE_PROFILE_KEY = '@mathplay_active_profile';
const PROGRESS_KEY_PREFIX = '@mathplay_progress_';
const GARDEN_KEY_PREFIX = '@mathplay_garden_';
// Play time for every profile: { [profileId]: { 'YYYY-MM-DD': seconds } }.
const PLAY_TIME_KEY = '@mathplay_play_time';

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

export async function deleteProgress(profileId) {
  try {
    await AsyncStorage.multiRemove([PROGRESS_KEY_PREFIX + profileId, GARDEN_KEY_PREFIX + profileId]);
  } catch (e) {
    // ignore
  }
}
