/** A single callout entry (built-in or custom). */
export interface Callout {
  id: string;
  label: string;
  enabled: boolean;
}

/** Configuration for a training session, set on the Setup screen. */
export interface SessionConfig {
  rounds: number;
  roundDurationSecs: number;
  restDurationSecs: number;
  calloutIntervalMin: number;
  calloutIntervalMax: number;
  callouts: Callout[];
}

/** Phase the runner can be in. */
export type RunnerPhase = 'work' | 'rest' | 'finished';
