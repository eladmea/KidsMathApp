// Read-aloud for the whole game, on the browser's free voices (Web Speech API).
//
// - Picks the most natural voice (logic/voices.js) or a grown-up's choice.
// - Speaks long text as a queue of sentences (Chrome cuts off long ones).
// - If a voice fails (e.g. an online voice with no connection), retries once
//   with the best on-device voice and remembers the failure for the session.
// - iOS Safari only allows speech after a user gesture: the first tap unlocks
//   it and replays whatever was asked before.
// - Stops talking when the tab is hidden.
import { fallbackVoice, isOnlineVoice, pickBestVoice, rankVoices, splitSentences } from '../logic/voices';
import { loadVoiceChoice, saveVoiceChoice } from './storage';
import { bridge } from './testBridge';

export const LANGUAGE = 'en-US';
// A slightly slower pace for young listeners, at the voice's natural pitch.
export const RATE = 0.9;
export const PITCH = 1.0;
// Some browsers never report their voices; don't wait forever.
const VOICES_TIMEOUT_MS = 2500;

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const isIOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const state = {
  voices: [],
  native: new Map(),
  voiceId: null,
  choice: null,
  failedVoiceIds: [],
  unlocked: !isIOS,
  pendingText: null,
  token: 0,
  speaking: false,
};
let readyPromise = null;

function isOnline() {
  return navigator.onLine !== false;
}

// SpeechSynthesisVoice -> the shape logic/voices.js ranks.
function toVoice(voice) {
  return { identifier: voice.voiceURI, name: voice.name, language: voice.lang, localService: voice.localService };
}

function readVoices() {
  const list = synth ? synth.getVoices() : [];
  state.native = new Map(list.map((voice) => [voice.voiceURI, voice]));
  return list.map(toVoice);
}

// Voices often arrive a moment after the page loads.
function waitForVoices() {
  return new Promise((resolve) => {
    const now = readVoices();
    if (now.length || !synth) return resolve(now);
    const done = () => {
      clearTimeout(timer);
      synth.removeEventListener('voiceschanged', done);
      resolve(readVoices());
    };
    const timer = setTimeout(done, VOICES_TIMEOUT_MS);
    synth.addEventListener('voiceschanged', done);
  });
}

function chooseAutomatically() {
  const usable = state.voices.filter((voice) => !state.failedVoiceIds.includes(voice.identifier));
  return pickBestVoice(usable, { online: isOnline() });
}

function applyVoices(voices) {
  state.voices = voices;
  const chosen = state.choice && voices.some((voice) => voice.identifier === state.choice) ? state.choice : null;
  state.voiceId = chosen || chooseAutomatically();
}

function installUnlock() {
  if (state.unlocked) return;
  const unlock = () => {
    document.removeEventListener('pointerup', unlock, true);
    state.unlocked = true;
    try {
      synth.speak(new SpeechSynthesisUtterance(''));
    } catch (e) {
      // Nothing to unlock on this browser.
    }
    const pending = state.pendingText;
    state.pendingText = null;
    if (pending) speak(pending);
  };
  document.addEventListener('pointerup', unlock, true);
}

// Sets everything up once; safe to call from many places.
export function initSpeech() {
  if (!readyPromise) {
    installUnlock();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });
    readyPromise = (async () => {
      state.choice = await loadVoiceChoice();
      applyVoices(await waitForVoices());
      if (synth) synth.addEventListener('voiceschanged', () => applyVoices(readVoices()));
    })();
  }
  return readyPromise;
}

function speakSentences(sentences, token, voiceId, retried) {
  let failed = false;
  sentences.forEach((sentence, index) => {
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = LANGUAGE;
    utterance.rate = RATE;
    utterance.pitch = PITCH;
    const voice = voiceId && state.native.get(voiceId);
    if (voice) utterance.voice = voice;
    if (index === 0) utterance.onstart = () => token === state.token && (state.speaking = true);
    if (index === sentences.length - 1) utterance.onend = () => token === state.token && (state.speaking = false);
    utterance.onerror = (event) => {
      // "interrupted"/"canceled" just mean we stopped it on purpose.
      if (token !== state.token || failed || event.error === 'interrupted' || event.error === 'canceled') return;
      failed = true;
      if (!retried && voiceId) {
        state.failedVoiceIds = [...state.failedVoiceIds, voiceId];
        const next = fallbackVoice(state.voices, state.failedVoiceIds, { online: isOnline() });
        if (!state.choice) state.voiceId = next;
        synth.cancel();
        speakSentences(sentences.slice(index), token, next, true);
        return;
      }
      state.speaking = false;
    };
    synth.speak(utterance);
  });
}

// Speaks `text`, replacing anything already being said.
export function speak(text) {
  if (!text) return;
  bridge.spoken.push(text);
  if (!synth) return;
  const token = ++state.token;
  synth.cancel();
  if (!state.unlocked) {
    state.pendingText = text;
    return;
  }
  initSpeech().then(() => {
    if (token === state.token) speakSentences(splitSentences(text), token, state.voiceId, false);
  });
}

export function stop() {
  state.token += 1;
  state.pendingText = null;
  state.speaking = false;
  if (synth) synth.cancel();
}

export function isSpeaking() {
  return state.speaking;
}

export function currentVoiceName() {
  const voice = state.voices.find((v) => v.identifier === state.voiceId);
  return voice ? `${voice.name}${isOnlineVoice(voice) ? ' (online)' : ''}` : null;
}

// English voices on this device, best first.
export async function listVoices() {
  await initSpeech();
  return rankVoices(state.voices, { online: isOnline() });
}

// A grown-up's pick; null goes back to choosing automatically.
export async function chooseVoice(id) {
  await initSpeech();
  state.choice = id;
  state.failedVoiceIds = state.failedVoiceIds.filter((failed) => failed !== id);
  state.voiceId = id || chooseAutomatically();
  await saveVoiceChoice(id);
}
