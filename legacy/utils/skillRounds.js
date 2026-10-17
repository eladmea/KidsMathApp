// Game-screen skills (Bunny Pop, Freeze Zoo, Robo Path, Push & Roll, Feelings Friends, Number Tracing)
// finish a round the same way the quiz does, so mastery, unlocks, Fun Break
// tickets and Today's Adventure steps all work.
export function finishSkillRound(navigation, skillId, correct, total, adventureStep) {
  navigation.replace('Results', {
    skillIds: [skillId],
    mode: 'practice',
    adventureStep,
    score: correct,
    total,
    tallies: { [skillId]: { correct, total } },
  });
}
