// Feelings Garden (social-emotional learning) question generators, following
// the CASEL 5 order used in the plan: name feelings, link feelings to
// situations, fairness and turn-taking, then perspective-taking.
// Every item lists its one right answer and hand-picked wrong ones, so no
// question has two answers a child could fairly defend.
import { pick, sample, shuffle } from './random';

export const FEELINGS = {
  happy: { emoji: '😊', word: 'happy' },
  sad: { emoji: '😢', word: 'sad' },
  angry: { emoji: '😠', word: 'angry' },
  scared: { emoji: '😨', word: 'scared' },
  surprised: { emoji: '😲', word: 'surprised' },
  sleepy: { emoji: '😴', word: 'sleepy' },
};

// [emoji, situation, feeling, feelings that would also make sense]
export const SITUATIONS = [
  ['🍦', 'Your ice cream falls on the ground.', 'sad', ['angry', 'surprised']],
  ['🎂', 'Your friends sing you happy birthday.', 'happy', ['surprised']],
  ['⛈️', 'A loud thunder storm booms outside at night.', 'scared', ['surprised']],
  ['🎁', 'You open a box and a toy jumps out: boing!', 'surprised', ['happy', 'scared']],
  ['🧱', 'Someone knocks down your tower on purpose.', 'angry', ['sad', 'surprised']],
  ['🌙', 'It is very late and your eyes keep closing.', 'sleepy', []],
  ['🐶', 'Your puppy runs to you, wagging its tail.', 'happy', ['surprised']],
  ['🎈', 'Your balloon floats away into the sky.', 'sad', ['surprised', 'angry']],
  ['🕷️', 'A big spider crawls onto your shoe.', 'scared', ['surprised']],
  ['🛝', 'You go down the big slide with your best friend.', 'happy', ['scared', 'surprised']],
  ['🖍️', 'Someone grabs your crayon without asking.', 'angry', ['sad', 'surprised']],
  ['🥳', 'You walk in and everyone shouts "Surprise!"', 'surprised', ['happy', 'scared']],
];

// [emoji, situation, fair choice, unfair choices]
export const FAIR_PLAY = [
  ['🛝', 'Two kids both want the slide.', 'Take turns', ['Push the other kid off', 'Block the ladder']],
  ['🍪', 'There are 4 cookies for 2 friends.', 'Two cookies each', ['Keep all 4', 'Give one away and eat 3']],
  ['🎲', 'You lose a board game.', 'Say "Good game!"', ['Throw the board', 'Say the winner cheated']],
  ['🧩', 'A new kid wants to join your puzzle.', 'Say "Come join us!"', ['Say "Go away"', 'Hide the pieces']],
  ['⚽', 'Your team scores a goal.', 'High-five your team', ['Laugh at the other team', 'Take the ball home']],
  ['🖍️', 'You both want the red crayon.', 'Share or take turns', ['Snap it in half', 'Grab it and run']],
  ['📚', 'You knocked over a friend\'s books.', 'Say sorry and help', ['Walk away', 'Blame someone else']],
  ['🎮', 'Your sister has waited a long time for the game.', 'Give her a turn', ['Play one more hour', 'Turn it off on her']],
  ['🙋', 'Your friend is talking in the circle.', 'Wait for your turn', ['Shout over them', 'Walk out of the circle']],
];

// [emoji, story, question, answer, wrong answers]
export const PERSPECTIVES = [
  ['🏆', 'Maya practiced piano every day and played her song perfectly.', 'How might Maya feel?', 'proud', ['bored', 'jealous']],
  ['🪑', 'Leo sits alone at lunch while the others laugh together.', 'How might Leo feel?', 'left out', ['proud', 'relieved']],
  ['🎤', 'Sam has to speak in front of the whole school tomorrow.', 'How might Sam feel?', 'nervous', ['bored', 'grateful']],
  ['🎁', 'Ava\'s friend made her a card when she was sick.', 'How might Ava feel?', 'grateful', ['jealous', 'embarrassed']],
  ['🌧️', 'The trip to the zoo is cancelled because of rain.', 'How might the class feel?', 'disappointed', ['proud', 'relieved']],
  ['🔍', 'Noah thought he lost his dog, then found her under the bed.', 'How might Noah feel?', 'relieved', ['jealous', 'bored']],
  ['🥤', 'Zoe spills juice on her shirt in front of everyone.', 'How might Zoe feel?', 'embarrassed', ['proud', 'grateful']],
  ['🤝', 'Kai and Mia both want to be the team captain.', 'What could they do?', 'Take turns being captain', ['Stop being friends', 'Shout until one gives up']],
  ['💬', 'Your friend is sad because their fish died.', 'What could you say?', 'I\'m sorry. Want to talk?', ['It was just a fish', 'Let\'s not be friends']],
  ['🎨', 'Ben worked hard on a drawing, but it isn\'t very neat.', 'What kind thing could you say?', 'I like your colors!', ['That looks messy', 'Mine is much better']],
];

const FEELING_IDS = Object.keys(FEELINGS);

function feelingsFaces() {
  const answer = pick(FEELING_IDS);
  const options = shuffle([answer, ...sample(FEELING_IDS.filter((id) => id !== answer), 2)]);
  const { word, emoji } = FEELINGS[answer];
  return {
    prompt: `Find ${word}!`,
    speech: `Which face looks ${word}?`,
    visual: null,
    answer: emoji,
    explain: `This face ${emoji} looks ${word}.`,
    choices: options.map((id) => FEELINGS[id].emoji),
    choiceStyle: 'picture',
    // Pre-readers need to hear the feeling word.
    speakAlways: true,
  };
}

function howWouldYouFeel() {
  const [emoji, situation, feeling, alsoFits] = pick(SITUATIONS);
  const wrong = sample(
    FEELING_IDS.filter((id) => id !== feeling && !alsoFits.includes(id)),
    2
  );
  return {
    prompt: situation,
    speech: `${situation} How would you feel?`,
    visual: { type: 'picture', emoji, caption: null },
    answer: FEELINGS[feeling].emoji,
    explain: `Most people would feel ${FEELINGS[feeling].word}. It's okay to feel that way!`,
    choices: shuffle([feeling, ...wrong]).map((id) => FEELINGS[id].emoji),
    choiceStyle: 'picture',
  };
}

function fairPlay() {
  const [emoji, situation, fair, unfair] = pick(FAIR_PLAY);
  return {
    prompt: situation,
    speech: `${situation} What is the fair thing to do?`,
    visual: { type: 'picture', emoji, caption: null },
    answer: fair,
    explain: `${fair}. That way everyone gets a fair chance.`,
    choices: shuffle([fair, ...unfair]),
    choiceStyle: 'word',
  };
}

function inTheirShoes() {
  const [emoji, story, question, answer, wrong] = pick(PERSPECTIVES);
  return {
    prompt: `${story} ${question}`,
    speech: `${story} ${question}`,
    visual: { type: 'picture', emoji, caption: null },
    answer,
    explain: `Imagine you were there. "${answer}" fits best.`,
    choices: shuffle([answer, ...wrong]),
    choiceStyle: 'word',
  };
}

export const SEL_GENERATORS = {
  'feelings-faces': feelingsFaces,
  'feelings-situations': howWouldYouFeel,
  'fair-play': fairPlay,
  'in-their-shoes': inTheirShoes,
};
