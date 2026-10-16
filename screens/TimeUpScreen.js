import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BigButton from '../components/BigButton';
import ParentGate from '../components/ParentGate';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { stickersEarnedOn } from '../utils/stickers';
import { BONUS_MINUTES } from '../utils/playTime';
import { toDayKey } from '../utils/progress';
import { colors, shadow } from '../utils/theme';

// The gentle goodbye when today's play time is used up (soft limit): a calm
// cool-down, today's stickers, and "see you tomorrow". A grown-up can add time.
export default function TimeUpScreen({ navigation }) {
  const { activeProfile, isTimeUp, grantMoreTime } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const [isAsking, setIsAsking] = useState(false);
  const name = activeProfile?.name;
  const todayStickers = stickersEarnedOn(activeProfile?.stickers, toDayKey());

  useEffect(() => {
    if (name) say(`Great playing today, ${name}! It's time for a break. See you tomorrow!`);
  }, [name, say]);

  // Back to the map once there's time again (e.g. a grown-up added some).
  useEffect(() => {
    if (activeProfile && !isTimeUp) navigation.reset({ index: 0, routes: [{ name: 'WorldMap' }] });
  }, [activeProfile, isTimeUp, navigation]);

  if (!activeProfile) return null;

  if (isAsking) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ParentGate
          title={`${BONUS_MINUTES} more minutes`}
          onPass={() => {
            setIsAsking(false);
            grantMoreTime(activeProfile.id);
          }}
          onCancel={() => setIsAsking(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.moon}>🌙</Text>
        <Text style={styles.title}>Great playing today, {activeProfile.name}!</Text>
        <Text style={styles.subtitle}>It's time for a break. See you tomorrow! 👋</Text>

        {todayStickers.length > 0 && (
          <View style={[styles.stickers, shadow]}>
            <Text style={styles.stickersTitle}>Today's stickers</Text>
            <Text style={styles.stickersRow}>{todayStickers.map((s) => s.emoji).join(' ')}</Text>
          </View>
        )}

        <BigButton
          label="🎈 Balloon Breath"
          color={colors.primary}
          onPress={() => navigation.navigate('BalloonBreath', { coolDown: true })}
          style={styles.button}
        />
        <BigButton
          label="👥 Switch player"
          color={colors.purple}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Profiles' }] })}
          style={styles.button}
        />
        <BigButton
          label={`🔒 Grown-ups: +${BONUS_MINUTES} min`}
          color={colors.gray}
          onPress={() => setIsAsking(true)}
          style={[styles.button, styles.grownUp]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E4FA',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  moon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 8,
  },
  stickers: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  stickersTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.purple,
  },
  stickersRow: {
    fontSize: 36,
    marginTop: 6,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 360,
    marginTop: 16,
  },
  grownUp: {
    paddingVertical: 14,
  },
});
