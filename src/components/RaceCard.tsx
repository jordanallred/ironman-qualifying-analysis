import Link from 'next/link';
import { Card, CardContent, Badge, Heading, Text } from '@/components/ui';

interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  distance: string;
  totalSlots: number;
  menSlots: number | null;
  womenSlots: number | null;
  totalSlots2026?: number;
  menSlots2026?: number | null;
  womenSlots2026?: number | null;
  hasResults: boolean;
  hasAnalysis: boolean;
  participantCount?: number;
  system2025Qualified?: number;
  system2026Qualified?: number;
  slotChange?: number | null;
}

interface RaceCardProps {
  race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = () => {
    if (!race.hasResults) {
      return <Badge variant="secondary">No Data Available</Badge>;
    }
    if (race.hasAnalysis) {
      return <Badge variant="success">✓ Analysis Complete</Badge>;
    }
    return null;
  };

  const MetricCard = ({ 
    label, 
    value, 
    variant = 'default' 
  }: { 
    label: string; 
    value: string | number; 
    variant?: 'default' | 'highlighted' 
  }) => (
    <div className={`rounded-lg p-4 ${
      variant === 'highlighted' 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100' 
        : 'bg-gray-50 border border-gray-200'
    }`}>
      <Text variant="caption" className="font-medium mb-1">
        {label}
      </Text>
      <div className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );

  const QualifyingImpact = () => {
    if (!race.hasAnalysis || !race.system2025Qualified || !race.system2026Qualified) {
      return (
        <MetricCard
          label="2025 System Allocation"
          value={race.totalSlots}
          variant="default"
        />
      );
    }

    const netChange = race.system2026Qualified - race.system2025Qualified;
    
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="2025 System"
            value={race.system2025Qualified}
          />
          <MetricCard
            label="2026 System"
            value={race.system2026Qualified}
          />
        </div>
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
          <Text variant="caption" className="font-medium">
            Net Impact
          </Text>
          <div className={`text-lg font-bold ${
            netChange > 0 ? 'text-green-600' : 
            netChange < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {netChange > 0 ? '+' : ''}{netChange}
          </div>
        </div>
      </div>
    );
  };

  const cardContent = (
    <Card 
      variant={race.hasAnalysis ? 'interactive' : 'default'}
      className="h-full"
    >
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <Heading level={4} className="mb-3 line-clamp-2" title={race.name}>
            {race.name}
          </Heading>
          <div className="space-y-1">
            <Text className="font-medium line-clamp-1" title={race.location}>
              {race.location}
            </Text>
            <Text variant="caption">
              {formatDate(race.date)}
            </Text>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex-1 space-y-4 mb-6">
          <QualifyingImpact />
          
          {race.participantCount && (
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <Text variant="caption" className="font-medium">
                Participants
              </Text>
              <Text className="font-bold">
                {race.participantCount.toLocaleString()}
              </Text>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {getStatusBadge()}
          
          {race.hasAnalysis ? (
            <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
              <Text variant="caption" className="font-medium">
                View Analysis
              </Text>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ) : (
            <Text variant="caption" className="text-gray-400">
              No analysis available
            </Text>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // If race has analysis, wrap in Link
  if (race.hasAnalysis) {
    return (
      <Link href={`/race/${race.id}`} className="group">
        {cardContent}
      </Link>
    );
  }

  // Otherwise, just return the card
  return cardContent;
}