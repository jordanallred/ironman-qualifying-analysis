'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface GlobalQualifyingTimesChartProps {
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

export default function GlobalQualifyingTimesChart({ trendsData }: GlobalQualifyingTimesChartProps) {
  if (!trendsData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading time analysis...</div>
        </div>
      </div>
    );
  }

  // Prepare qualifying times data
  const ageGroups = trendsData.ageGroupTrends.map(ag => ag.ageGroup).sort();
  
  // Simulate average qualifying times based on historical data patterns
  const times2025 = ageGroups.map(ag => {
    const [minAge] = ag.split('-').map(Number);
    const baseHours = 8.5; // Base time in hours
    const ageFactor = Math.max(0, (minAge - 25)) * 0.1; // Slower as age increases
    return baseHours + ageFactor + (Math.random() * 0.5 - 0.25); // Add variance
  });
  
  const times2026 = ageGroups.map((ag, index) => {
    // 2026 system typically has slightly different times due to age-grading
    return times2025[index] - 0.1 + (Math.random() * 0.2 - 0.1);
  });

  // Calculate time differences for the bar chart
  const timeDifferences = times2026.map((time2026, index) => {
    const diff = (time2026 - times2025[index]) * 60; // Convert to minutes
    return Math.round(diff);
  });

  // Format time for display (convert hours to HH:MM:SS)
  const formatTime = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const chartData = {
    labels: ageGroups,
    datasets: [
      {
        label: '2025 Qualifying Time',
        data: times2025,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: '2026 Qualifying Time',
        data: times2026,
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
    ],
  };

  const timeDiffChartData = {
    labels: ageGroups,
    datasets: [
      {
        label: 'Time Change (minutes)',
        data: timeDifferences,
        backgroundColor: timeDifferences.map(diff => diff > 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
        borderColor: timeDifferences.map(diff => diff > 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'),
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Qualifying Time Cutoffs by Age Group - Global Average`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const hours = context.parsed.y;
            return `${context.dataset.label}: ${formatTime(hours)}`;
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
          text: 'Time (hours)'
        },
        ticks: {
          callback: function(value) {
            return formatTime(Number(value));
          }
        }
      },
    },
  };

  const timeDiffOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Time Requirement Changes (2026 vs 2025)',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return value > 0 ? `+${value} minutes easier` : `${Math.abs(value)} minutes harder`;
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
          text: 'Change (minutes)'
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div style={{ height: '400px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div style={{ height: '400px' }}>
          <Bar data={timeDiffChartData} options={timeDiffOptions} />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These are simulated average qualifying times based on typical age group performance patterns. 
          In production, this would show actual average cutoff times calculated from race results across all qualifying races.
        </p>
      </div>
    </div>
  );
}