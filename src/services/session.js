// The signed-in child and their progress, shared by every scene. Scenes read
// `session.profile` / `session.progress` and save rounds through here.
import { applyFinishedRound, canSpendTicket } from '../logic/funTickets';
import { completeStep, isFinished, newAdventure, planAdventure } from '../logic/adventure';
import { addPlayTime, grantBonus, minutesLeft } from '../logic/playTime';
import { createProfile, profileBand } from '../logic/profiles';
import { applySession, toDayKey } from '../logic/progress';
import { awardStickers, roundStickerEvents } from '../logic/stickers';
import * as storage from './storage';
import { setNarration } from './speech';
import { FALLBACK, getLanguage, setLanguage } from '../i18n/index';

// The parent dashboard shows the last week of finished adventures.
const MAX_ADVENTURE_DAYS_KEPT = 30;

export const session = {
  profiles: [],
  profile: null,
  progress: {},
  // Seconds played per child per day: { [profileId]: { 'YYYY-MM-DD': seconds } }.
  playTime: {},
  // Today's Adventure for the signed-in child (logic/adventure.js), or null.
  adventure: null,
  // "Play together": a grown-up talk prompt after each answer, until the
  // player changes.
  coaching: false,
  // The island the child last opened (their avatar waits there on the map).
  lastIsland: null,
};

// Loads the players. Each visit starts at "Who's playing?", so nobody is
// signed in until a child picks themselves.
export async function loadSession() {
  session.profiles = await storage.loadProfiles();
  session.profile = null;
  session.progress = {};
  session.playTime = await storage.loadPlayTime();
}

export async function selectProfile(id) {
  session.profile = session.profiles.find((p) => p.id === id) || null;
  session.progress = session.profile ? await storage.loadProgress(id) : {};
  session.coaching = false;
  session.lastIsland = null;
  const adventure = session.profile ? await storage.loadAdventure(id) : null;
  // An adventure from an earlier day is never shown.
  session.adventure = adventure && adventure.day === toDayKey() ? adventure : null;
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
  await updateProfileById(session.profile.id, patch);
}

// The same for any child (the parent dashboard).
export async function updateProfileById(id, patch) {
  session.profiles = session.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
  if (session.profile && session.profile.id === id) {
    session.profile = session.profiles.find((p) => p.id === id);
    if ('narration' in patch) setNarration(patch.narration);
  }
  await storage.saveProfiles(session.profiles);
}

// ---- Play time and the daily limit (logic/playTime.js) ----

// Whole minutes the signed-in child has left today, or null with no limit.
export function timeLeft() {
  if (!session.profile) return null;
  return minutesLeft(session.profile, session.playTime[session.profile.id], toDayKey());
}

export function isTimeUp() {
  return timeLeft() === 0;
}

// Counts play time for the signed-in child (services/playClock.js).
export async function addPlaySeconds(seconds) {
  if (!session.profile || seconds <= 0) return;
  const id = session.profile.id;
  session.playTime = { ...session.playTime, [id]: addPlayTime(session.playTime[id], toDayKey(), seconds) };
  await storage.savePlayTime(session.playTime);
}

// A grown-up gives a child 10 more minutes today.
export async function grantMoreTime(id = session.profile.id) {
  const profile = session.profiles.find((p) => p.id === id);
  await updateProfileById(id, grantBonus(profile, toDayKey()));
}

// ---- Today's Adventure (logic/adventure.js) ----

// Plans today's adventure, or keeps the one already started today.
export async function startAdventure() {
  const day = toDayKey();
  if (session.adventure && session.adventure.day === day) return session.adventure;
  const steps = planAdventure({ bandId: profileBand(session.profile).id, progress: session.progress, today: day, minutesLeft: timeLeft() });
  session.adventure = newAdventure(day, steps);
  await storage.saveAdventure(session.profile.id, session.adventure);
  return session.adventure;
}

// Marks a step done. Finishing the last one earns an adventure sticker and
// is kept for the parent dashboard. Returns { finished, earned }.
export async function completeAdventureStep(stepId) {
  const current = session.adventure;
  if (!session.profile || !current || current.day !== toDayKey()) return { finished: false, earned: [] };
  const next = completeStep(current, stepId);
  if (next === current) return { finished: isFinished(current), earned: [] };
  session.adventure = next;
  await storage.saveAdventure(session.profile.id, next);
  if (!isFinished(next)) return { finished: false, earned: [] };
  const days = [...(session.profile.adventureDays || []).filter((d) => d !== next.day), next.day].slice(-MAX_ADVENTURE_DAYS_KEPT);
  const { stickers, earned } = awardStickers(session.profile.stickers, [{ kind: 'adventure', ref: next.day }], next.day);
  await updateProfile({ adventureDays: days, stickers });
  return { finished: true, earned };
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
