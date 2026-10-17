// Feelings Friends: a friend shares what happened. The child names the
// feeling, then picks something that would help (CASEL self-awareness,
// social awareness and relationship skills). Every friend has one helpful
// choice per round; the others are clearly unkind or unhelpful.
import { FEELINGS } from '../curriculum/selGenerators';

export const FRIENDS_PER_ROUND = 4;
// Each friend scores a point for the feeling and a point for the helper.
export const POINTS_PER_FRIEND = 2;

// feeling: the right face; alsoFits: feelings never offered as wrong answers.
// helps: kind things to do; unhelpful: things that wouldn't help.
export const FRIENDS = [
  {
    id: 'bear',
    emoji: '🐻',
    name: 'Bear',
    story: 'My ice cream fell on the ground.',
    feeling: 'sad',
    alsoFits: ['angry', 'surprised'],
    helps: [['🤗', 'Give a hug'], ['🍦', 'Share your snack']],
    unhelpful: [['😂', 'Laugh at Bear'], ['🏃', 'Run away']],
  },
  {
    id: 'bunny',
    emoji: '🐰',
    name: 'Bunny',
    story: 'There is a big thunder storm outside!',
    feeling: 'scared',
    alsoFits: ['surprised'],
    helps: [['🫂', 'Sit close together'], ['🌬️', 'Take slow breaths together']],
    unhelpful: [['📢', 'Shout "Boo!"'], ['🙈', 'Ignore Bunny']],
  },
  {
    id: 'fox',
    emoji: '🦊',
    name: 'Fox',
    story: 'Someone knocked down my block tower on purpose!',
    feeling: 'angry',
    alsoFits: ['sad', 'surprised'],
    helps: [['🌬️', 'Take a deep breath'], ['🧱', 'Build it again together']],
    unhelpful: [['👊', 'Hit someone'], ['💥', 'Knock down another tower']],
  },
  {
    id: 'pig',
    emoji: '🐷',
    name: 'Pig',
    story: 'It is my birthday and everyone came to my party!',
    feeling: 'happy',
    alsoFits: ['surprised'],
    helps: [['🎉', 'Celebrate together'], ['🎂', 'Sing happy birthday']],
    unhelpful: [['😒', 'Say parties are boring'], ['🎈', 'Pop all the balloons']],
  },
  {
    id: 'cat',
    emoji: '🐱',
    name: 'Cat',
    story: 'I stayed up so late. My eyes keep closing.',
    feeling: 'sleepy',
    alsoFits: ['sad'],
    helps: [['🛏️', 'Rest in a cozy bed'], ['📖', 'Read a quiet story']],
    unhelpful: [['🥁', 'Bang a loud drum'], ['🍬', 'Eat lots of candy']],
  },
  {
    id: 'monkey',
    emoji: '🐵',
    name: 'Monkey',
    story: 'Nobody wants to play with me today.',
    feeling: 'sad',
    alsoFits: ['angry'],
    helps: [['🙋', 'Ask Monkey to play'], ['💬', 'Say "You can play with us!"']],
    unhelpful: [['🚫', 'Say "Go away"'], ['🤫', 'Whisper about Monkey']],
  },
  {
    id: 'frog',
    emoji: '🐸',
    name: 'Frog',
    story: 'My first day at a brand new school is tomorrow.',
    feeling: 'scared',
    alsoFits: ['happy', 'surprised'],
    helps: [['💬', 'Say "I will be your friend"'], ['🗣️', 'Tell a grown-up how you feel']],
    unhelpful: [['😝', 'Say "Everyone will laugh"'], ['🙈', 'Ignore Frog']],
  },
  {
    id: 'lion',
    emoji: '🦁',
    name: 'Lion',
    story: 'My little brother broke my favorite toy!',
    feeling: 'angry',
    alsoFits: ['sad', 'surprised'],
    helps: [['🧸', 'Fix it together'], ['🗣️', 'Use words to say how you feel']],
    unhelpful: [['😤', 'Break his toy too'], ['📢', 'Scream at him']],
  },
];

const FEELING_IDS = Object.keys(FEELINGS);

function shuffled(array, rng) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// One friend's two questions: name the feeling, then pick a helper.
export function makeFriendTurn(friend, rng = Math.random) {
  const wrongFeelings = shuffled(
    FEELING_IDS.filter((id) => id !== friend.feeling && !friend.alsoFits.includes(id)),
    rng
  ).slice(0, 2);
  const help = friend.helps[Math.floor(rng() * friend.helps.length)];
  return {
    friend,
    feelingChoices: shuffled([friend.feeling, ...wrongFeelings], rng),
    helpChoices: shuffled(
      [
        { emoji: help[0], label: help[1], helpful: true },
        ...friend.unhelpful.map(([emoji, label]) => ({ emoji, label, helpful: false })),
      ],
      rng
    ),
  };
}

export function makeRound(count = FRIENDS_PER_ROUND, rng = Math.random) {
  return shuffled(FRIENDS, rng)
    .slice(0, count)
    .map((friend) => makeFriendTurn(friend, rng));
}

export function roundTotal(turns) {
  return turns.length * POINTS_PER_FRIEND;
}
