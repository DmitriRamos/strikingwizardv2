import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  bold?: boolean;
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
};

export function Text({ className = '', size = 'md', bold, ...props }: TextProps) {
  const sizeClass = sizeMap[size];
  const boldClass = bold ? 'font-bold' : '';
  return (
    <RNText
      className={`text-text ${sizeClass} ${boldClass} ${className}`}
      {...props}
    />
  );
}
