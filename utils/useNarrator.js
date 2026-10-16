import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { pickBestVoice, rankVoices } from './voices';
import { loadVoiceChoice, saveVoiceChoice } from './storage';

const LANGUAGE = 'en-US';
// A slightly slower pace for young listeners, at the voice's natural pitch
// (raising the pitch made voices sound more robotic).
const RATE = 0.9;
const PITCH = 1.0;
// Some browsers never report their voices; don't wait forever.
const VOICES_TIMEOUT_MS = 2500;

// Which narrator instance spoke last, so a screen that's unmounting doesn't
// cut off the next screen's speech.
let currentSpeaker = null;

// The voice used for all speech: a grown-up's choice, or the best one found.
let voiceId = null;
let voiceChoice = null;
let voiceReady = null;
let voiceLoaded = false;

export function getVoicesSafely() {
  return Promise.race([
    Speech.getAvailableVoicesAsync().catch(() => []),
    new Promise((resolve) => setTimeout(() => resolve([]), VOICES_TIMEOUT_MS)),
  ]);
}

// English voices on this device, best first.
export async function listVoices() {
  return rankVoices(await getVoicesSafely());
}

// Loads the saved choice (or picks the best voice) once per app start.
export function loadVoice() {
  if (!voiceReady) {
    voiceReady = (async () => {
      voiceChoice = await loadVoiceChoice();
      voiceId = voiceChoice || pickBestVoice(await getVoicesSafely());
      voiceLoaded = true;
    })();
  }
  return voiceReady;
}

export function getVoiceChoice() {
  return voiceChoice;
}

export function getVoiceId() {
  return voiceId;
}

// null goes back to picking the best voice automatically.
export async function chooseVoice(id) {
  voiceChoice = id;
  voiceId = id || pickBestVoice(await getVoicesSafely());
  await saveVoiceChoice(id);
}

let speakToken = 0;

// Speaks right away once the voice is known; the very first sentence waits
// (briefly) for it, so it doesn't come out in the default voice.
export function speakNow(text) {
  currentSpeaker = null;
  Speech.stop();
  const token = ++speakToken;
  const speak = () => {
    if (token !== speakToken) return;
    Speech.speak(text, { language: LANGUAGE, rate: RATE, pitch: PITCH, ...(voiceId ? { voice: voiceId } : {}) });
  };
  if (voiceId || voiceLoaded) speak();
  else loadVoice().then(speak);
}

// Text-to-speech for prompts, so children who can't read yet can still play.
// `enabled` is the active profile's narration setting; `say(text, { force })`
// speaks even when narration is off (used by the 🔊 "say it again" button).
export function useNarrator(enabled) {
  const speakerRef = useRef({});

  useEffect(() => {
    loadVoice();
  }, []);

  const say = useCallback(
    (text, { force = false } = {}) => {
      if (!text || (!enabled && !force)) return;
      speakNow(text);
      currentSpeaker = speakerRef.current;
    },
    [enabled]
  );

  const stop = useCallback(() => {
    if (currentSpeaker !== speakerRef.current) return;
    // Also drop a sentence still waiting for the voice to load.
    speakToken += 1;
    Speech.stop();
  }, []);

  // Never keep talking after leaving a screen.
  useEffect(() => stop, [stop]);

  return { say, stop };
}
