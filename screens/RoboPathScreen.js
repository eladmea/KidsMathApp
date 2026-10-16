import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { DIRECTIONS, makePuzzle, runProgram } from '../utils/roboPath';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const PUZZLES_PER_ROUND = 6;
const STEP_MS = 350;
const MAX_TIMES = 4;
const SKIP_AFTER_FAILS = 2;

// Program the robot with arrow blocks. A puzzle counts as correct when the
// first run works; children can keep fixing their program after a mistake.
export default function RoboPathScreen({ route, navigation }) {
  const { skillId } = route.params;
  const level = skillId === 'logic-loops' ? 'loops' : 'steps';
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const { playCorrect, playWrong } = useSoundEffects();
  const { width } = useWindowDimensions();

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makePuzzle(level));
  const [blocks, setBlocks] = useState([]);
  const [robot, setRobot] = useState(puzzle.start);
  const [status, setStatus] = useState('edit');
  const [fails, setFails] = useState(0);
  const correctRef = useRef(0);
  const timers = useRef([]);

  const cell = Math.floor((Math.min(width, 480) - 40) / puzzle.size);
  const atLimit = puzzle.blockLimit !== null && blocks.length >= puzzle.blockLimit;

  useEffect(() => {
    say(
      puzzle.loops
        ? `Help the robot reach the cookie. Use repeat blocks: you can use ${puzzle.blockLimit} blocks.`
        : 'Help the robot reach the cookie!'
    );
  }, [puzzle, say]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function addBlock(dir) {
    if (status !== 'edit' || atLimit) return;
    setBlocks([...blocks, { dir, times: 1 }]);
  }

  function setTimes(times) {
    if (status !== 'edit' || blocks.length === 0) return;
    setBlocks([...blocks.slice(0, -1), { ...blocks[blocks.length - 1], times }]);
  }

  function run() {
    if (status !== 'edit' || blocks.length === 0) return;
    const { path, outcome } = runProgram(puzzle, blocks);
    setStatus('running');
    path.forEach((position, i) => {
      timers.current.push(setTimeout(() => setRobot(position), i * STEP_MS));
    });
    timers.current.push(
      setTimeout(() => finishRun(outcome), Math.max(1, path.length) * STEP_MS + 150)
    );
  }

  function finishRun(outcome) {
    if (outcome === 'goal') {
      if (fails === 0) correctRef.current += 1;
      setStatus('goal');
      playCorrect();
      say('Yum! The robot found the cookie!');
      timers.current.push(setTimeout(nextPuzzle, 1300));
    } else {
      setFails(fails + 1);
      setStatus(outcome);
      playWrong();
      say(outcome === 'crash' ? 'Bonk! The robot bumped into something.' : "The robot stopped before the cookie.");
    }
  }

  function retry() {
    setRobot(puzzle.start);
    setStatus('edit');
  }

  function nextPuzzle() {
    const next = puzzleIndex + 1;
    if (next >= PUZZLES_PER_ROUND) {
      finishSkillRound(navigation, skillId, correctRef.current, PUZZLES_PER_ROUND, route.params.adventureStep);
      return;
    }
    const fresh = makePuzzle(level);
    setPuzzleIndex(next);
    setPuzzle(fresh);
    setBlocks([]);
    setRobot(fresh.start);
    setStatus('edit');
    setFails(0);
  }

  const isRock = (r, c) => puzzle.rocks.some(([rr, rc]) => rr === r && rc === c);

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title={puzzle.loops ? '🔂 Robot Loops' : '🤖 Robo Path'}
        left={`⭐ ${correctRef.current}`}
        right={`${puzzleIndex + 1} / ${PUZZLES_PER_ROUND}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.grid, { width: cell * puzzle.size + 4 }]}>
          {Array.from({ length: puzzle.size }, (_, r) => (
            <View key={r} style={styles.row}>
              {Array.from({ length: puzzle.size }, (_, c) => {
                const hasRobot = robot[0] === r && robot[1] === c;
                const isGoal = puzzle.goal[0] === r && puzzle.goal[1] === c;
                const rock = isRock(r, c);
                const label = hasRobot ? 'robot' : isGoal ? 'cookie' : rock ? 'rock' : 'empty';
                return (
                  <View
                    key={c}
                    accessibilityLabel={`Cell ${r}-${c} ${label}${isGoal && hasRobot ? ' cookie' : ''}`}
                    style={[styles.cell, { width: cell, height: cell }]}
                  >
                    <Text style={{ fontSize: cell * 0.6 }}>
                      {hasRobot ? (status === 'crash' ? '😵' : '🤖') : isGoal ? '🍪' : rock ? '🪨' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.program}>
          {blocks.length === 0 ? (
            <Text style={styles.programHint}>Tap arrows to build a program</Text>
          ) : (
            blocks.map((block, i) => (
              <View key={i} style={styles.block}>
                <Text style={styles.blockText}>
                  {DIRECTIONS[block.dir].arrow}
                  {puzzle.loops ? `×${block.times}` : ''}
                </Text>
              </View>
            ))
          )}
        </View>
        {puzzle.loops && (
          <Text style={styles.limit}>
            Blocks: {blocks.length} / {puzzle.blockLimit}
          </Text>
        )}

        {status === 'edit' && (
          <>
            <View style={styles.pad}>
              {Object.entries(DIRECTIONS).map(([dir, { arrow }]) => (
                <Pressable
                  key={dir}
                  onPress={() => addBlock(dir)}
                  accessibilityLabel={`Add ${dir}`}
                  style={[styles.arrowButton, shadow, atLimit && styles.disabled]}
                >
                  <Text style={styles.arrowText}>{arrow}</Text>
                </Pressable>
              ))}
            </View>
            {puzzle.loops && (
              <View style={styles.pad}>
                {Array.from({ length: MAX_TIMES - 1 }, (_, i) => i + 2).map((times) => (
                  <Pressable
                    key={times}
                    onPress={() => setTimes(times)}
                    accessibilityLabel={`Repeat ${times}`}
                    style={[styles.timesButton, shadow]}
                  >
                    <Text style={styles.timesText}>×{times}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.actions}>
              <BigButton label="⌫" color={colors.gray} onPress={() => setBlocks(blocks.slice(0, -1))} style={styles.smallButton} />
              <BigButton label="▶ Run" color={colors.green} onPress={run} style={styles.runButton} />
            </View>
          </>
        )}

        {status === 'goal' && <Text style={styles.success}>🍪 Yum! You did it!</Text>}
        {(status === 'crash' || status === 'short') && (
          <View style={styles.failBox}>
            <Text style={styles.failText}>
              {status === 'crash' ? 'Bonk! Fix your program and try again.' : 'Not there yet! Add more steps.'}
            </Text>
            <View style={styles.actions}>
              <BigButton label="Try again" color={colors.primary} onPress={retry} style={styles.runButton} />
              {fails >= SKIP_AFTER_FAILS && (
                <BigButton label="⏭ Skip" color={colors.gray} onPress={nextPuzzle} style={styles.smallButton} />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  grid: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DCE6FF',
  },
  program: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    marginTop: 16,
    padding: 8,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.white,
    borderRadius: 16,
  },
  programHint: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray,
    alignSelf: 'center',
  },
  block: {
    backgroundColor: '#FFE9D4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  blockText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  limit: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.purple,
    marginTop: 6,
  },
  pad: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  arrowButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  arrowText: {
    fontSize: 32,
  },
  timesButton: {
    width: 64,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1E9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timesText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.purple,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  smallButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  runButton: {
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  success: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.greenDark,
    marginTop: 20,
  },
  failBox: {
    alignItems: 'center',
    marginTop: 16,
  },
  failText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.redDark,
    textAlign: 'center',
  },
});
