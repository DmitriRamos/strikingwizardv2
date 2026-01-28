import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoundTimer } from '../src/hooks/useRoundTimer';
import type { Callout, SessionConfig } from '../src/types/session';

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
// Runner Screen
// ---------------------------------------------------------------------------

export default function RunnerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rounds: string;
    roundDurationSecs: string;
    restDurationSecs: string;
    calloutIntervalMin: string;
    calloutIntervalMax: string;
    callouts: string;
  }>();

  const config: SessionConfig = {
    rounds: Number(params.rounds) || 3,
    roundDurationSecs: Number(params.roundDurationSecs) || 180,
    restDurationSecs: Number(params.restDurationSecs) || 60,
    calloutIntervalMin: Number(params.calloutIntervalMin) || 3,
    calloutIntervalMax: Number(params.calloutIntervalMax) || 8,
    callouts: params.callouts
      ? (JSON.parse(params.callouts) as Callout[])
      : [],
  };

  const [state, controls] = useRoundTimer(config);

  const { phase, currentRound, secondsLeft, lastCallout } = state;

  const isWork = phase === 'work';
  const isRest = phase === 'rest';
  const isFinished = phase === 'finished';

  const phaseColor = isWork ? WORK_COLOR : isRest ? REST_COLOR : DONE_COLOR;

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      {/* Phase badge */}
      <View style={[styles.phaseBadge, { backgroundColor: phaseColor }]}>
        <Text style={styles.phaseBadgeText}>
          {isWork ? 'WORK' : isRest ? 'REST' : 'DONE'}
        </Text>
      </View>

      {/* Round indicator */}
      <Text style={styles.roundText}>
        {isFinished
          ? 'Session Complete'
          : `Round ${currentRound} of ${config.rounds}`}
      </Text>

      {/* Timer */}
      {!isFinished && (
        <Text style={[styles.timer, { color: phaseColor }]}>
          {formatTime(secondsLeft)}
        </Text>
      )}

      {/* Last callout */}
      {isWork && lastCallout !== '' && (
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutText}>{lastCallout}</Text>
        </View>
      )}

      {/* Finished summary */}
      {isFinished && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {currentRound} round{currentRound > 1 ? 's' : ''} completed
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {isFinished ? (
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.btnText}>Back to Setup</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={() => {
              controls.stop();
            }}
          >
            <Text style={styles.btnText}>Stop</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BG = '#1a1a2e';
const WORK_COLOR = '#e94560';
const REST_COLOR = '#0f9b58';
const DONE_COLOR = '#4a90d9';
const TEXT = '#eee';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  phaseBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  phaseBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  roundText: {
    fontSize: 20,
    color: TEXT,
    marginBottom: 12,
  },

  timer: {
    fontSize: 96,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginBottom: 32,
  },

  calloutContainer: {
    backgroundColor: 'rgba(233,69,96,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  calloutText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },

  summaryContainer: { marginBottom: 40 },
  summaryText: {
    fontSize: 22,
    color: TEXT,
    textAlign: 'center',
  },

  actions: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    paddingHorizontal: 24,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: DONE_COLOR },
  btnDanger: { backgroundColor: WORK_COLOR },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
