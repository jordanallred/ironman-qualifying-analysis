import { PrismaClient } from '@prisma/client';

export interface RaceResult {
  place: string;
  name: string;
  age_group: string;
  gender: string;
  time: string;
  country: string;
}

export interface QualifyingAnalysis {
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
  age_group_analysis: Record<string, Record<string, any>>;
  detailed_results: Array<{
    place: number;
    name: string;
    age_group: string;
    raw_time_seconds: number;
    age_standard: number;
    age_graded_time_seconds: number;
    qualified_2025: boolean;
    qualified_2026: boolean;
  }>;
}

export class IronmanAnalyzer {
  private prisma: PrismaClient;
  
  // Kona Standard multipliers for age-graded times (2026 system)
  // CRITICAL: These values are from official IRONMAN documentation
  // See KONA_QUALIFYING_RULES_2026.md for complete table
  private konaStandards: Record<string, number> = {
    'M18-24': 0.9698, 'F18-24': 0.8567,
    'M25-29': 0.9921, 'F25-29': 0.8961,
    'M30-34': 1.0000, 'F30-34': 0.8977,
    'M35-39': 0.9895, 'F35-39': 0.8866,
    'M40-44': 0.9683, 'F40-44': 0.8707,
    'M45-49': 0.9401, 'F45-49': 0.8501,
    'M50-54': 0.9002, 'F50-54': 0.8125,
    'M55-59': 0.8667, 'F55-59': 0.7778,
    'M60-64': 0.8262, 'F60-64': 0.7218,
    'M65-69': 0.7552, 'F65-69': 0.6828,
    'M70-74': 0.6876, 'F70-74': 0.6439,
    'M75-79': 0.6768, 'F75-79': 0.5521,
    'M80-84': 0.5555, // F80-84 is TBD (no finishers in past 5 editions)
    'M85-89': 0.5416, // F85-89 is TBD (no finishers in past 5 editions)
  };

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getRaceSlots(raceName: string): Promise<{ 
    men_slots_2025: number; 
    women_slots_2025: number; 
    total_slots_2025: number;
    men_slots_2026: number; 
    women_slots_2026: number; 
    total_slots_2026: number;
  } | null> {
    const race = await this.prisma.race.findUnique({
      where: { name: raceName }
    });
    
    if (!race) return null;
    
    return {
      men_slots_2025: race.menSlots || 0,
      women_slots_2025: race.womenSlots || 0,
      total_slots_2025: race.totalSlots,
      men_slots_2026: race.menSlots2026 || 0,
      women_slots_2026: race.womenSlots2026 || 0,
      total_slots_2026: race.totalSlots2026 || race.totalSlots
    };
  }

  public parseTimeToSeconds(timeStr: string): number {
    try {
      const parts = timeStr.split(':');
      if (parts.length === 3) {
        const [hours, minutes, seconds] = parts.map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      } else if (parts.length === 2) {
        const [minutes, seconds] = parts.map(Number);
        return minutes * 60 + seconds;
      } else {
        return parseInt(parts[0]);
      }
    } catch {
      return 0;
    }
  }

  hasValidAgeGradingStandard(gender: string, ageGroup: string): boolean {
    const key = ageGroup.startsWith('M') || ageGroup.startsWith('F') 
      ? ageGroup 
      : `${gender}${ageGroup}`;
    return key in this.konaStandards;
  }

  public calculateAgeGradedTime(timeSeconds: number, gender: string, ageGroup: string): number {
    const key = ageGroup.startsWith('M') || ageGroup.startsWith('F') 
      ? ageGroup 
      : `${gender}${ageGroup}`;
    const multiplier = this.konaStandards[key] || 1.0;
    return timeSeconds * multiplier;
  }

  async extractCompetitorApiUrl(raceUrl: string): Promise<{ eventId: string; apiUrl: string } | null> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    try {
      const resultsUrl = raceUrl.endsWith('/results') ? raceUrl : `${raceUrl}/results`;
      const response = await fetch(resultsUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const match = text.match(/https:\/\/labs-v2\.competitor\.com\/results\/event\/([a-f0-9-]{36})/);
      
      if (match) {
        const eventId = match[1];
        const apiUrl = `https://labs-v2.competitor.com/results/event/${eventId}`;
        return { eventId, apiUrl };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting competitor API URL:', error);
      return null;
    }
  }

  async fetchResults(eventId: string): Promise<any> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'iframe',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-storage-access': 'active',
      'upgrade-insecure-requests': '1',
    };

    try {
      // Try API endpoint first
      const apiUrl = `https://labs-v2.competitor.com/api/results?wtc_eventid=${eventId}`;
      const apiResponse = await fetch(apiUrl, { headers });
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data?.resultsJson?.value && data.resultsJson.value.length > 0) {
          return data;
        }
      }

      // Try direct event page
      const eventUrl = `https://labs-v2.competitor.com/results/event/${eventId}`;
      const eventResponse = await fetch(eventUrl, { headers });
      
      if (!eventResponse.ok) {
        throw new Error(`Event page request failed: ${eventResponse.status}`);
      }

      const html = await eventResponse.text();
      
      // Extract __NEXT_DATA__ from the HTML
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]*)<\/script>/);
      if (nextDataMatch) {
        const nextData = JSON.parse(nextDataMatch[1]);
        const latestResults = nextData?.props?.pageProps?.latestResults;
        
        if (latestResults && latestResults.length > 0) {
          return { resultsJson: { value: latestResults } };
        }
      }

      throw new Error('No results found');
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
  }

  parseResultsToStandardFormat(apiData: any): RaceResult[] {
    if (!apiData?.resultsJson?.value) {
      return [];
    }

    const results: RaceResult[] = [];
    const resultsData = apiData.resultsJson.value;

    for (const result of resultsData) {
      const name = result.wtc_name || result.athlete || '';
      const ageGroup = this.extractAgeGroupFromApi(result);
      const gender = this.extractGenderFromApi(result);
      
      const formattedResult: RaceResult = {
        place: String(result.wtc_finishrankoverall || ''),
        name,
        age_group: ageGroup,
        gender,
        time: result.wtc_finishtimeformatted || '',
        country: this.extractCountryFromApi(result)
      };

      // Only include finishers with valid data
      if (formattedResult.name && 
          formattedResult.time && 
          formattedResult.place &&
          !result.wtc_dnf && 
          !result.wtc_dq) {
        results.push(formattedResult);
      }
    }

    return results;
  }

  private extractAgeGroupFromApi(result: any): string {
    const ageGroupData = result.wtc_AgeGroupId;
    
    if (typeof ageGroupData === 'object' && ageGroupData) {
      const ageGroupName = ageGroupData.wtc_agegroupname || ageGroupData.wtc_name || '';
      if (ageGroupName) return ageGroupName;
    }
    
    return result._wtc_agegroupid_value_formatted || '';
  }

  private extractGenderFromApi(result: any): string {
    const ageGroup = this.extractAgeGroupFromApi(result);
    
    if (ageGroup.startsWith('M')) return 'M';
    if (ageGroup.startsWith('F')) return 'F';
    
    const ageGroupData = result.wtc_AgeGroupId;
    if (typeof ageGroupData === 'object' && ageGroupData) {
      const genderCode = ageGroupData.wtc_gender;
      if (genderCode === 1) return 'M';
      if (genderCode === 2) return 'F';
    }
    
    return '';
  }

  private extractCountryFromApi(result: any): string {
    const countryData = result.wtc_CountryRepresentingId;
    
    if (typeof countryData === 'object' && countryData) {
      return countryData.wtc_name || countryData.wtc_iso2 || '';
    }
    
    return result.countryiso2 || result.country || '';
  }

  async parseRaceResults(url: string): Promise<RaceResult[]> {
    try {
      let eventId: string;
      
      if (url.includes('competitor.com')) {
        const eventIdMatch = url.match(/\/event\/([a-f0-9-]{36})/);
        if (!eventIdMatch) {
          throw new Error('Could not extract event ID from competitor.com URL');
        }
        eventId = eventIdMatch[1];
      } else if (url.includes('ironman.com')) {
        const extracted = await this.extractCompetitorApiUrl(url);
        if (!extracted) {
          throw new Error('Could not extract competitor API URL from Ironman URL');
        }
        eventId = extracted.eventId;
      } else {
        throw new Error('URL must be from ironman.com or competitor.com');
      }

      const apiData = await this.fetchResults(eventId);
      return this.parseResultsToStandardFormat(apiData);
    } catch (error) {
      console.error('Error parsing race results:', error);
      throw error;
    }
  }

  extractRaceNameFromUrl(url: string): string {
    if (url.includes('ironman.com')) {
      const pathParts = new URL(url).pathname.split('/');
      
      for (const part of pathParts) {
        if (part.startsWith('im-')) {
          const racePart = part.replace('im-', '').replace('-', ' ');
          return `IRONMAN ${racePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
        }
      }
    }
    
    return "IRONMAN Florida"; // Fallback
  }

  async analyzeQualifyingChanges(raceResults: RaceResult[], raceName: string): Promise<QualifyingAnalysis | null> {
    if (!raceResults || raceResults.length === 0) {
      return null;
    }

    const slots = await this.getRaceSlots(raceName);
    if (!slots) {
      return null;
    }

    const { men_slots_2025, women_slots_2025, total_slots_2025, total_slots_2026 } = slots;

    // Filter valid results and calculate derived data
    const validResults = raceResults
      .filter(result => this.hasValidAgeGradingStandard(result.gender, result.age_group))
      .map(result => ({
        ...result,
        place: parseInt(result.place),
        time_seconds: this.parseTimeToSeconds(result.time),
        age_graded_time: this.calculateAgeGradedTime(
          this.parseTimeToSeconds(result.time),
          result.gender,
          result.age_group
        )
      }))
      .sort((a, b) => a.place - b.place);

    const menResults = validResults.filter(r => r.gender.toUpperCase() === 'M');
    const womenResults = validResults.filter(r => r.gender.toUpperCase() === 'F');

    // === 2025 SYSTEM ANALYSIS ===
    const system2025Result = this.calculate2025System(validResults, men_slots_2025, women_slots_2025);
    const system2025Qualifiers = system2025Result.qualifiers;
    const system2025CutoffTimes = system2025Result.cutoffTimes;
    
    // === 2026 SYSTEM ANALYSIS ===
    // Use the actual 2026 slot allocation
    const system2026Result = await this.calculate2026System(validResults, total_slots_2026);
    const system2026Qualifiers = system2026Result.qualifiers;
    const system2026CutoffTimes = system2026Result.cutoffTimes;

    // === ANALYSIS COMPARISON ===
    const system2025Men = system2025Qualifiers.filter(q => q.gender.toUpperCase() === 'M').length;
    const system2025Women = system2025Qualifiers.filter(q => q.gender.toUpperCase() === 'F').length;
    const system2026Men = system2026Qualifiers.filter(q => q.gender.toUpperCase() === 'M').length;
    const system2026Women = system2026Qualifiers.filter(q => q.gender.toUpperCase() === 'F').length;

    // Age group analysis
    const ageGroups = Array.from(new Set(validResults.map(r => r.age_group)));
    const ageGroupAnalysis: Record<string, any> = {};

    for (const ageGroup of ageGroups) {
      const ag2025Men = system2025Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'M').length;
      const ag2025Women = system2025Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'F').length;
      const ag2026Men = system2026Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'M').length;
      const ag2026Women = system2026Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'F').length;

      ageGroupAnalysis[ageGroup] = {
        system_2025: { 
          men: ag2025Men, 
          women: ag2025Women, 
          total: ag2025Men + ag2025Women,
          qualifying_times: {
            cutoff_time_seconds: system2025CutoffTimes[ageGroup] || null
          }
        },
        system_2026: { 
          men: ag2026Men, 
          women: ag2026Women, 
          total: ag2026Men + ag2026Women,
          qualifying_times: {
            cutoff_time_seconds: system2026CutoffTimes[ageGroup] || null
          }
        },
        difference: { men: ag2026Men - ag2025Men, women: ag2026Women - ag2025Women, total: (ag2026Men + ag2026Women) - (ag2025Men + ag2025Women) }
      };
    }

    // Create detailed results
    const system2025QualifiedNames = new Set(system2025Qualifiers.map(q => q.name));
    const system2026QualifiedNames = new Set(system2026Qualifiers.map(q => q.name));

    const detailedResults = validResults.map(athlete => {
      const ageGroupKey = athlete.age_group.startsWith('M') || athlete.age_group.startsWith('F') 
        ? athlete.age_group 
        : `${athlete.gender}${athlete.age_group}`;
      const ageStandard = this.konaStandards[ageGroupKey] || 1.0;

      return {
        place: athlete.place,
        name: athlete.name,
        age_group: athlete.age_group,
        raw_time_seconds: athlete.time_seconds,
        age_standard: ageStandard,
        age_graded_time_seconds: Math.round(athlete.age_graded_time),
        qualified_2025: system2025QualifiedNames.has(athlete.name),
        qualified_2026: system2026QualifiedNames.has(athlete.name)
      };
    });

    return {
      race_name: raceName,
      total_participants: validResults.length,
      men_participants: menResults.length,
      women_participants: womenResults.length,
      total_slots: total_slots_2025,
      system_2025: {
        men_qualified: system2025Men,
        women_qualified: system2025Women,
        total_qualified: system2025Qualifiers.length
      },
      system_2026: {
        men_qualified: system2026Men,
        women_qualified: system2026Women,
        total_qualified: system2026Qualifiers.length
      },
      changes: {
        men_difference: system2026Men - system2025Men,
        women_difference: system2026Women - system2025Women
      },
      age_group_analysis: ageGroupAnalysis,
      detailed_results: detailedResults
    };
  }

  public calculate2025System(results: any[], menSlots: number, womenSlots: number): { qualifiers: any[], cutoffTimes: Record<string, number> } {
    const qualifiers: any[] = [];
    const cutoffTimes: Record<string, number> = {};
    const ageGroups = Array.from(new Set(results.map(r => r.age_group)));
    const ageGroupWinners: Record<string, any> = {};
    
    let remainingMenSlots = menSlots;
    let remainingWomenSlots = womenSlots;

    // Step 1: Age group winners
    for (const ageGroup of ageGroups) {
      const agAthletes = results.filter(r => r.age_group === ageGroup);
      if (agAthletes.length > 0) {
        const agWinner = agAthletes.reduce((prev, curr) => prev.time_seconds < curr.time_seconds ? prev : curr);
        ageGroupWinners[ageGroup] = agWinner;
        qualifiers.push(agWinner);
        
        if (agWinner.gender.toUpperCase() === 'M') {
          remainingMenSlots--;
        } else {
          remainingWomenSlots--;
        }
      }
    }

    // Step 2: Proportional allocation
    const menResults = results.filter(r => r.gender.toUpperCase() === 'M');
    const womenResults = results.filter(r => r.gender.toUpperCase() === 'F');

    if (remainingMenSlots > 0) {
      const menAgeGroups = menResults.reduce((acc, r) => {
        acc[r.age_group] = (acc[r.age_group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate proportional slots but ensure we don't exceed total
      const ageGroupSlots: Record<string, number> = {};
      let totalAllocated = 0;
      
      for (const [ageGroup, count] of Object.entries(menAgeGroups)) {
        if (ageGroup in ageGroupWinners) {
          const proportionalSlots = (count / menResults.length) * remainingMenSlots;
          ageGroupSlots[ageGroup] = Math.floor(proportionalSlots);
          totalAllocated += ageGroupSlots[ageGroup];
        }
      }
      
      // Distribute remaining slots to largest remainders
      const remainingToDistribute = remainingMenSlots - totalAllocated;
      if (remainingToDistribute > 0) {
        const remainders = Object.entries(menAgeGroups)
          .filter(([ageGroup]) => ageGroup in ageGroupWinners)
          .map(([ageGroup, count]) => ({
            ageGroup,
            remainder: (count / menResults.length) * remainingMenSlots - ageGroupSlots[ageGroup]
          }))
          .sort((a, b) => b.remainder - a.remainder)
          .slice(0, remainingToDistribute);
          
        for (const { ageGroup } of remainders) {
          ageGroupSlots[ageGroup]++;
        }
      }
      
      // Now allocate the slots
      for (const [ageGroup, additionalSlots] of Object.entries(ageGroupSlots)) {
        if (additionalSlots > 0) {
          const agAthletes = menResults.filter(r => r.age_group === ageGroup);
          const remainingAgAthletes = agAthletes.filter(r => r.name !== ageGroupWinners[ageGroup].name);
          
          const additionalQualifiers = remainingAgAthletes
            .sort((a, b) => a.place - b.place)
            .slice(0, additionalSlots);
          
          qualifiers.push(...additionalQualifiers);
        }
      }
    }

    if (remainingWomenSlots > 0) {
      const womenAgeGroups = womenResults.reduce((acc, r) => {
        acc[r.age_group] = (acc[r.age_group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate proportional slots but ensure we don't exceed total
      const ageGroupSlots: Record<string, number> = {};
      let totalAllocated = 0;
      
      for (const [ageGroup, count] of Object.entries(womenAgeGroups)) {
        if (ageGroup in ageGroupWinners) {
          const proportionalSlots = (count / womenResults.length) * remainingWomenSlots;
          ageGroupSlots[ageGroup] = Math.floor(proportionalSlots);
          totalAllocated += ageGroupSlots[ageGroup];
        }
      }
      
      // Distribute remaining slots to largest remainders
      const remainingToDistribute = remainingWomenSlots - totalAllocated;
      if (remainingToDistribute > 0) {
        const remainders = Object.entries(womenAgeGroups)
          .filter(([ageGroup]) => ageGroup in ageGroupWinners)
          .map(([ageGroup, count]) => ({
            ageGroup,
            remainder: (count / womenResults.length) * remainingWomenSlots - ageGroupSlots[ageGroup]
          }))
          .sort((a, b) => b.remainder - a.remainder)
          .slice(0, remainingToDistribute);
          
        for (const { ageGroup } of remainders) {
          ageGroupSlots[ageGroup]++;
        }
      }
      
      // Now allocate the slots
      for (const [ageGroup, additionalSlots] of Object.entries(ageGroupSlots)) {
        if (additionalSlots > 0) {
          const agAthletes = womenResults.filter(r => r.age_group === ageGroup);
          const remainingAgAthletes = agAthletes.filter(r => r.name !== ageGroupWinners[ageGroup].name);
          
          const additionalQualifiers = remainingAgAthletes
            .sort((a, b) => a.place - b.place)
            .slice(0, additionalSlots);
          
          qualifiers.push(...additionalQualifiers);
        }
      }
    }

    // Calculate cutoff times for each age group
    for (const ageGroup of ageGroups) {
      const ageGroupQualifiers = qualifiers.filter(q => q.age_group === ageGroup);
      if (ageGroupQualifiers.length > 0) {
        // Find the slowest qualifying time in this age group
        const slowestQualifier = ageGroupQualifiers.reduce((prev, curr) => 
          curr.time_seconds > prev.time_seconds ? curr : prev
        );
        cutoffTimes[ageGroup] = slowestQualifier.time_seconds;
      }
    }

    return { qualifiers, cutoffTimes };
  }

  private async calculate2026System(results: any[], totalSlots: number): Promise<{ qualifiers: any[], cutoffTimes: Record<string, number> }> {
    const qualifiers: any[] = [];
    const cutoffTimes: Record<string, number> = {};
    const ageGroups = Array.from(new Set(results.map(r => r.age_group)));
    const agWinnerNames: string[] = [];

    // Step 1: Age group winners
    for (const ageGroup of ageGroups) {
      const agAthletes = results.filter(r => r.age_group === ageGroup);
      if (agAthletes.length > 0) {
        const agWinner = agAthletes.reduce((prev, curr) => prev.time_seconds < curr.time_seconds ? prev : curr);
        qualifiers.push(agWinner);
        agWinnerNames.push(agWinner.name);
      }
    }

    // Step 2: Performance pool
    const remainingAthletes = results.filter(r => !agWinnerNames.includes(r.name));
    const performancePoolSlots = totalSlots - qualifiers.length;
    
    if (performancePoolSlots > 0) {
      const performanceQualifiers = remainingAthletes
        .sort((a, b) => a.age_graded_time - b.age_graded_time)
        .slice(0, performancePoolSlots);
      
      qualifiers.push(...performanceQualifiers);
    }

    // Calculate cutoff times for each age group using 2026 methodology
    // The qualifying time is the slower of: (1) age group winner time, or (2) performance pool cutoff converted to that age group
    const performancePoolQualifiers = remainingAthletes
      .sort((a, b) => a.age_graded_time - b.age_graded_time)
      .slice(0, performancePoolSlots);
    
    const lastPerformancePoolAgeGradedTime = performancePoolQualifiers.length > 0 
      ? performancePoolQualifiers[performancePoolQualifiers.length - 1].age_graded_time 
      : Infinity;
    
    for (const ageGroup of ageGroups) {
      const agAthletes = results.filter(r => r.age_group === ageGroup);
      if (agAthletes.length > 0) {
        // Path 1: Age group winner time
        const agWinner = agAthletes.reduce((prev, curr) => prev.time_seconds < curr.time_seconds ? prev : curr);
        const agWinnerTime = agWinner.time_seconds;
        
        // Path 2: Convert performance pool age-graded time back to this age group's equivalent
        let performancePoolTimeForAgeGroup = Infinity;
        if (lastPerformancePoolAgeGradedTime !== Infinity) {
          const ageGroupStandard = this.konaStandards[ageGroup];
          if (ageGroupStandard) {
            performancePoolTimeForAgeGroup = lastPerformancePoolAgeGradedTime / ageGroupStandard;
          }
        }
        
        // The qualifying time is the slower of these two paths
        cutoffTimes[ageGroup] = Math.max(agWinnerTime, performancePoolTimeForAgeGroup === Infinity ? agWinnerTime : performancePoolTimeForAgeGroup);
      }
    }

    return { qualifiers, cutoffTimes };
  }

  async analyzeRaceFromResults(
    raceResults: any[],
    raceName: string,
    totalSlots: number,
    menSlots: number,
    womenSlots: number,
    totalSlots2026?: number,
    menSlots2026?: number,
    womenSlots2026?: number
  ): Promise<any> {
    // This is a simplified version that doesn't require database lookup
    // Skip the getRaceSlots call and use provided values directly
    
    const validResults = raceResults
      .filter(result => result.name && result.time && result.place)
      .map(result => ({
        ...result,
        time_seconds: result.time_seconds || this.parseTimeToSeconds(result.time),
        age_graded_time: result.age_graded_time || result.time_seconds || this.parseTimeToSeconds(result.time)
      }))
      .sort((a, b) => a.place - b.place);

    const menResults = validResults.filter(r => r.gender.toUpperCase() === 'M');
    const womenResults = validResults.filter(r => r.gender.toUpperCase() === 'F');

    // === 2025 SYSTEM ANALYSIS ===
    const system2025Result = this.calculate2025System(validResults, menSlots, womenSlots);
    const system2025Qualifiers = system2025Result.qualifiers;
    const system2025CutoffTimes = system2025Result.cutoffTimes;
    
    // === 2026 SYSTEM ANALYSIS ===
    // Use the actual 2026 slot allocation
    const actualTotalSlots2026 = totalSlots2026 || totalSlots;
    const system2026Result = await this.calculate2026System(validResults, actualTotalSlots2026);
    const system2026Qualifiers = system2026Result.qualifiers;
    const system2026CutoffTimes = system2026Result.cutoffTimes;

    // === ANALYSIS COMPARISON ===
    const system2025Men = system2025Qualifiers.filter(q => q.gender.toUpperCase() === 'M').length;
    const system2025Women = system2025Qualifiers.filter(q => q.gender.toUpperCase() === 'F').length;
    const system2026Men = system2026Qualifiers.filter(q => q.gender.toUpperCase() === 'M').length;
    const system2026Women = system2026Qualifiers.filter(q => q.gender.toUpperCase() === 'F').length;

    // Age group analysis
    const ageGroups = Array.from(new Set(validResults.map(r => r.age_group)));
    const ageGroupAnalysis: Record<string, any> = {};

    for (const ageGroup of ageGroups) {
      const ag2025Men = system2025Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'M').length;
      const ag2025Women = system2025Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'F').length;
      const ag2026Men = system2026Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'M').length;
      const ag2026Women = system2026Qualifiers.filter(q => q.age_group === ageGroup && q.gender.toUpperCase() === 'F').length;

      ageGroupAnalysis[ageGroup] = {
        system_2025: { 
          men: ag2025Men, 
          women: ag2025Women, 
          total: ag2025Men + ag2025Women,
          qualifying_times: {
            cutoff_time_seconds: system2025CutoffTimes[ageGroup] || null
          }
        },
        system_2026: { 
          men: ag2026Men, 
          women: ag2026Women, 
          total: ag2026Men + ag2026Women,
          qualifying_times: {
            cutoff_time_seconds: system2026CutoffTimes[ageGroup] || null
          }
        },
        difference: { men: ag2026Men - ag2025Men, women: ag2026Women - ag2025Women, total: (ag2026Men + ag2026Women) - (ag2025Men + ag2025Women) }
      };
    }

    // Create detailed results
    const system2025QualifiedNames = new Set(system2025Qualifiers.map(q => q.name));
    const system2026QualifiedNames = new Set(system2026Qualifiers.map(q => q.name));

    const detailedResults = validResults.map(athlete => {
      const ageGroupKey = athlete.age_group.startsWith('M') || athlete.age_group.startsWith('F') 
        ? athlete.age_group 
        : `${athlete.gender}${athlete.age_group}`;
      const ageStandard = this.konaStandards[ageGroupKey] || 1.0;

      return {
        place: athlete.place,
        name: athlete.name,
        age_group: athlete.age_group,
        raw_time_seconds: athlete.time_seconds,
        age_standard: ageStandard,
        age_graded_time_seconds: Math.round(athlete.age_graded_time),
        qualified_2025: system2025QualifiedNames.has(athlete.name),
        qualified_2026: system2026QualifiedNames.has(athlete.name)
      };
    });

    return {
      race_name: raceName,
      total_participants: validResults.length,
      men_participants: menResults.length,
      women_participants: womenResults.length,
      total_slots: totalSlots,
      system_2025: {
        men_qualified: system2025Men,
        women_qualified: system2025Women,
        total_qualified: system2025Qualifiers.length
      },
      system_2026: {
        men_qualified: system2026Men,
        women_qualified: system2026Women,
        total_qualified: system2026Qualifiers.length
      },
      changes: {
        men_difference: system2026Men - system2025Men,
        women_difference: system2026Women - system2025Women
      },
      age_group_analysis: ageGroupAnalysis,
      detailed_results: detailedResults
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}