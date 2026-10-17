// Recorded voice: a sound file can replace text-to-speech for any sentence.
//
// Every sentence the game says has a clip id made from its text
// (clipId('How many apples?') -> 'how-many-apples-3f9c2a1b'). A recording saved
// as src/voice/<language>/<clip id>.mp3 (or .m4a, .ogg, .wav) is played
// instead of the device voice. The rest still uses text-to-speech, so
// recordings can be added a few at a time, and a sentence with a name in it
// ("Hi, Mia!") can be spoken while the next one is a recording.
//
// `npm run voice:lines -- <language>` lists every line to record with its
// file name (see scripts/voice-lines.mjs).
const files = import.meta.glob('../voice/*/*.{mp3,m4a,ogg,wav}', { eager: true, query: '?url', import: 'default' });

// { [language]: { [clipId]: url } }
export const CLIPS = {};
Object.entries(files).forEach(([path, url]) => {
  const [, language, id] = path.match(/\/voice\/([^/]+)\/(.+)\.[a-z0-9]+$/);
  CLIPS[language] = CLIPS[language] || {};
  CLIPS[language][id] = url;
});

// The same sentence always gets the same id; spacing and case don't matter.
export function normalize(text) {
  return String(text).trim().replace(/\s+/g, ' ');
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

export function clipId(text) {
  const clean = normalize(text);
  const slug = clean
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug ? `${slug}-${hash(clean)}` : hash(clean);
}

// The recording for a sentence in a language, or null.
export function clipUrl(text, language) {
  return (CLIPS[language] && CLIPS[language][clipId(text)]) || null;
}
