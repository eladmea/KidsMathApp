import { CHOICES_PER_QUESTION } from './constants';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices(answer) {
  const choices = new Set([answer]);
  while (choices.size < CHOICES_PER_QUESTION) {
    const offset = randInt(-5, 5) || 1;
    const candidate = answer + offset;
    if (candidate >= 0 && !choices.has(candidate)) {
      choices.add(candidate);
    }
  }
  return shuffle(Array.from(choices));
}

function generateAdditionOrSubtraction() {
  const isAddition = Math.random() < 0.5;
  const a = randInt(1, 10);
  const b = randInt(1, 10);
  if (isAddition) {
    return { a, b, operator: '+', answer: a + b };
  }
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  return { a: high, b: low, operator: '-', answer: high - low };
}

function generateMultiplicationOrDivision(min, max) {
  const isMultiplication = Math.random() < 0.5;
  if (isMultiplication) {
    const a = randInt(min, max);
    const b = randInt(min, max);
    return { a, b, operator: '×', answer: a * b };
  }
  const divisor = randInt(min, max);
  const quotient = randInt(min, max);
  const dividend = divisor * quotient;
  return { a: dividend, b: divisor, operator: '÷', answer: quotient };
}

export function generateQuestion(difficulty) {
  let details;
  if (difficulty === 'Easy') {
    details = generateAdditionOrSubtraction();
  } else if (difficulty === 'Medium') {
    details = generateMultiplicationOrDivision(1, 10);
  } else {
    details = generateMultiplicationOrDivision(5, 12);
  }

  return {
    text: `${details.a} ${details.operator} ${details.b}`,
    answer: details.answer,
    choices: buildChoices(details.answer),
  };
}
