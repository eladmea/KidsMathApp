import {
  ADVENTURE_QUESTIONS,
  STEP_MINUTES,
  completeStep,
  currentStep,
  estimatedMinutes,
  fitToTime,
  isFinished,
  newAdventure,
  planAdventure,
  stepRoute,
  stepTitle,
  subjectsForDay,
  weekdayOf,
} from '../src/logic/adventure';
import { COACH_INTRO, TALK_SUBJECTS, talkPrompt } from '../src/curriculum/talkPrompts';
import { applyRound, getRecord } from '../src/logic/progress';
import { getSkill } from '../src/curriculum/skills';
import { SUBJECTS } from '../src/curriculum/subjects';
import { awardStickers, ADVENTURE_STICKERS } from '../src/logic/stickers';

const FRIDAY = '2026-10-16';
const SATURDAY = '2026-10-17';
const PASS = { correct: 10, total: 10 };

function passed(day) {
  return applyRound(getRecord({}, 'x'), PASS, day);
}

describe("Today's Adventure plan", () => {
  it('alternates the main subject and rotates the second one', () => {
    expect(weekdayOf(FRIDAY)).toBe(5);
    expect(subjectsForDay(FRIDAY)).toEqual({ main: 'literacy', second: 'sel' });
    expect(subjectsForDay(SATURDAY)).toEqual({ main: 'math', second: 'science' });
    const seen = new Set(Array.from({ length: 7 }, (_, i) => subjectsForDay(`2026-10-${12 + i}`).second));
    expect(seen.size).toBe(3);
  });

  it('starts a new player with a new skill, a game, a second subject and a cool-down', () => {
    const steps = planAdventure({ bandId: 'sprouts', progress: {}, today: SATURDAY });
    expect(steps.map((s) => s.kind)).toEqual(['new', 'minigame', 'second', 'cooldown']);
    expect(getSkill(steps[0].skillIds[0]).subject).toBe('math');
    expect(getSkill(steps[2].skillIds[0]).subject).toBe('science');
  });

  it('adds a warm-up for due reviews and mixes passed skills with the new one', () => {
    const progress = { 'math-count-5': passed('2026-10-10'), 'math-shapes': passed('2026-10-10') };
    const steps = planAdventure({ bandId: 'sprouts', progress, today: SATURDAY });
    expect(steps.map((s) => s.kind)).toEqual(['warmup', 'new', 'mixed', 'minigame', 'second', 'cooldown']);
    const [warmup, fresh, mixed] = steps;
    expect(warmup.skillIds.sort()).toEqual(['math-count-5', 'math-shapes']);
    expect(mixed.skillIds[0]).toBe(fresh.skillIds[0]);
    expect(mixed.skillIds).toEqual(expect.arrayContaining(['math-count-5', 'math-shapes']));
  });

  it('fits the time left by dropping steps from the end, keeping the cool-down', () => {
    const progress = { 'math-count-5': passed('2026-10-10'), 'math-shapes': passed('2026-10-10') };
    const full = planAdventure({ bandId: 'sprouts', progress, today: SATURDAY });
    expect(estimatedMinutes(full)).toBe(14);
    const short = planAdventure({ bandId: 'sprouts', progress, today: SATURDAY, minutesLeft: 7 });
    expect(short.map((s) => s.kind)).toEqual(['warmup', 'new', 'cooldown']);
    const tiny = fitToTime(full, 1);
    expect(tiny.map((s) => s.kind)).toEqual(['warmup', 'cooldown']);
    expect(fitToTime(full, null)).toBe(full);
    Object.keys(STEP_MINUTES).forEach((kind) => expect(STEP_MINUTES[kind]).toBeGreaterThan(0));
  });

  it('plans something for every band and day', () => {
    ['sprouts', 'explorers', 'builders', 'masters'].forEach((bandId) => {
      for (let d = 12; d < 19; d++) {
        const steps = planAdventure({ bandId, progress: {}, today: `2026-10-${d}` });
        expect(steps.length).toBeGreaterThanOrEqual(3);
        expect(steps[steps.length - 1].kind).toBe('cooldown');
        steps.forEach((step) => {
          const [routeName, params] = stepRoute(step);
          expect(routeName).toBeTruthy();
          expect(params.adventureStep).toBe(step.id);
          expect(stepTitle(step)).toBeTruthy();
        });
      }
    });
  });

  it('routes steps to short quiz rounds, game screens and free breaks', () => {
    expect(stepRoute({ id: 'new', kind: 'new', skillIds: ['math-add-10'] })).toEqual([
      'Quiz',
      { adventureStep: 'new', skillIds: ['math-add-10'], mode: 'practice', count: ADVENTURE_QUESTIONS },
    ]);
    expect(stepRoute({ id: 'warmup', kind: 'warmup', skillIds: ['a'] })[1].mode).toBe('review');
    expect(stepRoute({ id: 'mixed', kind: 'mixed', skillIds: ['a', 'b'] })[1].mode).toBe('mixed');
    expect(stepRoute({ id: 'second', kind: 'second', skillIds: ['logic-freeze-zoo'], screen: 'FreezeZoo' })).toEqual([
      'FreezeZoo',
      { adventureStep: 'second', skillId: 'logic-freeze-zoo' },
    ]);
    expect(stepRoute({ id: 'minigame', kind: 'minigame', route: 'BubblePop' })).toEqual([
      'BubblePop',
      { adventureStep: 'minigame', adventure: true },
    ]);
    expect(stepRoute({ id: 'cooldown', kind: 'cooldown' })[0]).toBe('BalloonBreath');
  });

  it('tracks done steps once each until finished', () => {
    const steps = planAdventure({ bandId: 'sprouts', progress: {}, today: SATURDAY });
    let adventure = newAdventure(SATURDAY, steps);
    expect(currentStep(adventure).kind).toBe('new');
    adventure = completeStep(adventure, 'new');
    expect(completeStep(adventure, 'new')).toBe(adventure);
    expect(completeStep(adventure, 'nope')).toBe(adventure);
    expect(currentStep(adventure).kind).toBe('minigame');
    steps.forEach((s) => (adventure = completeStep(adventure, s.id)));
    expect(isFinished(adventure)).toBe(true);
    expect(currentStep(adventure)).toBeNull();
  });

  it('awards a map sticker once per adventure day', () => {
    let { stickers, earned } = awardStickers([], [{ kind: 'adventure', ref: FRIDAY }], FRIDAY);
    expect(earned[0].emoji).toBe(ADVENTURE_STICKERS[0]);
    ({ earned } = awardStickers(stickers, [{ kind: 'adventure', ref: FRIDAY }], FRIDAY));
    expect(earned).toHaveLength(0);
  });
});

describe('Play together prompts', () => {
  it('has right and wrong prompts for every subject', () => {
    SUBJECTS.forEach(({ id }) => {
      expect(TALK_SUBJECTS).toContain(id);
      expect(talkPrompt(id, true)).toBeTruthy();
      expect(talkPrompt(id, false)).toBeTruthy();
      expect(talkPrompt(id, true, 0)).not.toBe(talkPrompt(id, true, 1));
    });
    expect(talkPrompt('unknown', true)).toBe(talkPrompt('math', true));
    expect(COACH_INTRO).toBeTruthy();
  });
});
