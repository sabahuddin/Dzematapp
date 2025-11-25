import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface UseSortableTableOptions<T> {
  data: T[];
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
}

export function useSortableTable<T extends Record<string, any>>({
  data,
  defaultSortKey = '',
  defaultSortDirection = null,
}: UseSortableTableOptions<T>) {
  const [sortKey, setSortKey] = useState<string>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // If clicking same column, cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey('');
      } else {
        setSortDirection('asc');
        setSortKey(key);
      }
    } else {
      // If clicking different column, start with asc
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      // Handle date strings (ISO format)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortDirection === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
      }

      // Handle strings
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [data, sortKey, sortDirection]);

  return {
    sortedData,
    sortKey,
    sortDirection,
    handleSort,
  };
}
