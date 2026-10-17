import { raw, t } from '../i18n/index';

// What the child sees after tapping the number line: praise when it's right (a
// "bullseye" for an exact hit), and a kind nudge showing where the number lives
// when it isn't.
export function numberLineFeedback(guess, answer, isCorrect) {
  if (isCorrect && guess === answer) return t('quiz.numberLine.bullseye', { answer });
  if (isCorrect) {
    const praise = raw('quiz.numberLine.praise');
    return t('quiz.numberLine.right', { praise: praise[Math.abs(answer) % praise.length], answer });
  }
  return t('quiz.numberLine.wrong', { guess, answer });
}
