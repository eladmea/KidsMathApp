// The signed-in child and their progress, shared by every scene. Scenes read
// `session.profile` / `session.progress` and save rounds through here.
import { applyFinishedRound, canSpendTicket } from '../logic/funTickets';
import { createProfile, profileBand } from '../logic/profiles';
import { applySession, toDayKey } from '../logic/progress';
import { awardStickers, roundStickerEvents } from '../logic/stickers';
import * as storage from './storage';
import { setNarration } from './speech';
import { FALLBACK, getLanguage, setLanguage } from '../i18n/index';

export const session = {
  profiles: [],
  profile: null,
  progress: {},
};

// Loads the players. Each visit starts at "Who's playing?", so nobody is
// signed in until a child picks themselves.
export async function loadSession() {
  session.profiles = await storage.loadProfiles();
  session.profile = null;
  session.progress = {};
}

export async function selectProfile(id) {
  session.profile = session.profiles.find((p) => p.id === id) || null;
  session.progress = session.profile ? await storage.loadProgress(id) : {};
  if (session.profile) {
    setLanguage(session.profile.language || FALLBACK);
    setNarration(session.profile.narration !== false);
  }
  await storage.saveActiveProfileId(session.profile ? id : null);
}

export async function addProfile(fields) {
  const profile = createProfile({ language: getLanguage(), ...fields });
  session.profiles = [...session.profiles, profile];
  await storage.saveProfiles(session.profiles);
  await selectProfile(profile.id);
  return profile;
}

// Deletes a player and everything saved for them.
export async function removeProfile(id) {
  session.profiles = session.profiles.filter((p) => p.id !== id);
  await storage.saveProfiles(session.profiles);
  await storage.deleteProgress(id);
  const playTime = await storage.loadPlayTime();
  if (playTime[id]) {
    delete playTime[id];
    await storage.savePlayTime(playTime);
  }
  if (session.profile && session.profile.id === id) {
    session.profile = null;
    session.progress = {};
    await storage.saveActiveProfileId(null);
  }
}

// Changes the signed-in child's settings, e.g. { narration: false }.
export async function updateProfile(patch) {
  session.profile = { ...session.profile, ...patch };
  session.profiles = session.profiles.map((p) => (p.id === session.profile.id ? session.profile : p));
  await storage.saveProfiles(session.profiles);
  if ('narration' in patch) setNarration(patch.narration);
}

// Saves a finished round: progress, stickers for skills newly passed or
// mastered, and a play-log entry per skill. tallies: { [skillId]: { correct,
// total } }. Returns applySession's result plus `earnedStickers`.
export async function recordRound(tallies, mode = 'practice') {
  const today = toDayKey();
  const result = applySession(session.progress, tallies, today, profileBand(session.profile).id);
  session.progress = result.progress;
  await storage.saveProgress(session.profile.id, session.progress);
  const { stickers, earned } = awardStickers(session.profile.stickers, roundStickerEvents(result), today);
  if (earned.length) await updateProfile({ stickers });
  // Every few finished rounds earn a Fun Break ticket.
  const { changes, earnedTicket } = applyFinishedRound(session.profile);
  await updateProfile(changes);
  const at = Date.now();
  await logEvents(Object.entries(tallies).map(([skillId, tally]) => ({ type: 'round', at, day: today, skillId, mode, ...tally })));
  return { ...result, earnedStickers: earned, earnedTicket };
}

// Stickers for things outside a round (a flower in Garden Days).
// events: [{ kind, ref }] as in logic/stickers.js. Returns the new stickers.
export async function earnStickers(events) {
  const { stickers, earned } = awardStickers(session.profile.stickers, events, toDayKey());
  if (earned.length) await updateProfile({ stickers });
  return earned;
}

// Uses a Fun Break ticket; false when there is none.
export async function spendTicket() {
  if (!canSpendTicket(session.profile)) return false;
  await updateProfile({ funTickets: session.profile.funTickets - 1 });
  return true;
}

// Play-test log events for the signed-in child (see logic/playLog.js).
export function logEvents(events) {
  if (!session.profile || !events.length) return Promise.resolve();
  return storage.appendPlayLog(session.profile.id, events);
}
