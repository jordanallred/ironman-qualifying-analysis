import React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ children, className }: TabsProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
      {children}
    </div>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-xl', className)}>
      <nav className="flex space-x-8 px-8 pt-6">
        {children}
      </nav>
    </div>
  );
}

export function Tab({ isActive, onClick, children, className }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'py-3 px-4 border-b-2 font-semibold text-sm transition-all rounded-t-lg',
        isActive
          ? 'border-blue-500 text-blue-600 bg-white'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className }: TabsContentProps) {
  return (
    <div className={cn('p-8', className)}>
      {children}
    </div>
  );
}