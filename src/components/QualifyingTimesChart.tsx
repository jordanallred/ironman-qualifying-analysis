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

interface QualifyingTimesChartProps {
  analysis: {
    race_name: string;
    age_group_analysis: Record<string, any>;
  };
}

export default function QualifyingTimesChart({ analysis }: QualifyingTimesChartProps) {
  // Prepare qualifying times data
  const ageGroups = Object.keys(analysis.age_group_analysis).sort();
  
  const times2025 = ageGroups.map(ag => {
    const cutoffSeconds = analysis.age_group_analysis[ag]?.system_2025?.qualifying_times?.cutoff_time_seconds;
    return cutoffSeconds ? cutoffSeconds / 3600 : null; // Convert to hours
  });
  
  const times2026 = ageGroups.map(ag => {
    const cutoffSeconds = analysis.age_group_analysis[ag]?.system_2026?.qualifying_times?.cutoff_time_seconds;
    return cutoffSeconds ? cutoffSeconds / 3600 : null; // Convert to hours
  });

  // Filter out null values and their corresponding age groups
  const validData = ageGroups.map((ag, index) => ({
    ageGroup: ag,
    time2025: times2025[index],
    time2026: times2026[index]
  })).filter(item => item.time2025 !== null && item.time2026 !== null);

  const validAgeGroups = validData.map(item => item.ageGroup);
  const validTimes2025 = validData.map(item => item.time2025);
  const validTimes2026 = validData.map(item => item.time2026);

  // Format time for display (convert hours back to HH:MM:SS)
  const formatTime = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const chartData = {
    labels: validAgeGroups,
    datasets: [
      {
        label: '2025 Qualifying Time',
        data: validTimes2025,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: '2026 Qualifying Time',
        data: validTimes2026,
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
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
        text: `Qualifying Time Cutoffs by Age Group - ${analysis.race_name}`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const hours = context.parsed.y;
            const timeString = formatTime(hours);
            return `${label}: ${timeString}`;
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
          text: 'Qualifying Time (Hours)'
        },
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatTime(Number(value));
          }
        }
      },
    },
  };

  // Line chart for time trends
  const lineData = {
    labels: validAgeGroups,
    datasets: [
      {
        label: '2025 Qualifying Time',
        data: validTimes2025,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
      },
      {
        label: '2026 Qualifying Time',
        data: validTimes2026,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Qualifying Time Trends Across Age Groups',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const hours = context.parsed.y;
            const timeString = formatTime(hours);
            return `${label}: ${timeString}`;
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
          text: 'Qualifying Time (Hours)'
        },
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatTime(Number(value));
          }
        }
      },
    },
  };

  // Time differences data for bar chart
  const timeDifferences = validData.map(item => {
    // Convert to minutes difference (2026 - 2025)
    const diffMinutes = (item.time2026! - item.time2025!) * 60;
    return diffMinutes;
  });

  const timeDiffChartData = {
    labels: validAgeGroups,
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

  const timeDiffOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Time Requirement Changes: 2026 vs 2025 System',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const minutes = context.parsed.y;
            const absMinutes = Math.abs(minutes);
            if (minutes > 0) {
              return `${absMinutes.toFixed(1)} minutes slower in 2026`;
            } else {
              return `${absMinutes.toFixed(1)} minutes faster in 2026`;
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
          text: 'Time Difference (Minutes)'
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

  if (validData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Qualifying Times Available</h3>
          <p className="text-gray-600">Qualifying time data is not available for this race.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Time Differences Bar Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Requirement Changes (2026 vs 2025)</h3>
        
        <div className="h-64 sm:h-80 lg:h-96 mb-4">
          <Bar data={timeDiffChartData} options={timeDiffOptions} />
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Chart shows:</strong> How much faster (negative/red) or slower (positive/green) the 2026 qualifying times are compared to 2025.
            Measured in minutes difference.
          </p>
        </div>
      </div>
    </div>
  );
}