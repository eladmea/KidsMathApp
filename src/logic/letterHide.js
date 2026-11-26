// Letter Hide and Seek (Word Woods, ages 3-4): a letter hides in a room, in
// something whose name starts with it. The letter shows at the top and the
// narrator names it ("Where is the letter hiding? Samekh."); the child finds
// it by moving the things around (tap one, or drag it away). A book hides it
// behind, a hat under, a bucket in. Wrong things are empty, and say their
// name, so the child hears that "ball" doesn't start with the letter.
//
// Each place (a backdrop and its things) is drawn once for every language.
// The words are in the literacy pack (`HIDE_WORDS`, by thing id), so a
// language picks, from a place's things, four whose first letters differ and
// don't sound alike (`SOUND_ALIKE`): the letter is always in exactly one of
// them, whichever one the child tries.

// How each thing hides the letter:
//   behind: it slides aside;
//   under:  it lifts up;
//   in:     the letter jumps out of it.
export const HIDES = ['behind', 'under', 'in'];

// `key` is the picture (src/assets/images/<key>.webp), `emoji` the fallback.
export const PLACES = {
  room: {
    color: 0xf3e3c8,
    things: [
      { id: 'book', key: 'letterHide/book', emoji: '📖', hide: 'behind' },
      { id: 'hat', key: 'letterHide/hat', emoji: '🎩', hide: 'under' },
      { id: 'clock', key: 'letterHide/clock', emoji: '⏰', hide: 'behind' },
      { id: 'guitar', key: 'letterHide/guitar', emoji: '🎸', hide: 'behind' },
      { id: 'robot', key: 'letterHide/robot', emoji: '🤖', hide: 'behind' },
      { id: 'ball', key: 'letterHide/ball', emoji: '⚽', hide: 'behind' },
    ],
  },
  kitchen: {
    color: 0xfdf0d5,
    things: [
      { id: 'banana', key: 'kitchen/food/banana', emoji: '🍌', hide: 'behind' },
      { id: 'apple', key: 'letterHide/apple', emoji: '🍎', hide: 'behind' },
      { id: 'lemon', key: 'letterHide/lemon', emoji: '🍋', hide: 'behind' },
      { id: 'pizza', key: 'pizza/baked', emoji: '🍕', hide: 'under' },
      { id: 'carrot', key: 'kitchen/food/carrot', emoji: '🥕', hide: 'behind' },
      { id: 'cake', key: 'letterHide/cake', emoji: '🎂', hide: 'under' },
    ],
  },
  forest: {
    color: 0xdff2d8,
    things: [
      { id: 'bear', key: 'pizza/animals/bear', emoji: '🐻', hide: 'behind' },
      { id: 'fox', key: 'pizza/animals/fox', emoji: '🦊', hide: 'behind' },
      { id: 'lion', key: 'pizza/animals/lion', emoji: '🦁', hide: 'behind' },
      { id: 'monkey', key: 'pizza/animals/monkey', emoji: '🐵', hide: 'behind' },
      { id: 'frog', key: 'pizza/animals/frog', emoji: '🐸', hide: 'behind' },
      { id: 'panda', key: 'pizza/animals/panda', emoji: '🐼', hide: 'behind' },
      { id: 'rabbit', key: 'pizza/animals/bunny', emoji: '🐰', hide: 'behind' },
      { id: 'pig', key: 'pizza/animals/pig', emoji: '🐷', hide: 'behind' },
    ],
  },
  park: {
    color: 0xe0f3e6,
    things: [
      { id: 'car', key: 'letterHide/car', emoji: '🚗', hide: 'behind' },
      { id: 'flower', key: 'letterHide/flower', emoji: '🌸', hide: 'behind' },
      { id: 'bucket', key: 'letterHide/bucket', emoji: '🪣', hide: 'in' },
      { id: 'balloon', key: 'letterHide/balloon', emoji: '🎈', hide: 'under' },
      { id: 'train', key: 'letterHide/train', emoji: '🚂', hide: 'behind' },
    ],
  },
};
export const PLACE_IDS = Object.keys(PLACES);

// Things on screen at once, and letters to find in a round (each thing hides
// the letter once).
export const THINGS_SHOWN = 4;

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The letter a word starts with (its first character: "ספר" -> "ס", "book" -> "b").
export const firstLetter = (word) => [...String(word).trim().toLowerCase()][0];

// Two letters a child can't tell apart by ear: the same letter, or letters
// in one of the pack's SOUND_ALIKE groups ("סש": ס and שׂ).
export function soundsAlike(a, b, pack) {
  return a === b || (pack.SOUND_ALIKE || []).some((group) => group.includes(a) && group.includes(b));
}

// The place's things that have a word in this language, with their word and letter.
export function placeThings(placeId, pack) {
  const words = pack.HIDE_WORDS || {};
  return (PLACES[placeId] || PLACES.room).things.filter((thing) => words[thing.id]).map((thing) => ({ ...thing, word: words[thing.id], letter: firstLetter(words[thing.id]) }));
}

// Up to `count` things whose letters differ and don't sound alike, so the
// letter's hiding place has one answer.
export function pickThings(placeId, pack, rng = Math.random, count = THINGS_SHOWN) {
  const picked = [];
  shuffle(placeThings(placeId, pack), rng).forEach((thing) => {
    if (picked.length < count && !picked.some((other) => soundsAlike(other.letter, thing.letter, pack))) picked.push(thing);
  });
  return picked;
}

// A round in a place: the things shown (left to right) and the order their
// letters are hidden in.
export function makeRound(placeId, pack, rng = Math.random) {
  const things = pickThings(placeId, pack, rng);
  return { place: placeId, things, finds: shuffle(things.map((thing) => thing.id), rng) };
}

// The next place to play: the one after `last`, so each round is somewhere new.
export function nextPlace(last) {
  const index = PLACE_IDS.indexOf(last);
  return PLACE_IDS[(index + 1) % PLACE_IDS.length];
}

// Where the things stand (in the 1280 x 720 safe area), left to right, a
// little up and down like things on a floor.
export function spots(count) {
  const left = 230;
  const right = 1050;
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(count === 1 ? 640 : left + (i * (right - left)) / (count - 1)),
    y: i % 2 ? 560 : 480,
  }));
}

// Whether a thing dragged from home to (x, y) has moved far enough to show
// what was behind it.
export const movedAway = (home, x, y, reach = 90) => Math.hypot(x - home.x, y - home.y) >= reach;

// ---- What the game says ----

// How a letter is said: its sound in English ("sss"), its name in Hebrew ("סָמֶךְ").
export const letterSpeech = (pack, letter) => (pack.soundSpeech ? pack.soundSpeech(letter) : letter);

// When the letter is found: the thing, then the letter ("Soap. Samekh."),
// each a sentence of its own so recordings of the word and the letter are reused.
export const foundLine = (pack, thing) => `${thing.word}. ${letterSpeech(pack, thing.letter)}.`;

// Every line from the pack the game can say, for the list of lines to record
// (services/voiceLines.js): each thing's word, its found line, and its letter.
export function allLines(pack) {
  const things = PLACE_IDS.flatMap((placeId) => placeThings(placeId, pack));
  return [...new Set(things.flatMap((thing) => [thing.word, foundLine(pack, thing), letterSpeech(pack, thing.letter)]))];
}
