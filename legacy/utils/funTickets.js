// Fun Break tickets: mini-games are earned by finishing learning rounds, so
// they break up the learning without replacing it.
export const ROUNDS_PER_TICKET = 2;

export function applyFinishedRound(profile) {
  const roundsCompleted = (profile.roundsCompleted || 0) + 1;
  const earnedTicket = roundsCompleted % ROUNDS_PER_TICKET === 0;
  return {
    changes: {
      roundsCompleted,
      funTickets: (profile.funTickets || 0) + (earnedTicket ? 1 : 0),
    },
    earnedTicket,
  };
}

export function roundsUntilNextTicket(profile) {
  return ROUNDS_PER_TICKET - ((profile.roundsCompleted || 0) % ROUNDS_PER_TICKET);
}

export function canSpendTicket(profile) {
  return (profile.funTickets || 0) > 0;
}
