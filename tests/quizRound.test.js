import { answerLabel, exampleSpeech, feedbackDelay, isCorrectAnswer, levelNote, RESULT_LINES } from '../src/logic/quizRound';
import { GAME_SCENES, isAvailable, skillScene } from '../src/logic/skillRoutes';
import { GENERATORS, generateQuestion } from '../src/curriculum/generators';
import { SKILLS, getSkill, isQuizSkill } from '../src/curriculum/skills';

// A right answer in the shape each question type expects.
function rightAnswer(q) {
  if (q.type === 'build') return q.parts;
  if (q.type === 'order') return q.answer;
  return q.answer;
}

describe('checking answers', () => {
  it('accepts the right answer for every generator and rejects a wrong one', () => {
    Object.keys(GENERATORS).forEach((id) => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(id);
        expect(isCorrectAnswer(q, rightAnswer(q))).toBe(true);
        if (q.type === 'choice') expect(isCorrectAnswer(q, q.choices.find((c) => c !== q.answer))).toBe(false);
        if (q.type === 'numberLine') expect(isCorrectAnswer(q, q.answer + q.tolerance + 1 <= q.max ? q.answer + q.tolerance + 1 : q.answer - q.tolerance - 1)).toBe(false);
        if (q.type === 'build') expect(isCorrectAnswer(q, [...q.parts].reverse().concat('x'))).toBe(false);
        if (q.type === 'order') expect(isCorrectAnswer(q, [...q.answer].reverse())).toBe(false);
      }
    });
  });

  it('counts a number-line tap within the tolerance', () => {
    const q = { type: 'numberLine', answer: 50, tolerance: 8 };
    expect(isCorrectAnswer(q, 58)).toBe(true);
    expect(isCorrectAnswer(q, 41)).toBe(false);
  });
});

describe('worked examples', () => {
  it('reads how to play, the question and why', () => {
    const q = { type: 'choice', speech: 'How many apples?', answer: 3, explain: 'There are 3 apples!' };
    expect(exampleSpeech('Count the pictures.', q)).toBe('Count the pictures. How many apples? There are 3 apples!');
    expect(exampleSpeech(null, { ...q, explain: null })).toBe('How many apples? The answer is 3.');
  });

  it('labels built words and stories', () => {
    expect(answerLabel({ type: 'build', parts: ['c', 'a', 't'] })).toBe('c · a · t');
    const items = [{ id: 0, emoji: '🥚' }, { id: 1, emoji: '🐛' }];
    expect(answerLabel({ type: 'order', answer: [0, 1], items })).toBe('🥚 → 🐛');
    expect(exampleSpeech(null, { type: 'build', speech: 'Build cat.', parts: ['c', 'a', 't'] })).toBe('Build cat. The answer is c, a, t.');
  });
});

describe('round pacing and notes', () => {
  it('keeps wrong answers and harder inputs up longer', () => {
    expect(feedbackDelay({ type: 'choice' }, false)).toBeGreaterThan(feedbackDelay({ type: 'choice' }, true));
    expect(feedbackDelay({ type: 'order' }, true)).toBeGreaterThan(feedbackDelay({ type: 'choice' }, true));
  });

  it('has a note for each level change and a line for each star count', () => {
    const skill = getSkill('math-count-5');
    expect(levelNote('down', skill, -1)).toContain('Count to 5');
    expect(levelNote('up', skill, 1)).toContain('Level up');
    expect(levelNote('up', skill, 0)).toContain('Back to');
    expect(levelNote('hint', skill, 0)).toContain('hint');
    expect(levelNote(null, skill, 0)).toBeNull();
    [1, 2, 3].forEach((stars) => expect(RESULT_LINES[stars]).toBeTruthy());
  });
});

describe('which scene plays a skill', () => {
  it('sends every quiz skill to the Quiz scene', () => {
    SKILLS.filter(isQuizSkill).forEach((skill) => {
      expect(isAvailable(skill)).toBe(true);
      expect(skillScene(skill)).toEqual({ key: 'Quiz', data: { skillIds: [skill.id], mode: 'practice' } });
    });
  });

  it('sends rebuilt games to their scene and the rest nowhere yet', () => {
    expect(skillScene(getSkill('math-pizza'))).toEqual({ key: 'Pizza', data: { skillId: 'math-pizza' } });
    const notYet = SKILLS.filter((s) => s.screen && !GAME_SCENES[s.screen]);
    expect(notYet.length).toBeGreaterThan(0);
    notYet.forEach((skill) => {
      expect(isAvailable(skill)).toBe(false);
      expect(skillScene(skill)).toBeNull();
    });
    expect(skillScene(undefined)).toBeNull();
  });
});
