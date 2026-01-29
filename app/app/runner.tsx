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

  const isWork = phase === 'work';
  const isRest = phase === 'rest';
  const isFinished = phase === 'finished';
  // Use metronome's own state for count-in to avoid timing mismatches
  const isCountingIn = metronome.isCountingIn && metronome.countInRemaining > 0;

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

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <Center className="flex-1 bg-background p-6">
      {/* Count-in display */}
      {isCountingIn ? (
        <VStack className="items-center">
          <Text size="lg" className="text-text-muted mb-2">
            Get Ready
          </Text>
          <Heading size="5xl" className="text-yellow-400 mb-4">
            {metronome.countInRemaining}
          </Heading>
          <MetronomeIndicator
            isPlaying={metronome.isPlaying}
            bpm={metronome.bpm}
            beatCount={metronome.beatCount}
            isCountingIn={true}
            countInRemaining={metronome.countInRemaining}
          />
        </VStack>
      ) : (
        /* Main timer display - always show when not counting in */
        <>
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

          {/* Paused indicator */}
          {isPaused && !isFinished && (
            <Box className="bg-yellow-500/20 rounded-xl py-2 px-6 mb-4">
              <Text size="lg" className="text-yellow-400 font-semibold">
                PAUSED
              </Text>
            </Box>
          )}

          {/* Last callout */}
          {isWork && lastCallout !== '' && !isPaused && (
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
        </>
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
        ) : isCountingIn ? (
          <Button
            size="lg"
            action="negative"
            className="w-full bg-red-600"
            onPress={() => controls.stop()}
          >
            <ButtonText className="text-lg">Cancel</ButtonText>
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
