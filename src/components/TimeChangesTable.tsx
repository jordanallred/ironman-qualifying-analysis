'use client';

import { useSorting } from '@/hooks/useSorting';
import { Table, TableHeader, TableBody, TableRow, TableCell, SortableHeader } from '@/components/ui';

interface TimeChangesData {
  ageGroup: string;
  participants: number;
  system2025Time: number | null;
  system2026Time: number | null;
  timeChange: number | null;
  timePercentChange: number | null;
}

interface TimeChangesTableProps {
  data: TimeChangesData[];
}

export default function TimeChangesTable({ data }: TimeChangesTableProps) {
  const { sortedData, sortConfig, handleSort } = useSorting({
    data,
    defaultSort: { key: 'ageGroup', direction: 'asc' }
  });

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Time Changes by Age Group
      </h3>
      <p className="text-gray-600 mb-6">
        How qualifying time requirements change between 2025 and 2026 systems by age group
      </p>
      
      <Table>
        <TableHeader>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age Group
            </th>
            <SortableHeader
              sortKey="participants"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Participants
            </SortableHeader>
            <SortableHeader
              sortKey="system2025Time"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              2025 Cutoff Time
            </SortableHeader>
            <SortableHeader
              sortKey="system2026Time"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              2026 Cutoff Time (Age-Graded)
            </SortableHeader>
            <SortableHeader
              sortKey="timeChange"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Time Change
            </SortableHeader>
            <SortableHeader
              sortKey="timePercentChange"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Time Change %
            </SortableHeader>
          </tr>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.ageGroup}>
              <TableCell className="font-medium text-gray-900">
                {row.ageGroup}
              </TableCell>
              <TableCell>
                {row.participants}
              </TableCell>
              <TableCell>
                {row.system2025Time ? formatTime(row.system2025Time) : '-'}
              </TableCell>
              <TableCell>
                {row.system2026Time ? formatTime(row.system2026Time) : '-'}
              </TableCell>
              <TableCell>
                {row.timeChange !== null ? (
                  <div className="flex flex-col space-y-1">
                    <span className={`font-medium ${
                      row.timeChange > 0 ? 'text-red-600' : 
                      row.timeChange < 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {row.timeChange > 0 ? '+' : ''}{Math.round(row.timeChange / 60)}min
                    </span>
                    <span className="text-xs text-gray-500">
                      ({row.timeChange > 0 ? '+' : ''}{Math.round(row.timeChange)}s)
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {row.timePercentChange !== null ? (
                  <span className={`font-medium ${
                    row.timePercentChange > 0 ? 'text-red-600' : 
                    row.timePercentChange < 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {row.timePercentChange > 0 ? '+' : ''}{row.timePercentChange.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}