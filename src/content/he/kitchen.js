// מפרץ המטבח בעברית: שמות המצרכים, הכלים והמנות, איך אומרים כמות ("חצי
// כוס", "150 גרם"), והמשפטים שהטבחים שומעים. המספרים של המתכונים נמצאים ב-
// logic/recipes/. בעברית סופרים לפי מין (שתי ביצים / שני בצלים), ולכן לכל
// מצרך נספר יש `gender`. הפנייה לילדים ברבים ("קלפו", "הקישו").

export const INGREDIENTS = {
  banana: { one: 'בננה', many: 'בננות', gender: 'f' },
  strawberries: { one: 'תות', many: 'תותים', gender: 'm' },
  milk: { one: 'חלב', many: 'חלב', gender: 'm' },
  yogurt: { one: 'יוגורט', many: 'יוגורט', gender: 'm' },
  honey: { one: 'דבש', many: 'דבש', gender: 'm' },
  egg: { one: 'ביצה', many: 'ביצים', gender: 'f' },
  oats: { one: 'שיבולת שועל', many: 'שיבולת שועל', gender: 'f' },
  coconutOil: { one: 'שמן קוקוס', many: 'שמן קוקוס', gender: 'm' },
  bakingPowder: { one: 'אבקת אפייה', many: 'אבקת אפייה', gender: 'f' },
  spinach: { one: 'תרד', many: 'תרד', gender: 'm' },
  cheese: { one: 'גבינה בולגרית', many: 'גבינה בולגרית', gender: 'f' },
  oliveOil: { one: 'שמן זית', many: 'שמן זית', gender: 'm' },
  cherryTomato: { one: 'עגבניית שרי', many: 'עגבניות שרי', gender: 'f' },
  turkey: { one: 'הודו טחון', many: 'הודו טחון', gender: 'm' },
  onion: { one: 'בצל', many: 'בצלים', gender: 'm' },
  carrot: { one: 'גזר', many: 'גזרים', gender: 'm' },
  garlic: { one: 'שן שום', many: 'שיני שום', gender: 'f' },
  chicken: { one: 'חזה עוף', many: 'חזה עוף', gender: 'm' },
  ketchup: { one: 'קטשופ', many: 'קטשופ', gender: 'm' },
  cornflour: { one: 'קורנפלור', many: 'קורנפלור', gender: 'm' },
  soySauce: { one: 'רוטב סויה', many: 'רוטב סויה', gender: 'm' },
  oil: { one: 'שמן', many: 'שמן', gender: 'm' },
  zucchini: { one: 'קישוא', many: 'קישואים', gender: 'm' },
  wholeFlour: { one: 'קמח מלא', many: 'קמח מלא', gender: 'm' },
  cinnamon: { one: 'קינמון', many: 'קינמון', gender: 'm' },
  vanilla: { one: 'תמצית וניל', many: 'תמצית וניל', gender: 'f' },
  // Only on the printable card (a recipe's `cardOnly`).
  dill: { one: 'שמיר קצוץ', many: 'שמיר קצוץ', gender: 'm' },
  lemonJuice: { one: 'מיץ לימון', many: 'מיץ לימון', gender: 'm' },
  ice: { one: 'קוביות קרח', many: 'קוביות קרח', gender: 'f' },
  water: { one: 'מים קרים', many: 'מים קרים', gender: 'm' },
  parsley: { one: 'פטרוזיליה קצוצה', many: 'פטרוזיליה קצוצה', gender: 'f' },
  cumin: { one: 'כמון טחון', many: 'כמון טחון', gender: 'm' },
  paprika: { one: 'פפריקה מתוקה', many: 'פפריקה מתוקה', gender: 'f' },
  salt: { one: 'מלח', many: 'מלח', gender: 'm' },
  pepper: { one: 'פלפל שחור', many: 'פלפל שחור', gender: 'm' },
  bakingSoda: { one: 'סודה לשתייה', many: 'סודה לשתייה', gender: 'f' },
};

export const DISHES = {
  smoothie: 'שייק תות בננה',
  muffins: 'מאפינס בננה ושיבולת שועל',
  omelette: 'חביתת ירק',
  burgers: 'המבורגר הודו',
  hotdogs: 'נקניקיות עוף',
};

export const TOOLS = {
  cup: { label: '🥛 1 כוס', a: 'הכוס' },
  halfCup: { label: '🥛 ½ כוס', a: 'חצי הכוס' },
  quarterCup: { label: '🥛 ¼ כוס', a: 'רבע הכוס' },
  tbsp: { label: '🥄 כף', a: 'הכף' },
  tsp: { label: '🥄 כפית', a: 'הכפית' },
  halfTsp: { label: '🥄 ½ כפית', a: 'חצי הכפית' },
  jug: { label: '🫙 מ"ל', a: 'הכלי המדיד' },
  scale: { label: '⚖️ גרם', a: 'המשקל' },
};

const FEMININE = ['אפס', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];
const MASCULINE = ['אפס', 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה'];
// "ביצה אחת", "שתי ביצים", "שלושה בצלים"; מעל 10 בספרות.
function count(n, noun) {
  if (n === 1) return `${noun.one} ${noun.gender === 'f' ? 'אחת' : 'אחד'}`;
  if (n > 10) return `${n} ${noun.many}`;
  return `${(noun.gender === 'f' ? FEMININE : MASCULINE)[n]} ${noun.many}`;
}

const FRACTION_SIGNS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
const THIRDS = { 1: '⅓', 2: '⅔' };
export function fraction(qty) {
  const whole = Math.floor(qty);
  const third = Math.round((qty - whole) * 3);
  const part = FRACTION_SIGNS[qty - whole] || (Math.abs((qty - whole) * 3 - third) < 1e-9 && THIRDS[third]) || '';
  return whole ? `${whole}${part}` : part || '0';
}
const UNIT_SHORT = { cup: ['כוס', 'כוסות'], tbsp: ['כף', 'כפות'], tsp: ['כפית', 'כפיות'], ml: ['מ"ל', 'מ"ל'], g: ['גרם', 'גרם'] };

export function shortAmount({ qty, unit }) {
  if (unit === 'whole') return `× ${qty}`;
  const [one, many] = UNIT_SHORT[unit];
  return `${fraction(qty)} ${qty > 1 ? many : one}`;
}

// כלי מידה, כולם בלשון נקבה: כוס, כף, כפית.
const UNIT_NOUNS = { cup: { one: 'כוס', many: 'כוסות', gender: 'f' }, tbsp: { one: 'כף', many: 'כפות', gender: 'f' }, tsp: { one: 'כפית', many: 'כפיות', gender: 'f' } };
export function amount({ qty, unit }, ingredient) {
  if (unit === 'whole') return `${count(qty, ingredient)}.`;
  if (unit === 'ml') return `${qty} מיליליטר.`;
  if (unit === 'g') return `${qty} גרם.`;
  const noun = UNIT_NOUNS[unit];
  const whole = Math.floor(qty);
  const part = qty - whole;
  if (!whole && part === 0.5) return `חצי ${noun.one}.`;
  if (!whole && part === 0.25) return `רבע ${noun.one}.`;
  if (!whole && part === 0.75) return `שלושה רבעי ${noun.one}.`;
  if (part === 0.5) return `${count(whole, noun)} וחצי.`;
  return `${count(qty, noun)}.`;
}

// A line on the recipe card: "2 cups oats", "2 eggs".
export function cardLine({ qty, unit }, ingredient) {
  if (unit === 'whole') return `${qty} ${qty === 1 ? ingredient.one : ingredient.many}`;
  return `${shortAmount({ qty, unit })} ${ingredient.many}`;
}

export const name = (ingredient) => `${ingredient.many}.`;

const ACTIONS = {
  peel: ({ times }) => (times === 1 ? 'קלפו את הבננה. הקישו עליה.' : `קלפו ${count(times, INGREDIENTS.banana)}. הקישו על כל אחת.`),
  mash: () => 'מעכו את הבננות. שפשפו אותן באצבע.',
  crack: ({ times }) => (times === 1 ? 'שברו את הביצה לקערה. הקישו עליה.' : `שברו ${count(times, INGREDIENTS.egg)} לקערה. הקישו על כל אחת.`),
  stir: () => 'ערבבו הכול יחד. שפשפו סביב סביב.',
  whisk: () => 'טרפו את הביצה. שפשפו סביב סביב.',
  grate: ({ on }) => (on === 'zucchini' ? 'גררו את הקישוא. שפשפו למעלה ולמטה.' : 'גררו את הגזר. שפשפו למעלה ולמטה.'),
  blend: () => 'טחנו עד שיהיה חלק. שפשפו סביב סביב.',
  fill: ({ times }) => `מלאו ${times} תבניות מאפינס. כף אחת בכל אחת.`,
  cut: ({ on, times }) => (on === 'cherryTomato' ? `חתכו ${count(times, INGREDIENTS.cherryTomato)} לחצאים. הקישו על כל אחת.` : 'חתכו את הבצל. הקישו עליו.'),
  wilt: () => 'אדו את התרד בסיר חם. הקישו על הסיר.',
  shape: ({ on, times }) =>
    on === 'burger' ? `צרו ${count(times, { one: 'המבורגר', many: 'המבורגרים', gender: 'm' })}. הקישו על הקערה.` : `גלגלו ${count(times, { one: 'נקניקייה', many: 'נקניקיות', gender: 'f' })}. הקישו על הקערה.`,
};

const APPLIANCE_LINES = {
  blender: 'לבלנדר! החזיקו את הכפתור.',
  oven: 'מבוגר מכניס לתנור.',
  stove: 'מבוגר שם את המחבת על הכיריים.',
  pot: 'מבוגר מכניס אותן לסיר עם מים חמים.',
};

const CLEANUP_LINES = {
  putAway: 'בזמן שזה מתבשל, מסדרים! החזירו הכול למקום. דברים קרים למקרר. כל השאר לארון.',
  dishes: 'בזמן שזה מתבשל, מסדרים! שימו את הכלים בכיור.',
  wipe: 'בזמן שזה מתבשל, מסדרים! נגבו את השיש. שפשפו עד שיבריק.',
};

export const say = {
  kitchen: {
    intro: ({ dish }) => `בואו נכין ${dish}! הנה המתכון.`,
    party: () => 'מבשלים למסיבה! מכינים כמות כפולה: פי שניים מכל כמות במתכון.',
    double: () => 'פי שניים!',
    wash: () => 'קודם כול, שוטפים ידיים! שפשפו אותן מתחת לברז.',
    washed: () => 'ידיים נקיות!',
    gather: () => 'עכשיו קחו מהמקרר ומהארון את כל מה שבמתכון. הקישו על הדלתות כדי לפתוח.',
    notInRecipe: () => 'זה לא במתכון שלנו. מחזירים.',
    enough: () => 'יש לנו מספיק מאלה.',
    gathered: () => 'יש לנו הכול!',
    measure: () => 'עכשיו מודדים.',
    pickTool: () => 'באיזה כלי צריך למדוד?',
    wrongTool: ({ tool }) => `לא ${tool}. נסו כלי אחר.`,
    tooMuch: () => 'יותר מדי! הקישו על החץ כדי להוציא אחד.',
    notEnough: () => 'עוד לא מספיק. הוסיפו עוד.',
    measured: () => 'מושלם!',
    prep: ACTIONS,
    grownUp: () => 'בקשו ממבוגר לעזור בזה.',
    cook: ({ appliance }) => APPLIANCE_LINES[appliance],
    setTimer: ({ minutes }) => `כוונו את הטיימר ל-${minutes} דקות.`,
    timerWrong: ({ minutes }) => `במתכון כתוב ${minutes} דקות.`,
    blending: () => 'המשיכו להחזיק!',
    cleanup: ({ job }) => CLEANUP_LINES[job],
    wrongPlace: () => 'לא שם. איפה שומרים את זה?',
    cleaned: () => 'הכול נקי!',
    ready: () => 'זה מוכן!',
    decorate: ({ count: n, item }) => `עכשיו מקשטים. שימו ${count(n, item)}.`,
    dress: () => 'עכשיו מקשטים! בחרו מה שאתם אוהבים.',
    stack: () => 'בנו לפי הסדר. קודם הלחמנייה התחתונה!',
    wrongLayer: () => 'עוד לא את זה. מה בא עכשיו?',
    served: () => 'נראה טעים! תודה, שפים!',
  },
};

export const DECORATIONS = {
  '🍓': { one: 'תות', many: 'תותים', gender: 'm' },
  '🍌': { one: 'פרוסת בננה', many: 'פרוסות בננה', gender: 'f' },
  '🥗': { one: 'סלט', many: 'סלטים', gender: 'm' },
  '🍅': { one: 'חצי עגבנייה', many: 'חצאי עגבנייה', gender: 'm' },
  '🌭': { one: 'נקניקייה', many: 'נקניקיות', gender: 'f' },
};

// אופן ההכנה בכרטיס המתכון להדפסה, לפי כל דף מקור (בקיצור). שלנו ולא של
// המקור, היכן שמצוין: צורת ההמבורגר והלחמניות.
export const RECIPE_STEPS = {
  smoothie: [
    'קולפים את הבננות וחותכים לחתיכות. שוטפים את התותים ומורידים את העלים הירוקים.',
    'מכניסים לבלנדר את כל המרכיבים: בננות, תותים, יוגורט, חלב, דבש ווניל (ומיץ לימון, אם רוצים). עם תותים טריים מוסיפים גם קרח.',
    'טוחנים כדקה, עד שהשייק חלק וסמיך.',
    'טועמים, מוסיפים עוד דבש או תותים לפי הטעם, מוזגים לכוסות ומגישים מיד.',
  ],
  muffins: [
    'מועכים את הבננות בקערה גדולה במזלג, ומשאירים כמה גושים קטנים.',
    'מערבבים פנימה את הביצים, השמן והדבש עד לתערובת חלקה.',
    'בקערה נפרדת מערבבים את שיבולת השועל, הקמח, הסודה לשתייה, הקינמון והמלח.',
    'מוסיפים את היבשים לרטובים בהדרגה ומערבבים עד שאין גושים יבשים.',
    'משמנים תבנית ל-12 מאפינס (או משתמשים במנז׳טים) ומחלקים את הבלילה שווה בשווה.',
    'אופים בתנור שחומם ל-180 מעלות 18–20 דקות, עד שקיסם יוצא יבש. מצננים 5 דקות.',
  ],
  omelette: [
    'שוברים את הביצים לקערה גדולה וטורפים היטב.',
    'מוסיפים את הבצל, הגזר, הקישוא, הפטרוזיליה (והשמיר) ומערבבים.',
    'מוסיפים קמח, אבקת אפייה, מלח ופלפל, ומערבבים עד לתערובת אחידה.',
    'מחממים את השמן במחבת בינונית, יוצקים את התערובת ומשטחים בעדינות.',
    'מטגנים על להבה בינונית 4–5 דקות עד שהצד התחתון מזהיב, הופכים בעדינות ומטגנים עוד 3–4 דקות. אם האמצע עדיין רך, מכסים ומשאירים 2 דקות על אש נמוכה.',
    'מגישים חם, עם לחם וסלט טרי.',
  ],
  burgers: [
    'מטגנים את הבצל בכף אחת משמן הזית על להבה בינונית עד שהוא שקוף ורך, 5–7 דקות. מצננים מעט.',
    'בקערה גדולה מניחים את ההודו, שיבולת השועל, הגזר המגורר, השום והבצל.',
    'מוסיפים פטרוזיליה, ביצה, את שאר השמן, כמון, פפריקה, מלח, פלפל וסודה לשתייה, ולשים היטב. יבש מדי? מוסיפים מים קרים בהדרגה. רך מדי? מוסיפים מעט שיבולת שועל.',
    'מכסים ומניחים במקרר 25–30 דקות.',
    'יוצרים המבורגרים (במקור: קציצות). מטגנים במחבת עם מעט שמן 3–4 דקות מכל צד, או אופים על נייר אפייה משומן ב-190 מעלות 20–22 דקות והופכים אחרי 12. המבורגר גדול מקציצה: בודקים שהוא עשוי עד הסוף.',
    'מגישים בלחמניות מקמח מלא עם חסה ועגבנייה (הצעה שלנו).',
  ],
  hotdogs: [
    'במעבד מזון טוחנים את העוף, הבצל, השום, הקטשופ והביצים (2 בינוניות או אחת גדולה) למחית חלקה.',
    'מוסיפים את הקורנפלור, הסויה והשמן, מתבלים במלח ופלפל ומערבבים היטב.',
    'מרתיחים מים בסיר בינוני. מרפדים קרש חיתוך בניילון נצמד עמיד בחום ומחליקים אותו.',
    'שמים מעט מהתערובת בשליש התחתון של הניילון ומגלגלים לנקניק. קושרים בצדדים כמו סוכרייה, דוקרים 2–3 חורים בקיסם ועוטפים בשכבת ניילון נוספת.',
    'מבשלים במים כ-15 דקות בחום נמוך ומעבירים למי קרח לקירור.',
    'לפני ההגשה מוציאים מהניילון וצורבים במחבת עם מעט שמן קנולה. מגישים בלחמניות עם חרדל וקטשופ.',
  ],
};
