// Play-test log: what happened in each round, kept on this device only, so a
// grown-up running a play-test can see which skills are too hard, too easy or
// confusing. Events (per profile, oldest first):
//   answer: { skillId, baseSkillId, mode, correct, ms, replays, level }
//   round:  { skillId, mode, correct, total }        (a finished round)
//   quit:   { skillId, mode, answered, total }       (left a quiz early)
//   level:  { skillId, change: 'down'|'up'|'hint', toSkillId }
//   note:   { text }                                 (a grown-up's note)
// Every event also has `type`, `at` (ms timestamp) and `day` ('YYYY-MM-DD').
import { getSkill } from '../curriculum/skills';

export const MAX_EVENTS = 3000;
// Flags need enough answers to mean something.
export const MIN_ANSWERS = 10;
export const TOO_HARD_BELOW = 0.6;
export const TOO_EASY_FROM = 0.95;
export const FAST_MS = 3000;
export const UNCLEAR_REPLAYS = 0.5;
export const DROP_OFF_FROM = 0.34;
const MIN_ROUNDS_FOR_DROP_OFF = 3;

export function appendEvents(log = [], events) {
  const next = [...log, ...events];
  return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function emptyStats(skillId) {
  return {
    skillId,
    answers: 0,
    correct: 0,
    times: [],
    replays: 0,
    rounds: 0,
    roundCorrect: 0,
    roundTotal: 0,
    quits: 0,
    stepsDown: 0,
    stepsUp: 0,
    hints: 0,
  };
}

// What to look at for one skill: 'too hard', 'too easy', 'unclear' (the
// question is replayed a lot) and 'drop-off' (rounds often left early).
export function skillFlags(stats) {
  const flags = [];
  if (stats.attempts >= MIN_ANSWERS) {
    if (stats.accuracy < TOO_HARD_BELOW) flags.push('too hard');
    if (stats.accuracy >= TOO_EASY_FROM && (stats.medianMs === null || stats.medianMs < FAST_MS)) flags.push('too easy');
  }
  if (stats.answers >= MIN_ANSWERS && stats.replaysPerAnswer >= UNCLEAR_REPLAYS) flags.push('unclear');
  const started = stats.rounds + stats.quits;
  if (started >= MIN_ROUNDS_FOR_DROP_OFF && stats.quits / started >= DROP_OFF_FROM) flags.push('drop-off');
  return flags;
}

// One row per skill that appears in the log, most-played first.
export function skillReport(log = []) {
  const bySkill = {};
  const statsFor = (skillId) => (bySkill[skillId] = bySkill[skillId] || emptyStats(skillId));
  log.forEach((event) => {
    if (!event.skillId) return;
    const stats = statsFor(event.skillId);
    if (event.type === 'answer') {
      stats.answers += 1;
      if (event.correct) stats.correct += 1;
      if (typeof event.ms === 'number') stats.times.push(event.ms);
      stats.replays += event.replays || 0;
    } else if (event.type === 'round') {
      stats.rounds += 1;
      stats.roundCorrect += event.correct;
      stats.roundTotal += event.total;
    } else if (event.type === 'quit') {
      stats.quits += 1;
    } else if (event.type === 'level') {
      if (event.change === 'down') stats.stepsDown += 1;
      if (event.change === 'up') stats.stepsUp += 1;
      if (event.change === 'hint') stats.hints += 1;
    }
  });

  return Object.values(bySkill)
    .map(({ times, ...stats }) => {
      // Quiz skills are judged by their answers; game-screen skills (which
      // only report round totals) by their rounds.
      const attempts = stats.answers || stats.roundTotal;
      const correct = stats.answers ? stats.correct : stats.roundCorrect;
      const row = {
        ...stats,
        skill: getSkill(stats.skillId) || null,
        attempts,
        accuracy: attempts ? correct / attempts : null,
        medianMs: median(times),
        replaysPerAnswer: stats.answers ? stats.replays / stats.answers : 0,
      };
      return { ...row, flags: skillFlags(row) };
    })
    .sort((a, b) => b.attempts + b.rounds - (a.attempts + a.rounds));
}

export function notesOf(log = []) {
  return log.filter((event) => event.type === 'note');
}

export function daysPlayed(log = []) {
  return new Set(log.filter((event) => event.type !== 'note').map((event) => event.day)).size;
}

const CSV_COLUMNS = ['profile', 'type', 'day', 'at', 'skillId', 'baseSkillId', 'mode', 'correct', 'ms', 'replays', 'level', 'coach', 'total', 'answered', 'change', 'toSkillId', 'text'];

function csvCell(value) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// All profiles' events as CSV: logs = [{ profile: name, events }].
export function toCsv(logs) {
  const rows = logs.flatMap(({ profile, events }) =>
    events.map((event) => CSV_COLUMNS.map((column) => csvCell(column === 'profile' ? profile : event[column])).join(','))
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}
