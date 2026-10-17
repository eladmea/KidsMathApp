// Each player's colours and icon in two-player games.
// `name: null` means the scene fills in a default (i18n players.json:
// player1 / player2 / buddy).
export const playerColors = {
  1: { main: '#4A6FE3', light: '#DCE6FF', dark: '#3552B5', name: null, icon: '🦁' },
  2: { main: '#FF6FA8', light: '#FFE1ED', dark: '#D64E85', name: null, icon: '🐸' },
};

export const BUDDY = { id: 'buddy', icon: '🤖' };
const SECOND_PLAYER_ICONS = ['🐸', '🐼', '🦊'];

// Player 1 is always the signed-in child. Player 2 is the AI buddy in solo
// mode, or a friend sharing the device in duo mode.
export function buildPlayers(profile, mode) {
  const childIcon = profile?.avatar || playerColors[1].icon;
  const friendIcon = SECOND_PLAYER_ICONS.find((icon) => icon !== childIcon);
  return {
    1: { ...playerColors[1], id: 'player1', name: profile?.name || null, icon: childIcon },
    2: mode === 'solo' ? { ...playerColors[2], ...BUDDY, name: null } : { ...playerColors[2], id: 'player2', name: null, icon: friendIcon },
  };
}
