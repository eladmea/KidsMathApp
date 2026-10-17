// Learning games (free to play) and mini-games (Fun Break, earned by
// finishing learning rounds; `free` ones, like the calm-down, need no ticket). `bands` marks the age bands an option is "just
// right" for; every option stays playable by anyone.

export const LEARNING_GAMES = [
  {
    id: 'memory-chips',
    emoji: '🪙',
    route: 'Memory',
    options: [
      { id: 'dots', emoji: '🎲', bands: ['sprouts', 'explorers'] },
      { id: 'letters', emoji: '🔤', bands: ['explorers'] },
      { id: 'classic', emoji: '🔢', bands: ['explorers', 'builders'] },
      { id: 'plusMinus', emoji: '➕', bands: ['builders'] },
      { id: 'timesDivide', emoji: '✖️', bands: ['masters'] },
      { id: 'fractions', emoji: '🍕', bands: ['masters'] },
    ],
  },
  {
    id: 'garden-days',
    emoji: '🌻',
    route: 'Garden',
    // Opens straight away: no variants or players to pick.
    direct: true,
    options: [],
  },
  {
    id: 'path-race',
    emoji: '🏁',
    route: 'PathRace',
    options: [
      { id: '10', emoji: '🐣', bands: ['sprouts', 'explorers'] },
      { id: '20', emoji: '🐥', bands: ['explorers', 'builders', 'masters'] },
    ],
  },
];

export const MINI_GAMES = [
  { id: 'bubble-pop', emoji: '🫧', route: 'BubblePop' },
  { id: 'chip-toss', emoji: '🥤', route: 'ChipToss' },
  { id: 'dance-tap', emoji: '🕺', route: 'DanceTap' },
  { id: 'balloon-breath', emoji: '🎈', route: 'BalloonBreath', free: true },
];

export function getLearningGame(gameId) {
  return LEARNING_GAMES.find((game) => game.id === gameId);
}

export function recommendedOption(game, bandId) {
  return game.options.find((option) => option.bands.includes(bandId)) || game.options[0];
}
