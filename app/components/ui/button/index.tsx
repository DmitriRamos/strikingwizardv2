import React from 'react';
import { Pressable, PressableProps, Text } from 'react-native';

export interface ButtonProps extends PressableProps {
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  action?: 'primary' | 'secondary' | 'positive' | 'negative';
  isDisabled?: boolean;
  children?: React.ReactNode;
}

export interface ButtonTextProps {
  className?: string;
  children?: React.ReactNode;
}

const sizeMap = {
  xs: 'px-3 py-1.5',
  sm: 'px-4 py-2',
  md: 'px-5 py-2.5',
  lg: 'px-6 py-3',
  xl: 'px-8 py-4',
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function Button({
  className = '',
  variant = 'solid',
  size = 'md',
  action = 'primary',
  isDisabled,
  children,
  ...props
}: ButtonProps) {
  const sizeClass = sizeMap[size];

  let bgClass = '';
  let borderClass = '';

  if (variant === 'solid') {
    if (action === 'primary') bgClass = 'bg-primary-500';
    else if (action === 'secondary') bgClass = 'bg-surface-light';
    else if (action === 'positive') bgClass = 'bg-green-600';
    else if (action === 'negative') bgClass = 'bg-red-600';
  } else if (variant === 'outline') {
    bgClass = 'bg-transparent';
    if (action === 'primary') borderClass = 'border border-primary-500';
    else if (action === 'secondary') borderClass = 'border border-neutral-500';
    else if (action === 'positive') borderClass = 'border border-green-500';
    else if (action === 'negative') borderClass = 'border border-red-500';
  } else {
    bgClass = 'bg-transparent';
  }

  const disabledClass = isDisabled ? 'opacity-50' : '';

  return (
    <Pressable
      className={`rounded-xl items-center justify-center active:opacity-80 ${sizeClass} ${bgClass} ${borderClass} ${disabledClass} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={`text-white font-semibold ${textSizeMap[size]}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function ButtonText({ className = '', children }: ButtonTextProps) {
  return (
    <Text className={`text-white font-semibold ${className}`}>{children}</Text>
  );
}
