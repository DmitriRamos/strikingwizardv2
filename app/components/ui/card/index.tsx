import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  className?: string;
  variant?: 'elevated' | 'outline' | 'ghost' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  className = '',
  variant = 'filled',
  size = 'md',
  ...props
}: CardProps) {
  let variantClass = '';
  if (variant === 'filled') {
    variantClass = 'bg-surface';
  } else if (variant === 'elevated') {
    variantClass = 'bg-surface shadow-lg';
  } else if (variant === 'outline') {
    variantClass = 'border border-neutral-700';
  } else {
    variantClass = 'bg-transparent';
  }

  return (
    <View
      className={`rounded-2xl ${sizeMap[size]} ${variantClass} ${className}`}
      {...props}
    />
  );
}
