import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoundTimer } from '../src/hooks/useRoundTimer';
import type { Callout, MetronomeConfig, SessionConfig } from '../src/types/session';
import { DEFAULT_METRONOME_CONFIG } from '../src/types/session';
import {
  Box,
  VStack,
  HStack,
  Center,
  Text,
  Heading,
  Button,
  ButtonText,
  Badge,
  BadgeText,
  CircularProgress,
} from '@/components/ui';

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
// Metronome Beat Indicator Component
// ---------------------------------------------------------------------------

interface MetronomeIndicatorProps {
  isPlaying: boolean;
  bpm: number;
  beatCount: number;
  isCountingIn: boolean;
  countInRemaining: number;
}

function MetronomeIndicator({
  isPlaying,
  bpm,
  beatCount,
  isCountingIn,
  countInRemaining,
}: MetronomeIndicatorProps) {
  // Use beatCount modulo to create a visual pulse effect
  // Even beat count = normal, changes = shows pulse was registered
  const isPulse = beatCount % 2 === 1;

  if (!isPlaying) return null;

  return (
    <HStack className="items-center mb-4" space="sm">
      {/* Beat indicator - size changes with beat */}
      <Box
        className={`rounded-full ${
          isCountingIn ? 'bg-yellow-400' : 'bg-primary-500'
        } ${isPulse ? 'w-5 h-5' : 'w-4 h-4'}`}
      />

      {/* BPM and status text */}
      <Text size="sm" className="text-text-muted">
        {isCountingIn ? `Count-in: ${countInRemaining}` : `${bpm} BPM`}
      </Text>
    </HStack>
  );
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
    countdownDurationSecs: string;
    calloutIntervalMin: string;
    calloutIntervalMax: string;
    callouts: string;
    metronome: string;
  }>();

  // Parse metronome config with error handling
  let metronomeConfig: MetronomeConfig = DEFAULT_METRONOME_CONFIG;
  try {
    if (params.metronome) {
      metronomeConfig = { ...DEFAULT_METRONOME_CONFIG, ...(JSON.parse(params.metronome) as MetronomeConfig) };
    }
  } catch (e) {
    console.error('[RunnerScreen] Failed to parse metronome config:', e);
  }

  // Parse callouts with error handling
  let callouts: Callout[] = [];
  try {
    if (params.callouts) {
      callouts = JSON.parse(params.callouts) as Callout[];
    }
  } catch (e) {
    console.error('[RunnerScreen] Failed to parse callouts:', e);
  }

  const config: SessionConfig = {
    rounds: Number(params.rounds) || 3,
    roundDurationSecs: Number(params.roundDurationSecs) || 180,
    restDurationSecs: Number(params.restDurationSecs) || 60,
    countdownDurationSecs: params.countdownDurationSecs !== undefined ? Number(params.countdownDurationSecs) : 10,
    calloutIntervalMin: Number(params.calloutIntervalMin) || 3,
    calloutIntervalMax: Number(params.calloutIntervalMax) || 8,
    callouts,
    metronome: metronomeConfig,
  };

  const [state, controls] = useRoundTimer(config);

  const {
    phase,
    currentRound,
    secondsLeft,
    lastCallout,
    isPaused,
    metronome,
  } = state;

  const isCountdown = phase === 'countdown';
  const isWork = phase === 'work';
  const isRest = phase === 'rest';
  const isFinished = phase === 'finished';

  // Auto-start on mount
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;

    // Small delay to allow screen to render before starting
    const timer = setTimeout(() => {
      controls.start();
    }, 300);
    return () => clearTimeout(timer);
  }, [controls]);

  // Display time and progress: freeze during "Get ready" + pause
  // Don't start counting until after the pause
  const isInGetReadyPhase = isCountdown && secondsLeft > config.countdownDurationSecs;

  const displaySeconds = isCountdown
    ? isInGetReadyPhase
      ? config.countdownDurationSecs  // Frozen at full duration during "Get ready" + pause
      : secondsLeft                    // Normal countdown after pause
    : secondsLeft;

  // Calculate progress for circular progress bar (fills up as time progresses)
  // Progress stays at 0 during "Get ready" + pause, then fills during actual countdown
  const progress = isCountdown
    ? isInGetReadyPhase
      ? 0  // No progress during "Get ready" + pause
      : (config.countdownDurationSecs - secondsLeft) / config.countdownDurationSecs
    : isWork
    ? (config.roundDurationSecs - secondsLeft) / config.roundDurationSecs
    : isRest
    ? (config.restDurationSecs - secondsLeft) / config.restDurationSecs
    : 0;

  // Determine color based on phase (amber for countdown, green for work, red for rest)
  const progressColor = isCountdown
    ? '#f59e0b' // amber-500 (get ready/warning)
    : isWork
    ? '#22c55e' // green-500 (primary green)
    : isRest
    ? '#ef4444' // red-500
    : '#60a5fa'; // blue-400

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <Center className="flex-1 bg-background p-6">
      {/* Metronome indicator */}
      {config.metronome.enabled && metronome.isPlaying && (
        <MetronomeIndicator
          isPlaying={metronome.isPlaying}
          bpm={metronome.bpm}
          beatCount={metronome.beatCount}
          isCountingIn={false}
          countInRemaining={0}
        />
      )}

      {/* Phase badge */}
      <Badge
        size="lg"
        action={
          isCountdown ? 'warning' : isWork ? 'success' : isRest ? 'error' : 'info'
        }
        className="mb-4"
      >
        <BadgeText className="tracking-widest">
          {isCountdown ? 'GET READY' : isWork ? 'WORK' : isRest ? 'REST' : 'DONE'}
        </BadgeText>
      </Badge>

      {/* Round indicator */}
      <Text size="xl" className="text-text mb-3">
        {isFinished
          ? 'Session Complete'
          : isRest
          ? `Rest ${currentRound} of ${config.rounds}`
          : `Round ${currentRound} of ${config.rounds}`}
      </Text>

      {/* Timer */}
      {!isFinished && (
        <Box className="mb-8">
          <CircularProgress
            progress={progress}
            size={280}
            strokeWidth={12}
            color={progressColor}
            backgroundColor="#333"
          >
            <Heading
              size="5xl"
              className="text-white"
            >
              {formatTime(displaySeconds)}
            </Heading>
          </CircularProgress>
        </Box>
      )}

      {/* Paused indicator */}
      {isPaused && !isFinished && (
        <Box className="bg-yellow-500/20 rounded-xl py-2 px-6 mb-4">
          <Text size="lg" className="text-yellow-400 font-semibold">
            PAUSED
          </Text>
        </Box>
      )}

      {/* Last callout */}
      {!isFinished && (
        <Box className={`rounded-2xl py-4 px-8 mb-8 min-h-[80px] flex items-center justify-center ${isWork && lastCallout ? 'bg-primary-500/20' : ''}`}>
          {isWork && lastCallout && (
            <Heading size="3xl" className="text-white text-center">
              {lastCallout}
            </Heading>
          )}
        </Box>
      )}

      {/* Finished summary */}
      {isFinished && (
        <VStack className="mb-10 items-center">
          <Text size="xl" className="text-text text-center">
            {currentRound} round{currentRound > 1 ? 's' : ''} completed
          </Text>
        </VStack>
      )}

      {/* Actions */}
      <Box className="absolute bottom-16 left-6 right-6">
        {isFinished ? (
          <Button
            size="lg"
            action="primary"
            className="w-full"
            onPress={() => router.replace('/')}
          >
            <ButtonText className="text-lg">Back to Setup</ButtonText>
          </Button>
        ) : (
          <HStack space="md">
            {/* Pause/Resume button */}
            <Button
              size="lg"
              action="secondary"
              className="flex-1"
              onPress={() => (isPaused ? controls.resume() : controls.pause())}
            >
              <ButtonText className="text-lg">
                {isPaused ? 'Resume' : 'Pause'}
              </ButtonText>
            </Button>

            {/* Stop button */}
            <Button
              size="lg"
              action="negative"
              className="flex-1 bg-red-600"
              onPress={() => controls.stop()}
            >
              <ButtonText className="text-lg">Stop</ButtonText>
            </Button>
          </HStack>
        )}
      </Box>
    </Center>
  );
}
