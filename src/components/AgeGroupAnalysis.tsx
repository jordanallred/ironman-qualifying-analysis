interface AgeGroupAnalysisProps {
  ageGroupAnalysis: Record<string, any>;
}

export default function AgeGroupAnalysis({ ageGroupAnalysis }: AgeGroupAnalysisProps) {
  // Prepare data for winners and losers
  const ageGroupChanges = Object.entries(ageGroupAnalysis)
    .map(([ageGroup, data]) => ({
      ageGroup,
      change: data.difference?.total || 0,
      menChange: data.difference?.men || 0,
      womenChange: data.difference?.women || 0,
      system2025Total: data.system_2025?.total || 0,
      system2026Total: data.system_2026?.total || 0,
    }))
    .sort((a, b) => b.change - a.change);

  const winners = ageGroupChanges.filter(ag => ag.change > 0);
  const losers = ageGroupChanges.filter(ag => ag.change < 0).sort((a, b) => a.change - b.change); // Sort losers by most negative first
  const unchanged = ageGroupChanges.filter(ag => ag.change === 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Age Group Impact Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Winners */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            <h3 className="text-lg font-medium text-green-900">
              Winners ({winners.length} groups)
            </h3>
          </div>
          
          <div className="space-y-2">
            {winners.slice(0, 5).map((ag) => (
              <div key={ag.ageGroup} className="flex items-center justify-between bg-white rounded p-2">
                <div>
                  <span className="font-medium text-gray-900">{ag.ageGroup}</span>
                  <div className="text-xs text-gray-500">
                    {ag.menChange > 0 ? `+${ag.menChange}M` : ag.menChange < 0 ? `${ag.menChange}M` : '0M'} / {ag.womenChange > 0 ? `+${ag.womenChange}F` : ag.womenChange < 0 ? `${ag.womenChange}F` : '0F'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">+{ag.change}</span>
                  <div className="text-xs text-gray-500">
                    {ag.system2025Total} → {ag.system2026Total}
                  </div>
                </div>
              </div>
            ))}
            
            {winners.length > 5 && (
              <div className="text-sm text-green-700 text-center">
                +{winners.length - 5} more age groups gaining slots
              </div>
            )}
          </div>
        </div>

        {/* Unchanged */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700">
              Unchanged ({unchanged.length} groups)
            </h3>
          </div>
          
          <div className="space-y-2">
            {unchanged.slice(0, 5).map((ag) => (
              <div key={ag.ageGroup} className="flex items-center justify-between bg-white rounded p-2">
                <div>
                  <span className="font-medium text-gray-900">{ag.ageGroup}</span>
                  <div className="text-xs text-gray-500">
                    Same distribution
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-500">0</span>
                  <div className="text-xs text-gray-500">
                    {ag.system2025Total} slots
                  </div>
                </div>
              </div>
            ))}
            
            {unchanged.length > 5 && (
              <div className="text-sm text-gray-600 text-center">
                +{unchanged.length - 5} more unchanged groups
              </div>
            )}
          </div>
        </div>

        {/* Losers */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            <h3 className="text-lg font-medium text-red-900">
              Losers ({losers.length} groups)
            </h3>
          </div>
          
          <div className="space-y-2">
            {losers.slice(0, 5).map((ag) => (
              <div key={ag.ageGroup} className="flex items-center justify-between bg-white rounded p-2">
                <div>
                  <span className="font-medium text-gray-900">{ag.ageGroup}</span>
                  <div className="text-xs text-gray-500">
                    {ag.menChange}M / {ag.womenChange}F
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-600">{ag.change}</span>
                  <div className="text-xs text-gray-500">
                    {ag.system2025Total} → {ag.system2026Total}
                  </div>
                </div>
              </div>
            ))}
            
            {losers.length > 5 && (
              <div className="text-sm text-red-700 text-center">
                +{losers.length - 5} more age groups losing slots
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {winners.reduce((sum, ag) => sum + ag.change, 0)}
          </div>
          <div className="text-sm text-blue-700">Total slots gained by winners</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {unchanged.reduce((sum, ag) => sum + ag.system2025Total, 0)}
          </div>
          <div className="text-sm text-yellow-700">Slots staying the same</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.abs(losers.reduce((sum, ag) => sum + ag.change, 0))}
          </div>
          <div className="text-sm text-purple-700">Total slots lost by losers</div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Understanding the Changes</div>
            <p>
              The 2026 system allocates slots differently: age group winners get automatic slots, 
              then remaining slots go to the fastest age-graded times regardless of age or gender. 
              This can shift slots between age groups based on competitive depth and performance standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}