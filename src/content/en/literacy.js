// Word Woods in English: word banks, letter sounds and how each reading
// question is said. Another language brings its own pack (its own sounds,
// words and, if its reading curriculum differs, its own `generators`).
//
// Sound order follows common systematic-phonics programmes: the first group
// (s a t p i n) lets children build real words quickly, and continuous sounds
// (m, s, f) are easier to hear at the start of a word than stop sounds (b, t).

// How the narrator says each sound when no recording is available. Isolated
// phonemes are hard for text-to-speech, so these are spellings that most TTS
// voices read close to the real sound ("mmm", "buh").
export const SOUND_SPEECH = {
  a: 'aah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh',
  i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh',
  q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks',
  y: 'yuh', z: 'zzz',
  sh: 'shh', ch: 'ch', th: 'th', wh: 'wuh', ck: 'kuh', ll: 'lll', ss: 'sss',
  ee: 'ee', oo: 'oo', ai: 'ay', oa: 'oh', ar: 'ar',
};

export function soundSpeech(grapheme) {
  return SOUND_SPEECH[grapheme] || grapheme;
}

// Pictures by first sound. `c` words use the hard /k/ sound.
export const FIRST_SOUND_WORDS = {
  s: [['☀️', 'sun'], ['🧦', 'sock'], ['🐍', 'snake'], ['🦭', 'seal']],
  m: [['🌙', 'moon'], ['🐭', 'mouse'], ['🐵', 'monkey'], ['🥛', 'milk']],
  t: [['🐯', 'tiger'], ['🍅', 'tomato'], ['⛺', 'tent'], ['🐢', 'turtle']],
  p: [['🐷', 'pig'], ['🍕', 'pizza'], ['🐼', 'panda'], ['🐧', 'penguin']],
  b: [['🐝', 'bee'], ['🍌', 'banana'], ['🐻', 'bear'], ['🚌', 'bus']],
  d: [['🐶', 'dog'], ['🦆', 'duck'], ['🥁', 'drum'], ['🍩', 'donut']],
  f: [['🐟', 'fish'], ['🦊', 'fox'], ['🐸', 'frog'], ['🔥', 'fire']],
  c: [['🐱', 'cat'], ['🚗', 'car'], ['🎂', 'cake'], ['🐮', 'cow']],
  n: [['👃', 'nose'], ['🥜', 'nut'], ['📰', 'newspaper'], ['9️⃣', 'nine']],
  r: [['🐰', 'rabbit'], ['🚀', 'rocket'], ['🌈', 'rainbow'], ['💍', 'ring']],
  l: [['🦁', 'lion'], ['🍋', 'lemon'], ['🍃', 'leaf'], ['🍭', 'lollipop']],
  h: [['🎩', 'hat'], ['🐴', 'horse'], ['🏠', 'house'], ['❤️', 'heart']],
  g: [['🐐', 'goat'], ['🍇', 'grapes'], ['🎁', 'gift'], ['🎸', 'guitar']],
};

export const FIRST_SOUNDS_EARLY = ['s', 'm', 't', 'p', 'f', 'n'];
export const FIRST_SOUNDS_ALL = Object.keys(FIRST_SOUND_WORDS);

// Rhyme families: every word in a family rhymes with the others.
// (Emoji are kept to Unicode 13 or older so they render on older devices.)
export const RHYME_FAMILIES = [
  [['🐱', 'cat'], ['🎩', 'hat'], ['🦇', 'bat'], ['🐀', 'rat']],
  [['🐶', 'dog'], ['🐸', 'frog'], ['🪵', 'log']],
  [['🐝', 'bee'], ['🌳', 'tree'], ['🔑', 'key']],
  [['🎂', 'cake'], ['🐍', 'snake'], ['🥩', 'steak']],
  [['🚗', 'car'], ['⭐', 'star']],
  [['🐐', 'goat'], ['⛵', 'boat'], ['🧥', 'coat']],
  [['🧦', 'sock'], ['🕰️', 'clock'], ['🪨', 'rock']],
  [['🦊', 'fox'], ['📦', 'box']],
  [['🐭', 'mouse'], ['🏠', 'house']],
  [['🐻', 'bear'], ['🍐', 'pear'], ['🪑', 'chair']],
  [['💍', 'ring'], ['🤴', 'king']],
];

// Dolch pre-primer / primer sight words.
export const SIGHT_WORDS = [
  'the', 'and', 'a', 'to', 'said', 'in', 'he', 'I', 'of', 'it', 'was', 'you',
  'is', 'my', 'for', 'on', 'can', 'see', 'we', 'go', 'look', 'like', 'big', 'up',
  'she', 'they', 'are', 'all', 'come', 'here',
];

// Word Builder: picture + the graphemes (tiles) that spell it.
export const CVC_WORDS = [
  ['🐱', 'cat'], ['🐶', 'dog'], ['☀️', 'sun'], ['🐷', 'pig'], ['🎩', 'hat'],
  ['🚌', 'bus'], ['🦊', 'fox'], ['🛏️', 'bed'], ['🐛', 'bug'], ['📦', 'box'],
  ['🕸️', 'web'], ['🚐', 'van'], ['🗺️', 'map'], ['🖊️', 'pen'], ['🦇', 'bat'],
  ['🐀', 'rat'], ['🪵', 'log'], ['☕', 'cup'],
].map(([emoji, word]) => ({ emoji, word, tiles: word.split('') }));

export const DIGRAPH_WORDS = [
  ['🚢', 'ship', ['sh', 'i', 'p']],
  ['🐟', 'fish', ['f', 'i', 'sh']],
  ['🍽️', 'dish', ['d', 'i', 'sh']],
  ['🐤', 'chick', ['ch', 'i', 'ck']],
  ['🛁', 'bath', ['b', 'a', 'th']],
  ['🦆', 'duck', ['d', 'u', 'ck']],
  ['🧦', 'sock', ['s', 'o', 'ck']],
  ['🐚', 'shell', ['sh', 'e', 'll']],
  ['🔔', 'bell', ['b', 'e', 'll']],
  ['🌳', 'tree', ['t', 'r', 'ee']],
  ['🐑', 'sheep', ['sh', 'ee', 'p']],
  ['🌙', 'moon', ['m', 'oo', 'n']],
  ['📖', 'book', ['b', 'oo', 'k']],
  ['🌧️', 'rain', ['r', 'ai', 'n']],
  ['⛵', 'boat', ['b', 'oa', 't']],
  ['⭐', 'star', ['s', 't', 'ar']],
].map(([emoji, word, tiles]) => ({ emoji, word, tiles }));

export const DIGRAPH_TILES = ['sh', 'ch', 'th', 'ck', 'll', 'ee', 'oo', 'ai', 'oa', 'ar'];

// Which digraph does the picture start with?
export const DIGRAPH_START_WORDS = {
  sh: [['🚢', 'ship'], ['🐚', 'shell'], ['🐑', 'sheep'], ['👟', 'shoe'], ['🦈', 'shark']],
  ch: [['🐤', 'chick'], ['🧀', 'cheese'], ['🪑', 'chair'], ['🍒', 'cherry'], ['🍫', 'chocolate']],
  th: [['3️⃣', 'three'], ['👍', 'thumb'], ['🧵', 'thread'], ['🤔', 'think']],
  wh: [['🐳', 'whale'], ['🌾', 'wheat'], ['❓', 'what']],
};

// Story Strip: events in order (emoji + caption).
export const STORIES = [
  [['🥚', 'An egg sits in a nest.'], ['🐣', 'The egg cracks open.'], ['🐥', 'A chick says peep!'], ['🐔', 'The chick grows into a hen.']],
  [['🌰', 'Plant a seed in the soil.'], ['🌱', 'A tiny sprout pops up.'], ['🌿', 'Leaves grow bigger.'], ['🌻', 'A flower blooms.']],
  [['🛁', 'Take a bath.'], ['🪥', 'Brush your teeth.'], ['📖', 'Read a story.'], ['😴', 'Go to sleep.']],
  [['🍞', 'Get two slices of bread.'], ['🧈', 'Spread the butter.'], ['🥪', 'Make a sandwich.'], ['😋', 'Eat it up!']],
  [['☁️', 'Dark clouds fill the sky.'], ['🌧️', 'Rain falls down.'], ['☀️', 'The sun comes out.'], ['🌈', 'A rainbow appears!']],
  [['🥚', 'A tiny egg sits on a leaf.'], ['🐛', 'A caterpillar hatches.'], ['🍃', 'It munches lots of leaves.'], ['🦋', 'It turns into a butterfly.']],
  [['❄️', 'Snow falls all night.'], ['⛄', 'We build a snowman.'], ['☀️', 'The sun shines warm.'], ['💧', 'The snowman melts.']],
  [['🥣', 'Mix the flour and eggs.'], ['🔥', 'Bake it in the oven.'], ['🎂', 'Put candles on the cake.'], ['🎉', 'Have a party!']],
];

// Word parts: prefixes and suffixes change meaning.
export const WORD_PARTS = [
  ['unhappy', 'not happy', ['very happy', 'happy again', 'full of happy']],
  ['reread', 'read again', ['not read', 'read before', 'a person who reads']],
  ['careless', 'without care', ['full of care', 'care again', 'more care']],
  ['helpful', 'full of help', ['without help', 'help again', 'not help']],
  ['preheat', 'heat before', ['heat again', 'not heat', 'without heat']],
  ['teacher', 'a person who teaches', ['teach again', 'not teach', 'teach before']],
  ['rebuild', 'build again', ['not build', 'build before', 'without building']],
  ['fearless', 'without fear', ['full of fear', 'fear again', 'a person who fears']],
  ['joyful', 'full of joy', ['without joy', 'not joy', 'joy again']],
  ['untie', 'the opposite of tie', ['tie again', 'tie before', 'tie tighter']],
  ['replay', 'play again', ['not play', 'a person who plays', 'play before']],
  ['player', 'a person who plays', ['play again', 'not play', 'without play']],
  ['painless', 'without pain', ['full of pain', 'more pain', 'pain again']],
  ['preview', 'see before', ['see again', 'not see', 'a person who sees']],
  ['dislike', 'not like', ['like again', 'like a lot', 'like before']],
  ['unlock', 'the opposite of lock', ['lock again', 'lock before', 'lock tight']],
];

// Compound words and where they split.
export const COMPOUND_WORDS = [
  ['rainbow', 4], ['sunflower', 3], ['football', 4], ['cupcake', 3],
  ['toothbrush', 5], ['starfish', 4], ['popcorn', 3], ['snowman', 4],
  ['butterfly', 6], ['backpack', 4], ['bedroom', 3], ['goldfish', 4],
  ['pancake', 3], ['firefly', 4], ['seashell', 3], ['doghouse', 3],
];

const ALPHABET_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const ALPHABET = ALPHABET_LETTERS;

// "cat, dog, or fish": how a spoken list of options ends.
export function listWords(words) {
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`;
}

// Memory Chips' Letter Chips: letter value (a = 1) -> the letter and
// pictures that start with its sound.
export const MEMORY_LETTERS = {
  1: ['a', [['🍎', 'apple'], ['🐜', 'ant']]],
  2: ['b', [['🐻', 'bear'], ['🍌', 'banana'], ['🐝', 'bee']]],
  3: ['c', [['🐱', 'cat'], ['🚗', 'car'], ['🐮', 'cow']]],
  4: ['d', [['🐶', 'dog'], ['🦆', 'duck'], ['🥁', 'drum']]],
  5: ['e', [['🥚', 'egg'], ['🐘', 'elephant']]],
  6: ['f', [['🐟', 'fish'], ['🦊', 'fox'], ['🐸', 'frog']]],
};

export const say = {
  rhymes: {
    prompt: ({ target }) => `What rhymes with ${target}?`,
    speech: ({ target, names }) => `What rhymes with ${target}? ${names}?`,
    explain: ({ target, match }) => `${target} and ${match} rhyme: they end with the same sound.`,
  },
  soundSnack: {
    prompt: ({ sound }) => `Feed me ${sound}!`,
    speech: ({ sound, example, names }) => `Feed the monster something that starts with ${sound}, like ${example}. ${names}?`,
    explain: ({ word, sound }) => `${word} starts with ${sound}!`,
  },
  letterSays: {
    prompt: () => 'Which letter says…',
    speech: ({ sound, example }) => `Which letter says ${sound}, like in ${example}?`,
  },
  startsWith: {
    prompt: () => 'It starts with…',
    letterSpeech: ({ word }) => `What letter does ${word} start with?`,
    soundSpeech: ({ word }) => `What sound does ${word} start with?`,
  },
  sightWord: {
    prompt: () => 'Find the word',
    speech: ({ word }) => `Find the word: ${word}.`,
  },
  build: {
    prompt: () => 'Build the word',
    speech: ({ word }) => `Build the word: ${word}.`,
  },
  story: {
    prompt: () => 'Put the story in order',
    speech: () => 'Put the story in order. Tap what happens first.',
  },
  wordParts: {
    prompt: ({ word }) => `What does "${word}" mean?`,
    speech: ({ word }) => `What does ${word} mean?`,
  },
  compound: {
    prompt: ({ word }) => `Which two words make "${word}"?`,
    speech: ({ word }) => `Which two words make ${word}?`,
  },
};
