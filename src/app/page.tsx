'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RaceCard from '@/components/RaceCard';
import GlobalStats from '@/components/GlobalStats';
import { 
  Container, 
  Section, 
  SearchInput, 
  Button, 
  LoadingSpinner, 
  ErrorState,
  Heading,
  Text,
  SkeletonCard,
  SkeletonStatCard
} from '@/components/ui';

interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  distance: string;
  totalSlots: number;
  menSlots: number | null;
  womenSlots: number | null;
  hasResults: boolean;
  hasAnalysis: boolean;
  participantCount?: number;
}

interface RacesResponse {
  races: Race[];
  summary: {
    totalRaces: number;
    fullDistanceRaces: number;
    race703Count: number;
    totalSlots: number;
    racesWithData: number;
  };
}

export default function HomePage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<Race[]>([]);
  const [summary, setSummary] = useState<RacesResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRaces();
  }, []);

  // Filter races based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRaces(races);
    } else {
      const filtered = races.filter(race =>
        race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        race.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRaces(filtered);
    }
  }, [races, searchQuery]);

  const fetchRaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/races');
      
      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }
      
      const data: RacesResponse = await response.json();
      setRaces(data.races);
      setFilteredRaces(data.races);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch races');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Section Skeleton */}
        <Section background="gradient" padding="lg">
          <Container>
            <div className="text-center max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-12 bg-white bg-opacity-20 rounded-lg mx-auto w-96 animate-pulse" />
                  <div className="h-6 bg-white bg-opacity-20 rounded-lg mx-auto w-80 animate-pulse" />
                </div>
                <div className="h-4 bg-white bg-opacity-20 rounded-lg mx-auto w-96 animate-pulse" />
              </div>
              
              {/* Global Stats Skeleton */}
              <div className="mt-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Main Content Skeleton */}
        <Section padding="lg">
          <Container>
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6">
                <div>
                  <div className="h-8 bg-gray-200 rounded-lg w-48 mb-3 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded-lg w-72 animate-pulse" />
                </div>
                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
              </div>
              <div className="h-10 bg-gray-200 rounded-lg max-w-xl animate-pulse" />
            </div>

            {/* Race Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Container size="sm">
          <ErrorState
            title="Unable to load data"
            message={error}
            onRetry={fetchRaces}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <Section background="gradient" padding="lg">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="space-y-4">
                <Heading level={1}>
                  Ironman World Championship
                </Heading>
                <Heading level={4} className="text-gray-600 font-medium">
                  2025 vs 2026 Qualifying System Analysis
                </Heading>
              </div>
              
              <Text variant="lead" className="max-w-2xl mx-auto">
                Compare how the new 2026 qualifying system reshapes slot allocation across all races and age groups
              </Text>
            </div>
            
            {summary && (
              <div className="mt-12">
                <GlobalStats summary={summary} />
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Main Content */}
      <Section padding="lg">
        <Container>
          {/* Race Discovery Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6">
              <div>
                <Heading level={2} className="mb-3">
                  Qualifying Races
                </Heading>
                <Text variant="muted">
                  Explore race-by-race impacts of the 2026 system changes
                </Text>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {summary && summary.racesWithData > 0 && (
                  <Link href="/trends">
                    <Button variant="primary">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Global Trends
                    </Button>
                  </Link>
                )}
                <Text variant="caption">
                  {filteredRaces.length} of {races.length} races
                </Text>
              </div>
            </div>
            
            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search races by name or location..."
              className="max-w-xl"
            />
          </div>

          {/* Race Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRaces.length > 0 ? (
              filteredRaces.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))
            ) : races.length > 0 ? (
              <div className="col-span-full text-center py-16">
                <Heading level={3} className="mb-3">
                  No races found
                </Heading>
                <Text variant="muted" className="mb-6">
                  No races match your search "{searchQuery}". Try a different search term.
                </Text>
                <Button variant="ghost" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="col-span-full text-center py-16">
                <Heading level={3} className="mb-3">
                  No races available
                </Heading>
                <Text variant="muted">
                  Loading race data...
                </Text>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Disclaimer */}
      <Section background="gray" padding="lg">
        <Container>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <Heading level={5} className="text-amber-800 mb-2">
                  Preliminary Analysis - 2025-2026 Season
                </Heading>
                <Text className="text-amber-700">
                  This analysis includes only races that have received confirmed slot allocations for the 2026 qualifying system. 
                  Many races scheduled for 2026 have not yet received their slot allocations and are therefore not included in this preliminary comparison.
                </Text>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}