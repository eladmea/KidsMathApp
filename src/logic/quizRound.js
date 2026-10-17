// Rules for a quiz round that don't depend on how it's drawn: checking an
// answer of any type, the answer as text, and what a worked example says.

export const MODES = { practice: 'practice', review: 'review', mixed: 'mixed' };

// question.type: 'choice' (tap a button), 'numberLine' (tap a spot, within
// `tolerance`), 'build' (letter tiles in order) or 'order' (story panels).
export function isCorrectAnswer(question, choice) {
  switch (question.type) {
    case 'numberLine':
      return Math.abs(choice - question.answer) <= question.tolerance;
    case 'build':
      return choice.join('') === question.answer;
    case 'order':
      return choice.join(',') === question.answer.join(',');
    default:
      return choice === question.answer;
  }
}

// The answer as text, for any question type.
export function answerLabel(question) {
  if (question.type === 'build') return question.parts.join(' · ');
  if (question.type === 'order') return question.answer.map((id) => question.items.find((i) => i.id === id).emoji).join(' → ');
  return String(question.answer);
}

// What the narrator says for a worked example: how to play, the question,
// then why the answer is right.
export function exampleSpeech(howTo, question) {
  return [howTo, question.speech, question.explain || `The answer is ${answerLabel(question).replace(/ · /g, ', ')}.`]
    .filter(Boolean)
    .join(' ');
}

// How long the right/wrong result stays before the next question. Wrong
// answers stay longer so the child sees the right one; number lines, built
// words and stories need longer to look at.
const FEEDBACK_MS = { correct: 1400, wrong: 2400 };
const REVIEW_DELAY_MS = { numberLine: 2200, build: 2600, order: 3000 };

export function feedbackDelay(question, isCorrect) {
  return REVIEW_DELAY_MS[question.type] ?? FEEDBACK_MS[isCorrect ? 'correct' : 'wrong'];
}

// The note shown when a practice round changes level.
export function levelNote(change, skill, level) {
  if (change === 'down') return `⬇️ Let's practice ${skill.emoji} ${skill.title} for a bit`;
  if (change === 'up') return level > 0 ? `⚡ Level up! ${skill.emoji} ${skill.title}` : `⬆️ Back to ${skill.emoji} ${skill.title}. Nice!`;
  if (change === 'hint') return "💡 Here's a hint";
  return null;
}

// What a finished round says, from its stars (see logic/scoring.js).
export const RESULT_LINES = {
  3: 'Amazing job!',
  2: 'Great work!',
  1: 'Nice try! Keep practicing!',
};
