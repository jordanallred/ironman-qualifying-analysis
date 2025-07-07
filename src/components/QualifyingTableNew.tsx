'use client';

import { useState } from 'react';
import { Tabs, TabsList, Tab, TabsContent } from '@/components/ui';
import SlotChangesTable from './SlotChangesTable';
import TimeChangesTable from './TimeChangesTable';
import AthleteResultsTable from './AthleteResultsTable';

interface QualifyingTableProps {
  analysis: {
    race_name: string;
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
  };
}

export default function QualifyingTableNew({ analysis }: QualifyingTableProps) {
  const [activeTab, setActiveTab] = useState<'age-groups' | 'qualifying-times' | 'athletes'>('age-groups');

  // Prepare age group data for slot changes
  const ageGroupData = Object.entries(analysis.age_group_analysis).map(([ageGroup, data]) => {
    const system2025Total = data.system_2025?.total || 0;
    const system2026Total = data.system_2026?.total || 0;
    const changeTotal = system2026Total - system2025Total;
    
    return {
      ageGroup,
      system2025Men: data.system_2025?.men || 0,
      system2025Women: data.system_2025?.women || 0,
      system2025Total,
      system2026Men: data.system_2026?.men || 0,
      system2026Women: data.system_2026?.women || 0,
      system2026Total,
      changeMen: (data.system_2026?.men || 0) - (data.system_2025?.men || 0),
      changeWomen: (data.system_2026?.women || 0) - (data.system_2025?.women || 0),
      changeTotal,
      percentChange: system2025Total > 0 ? ((changeTotal / system2025Total) * 100) : 0,
    };
  });

  // Prepare qualification times data
  const qualificationTimesData = Object.entries(analysis.age_group_analysis).map(([ageGroup, data]) => {
    const system2025QualifyingTimes = data.system_2025?.qualifying_times || {};
    const system2026QualifyingTimes = data.system_2026?.qualifying_times || {};
    const system2025Time = system2025QualifyingTimes.cutoff_time_seconds || null;
    const system2026Time = system2026QualifyingTimes.cutoff_time_seconds || null;
    const timeChange = system2025Time && system2026Time ? system2026Time - system2025Time : null;
    const timePercentChange = system2025Time && system2026Time ? ((timeChange / system2025Time) * 100) : null;
    
    return {
      ageGroup,
      participants: data.participants || 0,
      system2025Time,
      system2026Time,
      timeChange,
      timePercentChange,
    };
  });

  return (
    <Tabs>
      <TabsList>
        <Tab
          isActive={activeTab === 'age-groups'}
          onClick={() => setActiveTab('age-groups')}
        >
          Slot Changes by Age Group
        </Tab>
        <Tab
          isActive={activeTab === 'qualifying-times'}
          onClick={() => setActiveTab('qualifying-times')}
        >
          Time Changes by Age Group
        </Tab>
        {analysis.detailed_results && (
          <Tab
            isActive={activeTab === 'athletes'}
            onClick={() => setActiveTab('athletes')}
          >
            Athlete Results ({analysis.detailed_results.length})
          </Tab>
        )}
      </TabsList>

      <TabsContent>
        {activeTab === 'age-groups' && (
          <SlotChangesTable data={ageGroupData} />
        )}
        
        {activeTab === 'qualifying-times' && (
          <TimeChangesTable data={qualificationTimesData} />
        )}
        
        {activeTab === 'athletes' && analysis.detailed_results && (
          <AthleteResultsTable data={analysis.detailed_results} />
        )}
      </TabsContent>
    </Tabs>
  );
}