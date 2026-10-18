// Feelings Garden in Hebrew: feeling words, situations, fair-play choices,
// perspective stories, and how each question is said.
//
// Feeling words are nouns (שמחה, עצב...), so a label never needs a gender.
// Where a sentence describes someone, the phrase functions below use the
// adjective that agrees with them (FEELING_FORMS, and each friend's gender).

export const FEELINGS = {
  happy: { emoji: '😊', word: 'שמחה' },
  sad: { emoji: '😢', word: 'עצב' },
  angry: { emoji: '😠', word: 'כעס' },
  scared: { emoji: '😨', word: 'פחד' },
  surprised: { emoji: '😲', word: 'הפתעה' },
  sleepy: { emoji: '😴', word: 'עייפות' },
};

// Each feeling's adjective, by its noun: [masculine, feminine].
const FEELING_FORMS = {
  שמחה: ['שמח', 'שמחה'],
  עצב: ['עצוב', 'עצובה'],
  כעס: ['כועס', 'כועסת'],
  פחד: ['מפחד', 'מפחדת'],
  הפתעה: ['מופתע', 'מופתעת'],
  עייפות: ['עייף', 'עייפה'],
};
const adjective = (word, gender = 'm') => (FEELING_FORMS[word] || [word, word])[gender === 'f' ? 1 : 0];

// [emoji, situation, feeling, feelings that would also make sense]
export const SITUATIONS = [
  ['🍦', 'הגלידה שלכם נופלת על הרצפה.', 'sad', ['angry', 'surprised']],
  ['🎂', 'החברים שרים לכם "היום יום הולדת".', 'happy', ['surprised']],
  ['⛈️', 'בלילה יש בחוץ רעמים חזקים: בום!', 'scared', ['surprised']],
  ['🎁', 'פותחים קופסה, וצעצוע קופץ החוצה: בוינג!', 'surprised', ['happy', 'scared']],
  ['🧱', 'מישהו מפיל לכם את המגדל בכוונה.', 'angry', ['sad', 'surprised']],
  ['🌙', 'כבר מאוחר מאוד, והעיניים נעצמות.', 'sleepy', []],
  ['🐶', 'הכלבלב שלכם רץ אליכם ומכשכש בזנב.', 'happy', ['surprised']],
  ['🎈', 'הבלון שלכם בורח ועף לשמיים.', 'sad', ['surprised', 'angry']],
  ['🕷️', 'עכביש גדול מטפס לכם על הנעל.', 'scared', ['surprised']],
  ['🛝', 'גולשים במגלשה הגדולה עם החברים הכי טובים.', 'happy', ['scared', 'surprised']],
  ['🖍️', 'מישהו חוטף לכם את הצבע בלי לבקש.', 'angry', ['sad', 'surprised']],
  ['🥳', 'נכנסים הביתה, וכולם צועקים "הפתעה!"', 'surprised', ['happy', 'scared']],
];

// [emoji, situation, fair choice, unfair choices]
export const FAIR_PLAY = [
  ['🛝', 'שני ילדים רוצים את המגלשה.', 'להתחלף בתורות', ['לדחוף את הילד השני', 'לחסום את הסולם']],
  ['🍪', 'יש 4 עוגיות לשני חברים.', 'שתי עוגיות לכל אחד', ['לשמור את כל ה-4', 'לתת אחת ולאכול 3']],
  ['🎲', 'הפסדתם במשחק קופסה.', 'להגיד "משחק יפה!"', ['לזרוק את הלוח', 'להגיד שהמנצח רימה']],
  ['🧩', 'ילד חדש רוצה להצטרף לפאזל שלכם.', 'להגיד "בוא תצטרף!"', ['להגיד "לך מפה"', 'להחביא את החלקים']],
  ['⚽', 'הקבוצה שלכם הבקיעה גול.', 'לתת כיף לקבוצה', ['לצחוק על הקבוצה השנייה', 'לקחת את הכדור הביתה']],
  ['🖍️', 'שניכם רוצים את הצבע האדום.', 'לחלוק או להתחלף', ['לשבור אותו לשניים', 'לחטוף ולברוח']],
  ['📚', 'הפלתם בטעות את הספרים של חבר.', 'לבקש סליחה ולעזור', ['ללכת משם', 'להאשים מישהו אחר']],
  ['🎮', 'אחותכם מחכה כבר הרבה זמן למשחק.', 'לתת לה תור', ['לשחק עוד שעה', 'לכבות לה את המשחק']],
  ['🙋', 'חבר מדבר עכשיו במפגש.', 'לחכות לתור', ['לצעוק מעליו', 'לצאת מהמפגש']],
];

// [emoji, story, question, answer, wrong answers]
// Answers are feeling nouns, so they fit any character.
export const PERSPECTIVES = [
  ['🏆', 'מאיה התאמנה בפסנתר כל יום, וניגנה את השיר שלה בלי אף טעות.', 'מה מאיה מרגישה?', 'גאווה', ['שעמום', 'קנאה']],
  ['🪑', 'איתי יושב לבד בארוחת הצהריים, וכל השאר צוחקים ביחד.', 'מה איתי מרגיש?', 'בדידות', ['גאווה', 'הקלה']],
  ['🎤', 'מחר יונתן צריך לדבר מול כל בית הספר.', 'מה יונתן מרגיש?', 'לחץ', ['שעמום', 'הכרת תודה']],
  ['🎁', 'כשתמר הייתה חולה, חברה שלה הכינה לה כרטיס ברכה.', 'מה תמר מרגישה?', 'הכרת תודה', ['קנאה', 'מבוכה']],
  ['🌧️', 'הטיול לגן החיות בוטל בגלל הגשם.', 'מה הכיתה מרגישה?', 'אכזבה', ['גאווה', 'הקלה']],
  ['🔍', 'אורי חשב שהכלבה שלו הלכה לאיבוד, ואז מצא אותה מתחת למיטה.', 'מה אורי מרגיש?', 'הקלה', ['קנאה', 'שעמום']],
  ['🥤', 'נועה שפכה מיץ על החולצה שלה מול כולם.', 'מה נועה מרגישה?', 'מבוכה', ['גאווה', 'הכרת תודה']],
  ['🤝', 'עומר ושירה רוצים להיות קפטן הקבוצה.', 'מה הם יכולים לעשות?', 'להתחלף בתורות', ['להפסיק להיות חברים', 'לצעוק עד שמישהו יוותר']],
  ['💬', 'חבר שלכם עצוב, כי הדג שלו מת.', 'מה אפשר להגיד?', 'איזה עצוב. רוצה לדבר על זה?', ['זה סתם דג', 'אז לא נהיה חברים']],
  ['🎨', 'דניאל התאמץ מאוד על ציור, אבל הוא לא יצא מסודר.', 'מה נחמד להגיד?', 'איזה צבעים יפים!', ['זה נראה מבולגן', 'שלי הרבה יותר יפה']],
];

// Feelings Friends (logic/feelingsFriends.js FRIENDS, by id): each friend's
// name, gender (for agreement: "דובי עצוב", "ארנבונית עצובה") and story, and
// the words for their helpers (same order as the emoji).
export const FRIENDS = {
  bear: {
    name: 'דובי',
    gender: 'm',
    story: 'הגלידה שלי נפלה על הרצפה.',
    helps: ['לתת חיבוק', 'לחלוק איתו גלידה'],
    unhelpful: ['לצחוק על דובי', 'לברוח'],
  },
  bunny: {
    name: 'ארנבונית',
    gender: 'f',
    story: 'יש בחוץ סערה גדולה עם רעמים!',
    helps: ['לשבת קרוב ביחד', 'לנשום לאט ביחד'],
    unhelpful: ['לצעוק "בו!"', 'להתעלם מארנבונית'],
  },
  fox: {
    name: 'שועלי',
    gender: 'm',
    story: 'מישהו הפיל את מגדל הקוביות שלי בכוונה!',
    helps: ['לנשום עמוק', 'לבנות אותו שוב ביחד'],
    unhelpful: ['להרביץ למישהו', 'להפיל מגדל אחר'],
  },
  pig: {
    name: 'חזרזירה',
    gender: 'f',
    story: 'היום יום ההולדת שלי, וכולם באו למסיבה!',
    helps: ['לחגוג ביחד', 'לשיר "היום יום הולדת"'],
    unhelpful: ['להגיד שמסיבות משעממות', 'לפוצץ את כל הבלונים'],
  },
  cat: {
    name: 'חתולית',
    gender: 'f',
    story: 'הלכתי לישון מאוחר מאוד. העיניים שלי נעצמות.',
    helps: ['לנוח במיטה נעימה', 'לקרוא סיפור שקט'],
    unhelpful: ['לתופף חזק על תוף', 'לאכול המון ממתקים'],
  },
  monkey: {
    name: 'קופי',
    gender: 'm',
    story: 'אף אחד לא רוצה לשחק איתי היום.',
    helps: ['להזמין את קופי לשחק', 'להגיד "בוא לשחק איתנו!"'],
    unhelpful: ['להגיד "לך מפה"', 'ללחוש סודות על קופי'],
  },
  frog: {
    name: 'צפרדע',
    gender: 'f',
    story: 'מחר היום הראשון שלי בגן חדש.',
    helps: ['להגיד "אני אהיה איתך!"', 'לספר למבוגר מה מרגישים'],
    unhelpful: ['להגיד "כולם יצחקו עלייך"', 'להתעלם מצפרדע'],
  },
  lion: {
    name: 'אריה',
    gender: 'm',
    story: 'אחי הקטן שבר לי את הצעצוע האהוב עליי!',
    helps: ['לתקן אותו ביחד', 'להגיד במילים מה מרגישים'],
    unhelpful: ['לשבור גם לו צעצוע', 'לצעוק עליו'],
  },
};

// The phrase functions get only the friend's name, so find their gender by it.
const genderOf = (name) => (Object.values(FRIENDS).find((friend) => friend.name === name) || {}).gender || 'm';
const byGender = (name, masculine, feminine) => (genderOf(name) === 'f' ? feminine : masculine);

export const say = {
  // Feelings Friends. `feeling` is a feeling's word; `helpful` the helper's words.
  friends: {
    says: ({ name }) => `${name} ${byGender(name, 'אומר', 'אומרת')}`,
    feelQuestion: ({ name }) => `איך ${name} ${byGender(name, 'מרגיש', 'מרגישה')}?`,
    helpQuestion: ({ name }) => `מה יכול לעזור ל${name}?`,
    story: ({ name, story, question }) => `${name} ${byGender(name, 'אומר', 'אומרת')}: ${story} ${question}`,
    feelRight: ({ name, feeling }) => `נכון! ${name} ${adjective(feeling, genderOf(name))}.`,
    feelWrong: ({ name, feeling, story }) => `${name} ${adjective(feeling, genderOf(name))}. בואו נקשיב שוב לסיפור: ${story}`,
    helpRight: () => 'זה יעזור! תודה שאתם כל כך נחמדים.',
    helpWrong: ({ name, helpful }) => `הממ, זה לא יעזור ל${name}. מה שכן יעזור: ${helpful}.`,
  },
  faces: {
    prompt: ({ word }) => `איפה ה${word}?`,
    speech: ({ word }) => `איזה פרצוף ${adjective(word)}?`,
    explain: ({ emoji, word }) => `הפרצוף הזה ${emoji} ${adjective(word)}.`,
  },
  situation: {
    speech: ({ situation }) => `${situation} איך הייתם מרגישים?`,
    explain: ({ word }) => `רוב האנשים היו מרגישים ${word}. זה בסדר להרגיש ככה!`,
  },
  fair: {
    speech: ({ situation }) => `${situation} מה הכי הוגן לעשות?`,
    explain: ({ fair }) => `${fair}. ככה לכולם יש הזדמנות הוגנת.`,
  },
  shoes: {
    explain: ({ answer }) => `דמיינו שאתם שם. "${answer}" מתאים הכי הרבה.`,
  },
};
