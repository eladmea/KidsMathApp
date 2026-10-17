// The signed-in child and their progress, shared by every scene. Scenes read
// `session.profile` / `session.progress` and save rounds through here.
import { createProfile, profileBand } from '../logic/profiles';
import { applySession, toDayKey } from '../logic/progress';
import * as storage from './storage';

export const session = {
  profiles: [],
  profile: null,
  progress: {},
};

export async function loadSession() {
  session.profiles = await storage.loadProfiles();
  const activeId = await storage.loadActiveProfileId();
  const profile = session.profiles.find((p) => p.id === activeId) || session.profiles[0] || null;
  if (profile) await selectProfile(profile.id);
}

export async function selectProfile(id) {
  session.profile = session.profiles.find((p) => p.id === id) || null;
  session.progress = session.profile ? await storage.loadProgress(id) : {};
  await storage.saveActiveProfileId(session.profile ? id : null);
}

export async function addProfile(fields) {
  const profile = createProfile(fields);
  session.profiles = [...session.profiles, profile];
  await storage.saveProfiles(session.profiles);
  await selectProfile(profile.id);
  return profile;
}

// P0 has no profile screens yet: make sure someone is signed in.
export async function ensureProfile() {
  if (!session.profile) await addProfile({ name: 'Mia', age: 4, avatar: '🦁' });
}

// Saves a finished round. tallies: { [skillId]: { correct, total } }.
export async function recordRound(tallies) {
  const result = applySession(session.progress, tallies, toDayKey(), profileBand(session.profile).id);
  session.progress = result.progress;
  await storage.saveProgress(session.profile.id, session.progress);
  return result;
}
