// Recorded voice: a sound file can replace text-to-speech for any sentence.
//
// Every sentence the game says has a clip id made from the words it speaks
// (clipId('How many apples?') -> 'how-many-apples-1a2b3c4d'). A recording
// saved as src/voice/<language>/<clip id>.mp3 (or .m4a, .ogg, .wav) is played
// instead of the device voice. The rest still uses text-to-speech, so
// recordings can be added a few at a time, and a sentence with a name in it
// ("Hi, Mia!") can be spoken while the next one is a recording.
//
// Only the spoken words make the id (spokenForm): no punctuation, lower case,
// and the numbers 0-20 as words. "Cat.", "cat", "cat!" and "Cat?" share one
// recording, and so do "5!", "5." and "Five!". Listening showed the voice
// says them the same way. The text on screen doesn't change.
//
// `npm run voice:lines -- <language>` lists every line to record with its
// file name (see scripts/voice-lines.mjs).
import { content, hasContent } from '../content/index';
import { getLanguage } from '../i18n/index';

const files = import.meta.glob('../voice/*/*.{mp3,m4a,ogg,wav}', { eager: true, query: '?url', import: 'default' });

// { [language]: { [clipId]: url } }
export const CLIPS = {};
Object.entries(files).forEach(([path, url]) => {
  const [, language, id] = path.match(/\/voice\/([^/]+)\/(.+)\.[a-z0-9]+$/);
  CLIPS[language] = CLIPS[language] || {};
  CLIPS[language][id] = url;
});

// The same sentence always gets the same id; spacing doesn't matter.
export function normalize(text) {
  return String(text).trim().replace(/\s+/g, ' ');
}

// The words a sentence speaks, which is all a recording depends on: lower
// case, punctuation gone, and whole numbers 0-20 written as the language's
// number words (its math pack's NUMBER_WORDS), so "9!" and "Nine." match.
// Math signs (+, ×, =) and bigger numbers stay as they are.
export function spokenForm(text, language = getLanguage()) {
  const words = hasContent('math', language) ? content('math', language).NUMBER_WORDS || [] : [];
  return normalize(text)
    .normalize('NFC')
    .toLowerCase()
    .replace(/\d+(?:[.,:]\d+)*/g, (number) => (/^(0|[1-9]\d*)$/.test(number) && words[Number(number)]) || number)
    .replace(/\p{P}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// FNV-1a: a short stable hash, so ids stay unique and file names short.
function hash(text) {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function clipId(text, language = getLanguage()) {
  const spoken = spokenForm(text, language);
  const slug = spoken
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug ? `${slug}-${hash(spoken)}` : hash(spoken);
}

// The recording for a sentence in a language, or null.
export function clipUrl(text, language) {
  return (CLIPS[language] && CLIPS[language][clipId(text, language)]) || null;
}
