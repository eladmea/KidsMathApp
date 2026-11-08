// Letter Catcher: a kid in a hat at the bottom of the screen throws a ball
// straight up at letters floating in bubbles, and must catch the letters of a
// word in order (CAT: c, then a, then t). Any other letter just bounces the
// ball off. Ages 3-4 catch one letter (its first-sound picture shows), 5-6
// short words, 7-8 words with letter pairs (sh-i-p) caught as one bubble.

export const LEVELS = {
  letter: { words: 6 },
  word: { words: 5 },
  pairs: { words: 5 },
};

export function getLevel(levelId) {
  return LEVELS[levelId] || LEVELS.letter;
}

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The round's targets from the literacy pack: [{ emoji, word, tiles }].
// For one letter, `tiles` is that letter and the picture starts with it.
export function makeTargets(levelId, pack, rng = Math.random) {
  const count = getLevel(levelId).words;
  if (levelId === 'letter') {
    return shuffle(pack.FIRST_SOUNDS_EARLY, rng).slice(0, count).map((letter) => {
      const [emoji, word] = shuffle(pack.FIRST_SOUND_WORDS[letter], rng)[0];
      return { emoji, word, tiles: [letter] };
    });
  }
  const list = levelId === 'pairs' ? pack.DIGRAPH_WORDS : pack.CVC_WORDS;
  return shuffle(list, rng).slice(0, count).map(({ emoji, word, tiles }) => ({ emoji, word, tiles: [...tiles] }));
}

// Everything that can float in a bubble: the alphabet, plus the letter pairs
// for the pairs level.
export function bubblePool(levelId, pack) {
  return levelId === 'pairs' ? [...new Set([...pack.ALPHABET, ...pack.DIGRAPH_TILES])] : [...pack.ALPHABET];
}

// What a new bubble should hold: the letter needed next if no bubble shows
// it, otherwise another letter not already floating.
export function nextBubble(needed, floating, pool, rng = Math.random) {
  if (!floating.includes(needed)) return needed;
  const choices = pool.filter((tile) => tile !== needed && !floating.includes(tile));
  return choices.length ? choices[Math.floor(rng() * choices.length)] : needed;
}

// Catching `tile` when `caught` tiles of the word are already caught.
export function catchTile(tiles, caught, tile) {
  const right = tiles[caught] === tile;
  return { right, caught: right ? caught + 1 : caught, done: right && caught + 1 === tiles.length };
}

// Does a ball at (x, y) touch a bubble?
export const touches = (ball, bubble, reach) => Math.hypot(ball.x - bubble.x, ball.y - bubble.y) < reach;
