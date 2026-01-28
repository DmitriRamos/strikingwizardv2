import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  className?: string;
  variant?: 'solid' | 'outline';
  action?: 'error' | 'warning' | 'success' | 'info' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export interface BadgeTextProps {
  className?: string;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
  lg: 'px-3 py-1.5',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Badge({
  className = '',
  variant = 'solid',
  action = 'info',
  size = 'md',
  children,
}: BadgeProps) {
  let bgClass = '';
  let borderClass = '';

  if (variant === 'solid') {
    if (action === 'error') bgClass = 'bg-red-600';
    else if (action === 'warning') bgClass = 'bg-yellow-600';
    else if (action === 'success') bgClass = 'bg-primary-500';
    else if (action === 'info') bgClass = 'bg-blue-600';
    else bgClass = 'bg-neutral-600';
  } else {
    bgClass = 'bg-transparent';
    if (action === 'error') borderClass = 'border border-red-500';
    else if (action === 'warning') borderClass = 'border border-yellow-500';
    else if (action === 'success') borderClass = 'border border-primary-500';
    else if (action === 'info') borderClass = 'border border-blue-500';
    else borderClass = 'border border-neutral-500';
  }

  return (
    <View
      className={`rounded-full flex-row items-center ${sizeMap[size]} ${bgClass} ${borderClass} ${className}`}
    >
      {typeof children === 'string' ? (
        <Text className={`text-white font-semibold ${textSizeMap[size]}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export function BadgeText({ className = '', children }: BadgeTextProps) {
  return (
    <Text className={`text-white font-semibold text-sm ${className}`}>
      {children}
    </Text>
  );
}
