// Lists every line to record for a language, with the file name each
// recording needs (src/voice/<language>/<file>), most common first.
//   npm run voice:lines -- en            -> voice-lines.en.csv
//   npm run voice:lines -- en --missing  only lines not recorded yet
// Loads the game's own code through Vite, so it always matches the game.
import fs from 'fs';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const language = args.find((a) => !a.startsWith('--')) || 'en';
const missingOnly = args.includes('--missing');

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { voiceLines } = await server.ssrLoadModule('/src/services/voiceLines.js');
  const lines = voiceLines(language).filter((line) => !missingOnly || !line.recorded);
  const csv = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [['file', 'text', 'source', 'times seen', 'recorded'], ...lines.map((l) => [`${l.id}.mp3`, l.text, l.source, l.count, l.recorded ? 'yes' : 'no'])];
  const out = `voice-lines.${language}.csv`;
  fs.writeFileSync(out, rows.map((row) => row.map(csv).join(',')).join('\n') + '\n');
  console.log(`${out}: ${lines.length} lines (${lines.filter((l) => l.recorded).length} recorded). Save recordings as src/voice/${language}/<file>.`);
} finally {
  await server.close();
}
