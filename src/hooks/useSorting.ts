import { useState, useMemo } from 'react';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface UseSortingProps<T> {
  data: T[];
  defaultSort?: {
    key: keyof T;
    direction: 'asc' | 'desc';
  };
}

export function useSorting<T extends Record<string, any>>({
  data,
  defaultSort,
}: UseSortingProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultSort 
      ? { key: String(defaultSort.key), direction: defaultSort.direction }
      : null
  );

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    
    // If clicking the same column, toggle direction
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle null/undefined values - put them at the end
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (sortConfig.direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
    setSortConfig,
  };
}