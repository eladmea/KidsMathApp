import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { AVATARS, MAX_NAME_LENGTH, isValidName } from '../utils/profiles';
import { MIN_AGE, MAX_AGE, bandForAge } from '../curriculum/ageBands';
import { colors, shadow } from '../utils/theme';

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

export default function CreateProfileScreen({ route, navigation }) {
  const isFirst = route.params?.isFirst ?? false;
  const { addProfile } = useProfiles();
  const [name, setName] = useState('');
  const [age, setAge] = useState(null);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = isValidName(name) && age !== null && !isSaving;
  const band = age !== null ? bandForAge(age) : null;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    await addProfile({ name, age, avatar });
    navigation.reset({ index: 0, routes: [{ name: 'WorldMap' }] });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isFirst ? '👋 Welcome!' : 'New Player'}</Text>
        <Text style={styles.subtitle}>A grown-up can help set this up.</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Type a name"
          placeholderTextColor={colors.gray}
          maxLength={MAX_NAME_LENGTH}
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>Age</Text>
        <View style={styles.wrapRow}>
          {AGES.map((value) => {
            const isSelected = value === age;
            const ageColor = bandForAge(value).color;
            return (
              <Pressable
                key={value}
                onPress={() => setAge(value)}
                style={[
                  styles.ageButton,
                  { borderColor: ageColor, backgroundColor: isSelected ? ageColor : colors.white },
                  isSelected && shadow,
                ]}
              >
                <Text style={[styles.ageText, { color: isSelected ? colors.white : ageColor }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
        {band && (
          <Text style={[styles.bandNote, { color: band.color }]}>
            {band.emoji} {band.label} (ages {band.minAge}-{band.maxAge})
          </Text>
        )}

        <Text style={styles.label}>Pick a buddy</Text>
        <View style={styles.wrapRow}>
          {AVATARS.map((value) => (
            <Pressable
              key={value}
              onPress={() => setAvatar(value)}
              style={[styles.avatarButton, value === avatar && [styles.avatarSelected, shadow]]}
            >
              <Text style={styles.avatarText}>{value}</Text>
            </Pressable>
          ))}
        </View>

        <BigButton
          label="Let's Play! ▶"
          color={canSave ? colors.green : colors.gray}
          onPress={handleSave}
          style={styles.saveButton}
        />

        {!isFirst && (
          <Pressable onPress={() => navigation.goBack()} style={styles.cancelLink}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
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
    paddingVertical: 28,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textDark,
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 420,
  },
  ageButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageText: {
    fontSize: 24,
    fontWeight: '900',
  },
  bandNote: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  avatarButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: colors.purple,
  },
  avatarText: {
    fontSize: 36,
  },
  saveButton: {
    marginTop: 32,
    minWidth: 240,
  },
  cancelLink: {
    marginTop: 16,
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray,
    textDecorationLine: 'underline',
  },
});
