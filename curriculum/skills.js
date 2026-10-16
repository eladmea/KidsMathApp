// The skill map: ordered learning-trajectory steps per subject and age band.
// `prereqs` follow the developmental order (e.g. subitize/count -> compare ->
// add). Prerequisites outside a child's band are treated as already met, so a
// 7-year-old isn't sent back to counting apples. Skills without a `generator`
// are planned for a later phase and show as "coming soon".
export const SKILLS = [
  // ---- Number Island: Sprouts (3-4) ----
  { id: 'math-count-5', subject: 'math', band: 'sprouts', title: 'Count to 5', emoji: '🖐️', generator: 'count-5', prereqs: [] },
  { id: 'math-shapes', subject: 'math', band: 'sprouts', title: 'Find the Shape', emoji: '🔺', generator: 'shapes', prereqs: [] },
  { id: 'math-count-10', subject: 'math', band: 'sprouts', title: 'Count to 10', emoji: '🔟', generator: 'count-10', prereqs: ['math-count-5'] },
  { id: 'math-more-less', subject: 'math', band: 'sprouts', title: 'Which Has More?', emoji: '⚖️', generator: 'more-less', prereqs: ['math-count-5'] },
  { id: 'math-quick-look-5', subject: 'math', band: 'sprouts', title: 'Quick Look', emoji: '👀', generator: 'quick-look-5', prereqs: ['math-count-5'] },

  // ---- Number Island: Explorers (5-6) ----
  { id: 'math-next-number', subject: 'math', band: 'explorers', title: 'What Comes Next?', emoji: '➡️', generator: 'next-number', prereqs: ['math-count-10'] },
  { id: 'math-bigger-number', subject: 'math', band: 'explorers', title: 'Bigger Number', emoji: '🐊', generator: 'bigger-number', prereqs: ['math-next-number'] },
  { id: 'math-quick-look-10', subject: 'math', band: 'explorers', title: 'Quick Look: Ten Frame', emoji: '👀', generator: 'quick-look-10', prereqs: ['math-quick-look-5'] },
  { id: 'math-number-line-10', subject: 'math', band: 'explorers', title: 'Number Line Drop', emoji: '🪂', generator: 'number-line-10', prereqs: ['math-next-number'] },
  { id: 'math-add-10', subject: 'math', band: 'explorers', title: 'Add within 10', emoji: '➕', generator: 'add-10', prereqs: ['math-more-less'] },
  { id: 'math-sub-10', subject: 'math', band: 'explorers', title: 'Take Away within 10', emoji: '➖', generator: 'sub-10', prereqs: ['math-add-10'] },

  // ---- Number Island: Builders (7-8) ----
  { id: 'math-add-20', subject: 'math', band: 'builders', title: 'Add within 20', emoji: '➕', generator: 'add-20', prereqs: ['math-add-10'] },
  { id: 'math-sub-20', subject: 'math', band: 'builders', title: 'Subtract within 20', emoji: '➖', generator: 'sub-20', prereqs: ['math-sub-10', 'math-add-20'] },
  { id: 'math-add-100', subject: 'math', band: 'builders', title: 'Add within 100', emoji: '💯', generator: 'add-100', prereqs: ['math-add-20'] },
  { id: 'math-sub-100', subject: 'math', band: 'builders', title: 'Subtract within 100', emoji: '🧮', generator: 'sub-100', prereqs: ['math-sub-20', 'math-add-100'] },
  { id: 'math-mult-2-5-10', subject: 'math', band: 'builders', title: 'Times 2, 5 & 10', emoji: '✖️', generator: 'mult-2-5-10', prereqs: ['math-add-20'] },
  { id: 'math-number-line-100', subject: 'math', band: 'builders', title: 'Number Line Drop: 100', emoji: '🪂', generator: 'number-line-100', prereqs: ['math-number-line-10'] },

  // ---- Number Island: Masters (9-10) ----
  { id: 'math-mult-10', subject: 'math', band: 'masters', title: 'Times Tables to 10', emoji: '✖️', generator: 'mult-10', prereqs: ['math-mult-2-5-10'] },
  { id: 'math-div-10', subject: 'math', band: 'masters', title: 'Divide within 100', emoji: '➗', generator: 'div-10', prereqs: ['math-mult-10'] },
  { id: 'math-mult-12', subject: 'math', band: 'masters', title: 'Big Times Tables', emoji: '🚀', generator: 'mult-12', prereqs: ['math-mult-10'] },
  { id: 'math-div-12', subject: 'math', band: 'masters', title: 'Big Division', emoji: '🪐', generator: 'div-12', prereqs: ['math-div-10', 'math-mult-12'] },
  { id: 'math-number-line-1000', subject: 'math', band: 'masters', title: 'Number Line Drop: 1000', emoji: '🪂', generator: 'number-line-1000', prereqs: ['math-number-line-100'] },

  // ---- Word Woods (Phase 2) ----
  { id: 'lit-rhymes', subject: 'literacy', band: 'sprouts', title: 'Rhyme Time', emoji: '🎵', generator: null, prereqs: [] },
  { id: 'lit-first-sound', subject: 'literacy', band: 'sprouts', title: 'Sound Snack', emoji: '👄', generator: null, prereqs: ['lit-rhymes'] },
  { id: 'lit-letter-sounds', subject: 'literacy', band: 'explorers', title: 'Letter Sounds', emoji: '🔤', generator: null, prereqs: ['lit-first-sound'] },
  { id: 'lit-word-builder', subject: 'literacy', band: 'explorers', title: 'Word Builder', emoji: '🧱', generator: null, prereqs: ['lit-letter-sounds'] },
  { id: 'lit-story-strip', subject: 'literacy', band: 'builders', title: 'Story Strip', emoji: '📖', generator: null, prereqs: [] },
  { id: 'lit-word-parts', subject: 'literacy', band: 'masters', title: 'Word Parts', emoji: '🔍', generator: null, prereqs: [] },

  // ---- Nature Bay (Phase 3) ----
  { id: 'sci-weather', subject: 'science', band: 'sprouts', title: 'Dress for Weather', emoji: '☔', generator: null, prereqs: [] },
  { id: 'sci-garden', subject: 'science', band: 'explorers', title: 'Garden Days', emoji: '🌻', generator: null, prereqs: [] },
  { id: 'sci-push-pull', subject: 'science', band: 'explorers', title: 'Push & Roll', emoji: '⚽', generator: null, prereqs: [] },
  { id: 'sci-life-cycles', subject: 'science', band: 'builders', title: 'Life Cycles', emoji: '🦋', generator: null, prereqs: [] },
  { id: 'sci-ecosystems', subject: 'science', band: 'masters', title: 'Food Chains', emoji: '🦉', generator: null, prereqs: [] },

  // ---- Puzzle Peak (Phase 3) ----
  { id: 'logic-freeze-zoo', subject: 'logic', band: 'sprouts', title: 'Freeze Zoo', emoji: '🦒', generator: null, prereqs: [] },
  { id: 'logic-robo-path', subject: 'logic', band: 'explorers', title: 'Robo Path', emoji: '🤖', generator: null, prereqs: [] },
  { id: 'logic-loops', subject: 'logic', band: 'builders', title: 'Robot Loops', emoji: '🔁', generator: null, prereqs: [] },
  { id: 'logic-grids', subject: 'logic', band: 'masters', title: 'Logic Grids', emoji: '🗺️', generator: null, prereqs: [] },

  // ---- Feelings Garden (Phase 4) ----
  { id: 'sel-faces', subject: 'sel', band: 'sprouts', title: 'Feelings Faces', emoji: '😊', generator: null, prereqs: [] },
  { id: 'sel-situations', subject: 'sel', band: 'explorers', title: 'How Would You Feel?', emoji: '🤔', generator: null, prereqs: [] },
  { id: 'sel-fair-play', subject: 'sel', band: 'builders', title: 'Fair Play', emoji: '🤝', generator: null, prereqs: [] },
  { id: 'sel-perspective', subject: 'sel', band: 'masters', title: 'In Their Shoes', emoji: '👟', generator: null, prereqs: [] },
];

const SKILLS_BY_ID = Object.fromEntries(SKILLS.map((skill) => [skill.id, skill]));

export function getSkill(skillId) {
  return SKILLS_BY_ID[skillId];
}

export function isPlayable(skill) {
  return Boolean(skill && skill.generator);
}

export function skillsFor({ subject, band } = {}) {
  return SKILLS.filter(
    (skill) => (!subject || skill.subject === subject) && (!band || skill.band === band)
  );
}
