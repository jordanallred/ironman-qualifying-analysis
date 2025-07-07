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
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GlobalQualifyingChartProps {
  trendsData: {
    ageGroupTrends: Array<{
      ageGroup: string;
      slots2025: number;
      slots2026: number;
      difference: number;
      percentageChange: number;
    }>;
  } | null;
}

export default function GlobalQualifyingChart({ trendsData }: GlobalQualifyingChartProps) {
  if (!trendsData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading slots analysis...</div>
        </div>
      </div>
    );
  }
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  // Prepare age group data
  const ageGroups = trendsData.ageGroupTrends.map(ag => ag.ageGroup).sort();
  
  // Calculate slot changes for each age group (2026 - 2025)
  const slotChanges = ageGroups.map(agName => {
    const agData = trendsData.ageGroupTrends.find(ag => ag.ageGroup === agName);
    return agData ? agData.difference : 0;
  });

  const data = {
    labels: ageGroups,
    datasets: [
      {
        label: 'Slot Changes (2026 vs 2025)',
        data: slotChanges,
        backgroundColor: slotChanges.map(change => 
          change > 0 ? 'rgba(16, 185, 129, 0.6)' : 
          change < 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(156, 163, 175, 0.6)'
        ),
        borderColor: slotChanges.map(change => 
          change > 0 ? 'rgba(16, 185, 129, 1)' : 
          change < 0 ? 'rgba(239, 68, 68, 1)' : 'rgba(156, 163, 175, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Slot Changes by Age Group (2026 vs 2025 System)',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const ageGroup = context.label;
            
            if (value > 0) {
              return `${ageGroup}: +${value} slots`;
            } else if (value < 0) {
              return `${ageGroup}: ${value} slots`;
            } else {
              return `${ageGroup}: No change`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Age Groups',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Slot Change',
          font: {
            weight: 'bold',
          },
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div style={{ height: '500px' }}>
        <Bar ref={chartRef} data={data} options={options} />
      </div>
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {trendsData.ageGroupTrends.filter(ag => ag.difference > 0).length}
          </div>
          <div className="text-sm text-gray-600">Age Groups Gaining</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {trendsData.ageGroupTrends.filter(ag => ag.difference === 0).length}
          </div>
          <div className="text-sm text-gray-600">Age Groups Unchanged</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {trendsData.ageGroupTrends.filter(ag => ag.difference < 0).length}
          </div>
          <div className="text-sm text-gray-600">Age Groups Losing</div>
        </div>
      </div>
    </div>
  );
}