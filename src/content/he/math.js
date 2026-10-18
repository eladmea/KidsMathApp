// Number Island in Hebrew: things to count, shapes, and how each math
// question is said. Hebrew counts nouns by gender (שלושה תפוחים / שלוש
// מכוניות), so every counted noun here has `gender` ('m' or 'f'), and the
// helpers below put the number in the right form and place ("תפוח אחד",
// "שני תפוחים", "שתי מכוניות"). Numbers above 10 are written as digits.

// Things to count. `one` / `many` are the word for 1 and for more.
export const OBJECTS = [
  { emoji: '🍎', one: 'תפוח', many: 'תפוחים', gender: 'm' },
  { emoji: '⭐', one: 'כוכב', many: 'כוכבים', gender: 'm' },
  { emoji: '🐟', one: 'דג', many: 'דגים', gender: 'm' },
  { emoji: '🎈', one: 'בלון', many: 'בלונים', gender: 'm' },
  { emoji: '🐞', one: 'פרת משה רבנו', many: 'פרות משה רבנו', gender: 'f' },
  { emoji: '🌸', one: 'פרח', many: 'פרחים', gender: 'm' },
  { emoji: '🚗', one: 'מכונית', many: 'מכוניות', gender: 'f' },
  { emoji: '🍪', one: 'עוגייה', many: 'עוגיות', gender: 'f' },
];

export const SHAPES = [
  { emoji: '🔴', name: 'עיגול' },
  { emoji: '🟦', name: 'ריבוע' },
  { emoji: '🔺', name: 'משולש' },
  { emoji: '⭐', name: 'כוכב' },
  { emoji: '❤️', name: 'לב' },
  { emoji: '🔷', name: 'מעוין' },
];

// Number words, 0-9 (the writing games say them): the counting forms, as
// one names a digit.
export const NUMBER_WORDS = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];

// The pre-writing strokes of Bee Paths, by id (logic/tracing.js PREWRITING_PATHS).
// Said after "fly": "עופו ישר למטה!".
export const STROKE_NAMES = {
  down: 'ישר למטה',
  across: 'ישר הצידה',
  rainbow: 'כמו קשת',
  circle: 'בעיגול',
  cross: 'כמו פלוס',
  slide: 'כמו מגלשה',
};

// Pizza Shop and Birthday Cake: the animals who order, and the toppings
// (logic/writingGames.js CUSTOMERS / TOPPINGS, by id). `card` labels the
// topping's button.
export const CUSTOMER_NAMES = { bear: 'דובי', bunny: 'ארנבי', fox: 'שועלי', panda: 'פנדי', frog: 'צפרדי', monkey: 'קופי', lion: 'אריה', pig: 'חזרזיר' };
export const TOPPING_NAMES = {
  olive: { one: 'זית', many: 'זיתים', card: 'זיתים', gender: 'm' },
  corn: { one: 'גרגר תירס', many: 'גרגרי תירס', card: 'תירס', gender: 'm' },
  mushroom: { one: 'פטרייה', many: 'פטריות', card: 'פטריות', gender: 'f' },
  pineapple: { one: 'חתיכת אננס', many: 'חתיכות אננס', card: 'אננס', gender: 'f' },
};

// Nouns the phrases count.
const TOPPING = { one: 'תוספת', many: 'תוספות', gender: 'f' };
const SLICE = { one: 'פרוסה', many: 'פרוסות', gender: 'f' };
const CANDLE = { one: 'נר', many: 'נרות', gender: 'm' };
const DOT = { one: 'נקודה', many: 'נקודות', gender: 'f' };
const CHIP = { one: 'אסימון', many: 'אסימונים', gender: 'm' };
const PAIR = { one: 'זוג', many: 'זוגות', gender: 'm' };

// 3-10 before a noun, by the noun's gender.
const BEFORE = {
  m: ['', '', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה'],
  f: ['', '', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'],
};

// "תפוח אחד", "שני תפוחים", "שלוש מכוניות", "12 תפוחים".
function count(n, noun) {
  const gender = noun.gender === 'f' ? 'f' : 'm';
  if (n === 1) return `${noun.one} ${gender === 'f' ? 'אחת' : 'אחד'}`;
  if (n >= 2 && n <= 10) return `${BEFORE[gender][n]} ${noun.many}`;
  return `${n} ${noun.many}`;
}

// The same with digits, for text that is only shown: "אסימון אחד", "3 אסימונים".
function shown(n, noun) {
  return n === 1 ? count(1, noun) : `${n} ${noun.many}`;
}

const upTo = (n) => Array.from({ length: n }, (_, i) => i + 1).join(', ');

// "מ" in front of a word ("מהאות א"), with a hyphen in front of digits and
// symbols ("מ-7").
const from = (text) => (/^[֐-׿]/.test(text) ? `מ${text}` : `מ-${text}`);

// Spoken counts shared by Pizza Shop and Birthday Cake: short sentences
// without names, so each is recorded once.
const toppingsPlease = ({ number }) => `${count(number, TOPPING)}, בבקשה!`;
const tooFew = ({ number, placed }) => `צריך ${number}. יש לנו ${placed}. הוסיפו עוד ${number - placed}!`;
const tooMany = ({ number, placed }) => `יותר מדי! צריך ${number}. הורידו ${placed - number}.`;

export const say = {
  // Writing games (Write 1 to 5, Race Track, Bee Paths).
  write: {
    prompt: ({ digit }) => `כתבו ${digit}`,
    intro: ({ word }) => `בואו נכתוב ${word}! הסתכלו עליי, ואז התחילו בנקודה הירוקה.`,
    praise: ({ word }) => `${word}! כתבתם ${word}!`,
    celebrate: ({ digit, emoji }) => (digit === 0 ? '0: אין כלום! 🫙' : `${digit}! ${emoji.repeat(digit)}`),
  },
  drive: {
    prompt: ({ digit }) => `סעו על ה-${digit}!`,
    intro: ({ word }) => `בואו ניסע על המספר ${word}! מתחילים ברמזור.`,
    praise: ({ word }) => `ברררום! נסעתם על המספר ${word}!`,
  },
  fly: {
    prompt: ({ name }) => `עופו ${name}!`,
    intro: ({ name }) => `עזרו לדבורה לעוף ${name} אל הפרח. מתחילים בצנצנת הדבש.`,
    praise: () => 'בזזז! הדבורה מצאה את הפרח!',
  },
  // Pizza Shop. `word` is the number's word, `friend` the customer's name,
  // `topping` a TOPPING_NAMES entry.
  pizza: {
    order: ({ friend, number }) => `${friend} רוצה פיצה! ${toppingsPlease({ number })} קודם, שפשפו את הבצק כדי לרדד אותו.`,
    rolled: ({ word }) => `יופי של רידוד! עכשיו כתבו ${word} ברוטב. לכו לפי הנקודות.`,
    more: () => 'עוד קצת! כסו את כל המספר.',
    messy: () => 'אופס, הרוטב נמרח לכל מקום! נסו להישאר על המספר.',
    written: ({ word }) => `${word}! עכשיו מרחו את הרוטב על כל הפיצה באצבע.`,
    sauced: () => 'איזה רוטב! עכשיו פזרו גבינה על כל הפיצה.',
    cheesed: ({ number }) => `איזו גבינה! עכשיו בחרו תוספת. ${toppingsPlease({ number })}`,
    picked: ({ number, topping }) => `שימו ${count(number, topping)} על הפיצה. גררו מהמגש.`,
    right: ({ number, topping }) => `${count(number, topping)}! עכשיו גררו את הפיצה לתנור.`,
    tooFewShow: ({ friend, number, placed }) => `${friend} רוצה ${number}. יש לנו ${placed}. הוסיפו עוד!`,
    tooFew: ({ number, placed }) => tooFew({ number, placed }),
    tooManyShow: ({ friend, number }) => `יותר מדי! ${friend} רוצה ${number}. הורידו אחד.`,
    tooMany: ({ number, placed }) => tooMany({ number, placed }),
    ovenMiss: () => 'גררו את הפיצה עד הסוף לתוך התנור!',
    baking: () => 'לתנור! עכשיו נהיה חם…',
    ready: () => 'דינג! הפיצה מוכנה. העבירו אצבע מצד לצד כדי לחתוך אותה לפרוסות.',
    cutMiss: () => 'העבירו את האצבע מצד לצד, לאורך כל הפיצה!',
    cutOne: () => 'צ׳יק! עוד חיתוך אחד.',
    cutTwo: ({ friend }) => `ארבע פרוסות! תנו את הפרוסות ל${friend}. גררו אותן אחת אחת.`,
    ate: ({ eaten }) => `${count(eaten, SLICE)}! יאמי!`,
    allGone: () => 'ארבע פרוסות! הכול נגמר! תודה, היה טעים!',
    // What the bubble says at each step.
    show: {
      dough: () => '👐 שפשפו את הבצק כדי לרדד אותו!',
      trace: ({ number }) => `כתבו ${number} ברוטב 🥄`,
      sauce: () => '👆 מרחו את הרוטב על כל הפיצה!',
      cheese: () => '🧀 עכשיו גבינה! פזרו על כל הפיצה',
      topping: () => 'בחרו תוספת!',
      place: ({ number }) => `שימו ${number} על הפיצה`,
      oven: () => '🔥 גררו את הפיצה לתנור!',
      baking: () => '🔥 נאפית…',
      slice: ({ cuts }) => `🔪 העבירו אצבע כדי לחתוך (${cuts}/2)`,
      feed: ({ eaten }) => `תנו לי את הפרוסות! (${eaten}/4)`,
      done: () => '😋 יאמי! תודה!',
    },
    // Said when the idle arrow appears.
    idle: {
      dough: () => 'שפשפו את הבצק באצבע כדי לרדד אותו!',
      trace: ({ word }) => `כתבו ${word} באצבע. לכו לפי הנקודות.`,
      sauce: () => 'שפשפו באצבע על כל הפיצה כדי למרוח את הרוטב.',
      cheese: () => 'שפשפו באצבע על כל הפיצה כדי לפזר את הגבינה.',
      topping: () => 'לחצו על תוספת שאתם אוהבים.',
      place: ({ topping }) => `גררו ${topping.one} מהמגש אל הפיצה.`,
      placed: ({ number }) => `${number}! עכשיו לחצו על כפתור הסיום.`,
      oven: () => 'גררו את הפיצה לתנור.',
      slice: () => 'העבירו את האצבע מצד לצד על הפיצה כדי לחתוך אותה.',
      feed: ({ friend }) => `גררו פרוסה ל${friend}.`,
    },
  },
  // Memory Chips: how a card is read aloud (logic/memoryGame.js faces), and
  // the chip-gap question.
  memory: {
    face: (face) => {
      const denominators = {
        2: { one: 'חצי', many: 'חצאים', gender: 'm' },
        4: { one: 'רבע', many: 'רבעים', gender: 'm' },
        8: { one: 'שמינית', many: 'שמיניות', gender: 'f' },
      };
      switch (face.kind) {
        case 'dots':
          return count(face.count, DOT);
        case 'plus':
          return `${face.a} ועוד ${face.b}`;
        case 'minus':
          return `${face.a} פחות ${face.b}`;
        case 'times':
          return `${face.a} כפול ${face.b}`;
        case 'divide':
          return `${face.a} חלקי ${face.b}`;
        case 'fraction': {
          const part = denominators[face.bottom];
          if (!part) return `${face.top} חלקי ${face.bottom}`;
          return face.top === 1 ? part.one : count(face.top, part);
        }
        case 'whole':
          return 'שלם אחד';
        case 'letter':
          return `האות ${face.letter}`;
        case 'picture':
          return face.word;
        default:
          return String(face.n);
      }
    },
    gap: ({ low, high }) => `כמה אסימונים צריך כדי להגיע ${from(low)} עד ${high}?`,
    question: ({ name, low, high }) => `🤔 ${name}, כמה אסימונים צריך כדי להגיע ${from(low)} עד ${high}?`,
    right: ({ cost, name }) => `נכון! 🎉 ${shown(cost, CHIP)} עוברים אל ${name}.`,
    wrong: ({ cost, name }) => `לא בדיוק! זה היה ${cost}. ל${name} יורדים ${shown(cost, CHIP)}, והזוג חוזר למקום.`,
    tooFew: ({ cost, name, chips }) => `צריך 🪙 ${shown(cost, CHIP)}, אבל ל${name} יש רק ${chips}.`,
    // Read aloud (without names, so they can be recorded).
    sayRight: () => 'נכון! האסימונים עוברים לצד השני.',
    sayWrong: ({ cost }) => `לא בדיוק! זה היה ${cost}. הזוג חוזר למקום.`,
    pairs: ({ name, count: pairs }) => `${name}: ${shown(pairs, PAIR)}`,
  },
  // Birthday Cake. No "בן/בת 3": the age is said without the friend's gender.
  cake: {
    intro: ({ friend, number, word }) => `היום יום ההולדת של ${friend}! ${count(number, CANDLE)} היום! כתבו ${word} על העוגה בקרם.`,
    iced: ({ number }) => `יפהפה! עכשיו שימו ${count(number, CANDLE)} על העוגה. גררו מהמגש.`,
    right: ({ number }) =>
      number === 1 ? `${count(1, CANDLE)}! עכשיו כבו אותו. לחצו על הנר!` : `${count(number, CANDLE)}! עכשיו כבו אותם. לחצו על כל נר!`,
    tooFewShow: ({ friend, number, placed }) => `יום הולדת ${number} ל${friend}! יש לנו ${placed}. הוסיפו עוד!`,
    tooFew: ({ number, placed }) => tooFew({ number, placed }),
    tooManyShow: ({ friend, number }) => `יותר מדי! יום הולדת ${number} ל${friend}. הורידו אחד.`,
    tooMany: ({ number, placed }) => tooMany({ number, placed }),
    party: ({ friend }) => `אפס! יום הולדת שמח, ${friend}!`,
    show: {
      icing: ({ friend, number }) => `יום הולדת ${number} ל${friend}! כתבו ${number} בקרם`,
      candles: ({ number }) => `שימו ${number} 🕯️ על העוגה`,
      blow: ({ lit }) => (lit === 1 ? 'כבו את הנרות! נשאר נר אחד' : `כבו את הנרות! נשארו ${lit}`),
      party: ({ friend }) => `🎉 יום הולדת שמח, ${friend}!`,
    },
  },
  count: {
    prompt: () => 'כמה יש?',
    speech: ({ object }) => `כמה ${object.many} יש?`,
    explain: ({ object, count: n }) => `סופרים אחד אחד: ${upTo(n)}. יש ${count(n, object)}!`,
  },
  shape: {
    prompt: ({ shape }) => `מצאו את ה${shape.name}`,
    speech: ({ shape }) => `לחצו על ה${shape.name}.`,
    explain: ({ shape }) => `זה ${shape.name}.`,
  },
  more: {
    prompt: () => 'איפה יש יותר?',
    speech: ({ object }) => `באיזו קבוצה יש יותר ${object.many}?`,
    explain: ({ object, more, less }) => `${count(more, object)} זה יותר ${from(count(less, object))}.`,
  },
  sequence: {
    prompt: () => 'מה בא אחר כך?',
    speech: ({ numbers }) => `${numbers.join('. ')}. מה בא אחר כך?`,
    explain: ({ direction, step, last, answer }) =>
      direction === 'up'
        ? `המספרים עולים ב-${step} בכל פעם. ${last} ועוד ${step} זה ${answer}!`
        : `המספרים יורדים ב-${step} בכל פעם. ${last} פחות ${step} זה ${answer}!`,
  },
  bigger: {
    prompt: () => 'איזה מספר גדול יותר?',
    speech: ({ a, b }) => `איזה מספר גדול יותר? ${a}. או ${b}?`,
    explain: ({ bigger }) => `${bigger} הוא המספר הגדול יותר.`,
  },
  add: {
    speech: ({ a, b }) => `כמה זה ${a} ועוד ${b}?`,
    explain: ({ a, b, sum }) => `מתחילים ב-${a} וסופרים עוד ${b}: יוצא ${sum}.`,
  },
  subtract: {
    speech: ({ a, b }) => `כמה זה ${a} פחות ${b}?`,
    explain: ({ a, b, left }) => `מתחילים עם ${a} ומורידים ${b}: ${left === 1 ? 'נשאר' : 'נשארים'} ${left}.`,
  },
  multiply: {
    speech: ({ a, b }) => `כמה זה ${a} כפול ${b}?`,
    explain: ({ a, b, product }) => `${a === 1 ? 'קבוצה אחת' : `${a} קבוצות`} של ${b} זה ${product}.`,
  },
  divide: {
    speech: ({ total, divisor }) => `כמה זה ${total} חלקי ${divisor}?`,
    explain: ({ total, divisor, quotient }) =>
      `מחלקים ${total} ${divisor === 1 ? 'לקבוצה אחת' : `ל-${divisor} קבוצות שוות`}: ${quotient} בכל קבוצה, כי ${divisor} × ${quotient} = ${total}.`,
  },
  quickLook: {
    prompt: () => 'מבט מהיר!',
    speechSmall: () => 'הסתכלו! כמה נקודות?',
    speech: () => 'מהר! כמה נקודות ראיתם?',
    explain: ({ count: n }) => (n === 1 ? `הייתה ${count(1, DOT)}.` : `היו ${count(n, DOT)}.`),
  },
  numberLine: {
    prompt: ({ target }) => `איפה המספר ${target}?`,
    speech: ({ target }) => `לחצו על המקום של ${target} על הקו.`,
    explain: ({ target, max }) => `המספר ${target} נמצא כאן: הקו הולך מ-0 עד ${max}.`,
  },
};
