'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import AnalysisPageTemplate from '@/components/AnalysisPageTemplate';
import QualifyingChart from '@/components/QualifyingChart';
import QualifyingTableNew from '@/components/QualifyingTableNew';
import QualifyingTimesChart from '@/components/QualifyingTimesChart';
import AgeGroupAnalysis from '@/components/AgeGroupAnalysis';
import System2026Explanation from '@/components/System2026Explanation';

interface RaceAnalysis {
  race_name: string;
  total_participants: number;
  men_participants: number;
  women_participants: number;
  total_slots: number;
  system_2025: {
    men_qualified: number;
    women_qualified: number;
    total_qualified: number;
  };
  system_2026: {
    men_qualified: number;
    women_qualified: number;
    total_qualified: number;
  };
  changes: {
    men_difference: number;
    women_difference: number;
  };
  age_group_analysis: Record<string, any>;
  detailed_results?: Array<{
    place: number;
    name: string;
    age_group: string;
    raw_time_seconds: number;
    age_graded_time_seconds: number;
    qualified_2025?: boolean;
    qualified_2026?: boolean;
  }>;
}

export default function RaceDetailPage() {
  const params = useParams();
  const raceId = params.id as string;
  
  const [analysis, setAnalysis] = useState<RaceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (raceId) {
      fetchRaceAnalysis();
    }
  }, [raceId]);

  const fetchRaceAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/races/${raceId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch race analysis');
      }
      
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load race analysis');
    } finally {
      setLoading(false);
    }
  };

  const templateData = analysis ? {
    title: analysis.race_name,
    breadcrumb: analysis.race_name,
    totalParticipants: analysis.total_participants,
    menParticipants: analysis.men_participants,
    womenParticipants: analysis.women_participants,
    system2025: {
      totalQualified: analysis.system_2025.total_qualified,
      menQualified: analysis.system_2025.men_qualified,
      womenQualified: analysis.system_2025.women_qualified,
    },
    system2026: {
      totalQualified: analysis.system_2026.total_qualified,
      menQualified: analysis.system_2026.men_qualified,
      womenQualified: analysis.system_2026.women_qualified,
    },
  } : null;

  return (
    <>
      {analysis && (
        <Head>
          <title>{`${analysis.race_name} | Kona Qualifying Analysis`}</title>
          <meta name="description" content={`Detailed analysis of ${analysis.race_name} comparing 2025 vs 2026 Kona qualifying systems. ${analysis.total_participants} participants, ${analysis.system_2025.total_qualified} vs ${analysis.system_2026.total_qualified} slots.`} />
          <meta property="og:title" content={`${analysis.race_name} | Kona Qualifying Analysis`} />
          <meta property="og:description" content={`Detailed analysis of ${analysis.race_name} comparing 2025 vs 2026 Kona qualifying systems.`} />
          <meta name="twitter:title" content={`${analysis.race_name} | Kona Qualifying Analysis`} />
          <meta name="twitter:description" content={`Detailed analysis of ${analysis.race_name} comparing 2025 vs 2026 Kona qualifying systems.`} />
        </Head>
      )}
      <AnalysisPageTemplate
      data={templateData}
      loading={loading}
      error={error}
      onRetry={fetchRaceAnalysis}
      slotsView={<QualifyingChart analysis={analysis} />}
      timeView={<QualifyingTimesChart analysis={analysis} />}
      detailedView={
        <div className="space-y-8">
          <QualifyingTableNew analysis={analysis} />
          <System2026Explanation />
        </div>
      }
    />
    </>
  );
}