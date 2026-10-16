import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

const LANGUAGE = 'en-US';
// A slightly slower, friendlier voice for young listeners.
const RATE = 0.9;
const PITCH = 1.1;

// Which narrator instance spoke last, so a screen that's unmounting doesn't
// cut off the next screen's speech.
let currentSpeaker = null;

// Text-to-speech for prompts, so children who can't read yet can still play.
// `enabled` is the active profile's narration setting; `say(text, { force })`
// speaks even when narration is off (used by the 🔊 "say it again" button).
export function useNarrator(enabled) {
  const speakerRef = useRef({});

  const say = useCallback(
    (text, { force = false } = {}) => {
      if (!text || (!enabled && !force)) return;
      currentSpeaker = speakerRef.current;
      Speech.stop();
      Speech.speak(text, { language: LANGUAGE, rate: RATE, pitch: PITCH });
    },
    [enabled]
  );

  const stop = useCallback(() => {
    if (currentSpeaker === speakerRef.current) Speech.stop();
  }, []);

  // Never keep talking after leaving a screen.
  useEffect(() => stop, [stop]);

  return { say, stop };
}
