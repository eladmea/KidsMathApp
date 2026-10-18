// Word Woods in Hebrew: an adaptation of the reading curriculum, not a
// translation. It follows how Israeli kindergartens and first grade teach
// reading: letter names and first sounds (צליל פותח), rhymes, very common
// short words, building short words from letters, final letters (אותיות
// סופיות), prefix letters and endings (ו ה ב ל מ / ים ות / small-ending
// ון, לב-לב), and compound words.
//
// Nikud is used where early readers need it: letter names and sight words.
// Picture words and word-builder words are written without nikud, like the
// letter tiles.
//
// Skills whose English generator can't express the Hebrew version are
// replaced in `generators` below (same question shape, same answer checks).
import { pick, sample, shuffle } from '../../curriculum/random';

// How the narrator says each letter: its name (with nikud so text-to-speech
// reads it right: דָּלֶת is the letter, not the door). Isolated Hebrew
// sounds are not read reliably by text-to-speech; letter names are, and they
// are how Israeli children are taught to call the letters ("האות מֵם").
export const SOUND_SPEECH = {
  א: 'אָלֶף', ב: 'בֵּית', ג: 'גִּימֶל', ד: 'דָּלֶת', ה: 'הֵא', ו: 'וָו', ז: 'זַיִן',
  ח: 'חֵית', ט: 'טֵית', י: 'יוּד', כ: 'כָּף', ל: 'לָמֶד', מ: 'מֵם', נ: 'נוּן',
  ס: 'סָמֶךְ', ע: 'עַיִן', פ: 'פֵּא', צ: 'צָדִי', ק: 'קוּף', ר: 'רֵישׁ', ש: 'שִׁין', ת: 'תָּו',
  ך: 'כָּף סוֹפִית', ם: 'מֵם סוֹפִית', ן: 'נוּן סוֹפִית', ף: 'פֵּא סוֹפִית', ץ: 'צָדִי סוֹפִית',
};

export function soundSpeech(grapheme) {
  return SOUND_SPEECH[grapheme] || grapheme;
}

// Pictures by first letter. Only letters whose first sound is clear to a
// child, and never two letters that sound alike (כ/ק, ת/ט, ס/שׂ, א/ע, ב/ו,
// כ/ח), so "which letter does it start with?" has one answer by ear. כ words
// start with a hard k (כּ), ב with b (בּ), פ with p (פּ), ש with sh (שׁ).
export const FIRST_SOUND_WORDS = {
  מ: [['🚗', 'מכונית'], ['🔑', 'מפתח'], ['☂️', 'מטרייה'], ['🛏️', 'מיטה']],
  ס: [['🐴', 'סוס'], ['📖', 'ספר'], ['🧼', 'סבון'], ['🧺', 'סל']],
  ש: [['☀️', 'שמש'], ['⏰', 'שעון'], ['🦷', 'שן'], ['🦊', 'שועל']],
  ל: [['🍋', 'לימון'], ['❤️', 'לב'], ['🍞', 'לחם']],
  נ: [['🐍', 'נחש'], ['🕯️', 'נר'], ['🐜', 'נמלה'], ['👟', 'נעל']],
  ר: [['🚂', 'רכבת'], ['🦶', 'רגל'], ['🚦', 'רמזור'], ['🤖', 'רובוט']],
  ב: [['🍌', 'בננה'], ['🎈', 'בלון'], ['🏠', 'בית'], ['🦆', 'ברווז']],
  ד: [['🐟', 'דג'], ['🐻', 'דוב'], ['🐝', 'דבורה'], ['🪣', 'דלי']],
  ג: [['🐪', 'גמל'], ['🥕', 'גזר'], ['🍦', 'גלידה'], ['🎸', 'גיטרה']],
  פ: [['🐘', 'פיל'], ['🌸', 'פרח'], ['🦋', 'פרפר'], ['🍕', 'פיצה']],
  ת: [['🍎', 'תפוח'], ['🍓', 'תות'], ['🐓', 'תרנגול'], ['🦜', 'תוכי']],
  כ: [['🐶', 'כלב'], ['⚽', 'כדור'], ['⭐', 'כוכב'], ['🧢', 'כובע']],
  ז: [['🦓', 'זברה'], ['🫒', 'זית'], ['🐺', 'זאב']],
  י: [['🌙', 'ירח'], ['✋', 'יד'], ['👦', 'ילד']],
};

// The easiest first sounds to hear: continuous sounds you can stretch
// (מְמְמ, סְסְס, שְׁשְׁש, לְלְל, נְנְנ, רְרְר).
export const FIRST_SOUNDS_EARLY = ['מ', 'ס', 'ש', 'ל', 'נ', 'ר'];
export const FIRST_SOUNDS_ALL = Object.keys(FIRST_SOUND_WORDS);

// Rhyme families: every word in a family rhymes with the others.
// (Emoji are kept to Unicode 13 or older so they render on older devices.)
export const RHYME_FAMILIES = [
  [['🎈', 'בלון'], ['⏰', 'שעון'], ['🪟', 'חלון'], ['🍋', 'לימון'], ['🧼', 'סבון']],
  [['🐴', 'סוס'], ['🚌', 'אוטובוס']],
  [['🐍', 'נחש'], ['🍯', 'דבש']],
  [['🦶', 'רגל'], ['🚩', 'דגל']],
  [['🍬', 'סוכרייה'], ['☂️', 'מטרייה']],
  [['🐜', 'נמלה'], ['👰', 'כלה']],
  [['🎵', 'שיר'], ['🧱', 'קיר'], ['🏙️', 'עיר']],
  [['🏠', 'בית'], ['🫒', 'זית']],
  [['🐱', 'חתול'], ['🐌', 'שבלול']],
  [['🐦', 'ציפור'], ['🚦', 'רמזור']],
];

// Very common words for beginning readers (with nikud, as in first-grade
// books). הוּא / הִיא and זֶה / זֹאת side by side teach reading the vowels.
export const SIGHT_WORDS = [
  'שֶׁל', 'אֶת', 'זֶה', 'זֹאת', 'לֹא', 'כֵּן', 'יֵשׁ', 'אֵין', 'אֲנִי', 'הוּא', 'הִיא', 'גַּם',
  'מָה', 'מִי', 'עַל', 'עִם', 'כָּל', 'הֵם', 'אֲנַחְנוּ', 'פֹּה', 'שָׁם', 'טוֹב', 'הָיָה', 'הִנֵּה',
  'אֵיפֹה', 'לָמָּה',
];

// Word Builder: picture + the letters (tiles, in reading order, right to
// left) that spell it. Short regular words with no final letters.
export const CVC_WORDS = [
  ['🐟', 'דג'], ['🌊', 'גל'], ['🧺', 'סל'], ['✋', 'יד'], ['❤️', 'לב'], ['👨', 'אבא'],
  ['👩', 'אמא'], ['🐘', 'פיל'], ['🐴', 'סוס'], ['🍓', 'תות'], ['🏠', 'בית'], ['🥕', 'גזר'],
  ['🕯️', 'נר'], ['⛰️', 'הר'], ['🪣', 'דלי'], ['📖', 'ספר'], ['🍯', 'דבש'], ['🐍', 'נחש'],
  ['🌙', 'ירח'], ['🌸', 'פרח'], ['🫒', 'זית'], ['🦶', 'רגל'],
].map(([emoji, word]) => ({ emoji, word, tiles: [...word] }));

// Final letters (אותיות סופיות) in place of English digraphs: words that end
// in a final letter, built from tiles that include its regular twin.
export const DIGRAPH_WORDS = [
  ['🌊', 'ים'], ['💧', 'מים'], ['🍇', 'ענבים'], ['🌳', 'עץ'], ['🧃', 'מיץ'], ['🏹', 'חץ'],
  ['🦷', 'שן'], ['🎈', 'בלון'], ['⏰', 'שעון'], ['🪟', 'חלון'], ['🥄', 'כף'], ['🏖️', 'חוף'],
  ['🦉', 'ינשוף'], ['🤴', 'מלך'], ['🛣️', 'דרך'],
].map(([emoji, word]) => ({ emoji, word, tiles: [...word] }));

export const DIGRAPH_TILES = ['ך', 'ם', 'ן', 'ף', 'ץ', 'כ', 'מ', 'נ', 'פ', 'צ'];

// Each final letter and its regular form.
export const FINAL_TWINS = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

// Which final letter does the picture's word end with?
export const DIGRAPH_START_WORDS = {
  ך: [['🤴', 'מלך'], ['🛣️', 'דרך']],
  ם: [['💧', 'מים'], ['🌊', 'ים'], ['🍇', 'ענבים'], ['👖', 'מכנסיים']],
  ן: [['⏰', 'שעון'], ['🎈', 'בלון'], ['🦷', 'שן'], ['🪟', 'חלון'], ['🍋', 'לימון']],
  ף: [['🦉', 'ינשוף'], ['🥄', 'כף'], ['🏖️', 'חוף']],
  ץ: [['🌳', 'עץ'], ['🧃', 'מיץ'], ['🏹', 'חץ']],
};

// Letters a child can't tell apart by ear (and final/regular twins): a
// word-builder extra tile is never one of these next to a letter in the word.
export const SOUND_ALIKE = ['אעה', 'כקחך', 'תט', 'סש', 'בו', 'מם', 'נן', 'פף', 'צץ'];

// Story Strip: events in order (emoji + caption).
export const STORIES = [
  [['🥚', 'ביצה בתוך קן.'], ['🐣', 'הביצה נסדקת.'], ['🐥', 'האפרוח אומר ציף!'], ['🐔', 'האפרוח גדל ונהיה תרנגולת.']],
  [['🌰', 'שותלים זרע באדמה.'], ['🌱', 'נבט קטן מציץ.'], ['🌿', 'העלים גדלים.'], ['🌻', 'פרח פורח.']],
  [['🛁', 'מתרחצים באמבטיה.'], ['🪥', 'מצחצחים שיניים.'], ['📖', 'קוראים סיפור.'], ['😴', 'הולכים לישון.']],
  [['🍞', 'לוקחים שתי פרוסות לחם.'], ['🧈', 'מורחים חמאה.'], ['🥪', 'מכינים כריך.'], ['😋', 'אוכלים הכול!']],
  [['☁️', 'עננים אפורים בשמיים.'], ['🌧️', 'יורד גשם.'], ['☀️', 'השמש יוצאת.'], ['🌈', 'קשת בענן!']],
  [['🥚', 'ביצה קטנה על עלה.'], ['🐛', 'זחל יוצא מהביצה.'], ['🍃', 'הזחל אוכל הרבה עלים.'], ['🦋', 'הזחל נהיה פרפר.']],
  [['🎒', 'אורזים תיק לים.'], ['🏖️', 'מגיעים לחוף.'], ['🏰', 'בונים ארמון בחול.'], ['🌅', 'השמש שוקעת.']],
  [['🥣', 'מערבבים קמח וביצים.'], ['🔥', 'אופים בתנור.'], ['🎂', 'שמים נרות על העוגה.'], ['🎉', 'חוגגים יום הולדת!']],
];

// Word parts: prefix letters (ב ל מ ו), plural endings (ים ות), the small
// ending (ון, כלבלב) and "the one who does it" (צייר, שחקן).
export const WORD_PARTS = [
  ['בבית', 'בתוך הבית', ['אל הבית', 'מן הבית', 'בלי בית']],
  ['בכיתה', 'בתוך הכיתה', ['אל הכיתה', 'מן הכיתה', 'בלי כיתה']],
  ['לגן', 'אל הגן', ['בתוך הגן', 'מן הגן', 'בלי גן']],
  ['מהים', 'מן הים', ['אל הים', 'בתוך הים', 'ליד הים']],
  ['מהגן', 'מן הגן', ['אל הגן', 'בתוך הגן', 'ליד הגן']],
  ['וחתול', 'וגם חתול', ['בלי חתול', 'אל החתול', 'בתוך החתול']],
  ['ובננה', 'וגם בננה', ['בלי בננה', 'אל הבננה', 'בתוך הבננה']],
  ['ילדים', 'הרבה ילדים', ['ילד אחד', 'ילד קטן', 'בלי ילדים']],
  ['ספרים', 'הרבה ספרים', ['ספר אחד', 'ספר קטן', 'בלי ספרים']],
  ['בובות', 'הרבה בובות', ['בובה אחת', 'בובה קטנה', 'בלי בובות']],
  ['שולחנות', 'הרבה שולחנות', ['שולחן אחד', 'שולחן קטן', 'בלי שולחנות']],
  ['כלבלב', 'כלב קטן', ['כלב גדול', 'הרבה כלבים', 'כלב זקן']],
  ['חתלתול', 'חתול קטן', ['חתול גדול', 'הרבה חתולים', 'חתול זקן']],
  ['דובון', 'דוב קטן', ['דוב גדול', 'הרבה דובים', 'דוב זקן']],
  ['צייר', 'מי שמצייר', ['ציור קטן', 'הרבה ציורים', 'בלי ציור']],
  ['שחקן', 'מי שמשחק', ['משחק קטן', 'הרבה משחקים', 'בלי משחק']],
  ['גנן', 'מי שעובד בגינה', ['גינה קטנה', 'הרבה גינות', 'בלי גינה']],
];

// Compound words (מילים מורכבות) and the two words they are made of. Some
// join the words whole (כדור + סל), some drop or change a letter at the
// seam (כדור + רגל = כדורגל, רם + קול = רמקול).
export const COMPOUND_WORDS = [
  ['כדורגל', ['כדור', 'רגל']],
  ['כדורסל', ['כדור', 'סל']],
  ['כדורעף', ['כדור', 'עף']],
  ['כדוריד', ['כדור', 'יד']],
  ['רמזור', ['רמז', 'אור']],
  ['מגדלור', ['מגדל', 'אור']],
  ['קולנוע', ['קול', 'נוע']],
  ['אופנוע', ['אופן', 'נוע']],
  ['רמקול', ['רם', 'קול']],
  ['מדחום', ['מד', 'חום']],
  ['שמרטף', ['שמר', 'טף']],
];

export const ALPHABET = [...'אבגדהוזחטיכלמנסעפצקרשת'];

// "טבעת. עץ. או עז": a spoken list of options, one short sentence per
// option, so each can be recorded once and reused in every question.
export function listWords(words) {
  if (words.length === 1) return words[0];
  return words.map((word, i) => (i === words.length - 1 ? `או ${word}` : word)).join('. ');
}

// Memory Chips' Letter Chips: letter value (א = 1) -> the letter and
// pictures that start with it.
export const MEMORY_LETTERS = {
  1: ['א', [['🍉', 'אבטיח'], ['🦁', 'אריה'], ['✈️', 'אווירון']]],
  2: ['ב', [['🍌', 'בננה'], ['🎈', 'בלון'], ['🏠', 'בית']]],
  3: ['ג', [['🐪', 'גמל'], ['🥕', 'גזר'], ['🍦', 'גלידה']]],
  4: ['ד', [['🐟', 'דג'], ['🐻', 'דוב'], ['🐝', 'דבורה']]],
  5: ['ה', [['⛰️', 'הר'], ['🦛', 'היפופוטם'], ['🍔', 'המבורגר']]],
  6: ['ו', [['🌹', 'ורד'], ['🧇', 'וופל']]],
};

export const say = {
  rhymes: {
    prompt: ({ target }) => `מה מתחרז עם ${target}?`,
    speech: ({ target, names }) => `מה מתחרז עם ${target}? ${names}?`,
    explain: ({ target, match }) => `המילים ${target} ו${match} מתחרזות. הן נגמרות באותו צליל.`,
  },
  soundSnack: {
    prompt: ({ sound }) => `תנו לי ${sound}!`,
    speech: ({ sound, example, names }) => `האכילו את המפלצת במשהו שמתחיל באות ${sound}. כמו ${example}. ${names}?`,
    explain: ({ word, sound }) => `המילה ${word} מתחילה באות ${sound}!`,
  },
  letterSays: {
    prompt: () => 'איזו אות היא…',
    speech: ({ sound, example }) => `איזו אות היא ${sound}? כמו במילה ${example}.`,
  },
  startsWith: {
    prompt: () => 'מתחילה באות…',
    letterSpeech: ({ word }) => `באיזו אות מתחילה המילה ${word}?`,
    soundSpeech: ({ word }) => `באיזו אות מתחילה המילה ${word}?`,
  },
  finals: {
    prompt: () => 'נגמרת באות…',
    speech: ({ word }) => `באיזו אות סופית נגמרת המילה ${word}?`,
    explain: ({ word, letter }) => `המילה ${word} נגמרת באות ${letter}.`,
  },
  sightWord: {
    prompt: () => 'מצאו את המילה',
    speech: ({ word }) => `מצאו את המילה. ${word}.`,
  },
  build: {
    prompt: () => 'בנו את המילה',
    speech: ({ word }) => `בנו את המילה. ${word}.`,
  },
  story: {
    prompt: () => 'סדרו את הסיפור',
    speech: () => 'סדרו את הסיפור. לחצו על מה שקורה קודם.',
  },
  wordParts: {
    prompt: ({ word }) => `מה פירוש המילה "${word}"?`,
    speech: ({ word }) => `מה פירוש המילה ${word}?`,
  },
  compound: {
    prompt: ({ word }) => `מאילו שתי מילים בנויה "${word}"?`,
    speech: ({ word }) => `מאילו שתי מילים בנויה המילה ${word}?`,
  },
};

// ---- Hebrew generators (replace the English ones of the same id) ----

// Letters that sound like `letter` (itself included).
function soundAlikes(letter) {
  const group = SOUND_ALIKE.find((letters) => letters.includes(letter));
  return group ? [...group] : [letter];
}

// A word-builder question. Extra tiles are never in the word and never sound
// like a letter in it (so building by ear has one answer), except `forced`
// extras, which are the point of the question (a final letter's twin).
function buildQuestion(entry, pool, forced = []) {
  const banned = new Set(entry.tiles.flatMap((tile) => soundAlikes(tile)));
  const must = forced.filter((tile) => !entry.tiles.includes(tile)).slice(0, 2);
  const extras = [...must, ...sample(pool.filter((tile) => !banned.has(tile) && !must.includes(tile)), 2 - must.length)];
  return {
    type: 'build',
    prompt: say.build.prompt(),
    speech: say.build.speech({ word: entry.word }),
    visual: { type: 'picture', emoji: entry.emoji, caption: null },
    word: entry.word,
    parts: entry.tiles,
    tiles: shuffle([...entry.tiles, ...extras]).map((text, id) => ({ id, text })),
    answer: entry.word,
    choices: [],
    speakAlways: true,
  };
}

function wordBuilder() {
  return buildQuestion(pick(CVC_WORDS), ALPHABET);
}

// Build a word that ends in a final letter; the regular form of that letter
// is always one of the extra tiles.
function finalLetterBuilder() {
  const entry = pick(DIGRAPH_WORDS);
  const last = entry.tiles[entry.tiles.length - 1];
  return buildQuestion(entry, DIGRAPH_TILES, [FINAL_TWINS[last]]);
}

// Which final letter does the word end with? (Four of the five.)
function finalLetters() {
  const finals = Object.keys(DIGRAPH_START_WORDS);
  const letter = pick(finals);
  const [emoji, word] = pick(DIGRAPH_START_WORDS[letter]);
  return {
    prompt: say.finals.prompt(),
    speech: say.finals.speech({ word }),
    visual: { type: 'picture', emoji, caption: null },
    answer: letter,
    explain: say.finals.explain({ word, letter: soundSpeech(letter) }),
    choices: shuffle([letter, ...sample(finals.filter((l) => l !== letter), 3)]),
    choiceStyle: 'letter',
    speakAlways: true,
  };
}

// The right two words, and wrong ones made by cutting the written word in
// the wrong place (never at the seam, which for a word like כדורגל would
// give a real-looking but wrong "כדור + גל").
export function compoundChoices(word, [first, second]) {
  const correct = `${first} + ${second}`;
  const seam = first.length;
  const wrong = [seam - 1, seam + 1, seam - 2, seam + 2, seam - 3, seam + 3]
    .filter((i) => i >= 1 && i <= word.length - 1)
    .map((i) => `${word.slice(0, i)} + ${word.slice(i)}`)
    .filter((text) => text !== correct);
  return { correct, wrong };
}

function compoundWords() {
  const [word, parts] = pick(COMPOUND_WORDS);
  const { correct, wrong } = compoundChoices(word, parts);
  return {
    prompt: say.compound.prompt({ word }),
    speech: say.compound.speech({ word }),
    visual: null,
    answer: correct,
    choices: shuffle([correct, ...wrong.slice(0, 3)]),
    choiceStyle: 'word',
  };
}

export const generators = {
  'word-builder': wordBuilder,
  'digraph-starts': finalLetters,
  'digraph-builder': finalLetterBuilder,
  'compound-words': compoundWords,
};
