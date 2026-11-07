import { buildSession, questionKey, tallyBySkill } from '../src/logic/session';
import { STORIES as enStories } from '../src/content/en/literacy';
import { STORIES as heStories } from '../src/content/he/literacy';
import { LIFE_CYCLES as enCycles } from '../src/content/en/science';
import { LIFE_CYCLES as heCycles } from '../src/content/he/science';
import { QUESTIONS_PER_QUIZ } from '../src/logic/constants';

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

  it('skips unknown and game-screen skills', () => {
    expect(buildSession(['logic-robo-path', 'nope'])).toEqual([]);
    expect(buildSession(['logic-robo-path', 'math-count-5']).every((q) => q.skillId === 'math-count-5')).toBe(true);
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

describe('no repeats within a round', () => {
  it('never asks the same story twice in a round', () => {
    for (let round = 0; round < 20; round++) {
      const stories = buildSession(['lit-story-strip'], 10).map((q) => questionKey(q));
      expect(new Set(stories).size).toBe(10);
    }
  });

  it('tells life cycles apart even though they share one spoken line', () => {
    const cycles = buildSession(['sci-life-cycles'], 6).map((q) => questionKey(q));
    expect(new Set(cycles).size).toBe(6);
  });
});

describe('reading stories are not the Nature island again', () => {
  const panels = (set) => set.map(([emoji]) => emoji);
  it.each([
    ['en', enStories, enCycles],
    ['he', heStories, heCycles],
  ])('%s: no story shares more than one picture with a life cycle', (_, stories, cycles) => {
    stories.forEach((story) => {
      cycles.forEach((cycle) => {
        const shared = panels(story).filter((emoji) => panels(cycle).includes(emoji));
        expect(shared.length, story.map(([, c]) => c).join(' / ')).toBeLessThan(2);
      });
    });
    expect(stories.length).toBeGreaterThanOrEqual(20);
  });
});
