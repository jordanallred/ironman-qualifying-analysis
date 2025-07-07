'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input, Heading, Text, ErrorState, LoadingSpinner } from '@/components/ui';

export default function AnalysisForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.includes('competitor.com') && !url.includes('ironman.com')) {
      setError('Please enter a valid ironman.com or competitor.com URL');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('url', url);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze race');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setError(null);
    setAnalysisResult(null);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <Heading level={2} className="mb-2">
            Analyze Any Race Manually
          </Heading>
          <Text variant="caption">
            Enter a race results URL to perform real-time analysis of qualifying changes between 2025 and 2026 systems
          </Text>
        </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="raceUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Race Results URL
          </label>
          <Input
            type="url"
            id="raceUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.ironman.com/... or https://labs-v2.competitor.com/..."
            disabled={loading}
          />
          <Text variant="caption" className="mt-1 text-gray-500">
            Supported: Official Ironman results pages or direct competitor.com event links
          </Text>
        </div>

        {error && <ErrorState message={error} />}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex-1"
          >
            {loading ? 'Analyzing...' : 'Analyze Race'}
          </Button>
          
          {(analysisResult || error) && (
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
            >
              Reset
            </Button>
          )}
        </div>
      </form>

      {analysisResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <Heading level={4} className="text-green-900 mb-2">
                Analysis Complete: {analysisResult.race_name}
              </Heading>
              <div className="space-y-1">
                <Text variant="caption" className="text-green-800">• Total Participants: {analysisResult.total_participants}</Text>
                <Text variant="caption" className="text-green-800">• Total Slots: {analysisResult.total_slots}</Text>
                <Text variant="caption" className="text-green-800">• 2025 System: {analysisResult.system_2025.men_qualified}M / {analysisResult.system_2025.women_qualified}F qualified</Text>
                <Text variant="caption" className="text-green-800">• 2026 System: {analysisResult.system_2026.men_qualified}M / {analysisResult.system_2026.women_qualified}F qualified</Text>
                <Text variant="caption" className="text-green-800">• Changes: {analysisResult.changes.men_difference > 0 ? '+' : ''}{analysisResult.changes.men_difference}M, {analysisResult.changes.women_difference > 0 ? '+' : ''}{analysisResult.changes.women_difference}F</Text>
              </div>
              <div className="mt-3">
                <Button
                  variant="link"
                  onClick={() => {
                    alert('Detailed analysis view would open here. This will be implemented in the race detail pages.');
                  }}
                  className="text-green-700 hover:text-green-900 p-0 h-auto"
                >
                  View Detailed Analysis →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}