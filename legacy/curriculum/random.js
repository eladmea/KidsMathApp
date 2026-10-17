export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// `count` distinct items from `array` (fewer if the array is shorter).
export function sample(array, count) {
  return shuffle(array).slice(0, count);
}
