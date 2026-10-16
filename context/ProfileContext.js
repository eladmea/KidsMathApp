import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  loadProgress,
  saveProgress,
  deleteProgress,
  loadPlayTime,
  savePlayTime,
} from '../utils/storage';
import { createProfile as buildProfile, profileBand } from '../utils/profiles';
import { applySession, toDayKey } from '../utils/progress';
import { applyFinishedRound, canSpendTicket } from '../utils/funTickets';
import { awardStickers, roundStickerEvents } from '../utils/stickers';
import { addPlayTime, grantBonus, minutesLeft } from '../utils/playTime';

// Play time is counted in small steps while a child is on a playing screen.
const TICK_MS = 15000;
// Screens that don't count as play time: choosing a player, grown-up screens,
// the goodbye screen and the calming Balloon Breath.
const UNTIMED_ROUTES = ['Profiles', 'CreateProfile', 'ParentDashboard', 'TimeUp', 'BalloonBreath'];

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [progress, setProgress] = useState({});
  // The latest profile list, so back-to-back writes (e.g. recording a round
  // and then spending a ticket) never overwrite each other with stale data.
  const profilesRef = useRef([]);
  // { [profileId]: { 'YYYY-MM-DD': seconds } }
  const [playTime, setPlayTime] = useState({});
  const playTimeRef = useRef({});
  // The screen being shown, reported by the navigator in App.js.
  const [activeRoute, setActiveRoute] = useState(null);

  const commitProfiles = useCallback(async (nextProfiles) => {
    profilesRef.current = nextProfiles;
    setProfiles(nextProfiles);
    await saveProfiles(nextProfiles);
  }, []);

  useEffect(() => {
    let isActive = true;
    (async () => {
      const [storedProfiles, storedActiveId, storedPlayTime] = await Promise.all([
        loadProfiles(),
        loadActiveProfileId(),
        loadPlayTime(),
      ]);
      if (!isActive) return;
      playTimeRef.current = storedPlayTime;
      setPlayTime(storedPlayTime);
      profilesRef.current = storedProfiles;
      setProfiles(storedProfiles);
      if (storedProfiles.some((p) => p.id === storedActiveId)) {
        setActiveProfileId(storedActiveId);
        const storedProgress = await loadProgress(storedActiveId);
        if (isActive) setProgress(storedProgress);
      }
      if (isActive) setIsLoading(false);
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const selectProfile = useCallback(async (profileId) => {
    const storedProgress = await loadProgress(profileId);
    setActiveProfileId(profileId);
    setProgress(storedProgress);
    await saveActiveProfileId(profileId);
  }, []);

  const addProfile = useCallback(
    async (details) => {
      const profile = buildProfile(details);
      await commitProfiles([...profilesRef.current, profile]);
      await selectProfile(profile.id);
      return profile;
    },
    [commitProfiles, selectProfile]
  );

  const updateProfile = useCallback(
    async (profileId, changes) => {
      await commitProfiles(profilesRef.current.map((p) => (p.id === profileId ? { ...p, ...changes } : p)));
    },
    [commitProfiles]
  );

  const removeProfile = useCallback(
    async (profileId) => {
      await commitProfiles(profilesRef.current.filter((p) => p.id !== profileId));
      await deleteProgress(profileId);
      const { [profileId]: _removed, ...remainingPlayTime } = playTimeRef.current;
      playTimeRef.current = remainingPlayTime;
      setPlayTime(remainingPlayTime);
      await savePlayTime(remainingPlayTime);
      if (profileId === activeProfileId) {
        setActiveProfileId(null);
        setProgress({});
        await saveActiveProfileId(null);
      }
    },
    [commitProfiles, activeProfileId]
  );

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  // Records a finished round and reports what to celebrate.
  const recordSession = useCallback(
    async (tallies) => {
      if (!activeProfile) return { newlyMastered: [], newlyUnlocked: [], earnedTicket: false, earnedStickers: [] };
      const today = toDayKey();
      const result = applySession(progress, tallies, today, profileBand(activeProfile).id);
      const current = profilesRef.current.find((p) => p.id === activeProfile.id) || activeProfile;
      const tickets = applyFinishedRound(current);
      const stickers = awardStickers(current.stickers, roundStickerEvents(result), today);
      setProgress(result.progress);
      await Promise.all([
        saveProgress(activeProfile.id, result.progress),
        updateProfile(activeProfile.id, { ...tickets.changes, stickers: stickers.stickers }),
      ]);
      return {
        newlyMastered: result.newlyMastered,
        newlyUnlocked: result.newlyUnlocked,
        earnedTicket: tickets.earnedTicket,
        earnedStickers: stickers.earned,
      };
    },
    [activeProfile, progress, updateProfile]
  );

  // Stickers for things outside rounds (e.g. a Garden Days bloom). Returns the
  // newly earned ones.
  const earnStickers = useCallback(
    async (events) => {
      const current = profilesRef.current.find((p) => p.id === activeProfileId);
      if (!current) return [];
      const stickers = awardStickers(current.stickers, events, toDayKey());
      if (stickers.earned.length) await updateProfile(current.id, { stickers: stickers.stickers });
      return stickers.earned;
    },
    [activeProfileId, updateProfile]
  );

  // A grown-up gives a child more time today.
  const grantMoreTime = useCallback(
    async (profileId) => {
      const current = profilesRef.current.find((p) => p.id === profileId);
      if (current) await updateProfile(profileId, grantBonus(current, toDayKey()));
    },
    [updateProfile]
  );

  // Count play time while a child is on a playing screen and the app is open.
  const isTimedRoute = Boolean(activeProfileId && activeRoute && !UNTIMED_ROUTES.includes(activeRoute));
  useEffect(() => {
    if (!isTimedRoute) return undefined;
    let lastTick = Date.now();
    let isForeground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    const tick = () => {
      const now = Date.now();
      // Never count more than two ticks at once (e.g. after the device slept).
      const elapsed = Math.min(now - lastTick, TICK_MS * 2);
      lastTick = now;
      if (!isForeground || elapsed <= 0) return;
      const next = {
        ...playTimeRef.current,
        [activeProfileId]: addPlayTime(playTimeRef.current[activeProfileId], toDayKey(), Math.round(elapsed / 1000)),
      };
      playTimeRef.current = next;
      setPlayTime(next);
      savePlayTime(next);
    };
    const interval = setInterval(tick, TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        isForeground = true;
        lastTick = Date.now();
      } else {
        tick();
        isForeground = false;
      }
    });
    return () => {
      tick();
      clearInterval(interval);
      subscription.remove();
    };
  }, [isTimedRoute, activeProfileId]);

  const today = toDayKey();
  const timeLeft = activeProfile ? minutesLeft(activeProfile, playTime[activeProfile.id], today) : null;

  // Uses one Fun Break ticket; returns false if there are none left.
  const spendTicket = useCallback(async () => {
    const current = profilesRef.current.find((p) => p.id === activeProfileId);
    if (!current || !canSpendTicket(current)) return false;
    await updateProfile(current.id, { funTickets: current.funTickets - 1 });
    return true;
  }, [activeProfileId, updateProfile]);

  const value = useMemo(
    () => ({
      isLoading,
      profiles,
      activeProfile,
      progress,
      selectProfile,
      addProfile,
      updateProfile,
      removeProfile,
      recordSession,
      spendTicket,
      earnStickers,
      playTime,
      timeLeft,
      isTimeUp: timeLeft === 0,
      grantMoreTime,
      setActiveRoute,
    }),
    [
      isLoading,
      profiles,
      activeProfile,
      progress,
      selectProfile,
      addProfile,
      updateProfile,
      removeProfile,
      recordSession,
      spendTicket,
      earnStickers,
      playTime,
      timeLeft,
      grantMoreTime,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used inside <ProfileProvider>');
  }
  return context;
}
