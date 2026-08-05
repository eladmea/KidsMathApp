import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@mathplay_high_score_';

export async function getHighScore(difficulty) {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + difficulty);
    return raw != null ? parseInt(raw, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export async function saveHighScoreIfBetter(difficulty, score) {
  try {
    const current = await getHighScore(difficulty);
    if (score > current) {
      await AsyncStorage.setItem(KEY_PREFIX + difficulty, String(score));
      return score;
    }
    return current;
  } catch (e) {
    return score;
  }
}
