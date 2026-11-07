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
  const seen = new Set();
  order.forEach((skill, index) => {
    // A question already asked this round is drawn again (a few tries, so a
    // skill with only a handful of questions can still repeat).
    let question = generateQuestion(skill.generator);
    for (let tries = 0; tries < 40 && seen.has(questionKey(question)); tries++) {
      question = generateQuestion(skill.generator);
    }
    seen.add(questionKey(question));
    questions.push({ ...question, id: index, skillId: skill.id });
  });
  return questions;
}

// What makes two questions the same: what is asked and what the answer is.
// Story and life-cycle questions all share one spoken line, so their panels
// tell them apart.
export function questionKey(question) {
  const items = question.items ? question.items.map((item) => item.caption).sort() : null;
  return JSON.stringify([question.speech, question.prompt, question.answer, items, question.visual && question.visual.say]);
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
