// Literacy question generators. Same question shape as generators.js, plus:
// - choiceStyle: 'picture' | 'letter' | 'word' (how answer buttons look)
// - speakAlways: listening tasks are read aloud even when narration is off
// - type 'build': spell a word from letter tiles   { word, tiles, answer }
// - type 'order': put story panels in order        { items, answer: ids }
import { pick, sample, shuffle } from './random';
import { content } from '../content/index';

// The words come from the language's literacy pack (src/content/<language>/literacy.js).
const words = () => content('literacy');

// Picture choices, the sentence that names them, and each one's word (its
// 🔊 button says it), in on-screen order.
function pictureChoices(entries) {
  const order = shuffle(entries);
  return { choices: order.map(([emoji]) => emoji), names: words().listWords(order.map(([, word]) => word)), choiceWords: order.map(([, word]) => words().listWords([word])) };
}

function rhymes() {
  const { RHYME_FAMILIES, say } = words();
  const familyIndex = Math.floor(Math.random() * RHYME_FAMILIES.length);
  const [target, match] = sample(RHYME_FAMILIES[familyIndex], 2);
  const others = RHYME_FAMILIES.filter((_, i) => i !== familyIndex);
  const distractors = sample(others, 2).map((family) => pick(family));
  const { choices, names, choiceWords } = pictureChoices([match, ...distractors]);
  return {
    prompt: say.rhymes.prompt({ target: target[1] }),
    speech: say.rhymes.speech({ target: target[1], names }),
    visual: { type: 'picture', emoji: target[0], caption: target[1], say: words().listWords([target[1]]) },
    answer: match[0],
    explain: say.rhymes.explain({ target: target[1], match: match[1] }),
    choices,
    choiceWords,
    choiceStyle: 'picture',
    speakAlways: true,
  };
}

function soundSnack(soundsKey) {
  return () => {
    const { FIRST_SOUND_WORDS, FIRST_SOUNDS_ALL, soundSpeech, say } = words();
    const sound = pick(words()[soundsKey]);
    const answer = pick(FIRST_SOUND_WORDS[sound]);
    const distractors = sample(
      FIRST_SOUNDS_ALL.filter((s) => s !== sound),
      2
    ).map((s) => pick(FIRST_SOUND_WORDS[s]));
    const { choices, names, choiceWords } = pictureChoices([answer, ...distractors]);
    const spoken = soundSpeech(sound);
    return {
      prompt: say.soundSnack.prompt({ sound: spoken }),
      speech: say.soundSnack.speech({ sound: spoken, names }),
      visual: { type: 'snackMonster', sound: spoken, say: spoken },
      answer: answer[0],
      explain: say.soundSnack.explain({ word: answer[1], sound: spoken }),
      choices,
      choiceWords,
      choiceStyle: 'picture',
      speakAlways: true,
    };
  };
}

function letterChoices(answer) {
  const { ALPHABET, FIRST_SOUND_WORDS } = words();
  return shuffle([answer, ...sample(ALPHABET.filter((l) => l !== answer && FIRST_SOUND_WORDS[l]), 3)]);
}

function letterSounds() {
  const { FIRST_SOUND_WORDS, FIRST_SOUNDS_ALL, soundSpeech, say } = words();
  const letter = pick(FIRST_SOUNDS_ALL);
  if (Math.random() < 0.5) {
    const [, example] = pick(FIRST_SOUND_WORDS[letter]);
    return {
      prompt: say.letterSays.prompt(),
      speech: say.letterSays.speech({ sound: soundSpeech(letter), example }),
      visual: { type: 'listen' },
      answer: letter,
      choices: letterChoices(letter),
      choiceStyle: 'letter',
      speakAlways: true,
    };
  }
  const [emoji, word] = pick(FIRST_SOUND_WORDS[letter]);
  return {
    prompt: say.startsWith.prompt(),
    speech: say.startsWith.letterSpeech({ word }),
    visual: { type: 'picture', emoji, caption: null },
    answer: letter,
    choices: letterChoices(letter),
    choiceStyle: 'letter',
    speakAlways: true,
  };
}

function sightWords() {
  const { SIGHT_WORDS, say } = words();
  const [answer, ...others] = sample(SIGHT_WORDS, 4);
  return {
    prompt: say.sightWord.prompt(),
    speech: say.sightWord.speech({ word: answer }),
    visual: { type: 'listen' },
    answer,
    choices: shuffle([answer, ...others]),
    choiceStyle: 'word',
    speakAlways: true,
  };
}

function wordBuilder(wordsKey, tilesKey) {
  return () => {
    const pack = words();
    const entry = pick(pack[wordsKey]);
    const extras = sample(
      pack[tilesKey].filter((tile) => !entry.tiles.includes(tile)),
      2
    );
    return {
      type: 'build',
      prompt: pack.say.build.prompt(),
      speech: pack.say.build.speech({ word: entry.word }),
      visual: { type: 'picture', emoji: entry.emoji, caption: null },
      word: entry.word,
      parts: entry.tiles,
      tiles: shuffle([...entry.tiles, ...extras]).map((text, id) => ({ id, text })),
      answer: entry.word,
      choices: [],
      speakAlways: true,
    };
  };
}

function digraphStarts() {
  const { DIGRAPH_START_WORDS, say } = words();
  const digraph = pick(Object.keys(DIGRAPH_START_WORDS));
  const [emoji, word] = pick(DIGRAPH_START_WORDS[digraph]);
  return {
    prompt: say.startsWith.prompt(),
    speech: say.startsWith.soundSpeech({ word }),
    visual: { type: 'picture', emoji, caption: null },
    answer: digraph,
    choices: shuffle(Object.keys(DIGRAPH_START_WORDS)),
    choiceStyle: 'letter',
    speakAlways: true,
  };
}

function storyStrip() {
  const { STORIES, say } = words();
  const story = pick(STORIES);
  return {
    type: 'order',
    prompt: say.story.prompt(),
    speech: say.story.speech(),
    visual: null,
    items: shuffle(story.map(([emoji, caption], id) => ({ id, emoji, caption }))),
    answer: story.map((_, id) => id),
    choices: [],
  };
}

function wordParts() {
  const { WORD_PARTS, say } = words();
  const [word, meaning, distractors] = pick(WORD_PARTS);
  return {
    prompt: say.wordParts.prompt({ word }),
    speech: say.wordParts.speech({ word }),
    visual: null,
    answer: meaning,
    choices: shuffle([meaning, ...distractors]),
    choiceStyle: 'word',
  };
}

export function compoundSplits(word, splitAt) {
  const correct = `${word.slice(0, splitAt)} + ${word.slice(splitAt)}`;
  const wrong = [splitAt - 2, splitAt - 1, splitAt + 1, splitAt + 2]
    .filter((i) => i >= 1 && i <= word.length - 1)
    .map((i) => `${word.slice(0, i)} + ${word.slice(i)}`);
  return { correct, wrong };
}

function compoundWords() {
  const { COMPOUND_WORDS, say } = words();
  const [word, splitAt] = pick(COMPOUND_WORDS);
  const { correct, wrong } = compoundSplits(word, splitAt);
  return {
    prompt: say.compound.prompt({ word }),
    speech: say.compound.speech({ word }),
    visual: null,
    answer: correct,
    choices: shuffle([correct, ...sample(wrong, 3)]),
    choiceStyle: 'word',
  };
}

export const LITERACY_GENERATORS = {
  rhymes,
  'sound-snack': soundSnack('FIRST_SOUNDS_EARLY'),
  'letter-sounds': letterSounds,
  'sight-words': sightWords,
  'word-builder': wordBuilder('CVC_WORDS', 'ALPHABET'),
  'digraph-starts': digraphStarts,
  'digraph-builder': wordBuilder('DIGRAPH_WORDS', 'DIGRAPH_TILES'),
  'story-strip': storyStrip,
  'word-parts': wordParts,
  'compound-words': compoundWords,
};
