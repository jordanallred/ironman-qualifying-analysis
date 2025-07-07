'use client';

import { useSorting } from '@/hooks/useSorting';
import { Table, TableHeader, TableBody, TableRow, TableCell, SortableHeader } from '@/components/ui';

interface AgeGroupTrendsTableProps {
  ageGroupTrends: Array<{
    ageGroup: string;
    slots2025: number;
    slots2026: number;
    difference: number;
    percentageChange: number;
  }>;
}

export default function AgeGroupTrendsTable({ ageGroupTrends }: AgeGroupTrendsTableProps) {
  const { sortedData, sortConfig, handleSort } = useSorting({
    data: ageGroupTrends,
    defaultSort: { key: 'difference', direction: 'asc' }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Detailed Age Group Analysis
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete breakdown of slot changes across all age groups
        </p>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age Group
            </th>
            <SortableHeader
              sortKey="slots2025"
              currentSort={sortConfig}
              onSort={handleSort}
              className="px-6"
            >
              2025 System
            </SortableHeader>
            <SortableHeader
              sortKey="slots2026"
              currentSort={sortConfig}
              onSort={handleSort}
              className="px-6"
            >
              2026 System
            </SortableHeader>
            <SortableHeader
              sortKey="difference"
              currentSort={sortConfig}
              onSort={handleSort}
              className="px-6"
            >
              Absolute Change
            </SortableHeader>
            <SortableHeader
              sortKey="percentageChange"
              currentSort={sortConfig}
              onSort={handleSort}
              className="px-6"
            >
              % Change
            </SortableHeader>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impact
            </th>
          </tr>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow 
              key={row.ageGroup} 
              className={`${
                row.difference > 0 ? 'bg-green-50' : 
                row.difference < 0 ? 'bg-red-50' : ''
              }`}
            >
              <TableCell className="px-6 font-medium text-gray-900">
                <div className="flex items-center">
                  {row.difference > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  )}
                  {row.difference < 0 && (
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  )}
                  {row.difference === 0 && (
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  )}
                  {row.ageGroup}
                </div>
              </TableCell>
              <TableCell className="px-6 text-gray-500">
                {row.slots2025}
              </TableCell>
              <TableCell className="px-6 text-gray-500">
                {row.slots2026}
              </TableCell>
              <TableCell className="px-6">
                <span className={`font-medium ${
                  row.difference > 0 ? 'text-green-600' : 
                  row.difference < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {row.difference > 0 ? '+' : ''}{row.difference}
                </span>
              </TableCell>
              <TableCell className="px-6">
                <span className={`font-medium ${
                  row.percentageChange > 0 ? 'text-green-600' : 
                  row.percentageChange < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {row.percentageChange > 0 ? '+' : ''}{row.percentageChange}%
                </span>
              </TableCell>
              <TableCell className="px-6 text-gray-500">
                {row.difference > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Winner
                  </span>
                )}
                {row.difference < 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Loser
                  </span>
                )}
                {row.difference === 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Unchanged
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {sortedData.length} age groups across all analyzed races
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Gaining slots</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span>Losing slots</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
              <span>Unchanged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}