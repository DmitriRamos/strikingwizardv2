import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

export interface InputProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'rounded' | 'underlined';
  isDisabled?: boolean;
  isInvalid?: boolean;
  children?: React.ReactNode;
}

export interface InputFieldProps extends TextInputProps {
  className?: string;
}

const sizeMap = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-12 px-4 text-lg',
  xl: 'h-14 px-5 text-xl',
};

export function Input({
  className = '',
  size = 'md',
  variant = 'outline',
  isDisabled,
  isInvalid,
  children,
}: InputProps) {
  let variantClass = '';
  if (variant === 'outline') {
    variantClass = 'border border-neutral-700 rounded-xl';
  } else if (variant === 'rounded') {
    variantClass = 'border border-neutral-700 rounded-full';
  } else if (variant === 'underlined') {
    variantClass = 'border-b border-neutral-700';
  }

  const disabledClass = isDisabled ? 'opacity-50' : '';
  const invalidClass = isInvalid ? 'border-red-500' : '';

  return (
    <View
      className={`bg-surface flex-row items-center ${sizeMap[size]} ${variantClass} ${disabledClass} ${invalidClass} ${className}`}
    >
      {children}
    </View>
  );
}

export function InputField({ className = '', ...props }: InputFieldProps) {
  return (
    <TextInput
      className={`flex-1 text-text ${className}`}
      placeholderTextColor="#737373"
      {...props}
    />
  );
}
