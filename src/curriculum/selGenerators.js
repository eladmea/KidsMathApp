// Feelings Garden (social-emotional learning) question generators, following
// the CASEL 5 order used in the plan: name feelings, link feelings to
// situations, fairness and turn-taking, then perspective-taking.
// Every item lists its one right answer and hand-picked wrong ones, so no
// question has two answers a child could fairly defend.
import { pick, sample, shuffle } from './random';
import { content } from '../content/index';

// The words come from the language's SEL pack (src/content/<language>/sel.js).
const sel = () => content('sel');


function feelingsFaces() {
  const { FEELINGS, say } = sel();
  const FEELING_IDS = Object.keys(FEELINGS);
  const answer = pick(FEELING_IDS);
  const options = shuffle([answer, ...sample(FEELING_IDS.filter((id) => id !== answer), 2)]);
  const { word, emoji } = FEELINGS[answer];
  return {
    prompt: say.faces.prompt({ word }),
    speech: say.faces.speech({ word }),
    visual: null,
    answer: emoji,
    explain: say.faces.explain({ emoji, word }),
    choices: options.map((id) => FEELINGS[id].emoji),
    choiceStyle: 'picture',
    // Pre-readers need to hear the feeling word.
    speakAlways: true,
  };
}

function howWouldYouFeel() {
  const { FEELINGS, SITUATIONS, say } = sel();
  const FEELING_IDS = Object.keys(FEELINGS);
  const [emoji, situation, feeling, alsoFits] = pick(SITUATIONS);
  const wrong = sample(
    FEELING_IDS.filter((id) => id !== feeling && !alsoFits.includes(id)),
    2
  );
  return {
    prompt: situation,
    speech: say.situation.speech({ situation }),
    visual: { type: 'picture', emoji, caption: null },
    answer: FEELINGS[feeling].emoji,
    explain: say.situation.explain({ word: FEELINGS[feeling].word }),
    choices: shuffle([feeling, ...wrong]).map((id) => FEELINGS[id].emoji),
    choiceStyle: 'picture',
  };
}

function fairPlay() {
  const { FAIR_PLAY, say } = sel();
  const [emoji, situation, fair, unfair] = pick(FAIR_PLAY);
  return {
    prompt: situation,
    speech: say.fair.speech({ situation }),
    visual: { type: 'picture', emoji, caption: null },
    answer: fair,
    explain: say.fair.explain({ fair }),
    choices: shuffle([fair, ...unfair]),
    choiceStyle: 'word',
  };
}

function inTheirShoes() {
  const { PERSPECTIVES, say } = sel();
  const [emoji, story, question, answer, wrong] = pick(PERSPECTIVES);
  return {
    prompt: `${story} ${question}`,
    speech: `${story} ${question}`,
    visual: { type: 'picture', emoji, caption: null },
    answer,
    explain: say.shoes.explain({ answer }),
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
