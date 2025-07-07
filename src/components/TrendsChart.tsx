'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TrendsChartProps {
  trendsData: {
    overallTrends: {
      system2025: {
        menQualified: number;
        womenQualified: number;
      };
      system2026: {
        menQualified: number;
        womenQualified: number;
      };
      genderDistribution: {
        menPercentage: number;
        womenPercentage: number;
      };
    };
    raceDistanceBreakdown: {
      full: { count: number; participants: number; slots: number };
    };
    ageGroupTrends: Array<{
      ageGroup: string;
      slots2025: number;
      slots2026: number;
      difference: number;
      percentageChange: number;
    }>;
  };
}

export default function TrendsChart({ trendsData }: TrendsChartProps) {
  // Gender distribution chart
  const genderDistributionData = {
    labels: ['Men', 'Women'],
    datasets: [
      {
        label: 'Participants',
        data: [
          trendsData.overallTrends.genderDistribution.menPercentage,
          trendsData.overallTrends.genderDistribution.womenPercentage
        ],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(236, 72, 153, 1)'],
        borderWidth: 2,
      },
    ],
  };

  // System comparison chart
  const systemComparisonData = {
    labels: ['Men', 'Women'],
    datasets: [
      {
        label: '2025 System',
        data: [
          trendsData.overallTrends.system2025.menQualified,
          trendsData.overallTrends.system2025.womenQualified
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: '2026 System',
        data: [
          trendsData.overallTrends.system2026.menQualified,
          trendsData.overallTrends.system2026.womenQualified
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Race distance breakdown - only showing full distance races
  const raceDistanceData = {
    labels: ['Full Distance'],
    datasets: [
      {
        label: 'Number of Races',
        data: [
          trendsData.raceDistanceBreakdown.full.count
        ],
        backgroundColor: ['rgba(147, 51, 234, 0.8)'],
        borderColor: ['rgba(147, 51, 234, 1)'],
        borderWidth: 2,
      },
    ],
  };

  // Age group changes (top 10 by absolute change)
  const topAgeGroupChanges = trendsData.ageGroupTrends
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 10);

  const ageGroupChangesData = {
    labels: topAgeGroupChanges.map(ag => ag.ageGroup),
    datasets: [
      {
        label: 'Slot Changes',
        data: topAgeGroupChanges.map(ag => ag.difference),
        backgroundColor: topAgeGroupChanges.map(ag => 
          ag.difference > 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
        ),
        borderColor: topAgeGroupChanges.map(ag => 
          ag.difference > 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}%`;
          }
        }
      }
    },
  };

  const ageGroupOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 10 Age Groups by Absolute Slot Changes',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const change = value > 0 ? `+${value}` : `${value}`;
            return `Change: ${change} slots`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Age Groups'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Slot Change'
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Gender and System Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Participant Gender Distribution</h3>
          <div className="h-64">
            <Doughnut data={genderDistributionData} options={doughnutOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Race Statistics</h3>
          <div className="h-64 flex flex-col justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {trendsData.raceDistanceBreakdown.full.count}
              </div>
              <div className="text-sm text-gray-600 mb-1">Full Distance Races</div>
              <div className="text-xs text-gray-500">
                {trendsData.raceDistanceBreakdown.full.participants.toLocaleString()} participants
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Comparison</h3>
          <div className="h-64">
            <Bar data={systemComparisonData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Age Group Changes Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="h-96">
          <Bar data={ageGroupChangesData} options={ageGroupOptions} />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Chart shows:</strong> The age groups with the largest absolute changes in qualifying slots 
            under the 2026 system. Green bars indicate gains, red bars indicate losses.
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {trendsData.ageGroupTrends.filter(ag => ag.difference > 0).length}
            </div>
            <div className="text-sm font-medium text-green-800">Age Groups Gaining Slots</div>
            <div className="text-xs text-green-600 mt-1">
              Total gained: +{trendsData.ageGroupTrends
                .filter(ag => ag.difference > 0)
                .reduce((sum, ag) => sum + ag.difference, 0)} slots
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-2">
              {trendsData.ageGroupTrends.filter(ag => ag.difference === 0).length}
            </div>
            <div className="text-sm font-medium text-gray-800">Age Groups Unchanged</div>
            <div className="text-xs text-gray-600 mt-1">
              Same slot allocation
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {trendsData.ageGroupTrends.filter(ag => ag.difference < 0).length}
            </div>
            <div className="text-sm font-medium text-red-800">Age Groups Losing Slots</div>
            <div className="text-xs text-red-600 mt-1">
              Total lost: {trendsData.ageGroupTrends
                .filter(ag => ag.difference < 0)
                .reduce((sum, ag) => sum + ag.difference, 0)} slots
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}