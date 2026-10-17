// Every sentence the game can say in a language, for recording: fixed
// sentences from the language files, how-to lines, letter sounds, and the
// sentences of many sample questions from every generator (most common
// first). Sentences with a child's name or a random number in them are
// listed too, but there are too many to record them all; those simply keep
// using the device voice. Used by scripts/voice-lines.mjs.
import { GENERATORS, GENERATOR_PACK, generateQuestion } from '../curriculum/generators';
import { content, hasContent } from '../content/index';
import { keysOf, raw, setLanguage } from '../i18n/index';
import { splitSentences } from '../logic/voices';
import { clipId, clipUrl } from './voiceClips';

// Shown, never spoken.
const NOT_SPOKEN = /^curriculum\.(coach|games|miniGames)\.|^common\.voice|^map\.(passed|mastered|stickers)|^quiz\.(score|step|shouldBe)|^stickers\.page/;

export function voiceLines(language, { samples = 200 } = {}) {
  setLanguage(language);
  const lines = new Map();
  const add = (text, source) => {
    splitSentences(text).forEach((sentence) => {
      const entry = lines.get(sentence) || { text: sentence, source, count: 0 };
      entry.count += 1;
      lines.set(sentence, entry);
    });
  };

  keysOf(language).forEach((key) => {
    if (NOT_SPOKEN.test(key)) return;
    const value = raw(key, language);
    const texts = typeof value === 'string' ? [value] : Array.isArray(value) ? value : Object.values(value || {});
    texts.filter((text) => typeof text === 'string' && !text.includes('{')).forEach((text) => add(text, key.startsWith('curriculum.howTo') ? 'how-to' : 'ui'));
  });

  const literacy = content('literacy', language);
  if (hasContent('literacy', language) && literacy.SOUND_SPEECH) Object.values(literacy.SOUND_SPEECH).forEach((sound) => add(sound, 'letter sound'));

  Object.keys(GENERATORS).forEach((id) => {
    if (!hasContent(GENERATOR_PACK[id], language)) return;
    for (let i = 0; i < samples; i++) {
      const question = generateQuestion(id);
      add(question.speech, `question: ${id}`);
      if (question.explain) add(question.explain, `explanation: ${id}`);
      (question.items || []).forEach((item) => add(item.caption, `caption: ${id}`));
    }
  });

  return [...lines.values()]
    .map((entry) => ({ ...entry, id: clipId(entry.text), recorded: Boolean(clipUrl(entry.text, language)) }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
}
