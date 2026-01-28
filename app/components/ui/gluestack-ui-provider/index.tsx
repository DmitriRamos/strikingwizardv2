import React from 'react';
import { View } from 'react-native';

type GluestackUIProviderProps = {
  mode?: 'light' | 'dark';
  children: React.ReactNode;
};

export function GluestackUIProvider({
  mode = 'dark',
  children,
}: GluestackUIProviderProps) {
  return (
    <View className={`flex-1 ${mode === 'dark' ? 'dark' : ''}`}>{children}</View>
  );
}
