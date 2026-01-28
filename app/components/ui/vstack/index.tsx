import React from 'react';
import { View, ViewProps } from 'react-native';

export interface VStackProps extends ViewProps {
  className?: string;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const spaceMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
  '2xl': 'gap-6',
  '3xl': 'gap-8',
  '4xl': 'gap-10',
};

export function VStack({ className = '', space, ...props }: VStackProps) {
  const spaceClass = space ? spaceMap[space] : '';
  return <View className={`flex flex-col ${spaceClass} ${className}`} {...props} />;
}
