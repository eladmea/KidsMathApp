// Puzzle Peak in Hebrew: the things patterns are made of, names and pets
// for logic grids, and how each question is said.

// Pattern things: [emoji, spoken name].
export const PATTERN_SETS = [
  [['🔴', 'אדום'], ['🔵', 'כחול'], ['🟡', 'צהוב']],
  [['🍎', 'תפוח'], ['🍌', 'בננה'], ['🍇', 'ענבים']],
  [['🐶', 'כלב'], ['🐱', 'חתול'], ['🐭', 'עכבר']],
  [['⭐', 'כוכב'], ['🌙', 'ירח'], ['☀️', 'שמש']],
  [['🟥', 'ריבוע אדום'], ['🟩', 'ריבוע ירוק'], ['🟦', 'ריבוע כחול']],
];

export const NAMES = ['נועה', 'איתי', 'מאיה', 'יונתן', 'תמר', 'אורי'];
export const PETS = [['🐶', 'כלב'], ['🐱', 'חתול'], ['🐟', 'דג'], ['🐰', 'ארנב'], ['🐢', 'צב']];

// One short sentence per thing ("כלב. חתול. משהו."), so each word is
// recorded once and reused in every pattern.
const spoken = (names) => names.join('. ');

// Pattern structure letters in Hebrew: "A A B" -> "א א ב".
const HEBREW_LETTERS = { A: 'א', B: 'ב', C: 'ג' };
const hebrewLetters = (letters) => letters.replace(/[ABC]/g, (letter) => HEBREW_LETTERS[letter]);

// Bunny Pop and Freeze Zoo's animals, by emoji.
export const ANIMAL_NAMES = {
  '🐸': 'צפרדע',
  '🐷': 'חזיר',
  '🐱': 'חתול',
  '🐶': 'כלב',
  '🐵': 'קוף',
  '🦊': 'שועל',
  '🐼': 'פנדה',
  '🐔': 'תרנגולת',
  '🐰': 'ארנבון',
  '🦁': 'אריה',
  '🦉': 'ינשוף',
};
const FEMININE_ANIMALS = new Set(['צפרדע', 'פנדה', 'תרנגולת']);

export const say = {
  // Bunny Pop: tapped an animal that isn't the bunny.
  bunnyOops: ({ animal }) => `${FEMININE_ANIMALS.has(animal) ? 'זאת' : 'זה'} ה${animal}. נוגעים רק בארנבון!`,
  gap: 'משהו',
  missing: { prompt: () => 'מה חסר?', question: () => 'מה חסר במקום הריק?' },
  next: { prompt: () => 'מה בא אחר כך?', question: () => 'מה בא אחר כך?' },
  pattern: {
    speech: ({ names, question }) => `${spoken(names)}. ${question}`,
    explainAB: ({ a, b, answer }) => `זה הולך ${a}, ${b}, ${a}, ${b}… אז כאן צריך ${answer}!`,
    explainCore: ({ core, answer }) => `החלק שחוזר הוא: ${spoken(core)}. אז כאן צריך ${answer}.`,
  },
  match: {
    prompt: () => 'מצאו את אותו הדפוס!',
    speech: () => 'הסתכלו על הדפוס. באיזו שורה יש אותו דפוס, עם דברים אחרים?',
    explain: ({ letters }) => `בשתיהן זה הולך ${hebrewLetters(letters)}, ${hebrewLetters(letters)}: אותו דפוס עם דברים חדשים.`,
  },
  unit: {
    prompt: () => 'איזה חלק חוזר?',
    speech: () => 'איזה חלק בדפוס חוזר שוב ושוב?',
    explain: ({ names }) => `${spoken(names)}. החלק הזה חוזר שוב ושוב.`,
  },
  growing: {
    prompt: () => 'כמה יהיו בשלב הבא?',
    speech: ({ steps }) => `בשלב הראשון יש ${steps[0]}. בשלב השני יש ${steps[1]}. בשלב השלישי יש ${steps[2]}. כמה יהיו בשלב הרביעי?`,
    explain: ({ add, last, answer }) => `בכל שלב מוסיפים ${add}: ${last} + ${add} = ${answer}.`,
  },
  position: {
    prompt: ({ position }) => `מה יהיה במקום ${position}?`,
    speech: ({ position }) => `הדפוס ממשיך. מה יהיה במקום ${position}?`,
    explain: ({ length, position, answer }) => `הדפוס חוזר כל ${length} מקומות. קופצים ${length} בכל פעם: במקום ${position} יוצא ${answer}.`,
  },
  rules: {
    speech: ({ terms }) => `${terms.join(', ')}. מה בא אחר כך?`,
    explain: ({ rule, next }) => `${rule}, אז המספר הבא הוא ${next}.`,
    double: () => 'בכל פעם כופלים ב-2 (× 2)',
    growingSteps: () => 'מוסיפים 1, אחר כך 2, אחר כך 3, אחר כך 4, אחר כך 5',
    zigzag: () => 'עולים 3, יורדים 1, עולים 3, יורדים 1',
    squares: () => 'אלה מספרים ריבועיים (1×1, 2×2, 3×3…)',
    addEach: ({ step }) => `בכל פעם מוסיפים ${step}`,
  },
  grid: {
    clue: ({ name, has, pet }) => `ל${name} ${has ? 'יש' : 'אין'} ${pet}.`,
    prompt: ({ clues, name }) => `${clues.join('\n')}\nאיזו חיה יש ל${name}?`,
    speech: ({ clues, name }) => `${clues.join(' ')} איזו חיה יש ל${name}?`,
  },
};
