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

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <Center className="flex-1 bg-background p-6">
      {/* Phase badge */}
      <Badge
        size="lg"
        action={isWork ? 'error' : isRest ? 'success' : 'info'}
        className="mb-4"
      >
        <BadgeText className="tracking-widest">
          {isWork ? 'WORK' : isRest ? 'REST' : 'DONE'}
        </BadgeText>
      </Badge>

      {/* Round indicator */}
      <Text size="xl" className="text-text mb-3">
        {isFinished
          ? 'Session Complete'
          : `Round ${currentRound} of ${config.rounds}`}
      </Text>

      {/* Timer */}
      {!isFinished && (
        <Heading
          size="5xl"
          className={`mb-8 ${
            isWork
              ? 'text-red-500'
              : isRest
              ? 'text-primary-400'
              : 'text-blue-400'
          }`}
        >
          {formatTime(secondsLeft)}
        </Heading>
      )}

      {/* Last callout */}
      {isWork && lastCallout !== '' && (
        <Box className="bg-primary-500/20 rounded-2xl py-4 px-8 mb-8">
          <Heading size="3xl" className="text-white text-center">
            {lastCallout}
          </Heading>
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
