// Learning games (free to play) and mini-games (Fun Break, earned by
// finishing learning rounds). `bands` marks the age bands an option is "just
// right" for; every option stays playable by anyone.

export const LEARNING_GAMES = [
  {
    id: 'memory-chips',
    title: 'Memory Chips',
    emoji: '🪙',
    description: 'Find pairs. Pay chips to fix a mismatch, if you can work out the gap!',
    route: 'Memory',
    options: [
      { id: 'dots', label: 'Dot Chips', emoji: '🎲', note: 'Dots ↔ numbers', bands: ['sprouts', 'explorers'] },
      { id: 'letters', label: 'Letter Chips', emoji: '🔤', note: 'b ↔ 🐻 bear', bands: ['explorers'] },
      { id: 'classic', label: 'Classic Chips', emoji: '🔢', note: 'Numbers 1-12', bands: ['explorers', 'builders'] },
      { id: 'plusMinus', label: 'Plus & Minus Chips', emoji: '➕', note: '3 + 4 ↔ 7', bands: ['builders'] },
      { id: 'timesDivide', label: 'Times & Divide Chips', emoji: '✖️', note: '3 × 4 ↔ 12', bands: ['masters'] },
      { id: 'fractions', label: 'Fraction Chips', emoji: '🍕', note: '1/2 ↔ 4/8', bands: ['masters'] },
    ],
  },
  {
    id: 'garden-days',
    title: 'Garden Days',
    emoji: '🌻',
    description: 'Grow a plant over real days by giving it what it needs.',
    route: 'Garden',
    // Opens straight away: no variants or players to pick.
    direct: true,
    options: [],
  },
  {
    id: 'path-race',
    title: 'Number Path Race',
    emoji: '🏁',
    description: 'Spin, then hop along the number path saying each number.',
    route: 'PathRace',
    options: [
      { id: '10', label: '1 to 10', emoji: '🐣', note: 'Spin 1 or 2', bands: ['sprouts', 'explorers'] },
      { id: '20', label: '1 to 20', emoji: '🐥', note: 'Spin 1, 2 or 3', bands: ['explorers', 'builders', 'masters'] },
    ],
  },
];

export const MINI_GAMES = [
  { id: 'bubble-pop', title: 'Bubble Pop', emoji: '🫧', description: 'Pop the bubbles! Gold ones hide a fun fact.', route: 'BubblePop' },
  { id: 'chip-toss', title: 'Chip Toss', emoji: '🥤', description: 'Time your toss to land chips in the cup.', route: 'ChipToss' },
  { id: 'dance-tap', title: 'Dance Tap', emoji: '🕺', description: 'Tap the glowing pad to the beat.', route: 'DanceTap' },
];

export function getLearningGame(gameId) {
  return LEARNING_GAMES.find((game) => game.id === gameId);
}

export function recommendedOption(game, bandId) {
  return game.options.find((option) => option.bands.includes(bandId)) || game.options[0];
}
