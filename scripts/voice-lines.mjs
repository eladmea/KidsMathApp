// Lists every line to record for a language, with the file name each
// recording needs (src/voice/<language>/<file>), most common first.
//   npm run voice:lines -- en            -> voice-lines.en.csv
//   npm run voice:lines -- en --missing  only lines not recorded yet
//   npm run voice:lines -- en --txt      -> voice-generator/sentences_english.txt
//                                           (keeps its first line, the voice settings)
// Loads the game's own code through Vite, so it always matches the game.
import fs from 'fs';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const language = args.find((a) => !a.startsWith('--')) || 'en';
const missingOnly = args.includes('--missing');
const asText = args.includes('--txt');
const LANGUAGE_NAMES = { en: 'english', he: 'hebrew' };

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { voiceLines } = await server.ssrLoadModule('/src/services/voiceLines.js');
  const all = voiceLines(language);
  const lines = all.filter((line) => !missingOnly || !line.recorded);
  if (all.missingTemplates.length) console.warn(`Spoken templates with no values listed (src/services/voiceLines.js templateValues): ${all.missingTemplates.join(', ')}`);
  if (asText) {
    const out = `voice-generator/sentences_${LANGUAGE_NAMES[language] || language}.txt`;
    const header = fs.existsSync(out) ? fs.readFileSync(out, 'utf8').split('\n')[0] : 'VOICE=af_heart SPEED=0.9 LANG=a';
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
