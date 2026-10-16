import { buildSession, tallyBySkill } from '../utils/session';
import { QUESTIONS_PER_QUIZ } from '../utils/constants';

describe('buildSession', () => {
  it('builds a full round for one skill', () => {
    const questions = buildSession(['math-add-10']);
    expect(questions).toHaveLength(QUESTIONS_PER_QUIZ);
    questions.forEach((q) => expect(q.skillId).toBe('math-add-10'));
  });

  it('interleaves several skills evenly', () => {
    const questions = buildSession(['math-add-20', 'math-mult-10'], 10);
    const counts = questions.reduce((acc, q) => ({ ...acc, [q.skillId]: (acc[q.skillId] || 0) + 1 }), {});
    expect(counts).toEqual({ 'math-add-20': 5, 'math-mult-10': 5 });
  });

  it('skips unknown or coming-soon skills', () => {
    expect(buildSession(['lit-rhymes', 'nope'])).toEqual([]);
    expect(buildSession(['lit-rhymes', 'math-count-5']).every((q) => q.skillId === 'math-count-5')).toBe(true);
  });
});

describe('tallyBySkill', () => {
  it('counts answered questions per skill', () => {
    const questions = [{ skillId: 'a' }, { skillId: 'b' }, { skillId: 'a' }, { skillId: 'b' }];
    expect(tallyBySkill(questions, [true, false, true])).toEqual({
      a: { correct: 2, total: 2 },
      b: { correct: 0, total: 1 },
    });
  });
});
