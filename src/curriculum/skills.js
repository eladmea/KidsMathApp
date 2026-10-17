// The skill map: ordered learning-trajectory steps per subject and age band.
// A skill is played either through the quiz engine (`generator`) or on its
// own game screen (`screen`), which reports results the same way.
// `prereqs` follow the developmental order (e.g. subitize/count -> compare ->
// add). Prerequisites outside a child's band are treated as already met, so a
// 7-year-old isn't sent back to counting apples. Skills without a `generator`
// are planned for a later phase and show as "coming soon".
export const SKILLS = [
  // ---- Number Island: Sprouts (3-4) ----
  { id: 'math-count-5', subject: 'math', band: 'sprouts', emoji: '🖐️', generator: 'count-5', prereqs: [] },
  { id: 'math-shapes', subject: 'math', band: 'sprouts', emoji: '🔺', generator: 'shapes', prereqs: [] },
  { id: 'math-count-10', subject: 'math', band: 'sprouts', emoji: '🔟', generator: 'count-10', prereqs: ['math-count-5'] },
  { id: 'math-more-less', subject: 'math', band: 'sprouts', emoji: '⚖️', generator: 'more-less', prereqs: ['math-count-5'] },
  { id: 'math-quick-look-5', subject: 'math', band: 'sprouts', emoji: '👀', generator: 'quick-look-5', prereqs: ['math-count-5'] },
  // Writing: pre-writing strokes first (Bee Paths), then digits, then games
  // that pair writing a number with counting it. `traceLevel` / `traceGame`
  // configure the shared tracing screens.
  { id: 'math-bee-paths', subject: 'math', band: 'sprouts', emoji: '🐝', screen: 'TracePath', traceGame: 'bee', prereqs: [] },
  { id: 'math-write-1-5', subject: 'math', band: 'sprouts', emoji: '✏️', screen: 'TraceDigits', traceLevel: 'small', prereqs: [] },
  { id: 'math-race-track', subject: 'math', band: 'sprouts', emoji: '🏁', screen: 'TracePath', traceGame: 'race', prereqs: [] },
  { id: 'math-pizza', subject: 'math', band: 'sprouts', emoji: '🍕', screen: 'PizzaShop', prereqs: [] },
  { id: 'math-birthday-cake', subject: 'math', band: 'sprouts', emoji: '🎂', screen: 'BirthdayCake', prereqs: [] },
  { id: 'math-write-6-9', subject: 'math', band: 'sprouts', emoji: '🖍️', screen: 'TraceDigits', traceLevel: 'big', prereqs: ['math-write-1-5'] },

  // ---- Number Island: Explorers (5-6) ----
  { id: 'math-next-number', subject: 'math', band: 'explorers', emoji: '➡️', generator: 'next-number', prereqs: ['math-count-10'] },
  { id: 'math-bigger-number', subject: 'math', band: 'explorers', emoji: '🐊', generator: 'bigger-number', prereqs: ['math-next-number'] },
  { id: 'math-quick-look-10', subject: 'math', band: 'explorers', emoji: '👀', generator: 'quick-look-10', prereqs: ['math-quick-look-5'] },
  { id: 'math-number-line-10', subject: 'math', band: 'explorers', emoji: '🪂', generator: 'number-line-10', prereqs: ['math-next-number'] },
  { id: 'math-add-10', subject: 'math', band: 'explorers', emoji: '➕', generator: 'add-10', prereqs: ['math-more-less'] },
  { id: 'math-sub-10', subject: 'math', band: 'explorers', emoji: '➖', generator: 'sub-10', prereqs: ['math-add-10'] },

  // ---- Number Island: Builders (7-8) ----
  { id: 'math-add-20', subject: 'math', band: 'builders', emoji: '➕', generator: 'add-20', prereqs: ['math-add-10'] },
  { id: 'math-sub-20', subject: 'math', band: 'builders', emoji: '➖', generator: 'sub-20', prereqs: ['math-sub-10', 'math-add-20'] },
  { id: 'math-add-100', subject: 'math', band: 'builders', emoji: '💯', generator: 'add-100', prereqs: ['math-add-20'] },
  { id: 'math-sub-100', subject: 'math', band: 'builders', emoji: '🧮', generator: 'sub-100', prereqs: ['math-sub-20', 'math-add-100'] },
  { id: 'math-skip-count', subject: 'math', band: 'builders', emoji: '🦘', generator: 'skip-count', prereqs: ['math-next-number'] },
  { id: 'math-mult-2-5-10', subject: 'math', band: 'builders', emoji: '✖️', generator: 'mult-2-5-10', prereqs: ['math-add-20'] },
  { id: 'math-number-line-100', subject: 'math', band: 'builders', emoji: '🪂', generator: 'number-line-100', prereqs: ['math-number-line-10'] },

  // ---- Number Island: Masters (9-10) ----
  { id: 'math-mult-10', subject: 'math', band: 'masters', emoji: '✖️', generator: 'mult-10', prereqs: ['math-mult-2-5-10'] },
  { id: 'math-div-10', subject: 'math', band: 'masters', emoji: '➗', generator: 'div-10', prereqs: ['math-mult-10'] },
  { id: 'math-mult-12', subject: 'math', band: 'masters', emoji: '🚀', generator: 'mult-12', prereqs: ['math-mult-10'] },
  { id: 'math-div-12', subject: 'math', band: 'masters', emoji: '🪐', generator: 'div-12', prereqs: ['math-div-10', 'math-mult-12'] },
  { id: 'math-number-line-1000', subject: 'math', band: 'masters', emoji: '🪂', generator: 'number-line-1000', prereqs: ['math-number-line-100'] },

  // ---- Word Woods ----
  // Order follows the National Reading Panel progression: hear sounds first
  // (rhyme, first sound), then link sounds to letters, then blend into words,
  // then read sentences and word parts.
  { id: 'lit-rhymes', subject: 'literacy', band: 'sprouts', emoji: '🎵', generator: 'rhymes', prereqs: [] },
  { id: 'lit-first-sound', subject: 'literacy', band: 'sprouts', emoji: '👾', generator: 'sound-snack', prereqs: [] },
  { id: 'lit-letter-sounds', subject: 'literacy', band: 'explorers', emoji: '🔤', generator: 'letter-sounds', prereqs: ['lit-first-sound'] },
  { id: 'lit-sight-words', subject: 'literacy', band: 'explorers', emoji: '👀', generator: 'sight-words', prereqs: [] },
  { id: 'lit-word-builder', subject: 'literacy', band: 'explorers', emoji: '🧱', generator: 'word-builder', prereqs: ['lit-letter-sounds'] },
  { id: 'lit-digraphs', subject: 'literacy', band: 'builders', emoji: '🚢', generator: 'digraph-starts', prereqs: [] },
  { id: 'lit-digraph-builder', subject: 'literacy', band: 'builders', emoji: '🧩', generator: 'digraph-builder', prereqs: ['lit-digraphs'] },
  { id: 'lit-story-strip', subject: 'literacy', band: 'builders', emoji: '📖', generator: 'story-strip', prereqs: [] },
  { id: 'lit-compound-words', subject: 'literacy', band: 'masters', emoji: '🌻', generator: 'compound-words', prereqs: [] },
  { id: 'lit-word-parts', subject: 'literacy', band: 'masters', emoji: '🔍', generator: 'word-parts', prereqs: ['lit-compound-words'] },

  // ---- Nature Bay (NGSS K-2 core ideas, then life science and matter) ----
  { id: 'sci-weather', subject: 'science', band: 'sprouts', emoji: '☔', generator: 'dress-weather', prereqs: [] },
  { id: 'sci-animal-homes', subject: 'science', band: 'sprouts', emoji: '🐧', generator: 'animal-homes', prereqs: [] },
  { id: 'sci-plant-needs', subject: 'science', band: 'explorers', emoji: '🌱', generator: 'plant-needs', prereqs: [] },
  { id: 'sci-push-pull', subject: 'science', band: 'explorers', emoji: '🛒', generator: 'push-pull', prereqs: [] },
  { id: 'sci-push-roll', subject: 'science', band: 'explorers', emoji: '⚽', screen: 'PushRoll', prereqs: ['sci-push-pull'] },
  { id: 'sci-life-cycles', subject: 'science', band: 'builders', emoji: '🦋', generator: 'life-cycles', prereqs: [] },
  { id: 'sci-matter', subject: 'science', band: 'builders', emoji: '🧊', generator: 'states-of-matter', prereqs: [] },
  { id: 'sci-ecosystems', subject: 'science', band: 'masters', emoji: '🦉', generator: 'food-chains', prereqs: [] },
  { id: 'sci-body', subject: 'science', band: 'masters', emoji: '🫀', generator: 'human-body', prereqs: [] },

  // ---- Puzzle Peak (logic, coding and executive function) ----
  // Bunny Pop: one fixed rule for ages 3-4. Freeze Zoo's rule switch is in 5-6.
  { id: 'logic-bunny-pop', subject: 'logic', band: 'sprouts', emoji: '🐰', screen: 'BunnyPop', prereqs: [] },
  // Patterns follow the patterning trajectory: fill an AB gap -> extend
  // AB/AAB/ABB -> longer cores -> same pattern, new things -> the repeating
  // part -> growing patterns -> position and number rules.
  { id: 'logic-patterns', subject: 'logic', band: 'sprouts', emoji: '🔁', generator: 'patterns-ab', prereqs: [] },
  { id: 'logic-patterns-more', subject: 'logic', band: 'sprouts', emoji: '🔂', generator: 'patterns-easy', prereqs: ['logic-patterns'] },
  { id: 'logic-freeze-zoo', subject: 'logic', band: 'explorers', emoji: '🦒', screen: 'FreezeZoo', prereqs: [] },
  { id: 'logic-robo-path', subject: 'logic', band: 'explorers', emoji: '🤖', screen: 'RoboPath', prereqs: [] },
  { id: 'logic-patterns-hard', subject: 'logic', band: 'explorers', emoji: '🧩', generator: 'patterns-hard', prereqs: ['logic-patterns-more'] },
  { id: 'logic-pattern-match', subject: 'logic', band: 'explorers', emoji: '🎭', generator: 'pattern-match', prereqs: ['logic-patterns-hard'] },
  { id: 'logic-loops', subject: 'logic', band: 'builders', emoji: '🔁', screen: 'RoboPath', prereqs: [] },
  { id: 'logic-pattern-unit', subject: 'logic', band: 'builders', emoji: '🔍', generator: 'pattern-unit', prereqs: [] },
  { id: 'logic-growing', subject: 'logic', band: 'builders', emoji: '📈', generator: 'growing-patterns', prereqs: ['logic-pattern-unit'] },
  { id: 'logic-grids', subject: 'logic', band: 'masters', emoji: '🕵️', generator: 'logic-grids', prereqs: [] },
  { id: 'logic-pattern-position', subject: 'logic', band: 'masters', emoji: '🔢', generator: 'pattern-position', prereqs: [] },
  { id: 'logic-number-rules', subject: 'logic', band: 'masters', emoji: '🧮', generator: 'number-rules', prereqs: ['logic-pattern-position'] },

  // ---- Feelings Garden (CASEL 5: name feelings -> feelings in situations,
  // calming -> fairness and turn-taking -> perspective-taking) ----
  { id: 'sel-faces', subject: 'sel', band: 'sprouts', emoji: '😊', generator: 'feelings-faces', prereqs: [] },
  { id: 'sel-situations', subject: 'sel', band: 'explorers', emoji: '🤔', generator: 'feelings-situations', prereqs: [] },
  { id: 'sel-feelings-friends', subject: 'sel', band: 'explorers', emoji: '🐻', screen: 'FeelingsFriends', prereqs: ['sel-situations'] },
  { id: 'sel-fair-play', subject: 'sel', band: 'builders', emoji: '🤝', generator: 'fair-play', prereqs: [] },
  { id: 'sel-perspective', subject: 'sel', band: 'masters', emoji: '👟', generator: 'in-their-shoes', prereqs: [] },
];

const SKILLS_BY_ID = Object.fromEntries(SKILLS.map((skill) => [skill.id, skill]));

export function getSkill(skillId) {
  return SKILLS_BY_ID[skillId];
}

// Game screens that play a skill (they receive { skillId }).
export const SKILL_SCREENS = ['TracePath', 'PizzaShop', 'BirthdayCake', 'BunnyPop', 'FreezeZoo', 'RoboPath', 'PushRoll', 'FeelingsFriends', 'TraceDigits'];

export function isPlayable(skill) {
  return Boolean(skill && (skill.generator || skill.screen));
}

// Quiz skills can be mixed into Daily Review; game-screen skills can't.
export function isQuizSkill(skill) {
  return Boolean(skill && skill.generator);
}

// [routeName, params] for starting a skill.
export function skillRoute(skill) {
  return skill.screen ? [skill.screen, { skillId: skill.id }] : ['Quiz', { skillIds: [skill.id], mode: 'practice' }];
}

export function skillsFor({ subject, band } = {}) {
  return SKILLS.filter(
    (skill) => (!subject || skill.subject === subject) && (!band || skill.band === band)
  );
}
