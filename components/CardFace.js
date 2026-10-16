import { Text, StyleSheet } from 'react-native';
import DotPattern from './DotPattern';
import { colors } from '../utils/theme';

// What's printed on a face-up Memory Chips card: a number, dots, or text such
// as "3+4" or "3/4" (shrunk to fit longer labels).
export default function CardFace({ face, size, color = colors.textDark }) {
  if (face.kind === 'dots') {
    return <DotPattern count={face.count} size={size * 0.7} color={color} />;
  }
  const length = face.label.length;
  const scale = length <= 2 ? 0.4 : length <= 4 ? 0.28 : 0.22;
  return (
    <Text style={[styles.text, { fontSize: size * scale, color }]} numberOfLines={1} adjustsFontSizeToFit>
      {face.label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '900',
    textAlign: 'center',
  },
});
