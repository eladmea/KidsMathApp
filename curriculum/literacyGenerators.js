// Literacy question generators. Same question shape as generators.js, plus:
// - choiceStyle: 'picture' | 'letter' | 'word' (how answer buttons look)
// - speakAlways: listening tasks are read aloud even when narration is off
// - type 'build': spell a word from letter tiles   { word, tiles, answer }
// - type 'order': put story panels in order        { items, answer: ids }
import { pick, sample, shuffle } from './random';
import {
  COMPOUND_WORDS,
  CVC_WORDS,
  DIGRAPH_START_WORDS,
  DIGRAPH_TILES,
  DIGRAPH_WORDS,
  FIRST_SOUND_WORDS,
  FIRST_SOUNDS_ALL,
  FIRST_SOUNDS_EARLY,
  RHYME_FAMILIES,
  SIGHT_WORDS,
  STORIES,
  WORD_PARTS,
  soundSpeech,
} from './phonics';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function listWords(words) {
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`;
}

// Picture choices + the sentence that names them, in on-screen order.
function pictureChoices(entries) {
  const order = shuffle(entries);
  return { choices: order.map(([emoji]) => emoji), names: listWords(order.map(([, word]) => word)) };
}

function rhymes() {
  const familyIndex = Math.floor(Math.random() * RHYME_FAMILIES.length);
  const [target, match] = sample(RHYME_FAMILIES[familyIndex], 2);
  const others = RHYME_FAMILIES.filter((_, i) => i !== familyIndex);
  const distractors = sample(others, 2).map((family) => pick(family));
  const { choices, names } = pictureChoices([match, ...distractors]);
  return {
    prompt: `What rhymes with ${target[1]}?`,
    speech: `What rhymes with ${target[1]}? ${names}?`,
    visual: { type: 'picture', emoji: target[0], caption: target[1] },
    answer: match[0],
    explain: `${target[1]} and ${match[1]} rhyme: they end with the same sound.`,
    choices,
    choiceStyle: 'picture',
    speakAlways: true,
  };
}

function soundSnack(sounds) {
  return () => {
    const sound = pick(sounds);
    const [answer, example] = sample(FIRST_SOUND_WORDS[sound], 2);
    const distractors = sample(
      FIRST_SOUNDS_ALL.filter((s) => s !== sound),
      2
    ).map((s) => pick(FIRST_SOUND_WORDS[s]));
    const { choices, names } = pictureChoices([answer, ...distractors]);
    const spoken = soundSpeech(sound);
    return {
      prompt: `Feed me ${spoken}!`,
      speech: `Feed the monster something that starts with ${spoken}, like ${example[1]}. ${names}?`,
      visual: { type: 'snackMonster', sound: spoken },
      answer: answer[0],
      explain: `${answer[1]} starts with ${spoken}!`,
      choices,
      choiceStyle: 'picture',
      speakAlways: true,
    };
  };
}

function letterChoices(answer) {
  return shuffle([answer, ...sample(ALPHABET.filter((l) => l !== answer && FIRST_SOUND_WORDS[l]), 3)]);
}

function letterSounds() {
  const letter = pick(FIRST_SOUNDS_ALL);
  if (Math.random() < 0.5) {
    const [, example] = pick(FIRST_SOUND_WORDS[letter]);
    return {
      prompt: 'Which letter says…',
      speech: `Which letter says ${soundSpeech(letter)}, like in ${example}?`,
      visual: { type: 'listen' },
      answer: letter,
      choices: letterChoices(letter),
      choiceStyle: 'letter',
      speakAlways: true,
    };
  }
  const [emoji, word] = pick(FIRST_SOUND_WORDS[letter]);
  return {
    prompt: 'It starts with…',
    speech: `What letter does ${word} start with?`,
    visual: { type: 'picture', emoji, caption: null },
    answer: letter,
    choices: letterChoices(letter),
    choiceStyle: 'letter',
    speakAlways: true,
  };
}

function sightWords() {
  const [answer, ...others] = sample(SIGHT_WORDS, 4);
  return {
    prompt: 'Find the word',
    speech: `Find the word: ${answer}.`,
    visual: { type: 'listen' },
    answer,
    choices: shuffle([answer, ...others]),
    choiceStyle: 'word',
    speakAlways: true,
  };
}

function wordBuilder(words, distractorPool) {
  return () => {
    const entry = pick(words);
    const extras = sample(
      distractorPool.filter((tile) => !entry.tiles.includes(tile)),
      2
    );
    return {
      type: 'build',
      prompt: 'Build the word',
      speech: `Build the word: ${entry.word}.`,
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
  const digraph = pick(Object.keys(DIGRAPH_START_WORDS));
  const [emoji, word] = pick(DIGRAPH_START_WORDS[digraph]);
  return {
    prompt: 'It starts with…',
    speech: `What sound does ${word} start with?`,
    visual: { type: 'picture', emoji, caption: null },
    answer: digraph,
    choices: shuffle(Object.keys(DIGRAPH_START_WORDS)),
    choiceStyle: 'letter',
    speakAlways: true,
  };
}

function storyStrip() {
  const story = pick(STORIES);
  return {
    type: 'order',
    prompt: 'Put the story in order',
    speech: 'Put the story in order. Tap what happens first.',
    visual: null,
    items: shuffle(story.map(([emoji, caption], id) => ({ id, emoji, caption }))),
    answer: story.map((_, id) => id),
    choices: [],
  };
}

function wordParts() {
  const [word, meaning, distractors] = pick(WORD_PARTS);
  return {
    prompt: `What does "${word}" mean?`,
    speech: `What does ${word} mean?`,
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
  const [word, splitAt] = pick(COMPOUND_WORDS);
  const { correct, wrong } = compoundSplits(word, splitAt);
  return {
    prompt: `Which two words make "${word}"?`,
    speech: `Which two words make ${word}?`,
    visual: null,
    answer: correct,
    choices: shuffle([correct, ...sample(wrong, 3)]),
    choiceStyle: 'word',
  };
}

export const LITERACY_GENERATORS = {
  rhymes,
  'sound-snack': soundSnack(FIRST_SOUNDS_EARLY),
  'letter-sounds': letterSounds,
  'sight-words': sightWords,
  'word-builder': wordBuilder(CVC_WORDS, ALPHABET),
  'digraph-starts': digraphStarts,
  'digraph-builder': wordBuilder(DIGRAPH_WORDS, DIGRAPH_TILES),
  'story-strip': storyStrip,
  'word-parts': wordParts,
  'compound-words': compoundWords,
};
