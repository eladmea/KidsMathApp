// One speech engine for the whole app (web, iOS and Android), on top of
// expo-speech and the device's own free voices.
//
// - Picks the most natural voice (utils/voices.js) or a grown-up's choice,
//   checking a saved choice still exists on this device.
// - Speaks long text as a queue of sentences (Chrome cuts off long ones).
// - If a voice fails (e.g. an online voice with no connection), retries once
//   with the best on-device voice and remembers the failure for the session.
// - Mobile: unlocks speech on the first tap (iOS Safari blocks speech that
//   doesn't follow a user gesture), plays in iOS silent mode in the native app,
//   and stops talking when the app goes to the background.
// - Keeps a small status ({ ready, voiceName, speaking, error }) that screens
//   can follow with useSpeechStatus().
import { AppState, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { fallbackVoice, isOnlineVoice, pickBestVoice, rankVoices, splitSentences } from './voices';
import { loadVoiceChoice, saveVoiceChoice } from './storage';

export const LANGUAGE = 'en-US';
// A slightly slower pace for young listeners, at the voice's natural pitch.
export const RATE = 0.9;
export const PITCH = 1.0;
// Some browsers never report their voices; don't wait forever.
const VOICES_TIMEOUT_MS = 2500;
// Browsers (notably Chrome on Android) can list voices late; look again.
const VOICE_RETRY_MS = 4000;
const MAX_VOICE_RETRIES = 3;

const isWeb = Platform.OS === 'web';
const isIOSWeb =
  isWeb &&
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const state = {
  voices: [],
  voiceId: null,
  choice: null,
  failedVoiceIds: [],
  ready: false,
  speaking: false,
  error: null,
  unlocked: !isIOSWeb,
  pendingText: null,
  token: 0,
  voiceRetries: 0,
};
let readyPromise = null;
let retryTimer = null;
let initialized = false;
const subscriptions = [];
const listeners = new Set();
let snapshot = makeSnapshot();

function isOnline() {
  return !(typeof navigator !== 'undefined' && navigator.onLine === false);
}

function voiceById(id) {
  return state.voices.find((voice) => voice.identifier === id) || null;
}

function makeSnapshot() {
  const voice = voiceById(state.voiceId);
  return {
    ready: state.ready,
    speaking: state.speaking,
    error: state.error,
    voiceId: state.voiceId,
    voiceName: voice ? voice.name : null,
    isOnlineVoice: voice ? isOnlineVoice(voice) : false,
    choice: state.choice,
  };
}

function emit() {
  snapshot = makeSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStatus() {
  return snapshot;
}

export async function getVoicesSafely() {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve([]), VOICES_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Speech.getAvailableVoicesAsync().catch(() => []), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function chooseAutomatically() {
  const context = { online: isOnline() };
  const usable = state.voices.filter((voice) => !state.failedVoiceIds.includes(voice.identifier));
  return pickBestVoice(usable, context);
}

function applyVoices(voices) {
  state.voices = voices;
  // A saved choice from another device or browser may not exist here.
  const chosen = state.choice && voiceById(state.choice) ? state.choice : null;
  state.voiceId = chosen || chooseAutomatically();
}

// Voices sometimes arrive late; look again a few times if none came.
function scheduleVoiceRetry() {
  if (state.voices.length || state.voiceRetries >= MAX_VOICE_RETRIES || retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    state.voiceRetries += 1;
    const voices = await getVoicesSafely();
    if (voices.length) {
      applyVoices(voices);
      emit();
    } else {
      scheduleVoiceRetry();
    }
  }, VOICE_RETRY_MS);
}

// Stop when the app or tab goes to the background; never talk from there.
function handleAppState(next) {
  if (next !== 'active') stop();
}

// iOS Safari only allows speech that starts from a user gesture. The first
// tap anywhere speaks a silent utterance, which unlocks speech for the page,
// then replays whatever was asked before the tap.
function installWebUnlock() {
  if (state.unlocked || typeof document === 'undefined') return;
  const unlock = () => {
    document.removeEventListener('touchend', unlock, true);
    document.removeEventListener('click', unlock, true);
    state.unlocked = true;
    try {
      window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(''));
    } catch (e) {
      // Nothing to unlock on this browser.
    }
    const pending = state.pendingText;
    state.pendingText = null;
    if (pending) speak(pending);
  };
  document.addEventListener('touchend', unlock, true);
  document.addEventListener('click', unlock, true);
  subscriptions.push({ remove: () => {
    document.removeEventListener('touchend', unlock, true);
    document.removeEventListener('click', unlock, true);
  } });
}

async function setNativeAudioMode() {
  if (isWeb) return;
  try {
    // Lazy so the web bundle and tests don't need the native audio module.
    const { setAudioModeAsync } = require('expo-audio');
    // Speech and sounds play with the iPhone's silent switch on, lower other
    // apps' audio while speaking, and stop in the background.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: false });
  } catch (e) {
    // Older runtimes: the default audio mode still works, just muted by the switch.
  }
}

// Sets everything up once; safe to call from many places.
export function initSpeech() {
  if (!initialized) {
    initialized = true;
    subscriptions.push(AppState.addEventListener('change', handleAppState));
    installWebUnlock();
    setNativeAudioMode();
  }
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        state.choice = await loadVoiceChoice();
        applyVoices(await getVoicesSafely());
        state.error = null;
      } catch (e) {
        state.error = 'voices';
      }
      state.ready = true;
      scheduleVoiceRetry();
      emit();
    })();
  }
  return readyPromise;
}

// Queues every sentence at once (each platform plays its queue in order).
// If one fails, the rest are re-queued once with an on-device voice.
function speakSentences(sentences, token, voiceId, retried) {
  let failed = false;
  sentences.forEach((sentence, index) => {
    const isFirst = index === 0;
    const isLast = index === sentences.length - 1;
    Speech.speak(sentence, {
      language: LANGUAGE,
      rate: RATE,
      pitch: PITCH,
      ...(voiceId ? { voice: voiceId } : {}),
      onStart: isFirst
        ? () => {
            if (token !== state.token) return;
            state.speaking = true;
            state.error = null;
            emit();
          }
        : undefined,
      onDone: isLast
        ? () => {
            if (token !== state.token) return;
            state.speaking = false;
            emit();
          }
        : undefined,
      onError: () => {
        if (token !== state.token || failed) return;
        failed = true;
        if (!retried && voiceId) {
          state.failedVoiceIds = [...state.failedVoiceIds, voiceId];
          const next = fallbackVoice(state.voices, state.failedVoiceIds, { online: isOnline() });
          if (!state.choice) state.voiceId = next;
          emit();
          Speech.stop();
          speakSentences(sentences.slice(index), token, next, true);
          return;
        }
        state.speaking = false;
        state.error = 'speak';
        emit();
      },
    });
  });
}

// Speaks `text`, replacing anything already being said.
export function speak(text) {
  if (!text) return;
  const token = ++state.token;
  Speech.stop();
  if (!state.unlocked) {
    // Wait for the first tap (iOS Safari), then say it.
    state.pendingText = text;
    return;
  }
  const run = () => speakSentences(splitSentences(text), token, state.voiceId, false);
  if (state.ready) run();
  else initSpeech().then(run);
}

// Stops speaking, including a sentence still waiting for the voice to load.
export function stop() {
  state.token += 1;
  state.pendingText = null;
  Speech.stop();
  if (state.speaking) {
    state.speaking = false;
    emit();
  }
}

// English voices on this device, best first.
export async function listVoices() {
  await initSpeech();
  if (!state.voices.length) applyVoices(await getVoicesSafely());
  return rankVoices(state.voices, { online: isOnline() });
}

// A grown-up's pick; null goes back to choosing automatically.
export async function chooseVoice(id) {
  await initSpeech();
  state.choice = id;
  state.failedVoiceIds = state.failedVoiceIds.filter((failed) => failed !== id);
  state.voiceId = id || chooseAutomatically();
  emit();
  await saveVoiceChoice(id);
}

// For tests: drop all listeners, timers and state.
export function resetSpeechForTests() {
  subscriptions.splice(0).forEach((subscription) => subscription.remove());
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  listeners.clear();
  initialized = false;
  readyPromise = null;
  Object.assign(state, {
    voices: [],
    voiceId: null,
    choice: null,
    failedVoiceIds: [],
    ready: false,
    speaking: false,
    error: null,
    unlocked: !isIOSWeb,
    pendingText: null,
    token: 0,
    voiceRetries: 0,
  });
  snapshot = makeSnapshot();
}
