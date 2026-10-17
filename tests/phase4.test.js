import { FAIR_PLAY, FEELINGS, PERSPECTIVES, SEL_GENERATORS, SITUATIONS } from '../src/curriculum/selGenerators';
import { generateQuestion } from '../src/curriculum/generators';
import { HOW_TO } from '../src/curriculum/howTo';
import { FRIENDS, POINTS_PER_FRIEND, makeFriendTurn, makeRound, roundTotal } from '../src/logic/feelingsFriends';
import { BREATHS, IN_MS, MIN_IN_MS, MIN_SCALE, balloonScale, countdown, judgeBreath } from '../src/logic/balloonBreath';
import {
  FLOWER_STICKERS,
  GOLD_STICKERS,
  PAGE_SIZE,
  STICKER_POOL,
  awardStickers,
  roundStickerEvents,
  stickerPages,
  stickersEarnedOn,
} from '../src/logic/stickers';
import {
  addPlayTime,
  allowedMinutes,
  dailyLimitFor,
  defaultDailyLimit,
  grantBonus,
  isTimeUp,
  minutesLeft,
  recentDays,
} from '../src/logic/playTime';
import { checkGate, makeGateQuestion } from '../src/logic/parentGate';
import { applySession } from '../src/logic/progress';
import { MINI_GAMES } from '../src/curriculum/games';

const FEELING_EMOJI = Object.values(FEELINGS).map((f) => f.emoji);
const DAY1 = '2026-10-16';
const DAY2 = '2026-10-17';

describe('Feelings Garden questions', () => {
  it.each(Object.keys(SEL_GENERATORS))('%s has one right answer among distinct choices', (id) => {
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion(id);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices.filter((c) => c === q.answer)).toHaveLength(1);
      expect(q.speech).toBeTruthy();
      expect(q.explain).toBeTruthy();
    }
    expect(HOW_TO[id]).toBeTruthy();
  });

  it('never offers a feeling that would also fit a situation as a wrong answer', () => {
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion('feelings-situations');
      const situation = SITUATIONS.find(([, text]) => text === q.prompt);
      const [, , feeling, alsoFits] = situation;
      const offered = q.choices.map((emoji) => Object.keys(FEELINGS).find((id) => FEELINGS[id].emoji === emoji));
      expect(offered).toContain(feeling);
      alsoFits.forEach((id) => expect(offered).not.toContain(id));
    }
  });

  it('uses face pictures for feelings and keeps faces out of situation pictures', () => {
    expect(new Set(FEELING_EMOJI).size).toBe(FEELING_EMOJI.length);
    SITUATIONS.forEach(([emoji]) => expect(FEELING_EMOJI).not.toContain(emoji));
    expect(generateQuestion('feelings-faces').choices.every((c) => FEELING_EMOJI.includes(c))).toBe(true);
    expect(generateQuestion('feelings-faces').speakAlways).toBe(true);
  });

  it('keeps fair-play and perspective answers out of the wrong answers', () => {
    FAIR_PLAY.forEach(([, , fair, unfair]) => {
      expect(unfair).not.toContain(fair);
      expect(unfair).toHaveLength(2);
    });
    PERSPECTIVES.forEach(([, , , answer, wrong]) => {
      expect(wrong).not.toContain(answer);
      expect(wrong).toHaveLength(2);
    });
  });
});

describe('Feelings Friends', () => {
  it('gives every friend a right feeling, wrong feelings that do not fit, and one helper', () => {
    FRIENDS.forEach((friend) => {
      expect(FEELINGS[friend.feeling]).toBeDefined();
      expect(friend.alsoFits).not.toContain(friend.feeling);
      for (let i = 0; i < 30; i++) {
        const turn = makeFriendTurn(friend);
        expect(turn.feelingChoices).toHaveLength(3);
        expect(new Set(turn.feelingChoices).size).toBe(3);
        expect(turn.feelingChoices).toContain(friend.feeling);
        friend.alsoFits.forEach((id) => expect(turn.feelingChoices).not.toContain(id));
        expect(turn.helpChoices).toHaveLength(3);
        expect(turn.helpChoices.filter((o) => o.helpful)).toHaveLength(1);
        expect(new Set(turn.helpChoices.map((o) => o.label)).size).toBe(3);
      }
    });
  });

  it('builds a round of different friends and scores two points each', () => {
    const turns = makeRound(4);
    expect(turns).toHaveLength(4);
    expect(new Set(turns.map((t) => t.friend.id)).size).toBe(4);
    expect(roundTotal(turns)).toBe(4 * POINTS_PER_FRIEND);
  });
});

describe('Balloon Breath', () => {
  it('fills the balloon over a slow breath in', () => {
    expect(balloonScale(0)).toBe(MIN_SCALE);
    expect(balloonScale(IN_MS)).toBe(1);
    expect(balloonScale(IN_MS * 3)).toBe(1);
    expect(balloonScale(IN_MS / 2)).toBeCloseTo((MIN_SCALE + 1) / 2);
  });

  it('only counts slow breaths', () => {
    expect(judgeBreath(MIN_IN_MS - 1)).toBe('quick');
    expect(judgeBreath(MIN_IN_MS)).toBe('good');
    expect(countdown(0)).toBe(4);
    expect(countdown(3500)).toBe(1);
    expect(countdown(IN_MS)).toBe(0);
    expect(BREATHS).toBeGreaterThan(0);
  });

  it('is a free Fun Break game', () => {
    expect(MINI_GAMES.find((g) => g.id === 'balloon-breath').free).toBe(true);
    expect(MINI_GAMES.filter((g) => g.free)).toHaveLength(1);
  });
});

describe('sticker book', () => {
  it('awards each event once, in pool order, with gold and flower stickers', () => {
    let { stickers, earned } = awardStickers([], [{ kind: 'passed', ref: 'a' }, { kind: 'passed', ref: 'b' }], DAY1);
    expect(earned.map((s) => s.emoji)).toEqual([STICKER_POOL[0], STICKER_POOL[1]]);
    ({ stickers, earned } = awardStickers(stickers, [{ kind: 'passed', ref: 'a' }, { kind: 'mastered', ref: 'a' }], DAY2));
    expect(earned).toHaveLength(1);
    expect(earned[0]).toMatchObject({ emoji: GOLD_STICKERS[0], kind: 'mastered', day: DAY2 });
    ({ stickers, earned } = awardStickers(stickers, [{ kind: 'bloomed', ref: 1 }], DAY2));
    expect(earned[0].emoji).toBe(FLOWER_STICKERS[0]);
    expect(stickers).toHaveLength(4);
    expect(stickersEarnedOn(stickers, DAY2)).toHaveLength(2);
  });

  it('turns a finished round into sticker events', () => {
    const day1 = applySession({}, { 'sel-faces': { correct: 10, total: 10 } }, DAY1, 'sprouts');
    expect(day1.newlyPassed).toEqual(['sel-faces']);
    expect(roundStickerEvents(day1)).toEqual([{ kind: 'passed', ref: 'sel-faces' }]);
    const day2 = applySession(day1.progress, { 'sel-faces': { correct: 10, total: 10 } }, DAY2, 'sprouts');
    expect(day2.newlyPassed).toEqual([]);
    expect(roundStickerEvents(day2)).toEqual([{ kind: 'mastered', ref: 'sel-faces' }]);
  });

  it('lays stickers out in pages with room for the next one', () => {
    expect(stickerPages([])).toHaveLength(1);
    const full = Array.from({ length: PAGE_SIZE }, (_, i) => ({ key: `passed:${i}` }));
    const pages = stickerPages(full);
    expect(pages).toHaveLength(2);
    expect(pages[0].every(Boolean)).toBe(true);
    expect(pages[1].every((slot) => slot === null)).toBe(true);
  });
});

describe('play time and the soft limit', () => {
  it('defaults to about 15 minutes for ages 3-5 and 20 for 6-10', () => {
    expect(defaultDailyLimit(3)).toBe(15);
    expect(defaultDailyLimit(5)).toBe(15);
    expect(defaultDailyLimit(6)).toBe(20);
    expect(dailyLimitFor({ age: 4 })).toBe(15);
    expect(dailyLimitFor({ age: 4, dailyLimit: 0 })).toBe(0);
    expect(dailyLimitFor({ age: 9, dailyLimit: 45 })).toBe(45);
  });

  it('adds up time per day and forgets days older than two weeks', () => {
    let days = addPlayTime({}, DAY1, 30);
    days = addPlayTime(days, DAY1, 45);
    expect(days[DAY1]).toBe(75);
    days = addPlayTime(days, '2026-10-31', 10);
    expect(days[DAY1]).toBeUndefined();
    expect(days['2026-10-31']).toBe(10);
  });

  it('counts down minutes left and says when time is up', () => {
    const profile = { age: 4 };
    expect(minutesLeft(profile, {}, DAY1)).toBe(15);
    expect(minutesLeft(profile, { [DAY1]: 14 * 60 + 1 }, DAY1)).toBe(1);
    expect(isTimeUp(profile, { [DAY1]: 15 * 60 }, DAY1)).toBe(true);
    expect(minutesLeft({ age: 4, dailyLimit: 0 }, { [DAY1]: 99999 }, DAY1)).toBeNull();
    expect(isTimeUp({ age: 4, dailyLimit: 0 }, { [DAY1]: 99999 }, DAY1)).toBe(false);
  });

  it('lets a grown-up add time for today only', () => {
    const profile = { age: 4, ...grantBonus({ age: 4 }, DAY1) };
    expect(allowedMinutes(profile, DAY1)).toBe(25);
    expect(allowedMinutes({ ...profile, ...grantBonus(profile, DAY1) }, DAY1)).toBe(35);
    expect(allowedMinutes(profile, DAY2)).toBe(15);
    expect(isTimeUp(profile, { [DAY1]: 20 * 60 }, DAY1)).toBe(false);
  });

  it('lists the last 7 days oldest first', () => {
    const week = recentDays({ [DAY2]: 600 }, DAY2);
    expect(week).toHaveLength(7);
    expect(week[6]).toEqual({ day: DAY2, minutes: 10 });
    expect(week[0].day).toBe('2026-10-11');
  });
});

describe('parent gate', () => {
  it('asks a times fact with factors 6-9 and checks typed answers', () => {
    for (let i = 0; i < 100; i++) {
      const q = makeGateQuestion();
      expect(q.a).toBeGreaterThanOrEqual(6);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(checkGate(q, String(q.a * q.b))).toBe(true);
      expect(checkGate(q, String(q.a * q.b + 1))).toBe(false);
      expect(checkGate(q, '')).toBe(false);
    }
  });
});
