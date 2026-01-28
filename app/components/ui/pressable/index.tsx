import React from 'react';
import { Pressable as RNPressable, PressableProps } from 'react-native';

export interface CustomPressableProps extends PressableProps {
  className?: string;
}

export function Pressable({ className = '', ...props }: CustomPressableProps) {
  return <RNPressable className={`active:opacity-70 ${className}`} {...props} />;
}
