import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { daysPlayed, notesOf, skillReport } from '../utils/playLog';
import { colors } from '../utils/theme';

const FLAG_STYLES = {
  'too hard': { backgroundColor: '#FFE1E1', color: colors.redDark },
  'too easy': { backgroundColor: '#D9F7E6', color: colors.greenDark },
  unclear: { backgroundColor: '#FFE9D4', color: '#B8620F' },
  'drop-off': { backgroundColor: '#ECE3FB', color: colors.purple },
};
const MAX_ROWS = 15;

function percent(value) {
  return value === null ? '–' : `${Math.round(value * 100)}%`;
}

function seconds(ms) {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`;
}

// One child's play-test report: per-skill accuracy, speed, replays and quits,
// with flags for skills to look at, plus the grown-up's session notes.
export default function PlaytestReport({ log, onAddNote, onClear }) {
  const [note, setNote] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const rows = skillReport(log);
  const notes = notesOf(log);
  const answers = log.filter((e) => e.type === 'answer').length;
  const rounds = log.filter((e) => e.type === 'round').length;
  const quits = log.filter((e) => e.type === 'quit').length;
  const levelChanges = log.filter((e) => e.type === 'level' && e.change !== 'hint').length;

  function addNote() {
    if (!note.trim()) return;
    onAddNote(note.trim());
    setNote('');
  }

  return (
    <View style={styles.box}>
      <Text style={styles.summary}>
        {daysPlayed(log)} day(s) · {answers} answers · {rounds} rounds · {quits} left early · {levelChanges} level changes
      </Text>

      {rows.length === 0 ? (
        <Text style={styles.empty}>Nothing recorded yet. Every answer is logged on this device as the child plays.</Text>
      ) : (
        <>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.skillCell, styles.headerText]}>Skill</Text>
            <Text style={[styles.cell, styles.headerText]}>Tries</Text>
            <Text style={[styles.cell, styles.headerText]}>Right</Text>
            <Text style={[styles.cell, styles.headerText]}>Time</Text>
            <Text style={[styles.cell, styles.headerText]}>🔊/q</Text>
          </View>
          {rows.slice(0, MAX_ROWS).map((row) => (
            <View key={row.skillId} style={styles.rowBlock}>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.skillCell]} numberOfLines={1}>
                  {row.skill ? `${row.skill.emoji} ${row.skill.title}` : row.skillId}
                </Text>
                <Text style={styles.cell}>{row.attempts}</Text>
                <Text style={styles.cell}>{percent(row.accuracy)}</Text>
                <Text style={styles.cell}>{seconds(row.medianMs)}</Text>
                <Text style={styles.cell}>{row.answers ? row.replaysPerAnswer.toFixed(1) : '–'}</Text>
              </View>
              {(row.flags.length > 0 || row.stepsDown > 0 || row.stepsUp > 0 || row.quits > 0) && (
                <View style={styles.flags}>
                  {row.flags.map((flag) => (
                    <Text key={flag} style={[styles.flag, FLAG_STYLES[flag]]}>
                      {flag}
                    </Text>
                  ))}
                  {row.stepsDown > 0 && <Text style={styles.detail}>⬇️ {row.stepsDown}</Text>}
                  {row.stepsUp > 0 && <Text style={styles.detail}>⚡ {row.stepsUp}</Text>}
                  {row.quits > 0 && <Text style={styles.detail}>🚪 {row.quits} left early</Text>}
                </View>
              )}
            </View>
          ))}
          <Text style={styles.legend}>
            Time = median seconds per answer. Flags need 10+ tries: too hard (under 60% right), too easy (95%+ and under 3 s),
            unclear (question replayed on half the tries), drop-off (a third of rounds left early).
          </Text>
        </>
      )}

      <Text style={styles.notesTitle}>📝 Session notes</Text>
      {notes.map((n) => (
        <Text key={n.at} style={styles.note}>
          {n.day}: {n.text}
        </Text>
      ))}
      <View style={styles.noteRow}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What did you notice? (e.g. guessed fast on Bigger Number)"
          placeholderTextColor={colors.gray}
          style={styles.input}
          onSubmitEditing={addNote}
          accessibilityLabel="Session note"
        />
        <Pressable onPress={addNote} style={styles.addButton} accessibilityLabel="Add note">
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      {isConfirmingClear ? (
        <View style={styles.clearRow}>
          <Text style={styles.clearAsk}>Clear this child's play-test log?</Text>
          <Pressable
            onPress={() => {
              setIsConfirmingClear(false);
              onClear();
            }}
          >
            <Text style={styles.clearYes}>Clear</Text>
          </Pressable>
          <Pressable onPress={() => setIsConfirmingClear(false)}>
            <Text style={styles.clearNo}>Keep</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setIsConfirmingClear(true)} style={styles.clearLink}>
          <Text style={styles.clearLinkText}>Clear play-test log</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 6,
  },
  summary: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  empty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray,
  },
  rowBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEAF5',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#EEEAF5',
    paddingBottom: 4,
  },
  headerText: {
    fontWeight: '900',
    color: colors.gray,
  },
  cell: {
    width: 44,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'right',
  },
  skillCell: {
    flex: 1,
    width: undefined,
    textAlign: 'left',
  },
  flags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  flag: {
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  detail: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray,
  },
  legend: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 6,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 14,
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D9D3E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textDark,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
  },
  clearLink: {
    marginTop: 10,
  },
  clearLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.redDark,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  clearAsk: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  clearYes: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.redDark,
  },
  clearNo: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
});
