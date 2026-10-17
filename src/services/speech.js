// Read-aloud for the whole game.
//
// - Speaks sentence by sentence. A sentence with a recording
//   (services/voiceClips.js: src/voice/<language>/<clip id>.mp3) plays the
//   recording; any other sentence uses the device's free voices (Web Speech
//   API), so recordings can replace the device voice a few at a time.
// - Speaks the current language (its _meta.json "speech" code) and picks the
//   most natural device voice for it (logic/voices.js), or a grown-up's choice.
// - If a device voice fails (e.g. an online voice with no connection),
//   retries once with the best on-device voice and remembers the failure.
// - iOS Safari only allows sound after a user gesture: the first tap unlocks
//   speech and recordings, then replays whatever was asked before.
// - Stops talking when the tab is hidden.
import { fallbackVoice, isOnlineVoice, pickBestVoice, rankVoices, splitSentences } from '../logic/voices';
import { getLanguage, languageInfo, onLanguageChange } from '../i18n/index';
import { clipUrl } from './voiceClips';
import { loadVoiceChoice, saveVoiceChoice } from './storage';
import { bridge } from './testBridge';

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
  // Read prompts aloud? Each child has their own setting (on by default for
  // pre-readers); a 🔊 tap always speaks.
  narration: true,
};
let readyPromise = null;
// One audio element for every recording (iOS unlocks an element, not a page).
let player = null;

const speechLanguage = () => languageInfo().speech;

function isOnline() {
  return navigator.onLine !== false;
}

function context() {
  return { online: isOnline(), language: speechLanguage() };
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
  return pickBestVoice(usable, context());
}

// A grown-up's pick stands only if it exists here and speaks this language.
function applyVoices(voices) {
  state.voices = voices;
  const chosen = state.choice && rankVoices(voices, context()).some((voice) => voice.identifier === state.choice) ? state.choice : null;
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
    try {
      audio().play().catch(() => {});
    } catch (e) {
      // No audio element support.
    }
    const pending = state.pendingText;
    state.pendingText = null;
    if (pending) speak(pending);
  };
  document.addEventListener('pointerup', unlock, true);
}

function audio() {
  if (!player) player = new Audio();
  return player;
}

// Sets everything up once; safe to call from many places.
export function initSpeech() {
  if (!readyPromise) {
    installUnlock();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });
    onLanguageChange(() => applyVoices(state.voices));
    readyPromise = (async () => {
      state.choice = await loadVoiceChoice();
      applyVoices(await waitForVoices());
      if (synth) synth.addEventListener('voiceschanged', () => applyVoices(readVoices()));
    })();
  }
  return readyPromise;
}

// ---- The queue: one sentence at a time, recording or device voice ----

function finish(token) {
  if (token === state.token) state.speaking = false;
}

function playQueue(sentences, index, token) {
  if (token !== state.token) return;
  if (index >= sentences.length) return finish(token);
  state.speaking = true;
  const sentence = sentences[index];
  const next = () => playQueue(sentences, index + 1, token);
  const url = clipUrl(sentence, getLanguage());
  bridge.voice.push({ text: sentence, source: url ? 'recording' : 'device' });
  if (url) playRecording(url, token, next, () => sayWithDevice(sentence, token, next));
  else sayWithDevice(sentence, token, next);
}

function playRecording(url, token, onDone, onFail) {
  const element = audio();
  element.onended = () => token === state.token && onDone();
  element.onerror = () => token === state.token && onFail();
  element.src = url;
  element.play().catch(() => token === state.token && onFail());
}

// Some browsers now and then never say an utterance ended; don't wait for
// ever (about 0.1 s a character, plus a margin).
const longest = (sentence) => 3000 + sentence.length * 120;

function sayWithDevice(sentence, token, onDone, retried = false) {
  if (!synth) return onDone();
  let done = false;
  const once = () => {
    if (done || token !== state.token) return;
    done = true;
    clearTimeout(watchdog);
    onDone();
  };
  const watchdog = setTimeout(once, longest(sentence));
  const utterance = new SpeechSynthesisUtterance(sentence);
  // Keep a reference: Chrome can drop an unreferenced utterance mid-sentence.
  state.utterance = utterance;
  utterance.lang = speechLanguage();
  utterance.rate = RATE;
  utterance.pitch = PITCH;
  const voice = state.voiceId && state.native.get(state.voiceId);
  if (voice) utterance.voice = voice;
  utterance.onend = once;
  utterance.onerror = (event) => {
    // "interrupted"/"canceled" just mean we stopped it on purpose.
    if (token !== state.token || event.error === 'interrupted' || event.error === 'canceled') return;
    if (!retried && state.voiceId) {
      done = true;
      clearTimeout(watchdog);
      state.failedVoiceIds = [...state.failedVoiceIds, state.voiceId];
      const fallback = fallbackVoice(state.voices, state.failedVoiceIds, context());
      if (!state.choice) state.voiceId = fallback;
      sayWithDevice(sentence, token, onDone, true);
      return;
    }
    once();
  };
  synth.speak(utterance);
}

export function setNarration(enabled) {
  state.narration = enabled;
  if (!enabled) stop();
}

export function isNarrationOn() {
  return state.narration;
}

// Speaks `text`, replacing anything already being said. Skipped when
// narration is off, unless `force` (the child asked to hear it).
export function speak(text, { force = false } = {}) {
  if (!text || (!state.narration && !force)) return;
  bridge.spoken.push(text);
  const token = ++state.token;
  silence();
  if (!state.unlocked) {
    state.pendingText = text;
    return;
  }
  initSpeech().then(() => playQueue(splitSentences(text), 0, token));
}

function silence() {
  if (synth) synth.cancel();
  if (player) {
    player.onended = null;
    player.onerror = null;
    player.pause();
  }
}

export function stop() {
  state.token += 1;
  state.pendingText = null;
  state.speaking = false;
  silence();
}

export function isSpeaking() {
  return state.speaking;
}

export function currentVoiceName() {
  const voice = state.voices.find((v) => v.identifier === state.voiceId);
  return voice ? `${voice.name}${isOnlineVoice(voice) ? ' (online)' : ''}` : null;
}

// Device voices for the language, best first.
export async function listVoices() {
  await initSpeech();
  return rankVoices(state.voices, context());
}

// A grown-up's pick; null goes back to choosing automatically.
export async function chooseVoice(id) {
  await initSpeech();
  state.choice = id;
  state.failedVoiceIds = state.failedVoiceIds.filter((failed) => failed !== id);
  state.voiceId = id || chooseAutomatically();
  await saveVoiceChoice(id);
}
