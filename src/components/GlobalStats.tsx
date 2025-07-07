import { Card, CardContent, Heading, Text } from '@/components/ui';

interface GlobalStatsProps {
  summary: {
    totalRaces: number;
    fullDistanceRaces: number;
    race703Count: number;
    totalSlots: number;
    racesWithData: number;
    totalQualifiers2025?: number;
    totalQualifiers2026?: number;
    netSlotChange?: number;
  };
}

export default function GlobalStats({ summary }: GlobalStatsProps) {
  // Calculate the difference and percentage change
  const netChange = summary.netSlotChange || 0;
  const changePercentage = summary.totalQualifiers2025 
    ? Math.round(((summary.totalQualifiers2026 || 0) - summary.totalQualifiers2025) / summary.totalQualifiers2025 * 100)
    : 0;
  
  const stats = [
    {
      label: 'Races Analyzed',
      value: summary.racesWithData,
      description: 'Qualifying races with complete data and analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'System Impact',
      value: netChange > 0 ? `+${netChange.toLocaleString()}` : netChange.toLocaleString(),
      description: `Net change in qualifying opportunities (${changePercentage > 0 ? '+' : ''}${changePercentage}%)`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={netChange >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
        </svg>
      ),
      textColor: netChange > 0 ? 'text-emerald-600' : netChange < 0 ? 'text-red-500' : 'text-gray-600'
    },
    {
      label: 'Kona Slots Available',
      value: summary.totalSlots.toLocaleString(),
      description: 'Total qualifying opportunities across all races',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {stats.map((stat, index) => (
        <Card key={index} variant="interactive">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600">
                {stat.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold mb-2 ${stat.textColor || 'text-gray-900'}`}>
              {stat.value}
            </div>
            <Heading level={5} className="mb-1">
              {stat.label}
            </Heading>
            <Text variant="caption" className="leading-relaxed">
              {stat.description}
            </Text>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}