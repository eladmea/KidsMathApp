import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    let isActive = true;
    (async () => {
      const [storedProfiles, storedActiveId] = await Promise.all([loadProfiles(), loadActiveProfileId()]);
      if (!isActive) return;
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
      const nextProfiles = [...profiles, profile];
      setProfiles(nextProfiles);
      await saveProfiles(nextProfiles);
      await selectProfile(profile.id);
      return profile;
    },
    [profiles, selectProfile]
  );

  const updateProfile = useCallback(
    async (profileId, changes) => {
      const nextProfiles = profiles.map((p) => (p.id === profileId ? { ...p, ...changes } : p));
      setProfiles(nextProfiles);
      await saveProfiles(nextProfiles);
    },
    [profiles]
  );

  const removeProfile = useCallback(
    async (profileId) => {
      const nextProfiles = profiles.filter((p) => p.id !== profileId);
      setProfiles(nextProfiles);
      await saveProfiles(nextProfiles);
      await deleteProgress(profileId);
      if (profileId === activeProfileId) {
        setActiveProfileId(null);
        setProgress({});
        await saveActiveProfileId(null);
      }
    },
    [profiles, activeProfileId]
  );

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  // Records a finished round and reports what to celebrate.
  const recordSession = useCallback(
    async (tallies) => {
      if (!activeProfile) return { newlyMastered: [], newlyUnlocked: [] };
      const result = applySession(progress, tallies, toDayKey(), profileBand(activeProfile).id);
      setProgress(result.progress);
      await saveProgress(activeProfile.id, result.progress);
      return { newlyMastered: result.newlyMastered, newlyUnlocked: result.newlyUnlocked };
    },
    [activeProfile, progress]
  );

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
    }),
    [isLoading, profiles, activeProfile, progress, selectProfile, addProfile, updateProfile, removeProfile, recordSession]
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
