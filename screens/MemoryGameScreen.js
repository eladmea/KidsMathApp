import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Pressable, Text, ScrollView, useWindowDimensions } from 'react-native';
import MemoryCard from '../components/MemoryCard';
import PlayerBanner from '../components/PlayerBanner';
import PlayerStatsRow from '../components/PlayerStatsRow';
import ChipGuessModal from '../components/ChipGuessModal';
import MemoryResultsModal from '../components/MemoryResultsModal';
import {
  createDeck,
  otherPlayer,
  chipCostToMatch,
  buildChipCostChoices,
  STARTING_CHIPS,
} from '../utils/memoryGame';
import { colors } from '../utils/theme';

const PEEK_DELAY_MS = 700;
const GUESS_FEEDBACK_DELAY_MS = 1400;
const COLUMNS = 4;
const GRID_GAP = 10;
const CONTENT_PADDING = 16;
const MAX_GRID_WIDTH = 480;

export default function MemoryGameScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [deck, setDeck] = useState(() => createDeck());
  const [flippedCards, setFlippedCards] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(() => (Math.random() < 0.5 ? 1 : 2));
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [chips, setChips] = useState({ 1: STARTING_CHIPS, 2: STARTING_CHIPS });
  const [pendingMismatch, setPendingMismatch] = useState(null);
  const [selectedGuess, setSelectedGuess] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const timeoutRef = useRef(null);

  const gridWidth = Math.min(width, MAX_GRID_WIDTH) - CONTENT_PADDING * 2;
  const cardSize = (gridWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (deck.length > 0 && deck.every((card) => card.status === 'matched')) {
      setGameOver(true);
    }
  }, [deck]);

  function handleCardPress(card) {
    if (isBusy || gameOver || card.status !== 'hidden' || flippedCards.length >= 2) return;

    setDeck((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: 'flipped' } : c)));
    const updatedFlipped = [...flippedCards, card];
    setFlippedCards(updatedFlipped);

    if (updatedFlipped.length === 2) {
      setIsBusy(true);
      const [first, second] = updatedFlipped;
      timeoutRef.current = setTimeout(() => {
        if (first.value === second.value) {
          resolveNaturalMatch(first, second);
        } else {
          const lower = first.value < second.value ? first : second;
          const higher = first.value < second.value ? second : first;
          const cost = chipCostToMatch(lower.value, higher.value);
          setPendingMismatch({
            lowId: lower.id,
            highId: higher.id,
            lowValue: lower.value,
            highValue: higher.value,
            cost,
            chipsAvailable: chips[currentPlayer],
            opponent: otherPlayer(currentPlayer),
            choices: buildChipCostChoices(cost),
          });
        }
      }, PEEK_DELAY_MS);
    }
  }

  function resolveNaturalMatch(first, second) {
    setDeck((prev) =>
      prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, status: 'matched' } : c))
    );
    setScores((prev) => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
    setFlippedCards([]);
    setIsBusy(false);
  }

  function handleSelectGuess(guess) {
    if (selectedGuess !== null) return;
    setSelectedGuess(guess);

    const { lowId, highId, highValue, cost, opponent } = pendingMismatch;
    const isCorrect = guess === cost;

    timeoutRef.current = setTimeout(() => {
      if (isCorrect) {
        setDeck((prev) =>
          prev.map((c) => {
            if (c.id === lowId) return { ...c, value: highValue, status: 'matched' };
            if (c.id === highId) return { ...c, status: 'matched' };
            return c;
          })
        );
        setChips((prev) => ({
          ...prev,
          [currentPlayer]: prev[currentPlayer] - cost,
          [opponent]: prev[opponent] + cost,
        }));
        setScores((prev) => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
      } else {
        setDeck((prev) =>
          prev.map((c) => (c.id === lowId || c.id === highId ? { ...c, status: 'hidden' } : c))
        );
        setChips((prev) => ({
          ...prev,
          [currentPlayer]: Math.max(0, prev[currentPlayer] - cost),
        }));
        setCurrentPlayer((prev) => otherPlayer(prev));
      }
      setPendingMismatch(null);
      setSelectedGuess(null);
      setFlippedCards([]);
      setIsBusy(false);
    }, GUESS_FEEDBACK_DELAY_MS);
  }

  function handleAcknowledgeCantAfford() {
    const { lowId, highId } = pendingMismatch;
    setDeck((prev) =>
      prev.map((c) => (c.id === lowId || c.id === highId ? { ...c, status: 'hidden' } : c))
    );
    setPendingMismatch(null);
    setSelectedGuess(null);
    setFlippedCards([]);
    setIsBusy(false);
    setCurrentPlayer((prev) => otherPlayer(prev));
  }

  function resetGame() {
    setDeck(createDeck());
    setFlippedCards([]);
    setCurrentPlayer(Math.random() < 0.5 ? 1 : 2);
    setScores({ 1: 0, 2: 0 });
    setChips({ 1: STARTING_CHIPS, 2: STARTING_CHIPS });
    setPendingMismatch(null);
    setSelectedGuess(null);
    setIsBusy(false);
    setGameOver(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.popToTop()} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>🏠 Home</Text>
        </Pressable>

        <PlayerBanner activePlayer={currentPlayer} />
        <PlayerStatsRow scores={scores} chips={chips} activePlayer={currentPlayer} />

        <View style={[styles.grid, { width: gridWidth, gap: GRID_GAP }]}>
          {deck.map((card) => (
            <MemoryCard
              key={card.id}
              value={card.value}
              status={card.status}
              size={cardSize}
              disabled={isBusy}
              onPress={() => handleCardPress(card)}
            />
          ))}
        </View>
      </ScrollView>

      <ChipGuessModal
        visible={!!pendingMismatch}
        mismatch={pendingMismatch}
        activePlayer={currentPlayer}
        selectedGuess={selectedGuess}
        onSelectGuess={handleSelectGuess}
        onAcknowledgeCantAfford={handleAcknowledgeCantAfford}
      />

      <MemoryResultsModal
        visible={gameOver}
        scores={scores}
        onPlayAgain={resetGame}
        onBackHome={() => navigation.popToTop()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  homeLink: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  homeLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});
