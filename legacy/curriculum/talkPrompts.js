// "Play together" coach mode: after each answer, a short prompt for the
// grown-up to talk about it with the child (Four Pillars: learning is more
// effective when it's socially interactive; AAP: co-play). Prompts are shown,
// not spoken, because they are for the grown-up.

export const COACH_INTRO =
  'Sit together. Let your child tap the answers, and after each one use the prompt to talk about it.';

const PROMPTS = {
  math: {
    right: ['Ask: "How did you work it out?"', 'Ask: "Can you show me with your fingers?"', 'Ask: "Is there another way to get the same answer?"'],
    wrong: ['Work it out together, out loud. Count or draw it.', 'Ask: "Which part was tricky?" Then try it together.', 'Point at the right answer and say why it fits.'],
  },
  literacy: {
    right: ['Say the word together, slowly.', 'Ask: "Can you think of another word like that?"', 'Ask: "What sound does it start with?"'],
    wrong: ['Say both words slowly and listen for the difference.', 'Stretch out the sounds together: "c-a-t".', 'Ask: "What did you hear?" Then listen again with 🔊.'],
  },
  science: {
    right: ['Ask: "Where have you seen that in real life?"', 'Ask: "Why do you think that\'s true?"', 'Look for one around you right now.'],
    wrong: ['Read the explanation together and talk about it.', 'Ask: "What made you pick that?" Then look at the right answer.', 'Ask: "What do you already know about this?"'],
  },
  logic: {
    right: ['Ask: "What\'s the rule?"', 'Ask: "What would come after that?"', 'Make your own pattern for each other to guess.'],
    wrong: ['Say the pattern out loud together until it repeats.', 'Ask: "Which part repeats?"', 'Point to each piece in turn and say it.'],
  },
  sel: {
    right: ['Ask: "Has something like this happened to you?"', 'Ask: "Why is that a kind choice?"', 'Ask: "How would everyone feel then?"'],
    wrong: ['Ask: "How would the other person feel?"', 'Talk about why the right answer is kinder.', 'Act it out together: what would you say or do?'],
  },
};

// A prompt for the grown-up after an answer. `index` picks among the
// prompts so consecutive questions vary.
export function talkPrompt(subject, isCorrect, index = 0) {
  const set = (PROMPTS[subject] || PROMPTS.math)[isCorrect ? 'right' : 'wrong'];
  return set[index % set.length];
}

export const TALK_SUBJECTS = Object.keys(PROMPTS);
