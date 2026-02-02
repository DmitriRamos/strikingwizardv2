import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import type { Callout, RunnerPhase, SessionConfig, CountInPhase } from '../types/session';
import { useMetronome } from './useMetronome';

export interface RoundTimerState {
  /** Current phase: countdown, work, rest, or finished. */
  phase: RunnerPhase;
  /** Count-in phase: idle, counting, or done. */
  countInPhase: CountInPhase;
  /** 1-based current round number. */
  currentRound: number;
  /** Seconds remaining in the current phase. */
  secondsLeft: number;
  /** The most recent callout text (empty string if none yet). */
  lastCallout: string;
  /** Whether the session is actively running (not paused / not finished). */
  isRunning: boolean;
  /** Whether the session is paused. */
  isPaused: boolean;
  /** Metronome state */
  metronome: {
    isPlaying: boolean;
    bpm: number;
    beatCount: number;
    isCountingIn: boolean;
    countInRemaining: number;
  };
}

export interface RoundTimerControls {
  /** Start the session (with count-in if enabled). */
  start: () => void;
  /** Stop the session early. */
  stop: () => void;
  /** Pause the session. */
  pause: () => void;
  /** Resume the session. */
  resume: () => void;
  /** Update metronome BPM mid-session. */
  setMetronomeBpm: (bpm: number) => void;
  /** Duck metronome volume (called when callout plays). */
  duckMetronome: () => void;
}

/**
 * Core hook that drives the Callout Runner session.
 *
 * Manages the countdown timer, round/rest transitions,
 * semi-random callout scheduling via text-to-speech,
 * and metronome integration.
 */
export function useRoundTimer(
  config: SessionConfig,
): [RoundTimerState, RoundTimerControls] {
  // ---------------------------------------------------------------------------
  // Timer state
  // ---------------------------------------------------------------------------

  const [phase, setPhase] = useState<RunnerPhase>(
    config.countdownDurationSecs > 0 ? 'countdown' : 'work'
  );
  const [countInPhase, setCountInPhase] = useState<CountInPhase>('idle');
  const [currentRound, setCurrentRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(
    config.countdownDurationSecs > 0
      ? config.countdownDurationSecs + 2 // +1 for "Get ready", +1 for pause
      : config.roundDurationSecs
  );
  const [lastCallout, setLastCallout] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ---------------------------------------------------------------------------
  // Metronome hook
  // ---------------------------------------------------------------------------

  const [metronomeState, metronomeControls] = useMetronome(config.metronome);

  // ---------------------------------------------------------------------------
  // Refs to avoid stale closures in intervals/timeouts
  // ---------------------------------------------------------------------------

  const phaseRef = useRef(phase);
  const currentRoundRef = useRef(currentRound);
  const isRunningRef = useRef(isRunning);
  const isPausedRef = useRef(isPaused);
  const calloutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduleCalloutRef = useRef<(() => void) | null>(null);
  const countInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countInPhaseRef = useRef(countInPhase);

  // Sync refs with state in effects to satisfy linter
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    countInPhaseRef.current = countInPhase;
  }, [countInPhase]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

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
    // Duck metronome when speaking
    if (configRef.current.metronome.enabled) {
      metronomeControls.duckVolume(600);
    }
    Speech.speak(text, { rate: 1.1 });
  }, [metronomeControls]);

  const randomDelay = useCallback((): number => {
    const { calloutIntervalMin, calloutIntervalMax } = configRef.current;
    const min = calloutIntervalMin * 1000;
    const max = calloutIntervalMax * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }, []);

  /** Schedule the next callout after a random delay. */
  // Using useEffect to set up the ref-based scheduling to avoid self-reference issues
  useEffect(() => {
    scheduleCalloutRef.current = () => {
      if (calloutTimeoutRef.current) {
        clearTimeout(calloutTimeoutRef.current);
      }

      calloutTimeoutRef.current = setTimeout(() => {
        if (!isRunningRef.current || isPausedRef.current || phaseRef.current !== 'work') return;

        const callout = pickRandom(enabledCallouts);
        if (callout) {
          setLastCallout(callout.label);
          speak(callout.label);
        }

        // Schedule the next one using ref
        scheduleCalloutRef.current?.();
      }, randomDelay());
    };
  }, [enabledCallouts, pickRandom, randomDelay, speak]);

  const scheduleCallout = useCallback(() => {
    scheduleCalloutRef.current?.();
  }, []);

  // ---------------------------------------------------------------------------
  // Clear scheduled callout
  // ---------------------------------------------------------------------------

  const clearCalloutTimeout = useCallback(() => {
    if (calloutTimeoutRef.current) {
      clearTimeout(calloutTimeoutRef.current);
      calloutTimeoutRef.current = null;
    }
  }, []);

  const clearCountInTimeout = useCallback(() => {
    if (countInTimeoutRef.current) {
      clearTimeout(countInTimeoutRef.current);
      countInTimeoutRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Start the round timer (called after count-in completes)
  // ---------------------------------------------------------------------------

  const startRoundTimer = useCallback(() => {
    clearCountInTimeout();
    setPhase('work');
    setCountInPhase('done');
    setCurrentRound(1);
    setSecondsLeft(configRef.current.roundDurationSecs);
    setLastCallout('');
    setIsRunning(true);
    setIsPaused(false);

    // Speak round 1
    speak('Round 1');
  }, [speak]);

  // ---------------------------------------------------------------------------
  // Countdown timer effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;

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

            // Start metronome when work phase begins
            if (cfg.metronome.enabled) {
              metronomeControls.start();
            }

            return cfg.roundDurationSecs;
          }

          if (currentPhase === 'work') {
            // End of a work phase.
            if (round >= cfg.rounds) {
              // Last round — session complete.
              setPhase('finished');
              setIsRunning(false);
              metronomeControls.stop();
              speak('Time. Session complete.');
              return 0;
            }
            // Switch to rest.
            setPhase('rest');
            setLastCallout('');
            speak('Rest');

            // Handle metronome during rest
            if (!cfg.metronome.playDuringRest && cfg.metronome.enabled) {
              metronomeControls.pause();
            }

            return cfg.restDurationSecs;
          }

          // End of rest — start next round (no countdown after first round).
          const nextRound = round + 1;
          setCurrentRound(nextRound);
          setPhase('work');
          setLastCallout('');
          speak(`Round ${nextRound}`);

          // Resume metronome if it was paused during rest
          if (!cfg.metronome.playDuringRest && cfg.metronome.enabled) {
            metronomeControls.resume();
          }

          return cfg.roundDurationSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, speak, metronomeControls]);

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
    if (phase === 'work' && isRunning && !isPaused && enabledCallouts.length > 0) {
      // Wait 1 second after round starts then begin callouts
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
      clearCalloutTimeout();
    };
  }, [phase, isRunning, isPaused, enabledCallouts.length, scheduleCallout, clearCalloutTimeout]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearCalloutTimeout();
      clearCountInTimeout();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Speech.stop();
      metronomeControls.stop();
    };
  }, [clearCalloutTimeout, clearCountInTimeout, metronomeControls]);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  const start = useCallback(() => {
    const cfg = configRef.current;

    // Use the main countdown if configured
    if (cfg.countdownDurationSecs > 0) {
      // Start with countdown phase
      setPhase('countdown');
      setSecondsLeft(cfg.countdownDurationSecs + 2); // +1 for "Get ready", +1 for pause
      setIsRunning(true);
      setIsPaused(false);
      setCountInPhase('done');
    } else {
      // No countdown - start work phase immediately
      setPhase('work');
      setCurrentRound(1);
      setSecondsLeft(cfg.roundDurationSecs);
      setLastCallout('');
      setIsRunning(true);
      setIsPaused(false);
      setCountInPhase('done');
      speak('Round 1');

      // Start metronome if enabled
      if (cfg.metronome.enabled) {
        try {
          metronomeControls.start();
        } catch (error) {
          console.error('[useRoundTimer] Metronome start failed:', error);
        }
      }
    }
  }, [metronomeControls, speak]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setPhase('finished');
    setCountInPhase('idle');
    Speech.stop();
    clearCountInTimeout();
    clearCalloutTimeout();
    metronomeControls.stop();
  }, [clearCountInTimeout, clearCalloutTimeout, metronomeControls]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;

    setIsPaused(true);
    clearCalloutTimeout();
    Speech.stop();
    metronomeControls.pause();
  }, [isRunning, isPaused, clearCalloutTimeout, metronomeControls]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;

    setIsPaused(false);

    // Resume metronome (if it should be playing in current phase)
    const cfg = configRef.current;
    const currentPhase = phaseRef.current;
    const shouldMetronomePlay = cfg.metronome.enabled &&
      (currentPhase === 'work' || cfg.metronome.playDuringRest);

    if (shouldMetronomePlay) {
      metronomeControls.resume();
    }

    // Reschedule callouts if in work phase
    if (currentPhase === 'work' && enabledCallouts.length > 0) {
      scheduleCallout();
    }
  }, [isRunning, isPaused, enabledCallouts.length, scheduleCallout, metronomeControls]);

  const setMetronomeBpm = useCallback((bpm: number) => {
    metronomeControls.setBpm(bpm);
  }, [metronomeControls]);

  const duckMetronome = useCallback(() => {
    metronomeControls.duckVolume();
  }, [metronomeControls]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return [
    {
      phase,
      countInPhase,
      currentRound,
      secondsLeft,
      lastCallout,
      isRunning,
      isPaused,
      metronome: {
        isPlaying: metronomeState.isPlaying,
        bpm: metronomeState.bpm,
        beatCount: metronomeState.beatCount,
        isCountingIn: metronomeState.isCountingIn,
        countInRemaining: metronomeState.countInRemaining,
      },
    },
    {
      start,
      stop,
      pause,
      resume,
      setMetronomeBpm,
      duckMetronome,
    },
  ];
}
