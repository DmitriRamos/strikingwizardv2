import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import type { MetronomeConfig, MetronomeSoundId } from '../types/session';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  volume: number;
  beatCount: number;
  isCountingIn: boolean;
  countInRemaining: number;
}

export interface MetronomeControls {
  startCountInThenPlay: (onCountInComplete: () => void) => void;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  duckVolume: (duration?: number) => void;
}

// ---------------------------------------------------------------------------
// Sound assets
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const clickSound = require('../../assets/metronome/click.wav');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const woodblockSound = require('../../assets/metronome/woodblock.wav');

const SOUND_ASSETS: Record<MetronomeSoundId, number> = {
  click: clickSound,
  woodblock: woodblockSound,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCHEDULER_INTERVAL_MS = 25;
const LOOKAHEAD_MS = 100;
const DUCK_VOLUME = 0.25;
const DEFAULT_DUCK_DURATION_MS = 600;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMetronome(config: MetronomeConfig): [MetronomeState, MetronomeControls] {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(config.bpm);
  const [volume, setVolumeState] = useState(config.volume);
  const [beatCount, setBeatCount] = useState(0);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState(0);

  // Refs
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const bpmRef = useRef(config.bpm);
  const volumeRef = useRef(config.volume);
  const enabledRef = useRef(config.enabled);
  const countInEnabledRef = useRef(config.countInEnabled);
  const countInBeatsRef = useRef(config.countInBeats);
  const schedulerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextBeatAtRef = useRef(0);
  const pausedAtRef = useRef(0);

  // Sound refs
  const soundARef = useRef<Audio.Sound | null>(null);
  const soundBRef = useRef<Audio.Sound | null>(null);
  const useSoundARef = useRef(true);

  // Count-in refs
  const isCountingInRef = useRef(false);
  const countInRemainingRef = useRef(0);
  const countInCallbackRef = useRef<(() => void) | null>(null);

  // Duck refs
  const duckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDuckedRef = useRef(false);

  // Keep refs in sync with config
  useEffect(() => {
    bpmRef.current = config.bpm;
    volumeRef.current = config.volume;
    enabledRef.current = config.enabled;
    countInEnabledRef.current = config.countInEnabled;
    countInBeatsRef.current = config.countInBeats;
  }, [config]);

  // Load sounds
  useEffect(() => {
    if (!config.enabled) return;

    let mounted = true;

    const load = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        if (!mounted) return;

        const soundAsset = SOUND_ASSETS[config.soundId];
        const { sound: soundA } = await Audio.Sound.createAsync(soundAsset, {
          volume: volumeRef.current,
          shouldPlay: false,
        });
        const { sound: soundB } = await Audio.Sound.createAsync(soundAsset, {
          volume: volumeRef.current,
          shouldPlay: false,
        });

        if (mounted) {
          soundARef.current = soundA;
          soundBRef.current = soundB;
        } else {
          soundA.unloadAsync();
          soundB.unloadAsync();
        }
      } catch (error) {
        console.error('[useMetronome] Failed to load sounds:', error);
      }
    };

    load();

    return () => {
      mounted = false;
      soundARef.current?.unloadAsync();
      soundBRef.current?.unloadAsync();
      soundARef.current = null;
      soundBRef.current = null;
    };
  }, [config.enabled, config.soundId]);

  // Play sound helper
  const playSound = useCallback(async () => {
    const sound = useSoundARef.current ? soundARef.current : soundBRef.current;
    if (!sound) return;

    try {
      const effectiveVolume = isDuckedRef.current ? DUCK_VOLUME : volumeRef.current;
      await sound.setVolumeAsync(effectiveVolume);
      await sound.setPositionAsync(0);
      await sound.playAsync();
      useSoundARef.current = !useSoundARef.current;
    } catch (error) {
      console.error('[useMetronome] Error playing sound:', error);
    }
  }, []);

  // Process beat - this is called by the scheduler
  const processBeat = useCallback(() => {
    setBeatCount((prev) => prev + 1);

    // Handle count-in
    if (isCountingInRef.current && countInRemainingRef.current > 0) {
      countInRemainingRef.current--;
      setCountInRemaining(countInRemainingRef.current);

      if (countInRemainingRef.current === 0) {
        isCountingInRef.current = false;
        setIsCountingIn(false);

        // Fire the callback to start the round
        const callback = countInCallbackRef.current;
        countInCallbackRef.current = null;
        if (callback) {
          callback();
        }
      }
    }

    playSound();
  }, [playSound]);

  // Scheduler ref for self-reference
  const runSchedulerRef = useRef<() => void>(() => {});
  const nowMs = () =>
    typeof globalThis.performance?.now === 'function'
      ? globalThis.performance.now()
      : Date.now();

  // Update scheduler function when processBeat changes
  useEffect(() => {
    runSchedulerRef.current = () => {
      if (!isPlayingRef.current || isPausedRef.current) {
        return;
      }

      const now = nowMs();

      // Process beats in the lookahead window
      while (nextBeatAtRef.current < now + LOOKAHEAD_MS) {
        if (nextBeatAtRef.current <= now) {
          processBeat();
        } else {
          const delay = nextBeatAtRef.current - now;
          setTimeout(() => processBeat(), delay);
        }

        const intervalMs = 60000 / bpmRef.current;
        nextBeatAtRef.current += intervalMs;
      }

      // Schedule next tick using ref for self-reference
      schedulerRef.current = setTimeout(() => runSchedulerRef.current(), SCHEDULER_INTERVAL_MS);
    };
  }, [processBeat]);

  // Wrapper to call the ref
  const runScheduler = useCallback(() => {
    runSchedulerRef.current();
  }, []);

  // Controls
  const startInternal = useCallback(
    (withCountIn: boolean, countInBeats: number, onCountInComplete?: () => void) => {
      if (!enabledRef.current) {
        // Metronome disabled - just call callback immediately
        onCountInComplete?.();
        return;
      }

      // Reset state
      isPlayingRef.current = true;
      isPausedRef.current = false;
      setBeatCount(0);
      setIsPlaying(true);

      if (withCountIn && countInBeats > 0) {
        isCountingInRef.current = true;
        countInRemainingRef.current = countInBeats;
        countInCallbackRef.current = onCountInComplete || null;
        setIsCountingIn(true);
        setCountInRemaining(countInBeats);
      } else {
        isCountingInRef.current = false;
        countInRemainingRef.current = 0;
        countInCallbackRef.current = null;
        setIsCountingIn(false);
        setCountInRemaining(0);
        // If no count-in, call callback immediately
        onCountInComplete?.();
      }

      // Start scheduler
      nextBeatAtRef.current = nowMs();
      runScheduler();
    },
    [runScheduler]
  );

  const startCountInThenPlay = useCallback(
    (onCountInComplete: () => void) => {
      startInternal(countInEnabledRef.current, countInBeatsRef.current, onCountInComplete);
    },
    [startInternal]
  );

  const start = useCallback(() => {
    startInternal(false, 0);
  }, [startInternal]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    isPausedRef.current = false;
    isCountingInRef.current = false;
    countInRemainingRef.current = 0;
    countInCallbackRef.current = null;

    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    if (duckTimeoutRef.current) {
      clearTimeout(duckTimeoutRef.current);
      duckTimeoutRef.current = null;
    }

    isDuckedRef.current = false;
    setBeatCount(0);
    setIsPlaying(false);
    setIsCountingIn(false);
    setCountInRemaining(0);
  }, []);

  const pause = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current) return;

    isPausedRef.current = true;
    pausedAtRef.current = Math.max(0, nextBeatAtRef.current - nowMs());

    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (!isPlayingRef.current || !isPausedRef.current) return;

    isPausedRef.current = false;
    nextBeatAtRef.current = nowMs() + pausedAtRef.current;
    runScheduler();
  }, [runScheduler]);

  const setBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(40, Math.min(220, newBpm));
    bpmRef.current = clamped;
    setBpmState(clamped);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = clamped;
    setVolumeState(clamped);
  }, []);

  const duckVolume = useCallback((duration: number = DEFAULT_DUCK_DURATION_MS) => {
    if (!isPlayingRef.current) return;

    if (duckTimeoutRef.current) {
      clearTimeout(duckTimeoutRef.current);
    }

    isDuckedRef.current = true;
    duckTimeoutRef.current = setTimeout(() => {
      isDuckedRef.current = false;
      duckTimeoutRef.current = null;
    }, duration);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearTimeout(schedulerRef.current);
      if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
    };
  }, []);

  const controls = useMemo(
    () => ({
      startCountInThenPlay,
      start,
      stop,
      pause,
      resume,
      setBpm,
      setVolume,
      duckVolume,
    }),
    [startCountInThenPlay, start, stop, pause, resume, setBpm, setVolume, duckVolume]
  );

  return [
    { isPlaying, bpm, volume, beatCount, isCountingIn, countInRemaining },
    controls,
  ];
}
