'use client';

import { useState } from 'react';
import { useSorting } from '@/hooks/useSorting';
import { Table, TableHeader, TableBody, TableRow, TableCell, SortableHeader, Button } from '@/components/ui';

interface AthleteResult {
  place: number;
  name: string;
  age_group: string;
  raw_time_seconds: number;
  age_graded_time_seconds: number;
  qualified_2025?: boolean;
  qualified_2026?: boolean;
}

interface AthleteResultsTableProps {
  data: AthleteResult[];
}

export default function AthleteResultsTable({ data }: AthleteResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { sortedData, sortConfig, handleSort } = useSorting({
    data,
    defaultSort: { key: 'place', direction: 'asc' }
  });

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Individual Athlete Results
      </h3>
      
      <Table>
        <TableHeader>
          <tr>
            <SortableHeader
              sortKey="place"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Place
            </SortableHeader>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age Group
            </th>
            <SortableHeader
              sortKey="raw_time_seconds"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Finish Time
            </SortableHeader>
            <SortableHeader
              sortKey="age_graded_time_seconds"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Age Graded
            </SortableHeader>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              2025 Qualified
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              2026 Qualified
            </th>
          </tr>
        </TableHeader>
        <TableBody>
          {paginatedData.map((athlete, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {athlete.place}
              </TableCell>
              <TableCell>
                {athlete.name}
              </TableCell>
              <TableCell className="text-gray-500">
                {athlete.age_group}
              </TableCell>
              <TableCell className="text-gray-500">
                {formatTime(athlete.raw_time_seconds)}
              </TableCell>
              <TableCell className="text-gray-500">
                {formatTime(athlete.age_graded_time_seconds)}
              </TableCell>
              <TableCell>
                {athlete.qualified_2025 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Qualified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    No
                  </span>
                )}
              </TableCell>
              <TableCell>
                {athlete.qualified_2026 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Qualified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    No
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedData.length)}</span> of{' '}
                <span className="font-medium">{sortedData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-l-md"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="rounded-none"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-r-md"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}