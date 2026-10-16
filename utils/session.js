import { getSkill } from '../curriculum/skills';
import { generateQuestion, shuffle } from '../curriculum/generators';
import { QUESTIONS_PER_QUIZ } from './constants';

// Builds a round of questions. With several skills (a review session) the
// questions are interleaved, since mixing problem types beats blocked practice.
// Consecutive duplicate prompts are avoided where possible.
export function buildSession(skillIds, count = QUESTIONS_PER_QUIZ) {
  const skills = skillIds.map(getSkill).filter((skill) => skill && skill.generator);
  if (skills.length === 0) return [];

  const order = shuffle(Array.from({ length: count }, (_, i) => skills[i % skills.length]));
  const questions = [];
  const repeatsPrevious = (question) => {
    const previous = questions[questions.length - 1];
    return previous && previous.speech === question.speech;
  };
  order.forEach((skill, index) => {
    let question = generateQuestion(skill.generator);
    for (let tries = 0; tries < 5 && repeatsPrevious(question); tries++) {
      question = generateQuestion(skill.generator);
    }
    questions.push({ ...question, id: index, skillId: skill.id });
  });
  return questions;
}

export function tallyBySkill(questions, results) {
  const tallies = {};
  questions.forEach((question, index) => {
    if (results[index] === undefined) return;
    const tally = tallies[question.skillId] || { correct: 0, total: 0 };
    tally.total += 1;
    if (results[index]) tally.correct += 1;
    tallies[question.skillId] = tally;
  });
  return tallies;
}

// Replaces the questions from `fromIndex` on with questions for `skill` (used
// when a round steps up or down a level). Earlier questions are kept.
export function replaceRemaining(questions, fromIndex, skill) {
  const next = questions.slice(0, fromIndex);
  for (let index = fromIndex; index < questions.length; index++) {
    let question = generateQuestion(skill.generator);
    const previous = next[next.length - 1];
    for (let tries = 0; tries < 5 && previous && previous.speech === question.speech; tries++) {
      question = generateQuestion(skill.generator);
    }
    next.push({ ...question, id: index, skillId: skill.id });
  }
  return next;
}
