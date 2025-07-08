'use client';

import { useState } from 'react';

interface QualifyingTableProps {
  analysis: {
    race_name: string;
    age_group_analysis: Record<string, any>;
    detailed_results?: Array<{
      place: number;
      name: string;
      age_group: string;
      raw_time_seconds: number;
      age_graded_time_seconds: number;
      qualified_2025?: boolean;
      qualified_2026?: boolean;
    }>;
  };
}

export default function QualifyingTable({ analysis }: QualifyingTableProps) {
  const [activeTab, setActiveTab] = useState<'age-groups' | 'qualifying-times' | 'athletes'>('age-groups');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to format gender breakdown appropriately
  const formatGenderBreakdown = (men: number, women: number, ageGroup: string, isChange: boolean = false) => {
    const isMaleOnly = ageGroup.startsWith('M');
    const isFemaleOnly = ageGroup.startsWith('F');
    
    // Since age groups already indicate gender (M35-39, F40-44), 
    // don't show redundant gender breakdown for single-gender age groups
    if (isMaleOnly || isFemaleOnly) {
      return ''; // Remove redundant gender indicators
    } else {
      // Mixed age group (shouldn't happen in Ironman but just in case)
      const prefix = isChange && men > 0 ? '+' : '';
      const prefixW = isChange && women > 0 ? '+' : '';
      return `(${prefix}${men}M / ${prefixW}${women}F)`;
    }
  };

  // Prepare age group data
  const ageGroupData = Object.entries(analysis.age_group_analysis).map(([ageGroup, data]) => {
    const system2025Total = data.system_2025?.total || 0;
    const system2026Total = data.system_2026?.total || 0;
    const changeTotal = system2026Total - system2025Total;
    
    return {
      ageGroup,
      system2025Men: data.system_2025?.men || 0,
      system2025Women: data.system_2025?.women || 0,
      system2025Total,
      system2026Men: data.system_2026?.men || 0,
      system2026Women: data.system_2026?.women || 0,
      system2026Total,
      changeMen: (data.system_2026?.men || 0) - (data.system_2025?.men || 0),
      changeWomen: (data.system_2026?.women || 0) - (data.system_2025?.women || 0),
      changeTotal,
      percentChange: system2025Total > 0 ? ((changeTotal / system2025Total) * 100) : 0,
    };
  });

  // Prepare qualification times data
  const qualificationTimesData = Object.entries(analysis.age_group_analysis).map(([ageGroup, data]) => {
    const system2025QualifyingTimes = data.system_2025?.qualifying_times || {};
    const system2026QualifyingTimes = data.system_2026?.qualifying_times || {};
    const system2025Time = system2025QualifyingTimes.cutoff_time_seconds || null;
    const system2026Time = system2026QualifyingTimes.cutoff_time_seconds || null;
    const timeChange = system2025Time && system2026Time ? system2026Time - system2025Time : null;
    const timePercentChange = system2025Time && system2026Time ? ((timeChange / system2025Time) * 100) : null;
    
    return {
      ageGroup,
      participants: data.participants || 0,
      system2025Time,
      system2026Time,
      timeChange,
      timePercentChange,
    };
  });

  // Sort function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: any[], key: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };

  // Sorted age group data
  const sortedAgeGroupData = sortConfig && activeTab === 'age-groups' ? 
    getSortedData(ageGroupData, sortConfig.key, sortConfig.direction) : 
    ageGroupData.sort((a, b) => {
      // Default sort by change with losers (negative numbers) first, showing lowest negative first
      if (a.changeTotal < 0 && b.changeTotal < 0) {
        return a.changeTotal - b.changeTotal; // Most negative first
      } else if (a.changeTotal < 0 && b.changeTotal >= 0) {
        return -1; // Negative comes before positive
      } else if (a.changeTotal >= 0 && b.changeTotal < 0) {
        return 1; // Positive comes after negative
      } else {
        return b.changeTotal - a.changeTotal; // For positive, highest first
      }
    });

  // Sorted qualification times data
  const sortedQualificationTimesData = sortConfig && activeTab === 'qualifying-times' ? 
    getSortedData(qualificationTimesData, sortConfig.key, sortConfig.direction) : 
    qualificationTimesData.sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

  // Sorted athlete data
  const sortedAthleteData = analysis.detailed_results ? 
    (sortConfig && activeTab === 'athletes' ? 
      getSortedData(analysis.detailed_results, sortConfig.key, sortConfig.direction) : 
      [...analysis.detailed_results].sort((a, b) => a.place - b.place)
    ) : [];

  // Pagination for athlete data
  const totalPages = Math.ceil(sortedAthleteData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAthleteData = sortedAthleteData.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Enhanced Tab Navigation */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-xl">
        <nav className="flex space-x-8 px-8 pt-6">
          <button
            onClick={() => setActiveTab('age-groups')}
            className={`py-3 px-4 border-b-2 font-semibold text-sm transition-all ${
              activeTab === 'age-groups'
                ? 'border-blue-500 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50 rounded-t-lg'
            }`}
          >
            Slot Changes by Age Group
          </button>
          <button
            onClick={() => setActiveTab('qualifying-times')}
            className={`py-3 px-4 border-b-2 font-semibold text-sm transition-all ${
              activeTab === 'qualifying-times'
                ? 'border-blue-500 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50 rounded-t-lg'
            }`}
          >
            Time Changes by Age Group
          </button>
          {analysis.detailed_results && (
            <button
              onClick={() => setActiveTab('athletes')}
              className={`py-3 px-4 border-b-2 font-semibold text-sm transition-all ${
                activeTab === 'athletes'
                  ? 'border-blue-500 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50 rounded-t-lg'
              }`}
            >
              Athlete Results ({analysis.detailed_results.length})
            </button>
          )}
        </nav>
      </div>

      <div className="p-8">
        {activeTab === 'age-groups' ? (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Slot Changes by Age Group
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('system2025Total')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>2025 System</span>
                        {getSortIcon('system2025Total')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('system2026Total')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>2026 System</span>
                        {getSortIcon('system2026Total')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('changeTotal')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Change</span>
                        {getSortIcon('changeTotal')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('percentChange')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>% Change</span>
                        {getSortIcon('percentChange')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAgeGroupData
                    .map((row) => (
                    <tr key={row.ageGroup} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.ageGroup}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{row.system2025Total}</span>
                          <span className="text-xs text-gray-600">
                            {formatGenderBreakdown(row.system2025Men, row.system2025Women, row.ageGroup)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{row.system2026Total}</span>
                          <span className="text-xs text-gray-600">
                            {formatGenderBreakdown(row.system2026Men, row.system2026Women, row.ageGroup)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                          {row.system2025Total > 0 && (
                            <span className={`text-xs ${
                              row.changeTotal > 0 ? 'text-green-600' : 
                              row.changeTotal < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              ({row.changeTotal > 0 ? '+' : ''}{((row.changeTotal / row.system2025Total) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'qualifying-times' ? (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Time Changes by Age Group
            </h3>
            <p className="text-gray-600 mb-6">
              How qualifying time requirements change between 2025 and 2026 systems by age group
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('participants')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Participants</span>
                        {getSortIcon('participants')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('system2025Time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>2025 Cutoff Time</span>
                        {getSortIcon('system2025Time')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('system2026Time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>2026 Cutoff Time (Age-Graded)</span>
                        {getSortIcon('system2026Time')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('timeChange')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Time Change</span>
                        {getSortIcon('timeChange')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('timePercentChange')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Time Change %</span>
                        {getSortIcon('timePercentChange')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedQualificationTimesData.map((row) => (
                    <tr key={row.ageGroup} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.ageGroup}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.participants}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.system2025Time ? formatTime(row.system2025Time) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.system2026Time ? formatTime(row.system2026Time) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Individual Athlete Results
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('place')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Place</span>
                        {getSortIcon('place')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('raw_time_seconds')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Finish Time</span>
                        {getSortIcon('raw_time_seconds')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('age_graded_time_seconds')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Age Graded</span>
                        {getSortIcon('age_graded_time_seconds')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2025 Qualified
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2026 Qualified
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAthleteData.map((athlete, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {athlete.place}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {athlete.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {athlete.age_group}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(athlete.raw_time_seconds)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(athlete.age_graded_time_seconds)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {athlete.qualified_2025 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {athlete.qualified_2026 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedAthleteData.length)}</span> of{' '}
                      <span className="font-medium">{sortedAthleteData.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}