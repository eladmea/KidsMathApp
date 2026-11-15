// Where "back" goes: a stack of the scenes a child came through, each with
// the data it was started with. Scenes use BaseScene's go() / back() /
// reset(), which keep this up to date.
const stack = [];

export function push(entry) {
  stack.push(entry);
}

export function pop() {
  return stack.pop() || null;
}

// The scene back() would return to, without leaving it yet.
export function peek() {
  return stack[stack.length - 1] || null;
}

export function clear() {
  stack.length = 0;
}

export function depth() {
  return stack.length;
}
