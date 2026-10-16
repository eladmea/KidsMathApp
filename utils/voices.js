// Picking the most natural-sounding English voice the device offers. The
// built-in default is often the oldest, most robotic voice; most devices also
// ship much better ones ("Natural"/"Neural" voices in Edge and Windows, Google
// voices in Chrome and Android, "Enhanced"/"Premium" voices on Apple devices).
// A grown-up can also pick one in the parent dashboard.

// Novelty and very robotic voices that should never be chosen automatically.
const AVOID = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical',
  'jester', 'organ', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'junior', 'ralph', 'fred', 'kathy',
  'espeak', 'robot', 'grandma', 'grandpa', 'rocko', 'shelley', 'sandy', 'eddy', 'flo', 'reed',
];
// Voices known to sound pleasant to children (a small nudge, not a rule).
const FRIENDLY = ['samantha', 'ava', 'allison', 'susan', 'zoe', 'aria', 'jenny', 'ana', 'emma', 'serena', 'karen', 'moira', 'libby', 'sonia'];

function lower(text) {
  return String(text || '').toLowerCase();
}

// Higher is better; below 0 means "don't pick automatically".
export function rankVoice(voice) {
  const name = lower(voice.name);
  const id = lower(voice.identifier);
  const lang = lower(voice.language).replace('_', '-');
  if (!lang.startsWith('en')) return -1000;
  let score = 0;
  if (lang === 'en-us') score += 30;
  else if (lang === 'en-gb' || lang === 'en-au' || lang === 'en-ca') score += 20;
  if (/natural|neural|wavenet|studio/.test(name) || /natural|neural/.test(id)) score += 60;
  if (lower(voice.quality) === 'enhanced' || /enhanced|premium|siri/.test(name) || /enhanced|premium/.test(id)) score += 50;
  if (/google/.test(name)) score += 35;
  if (/online/.test(name)) score += 20;
  if (FRIENDLY.some((friendly) => name.includes(friendly))) score += 10;
  if (AVOID.some((bad) => name.includes(bad) || id.includes(bad))) score -= 200;
  return score;
}

// English voices, best first.
export function rankVoices(voices = []) {
  return voices
    .map((voice) => ({ voice, score: rankVoice(voice) }))
    .filter(({ score }) => score > -1000)
    .sort((a, b) => b.score - a.score || lower(a.voice.name).localeCompare(lower(b.voice.name)))
    .map(({ voice }) => voice);
}

export function pickBestVoice(voices = []) {
  const best = rankVoices(voices).find((voice) => rankVoice(voice) >= 0);
  return best ? best.identifier : null;
}
