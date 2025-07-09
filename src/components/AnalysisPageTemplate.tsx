'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Container, 
  Section, 
  Button, 
  LoadingSpinner, 
  ErrorState,
  Heading,
  Text,
  Card,
  CardContent,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonChart
} from '@/components/ui';

interface AnalysisData {
  title: string;
  breadcrumb: string;
  totalParticipants: number;
  menParticipants: number;
  womenParticipants: number;
  system2025: {
    totalQualified: number;
    menQualified: number;
    womenQualified: number;
  };
  system2026: {
    totalQualified: number;
    menQualified: number;
    womenQualified: number;
  };
}

interface AnalysisPageTemplateProps {
  data: AnalysisData;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  slotsView: React.ReactNode;
  timeView: React.ReactNode;
  detailedView: React.ReactNode;
}

export default function AnalysisPageTemplate({
  data,
  loading,
  error,
  onRetry,
  slotsView,
  timeView,
  detailedView
}: AnalysisPageTemplateProps) {
  const [viewMode, setViewMode] = useState<'slots' | 'time' | 'detailed'>('slots');

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Section Skeleton */}
        <Section background="gradient" padding="md">
          <Container>
            <nav className="flex items-center space-x-2 text-sm mb-3">
              <div className="h-4 w-16 bg-white bg-opacity-20 rounded animate-pulse" />
              <span className="text-white">/</span>
              <div className="h-4 w-32 bg-white bg-opacity-20 rounded animate-pulse" />
            </nav>
            <div className="h-8 w-64 bg-white bg-opacity-20 rounded animate-pulse" />
          </Container>
        </Section>

        {/* Sticky View Toggle Skeleton */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <Container>
            <div className="flex justify-center py-2">
              <div className="h-8 w-72 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </Container>
        </div>

        <Section padding="lg">
          <Container>
            {/* Key Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>

            {/* Main Content Skeleton */}
            <div className="space-y-8">
              <SkeletonChart />
              <SkeletonTable rows={8} cols={6} />
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
            title="Analysis Not Available"
            message={error}
            onRetry={onRetry}
            actions={
              <Link href="/">
                <Button variant="secondary">
                  Back to Dashboard
                </Button>
              </Link>
            }
          />
        </Container>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <Section background="gradient" padding="md">
        <Container>
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{data.breadcrumb}</span>
          </nav>
          <Heading level={1} className="text-xl sm:text-2xl lg:text-3xl">
            {data.title}
          </Heading>
        </Container>
      </Section>

      {/* Sticky View Toggle */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <Container>
          <div className="flex justify-center py-2">
            <div className="flex bg-gray-100 rounded-md p-0.5 w-full max-w-sm">
              <button
                onClick={() => setViewMode('slots')}
                className={`flex-1 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  viewMode === 'slots'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Slots
              </button>
              <button
                onClick={() => setViewMode('time')}
                className={`flex-1 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  viewMode === 'time'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`flex-1 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Section padding="lg">
        <Container>
          {/* Key Stats */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 ${viewMode !== 'detailed' ? 'hidden lg:grid' : ''}`}>
            {/* Total Participants Card */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {data.totalParticipants.toLocaleString()}
                </div>
                <Text className="font-medium mb-1">Total Participants</Text>
                <Text variant="caption">
                  {data.menParticipants.toLocaleString()} men, {data.womenParticipants.toLocaleString()} women
                </Text>
              </CardContent>
            </Card>
            
            {/* 2025 System Card */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.system2025.totalQualified}
                </div>
                <Text className="font-medium mb-1">2025 System Qualifiers</Text>
                <Text variant="caption" className="mb-2">
                  {data.system2025.menQualified} men, {data.system2025.womenQualified} women
                </Text>
                <Text variant="caption" className="text-blue-600 font-medium">
                  Age group + proportional allocation
                </Text>
              </CardContent>
            </Card>
            
            {/* 2026 System Card */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {data.system2026.totalQualified}
                </div>
                <Text className="font-medium mb-1">2026 System Qualifiers</Text>
                <Text variant="caption" className="mb-2">
                  {data.system2026.menQualified} men, {data.system2026.womenQualified} women
                </Text>
                <Text variant="caption" className="text-emerald-600 font-medium">
                  Age group winners + performance pool
                </Text>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Organized Views */}
          {viewMode === 'slots' ? (
            slotsView
          ) : viewMode === 'time' ? (
            timeView
          ) : (
            detailedView
          )}
        </Container>
      </Section>
    </div>
  );
}