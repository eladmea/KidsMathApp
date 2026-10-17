import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BigButton from '../components/BigButton';
import PlayerBanner from '../components/PlayerBanner';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { buildPlayers } from '../utils/players';
import { getBoard, hasWon, spin, stepSquares } from '../utils/pathRace';
import { otherPlayer } from '../utils/memoryGame';
import { colors, shadow } from '../utils/theme';

const BUDDY_STEP_MS = 750;
const BUDDY_SPIN_DELAY_MS = 900;
const TURN_PAUSE_MS = 700;
const MAX_BOARD_WIDTH = 480;

// Number Path Race: spin, then hop along a linear number path, saying (and on
// your turn, tapping) each number you land on.
export default function PathRaceScreen({ route, navigation }) {
  const board = getBoard(route.params?.board);
  const mode = route.params?.mode === 'duo' ? 'duo' : 'solo';
  const isSolo = mode === 'solo';
  const { activeProfile } = useProfiles();
  const players = useMemo(() => buildPlayers(activeProfile, mode), [activeProfile, mode]);
  // Counting aloud is the point of this game, so it always speaks.
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const { width } = useWindowDimensions();

  const [positions, setPositions] = useState({ 1: 0, 2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [spinResult, setSpinResult] = useState(null);
  const [pendingSteps, setPendingSteps] = useState([]);
  const [winner, setWinner] = useState(null);
  const [hint, setHint] = useState(null);
  // Timers for turn changes / win announcements (buddy moves use their own).
  const turnTimerRef = useRef(null);

  const isBuddyTurn = isSolo && currentPlayer === 2;
  const boardWidth = Math.min(width, MAX_BOARD_WIDTH) - 32;
  const squareSize = Math.floor(boardWidth / board.rowLength) - 4;
  const rows = Array.from({ length: board.length / board.rowLength }, (_, r) =>
    Array.from({ length: board.rowLength }, (_, c) => r * board.rowLength + c + 1)
  );

  useEffect(() => () => clearTimeout(turnTimerRef.current), []);

  useEffect(() => {
    say(`${players[currentPlayer].name}, spin!`);
  }, [currentPlayer, players, say]);

  // Buddy spins and hops on its own, counting out loud.
  useEffect(() => {
    if (!isBuddyTurn || winner) return undefined;
    let timer = null;
    if (spinResult === null) {
      timer = setTimeout(doSpin, BUDDY_SPIN_DELAY_MS);
    } else if (pendingSteps.length > 0) {
      timer = setTimeout(() => hop(pendingSteps[0]), BUDDY_STEP_MS);
    }
    return () => clearTimeout(timer);
    // doSpin/hop only read the state listed here.
  }, [isBuddyTurn, winner, spinResult, pendingSteps]);

  function doSpin() {
    if (spinResult !== null || winner) return;
    const steps = spin(board);
    setSpinResult(steps);
    setPendingSteps(stepSquares(positions[currentPlayer], steps, board));
    say(steps === 1 ? 'One! Hop one square.' : `${steps}! Hop ${steps} squares.`);
  }

  function hop(square) {
    const next = { ...positions, [currentPlayer]: square };
    setPositions(next);
    say(String(square));
    const remaining = pendingSteps.slice(1);
    setPendingSteps(remaining);
    if (hasWon(square, board)) {
      setWinner(currentPlayer);
      playCorrect();
      turnTimerRef.current = setTimeout(() => say(`${players[currentPlayer].name} wins!`), 600);
      return;
    }
    if (remaining.length === 0) {
      turnTimerRef.current = setTimeout(() => {
        setSpinResult(null);
        setCurrentPlayer(otherPlayer(currentPlayer));
      }, TURN_PAUSE_MS);
    }
  }

  function handleSquarePress(square) {
    if (isBuddyTurn || winner || pendingSteps.length === 0) return;
    if (square === pendingSteps[0]) {
      setHint(null);
      hop(square);
    } else {
      // Gently point at the right square and say its number.
      setHint(pendingSteps[0]);
      playWrong();
      say(`Hop to ${pendingSteps[0]}.`);
    }
  }

  function restart() {
    clearTimeout(turnTimerRef.current);
    setPositions({ 1: 0, 2: 0 });
    setCurrentPlayer(1);
    setSpinResult(null);
    setPendingSteps([]);
    setWinner(null);
    setHint(null);
  }

  function renderSquare(square) {
    const isNext = pendingSteps[0] === square && !isBuddyTurn;
    const tokens = [1, 2].filter((p) => positions[p] === square);
    return (
      <Pressable
        key={square}
        onPress={() => handleSquarePress(square)}
        accessibilityLabel={`Square ${square}`}
        style={[
          styles.square,
          { width: squareSize, height: squareSize * 1.35 },
          square === board.length && styles.finishSquare,
          isNext && styles.nextSquare,
          hint === square && styles.hintSquare,
        ]}
      >
        <Text style={[styles.squareNumber, { fontSize: squareSize * 0.38 }]}>{square}</Text>
        <View style={styles.tokenRow} pointerEvents="none">
          {tokens.map((p) => (
            <Text key={p} style={{ fontSize: squareSize * 0.36 }}>
              {players[p].icon}
            </Text>
          ))}
        </View>
      </Pressable>
    );
  }

  const startTokens = [1, 2].filter((p) => positions[p] === 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>🏁 Number Path 1-{board.length}</Text>
        </View>

        <PlayerBanner players={players} activePlayer={currentPlayer} isBuddy={isBuddyTurn} />

        <View style={styles.startRow}>
          <Text style={styles.startLabel}>Start</Text>
          {startTokens.map((p) => (
            <Text key={p} style={styles.startToken}>
              {players[p].icon}
            </Text>
          ))}
        </View>

        <View style={[styles.board, { width: boardWidth }]}>
          {rows.map((row, i) => (
            <View key={i} style={styles.boardRow}>
              {row.map(renderSquare)}
            </View>
          ))}
        </View>

        <View style={styles.spinArea}>
          <View style={[styles.spinner, shadow]}>
            <Text style={styles.spinnerText}>{spinResult ?? '?'}</Text>
          </View>
          {winner ? null : isBuddyTurn ? (
            <Text style={styles.status}>{players[2].icon} is playing…</Text>
          ) : spinResult === null ? (
            <BigButton label="🎡 Spin!" color={players[currentPlayer].main} onPress={doSpin} style={styles.spinButton} />
          ) : (
            <Text style={styles.status}>
              {pendingSteps.length > 0 ? `Tap ${pendingSteps[0]} and say it!` : 'Nice hopping!'}
            </Text>
          )}
        </View>

        {winner && (
          <View style={[styles.winBox, shadow]}>
            <Text style={styles.winText}>
              🏆 {players[winner].icon} {players[winner].name} wins!
            </Text>
            <View style={styles.winButtons}>
              <BigButton label="Play Again" color={colors.green} onPress={restart} style={styles.winButton} />
              <BigButton label="🗺️ Map" color={colors.primary} onPress={() => navigation.popToTop()} style={styles.winButton} />
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
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MAX_BOARD_WIDTH,
    paddingVertical: 8,
  },
  backLink: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 40,
    marginBottom: 6,
  },
  startLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    backgroundColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  startToken: {
    fontSize: 28,
  },
  board: {
    gap: 8,
  },
  boardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  square: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  finishSquare: {
    backgroundColor: '#FFF4C2',
    borderColor: colors.orange,
  },
  nextSquare: {
    borderColor: colors.green,
    borderWidth: 4,
  },
  hintSquare: {
    backgroundColor: '#D9F7E6',
  },
  squareNumber: {
    fontWeight: '900',
    color: colors.textDark,
  },
  tokenRow: {
    flexDirection: 'row',
  },
  spinArea: {
    alignItems: 'center',
    marginTop: 24,
    gap: 14,
  },
  spinner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerText: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textDark,
  },
  spinButton: {
    minWidth: 200,
  },
  status: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
  winBox: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: MAX_BOARD_WIDTH,
    alignItems: 'center',
  },
  winText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
  },
  winButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  winButton: {
    paddingHorizontal: 20,
  },
});
