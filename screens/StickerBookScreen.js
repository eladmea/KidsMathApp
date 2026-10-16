import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { stickerPages } from '../utils/stickers';
import { getSkill } from '../curriculum/skills';
import { colors, shadow } from '../utils/theme';

function stickerReason(sticker) {
  const [, ref] = sticker.key.split(':');
  if (sticker.kind === 'bloomed') return 'A flower bloomed in Garden Days';
  const skill = getSkill(ref);
  const title = skill ? skill.title : 'a skill';
  return sticker.kind === 'mastered' ? `Mastered ${title}` : `Passed ${title}`;
}

// The child's sticker book: earned stickers fill the pages in order.
export default function StickerBookScreen({ navigation }) {
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const stickers = activeProfile?.stickers || [];
  const pages = stickerPages(stickers);
  const [page, setPage] = useState(pages.length - 1);
  const [selected, setSelected] = useState(null);
  const shownPage = Math.min(page, pages.length - 1);

  function choose(sticker) {
    setSelected(sticker);
    say(stickerReason(sticker));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>📒 Sticker Book</Text>
        <Text style={styles.count}>
          {stickers.length} sticker{stickers.length === 1 ? '' : 's'}
        </Text>

        {pages.length > 1 && (
          <View style={styles.pageRow}>
            {pages.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setPage(i)}
                style={[styles.pageTab, i === shownPage && styles.pageTabActive]}
                accessibilityLabel={`Page ${i + 1}`}
              >
                <Text style={[styles.pageTabText, i === shownPage && styles.pageTabTextActive]}>{i + 1}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={[styles.page, shadow]}>
          {pages[shownPage].map((sticker, slot) =>
            sticker ? (
              <Pressable
                key={sticker.key}
                onPress={() => choose(sticker)}
                style={[styles.slot, styles.slotFilled, sticker.kind === 'mastered' && styles.slotGold]}
                accessibilityLabel={stickerReason(sticker)}
              >
                <Text style={styles.sticker}>{sticker.emoji}</Text>
              </Pressable>
            ) : (
              <View key={`empty-${slot}`} style={styles.slot}>
                <Text style={styles.emptySlot}>?</Text>
              </View>
            )
          )}
        </View>

        <Text style={styles.reason}>
          {selected ? `${selected.emoji} ${stickerReason(selected)}` : 'Tap a sticker to see how you earned it.'}
        </Text>

        <View style={[styles.howBox, shadow]}>
          <Text style={styles.howTitle}>How to earn stickers</Text>
          <Text style={styles.howLine}>⭐ Pass a skill for the first time</Text>
          <Text style={styles.howLine}>🏅 Master a skill (pass it on 2 different days)</Text>
          <Text style={styles.howLine}>🌻 Help a Garden Days flower bloom</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.purple,
  },
  count: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 4,
    marginBottom: 12,
  },
  pageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pageTab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.purple,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTabActive: {
    backgroundColor: colors.purple,
  },
  pageTabText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.purple,
  },
  pageTabTextActive: {
    color: colors.white,
  },
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 16,
  },
  slot: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D9D3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: colors.purple,
    backgroundColor: '#F3ECFF',
  },
  slotGold: {
    borderColor: '#C9A100',
    backgroundColor: '#FFF4C2',
  },
  sticker: {
    fontSize: 40,
  },
  emptySlot: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D9D3E8',
  },
  reason: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 14,
  },
  howBox: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    gap: 4,
  },
  howTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 4,
  },
  howLine: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
});
