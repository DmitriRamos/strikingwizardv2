import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface HeadingProps extends RNTextProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const sizeMap = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
  '3xl': 'text-4xl',
  '4xl': 'text-5xl',
  '5xl': 'text-6xl',
};

export function Heading({ className = '', size = 'lg', ...props }: HeadingProps) {
  const sizeClass = sizeMap[size];
  return (
    <RNText
      className={`text-text font-bold ${sizeClass} ${className}`}
      {...props}
    />
  );
}
