import { NextRequest, NextResponse } from 'next/server';
import { IronmanAnalyzer } from '@/lib/ironman-analyzer';

export async function POST(request: NextRequest) {
  const analyzer = new IronmanAnalyzer();
  
  try {
    const formData = await request.formData();
    const url = formData.get('url') as string;
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
    
    // Validate URL
    if (!url.includes('competitor.com') && !url.includes('ironman.com')) {
      return NextResponse.json({ 
        error: 'URL must be from ironman.com or competitor.com' 
      }, { status: 400 });
    }
    
    // Parse race results
    const raceResults = await analyzer.parseRaceResults(url);
    if (!raceResults || raceResults.length === 0) {
      return NextResponse.json({ 
        error: 'Could not parse race results from URL' 
      }, { status: 400 });
    }
    
    // Extract race name
    const raceName = analyzer.extractRaceNameFromUrl(url);
    if (!raceName) {
      return NextResponse.json({ 
        error: 'Could not identify race from URL' 
      }, { status: 400 });
    }
    
    // Analyze qualifying changes
    const analysis = await analyzer.analyzeQualifyingChanges(raceResults, raceName);
    if (!analysis) {
      return NextResponse.json({ 
        error: 'Could not find qualifying slot data for this race' 
      }, { status: 400 });
    }
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Error analyzing race:', error);
    return NextResponse.json({ 
      error: `Error analyzing race: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  } finally {
    await analyzer.disconnect();
  }
}