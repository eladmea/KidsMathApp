import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { profileBand } from '../utils/profiles';
import { colors, shadow } from '../utils/theme';

export default function ProfilesScreen({ navigation }) {
  const { isLoading, profiles, selectProfile, removeProfile } = useProfiles();
  const [isManaging, setIsManaging] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    if (!isLoading && profiles.length === 0) {
      navigation.replace('CreateProfile', { isFirst: true });
    }
  }, [isLoading, profiles.length, navigation]);

  async function handlePick(profile) {
    if (isManaging) {
      setPendingDeleteId(profile.id);
      return;
    }
    await selectProfile(profile.id);
    navigation.reset({ index: 0, routes: [{ name: 'WorldMap' }] });
  }

  async function confirmDelete() {
    await removeProfile(pendingDeleteId);
    setPendingDeleteId(null);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const pendingProfile = profiles.find((p) => p.id === pendingDeleteId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Who's playing?</Text>

        <View style={styles.grid}>
          {profiles.map((profile) => {
            const band = profileBand(profile);
            return (
              <Pressable
                key={profile.id}
                onPress={() => handlePick(profile)}
                style={({ pressed }) => [
                  styles.card,
                  shadow,
                  { borderColor: band.color, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                {isManaging && <Text style={styles.deleteMark}>✕</Text>}
                <Text style={styles.avatar}>{profile.avatar}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.name}
                </Text>
                <Text style={[styles.band, { color: band.color }]}>
                  {band.emoji} {band.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {pendingProfile && (
          <View style={[styles.confirmBox, shadow]}>
            <Text style={styles.confirmText}>
              Delete {pendingProfile.name} and all their progress?
            </Text>
            <View style={styles.confirmRow}>
              <BigButton label="Delete" color={colors.red} onPress={confirmDelete} style={styles.confirmButton} />
              <BigButton
                label="Keep"
                color={colors.gray}
                onPress={() => setPendingDeleteId(null)}
                style={styles.confirmButton}
              />
            </View>
          </View>
        )}

        <BigButton
          label="➕ New Player"
          color={colors.green}
          onPress={() => navigation.navigate('CreateProfile', { isFirst: false })}
          style={styles.newButton}
        />

        <Pressable
          onPress={() => {
            setIsManaging((value) => !value);
            setPendingDeleteId(null);
          }}
          style={styles.manageLink}
        >
          <Text style={styles.manageText}>{isManaging ? 'Done' : 'Grown-ups: manage players'}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ParentDashboard')} style={styles.manageLink}>
          <Text style={styles.manageText}>👪 Parent dashboard & time limits</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 520,
  },
  card: {
    width: 150,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 4,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  deleteMark: {
    position: 'absolute',
    top: 6,
    right: 12,
    fontSize: 22,
    fontWeight: '900',
    color: colors.red,
  },
  avatar: {
    fontSize: 60,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 6,
  },
  band: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  confirmBox: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 14,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  newButton: {
    marginTop: 32,
    minWidth: 240,
  },
  manageLink: {
    marginTop: 20,
    padding: 10,
  },
  manageText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray,
    textDecorationLine: 'underline',
  },
});
