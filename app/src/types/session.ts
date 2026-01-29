/** A single callout entry (built-in or custom). */
export interface Callout {
  id: string;
  label: string;
  enabled: boolean;
}

/** Available metronome sound identifiers. */
export type MetronomeSoundId = 'click' | 'woodblock';

/** Metronome configuration. */
export interface MetronomeConfig {
  /** Whether metronome is enabled for this session. */
  enabled: boolean;
  /** Beats per minute (40-220). */
  bpm: number;
  /** Which sound to use for the beat. */
  soundId: MetronomeSoundId;
  /** Volume level (0.0-1.0). */
  volume: number;
  /** Whether to play count-in beats before round starts. */
  countInEnabled: boolean;
  /** Number of count-in beats (typically 4). */
  countInBeats: number;
  /** Whether metronome continues during rest periods. */
  playDuringRest: boolean;
}

/** Default metronome configuration. */
export const DEFAULT_METRONOME_CONFIG: MetronomeConfig = {
  enabled: false,
  bpm: 120,
  soundId: 'click',
  volume: 0.6,
  countInEnabled: true,
  countInBeats: 4,
  playDuringRest: false,
};

/** Configuration for a training session, set on the Setup screen. */
export interface SessionConfig {
  rounds: number;
  roundDurationSecs: number;
  restDurationSecs: number;
  calloutIntervalMin: number;
  calloutIntervalMax: number;
  callouts: Callout[];
  metronome: MetronomeConfig;
}

/** Phase the runner can be in. */
export type RunnerPhase = 'work' | 'rest' | 'finished';

/** Phase for count-in state (before work begins). */
export type CountInPhase = 'idle' | 'counting' | 'done';
