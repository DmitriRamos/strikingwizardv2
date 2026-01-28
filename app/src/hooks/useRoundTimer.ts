import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import type { Callout, RunnerPhase, SessionConfig } from '../types/session';

export interface RoundTimerState {
  /** Current phase: countdown, work, rest, or finished. */
  phase: RunnerPhase;
  /** 1-based current round number. */
  currentRound: number;
  /** Seconds remaining in the current phase. */
  secondsLeft: number;
  /** The most recent callout text (empty string if none yet). */
  lastCallout: string;
  /** Whether the session is actively running (not paused / not finished). */
  isRunning: boolean;
}

export interface RoundTimerControls {
  /** Stop the session early. */
  stop: () => void;
}

/**
 * Core hook that drives the Callout Runner session.
 *
 * Manages the countdown timer, round/rest transitions, and
 * semi-random callout scheduling via text-to-speech.
 */
export function useRoundTimer(
  config: SessionConfig,
): [RoundTimerState, RoundTimerControls] {
  const [phase, setPhase] = useState<RunnerPhase>(
    config.countdownDurationSecs > 0 ? 'countdown' : 'work'
  );
  const [currentRound, setCurrentRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(
    config.countdownDurationSecs > 0
      ? config.countdownDurationSecs + 2 // +1 for "Get ready", +1 for pause
      : config.roundDurationSecs
  );
  const [lastCallout, setLastCallout] = useState('');
  const [isRunning, setIsRunning] = useState(true);

  // Refs to avoid stale closures in intervals/timeouts.
  const phaseRef = useRef(phase);
  const currentRoundRef = useRef(currentRound);
  const isRunningRef = useRef(isRunning);
  const calloutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);

  phaseRef.current = phase;
  currentRoundRef.current = currentRound;
  isRunningRef.current = isRunning;
  configRef.current = config;

  // ---------------------------------------------------------------------------
  // Callout helpers
  // ---------------------------------------------------------------------------

  const enabledCallouts = config.callouts.filter((c) => c.enabled);

  const pickRandom = useCallback(
    (list: Callout[]): Callout | undefined => {
      if (list.length === 0) return undefined;
      return list[Math.floor(Math.random() * list.length)];
    },
    [],
  );

  const speak = useCallback((text: string) => {
    Speech.speak(text, { rate: 1.1 });
  }, []);

  const randomDelay = useCallback((): number => {
    const { calloutIntervalMin, calloutIntervalMax } = configRef.current;
    const min = calloutIntervalMin * 1000;
    const max = calloutIntervalMax * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }, []);

  /** Schedule the next callout after a random delay. */
  const scheduleCallout = useCallback(() => {
    if (calloutTimeoutRef.current) {
      clearTimeout(calloutTimeoutRef.current);
    }

    calloutTimeoutRef.current = setTimeout(() => {
      if (!isRunningRef.current || phaseRef.current !== 'work') return;

      const callout = pickRandom(enabledCallouts);
      if (callout) {
        setLastCallout(callout.label);
        speak(callout.label);
      }

      // Schedule the next one.
      scheduleCallout();
    }, randomDelay());
  }, [enabledCallouts, pickRandom, randomDelay, speak]);

  // ---------------------------------------------------------------------------
  // Countdown timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Phase ended — figure out what's next.
          const cfg = configRef.current;
          const round = currentRoundRef.current;
          const currentPhase = phaseRef.current;

          if (currentPhase === 'countdown') {
            // Countdown ended — start work phase.
            setPhase('work');
            setLastCallout('');
            speak('Fight!');
            return cfg.roundDurationSecs;
          }

          if (currentPhase === 'work') {
            // End of a work phase.
            if (round >= cfg.rounds) {
              // Last round — session complete.
              setPhase('finished');
              setIsRunning(false);
              speak('Time. Session complete.');
              return 0;
            }
            // Switch to rest.
            setPhase('rest');
            setLastCallout('');
            speak('Rest');
            return cfg.restDurationSecs;
          }

          // End of rest — start next round (no countdown after first round).
          const nextRound = round + 1;
          setCurrentRound(nextRound);
          setPhase('work');
          setLastCallout('');
          speak('Fight!');
          return cfg.roundDurationSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, speak]);

  // ---------------------------------------------------------------------------
  // Countdown TTS — speak each second during countdown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase === 'countdown' && isRunning) {
      // Speak "Get ready" at the start of countdown
      if (secondsLeft === config.countdownDurationSecs + 2) {
        speak('Get ready');
      } else if (secondsLeft > 0 && secondsLeft <= config.countdownDurationSecs) {
        // After "Get ready" and pause, speak countdown numbers (10, 9, 8, ..., 1)
        speak(String(secondsLeft));
      }
    }
  }, [phase, secondsLeft, isRunning, config.countdownDurationSecs, speak]);

  // ---------------------------------------------------------------------------
  // Rest countdown TTS — speak last 3 seconds during rest
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase === 'rest' && isRunning) {
      // Count down the last 3 seconds of rest
      if (secondsLeft <= 3 && secondsLeft > 0) {
        speak(String(secondsLeft));
      }
    }
  }, [phase, secondsLeft, isRunning, speak]);

  // ---------------------------------------------------------------------------
  // Callout scheduling — start/stop based on phase
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase === 'work' && isRunning && enabledCallouts.length > 0) {
      // Wait 1 second after "Fight!" then start callouts
      const initialDelay = setTimeout(() => {
        scheduleCallout();
      }, 1000);

      return () => {
        clearTimeout(initialDelay);
        if (calloutTimeoutRef.current) {
          clearTimeout(calloutTimeoutRef.current);
          calloutTimeoutRef.current = null;
        }
      };
    }

    return () => {
      if (calloutTimeoutRef.current) {
        clearTimeout(calloutTimeoutRef.current);
        calloutTimeoutRef.current = null;
      }
    };
    // Re-run when phase or running state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isRunning]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (calloutTimeoutRef.current) clearTimeout(calloutTimeoutRef.current);
      Speech.stop();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  const stop = useCallback(() => {
    setIsRunning(false);
    setPhase('finished');
    Speech.stop();
    if (calloutTimeoutRef.current) {
      clearTimeout(calloutTimeoutRef.current);
      calloutTimeoutRef.current = null;
    }
  }, []);

  return [
    { phase, currentRound, secondsLeft, lastCallout, isRunning },
    { stop },
  ];
}
