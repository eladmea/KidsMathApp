// Lists every line to record for a language, with the file name each
// recording needs (src/voice/<language>/<file>), most common first.
//   npm run voice:lines -- en            -> voice-lines.en.csv
//   npm run voice:lines -- en --missing  only lines not recorded yet
//   npm run voice:lines -- en --txt      -> voice-generator/sentences_english.txt
//                                           (keeps its first line, the voice settings)
// Every run also writes src/voice/<language>/groups.json: which recordings
// each scene needs, so they are downloaded before it opens
// (services/voicePreload.js). Run it again after recording.
// Loads the game's own code through Vite, so it always matches the game.
import fs from 'fs';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const language = args.find((a) => !a.startsWith('--')) || 'en';
const missingOnly = args.includes('--missing');
const asText = args.includes('--txt');
const LANGUAGE_NAMES = { en: 'english', he: 'hebrew' };
// Line 1 of a new sentence file: the voice settings (generate.py reads them).
const HEADERS = {
  en: 'VOICE=af_heart SPEED=0.9 LANG=a',
  he: 'ENGINE=gemini VOICE=Erinome MODEL=gemini-3.8-flash-tts',
};

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { voiceLines, voiceManifest } = await server.ssrLoadModule('/src/services/voiceLines.js');
  // More samples than the default, so rarer questions of the bigger skills
  // are listed too.
  const all = voiceLines(language, { samples: 12000 });
  const lines = all.filter((line) => !missingOnly || !line.recorded);
  if (all.missingTemplates.length) console.warn(`Spoken templates with no values listed (src/services/voiceLines.js templateValues): ${all.missingTemplates.join(', ')}`);
  const manifest = `src/voice/${language}/groups.json`;
  if (fs.existsSync(`src/voice/${language}`)) {
    fs.writeFileSync(manifest, JSON.stringify(voiceManifest(all)) + '\n');
    console.log(`${manifest}: ${Object.keys(voiceManifest(all).groups).length} groups.`);
  }
  if (asText) {
    const out = `voice-generator/sentences_${LANGUAGE_NAMES[language] || language}.txt`;
    const header = fs.existsSync(out) ? fs.readFileSync(out, 'utf8').split('\n')[0] : HEADERS[language] || HEADERS.en;
    fs.writeFileSync(out, [header, ...lines.map((l) => `${l.id} | ${l.text}`)].join('\n') + '\n');
    console.log(`${out}: ${lines.length} sentences.`);
  } else {
    const csv = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [['file', 'text', 'source', 'times seen', 'recorded'], ...lines.map((l) => [`${l.id}.mp3`, l.text, l.source, l.count, l.recorded ? 'yes' : 'no'])];
    const out = `voice-lines.${language}.csv`;
    fs.writeFileSync(out, rows.map((row) => row.map(csv).join(',')).join('\n') + '\n');
    console.log(`${out}: ${lines.length} lines (${lines.filter((l) => l.recorded).length} recorded). Save recordings as src/voice/${language}/<file>.`);
  }
} finally {
  await server.close();
}
