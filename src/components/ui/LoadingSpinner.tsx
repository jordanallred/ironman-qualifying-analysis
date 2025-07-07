import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function LoadingSpinner({ 
  size = 'md', 
  className 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin',
        spinnerSizes[size],
        className
      )}
    />
  );
}