import { useAudioPlayer } from 'expo-audio';

const correctSound = require('../assets/sounds/correct.wav');
const wrongSound = require('../assets/sounds/wrong.wav');

export function useSoundEffects() {
  const correctPlayer = useAudioPlayer(correctSound);
  const wrongPlayer = useAudioPlayer(wrongSound);

  const playCorrect = async () => {
    await correctPlayer.seekTo(0);
    correctPlayer.play();
  };

  const playWrong = async () => {
    await wrongPlayer.seekTo(0);
    wrongPlayer.play();
  };

  return { playCorrect, playWrong };
}
