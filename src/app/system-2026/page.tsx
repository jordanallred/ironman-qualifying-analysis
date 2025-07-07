'use client';

import Link from 'next/link';

export default function System2026Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">2026 System</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            2026 Qualifying System
          </h1>
          <p className="text-xl text-gray-700">
            Complete explanation of the new age-graded qualification system
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How the 2026 System Works</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Two-Step Process</h3>
            <ol className="space-y-3 text-gray-800">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">1</span>
                <span><strong>Age Group Winners:</strong> First, we offer a slot to all age group winners (same as current system)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">2</span>
                <span><strong>Performance Pool:</strong> Remaining slots go to the fastest age-graded finishers regardless of age or gender</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Kona Standard Explanation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Creating the Kona Standard</h2>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-gray-700 leading-relaxed">
              We first create the <strong>"Kona Standard"</strong>, which is the average finish time of the <strong>top 20% of Kona finishers</strong> 
              (per age group for each gender) over a <strong>rolling 5-year (editions) period</strong>. We use the top 20% of finishers and
              a rolling 5-year period (single-day Kona editions) to minimize the impact of any outliers.
            </p>
            
            <p className="text-gray-700 leading-relaxed">
              The fastest men's and women's age groups are currently <strong>M30-34</strong> and <strong>F30-34</strong>. For all other age groups, 
              a ratio is calculated based on the average of the top 20% of finishers for that age group, relative to the fastest 
              age group (in this case, M30-34 and F30-34), and then normalized across genders.
            </p>
            
            <p className="text-gray-700 leading-relaxed">
              Using these Kona Standard ratios, we can now compare all qualifying event finisher times in a given race 
              irrespective of age and gender.
            </p>
          </div>
        </div>

        {/* Normalization Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kona Standard Ratios</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">IRONMAN World Championship Normalized Age Grading Table</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Men</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Women</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    ['18-24', '0.9698', '0.8567'],
                    ['25-29', '0.9921', '0.8961'],
                    ['30-34', '1.0000', '0.8977'],
                    ['35-39', '0.9895', '0.8866'],
                    ['40-44', '0.9683', '0.8707'],
                    ['45-49', '0.9401', '0.8501'],
                    ['50-54', '0.9002', '0.8125'],
                    ['55-59', '0.8667', '0.7778'],
                    ['60-64', '0.8262', '0.7218'],
                    ['65-69', '0.7552', '0.6828'],
                    ['70-74', '0.6876', '0.6439'],
                    ['75-79', '0.6768', '0.5521'],
                    ['80-84', '0.5555', 'TBD*'],
                    ['85-89', '0.5416', 'TBD*']
                  ].map(([ageGroup, men, women]) => (
                    <tr key={ageGroup} className={ageGroup === '30-34' ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ageGroup}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{men}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{women}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>*Note:</strong> The Women 80-84 and 85-89 age groups are TBD because, over the past 5 editions of racing 
                the IRONMAN World Championship in Kona, there have not been any finishers in these age groups. 
                The Kona Standard will be updated when we have finishers in these age groups.
              </p>
            </div>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Example: How Age-Grading Works</h2>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-gray-800 mb-4">
              Based on the last five editions of Kona, the average top 20% finish time for women in the 35-39 Age Group 
              is multiplied by the Kona Standard of <strong>0.8866</strong> to achieve an age-graded result that could be 
              equally compared to the top 20% finish time for men in the fastest Age Group of 30-34.
            </p>
            
            <p className="text-gray-800">
              Similarly for comparing race times across individuals, a 63-year-old man would have his finish time 
              multiplied by the Kona Standard of <strong>0.8262</strong> to be equally comparable to a 32-year-old man 
              in the fastest Age Group of 30-34.
            </p>
          </div>
        </div>

        {/* Real Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Real Example: IRONMAN Kalmar</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario</h3>
            <ul className="space-y-2 text-gray-800 mb-6">
              <li><strong>Anne</strong> (F40-44): Finishes in 9:19:51</li>
              <li><strong>John</strong> (M40-44): Finishes in 8:50:31</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Age-Graded Calculations</h3>
            
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Athlete</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finish Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kona Standard</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age-Graded Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="bg-green-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">Anne F40-44</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">9:19:51</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">0.8707</td>
                    <td className="px-4 py-4 text-sm font-bold text-green-600 font-mono">8:07:26</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">John M40-44</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">8:50:31</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">0.9683</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">8:33:42</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-medium">
                <strong>Result:</strong> Anne would rank above John in the age-graded rankings due to her age-graded time 
                of 8:07:26 being faster than John's age-graded finish time of 8:33:42.
              </p>
            </div>
          </div>
        </div>

        {/* Roll Down Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">The Roll Down Process</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-800 leading-relaxed mb-4">
              At the conclusion of a qualifying race, first we offer a slot to all age group winners. We then create 
              an age-graded finish time for every athlete by multiplying the athlete's finish time by the ratio of 
              their Kona Standard.
            </p>
            
            <p className="text-gray-800 leading-relaxed mb-4">
              These age-graded finish times are then rank ordered, producing a ranked list of the age-graded fastest 
              times from the race, irrespective of age or gender.
            </p>
            
            <p className="text-gray-800 leading-relaxed">
              The roll down process simply moves down this list, offering slots to the fastest age-graded finishers 
              until all available qualifying slots are accepted.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <Link 
            href="/"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}