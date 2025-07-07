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

interface QualifyingChartProps {
  analysis: {
    race_name: string;
    system_2025: {
      men_qualified: number;
      women_qualified: number;
    };
    system_2026: {
      men_qualified: number;
      women_qualified: number;
    };
    age_group_analysis: Record<string, any>;
  };
}

export default function QualifyingChart({ analysis }: QualifyingChartProps) {
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  // Prepare age group data
  const ageGroups = Object.keys(analysis.age_group_analysis).sort();
  
  // Calculate slot changes for each age group (2026 - 2025)
  const slotChanges = ageGroups.map(ag => {
    const total2025 = (analysis.age_group_analysis[ag]?.system_2025?.total || 0);
    const total2026 = (analysis.age_group_analysis[ag]?.system_2026?.total || 0);
    return total2026 - total2025;
  });

  const chartData = {
    labels: ageGroups,
    datasets: [
      {
        label: 'Slot Change',
        data: slotChanges,
        backgroundColor: slotChanges.map(change => change > 0 ? 'rgba(16, 185, 129, 0.6)' : change < 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(156, 163, 175, 0.6)'),
        borderColor: slotChanges.map(change => change > 0 ? 'rgba(16, 185, 129, 1)' : change < 0 ? 'rgba(239, 68, 68, 1)' : 'rgba(156, 163, 175, 1)'),
        borderWidth: 2,
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
        text: 'Qualifying Slot Changes: 2026 vs 2025 System',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const change = context.parsed.y;
            const ageGroup = context.label;
            const total2025 = analysis.age_group_analysis[ageGroup]?.system_2025?.total || 0;
            const total2026 = analysis.age_group_analysis[ageGroup]?.system_2026?.total || 0;
            
            const percentChange = total2025 > 0 ? ((change / total2025) * 100).toFixed(1) : '0.0';
            
            if (change > 0) {
              return `+${change} slots (+${percentChange}%) • ${total2025} → ${total2026}`;
            } else if (change < 0) {
              return `${change} slots (${percentChange}%) • ${total2025} → ${total2026}`;
            } else {
              return `No change (${total2025} slots)`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Age Groups'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        title: {
          display: true,
          text: 'Slot Change'
        },
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            const val = Number(value);
            return val > 0 ? `+${val}` : `${val}`;
          }
        }
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Slot Changes Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualifying Slot Changes by Age Group</h3>
        
        <div className="h-64 sm:h-80 lg:h-96 mb-4">
          <Bar data={chartData} options={options} />
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Chart shows:</strong> How many slots each age group gains (green) or loses (red) in the 2026 system compared to 2025.
            Measured in number of slots difference.
          </p>
        </div>
      </div>
    </div>
  );
}