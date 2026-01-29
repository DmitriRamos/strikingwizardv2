import { renderHook, act } from '@testing-library/react-native';
import { useMetronome } from '../src/hooks/useMetronome';
import type { MetronomeConfig } from '../src/types/session';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          setVolumeAsync: jest.fn().mockResolvedValue(undefined),
          setPositionAsync: jest.fn().mockResolvedValue(undefined),
          playAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock performance.now
const mockNow = jest.fn(() => 0);
global.performance = { now: mockNow } as unknown as Performance;

describe('useMetronome', () => {
  const defaultConfig: MetronomeConfig = {
    enabled: true,
    bpm: 120,
    soundId: 'click',
    volume: 0.6,
    countInEnabled: true,
    countInBeats: 4,
    playDuringRest: false,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockNow.mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useMetronome(defaultConfig));
    const [state] = result.current;

    expect(state.isPlaying).toBe(false);
    expect(state.bpm).toBe(120);
    expect(state.isCountingIn).toBe(false);
    expect(state.countInRemaining).toBe(0);
  });

  it('starts count-in and calls callback when complete', async () => {
    const { result } = renderHook(() => useMetronome(defaultConfig));
    const callback = jest.fn();

    console.log('Before start:', {
      isPlaying: result.current[0].isPlaying,
      isCountingIn: result.current[0].isCountingIn,
      countInRemaining: result.current[0].countInRemaining,
    });

    // Start with count-in
    act(() => {
      result.current[1].startCountInThenPlay(callback);
    });

    console.log('After start:', {
      isPlaying: result.current[0].isPlaying,
      isCountingIn: result.current[0].isCountingIn,
      countInRemaining: result.current[0].countInRemaining,
    });

    // Should be playing - first beat plays immediately, so count is already 3
    expect(result.current[0].isPlaying).toBe(true);
    expect(result.current[0].isCountingIn).toBe(true);
    expect(result.current[0].countInRemaining).toBe(3); // First beat already played

    // Simulate remaining 3 beats at 120 BPM (500ms each)
    for (let i = 0; i < 3; i++) {
      mockNow.mockReturnValue((i + 1) * 500);
      act(() => {
        jest.advanceTimersByTime(500);
      });
      console.log(`After beat ${i + 2}:`, {
        isCountingIn: result.current[0].isCountingIn,
        countInRemaining: result.current[0].countInRemaining,
        callbackCalled: callback.mock.calls.length,
      });
    }

    // Callback should have been called after 4 total beats
    expect(callback).toHaveBeenCalledTimes(1);
    expect(result.current[0].isCountingIn).toBe(false);
  });

  it('calls callback immediately when metronome is disabled', () => {
    const disabledConfig = { ...defaultConfig, enabled: false };
    const { result } = renderHook(() => useMetronome(disabledConfig));
    const callback = jest.fn();

    act(() => {
      result.current[1].startCountInThenPlay(callback);
    });

    // Callback should be called immediately
    expect(callback).toHaveBeenCalledTimes(1);
    expect(result.current[0].isPlaying).toBe(false);
  });

  it('stops correctly', () => {
    const { result } = renderHook(() => useMetronome(defaultConfig));

    act(() => {
      result.current[1].start();
    });

    expect(result.current[0].isPlaying).toBe(true);

    act(() => {
      result.current[1].stop();
    });

    expect(result.current[0].isPlaying).toBe(false);
    expect(result.current[0].beatCount).toBe(0);
  });
});
