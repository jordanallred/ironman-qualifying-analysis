import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

interface TextProps {
  children: React.ReactNode;
  variant?: 'body' | 'lead' | 'caption' | 'muted';
  className?: string;
}

const headingStyles = {
  1: 'text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight',
  2: 'text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight',
  3: 'text-2xl sm:text-3xl font-bold text-gray-900',
  4: 'text-xl sm:text-2xl font-semibold text-gray-900',
  5: 'text-lg sm:text-xl font-semibold text-gray-900',
  6: 'text-base sm:text-lg font-semibold text-gray-900',
};

const textStyles = {
  body: 'text-base text-gray-900 leading-relaxed',
  lead: 'text-lg text-gray-700 leading-relaxed',
  caption: 'text-sm text-gray-600',
  muted: 'text-sm text-gray-500',
};

export function Heading({ children, level = 1, className }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={cn(headingStyles[level], className)}>
      {children}
    </Tag>
  );
}

export function Text({ children, variant = 'body', className }: TextProps) {
  return (
    <p className={cn(textStyles[variant], className)}>
      {children}
    </p>
  );
}