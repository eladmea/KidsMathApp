// The DEV button's switches: open every level, and no time limit.
import { devFlags, setDevFlag } from '../src/dev/flags';
import { isUnlocked } from '../src/logic/progress';
import { getSkill } from '../src/curriculum/skills';
import { session, timeLeft } from '../src/services/session';

describe('dev flags', () => {
  afterEach(() => {
    setDevFlag('openAll', false);
    setDevFlag('unlimitedTime', false);
    session.profile = null;
  });

  it('start off', () => {
    expect(devFlags).toEqual({ openAll: false, unlimitedTime: false });
  });

  it('openAll opens a locked skill', () => {
    const count10 = getSkill('math-count-10');
    expect(isUnlocked(count10, {})).toBe(false);
    setDevFlag('openAll', true);
    expect(isUnlocked(count10, {})).toBe(true);
  });

  it('unlimitedTime removes the daily limit', () => {
    session.profile = { id: 'p1', age: 4, dailyLimit: 15 };
    session.playTime = {};
    expect(timeLeft()).toBe(15);
    setDevFlag('unlimitedTime', true);
    expect(timeLeft()).toBeNull();
  });

  it('ignores names it does not know', () => {
    setDevFlag('somethingElse', true);
    expect(devFlags).not.toHaveProperty('somethingElse');
  });
});
