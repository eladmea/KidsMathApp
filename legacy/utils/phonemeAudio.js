import { createAudioPlayer } from 'expo-audio';
import { soundSpeech } from '../curriculum/phonics';

// Recorded letter sounds. Text-to-speech can't say isolated phonemes well, so a
// real voice recording is always preferred when one exists. To add one, drop
// the file in assets/phonemes/ and register it here, e.g.
//   m: require('../assets/phonemes/m.mp3'),
//   sh: require('../assets/phonemes/sh.mp3'),
// Graphemes without a recording fall back to a TTS-friendly spelling ("mmm").
export const PHONEME_RECORDINGS = {};

export function hasRecording(grapheme) {
  return Boolean(PHONEME_RECORDINGS[grapheme]);
}

// Plays one letter sound: the recording if there is one, else `speak(text)`.
export function playPhoneme(grapheme, speak) {
  const source = PHONEME_RECORDINGS[grapheme];
  if (!source) {
    speak(soundSpeech(grapheme));
    return;
  }
  const player = createAudioPlayer(source);
  const subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      subscription.remove();
      player.remove();
    }
  });
  player.play();
}
