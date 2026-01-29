import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RunnerScreen from '../app/runner';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({
    rounds: '3',
    roundDurationSecs: '180',
    restDurationSecs: '60',
    calloutIntervalMin: '3',
    calloutIntervalMax: '8',
    callouts: JSON.stringify([{ id: '1', label: 'Jab', enabled: true }]),
    metronome: JSON.stringify({
      enabled: true,
      bpm: 120,
      soundId: 'click',
      volume: 0.6,
      countInEnabled: true,
      countInBeats: 4,
      playDuringRest: false,
    }),
  }),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          setVolumeAsync: jest.fn(),
          setPositionAsync: jest.fn(),
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

describe('RunnerScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the runner screen with timer', () => {
    render(<RunnerScreen />);

    // Should show the phase badge
    expect(screen.getByText('WORK')).toBeTruthy();

    // Should show round indicator
    expect(screen.getByText('Round 1 of 3')).toBeTruthy();

    // Should show timer (3:00)
    expect(screen.getByText('3:00')).toBeTruthy();
  });

  it('shows pause and stop buttons', () => {
    render(<RunnerScreen />);

    expect(screen.getByText('Pause')).toBeTruthy();
    expect(screen.getByText('Stop')).toBeTruthy();
  });
});
