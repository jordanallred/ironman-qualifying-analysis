import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search';
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const inputVariants = {
  default: 'block w-full px-4 py-3 text-base border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all',
  search: 'block w-full pl-12 pr-12 py-3 text-base border border-gray-200 bg-white text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all',
};

export default function Input({
  variant = 'default',
  error = false,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className,
  ...props
}: InputProps) {
  const baseInput = (
    <input
      className={cn(
        inputVariants[variant],
        error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
        leftIcon && variant !== 'search' && 'pl-12',
        rightIcon && variant !== 'search' && 'pr-12',
        className
      )}
      {...props}
    />
  );

  if (leftIcon || rightIcon) {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        {baseInput}
        {rightIcon && (
          <div className={cn(
            "absolute inset-y-0 right-0 pr-4 flex items-center",
            onRightIconClick ? "cursor-pointer" : "pointer-events-none"
          )}>
            <div onClick={onRightIconClick}>
              {rightIcon}
            </div>
          </div>
        )}
      </div>
    );
  }

  return baseInput;
}