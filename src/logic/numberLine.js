const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Super tapping!'];

// What the child sees after tapping the number line: praise when it's right (a
// "bullseye" for an exact hit), and a kind nudge showing where the number lives
// when it isn't.
export function numberLineFeedback(guess, answer, isCorrect) {
  if (isCorrect && guess === answer) return `Bullseye! ${answer} is right there! 🎯`;
  if (isCorrect) return `${PRAISE[Math.abs(answer) % PRAISE.length]} ${answer} lives right there! 🎉`;
  return `Good try! You tapped ${guess}. ${answer} lives here. 🎯`;
}
