import { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MemoryCard from '../components/MemoryCard';
import PlayerBanner from '../components/PlayerBanner';
import PlayerStatsRow from '../components/PlayerStatsRow';
import ChipGuessModal from '../components/ChipGuessModal';
import MemoryResultsModal from '../components/MemoryResultsModal';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { profileBand } from '../utils/profiles';
import { buildPlayers } from '../utils/players';
import {
  createDeck,
  otherPlayer,
  chipCostToMatch,
  isStalemate,
  startingChips,
  getVariant,
  gapQuestionSpeech,
} from '../utils/memoryGame';
import { buddyLevel, chooseFirstCard, chooseSecondCard, decideGap, forgetCards, observeCard } from '../utils/memoryBuddy';
import { colors } from '../utils/theme';

const PEEK_DELAY_MS = 700;
const GUESS_FEEDBACK_DELAY_MS = 1400;
const BUDDY_FIRST_FLIP_MS = 900;
const BUDDY_SECOND_FLIP_MS = 800;
const BUDDY_THINK_MS = 1500;
const COLUMNS = 4;
const GRID_GAP = 10;
const CONTENT_PADDING = 16;
const MAX_GRID_WIDTH = 480;

export default function MemoryGameScreen({ route, navigation }) {
  const variant = getVariant(route.params?.variant);
  const mode = route.params?.mode === 'solo' ? 'solo' : 'duo';
  const isSolo = mode === 'solo';
  const { activeProfile } = useProfiles();
  const players = useMemo(() => buildPlayers(activeProfile, mode), [activeProfile, mode]);
  const level = buddyLevel(activeProfile ? profileBand(activeProfile).id : undefined);
  const { say } = useNarrator(activeProfile?.narration);

  const { width } = useWindowDimensions();
  const firstPlayer = () => (isSolo ? 1 : Math.random() < 0.5 ? 1 : 2);
  const [deck, setDeck] = useState(() => createDeck(variant.id));
  const [flippedCards, setFlippedCards] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(firstPlayer);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [chips, setChips] = useState({ 1: startingChips(variant.id), 2: startingChips(variant.id) });
  const [pendingMismatch, setPendingMismatch] = useState(null);
  const [selectedGuess, setSelectedGuess] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const timeoutRef = useRef(null);
  const buddyMemoryRef = useRef({});
  const mismatchCountRef = useRef(0);

  const isBuddyTurn = isSolo && currentPlayer === 2;
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
    } else if (flippedCards.length === 0 && !pendingMismatch && isStalemate(deck, chips)) {
      setIsStuck(true);
      setGameOver(true);
    }
  }, [deck, chips, flippedCards, pendingMismatch]);

  // Read the chip question aloud on the child's turn (Dot Chips players can't read yet).
  useEffect(() => {
    if (pendingMismatch && !isBuddyTurn && pendingMismatch.chipsAvailable >= pendingMismatch.cost) {
      say(gapQuestionSpeech(pendingMismatch.lowFace, pendingMismatch.highFace));
    }
  }, [pendingMismatch, isBuddyTurn, say]);

  // Buddy flips its two cards.
  useEffect(() => {
    if (!isBuddyTurn || gameOver || pendingMismatch || isBusy || flippedCards.length >= 2) return undefined;
    const delay = flippedCards.length === 0 ? BUDDY_FIRST_FLIP_MS : BUDDY_SECOND_FLIP_MS;
    const timer = setTimeout(() => {
      const card =
        flippedCards.length === 0
          ? chooseFirstCard(deck, buddyMemoryRef.current)
          : chooseSecondCard(deck, buddyMemoryRef.current, flippedCards[0]);
      if (card) flipCard(card);
    }, delay);
    return () => clearTimeout(timer);
    // flipCard reads the same state listed here; nothing else changes mid-turn.
  }, [isBuddyTurn, gameOver, pendingMismatch, isBusy, flippedCards, deck]);

  // Buddy decides whether to pay chips for a mismatch, and how many.
  useEffect(() => {
    if (!isBuddyTurn || !pendingMismatch || selectedGuess !== null) return undefined;
    const timer = setTimeout(() => {
      const guess = decideGap({ ...pendingMismatch, accuracy: level.accuracy, attempt: level.attempt });
      if (guess === null) handleSkip();
      else handleSelectGuess(guess);
    }, BUDDY_THINK_MS);
    return () => clearTimeout(timer);
  }, [isBuddyTurn, pendingMismatch, selectedGuess]);

  function handleCardPress(card) {
    if (isBuddyTurn) return;
    flipCard(card);
  }

  function flipCard(card) {
    if (isBusy || gameOver || card.status !== 'hidden' || flippedCards.length >= 2) return;

    buddyMemoryRef.current = observeCard(buddyMemoryRef.current, card, level.recall);
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
          mismatchCountRef.current += 1;
          setPendingMismatch({
            id: mismatchCountRef.current,
            lowId: lower.id,
            highId: higher.id,
            lowFace: lower.face,
            highFace: higher.face,
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
    buddyMemoryRef.current = forgetCards(buddyMemoryRef.current, [first.id, second.id]);
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
        buddyMemoryRef.current = forgetCards(buddyMemoryRef.current, [lowId, highId]);
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
      }
      endTurn();
    }, GUESS_FEEDBACK_DELAY_MS);
  }

  function handleSkip() {
    const { lowId, highId } = pendingMismatch;
    setDeck((prev) =>
      prev.map((c) => (c.id === lowId || c.id === highId ? { ...c, status: 'hidden' } : c))
    );
    endTurn();
  }

  function endTurn() {
    setPendingMismatch(null);
    setSelectedGuess(null);
    setFlippedCards([]);
    setIsBusy(false);
    setCurrentPlayer((prev) => otherPlayer(prev));
  }

  function resetGame() {
    buddyMemoryRef.current = {};
    setDeck(createDeck(variant.id));
    setFlippedCards([]);
    setCurrentPlayer(firstPlayer());
    setScores({ 1: 0, 2: 0 });
    setChips({ 1: startingChips(variant.id), 2: startingChips(variant.id) });
    setPendingMismatch(null);
    setSelectedGuess(null);
    setIsBusy(false);
    setGameOver(false);
    setIsStuck(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.homeLink}>
            <Text style={styles.homeLinkText}>← Back</Text>
          </Pressable>
          <Text style={styles.variantTitle}>
            {variant.emoji} {variant.title}
          </Text>
        </View>

        <PlayerBanner players={players} activePlayer={currentPlayer} isBuddy={isBuddyTurn} />
        <PlayerStatsRow players={players} scores={scores} chips={chips} activePlayer={currentPlayer} />

        <View style={[styles.grid, { width: gridWidth, gap: GRID_GAP }]}>
          {deck.map((card) => (
            <MemoryCard
              key={card.id}
              face={card.face}
              status={card.status}
              size={cardSize}
              disabled={isBusy || isBuddyTurn}
              onPress={() => handleCardPress(card)}
            />
          ))}
        </View>
      </ScrollView>

      <ChipGuessModal
        visible={!!pendingMismatch}
        mismatch={pendingMismatch}
        players={players}
        activePlayer={currentPlayer}
        variant={variant}
        isBuddyTurn={isBuddyTurn}
        selectedGuess={selectedGuess}
        onSelectGuess={handleSelectGuess}
        onSkip={handleSkip}
        onCountChip={(n) => say(String(n))}
      />

      <MemoryResultsModal
        visible={gameOver}
        players={players}
        scores={scores}
        note={isStuck ? "Nobody has enough chips to match the last cards, so the game's over!" : null}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  homeLink: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  homeLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.purple,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});
