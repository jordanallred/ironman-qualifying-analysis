'use client';

import { useSorting } from '@/hooks/useSorting';
import { Table, TableHeader, TableBody, TableRow, TableCell, SortableHeader } from '@/components/ui';

interface SlotChangesData {
  ageGroup: string;
  system2025Total: number;
  system2026Total: number;
  changeTotal: number;
  percentChange: number;
  system2025Men: number;
  system2025Women: number;
  system2026Men: number;
  system2026Women: number;
  changeMen: number;
  changeWomen: number;
}

interface SlotChangesTableProps {
  data: SlotChangesData[];
}

export default function SlotChangesTable({ data }: SlotChangesTableProps) {
  const { sortedData, sortConfig, handleSort } = useSorting({
    data,
    defaultSort: { key: 'changeTotal', direction: 'asc' }
  });

  // Helper function to format gender breakdown appropriately
  const formatGenderBreakdown = (men: number, women: number, ageGroup: string, isChange: boolean = false) => {
    const isMaleOnly = ageGroup.startsWith('M');
    const isFemaleOnly = ageGroup.startsWith('F');
    const prefix = isChange && men > 0 ? '+' : '';
    const prefixW = isChange && women > 0 ? '+' : '';
    
    if (isMaleOnly) {
      return `(${prefix}${men}M)`;
    } else if (isFemaleOnly) {
      return `(${prefixW}${women}F)`;
    } else {
      // Mixed age group (shouldn't happen in Ironman but just in case)
      return `(${prefix}${men}M / ${prefixW}${women}F)`;
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Slot Changes by Age Group
      </h3>
      
      <Table>
        <TableHeader>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age Group
            </th>
            <SortableHeader
              sortKey="system2025Total"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              2025 System
            </SortableHeader>
            <SortableHeader
              sortKey="system2026Total"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              2026 System
            </SortableHeader>
            <SortableHeader
              sortKey="changeTotal"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Change
            </SortableHeader>
            <SortableHeader
              sortKey="percentChange"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              % Change
            </SortableHeader>
          </tr>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.ageGroup}>
              <TableCell className="font-medium text-gray-900">
                {row.ageGroup}
              </TableCell>
              <TableCell className="text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{row.system2025Total}</span>
                  <span className="text-xs text-gray-600">
                    {formatGenderBreakdown(row.system2025Men, row.system2025Women, row.ageGroup)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{row.system2026Total}</span>
                  <span className="text-xs text-gray-600">
                    {formatGenderBreakdown(row.system2026Men, row.system2026Women, row.ageGroup)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      row.changeTotal > 0 ? 'text-green-600' : 
                      row.changeTotal < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {row.changeTotal > 0 ? '+' : ''}{row.changeTotal}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatGenderBreakdown(row.changeMen, row.changeWomen, row.ageGroup, true)}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {row.system2025Total > 0 ? (
                  <span className={`font-medium ${
                    row.percentChange > 0 ? 'text-green-600' : 
                    row.percentChange < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {row.percentChange > 0 ? '+' : ''}{row.percentChange.toFixed(1)}%
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