import { useCallback, useEffect, useState } from 'react';
import { FlatList, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CALLOUTS } from '../src/data/defaultCallouts';
import type { Callout, MetronomeConfig, MetronomeSoundId } from '../src/types/session';
import { DEFAULT_METRONOME_CONFIG } from '../src/types/session';
import {
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ButtonText,
  Input,
  InputField,
  Card,
  Pressable,
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
// Constants
// ---------------------------------------------------------------------------

const METRONOME_SOUNDS: { id: MetronomeSoundId; label: string }[] = [
  { id: 'click', label: 'Click' },
  { id: 'woodblock', label: 'Woodblock' },
];

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

const CALLOUTS_STORAGE_KEY = '@striking_wizard_callouts';
const SETTINGS_STORAGE_KEY = '@striking_wizard_settings';
let customIdCounter = 1000;

export default function SetupScreen() {
  const router = useRouter();

  // Round configuration
  const [rounds, setRounds] = useState(3);
  const [roundDurationSecs, setRoundDurationSecs] = useState(180); // 3:00
  const [restDurationSecs, setRestDurationSecs] = useState(60); // 1:00
  const [countdownDurationSecs, setCountdownDurationSecs] = useState(10); // 0:10

  // Callout interval
  const [calloutIntervalMin, setCalloutIntervalMin] = useState(3);
  const [calloutIntervalMax, setCalloutIntervalMax] = useState(8);

  // Callout list
const [callouts, setCallouts] = useState<Callout[]>([]);
  const [customText, setCustomText] = useState('');

  // Metronome configuration
  const [metronome, setMetronome] = useState<MetronomeConfig>(() => ({
    ...DEFAULT_METRONOME_CONFIG,
  }));

  // ---------------------------------------------------------------------------
  // Load callouts from storage on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadCallouts = async () => {
      try {
        const stored = await AsyncStorage.getItem(CALLOUTS_STORAGE_KEY);
        if (stored) {
          setCallouts(JSON.parse(stored));
        } else {
          // First time - use defaults (first 3 enabled)
          setCallouts(DEFAULT_CALLOUTS.map((c) => ({ ...c })));
        }
      } catch (error) {
        console.error('Failed to load callouts:', error);
        setCallouts(DEFAULT_CALLOUTS.map((c) => ({ ...c })));
      }
    };
    loadCallouts();
  }, []);

  // ---------------------------------------------------------------------------
  // Save callouts to storage whenever they change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (callouts.length > 0) {
      AsyncStorage.setItem(CALLOUTS_STORAGE_KEY, JSON.stringify(callouts)).catch(
        (error) => console.error('Failed to save callouts:', error)
      );
    }
  }, [callouts]);

  // ---------------------------------------------------------------------------
  // Load settings from storage on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const settings = JSON.parse(stored);
          setRounds(settings.rounds ?? 3);
          setRoundDurationSecs(settings.roundDurationSecs ?? 180);
          setRestDurationSecs(settings.restDurationSecs ?? 60);
          setCountdownDurationSecs(settings.countdownDurationSecs ?? 10);
          setCalloutIntervalMin(settings.calloutIntervalMin ?? 3);
          setCalloutIntervalMax(settings.calloutIntervalMax ?? 8);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // ---------------------------------------------------------------------------
  // Save settings to storage whenever they change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const settings = {
      rounds,
      roundDurationSecs,
      restDurationSecs,
      countdownDurationSecs,
      calloutIntervalMin,
      calloutIntervalMax,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(
      (error) => console.error('Failed to save settings:', error)
    );
  }, [rounds, roundDurationSecs, restDurationSecs, countdownDurationSecs, calloutIntervalMin, calloutIntervalMax]);

  // ---------------------------------------------------------------------------
  // Stepper helpers
  // ---------------------------------------------------------------------------

  const inc = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number
  ) => setter((v) => Math.min(v + 1, max));
  const dec = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    min: number
  ) => setter((v) => Math.max(v - 1, min));

  const incTime = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number,
    step = 15
  ) => setter((v) => Math.min(v + step, max));
  const decTime = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    min: number,
    step = 15
  ) => setter((v) => Math.max(v - step, min));

  // ---------------------------------------------------------------------------
  // Metronome helpers
  // ---------------------------------------------------------------------------

  const updateMetronome = useCallback(
    <K extends keyof MetronomeConfig>(key: K, value: MetronomeConfig[K]) => {
      setMetronome((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const incBpm = useCallback(() => {
    setMetronome((prev) => ({
      ...prev,
      bpm: Math.min(prev.bpm + 5, 220),
    }));
  }, []);

  const decBpm = useCallback(() => {
    setMetronome((prev) => ({
      ...prev,
      bpm: Math.max(prev.bpm - 5, 40),
    }));
  }, []);

  const incVolume = useCallback(() => {
    setMetronome((prev) => ({
      ...prev,
      volume: Math.min(prev.volume + 0.1, 1.0),
    }));
  }, []);

  const decVolume = useCallback(() => {
    setMetronome((prev) => ({
      ...prev,
      volume: Math.max(prev.volume - 0.1, 0.0),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Callout toggling & custom entry
  // ---------------------------------------------------------------------------

  const toggleCallout = useCallback((id: string) => {
    setCallouts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  }, []);

  const addCustomCallout = useCallback(() => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const newCallout: Callout = {
      id: String(customIdCounter++),
      label: trimmed,
      enabled: true,
    };
    setCallouts((prev) => [...prev, newCallout]);
    setCustomText('');
  }, [customText]);

  // ---------------------------------------------------------------------------
  // Start session
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(() => {
    const enabledCallouts = callouts.filter((c) => c.enabled);

    const params = {
      rounds: String(rounds),
      roundDurationSecs: String(roundDurationSecs),
      restDurationSecs: String(restDurationSecs),
      countdownDurationSecs: String(countdownDurationSecs),
      calloutIntervalMin: String(calloutIntervalMin),
      calloutIntervalMax: String(calloutIntervalMax),
      callouts: JSON.stringify(enabledCallouts),
      metronome: JSON.stringify(metronome),
    };

    router.push({ pathname: '/runner', params });
  }, [
    callouts,
    rounds,
    roundDurationSecs,
    restDurationSecs,
    countdownDurationSecs,
    calloutIntervalMin,
    calloutIntervalMax,
    metronome,
    router,
  ]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderCalloutItem = useCallback(
    ({ item }: { item: Callout }) => (
      <Pressable
        className={`flex-1 py-2.5 px-2 rounded-xl border items-center ${
          item.enabled
            ? 'border-primary-500 bg-primary-500/20'
            : 'border-neutral-700 bg-surface'
        }`}
        onPress={() => toggleCallout(item.id)}
      >
        <Text
          size="sm"
          className={item.enabled ? 'text-text font-semibold' : 'text-text-muted'}
        >
          {item.label}
        </Text>
      </Pressable>
    ),
    [toggleCallout]
  );

  const enabledCount = callouts.filter((c) => c.enabled).length;

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      data={callouts}
      keyExtractor={(item) => item.id}
      renderItem={renderCalloutItem}
      numColumns={3}
      columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
      ListHeaderComponent={
        <VStack space="lg" className="mb-4">
          {/* Title */}
          <VStack className="items-center mb-2">
            <Heading size="2xl" className="text-primary-400">
              StrikingWizard
            </Heading>
            <Text className="text-text-muted">Callout Runner Setup</Text>
          </VStack>

          {/* Rounds */}
          <Card>
            <Text size="xs" className="text-text-muted uppercase tracking-wider mb-3">
              Rounds
            </Text>
            <HStack className="items-center justify-center" space="lg">
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => dec(setRounds, 1)}
              >
                <ButtonText className="text-xl">-</ButtonText>
              </Button>
              <Text size="3xl" bold className="min-w-[60px] text-center">
                {rounds}
              </Text>
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => inc(setRounds, 99)}
              >
                <ButtonText className="text-xl">+</ButtonText>
              </Button>
            </HStack>
          </Card>

          {/* Round Duration */}
          <Card>
            <Text size="xs" className="text-text-muted uppercase tracking-wider mb-3">
              Round Duration
            </Text>
            <HStack className="items-center justify-center" space="lg">
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => decTime(setRoundDurationSecs, 10)}
              >
                <ButtonText className="text-xl">-</ButtonText>
              </Button>
              <Text size="3xl" bold className="min-w-[80px] text-center">
                {formatTime(roundDurationSecs)}
              </Text>
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => incTime(setRoundDurationSecs, 1800)}
              >
                <ButtonText className="text-xl">+</ButtonText>
              </Button>
            </HStack>
          </Card>

          {/* Rest Duration */}
          <Card>
            <Text size="xs" className="text-text-muted uppercase tracking-wider mb-3">
              Rest Duration
            </Text>
            <HStack className="items-center justify-center" space="lg">
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => decTime(setRestDurationSecs, 0)}
              >
                <ButtonText className="text-xl">-</ButtonText>
              </Button>
              <Text size="3xl" bold className="min-w-[80px] text-center">
                {formatTime(restDurationSecs)}
              </Text>
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => incTime(setRestDurationSecs, 600)}
              >
                <ButtonText className="text-xl">+</ButtonText>
              </Button>
            </HStack>
          </Card>

          {/* Countdown Duration */}
          <Card>
            <Text size="xs" className="text-text-muted uppercase tracking-wider mb-3">
              Countdown Duration
            </Text>
            <HStack className="items-center justify-center" space="lg">
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => dec(setCountdownDurationSecs, 1)}
              >
                <ButtonText className="text-xl">-</ButtonText>
              </Button>
              <Text size="3xl" bold className="min-w-[80px] text-center">
                {formatTime(countdownDurationSecs)}
              </Text>
              <Button
                size="md"
                className="w-12 h-12 rounded-full"
                onPress={() => inc(setCountdownDurationSecs, 30)}
              >
                <ButtonText className="text-xl">+</ButtonText>
              </Button>
            </HStack>
          </Card>

          {/* Callout Interval */}
          <Card>
            <Text size="xs" className="text-text-muted uppercase tracking-wider mb-3">
              Callout Interval
            </Text>
            <HStack className="justify-around">
              <VStack className="items-center">
                <Text size="xs" className="text-text-muted mb-2">
                  Min (s)
                </Text>
                <HStack className="items-center" space="md">
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full"
                    onPress={() => dec(setCalloutIntervalMin, 1)}
                  >
                    <ButtonText>-</ButtonText>
                  </Button>
                  <Text size="2xl" bold className="min-w-[40px] text-center">
                    {calloutIntervalMin}
                  </Text>
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full"
                    onPress={() =>
                      setCalloutIntervalMin((v) =>
                        Math.min(v + 1, calloutIntervalMax)
                      )
                    }
                  >
                    <ButtonText>+</ButtonText>
                  </Button>
                </HStack>
              </VStack>
              <VStack className="items-center">
                <Text size="xs" className="text-text-muted mb-2">
                  Max (s)
                </Text>
                <HStack className="items-center" space="md">
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full"
                    onPress={() =>
                      setCalloutIntervalMax((v) =>
                        Math.max(v - 1, calloutIntervalMin)
                      )
                    }
                  >
                    <ButtonText>-</ButtonText>
                  </Button>
                  <Text size="2xl" bold className="min-w-[40px] text-center">
                    {calloutIntervalMax}
                  </Text>
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full"
                    onPress={() => inc(setCalloutIntervalMax, 60)}
                  >
                    <ButtonText>+</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </HStack>
          </Card>

          {/* Metronome Settings */}
          <Card>
            <HStack className="items-center justify-between mb-3">
              <Text size="xs" className="text-text-muted uppercase tracking-wider">
                Metronome
              </Text>
              <Switch
                value={metronome.enabled}
                onValueChange={(value) => updateMetronome('enabled', value)}
                trackColor={{ false: '#3e3e3e', true: '#57b17b' }}
                thumbColor={metronome.enabled ? '#ffffff' : '#f4f3f4'}
              />
            </HStack>

            {metronome.enabled && (
              <VStack space="md">
                {/* BPM */}
                <VStack>
                  <Text size="xs" className="text-text-muted mb-2">
                    BPM
                  </Text>
                  <HStack className="items-center justify-center" space="md">
                    <Button
                      size="sm"
                      className="w-10 h-10 rounded-full"
                      onPress={decBpm}
                    >
                      <ButtonText>-</ButtonText>
                    </Button>
                    <Text size="2xl" bold className="min-w-[60px] text-center">
                      {metronome.bpm}
                    </Text>
                    <Button
                      size="sm"
                      className="w-10 h-10 rounded-full"
                      onPress={incBpm}
                    >
                      <ButtonText>+</ButtonText>
                    </Button>
                  </HStack>
                </VStack>

                {/* Sound Picker */}
                <VStack>
                  <Text size="xs" className="text-text-muted mb-2">
                    Sound
                  </Text>
                  <HStack space="sm" className="justify-center">
                    {METRONOME_SOUNDS.map((sound) => (
                      <Pressable
                        key={sound.id}
                        className={`py-2 px-4 rounded-lg border ${
                          metronome.soundId === sound.id
                            ? 'border-primary-500 bg-primary-500/20'
                            : 'border-neutral-700 bg-surface'
                        }`}
                        onPress={() => updateMetronome('soundId', sound.id)}
                      >
                        <Text
                          size="sm"
                          className={
                            metronome.soundId === sound.id
                              ? 'text-text font-semibold'
                              : 'text-text-muted'
                          }
                        >
                          {sound.label}
                        </Text>
                      </Pressable>
                    ))}
                  </HStack>
                </VStack>

                {/* Volume */}
                <VStack>
                  <Text size="xs" className="text-text-muted mb-2">
                    Volume
                  </Text>
                  <HStack className="items-center justify-center" space="md">
                    <Button
                      size="sm"
                      className="w-10 h-10 rounded-full"
                      onPress={decVolume}
                    >
                      <ButtonText>-</ButtonText>
                    </Button>
                    <Text size="xl" bold className="min-w-[60px] text-center">
                      {Math.round(metronome.volume * 100)}%
                    </Text>
                    <Button
                      size="sm"
                      className="w-10 h-10 rounded-full"
                      onPress={incVolume}
                    >
                      <ButtonText>+</ButtonText>
                    </Button>
                  </HStack>
                </VStack>

                {/* Toggles row */}
                <HStack className="justify-around mt-2">
                  {/* Count-in Toggle */}
                  <VStack className="items-center">
                    <Text size="xs" className="text-text-muted mb-2">
                      Count-in
                    </Text>
                    <Switch
                      value={metronome.countInEnabled}
                      onValueChange={(value) => updateMetronome('countInEnabled', value)}
                      trackColor={{ false: '#3e3e3e', true: '#57b17b' }}
                      thumbColor={metronome.countInEnabled ? '#ffffff' : '#f4f3f4'}
                    />
                  </VStack>

                  {/* Play During Rest Toggle */}
                  <VStack className="items-center">
                    <Text size="xs" className="text-text-muted mb-2">
                      During Rest
                    </Text>
                    <Switch
                      value={metronome.playDuringRest}
                      onValueChange={(value) => updateMetronome('playDuringRest', value)}
                      trackColor={{ false: '#3e3e3e', true: '#57b17b' }}
                      thumbColor={metronome.playDuringRest ? '#ffffff' : '#f4f3f4'}
                    />
                  </VStack>
                </HStack>
              </VStack>
            )}
          </Card>

          {/* Callouts header */}
          <Text size="md" className="font-semibold mt-2">
            Callouts ({enabledCount} selected)
          </Text>
        </VStack>
      }
      ListFooterComponent={
        <VStack space="lg" className="mt-4">
          {/* Custom callout input */}
          <HStack space="md">
            <Input className="flex-1">
              <InputField
                placeholder="Add custom callout..."
                value={customText}
                onChangeText={setCustomText}
                onSubmitEditing={addCustomCallout}
                returnKeyType="done"
              />
            </Input>
            <Button onPress={addCustomCallout}>
              <ButtonText>Add</ButtonText>
            </Button>
          </HStack>

          {/* Start button */}
          <Button
            size="lg"
            className="w-full"
            onPress={handleStart}
          >
            <ButtonText className="text-lg">Start Session</ButtonText>
          </Button>
        </VStack>
      }
    />
  );
}
