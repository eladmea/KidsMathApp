import { playerColors } from './theme';

export const BUDDY = { name: 'Buddy', icon: '🤖' };
const SECOND_PLAYER_ICONS = ['🐸', '🐼', '🦊'];

// Player 1 is always the signed-in child. Player 2 is the AI buddy in solo
// mode, or a friend sharing the device in duo mode.
export function buildPlayers(profile, mode) {
  const childIcon = profile?.avatar || playerColors[1].icon;
  const friendIcon = SECOND_PLAYER_ICONS.find((icon) => icon !== childIcon);
  return {
    1: { ...playerColors[1], name: profile?.name || playerColors[1].name, icon: childIcon },
    2:
      mode === 'solo'
        ? { ...playerColors[2], ...BUDDY }
        : { ...playerColors[2], name: playerColors[2].name, icon: friendIcon },
  };
}
