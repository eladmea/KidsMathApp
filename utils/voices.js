// Picking the most natural-sounding English voice a device offers, for free:
// every platform ships far better voices than its default one.
//   Web (Edge, Windows):  "Microsoft Aria Online (Natural)": neural, online
//   Web (Chrome):         "Google US English": online
//   iOS / Safari / macOS: "Ava (Premium)", "Samantha (Enhanced)", Siri voices
//   Android:              Google voices such as "en-us-x-tpf-local" (on device)
//                         or "...-network" (online)
// Online voices sound best but need a connection, so when the device is
// offline on-device voices win. A grown-up can pick a voice in the parent
// dashboard; this ranking is the automatic choice.
//
// A voice: { identifier, name, language, quality, localService? } (the fields
// expo-speech returns; `localService` is only known on the web).

// Novelty and old formant voices that should never be picked automatically.
const AVOID = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical',
  'jester', 'organ', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'junior', 'ralph', 'fred', 'kathy',
  'espeak', 'robot', 'grandma', 'grandpa', 'rocko', 'shelley', 'sandy', 'eddy', 'flo', 'reed', 'eloquence',
];
// Voices known to sound pleasant to children (a small nudge, not a rule).
const FRIENDLY = ['samantha', 'ava', 'allison', 'susan', 'zoe', 'aria', 'jenny', 'ana', 'emma', 'serena', 'karen', 'moira', 'libby', 'sonia'];

function lower(text) {
  return String(text || '').toLowerCase();
}

// Online voices: Edge/Google web voices (localService === false) and
// Android "-network" voices.
export function isOnlineVoice(voice) {
  return voice.localService === false || /-network$/.test(lower(voice.identifier));
}

// Higher is better; below 0 means "don't pick automatically".
// `online` is whether the device currently has a connection.
export function rankVoice(voice, { online = true } = {}) {
  const name = lower(voice.name);
  const id = lower(voice.identifier);
  const lang = lower(voice.language).replace('_', '-');
  if (!lang.startsWith('en')) return -1000;
  let score = 0;
  if (lang === 'en-us') score += 30;
  else if (lang === 'en-gb' || lang === 'en-au' || lang === 'en-ca') score += 20;
  // Neural voices (Edge "Natural"/"Neural", Google "WaveNet"/"Studio").
  if (/natural|neural|wavenet|studio/.test(name) || /natural|neural/.test(id)) score += 60;
  // Apple voice tiers: premium > enhanced/Siri > compact.
  if (/premium/.test(name) || /\.premium\./.test(id)) score += 65;
  else if (lower(voice.quality) === 'enhanced' || /enhanced|siri/.test(name) || /\.enhanced\.|siri/.test(id)) score += 50;
  // Google voices (Chrome) and Android's Google TTS voice ids (en-us-x-...).
  if (/google/.test(name) || /^[a-z]{2}-[a-z]{2}-x-/.test(id)) score += 35;
  if (/online/.test(name)) score += 20;
  if (FRIENDLY.some((friendly) => name.includes(friendly))) score += 10;
  if (isOnlineVoice(voice) && !online) score -= 150;
  if (AVOID.some((bad) => name.includes(bad) || id.includes(bad))) score -= 200;
  return score;
}

// English voices, best first.
export function rankVoices(voices = [], context = {}) {
  return voices
    .map((voice) => ({ voice, score: rankVoice(voice, context) }))
    .filter(({ score }) => score > -1000)
    .sort((a, b) => b.score - a.score || lower(a.voice.name).localeCompare(lower(b.voice.name)))
    .map(({ voice }) => voice);
}

export function pickBestVoice(voices = [], context = {}) {
  const best = rankVoices(voices, context).find((voice) => rankVoice(voice, context) >= 0);
  return best ? best.identifier : null;
}

// The next voice to try after `failedIds` failed (e.g. an online voice with
// no connection): the best remaining on-device voice, else any remaining one.
export function fallbackVoice(voices = [], failedIds = [], context = {}) {
  const remaining = rankVoices(voices, context).filter((voice) => !failedIds.includes(voice.identifier));
  const local = remaining.find((voice) => !isOnlineVoice(voice) && rankVoice(voice, context) >= 0);
  return (local || remaining.find((voice) => rankVoice(voice, context) >= 0) || null)?.identifier ?? null;
}

// Splits text into sentences so long prompts are spoken as a queue of short
// utterances (Chrome cuts off single utterances after about 15 seconds).
export function splitSentences(text, maxLength = 180) {
  const parts = String(text)
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.flatMap((part) => {
    if (part.length <= maxLength) return [part];
    // Very long sentences break at commas.
    const chunks = [];
    let current = '';
    part.split(/(?<=,)\s+/).forEach((piece) => {
      if (current && (current + ' ' + piece).length > maxLength) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? `${current} ${piece}` : piece;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  });
}
