import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { getStatus, initSpeech, speak, stop as stopSpeech, subscribe } from './speechEngine';

// Re-exported for screens that manage voices (parent dashboard).
export { chooseVoice, listVoices, speak as speakNow } from './speechEngine';

// Which narrator instance spoke last, so a screen that's unmounting doesn't
// cut off the next screen's speech.
let currentSpeaker = null;

// Text-to-speech for prompts, so children who can't read yet can still play.
// `enabled` is the active profile's narration setting; `say(text, { force })`
// speaks even when narration is off (used by the 🔊 "say it again" button).
// All the audio work (voices, queueing, fallbacks, mobile rules) lives in
// utils/speechEngine.js.
export function useNarrator(enabled) {
  const speakerRef = useRef({});

  useEffect(() => {
    initSpeech();
  }, []);

  const say = useCallback(
    (text, { force = false } = {}) => {
      if (!text || (!enabled && !force)) return;
      speak(text);
      currentSpeaker = speakerRef.current;
    },
    [enabled]
  );

  const stop = useCallback(() => {
    if (currentSpeaker === speakerRef.current) stopSpeech();
  }, []);

  // Never keep talking after leaving a screen.
  useEffect(() => stop, [stop]);

  return { say, stop };
}

// { ready, speaking, error, voiceId, voiceName, isOnlineVoice, choice }
export function useSpeechStatus() {
  useEffect(() => {
    initSpeech();
  }, []);
  return useSyncExternalStore(subscribe, getStatus, getStatus);
}
