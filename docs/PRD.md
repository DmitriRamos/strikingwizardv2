# Callout Runner — Product Requirements Document

## 1. Overview

The **Callout Runner** is the core feature of StrikingWizard. It is a round timer combined with a voice-coached callout system designed for striking athletes training solo. During active rounds, the app calls out techniques and combos at semi-random intervals using text-to-speech, simulating a coach feeding combinations in real time.

## 2. Problem Statement

Striking athletes (boxing, Muay Thai, MMA) who train solo — on a heavy bag, shadow boxing, or pad-less drills — lack the unpredictability of a coach calling out techniques. Existing round timer apps handle timing but offer no coaching stimulus. Athletes default to repetitive, self-directed patterns instead of reacting to external cues.

The Callout Runner solves this by pairing a configurable round timer with randomized voice callouts, forcing the athlete to listen and react rather than fall into autopilot.

## 3. Goals

- Provide a fully configurable round timer (round count, round duration, rest duration).
- Play semi-random voice callouts during active rounds using text-to-speech.
- Allow the user to configure the interval range between callouts.
- Ship a default library of standard boxing callouts (numbered system + common combos).
- Let users add custom callouts via text input to supplement or replace the defaults.

## 4. User Stories

| # | Story | Priority |
|---|-------|----------|
| 1 | As an athlete, I want to configure my session (rounds, round length, rest length) so the timer matches my training plan. | Must have |
| 2 | As an athlete, I want to hear random technique callouts during each round so I can practice reacting to a coach's commands. | Must have |
| 3 | As an athlete, I want a clear audio and visual transition between rounds and rest so I know when to work and when to recover. | Must have |
| 4 | As an athlete, I want to control how frequently callouts happen (e.g., every 3–6 seconds vs. every 8–15 seconds) so I can adjust difficulty. | Must have |
| 5 | As an athlete, I want to add my own custom callouts (e.g., discipline-specific techniques) so the app fits my training style. | Must have |
| 6 | As an athlete, I want to see the current round number, time remaining, and the last callout on screen so I can glance at my phone between combos. | Should have |

## 5. Screens & UX Flow

### 5.1 Setup Page

The entry point. The user configures a session before starting.

**Inputs:**

| Field | Type | Default | Constraints |
|-------|------|---------|-------------|
| Number of rounds | Numeric stepper | 3 | 1–99 |
| Round duration | Time picker (minutes + seconds) | 3:00 | 0:10–30:00 |
| Rest duration | Time picker (minutes + seconds) | 1:00 | 0:00–10:00 |
| Callout interval (min) | Seconds stepper | 3s | 1–30 |
| Callout interval (max) | Seconds stepper | 8s | 1–60, must be ≥ min |
| Callout list | Checkbox list + text input | All defaults selected | At least 1 callout selected |

**Actions:**

- **Start** — validates inputs and navigates to the Callout Runner Page.
- **Add Custom Callout** — opens a text input; the entered callout is appended to the list and auto-selected.

### 5.2 Callout Runner Page

The active session screen. Displays the timer and plays callouts.

**Layout:**

- **Round indicator** — "Round 2 of 5"
- **Timer countdown** — large, centered, counts down the current round or rest period.
- **Current callout display** — shows the most recent callout text prominently on screen.
- **Mode indicator** — clearly distinguishes WORK vs. REST (color change, label, or both).
- **Stop button** — ends the session early and returns to Setup.

**Behavior — Active Round:**

1. Timer counts down from the configured round duration.
2. A callout is selected at random from the active callout list.
3. The callout is spoken via text-to-speech and displayed on screen.
4. After the callout, a random delay (between configured min/max interval) passes before the next callout.
5. Repeat until the round timer reaches 0:00.

**Behavior — Rest Period:**

1. A "Rest" audio cue plays and the UI switches to rest mode.
2. Timer counts down from the configured rest duration.
3. No callouts fire during rest.
4. When rest ends, a "Round start" audio cue plays and the next round begins.

**Behavior — Session End:**

1. After the final round (no rest after the last round), a "Session complete" audio cue plays.
2. The UI shows a completion summary (total rounds completed).
3. A button returns the user to the Setup Page.

## 6. Default Callout Library

Standard boxing callout system using the universal numbered convention:

### Single Techniques

| # | Callout | Technique |
|---|---------|-----------|
| 1 | "1" or "Jab" | Lead-hand jab |
| 2 | "2" or "Cross" | Rear-hand cross |
| 3 | "3" or "Lead Hook" | Lead hook |
| 4 | "4" or "Rear Hook" | Rear hook |
| 5 | "5" or "Lead Uppercut" | Lead uppercut |
| 6 | "6" or "Rear Uppercut" | Rear uppercut |
| — | "Body" | Body shot (any hand) |
| — | "Slip" | Defensive slip |
| — | "Roll" | Defensive roll/bob-and-weave |

### Common Combos

| Callout | Sequence |
|---------|----------|
| "1-2" | Jab – Cross |
| "1-1-2" | Jab – Jab – Cross |
| "1-2-3" | Jab – Cross – Lead Hook |
| "1-2-3-2" | Jab – Cross – Lead Hook – Cross |
| "1-2-5-2" | Jab – Cross – Lead Uppercut – Cross |
| "3-2" | Lead Hook – Cross |
| "2-3-2" | Cross – Lead Hook – Cross |
| "1-6-3-2" | Jab – Rear Uppercut – Lead Hook – Cross |

The user can deselect any of these and/or add custom entries.

## 7. Requirements (MVP)

### Functional

- [ ] Configurable round timer: round count, round duration, rest duration.
- [ ] Callout engine: picks a random callout, fires it via TTS, waits a random delay within the configured interval range, repeats.
- [ ] Default boxing callout library (see Section 6).
- [ ] Custom callout entry: user types text, it is added to the session's callout list.
- [ ] Text-to-speech audio output for every callout.
- [ ] Visual callout display on screen during active rounds.
- [ ] Audio cues for round start, rest start, and session complete.
- [ ] Round/rest state transitions with distinct visual treatment.
- [ ] Stop button to end a session early.

### Non-Functional

- [ ] Works on both iOS and Android.
- [ ] TTS must not block or delay the timer (fire-and-forget speech).
- [ ] Timer accuracy: drift of no more than ~100ms per round.
- [ ] Responsive layout for common phone screen sizes.

## 8. Out of Scope (v1)

- Pre-recorded voice packs or selectable TTS voices.
- Saved session presets / templates.
- Training history, analytics, or session logging.
- Background audio (playing callouts while the app is backgrounded).
- Haptic feedback.
- Multiplayer or shared sessions.
- Muay Thai, kickboxing, or MMA-specific default callout packs (can be added as custom callouts for now).

## 9. Technical Notes

| Concern | Approach |
|---------|----------|
| Text-to-speech | `expo-speech` — available on iOS and Android, no native module build required. |
| Navigation | Will need a navigation library (e.g., `expo-router` or `react-navigation`) — this is the first multi-screen feature. |
| State management | Zustand or React Context (per AppReport.md decision log). Session config passed from Setup → Runner. |
| Timer implementation | `setInterval` or `requestAnimationFrame` with drift correction. Consider a custom hook (`useRoundTimer`). |
| Callout scheduling | Random delay = `Math.random() * (max - min) + min` seconds. Schedule next callout after current TTS fires. |
| Audio cues (round/rest transitions) | `expo-av` for short sound effects, or TTS announcements ("Round 1", "Rest", "Time"). |

## 10. Success Metrics

- User can configure and complete a full multi-round session with voice callouts.
- Callouts fire at semi-random intervals within the user-configured range.
- Custom callouts are spoken identically to built-in callouts.
- Round and rest transitions are clearly communicated via audio and visual cues.
- The app does not crash or freeze during a full session (up to 12 rounds of 5 minutes).
