import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Pressable, Text } from 'react-native';
import MemoryCard from '../components/MemoryCard';
import PlayerBanner from '../components/PlayerBanner';
import PlayerStatsRow from '../components/PlayerStatsRow';
import ChipOfferModal from '../components/ChipOfferModal';
import MemoryResultsModal from '../components/MemoryResultsModal';
import { createDeck, otherPlayer, chipCostToMatch, STARTING_CHIPS } from '../utils/memoryGame';
import { colors } from '../utils/theme';

const PEEK_DELAY_MS = 700;

export default function MemoryGameScreen({ navigation }) {
  const [deck, setDeck] = useState(() => createDeck());
  const [flippedCards, setFlippedCards] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(() => (Math.random() < 0.5 ? 1 : 2));
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [chips, setChips] = useState({ 1: STARTING_CHIPS, 2: STARTING_CHIPS });
  const [pendingMismatch, setPendingMismatch] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const timeoutRef = useRef(null);

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
          setPendingMismatch({
            lowId: lower.id,
            highId: higher.id,
            lowValue: lower.value,
            highValue: higher.value,
            cost: chipCostToMatch(lower.value, higher.value),
            chipsAvailable: chips[currentPlayer],
            opponent: otherPlayer(currentPlayer),
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

  function handleUseChips() {
    const { lowId, highId, highValue, cost, opponent } = pendingMismatch;
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
    setPendingMismatch(null);
    setFlippedCards([]);
    setIsBusy(false);
  }

  function handleDecline() {
    const { lowId, highId } = pendingMismatch;
    setDeck((prev) =>
      prev.map((c) => (c.id === lowId || c.id === highId ? { ...c, status: 'hidden' } : c))
    );
    setPendingMismatch(null);
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
    setIsBusy(false);
    setGameOver(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable onPress={() => navigation.popToTop()} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>🏠 Home</Text>
        </Pressable>

        <PlayerBanner activePlayer={currentPlayer} />
        <PlayerStatsRow scores={scores} chips={chips} activePlayer={currentPlayer} />

        <View style={styles.grid}>
          {deck.map((card) => (
            <MemoryCard
              key={card.id}
              value={card.value}
              status={card.status}
              disabled={isBusy}
              onPress={() => handleCardPress(card)}
            />
          ))}
        </View>
      </View>

      <ChipOfferModal
        visible={!!pendingMismatch}
        mismatch={pendingMismatch}
        activePlayer={currentPlayer}
        onUseChips={handleUseChips}
        onDecline={handleDecline}
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
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
    justifyContent: 'center',
    width: '100%',
  },
});
