import React from 'react';
import { cn } from '@/lib/utils';

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort?: {
    key: string;
    direction: 'asc' | 'desc';
  } | null;
  onSort: (key: string) => void;
  className?: string;
}

function SortIcon({ sortKey, currentSort }: { 
  sortKey: string; 
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
}) {
  const isActive = currentSort?.key === sortKey;
  const direction = currentSort?.direction;

  if (!isActive) {
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }

  return direction === 'asc' ? (
    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
    </svg>
  );
}

export default function SortableHeader({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
}: SortableHeaderProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        'cursor-pointer hover:bg-gray-100 transition-colors select-none',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-2">
        <span>{children}</span>
        <SortIcon sortKey={sortKey} currentSort={currentSort} />
      </div>
    </th>
  );
}