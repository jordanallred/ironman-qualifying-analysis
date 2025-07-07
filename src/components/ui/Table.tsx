import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
}

// Main Table component
export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

// Table Header
export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn('bg-gradient-to-r from-gray-50 to-blue-50', className)}>
      {children}
    </thead>
  );
}

// Table Body
export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
}

// Table Row
export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr 
      className={cn(
        'hover:bg-blue-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// Table Cell (for data)
export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={cn('px-4 py-4 whitespace-nowrap text-sm text-gray-900', className)}>
      {children}
    </td>
  );
}

// Table Header Cell (for column headers)
export function TableHeaderCell({ children, className }: TableHeaderCellProps) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

// Export all components as named exports for easy importing
export default Table;