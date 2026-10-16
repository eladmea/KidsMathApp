import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { chooseVoice, getVoiceChoice, listVoices, loadVoice, speakNow } from '../utils/useNarrator';
import { pickBestVoice } from '../utils/voices';
import { colors } from '../utils/theme';

const SAMPLE = "Hi! Let's count together: one, two, three. Great job!";
const MAX_VOICES = 8;

// "Read-aloud voice" for this device: automatic (the best voice found) or a
// grown-up's pick, each with a ▶ preview.
export default function VoicePicker() {
  const [voices, setVoices] = useState(null);
  const [choice, setChoice] = useState(getVoiceChoice());

  useEffect(() => {
    let isActive = true;
    Promise.all([loadVoice(), listVoices()]).then(([, found]) => {
      if (!isActive) return;
      setVoices(found);
      setChoice(getVoiceChoice());
    });
    return () => {
      isActive = false;
    };
  }, []);

  async function pick(id) {
    setChoice(id);
    await chooseVoice(id);
    speakNow(SAMPLE);
  }

  if (voices === null) return <Text style={styles.note}>Looking for voices…</Text>;
  if (!voices.length) {
    return <Text style={styles.note}>This device didn't list any English voices, so its default voice is used.</Text>;
  }
  const best = voices.find((v) => v.identifier === pickBestVoice(voices));

  return (
    <View>
      <Pressable onPress={() => pick(null)} style={[styles.row, choice === null && styles.rowOn]} accessibilityLabel="Automatic voice">
        <Text style={styles.name}>✨ Automatic{best ? ` (${best.name})` : ''}</Text>
        <Text style={styles.mark}>{choice === null ? '✓' : '▶'}</Text>
      </Pressable>
      {voices.slice(0, MAX_VOICES).map((voice) => (
        <Pressable
          key={voice.identifier}
          onPress={() => pick(voice.identifier)}
          style={[styles.row, choice === voice.identifier && styles.rowOn]}
          accessibilityLabel={`Voice ${voice.name}`}
        >
          <Text style={styles.name} numberOfLines={1}>
            {voice.name} <Text style={styles.lang}>{voice.language}</Text>
          </Text>
          <Text style={styles.mark}>{choice === voice.identifier ? '✓' : '▶'}</Text>
        </Pressable>
      ))}
      <Text style={styles.note}>
        Tap a voice to hear it. Voices come from this device: "Natural", "Enhanced" and Google voices sound the most
        human. On iPhone/iPad you can download better voices in Settings → Accessibility → Spoken Content → Voices.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EEEAF5',
    marginBottom: 6,
  },
  rowOn: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
  },
  lang: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
  },
  mark: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 4,
  },
});
