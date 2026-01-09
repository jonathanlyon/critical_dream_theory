export default function DreamInsights() {
  // This would normally check user's dream count
  const dreamCount = 0
  const requiredDreams = 3
  const hasEnoughDreams = dreamCount >= requiredDreams

  if (!hasEnoughDreams) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            {/* Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-dream-border"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(dreamCount / requiredDreams) * 283} 283`}
                className="text-primary-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-400">
                {dreamCount}/{requiredDreams}
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Unlock Pattern Insights
          </h2>
          <p className="text-gray-400 mb-6 font-serif">
            Record {requiredDreams - dreamCount} more {requiredDreams - dreamCount === 1 ? 'dream' : 'dreams'} to unlock
            personalized pattern insights. Longitudinal analysis requires at least {requiredDreams} dreams
            to identify meaningful recurring themes.
          </p>
          <a href="/analysis" className="btn-primary inline-block touch-target">
            Record a Dream
          </a>
        </div>
      </div>
    )
  }

  // Insights View (when user has 3+ dreams)
  return (
    <div className="flex-1 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Dream Insights</h1>
        <p className="text-gray-400 mb-8">
          Patterns emerging from your dream journal
        </p>

        {/* Insights Content - Therapist-style notes */}
        <div className="prose-dream space-y-8">
          <section className="card">
            <h2>Pattern Synthesis</h2>
            <p>
              Based on your recent dream recordings, several themes appear to be emerging
              that may warrant gentle attention. These observations are offered as starting
              points for your own reflection, not definitive interpretations.
            </p>
            <p className="text-gray-400 italic">
              Content will be generated from your actual dream analyses...
            </p>
          </section>

          <section className="card">
            <h2>Recurring Elements</h2>
            <p>
              Tracking the characters, settings, and emotions that appear across multiple dreams
              can reveal patterns in how your mind processes daily experiences.
            </p>
            <p className="text-gray-400 italic">
              Analysis pending more dream data...
            </p>
          </section>

          <section className="card">
            <h2>Drift Resolution Progress</h2>
            <p>
              Cognitive drift themes—tensions between actual and ideal self, unprocessed
              emotions, life transitions—often evolve across dreams as the mind works
              toward integration.
            </p>
            <p className="text-gray-400 italic">
              Tracking will begin with sufficient dream history...
            </p>
          </section>

          <section className="card">
            <h2>Working Hypotheses</h2>
            <p className="font-serif italic text-secondary-300">
              "These tentative observations are offered in the spirit of collaborative
              exploration. You remain the final authority on the meaning of your dreams."
            </p>
            <ul>
              <li className="text-gray-400">Hypothesis generation pending...</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
