// Daily play time and the soft time limit (AAP media guidance: short
// sessions, gentle goodbyes). Time is kept per profile as
// `{ 'YYYY-MM-DD': seconds }`. A profile may set `dailyLimit` (minutes,
// 0 = no limit) and `bonus: { day, minutes }` (extra time a grown-up gave
// today). When the time is up, the current round may finish; then the app says
// goodbye until tomorrow unless a grown-up adds time.
import { addDays } from './progress';

export const LIMIT_OPTIONS = [0, 10, 15, 20, 30, 45, 60];
export const BONUS_MINUTES = 10;
export const WARN_MINUTES = 5;
const KEEP_DAYS = 14;

export function defaultDailyLimit(age) {
  return age <= 5 ? 15 : 20;
}

export function dailyLimitFor(profile) {
  return profile.dailyLimit ?? defaultDailyLimit(profile.age);
}

// Adds `seconds` to `day`, keeping only the last KEEP_DAYS days.
export function addPlayTime(days = {}, day, seconds) {
  const next = { ...days, [day]: (days[day] || 0) + seconds };
  const cutoff = addDays(day, -(KEEP_DAYS - 1));
  return Object.fromEntries(Object.entries(next).filter(([key]) => key >= cutoff));
}

export function minutesPlayed(days = {}, day) {
  return Math.floor((days[day] || 0) / 60);
}

// Minutes allowed today (limit plus any bonus), or null with no limit.
export function allowedMinutes(profile, day) {
  const limit = dailyLimitFor(profile);
  if (!limit) return null;
  const bonus = profile.bonus && profile.bonus.day === day ? profile.bonus.minutes : 0;
  return limit + bonus;
}

// Whole minutes left today (rounded up), or null with no limit.
export function minutesLeft(profile, days = {}, day) {
  const allowed = allowedMinutes(profile, day);
  if (allowed === null) return null;
  return Math.max(0, Math.ceil((allowed * 60 - (days[day] || 0)) / 60));
}

export function isTimeUp(profile, days, day) {
  return minutesLeft(profile, days, day) === 0;
}

// Profile changes that give `minutes` more time today.
export function grantBonus(profile, day, minutes = BONUS_MINUTES) {
  const current = profile.bonus && profile.bonus.day === day ? profile.bonus.minutes : 0;
  return { bonus: { day, minutes: current + minutes } };
}

// The last `count` days, oldest first: [{ day, minutes }].
export function recentDays(days = {}, today, count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const day = addDays(today, i - count + 1);
    return { day, minutes: minutesPlayed(days, day) };
  });
}
