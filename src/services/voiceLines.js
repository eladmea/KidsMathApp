// Every sentence the game says aloud in a language, for recording (see
// voice-generator/ and scripts/voice-lines.mjs):
//   - the spoken lines of the language files (found where scenes call
//     speak() / say(), plus every `say...` key), with each value a template
//     can take;
//   - the games' phrases from the content packs, over every value;
//   - the question sentences of the ages 3-6 skills (read aloud by default;
//     older children read for themselves, so theirs keep the device voice);
//   - the numbers 0-20, which games count out loud.
// Spoken text is kept to short, name-free sentences so each recording is
// reused: the game plays a recording per sentence and falls back to the
// device voice for anything missing.
import { GENERATORS, GENERATOR_PACK, generateQuestion } from '../curriculum/generators';
import { SKILLS, getSkill } from '../curriculum/skills';
import { SUBJECTS } from '../curriculum/subjects';
import { CUSTOMERS, TOPPINGS } from '../logic/writingGames';
import { FRIENDS } from '../logic/feelingsFriends';
import { NEEDS, SILLY_CHOICES } from '../logic/garden';
import { OTHERS } from '../logic/bunnyPop';
import { createDeck, getVariant } from '../logic/memoryGame';
import { PREWRITING_PATHS } from '../logic/tracing';
import { STEP_INFO } from '../logic/adventure';
import { answerLabel } from '../logic/quizRound';
import { splitSentences } from '../logic/voices';
import { content, hasContent } from '../content/index';
import { has, keysOf, list, raw, setLanguage, t } from '../i18n/index';
import { coachIntro, skillTitle, subjectName } from '../i18n/names';
import { clipId, clipUrl } from './voiceClips';

// Bands whose questions are read aloud by default (narration is on for ages 3-6).
const READ_ALOUD_BANDS = ['sprouts', 'explorers'];
const SAMPLES = 3000;
// An older children's skill saying at most this many sentences is recorded too.
const FEW_SENTENCES = 80;
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
// Round sizes of every game and quiz (for "You got 3 out of 5.").
const ROUND_TOTALS = [2, 3, 5, 6, 8, 10, 16, 24];
// Memory Chips variants for the ages that hear them.
const MEMORY_VARIANTS = ['dots', 'letters', 'classic'];

// Shown, never spoken, though a scene passes them to say() next to a spoken line.
const SHOWN = new Set([
  'island.chestSticker',
  'island.comingSoon',
  'stickers.sayCount',
  'mini.bubble.end',
  'mini.toss.end',
  'mini.dance.end',
  'mini.dance.best',
  'twoPlayer.turn',
  'tracing.startMarker',
  // Built from each question's letters (see the questions below).
  'quiz.blend',
]);

// The values of every template that is spoken: key -> [params].
function templateValues() {
  const titles = SKILLS.map((skill) => skillTitle(skill));
  const kinds = Object.keys(STEP_INFO).map((kind) => t(`adventure.kinds.${kind}`));
  const prereqSets = SKILLS.flatMap((skill) => subsets(skill.prereqs).map((ids) => list(ids.map((id) => skillTitle(getSkill(id))))));
  return {
    'adventure.sayNext': kinds.map((kind) => ({ kind })),
    'adventure.sayNextSkill': ['new', 'second'].flatMap((kind) => titles.map((title) => ({ kind: t(`adventure.kinds.${kind}`), title }))),
    'hubs.sayEarn': range(1, 2).map((count) => ({ count })),
    'hubs.earn': range(1, 2).map((count) => ({ count })),
    'mini.bubble.fact': (content('science').FUN_FACTS || []).map((fact) => ({ fact })),
    'pathRace.hop': range(1, 3).map((count) => ({ count })),
    'pathRace.hopTo': range(1, 20).map((square) => ({ square })),
    'results.sayScore': ROUND_TOTALS.flatMap((total) => range(0, total).map((score) => ({ score, total }))),
    'results.sayMastered': titles.map((title) => ({ titles: title })),
    'island.firstPlay': [...new Set(prereqSets)].map((skills) => ({ skills })),
    'roboPath.introLoops': range(1, 5).map((limit) => ({ limit })),
  };
}

function subsets(items) {
  return items.reduce((all, item) => all.concat(all.map((set) => [...set, item])), [[]]).filter((set) => set.length);
}

// Language-file keys a scene speaks: inside speak(...) / say(...) calls, in a
// `say:` hint, or named say*.
const SOURCES = import.meta.glob(['../scenes/*.js', '../ui/*.js', '../logic/quizRound.js'], { query: '?raw', import: 'default', eager: true });
function spokenKeys(language) {
  const keys = keysOf(language);
  const found = new Set(keys.filter((key) => /(^|\.)say[A-Z]?\w*$/.test(key) || /\.say\w*\./.test(key)));
  Object.values(SOURCES).forEach((source) => {
    source.split('\n').forEach((line) => {
      if (!/speak\(|\.say\(|\bsay:|resultLine|exampleSpeech/.test(line)) return;
      // Any key on the line, also those picked by a condition: t(ok ? 'a.b' : 'a.c').
      for (const [, key] of line.matchAll(/'(\w+\.[\w.]+)'/g)) if (has(key)) found.add(key);
      for (const [, template] of line.matchAll(/`(\w+\.[\w.]*\$\{[^}]+\}[\w.]*)`/g)) {
        const pattern = new RegExp(`^${template.replace(/\./g, '\\.').replace(/\$\{[^}]+\}/g, '[\\w]+')}$`);
        keys.filter((key) => pattern.test(key)).forEach((key) => found.add(key));
      }
    });
  });
  ['results.lines', 'curriculum.howTo', 'common.readToYou'].forEach((prefix) => keys.filter((key) => key === prefix || key.startsWith(`${prefix}.`)).forEach((key) => found.add(key)));
  return [...found].filter((key) => !SHOWN.has(key));
}

export function voiceLines(language, { samples = SAMPLES } = {}) {
  setLanguage(language);
  const lines = new Map();
  const missing = [];
  const add = (text, source) => {
    splitSentences(text).forEach((sentence) => {
      const entry = lines.get(sentence) || { text: sentence, source, count: 0 };
      entry.count += 1;
      lines.set(sentence, entry);
    });
  };

  // ---- the language files ----
  const values = templateValues();
  spokenKeys(language).forEach((key) => {
    const value = raw(key, language);
    const texts = typeof value === 'string' ? [value] : Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value).filter((v) => typeof v === 'string') : [];
    if (!texts.length) return;
    if (!texts.some((text) => text.includes('{'))) {
      texts.forEach((text) => add(text, key.startsWith('curriculum.howTo') ? 'how-to' : 'ui'));
    } else if (values[key]) {
      values[key].forEach((params) => add(t(key, params), 'ui template'));
    } else if (has(key)) {
      missing.push(key);
    }
  });
  add(coachIntro(), 'ui');
  SUBJECTS.forEach((subject) => add(subjectName(subject), 'island name'));
  range(0, 20).forEach((n) => add(String(n), 'number'));

  // ---- the games' phrases ----
  if (hasContent('math', language)) mathPhrases(content('math', language), add);
  if (hasContent('sel', language)) friendPhrases(content('sel', language), add);
  if (hasContent('science', language)) gardenPhrases(content('science', language), add);
  if (hasContent('logic', language)) {
    const { ANIMAL_NAMES, say } = content('logic', language);
    OTHERS.forEach((emoji) => add(say.bunnyOops({ animal: ANIMAL_NAMES[emoji] }), 'game: bunny pop'));
  }
  const literacy = hasContent('literacy', language) ? content('literacy', language) : null;
  if (literacy && literacy.SOUND_SPEECH) Object.values(literacy.SOUND_SPEECH).forEach((sound) => add(sound, 'letter sound'));
  if (hasContent('math', language)) memoryPhrases(content('math', language), literacy, add);

  // ---- questions ----
  // Ages 3-6 hear every question; older children's skills are recorded only
  // when they say few different sentences (stories, body parts, fair play),
  // not when every question has new numbers in it.
  const readAloud = new Set(SKILLS.filter((skill) => skill.generator && READ_ALOUD_BANDS.includes(skill.band)).map((skill) => skill.generator));
  const used = new Set(SKILLS.filter((skill) => skill.generator).map((skill) => skill.generator));
  Object.keys(GENERATORS).forEach((id) => {
    if (!used.has(id) || !hasContent(GENERATOR_PACK[id], language)) return;
    const found = new Map();
    const take = (text, source) => splitSentences(text).forEach((sentence) => found.set(sentence, found.get(sentence) || source));
    for (let i = 0; i < samples; i++) {
      const question = generateQuestion(id);
      take(question.speech, `question: ${id}`);
      take(question.explain || t('quiz.answerIs', { answer: answerLabel(question).replace(/ · /g, ', ') }), `explanation: ${id}`);
      (question.items || []).forEach((item) => take(item.caption, `caption: ${id}`));
      if (question.type === 'build' && literacy) take(t('quiz.blend', { sounds: question.parts.map((p) => literacy.SOUND_SPEECH[p] || p).join(', '), word: question.word }), `blend: ${id}`);
    }
    if (readAloud.has(id) || found.size <= FEW_SENTENCES) found.forEach((source, sentence) => add(sentence, source));
  });

  const result = [...lines.values()]
    .filter((entry) => entry.text.trim())
    .map((entry) => ({ ...entry, id: clipId(entry.text), recorded: Boolean(clipUrl(entry.text, language)) }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
  // Spoken templates with no values listed above (add them to templateValues).
  result.missingTemplates = missing;
  return result;
}

function mathPhrases({ NUMBER_WORDS, STROKE_NAMES, CUSTOMER_NAMES, TOPPING_NAMES, say }, add) {
  const digits = range(0, 9);
  const words = digits.map((digit) => ({ digit, word: NUMBER_WORDS[digit] }));
  words.forEach(({ word }) => {
    add(say.write.intro({ word }), 'game: writing');
    add(say.write.praise({ word }), 'game: writing');
    add(say.drive.intro({ word }), 'game: race track');
    add(say.drive.praise({ word }), 'game: race track');
  });
  PREWRITING_PATHS.forEach(({ id }) => add(say.fly.intro({ name: STROKE_NAMES[id] }), 'game: bee paths'));
  add(say.fly.praise(), 'game: bee paths');

  const pizza = say.pizza;
  const friends = CUSTOMERS.map((c) => CUSTOMER_NAMES[c.id]);
  const numbers = range(1, 9).map((number) => ({ number, word: NUMBER_WORDS[number] }));
  const toppings = TOPPINGS.map((topping) => TOPPING_NAMES[topping.id]);
  friends.forEach((friend) => {
    numbers.forEach(({ number, word }) => add(pizza.order({ friend, number, word }), 'game: pizza'));
    add(pizza.cutTwo({ friend }), 'game: pizza');
    add(pizza.idle.feed({ friend }), 'game: pizza');
    numbers.forEach(({ number, word }) => add(say.cake.intro({ friend, number, word }), 'game: cake'));
    add(say.cake.party({ friend }), 'game: cake');
  });
  numbers.forEach(({ number, word }) => {
    ['rolled', 'more', 'messy', 'written'].forEach((phrase) => add(pizza[phrase]({ word }), 'game: pizza'));
    add(pizza.cheesed({ number, word }), 'game: pizza');
    add(pizza.idle.trace({ word }), 'game: pizza');
    add(pizza.idle.placed({ number }), 'game: pizza');
    toppings.forEach((topping) => {
      add(pizza.picked({ number, word, topping }), 'game: pizza');
      add(pizza.right({ number, topping }), 'game: pizza');
    });
    add(say.cake.iced({ number, word }), 'game: cake');
    add(say.cake.right({ number }), 'game: cake');
    range(0, number - 1).forEach((placed) => add(pizza.tooFew({ number, placed }), 'game: pizza and cake'));
    range(number + 1, 12).forEach((placed) => add(pizza.tooMany({ number, placed }), 'game: pizza and cake'));
  });
  toppings.forEach((topping) => add(pizza.idle.place({ topping }), 'game: pizza'));
  range(1, 3).forEach((eaten) => add(pizza.ate({ eaten }), 'game: pizza'));
  ['sauced', 'ovenMiss', 'baking', 'ready', 'cutMiss', 'cutOne', 'allGone'].forEach((phrase) => add(pizza[phrase](), 'game: pizza'));
  ['dough', 'sauce', 'cheese', 'topping', 'oven', 'slice'].forEach((step) => add(pizza.idle[step]({}), 'game: pizza'));
}

function memoryPhrases({ say }, literacy, add) {
  const memory = say.memory;
  MEMORY_VARIANTS.forEach((variantId) => {
    // Several decks, so every picture a letter can have turns up.
    const faces = new Map();
    for (let i = 0; i < 30; i++) {
      createDeck(variantId, { letters: literacy && literacy.MEMORY_LETTERS }).forEach((card) => faces.set(`${card.value}:${card.face.kind}:${card.face.label}`, card));
    }
    const cards = [...faces.values()];
    cards.forEach((card) => add(memory.face(card.face), `game: memory ${variantId}`));
    cards.forEach((low) =>
      cards.forEach((high) => {
        if (low.value < high.value && high.value - low.value <= getVariant(variantId).pairCount) add(memory.gap({ low: memory.face(low.face), high: memory.face(high.face) }), `game: memory ${variantId}`);
      })
    );
  });
  add(memory.sayRight(), 'game: memory');
  range(1, 12).forEach((cost) => add(memory.sayWrong({ cost }), 'game: memory'));
}

function friendPhrases({ FRIENDS: WORDS, FEELINGS, say }, add) {
  const friends = say.friends;
  FRIENDS.forEach((friend) => {
    const { name, story, helps } = WORDS[friend.id];
    const feeling = FEELINGS[friend.feeling].word;
    add(friends.story({ name, story, question: friends.feelQuestion({ name }) }), 'game: feelings friends');
    add(friends.helpQuestion({ name }), 'game: feelings friends');
    add(friends.feelRight({ name, feeling }), 'game: feelings friends');
    add(friends.feelWrong({ name, feeling, story }), 'game: feelings friends');
    helps.forEach((helpful) => add(friends.helpWrong({ name, helpful }), 'game: feelings friends'));
  });
  add(friends.helpRight(), 'game: feelings friends');
}

function gardenPhrases({ GARDEN, say }, add) {
  const garden = say.garden;
  Object.keys(NEEDS).forEach((id) => {
    add(garden.look({ clue: GARDEN.choices[id].clue }), 'game: garden');
    GARDEN.stages.slice(1, -1).forEach((stage) => add(garden.grew({ reason: GARDEN.choices[id].reason, stage }).replace(/🌙/gu, ''), 'game: garden'));
  });
  [...Object.keys(NEEDS), ...Object.keys(SILLY_CHOICES)].forEach((id) => add(garden.wrong({ reason: GARDEN.choices[id].reason }), 'game: garden'));
  range(1, 20).forEach((flowers) => add(garden.bloomed({ flowers }).replace(/🌻/gu, ''), 'game: garden'));
}
