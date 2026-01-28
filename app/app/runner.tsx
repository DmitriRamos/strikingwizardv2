import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoundTimer } from '../src/hooks/useRoundTimer';
import type { Callout, SessionConfig } from '../src/types/session';
import {
  Box,
  VStack,
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
  }>();

  const config: SessionConfig = {
    rounds: Number(params.rounds) || 3,
    roundDurationSecs: Number(params.roundDurationSecs) || 180,
    restDurationSecs: Number(params.restDurationSecs) || 60,
    countdownDurationSecs: Number(params.countdownDurationSecs) || 10,
    calloutIntervalMin: Number(params.calloutIntervalMin) || 3,
    calloutIntervalMax: Number(params.calloutIntervalMax) || 8,
    callouts: params.callouts
      ? (JSON.parse(params.callouts) as Callout[])
      : [],
  };

  const [state, controls] = useRoundTimer(config);

  const { phase, currentRound, secondsLeft, lastCallout } = state;

  const isCountdown = phase === 'countdown';
  const isWork = phase === 'work';
  const isRest = phase === 'rest';
  const isFinished = phase === 'finished';

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
          <Button
            size="lg"
            action="negative"
            className="w-full bg-red-600"
            onPress={() => controls.stop()}
          >
            <ButtonText className="text-lg">Stop</ButtonText>
          </Button>
        )}
      </Box>
    </Center>
  );
}
