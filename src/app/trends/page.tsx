'use client';

import { useState, useEffect } from 'react';
import AnalysisPageTemplate from '@/components/AnalysisPageTemplate';
import QualifyingChart from '@/components/QualifyingChart';
import QualifyingTimesChart from '@/components/QualifyingTimesChart';
import QualifyingTable from '@/components/QualifyingTable';
import System2026Explanation from '@/components/System2026Explanation';

interface TrendsData {
  overallTrends: {
    totalRaces: number;
    totalParticipants: number;
    totalMenParticipants: number;
    totalWomenParticipants: number;
    totalSlots: number;
    genderDistribution: {
      menPercentage: number;
      womenPercentage: number;
    };
    system2025: {
      totalQualified: number;
      menQualified: number;
      womenQualified: number;
      menPercentage: number;
      womenPercentage: number;
    };
    system2026: {
      totalQualified: number;
      menQualified: number;
      womenQualified: number;
      menPercentage: number;
      womenPercentage: number;
    };
    changes: {
      menDifference: number;
      womenDifference: number;
      totalDifference: number;
    };
  };
  raceDistanceBreakdown: {
    full: { count: number; participants: number; slots: number };
  };
  ageGroupTrends: Array<{
    ageGroup: string;
    slots2025: number;
    slots2026: number;
    difference: number;
    percentageChange: number;
    avgTime2025?: number | null;
    avgTime2026?: number | null;
  }>;
  topWinners: Array<{
    ageGroup: string;
    difference: number;
  }>;
  topLosers: Array<{
    ageGroup: string;
    difference: number;
  }>;
  lastUpdated: string;
}

export default function TrendsPage() {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendsData();
  }, []);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/trends');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trends data');
      }
      
      setTrendsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trends data');
    } finally {
      setLoading(false);
    }
  };

  // Convert trends data to same format as race analysis
  const analysisData = trendsData ? {
    race_name: 'Global Qualifying Trends Analysis',
    total_participants: trendsData.overallTrends.totalParticipants,
    men_participants: trendsData.overallTrends.totalMenParticipants,
    women_participants: trendsData.overallTrends.totalWomenParticipants,
    system_2025: {
      total_qualified: trendsData.overallTrends.system2025.totalQualified,
      men_qualified: trendsData.overallTrends.system2025.menQualified,
      women_qualified: trendsData.overallTrends.system2025.womenQualified,
    },
    system_2026: {
      total_qualified: trendsData.overallTrends.system2026.totalQualified,
      men_qualified: trendsData.overallTrends.system2026.menQualified,
      women_qualified: trendsData.overallTrends.system2026.womenQualified,
    },
    changes: {
      men_difference: trendsData.overallTrends.changes.menDifference,
      women_difference: trendsData.overallTrends.changes.womenDifference,
    },
    age_group_analysis: trendsData.ageGroupTrends.reduce((acc, ag) => {
      acc[ag.ageGroup] = {
        system_2025: { 
          total: ag.slots2025,
          qualifying_times: ag.avgTime2025 ? { cutoff_time_seconds: ag.avgTime2025 } : null
        },
        system_2026: { 
          total: ag.slots2026,
          qualifying_times: ag.avgTime2026 ? { cutoff_time_seconds: ag.avgTime2026 } : null
        },
        difference: { total: ag.difference }
      };
      return acc;
    }, {} as Record<string, any>)
  } : null;

  const templateData = analysisData ? {
    title: 'Global Qualifying Trends Analysis',
    breadcrumb: 'Global Trends',
    totalParticipants: analysisData.total_participants,
    menParticipants: analysisData.men_participants,
    womenParticipants: analysisData.women_participants,
    system2025: {
      totalQualified: analysisData.system_2025.total_qualified,
      menQualified: analysisData.system_2025.men_qualified,
      womenQualified: analysisData.system_2025.women_qualified,
    },
    system2026: {
      totalQualified: analysisData.system_2026.total_qualified,
      menQualified: analysisData.system_2026.men_qualified,
      womenQualified: analysisData.system_2026.women_qualified,
    },
  } : null;

  return (
    <AnalysisPageTemplate
      data={templateData}
      loading={loading}
      error={error}
      onRetry={fetchTrendsData}
      slotsView={<QualifyingChart analysis={analysisData} />}
      timeView={<QualifyingTimesChart analysis={analysisData} />}
      detailedView={
        <div className="space-y-8">
          <QualifyingTable analysis={analysisData} />
          <System2026Explanation />
        </div>
      }
    />
  );
}