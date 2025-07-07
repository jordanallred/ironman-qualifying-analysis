import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

const backgroundVariants = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  gradient: 'bg-gradient-to-r from-gray-50 to-blue-50',
};

const paddingVariants = {
  sm: 'py-4',
  md: 'py-6 sm:py-8',
  lg: 'py-8 sm:py-12',
  xl: 'py-12 sm:py-16',
};

export default function Section({ 
  children, 
  className,
  background = 'white',
  padding = 'md',
}: SectionProps) {
  return (
    <section className={cn(
      backgroundVariants[background],
      paddingVariants[padding],
      className
    )}>
      {children}
    </section>
  );
}