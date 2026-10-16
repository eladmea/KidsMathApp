import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { chooseVoice, listVoices, speakNow, useSpeechStatus } from '../utils/useNarrator';
import { isOnlineVoice, pickBestVoice } from '../utils/voices';
import { colors } from '../utils/theme';

const SAMPLE = "Hi! Let's count together: one, two, three. Great job!";
const MAX_VOICES = 8;

// "Read-aloud voice" for this device: automatic (the best voice found) or a
// grown-up's pick, each with a ▶ preview.
export default function VoicePicker() {
  const status = useSpeechStatus();
  const [voices, setVoices] = useState(null);

  useEffect(() => {
    let isActive = true;
    listVoices().then((found) => {
      if (isActive) setVoices(found);
    });
    return () => {
      isActive = false;
    };
  }, []);

  async function pick(id) {
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
      <Pressable onPress={() => pick(null)} style={[styles.row, status.choice === null && styles.rowOn]} accessibilityLabel="Automatic voice">
        <Text style={styles.name}>✨ Automatic{best ? ` (${best.name})` : ''}</Text>
        <Text style={styles.mark}>{status.choice === null ? '✓' : '▶'}</Text>
      </Pressable>
      {voices.slice(0, MAX_VOICES).map((voice) => (
        <Pressable
          key={voice.identifier}
          onPress={() => pick(voice.identifier)}
          style={[styles.row, status.choice === voice.identifier && styles.rowOn]}
          accessibilityLabel={`Voice ${voice.name}`}
        >
          <Text style={styles.name} numberOfLines={1}>
            {voice.name} <Text style={styles.lang}>{voice.language}{isOnlineVoice(voice) ? ' · online' : ''}</Text>
          </Text>
          <Text style={styles.mark}>{status.choice === voice.identifier ? '✓' : '▶'}</Text>
        </Pressable>
      ))}
      <Text style={styles.status}>
        {status.speaking ? '🔊 Speaking…' : status.voiceName ? `Now using: ${status.voiceName}` : 'Using the device default voice'}
        {status.error === 'speak' ? ' · the last sentence could not be spoken' : ''}
      </Text>
      <Text style={styles.note}>
        Tap a voice to hear it. Voices come from this device and are free: "Natural", "Premium", "Enhanced" and
        Google voices sound the most human. Online voices need internet; without it an on-device voice is used. On
        iPhone/iPad, download better voices in Settings → Accessibility → Spoken Content → Voices. On Android, in
        Settings → Text-to-speech → Google → Install voice data.
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
  status: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 4,
  },
});
