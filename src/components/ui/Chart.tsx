'use client';

import { useRef, ReactNode } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { Card, CardContent } from './Card';
import { Heading, Text } from './Typography';

// Register all Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Chart type definitions
export type ChartType = 'bar' | 'line' | 'doughnut' | 'pie';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    [key: string]: any;
  }>;
}

export interface ChartWrapperProps {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions<any>;
  title?: string;
  subtitle?: string;
  description?: string;
  height?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  children?: ReactNode;
}

// Common chart configuration defaults
const getDefaultOptions = (type: ChartType): ChartOptions<any> => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
  };

  switch (type) {
    case 'bar':
    case 'line':
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            beginAtZero: true,
          },
        },
      };
    case 'doughnut':
    case 'pie':
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            position: 'bottom' as const,
          },
        },
      };
    default:
      return baseOptions;
  }
};

// Chart component renderers
const ChartComponents = {
  bar: Bar,
  line: Line,
  doughnut: Doughnut,
  pie: Pie,
};

export function Chart({
  type,
  data,
  options,
  title,
  subtitle,
  description,
  height = 'h-64 sm:h-80 lg:h-96',
  loading = false,
  error,
  className = '',
  children,
}: ChartWrapperProps) {
  const chartRef = useRef<ChartJS | null>(null);
  
  const ChartComponent = ChartComponents[type];
  const mergedOptions = {
    ...getDefaultOptions(type),
    ...options,
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          {title && <Heading level={3} className="mb-4">{title}</Heading>}
          <div className={`${height} flex items-center justify-center bg-gray-50 rounded-lg`}>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <Text variant="caption" className="text-gray-600">Loading chart...</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          {title && <Heading level={3} className="mb-4">{title}</Heading>}
          <div className={`${height} flex items-center justify-center bg-red-50 rounded-lg border border-red-200`}>
            <div className="text-center">
              <Text className="text-red-600 font-medium">Failed to load chart</Text>
              <Text variant="caption" className="text-red-500 mt-1">{error}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <Heading level={3} className="mb-2">{title}</Heading>}
            {subtitle && <Text variant="caption" className="text-gray-600">{subtitle}</Text>}
          </div>
        )}

        {/* Chart */}
        <div className={height}>
          <ChartComponent 
            ref={chartRef}
            data={data} 
            options={mergedOptions} 
          />
        </div>

        {/* Description */}
        {description && (
          <div className="mt-4">
            <Text variant="caption" className="text-gray-600">
              {description}
            </Text>
          </div>
        )}

        {/* Additional content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility functions for common chart configurations
export const chartColors = {
  blue: {
    primary: 'rgba(59, 130, 246, 0.8)',
    secondary: 'rgba(59, 130, 246, 0.6)',
    border: 'rgba(59, 130, 246, 1)',
  },
  green: {
    primary: 'rgba(16, 185, 129, 0.8)',
    secondary: 'rgba(16, 185, 129, 0.6)',
    border: 'rgba(16, 185, 129, 1)',
  },
  red: {
    primary: 'rgba(239, 68, 68, 0.8)',
    secondary: 'rgba(239, 68, 68, 0.6)',
    border: 'rgba(239, 68, 68, 1)',
  },
  purple: {
    primary: 'rgba(147, 51, 234, 0.8)',
    secondary: 'rgba(147, 51, 234, 0.6)',
    border: 'rgba(147, 51, 234, 1)',
  },
  pink: {
    primary: 'rgba(236, 72, 153, 0.8)',
    secondary: 'rgba(236, 72, 153, 0.6)',
    border: 'rgba(236, 72, 153, 1)',
  },
  gray: {
    primary: 'rgba(156, 163, 175, 0.8)',
    secondary: 'rgba(156, 163, 175, 0.6)',
    border: 'rgba(156, 163, 175, 1)',
  },
};

export const createChangeColorMapper = (values: number[]) => {
  return values.map(value => 
    value > 0 ? chartColors.green.secondary :
    value < 0 ? chartColors.red.secondary :
    chartColors.gray.secondary
  );
};

export const createChangeBorderColorMapper = (values: number[]) => {
  return values.map(value => 
    value > 0 ? chartColors.green.border :
    value < 0 ? chartColors.red.border :
    chartColors.gray.border
  );
};

export const formatChangeTooltip = (context: TooltipItem<any>, additionalInfo?: any) => {
  const value = context.parsed.y;
  const change = value > 0 ? `+${value}` : `${value}`;
  
  if (additionalInfo) {
    return `${change} (${additionalInfo})`;
  }
  
  return `Change: ${change}`;
};

export default Chart;