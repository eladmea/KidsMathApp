import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../components/ProgressBar';
import ScoreCounter from '../components/ScoreCounter';
import AnswerButton from '../components/AnswerButton';
import QuestionVisual from '../components/QuestionVisual';
import NumberLineInput from '../components/NumberLineInput';
import WordBuilderInput from '../components/WordBuilderInput';
import StoryStripInput from '../components/StoryStripInput';
import ExampleCard, { exampleSpeech } from '../components/ExampleCard';
import { playPhoneme } from '../utils/phonemeAudio';
import { soundSpeech } from '../curriculum/phonics';
import { useProfiles } from '../context/ProfileContext';
import { useSoundEffects } from '../utils/useSoundEffects';
import { useNarrator } from '../utils/useNarrator';
import { buildSession, replaceRemaining, tallyBySkill } from '../utils/session';
import { getRecord, hasPassed, toDayKey } from '../utils/progress';
import { adapt, skillForLevel } from '../utils/adaptive';
import { appendPlayLog } from '../utils/storage';
import { getSkill, isQuizSkill } from '../curriculum/skills';
import { generateQuestion } from '../curriculum/generators';
import { HOW_TO } from '../curriculum/howTo';
import { COACH_INTRO, talkPrompt } from '../curriculum/talkPrompts';
import { colors, shadow } from '../utils/theme';

// How long the green/red result stays before the next question. A wrong
// answer stays longer so the child can see which one was right.
const FEEDBACK_MS = { correct: 1400, wrong: 2200 };
// Number lines, built words and stories need longer to look at.
const REVIEW_DELAY_MS = { numberLine: 2000, build: 2400, order: 2800 };

function isCorrectAnswer(question, choice) {
  switch (question.type) {
    case 'numberLine':
      return Math.abs(choice - question.answer) <= question.tolerance;
    case 'build':
      return choice.join('') === question.answer;
    case 'order':
      return choice.join(',') === question.answer.join(',');
    default:
      return choice === question.answer;
  }
}

const LEVEL_NOTES = {
  down: (skill) => `⬇️ Let's practice ${skill.emoji} ${skill.title} for a bit`,
  up: (skill, level) => (level > 0 ? `⚡ Level up! ${skill.emoji} ${skill.title}` : `⬆️ Back to ${skill.emoji} ${skill.title}. Nice!`),
  hint: () => "💡 Here's a hint",
};

// Generic skill-driven round: works for a single skill (practice) or several
// interleaved skills (review). Practice rounds adapt: a run of wrong answers
// steps down a level with a hint, a run of right ones steps up.
export default function QuizScreen({ route, navigation }) {
  // mode: 'practice' (one skill), 'review' (Daily Review) or 'mixed' (an
  // adventure's mixed practice). `count` shortens rounds in an adventure.
  const { skillIds, mode = 'practice', count, adventureStep } = route.params;
  const { activeProfile, progress, isCoaching } = useProfiles();
  const [questions, setQuestions] = useState(() => buildSession(skillIds, count));
  // Coach mode: after an answer, a talk prompt waits for "Next".
  const [coachPrompt, setCoachPrompt] = useState(null);
  const advanceRef = useRef(null);
  const baseSkill = getSkill(skillIds[0]);
  const isAdaptive = mode === 'practice' && isQuizSkill(baseSkill);
  const [level, setLevel] = useState(0);
  const [levelNote, setLevelNote] = useState(null);
  const streakRef = useRef(0);
  const skill = isAdaptive ? skillForLevel(baseSkill, level) : baseSkill;
  const howTo = skill?.generator ? HOW_TO[skill.generator] : null;
  const makeExample = (exampleSkill = skill) =>
    exampleSkill?.generator ? { ...generateQuestion(exampleSkill.generator), id: 'example' } : null;
  // A worked example opens practice rounds until the child has passed the skill.
  const [example, setExample] = useState(() =>
    mode === 'practice' && skill?.generator && !hasPassed(getRecord(progress, skill.id)) ? makeExample() : null
  );

  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const { playCorrect, playWrong } = useSoundEffects();
  const { say, stop } = useNarrator(activeProfile?.narration);
  const timeoutRef = useRef(null);
  const blendTimerRef = useRef(null);
  // Play-test log: when the question appeared, how often it was replayed,
  // and whether the round was finished.
  const shownAtRef = useRef(Date.now());
  const replaysRef = useRef(0);
  const answeredRef = useRef(0);
  const finishedRef = useRef(false);
  const profileId = activeProfile?.id;

  const currentQuestion = questions[questionIndex];
  const isAnswerLocked = selectedChoice !== null;
  const score = results.filter(Boolean).length;
  const title =
    mode === 'review'
      ? '⭐ Daily Review'
      : mode === 'mixed'
        ? '🔀 Mixed Practice'
        : `${getSkill(skillIds[0])?.emoji ?? ''} ${getSkill(skillIds[0])?.title ?? ''}`;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (blendTimerRef.current) clearTimeout(blendTimerRef.current);
    };
  }, []);

  // Leaving a practice round early is logged as a quit.
  useEffect(() => {
    return () => {
      if (finishedRef.current || !profileId || mode !== 'practice' || !baseSkill) return;
      appendPlayLog(profileId, [
        {
          type: 'quit',
          at: Date.now(),
          day: toDayKey(),
          skillId: baseSkill.id,
          mode,
          answered: answeredRef.current,
          total: questions.length,
        },
      ]);
    };
    // Only on unmount.
  }, []);

  useEffect(() => {
    replaysRef.current = 0;
  }, [currentQuestion]);

  useEffect(() => {
    if (!example) shownAtRef.current = Date.now();
  }, [currentQuestion, example]);

  useEffect(() => {
    // Listening tasks (rhymes, sounds, spelling) are read aloud even when
    // narration is off — they can't be done without hearing the word.
    if (example) {
      say(exampleSpeech(howTo, example), { force: Boolean(example.speakAlways) });
    } else if (currentQuestion) {
      say(currentQuestion.speech, { force: Boolean(currentQuestion.speakAlways) });
    }
  }, [currentQuestion, example, howTo, say]);

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>This game isn't ready yet.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.exitLink}>
          <Text style={styles.exitLinkText}>← Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  function handleChoicePress(choice) {
    if (isAnswerLocked) return;

    const isCorrect = isCorrectAnswer(currentQuestion, choice);
    const nextResults = [...results, isCorrect];
    setSelectedChoice(choice);
    setResults(nextResults);
    answeredRef.current = nextResults.length;

    const adapted = isAdaptive ? adapt({ level, streak: streakRef.current }, isCorrect, baseSkill) : null;
    if (adapted) streakRef.current = adapted.streak;
    const now = Date.now();
    const events = [
      {
        type: 'answer',
        at: now,
        day: toDayKey(),
        skillId: currentQuestion.skillId,
        baseSkillId: baseSkill?.id,
        mode,
        correct: isCorrect,
        ms: now - shownAtRef.current,
        replays: replaysRef.current,
        level,
        coach: isCoaching,
      },
    ];
    const nextSkill = adapted?.change ? skillForLevel(baseSkill, adapted.level) : null;
    if (adapted?.change) {
      events.push({ type: 'level', at: now, day: toDayKey(), skillId: baseSkill.id, change: adapted.change, toSkillId: nextSkill.id });
    }
    if (profileId) appendPlayLog(profileId, events);

    // Show the green/red result first; stopping speech and starting a sound
    // can stall a phone's screen for a moment, so do that a frame later.
    setTimeout(() => {
      stop();
      if (isCorrect) playCorrect();
      else playWrong();
    }, 30);
    if (currentQuestion.type === 'build') {
      // Blend the sounds back into the word: "kuh, aah, tuh… cat!"
      const sounds = currentQuestion.parts.map(soundSpeech).join(', ');
      blendTimerRef.current = setTimeout(() => say(`${sounds}… ${currentQuestion.word}!`, { force: true }), 400);
    }

    const advance = () => {
      setCoachPrompt(null);
      advanceRef.current = null;
      const nextIndex = questionIndex + 1;
      if (nextIndex >= questions.length) {
        finishedRef.current = true;
        navigation.replace('Results', {
          skillIds,
          mode,
          adventureStep,
          score: nextResults.filter(Boolean).length,
          total: questions.length,
          tallies: tallyBySkill(questions, nextResults),
        });
      } else {
        if (adapted?.change === 'up' || adapted?.change === 'down') {
          setQuestions(replaceRemaining(questions, nextIndex, nextSkill));
          setLevel(adapted.level);
        }
        if (adapted?.change) setLevelNote(LEVEL_NOTES[adapted.change](nextSkill, adapted.level));
        else setLevelNote(null);
        // A run of wrong answers gets a worked example of the (easier) skill.
        if (adapted?.change === 'down' || adapted?.change === 'hint') setExample(makeExample(nextSkill));
        setQuestionIndex(nextIndex);
        setSelectedChoice(null);
      }
    };

    if (isCoaching) {
      // Give the grown-up and child time to talk before moving on.
      const subject = getSkill(currentQuestion.skillId)?.subject;
      setCoachPrompt({ text: talkPrompt(subject, isCorrect, questionIndex), isCorrect });
      advanceRef.current = advance;
    } else {
      timeoutRef.current = setTimeout(advance, REVIEW_DELAY_MS[currentQuestion.type] ?? FEEDBACK_MS[isCorrect ? 'correct' : 'wrong']);
    }
  }

  function getButtonState(choice) {
    if (!isAnswerLocked) return 'default';
    if (choice === currentQuestion.answer) return 'correct';
    if (choice === selectedChoice) return 'wrong';
    return 'disabled';
  }

  const isLongPrompt = currentQuestion.prompt.length > 12;
  const isVeryLongPrompt = currentQuestion.prompt.length > 40;
  const isCorrect = isAnswerLocked && isCorrectAnswer(currentQuestion, selectedChoice);

  function renderAnswerArea() {
    switch (currentQuestion.type) {
      case 'numberLine':
        return (
          <NumberLineInput
            key={currentQuestion.id}
            min={currentQuestion.min}
            max={currentQuestion.max}
            guess={selectedChoice}
            answer={currentQuestion.answer}
            isCorrect={isCorrect}
            disabled={isAnswerLocked}
            onGuess={handleChoicePress}
          />
        );
      case 'build':
        return (
          <WordBuilderInput
            key={currentQuestion.id}
            question={currentQuestion}
            submitted={isAnswerLocked}
            isCorrect={isCorrect}
            onSubmit={handleChoicePress}
            onTileSound={(tile) => playPhoneme(tile, (text) => say(text, { force: true }))}
          />
        );
      case 'order':
        return (
          <StoryStripInput
            key={currentQuestion.id}
            question={currentQuestion}
            submitted={isAnswerLocked}
            isCorrect={isCorrect}
            onSubmit={handleChoicePress}
            onReadCaption={(caption) => say(caption)}
          />
        );
      default:
        return (
          <View style={styles.choicesGrid}>
            {currentQuestion.choices.map((choice) => (
              <AnswerButton
                key={String(choice)}
                value={choice}
                variant={currentQuestion.choiceStyle}
                state={getButtonState(choice)}
                disabled={isAnswerLocked}
                onPress={() => handleChoicePress(choice)}
              />
            ))}
          </View>
        );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.roundButton, shadow]} accessibilityLabel="Quit">
            <Text style={styles.roundButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {howTo && mode === 'practice' && !example && (
            <Pressable
              onPress={() => setExample(makeExample())}
              style={[styles.roundButton, shadow]}
              accessibilityLabel="Show an example"
            >
              <Text style={styles.roundButtonText}>❓</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              if (example) {
                say(exampleSpeech(howTo, example), { force: true });
              } else {
                replaysRef.current += 1;
                say(currentQuestion.speech, { force: true });
              }
            }}
            style={[styles.roundButton, shadow]}
            accessibilityLabel="Say it again"
          >
            <Text style={styles.roundButtonText}>🔊</Text>
          </Pressable>
        </View>

        {example ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {levelNote ? <Text style={styles.levelNote}>{levelNote}</Text> : null}
            <ExampleCard question={example} howTo={howTo} onDone={() => setExample(null)} />
          </ScrollView>
        ) : (
          <>
            <ProgressBar current={questionIndex + 1} total={questions.length} />
            {levelNote ? <Text style={styles.levelNote}>{levelNote}</Text> : null}
            <ScoreCounter score={score} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.questionBox}>
                <Text style={[styles.questionText, isLongPrompt && styles.questionTextLong, isVeryLongPrompt && styles.questionTextSmall]}>
                  {currentQuestion.prompt}
                </Text>
                <QuestionVisual
                  key={currentQuestion.id}
                  visual={currentQuestion.visual}
                  result={isAnswerLocked ? (isCorrect ? 'correct' : 'wrong') : null}
                  reveal={isAnswerLocked ? currentQuestion.answer : null}
                />
              </View>

              {isCoaching && questionIndex === 0 && !isAnswerLocked && (
                <Text style={styles.coachIntro}>👪 Playing together: {COACH_INTRO}</Text>
              )}

              {renderAnswerArea()}

              {coachPrompt && (
                <View style={[styles.coachCard, shadow]}>
                  <Text style={styles.coachLabel}>👪 Talk about it</Text>
                  <Text style={styles.coachText}>{coachPrompt.text}</Text>
                  {currentQuestion.explain ? <Text style={styles.coachExplain}>💡 {currentQuestion.explain}</Text> : null}
                  <Pressable
                    onPress={() => advanceRef.current && advanceRef.current()}
                    style={styles.coachNext}
                    accessibilityLabel="Next question"
                  >
                    <Text style={styles.coachNextText}>Next ▶</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    gap: 10,
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  questionBox: {
    marginVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  questionText: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
  },
  questionTextLong: {
    fontSize: 32,
  },
  questionTextSmall: {
    fontSize: 20,
    lineHeight: 30,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  coachIntro: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
    textAlign: 'center',
    marginBottom: 8,
  },
  coachCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.purple,
    padding: 14,
    marginTop: 12,
  },
  coachLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.purple,
  },
  coachText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 4,
  },
  coachExplain: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray,
    marginTop: 6,
  },
  coachNext: {
    alignSelf: 'flex-end',
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  coachNextText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  levelNote: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.purple,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  exitLink: {
    marginTop: 16,
    padding: 10,
  },
  exitLinkText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
});
