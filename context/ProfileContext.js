import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  loadProgress,
  saveProgress,
  deleteProgress,
} from '../utils/storage';
import { createProfile as buildProfile, profileBand } from '../utils/profiles';
import { applySession, toDayKey } from '../utils/progress';
import { applyFinishedRound, canSpendTicket } from '../utils/funTickets';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [progress, setProgress] = useState({});
  // The latest profile list, so back-to-back writes (e.g. recording a round
  // and then spending a ticket) never overwrite each other with stale data.
  const profilesRef = useRef([]);

  const commitProfiles = useCallback(async (nextProfiles) => {
    profilesRef.current = nextProfiles;
    setProfiles(nextProfiles);
    await saveProfiles(nextProfiles);
  }, []);

  useEffect(() => {
    let isActive = true;
    (async () => {
      const [storedProfiles, storedActiveId] = await Promise.all([loadProfiles(), loadActiveProfileId()]);
      if (!isActive) return;
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
      if (!activeProfile) return { newlyMastered: [], newlyUnlocked: [], earnedTicket: false };
      const result = applySession(progress, tallies, toDayKey(), profileBand(activeProfile).id);
      const tickets = applyFinishedRound(profilesRef.current.find((p) => p.id === activeProfile.id) || activeProfile);
      setProgress(result.progress);
      await Promise.all([saveProgress(activeProfile.id, result.progress), updateProfile(activeProfile.id, tickets.changes)]);
      return {
        newlyMastered: result.newlyMastered,
        newlyUnlocked: result.newlyUnlocked,
        earnedTicket: tickets.earnedTicket,
      };
    },
    [activeProfile, progress, updateProfile]
  );

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
    }),
    [isLoading, profiles, activeProfile, progress, selectProfile, addProfile, updateProfile, removeProfile, recordSession, spendTicket]
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
