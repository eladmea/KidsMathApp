// Game-screen skills (Freeze Zoo, Robo Path, Push & Roll) finish a round the
// same way the quiz does, so mastery, unlocks and Fun Break tickets all work.
export function finishSkillRound(navigation, skillId, correct, total) {
  navigation.replace('Results', {
    skillIds: [skillId],
    mode: 'practice',
    score: correct,
    total,
    tallies: { [skillId]: { correct, total } },
  });
}
