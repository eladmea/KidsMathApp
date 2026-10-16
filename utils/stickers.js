// Sticker book: cosmetic rewards that arrive *after* the thinking (plan rule:
// no shops, no pressure). A sticker is earned the first time a skill is
// passed, a gold one when it is mastered, and a flower one when a Garden Days
// plant blooms. Each event earns its sticker once.
//
// A profile keeps `stickers: [{ key, emoji, kind, day }]`, in earning order.

// Earned in this order, so the book fills up predictably page by page.
export const STICKER_POOL = [
  '🦄', '🐳', '🦖', '🚀', '🌈', '🍩', '🐝', '🦋', '🎸', '🍉', '🐢', '🪐',
  '🦕', '🍓', '🐬', '🎨', '🦉', '🌵', '🐙', '🏰', '🦜', '🍕', '🐞', '⛵',
  '🦒', '🧁', '🐠', '🎪', '🦔', '🍒', '🐘', '🛸', '🦩', '🍭', '🐿️', '🎡',
];
export const GOLD_STICKERS = ['🏅', '🏆', '👑', '💎', '🥇', '⭐', '🌟', '🎖️'];
export const FLOWER_STICKERS = ['🌻', '🌷', '🌹', '🌸', '🌼', '💐', '🪷', '🌺'];
export const PAGE_SIZE = 12;

function stickerKey(event) {
  return `${event.kind}:${event.ref}`;
}

function nextEmoji(stickers, kind) {
  const count = stickers.filter((s) => s.kind === kind).length;
  if (kind === 'mastered') return GOLD_STICKERS[count % GOLD_STICKERS.length];
  if (kind === 'bloomed') return FLOWER_STICKERS[count % FLOWER_STICKERS.length];
  return STICKER_POOL[count % STICKER_POOL.length];
}

// events: [{ kind: 'passed' | 'mastered' | 'bloomed', ref }]
// Returns the profile's new sticker list and just the new stickers.
export function awardStickers(stickers = [], events, day) {
  const owned = new Set(stickers.map((s) => s.key));
  const next = [...stickers];
  const earned = [];
  events.forEach((event) => {
    const key = stickerKey(event);
    if (owned.has(key)) return;
    owned.add(key);
    const sticker = { key, emoji: nextEmoji(next, event.kind), kind: event.kind, day };
    next.push(sticker);
    earned.push(sticker);
  });
  return { stickers: next, earned };
}

// Stickers events for a finished round, from applySession's result.
export function roundStickerEvents({ newlyPassed = [], newlyMastered = [] }) {
  return [
    ...newlyPassed.map((ref) => ({ kind: 'passed', ref })),
    ...newlyMastered.map((ref) => ({ kind: 'mastered', ref })),
  ];
}

// Pages of PAGE_SIZE slots. The last page has empty slots (null) to fill.
export function stickerPages(stickers = []) {
  const pageCount = Math.max(1, Math.ceil((stickers.length + 1) / PAGE_SIZE));
  return Array.from({ length: pageCount }, (_, page) =>
    Array.from({ length: PAGE_SIZE }, (_, slot) => stickers[page * PAGE_SIZE + slot] || null)
  );
}

export function stickersEarnedOn(stickers = [], day) {
  return stickers.filter((s) => s.day === day);
}
