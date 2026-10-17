// Feelings Friends: a friend shares what happened. The child names the
// feeling, then picks something that would help (CASEL self-awareness,
// social awareness and relationship skills). Every friend has one helpful
// choice per round; the others are clearly unkind or unhelpful.

export const FRIENDS_PER_ROUND = 4;
// Each friend scores a point for the feeling and a point for the helper.
export const POINTS_PER_FRIEND = 2;

// feeling: the right face; alsoFits: feelings never offered as wrong answers.
// helps: kind things to do; unhelpful: things that wouldn't help (their
// words are in the sel content pack, FRIENDS).
export const FRIENDS = [
  { id: 'bear', emoji: '🐻', feeling: 'sad', alsoFits: ['angry', 'surprised'], helps: ['🤗', '🍦'], unhelpful: ['😂', '🏃'] },
  { id: 'bunny', emoji: '🐰', feeling: 'scared', alsoFits: ['surprised'], helps: ['🫂', '🌬️'], unhelpful: ['📢', '🙈'] },
  { id: 'fox', emoji: '🦊', feeling: 'angry', alsoFits: ['sad', 'surprised'], helps: ['🌬️', '🧱'], unhelpful: ['👊', '💥'] },
  { id: 'pig', emoji: '🐷', feeling: 'happy', alsoFits: ['surprised'], helps: ['🎉', '🎂'], unhelpful: ['😒', '🎈'] },
  { id: 'cat', emoji: '🐱', feeling: 'sleepy', alsoFits: ['sad'], helps: ['🛏️', '📖'], unhelpful: ['🥁', '🍬'] },
  { id: 'monkey', emoji: '🐵', feeling: 'sad', alsoFits: ['angry'], helps: ['🙋', '💬'], unhelpful: ['🚫', '🤫'] },
  { id: 'frog', emoji: '🐸', feeling: 'scared', alsoFits: ['happy', 'surprised'], helps: ['💬', '🗣️'], unhelpful: ['😝', '🙈'] },
  { id: 'lion', emoji: '🦁', feeling: 'angry', alsoFits: ['sad', 'surprised'], helps: ['🧸', '🗣️'], unhelpful: ['😤', '📢'] },
];

// The feelings on offer (the sel content pack's FEELINGS, by id).
export const FEELING_IDS = ['happy', 'sad', 'angry', 'scared', 'surprised', 'sleepy'];

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
  const help = Math.floor(rng() * friend.helps.length);
  return {
    friend,
    feelingChoices: shuffled([friend.feeling, ...wrongFeelings], rng),
    helpChoices: shuffled(
      [
        { id: `helps-${help}`, kind: 'helps', index: help, emoji: friend.helps[help], helpful: true },
        ...friend.unhelpful.map((emoji, index) => ({ id: `unhelpful-${index}`, kind: 'unhelpful', index, emoji, helpful: false })),
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
