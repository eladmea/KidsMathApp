import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParentGate from '../components/ParentGate';
import PlaytestReport from '../components/PlaytestReport';
import { useProfiles } from '../context/ProfileContext';
import { appendPlayLog, clearPlayLog, loadPlayLog, loadProgress } from '../utils/storage';
import { toCsv } from '../utils/playLog';
import { exportTextFile } from '../utils/exportFile';
import { profileBand } from '../utils/profiles';
import { getRecord, hasPassed, isMastered, toDayKey } from '../utils/progress';
import { LIMIT_OPTIONS, allowedMinutes, dailyLimitFor, minutesPlayed, recentDays } from '../utils/playTime';
import { SUBJECTS } from '../curriculum/subjects';
import { isPlayable, skillsFor } from '../curriculum/skills';
import { colors, shadow } from '../utils/theme';

const WEEKDAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const BAR_HEIGHT = 60;

function weekdayOf(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return WEEKDAY[new Date(y, m - 1, d).getDay()];
}

// Skills in the child's band that were tried but not yet passed.
function needsPractice(skills, progress) {
  return skills.filter((skill) => {
    const record = getRecord(progress, skill.id);
    return record.attempts > 0 && !hasPassed(record);
  });
}

function ChildCard({ profile, progress, days, today, log, onChange, onMoreTime, onAddNote, onClearLog }) {
  const [showReport, setShowReport] = useState(false);
  const band = profileBand(profile);
  const bandSkills = skillsFor({ band: band.id }).filter(isPlayable);
  const limit = dailyLimitFor(profile);
  const allowed = allowedMinutes(profile, today);
  const played = minutesPlayed(days, today);
  const week = recentDays(days, today);
  const weekMax = Math.max(limit || 0, ...week.map((d) => d.minutes), 1);
  const struggling = needsPractice(bandSkills, progress).slice(0, 3);

  return (
    <View style={[styles.card, shadow, { borderColor: band.color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.avatar}>{profile.avatar}</Text>
        <View style={styles.flex}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={[styles.band, { color: band.color }]}>
            {band.emoji} {band.label} · age {profile.age}
          </Text>
        </View>
        <Text style={styles.stat}>📒 {(profile.stickers || []).length}</Text>
      </View>

      <Text style={styles.sectionTitle}>⏰ Today</Text>
      <Text style={styles.today}>
        {played} min played{allowed === null ? ' · no daily limit' : ` of ${allowed} min`}
      </Text>
      {allowed !== null && (
        <Pressable onPress={onMoreTime} style={[styles.smallButton, shadow]}>
          <Text style={styles.smallButtonText}>➕ 10 more minutes today</Text>
        </Pressable>
      )}

      <View style={styles.week}>
        {week.map(({ day, minutes }) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekMinutes}>{minutes || ''}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(2, (minutes / weekMax) * BAR_HEIGHT) },
                  limit > 0 && minutes > limit && styles.barOver,
                ]}
              />
            </View>
            <Text style={[styles.weekLabel, day === today && styles.weekToday]}>{weekdayOf(day)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Daily limit</Text>
      <View style={styles.pills}>
        {LIMIT_OPTIONS.map((minutes) => {
          const isOn = minutes === limit;
          return (
            <Pressable
              key={minutes}
              onPress={() => onChange({ dailyLimit: minutes })}
              style={[styles.pill, isOn && styles.pillOn]}
              accessibilityLabel={minutes ? `${minutes} minutes` : 'No limit'}
            >
              <Text style={[styles.pillText, isOn && styles.pillTextOn]}>{minutes ? `${minutes}m` : 'Off'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        When time is up, {profile.name} can finish the current round, then gets a goodbye screen.
      </Text>

      <Text style={styles.sectionTitle}>Progress ({band.minAge}–{band.maxAge} skills)</Text>
      {SUBJECTS.map((subject) => {
        const skills = bandSkills.filter((skill) => skill.subject === subject.id);
        if (!skills.length) return null;
        const passed = skills.filter((skill) => hasPassed(getRecord(progress, skill.id))).length;
        const mastered = skills.filter((skill) => isMastered(getRecord(progress, skill.id))).length;
        return (
          <View key={subject.id} style={styles.subjectRow}>
            <Text style={styles.subjectLabel}>
              {subject.emoji} {subject.label}
            </Text>
            <View style={styles.subjectTrack}>
              <View style={[styles.subjectFill, { width: `${(passed / skills.length) * 100}%`, backgroundColor: subject.light }]} />
              <View style={[styles.subjectFill, { width: `${(mastered / skills.length) * 100}%`, backgroundColor: subject.color }]} />
            </View>
            <Text style={styles.subjectCount}>
              {mastered}/{skills.length}
            </Text>
          </View>
        );
      })}
      <Text style={styles.hint}>Dark bar: mastered (passed on 2 days). Light bar: passed once.</Text>
      {struggling.length > 0 && (
        <Text style={styles.practice}>
          💪 Still practicing: {struggling.map((skill) => `${skill.emoji} ${skill.title}`).join(', ')}
        </Text>
      )}

      <Pressable onPress={() => onChange({ narration: !profile.narration })} style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Read aloud</Text>
        <Text style={styles.toggleValue}>{profile.narration ? '🔊 On' : '🔇 Off'}</Text>
      </Pressable>

      <Pressable onPress={() => setShowReport((value) => !value)} style={styles.toggleRow} accessibilityLabel="Play-test report">
        <Text style={styles.toggleLabel}>🧪 Play-test report</Text>
        <Text style={styles.toggleValue}>{showReport ? 'Hide ▲' : 'Show ▼'}</Text>
      </Pressable>
      {showReport && <PlaytestReport log={log} onAddNote={onAddNote} onClear={onClearLog} />}
    </View>
  );
}

// Parent dashboard: play time, daily limits and progress for every child,
// behind a grown-up check.
export default function ParentDashboardScreen({ navigation }) {
  const { profiles, playTime, updateProfile, grantMoreTime } = useProfiles();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [progressById, setProgressById] = useState({});
  const [logsById, setLogsById] = useState({});
  const today = toDayKey();

  useEffect(() => {
    if (!isUnlocked) return;
    let isActive = true;
    Promise.all(
      profiles.map((p) => Promise.all([loadProgress(p.id), loadPlayLog(p.id)]).then(([progress, log]) => [p.id, progress, log]))
    ).then((entries) => {
      if (!isActive) return;
      setProgressById(Object.fromEntries(entries.map(([id, progress]) => [id, progress])));
      setLogsById(Object.fromEntries(entries.map(([id, , log]) => [id, log])));
    });
    return () => {
      isActive = false;
    };
  }, [isUnlocked, profiles]);

  async function reloadLog(profileId) {
    const log = await loadPlayLog(profileId);
    setLogsById((current) => ({ ...current, [profileId]: log }));
  }

  async function addNote(profileId, text) {
    await appendPlayLog(profileId, [{ type: 'note', at: Date.now(), day: today, text }]);
    await reloadLog(profileId);
  }

  async function clearLog(profileId) {
    await clearPlayLog(profileId);
    await reloadLog(profileId);
  }

  function exportAll() {
    const csv = toCsv(profiles.map((p) => ({ profile: p.name, events: logsById[p.id] || [] })));
    exportTextFile(`mathplay-playtest-${today}.csv`, csv);
  }

  if (!isUnlocked) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ParentGate title="Parent dashboard" onPass={() => setIsUnlocked(true)} onCancel={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>👪 Parent Dashboard</Text>
        <Text style={styles.intro}>
          Short daily sessions work best (AAP: about 1 hour of quality media a day for ages 2–5, ideally together).
        </Text>
        {profiles.length === 0 && <Text style={styles.intro}>No players yet.</Text>}
        {profiles.length > 0 && (
          <Pressable onPress={exportAll} style={[styles.smallButton, styles.exportButton, shadow]} accessibilityLabel="Export play-test data">
            <Text style={styles.smallButtonText}>⬇️ Export play-test data (CSV)</Text>
          </Pressable>
        )}
        {profiles.map((profile) => (
          <ChildCard
            key={profile.id}
            profile={profile}
            progress={progressById[profile.id] || {}}
            days={playTime[profile.id]}
            today={today}
            onChange={(changes) => updateProfile(profile.id, changes)}
            onMoreTime={() => grantMoreTime(profile.id)}
            log={logsById[profile.id] || []}
            onAddNote={(text) => addNote(profile.id, text)}
            onClearLog={() => clearLog(profile.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EC',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  backLink: {
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
  },
  intro: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 4,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 3,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  avatar: {
    fontSize: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  band: {
    fontSize: 14,
    fontWeight: '800',
  },
  stat: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 6,
  },
  today: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  exportButton: {
    marginTop: 0,
    marginBottom: 14,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weekDay: {
    alignItems: 'center',
    flex: 1,
  },
  weekMinutes: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray,
    height: 14,
  },
  barTrack: {
    height: BAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 18,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  barOver: {
    backgroundColor: colors.orange,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray,
    marginTop: 4,
  },
  weekToday: {
    color: colors.textDark,
    fontWeight: '900',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  pillOn: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  pillTextOn: {
    color: colors.white,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 6,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  subjectLabel: {
    width: 150,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
  },
  subjectTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EEEAF5',
    overflow: 'hidden',
  },
  subjectFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  subjectCount: {
    width: 36,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
  },
  practice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEAF5',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  toggleValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
});
