// A grown-up check before the parent dashboard or extra play time: a times
// fact most young children can't answer yet, typed in rather than picked, so
// it can't be guessed by tapping.
export function makeGateQuestion(rng = Math.random) {
  const a = 6 + Math.floor(rng() * 4);
  const b = 6 + Math.floor(rng() * 4);
  return { a, b, answer: a * b, text: `${a} × ${b}` };
}

export function checkGate(question, input) {
  return String(input).trim() !== '' && Number(input) === question.answer;
}
