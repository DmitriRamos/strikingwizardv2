import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DEFAULT_CALLOUTS } from '../src/data/defaultCallouts';
import type { Callout } from '../src/types/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${pad(s)}`;
}

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

let customIdCounter = 1000;

export default function SetupScreen() {
  const router = useRouter();

  // Round configuration
  const [rounds, setRounds] = useState(3);
  const [roundDurationSecs, setRoundDurationSecs] = useState(180); // 3:00
  const [restDurationSecs, setRestDurationSecs] = useState(60); // 1:00

  // Callout interval
  const [calloutIntervalMin, setCalloutIntervalMin] = useState(3);
  const [calloutIntervalMax, setCalloutIntervalMax] = useState(8);

  // Callout list
  const [callouts, setCallouts] = useState<Callout[]>(
    () => DEFAULT_CALLOUTS.map((c) => ({ ...c })), // clone defaults
  );
  const [customText, setCustomText] = useState('');

  // ---------------------------------------------------------------------------
  // Stepper helpers
  // ---------------------------------------------------------------------------

  const inc = (setter: React.Dispatch<React.SetStateAction<number>>, max: number) =>
    setter((v) => Math.min(v + 1, max));
  const dec = (setter: React.Dispatch<React.SetStateAction<number>>, min: number) =>
    setter((v) => Math.max(v - 1, min));

  const incTime = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number,
    step = 15,
  ) => setter((v) => Math.min(v + step, max));
  const decTime = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    min: number,
    step = 15,
  ) => setter((v) => Math.max(v - step, min));

  // ---------------------------------------------------------------------------
  // Callout toggling & custom entry
  // ---------------------------------------------------------------------------

  const toggleCallout = useCallback((id: string) => {
    setCallouts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    );
  }, []);

  const addCustomCallout = useCallback(() => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const newCallout: Callout = {
      id: String(customIdCounter++),
      label: trimmed,
      enabled: true,
    };
    setCallouts((prev) => [...prev, newCallout]);
    setCustomText('');
  }, [customText]);

  // ---------------------------------------------------------------------------
  // Start session
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(() => {
    const enabledCallouts = callouts.filter((c) => c.enabled);
    if (enabledCallouts.length === 0) return; // need at least one callout

    const params = {
      rounds: String(rounds),
      roundDurationSecs: String(roundDurationSecs),
      restDurationSecs: String(restDurationSecs),
      calloutIntervalMin: String(calloutIntervalMin),
      calloutIntervalMax: String(calloutIntervalMax),
      callouts: JSON.stringify(enabledCallouts),
    };

    router.push({ pathname: '/runner', params });
  }, [
    callouts,
    rounds,
    roundDurationSecs,
    restDurationSecs,
    calloutIntervalMin,
    calloutIntervalMax,
    router,
  ]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderCalloutItem = useCallback(
    ({ item }: { item: Callout }) => (
      <Pressable
        style={[styles.calloutChip, item.enabled && styles.calloutChipEnabled]}
        onPress={() => toggleCallout(item.id)}
      >
        <Text
          style={[
            styles.calloutChipText,
            item.enabled && styles.calloutChipTextEnabled,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    ),
    [toggleCallout],
  );

  const enabledCount = callouts.filter((c) => c.enabled).length;

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={callouts}
      keyExtractor={(item) => item.id}
      renderItem={renderCalloutItem}
      numColumns={3}
      columnWrapperStyle={styles.calloutRow}
      ListHeaderComponent={
        <>
          {/* Title */}
          <Text style={styles.title}>StrikingWizard</Text>
          <Text style={styles.subtitle}>Callout Runner Setup</Text>

          {/* Rounds */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rounds</Text>
            <View style={styles.stepperRow}>
              <Pressable style={styles.stepperBtn} onPress={() => dec(setRounds, 1)}>
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{rounds}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => inc(setRounds, 99)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Round Duration */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Round Duration</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => decTime(setRoundDurationSecs, 10)}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperValue}>
                {formatTime(roundDurationSecs)}
              </Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => incTime(setRoundDurationSecs, 1800)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Rest Duration */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rest Duration</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => decTime(setRestDurationSecs, 0)}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperValue}>
                {formatTime(restDurationSecs)}
              </Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => incTime(setRestDurationSecs, 600)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Callout Interval */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Callout Interval</Text>
            <View style={styles.intervalRow}>
              <View style={styles.intervalGroup}>
                <Text style={styles.intervalLabel}>Min (s)</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={styles.stepperBtnSmall}
                    onPress={() => dec(setCalloutIntervalMin, 1)}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValueSmall}>
                    {calloutIntervalMin}
                  </Text>
                  <Pressable
                    style={styles.stepperBtnSmall}
                    onPress={() =>
                      setCalloutIntervalMin((v) =>
                        Math.min(v + 1, calloutIntervalMax),
                      )
                    }
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.intervalGroup}>
                <Text style={styles.intervalLabel}>Max (s)</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={styles.stepperBtnSmall}
                    onPress={() =>
                      setCalloutIntervalMax((v) =>
                        Math.max(v - 1, calloutIntervalMin),
                      )
                    }
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValueSmall}>
                    {calloutIntervalMax}
                  </Text>
                  <Pressable
                    style={styles.stepperBtnSmall}
                    onPress={() => inc(setCalloutIntervalMax, 60)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Callouts header */}
          <Text style={styles.sectionTitle}>
            Callouts ({enabledCount} selected)
          </Text>
        </>
      }
      ListFooterComponent={
        <>
          {/* Custom callout input */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Add custom callout..."
              placeholderTextColor="#888"
              value={customText}
              onChangeText={setCustomText}
              onSubmitEditing={addCustomCallout}
              returnKeyType="done"
            />
            <Pressable style={styles.addBtn} onPress={addCustomCallout}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>

          {/* Start button */}
          <Pressable
            style={[
              styles.startBtn,
              enabledCount === 0 && styles.startBtnDisabled,
            ]}
            onPress={handleStart}
            disabled={enabledCount === 0}
          >
            <Text style={styles.startBtnText}>Start Session</Text>
          </Pressable>
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ACCENT = '#e94560';
const BG = '#1a1a2e';
const CARD_BG = '#16213e';
const TEXT = '#eee';
const TEXT_DIM = '#999';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40 },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_DIM,
    textAlign: 'center',
    marginBottom: 24,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  stepperValue: { fontSize: 32, fontWeight: 'bold', color: TEXT, minWidth: 80, textAlign: 'center' },
  stepperValueSmall: { fontSize: 24, fontWeight: 'bold', color: TEXT, minWidth: 40, textAlign: 'center' },

  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  intervalGroup: { alignItems: 'center' },
  intervalLabel: { fontSize: 12, color: TEXT_DIM, marginBottom: 6 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    marginTop: 10,
    marginBottom: 12,
  },

  calloutRow: { gap: 8, marginBottom: 8 },
  calloutChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: CARD_BG,
    alignItems: 'center',
  },
  calloutChipEnabled: {
    borderColor: ACCENT,
    backgroundColor: '#2a1030',
  },
  calloutChipText: { fontSize: 13, color: TEXT_DIM, textAlign: 'center' },
  calloutChipTextEnabled: { color: TEXT, fontWeight: '600' },

  addRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT,
    borderWidth: 1,
    borderColor: '#333',
  },
  addBtn: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  startBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
