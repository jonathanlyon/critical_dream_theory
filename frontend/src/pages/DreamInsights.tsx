import { useState } from 'react'

// Dev mode toggle for testing different states
const DEV_MODE = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Sample insights data that would come from AI analysis
const sampleInsights = {
  recurringElements: {
    characters: ['Unknown figures', 'Family members', 'Childhood self'],
    settings: ['Natural landscapes', 'Bodies of water', 'Elevated spaces'],
    emotions: ['Freedom/liberation', 'Searching/seeking', 'Wonder']
  },
  thematicEvolution: [
    {
      theme: 'Exploration and Discovery',
      evolution: 'Your dreams show a consistent pattern of encountering new spaces and possibilities. This may reflect an openness to change or a desire for growth in your waking life.'
    },
    {
      theme: 'Height and Perspective',
      evolution: 'Flying and elevated viewpoints appear frequently, potentially indicating a need for broader perspective or a sense of rising above current challenges.'
    }
  ],
  emergingThemes: [
    'Transition and transformation imagery (doors, bridges, journeys)',
    'Connection to nature and natural elements',
    'Themes of guidance from mysterious figures'
  ],
  driftAnalysis: {
    identity: 'Dreams suggest exploration of self-concept, with recurring imagery of viewing situations from elevated perspectives.',
    emotional: 'Generally positive emotional tone with themes of wonder and curiosity. Some anxiety-related content around navigation and finding one\'s way.',
    developmental: 'Imagery suggests processing of life transitions and growth opportunities.'
  },
  workingHypotheses: [
    'The recurring presence of natural landscapes may indicate a need for grounding or connection to simplicity.',
    'Flight and elevation imagery could represent desires for freedom or new perspective.',
    'Mysterious guide figures might symbolize intuitive wisdom seeking expression.'
  ]
}

// Advanced longitudinal tracking data (available at 5+ dreams)
const longitudinalData = {
  crossDreamAnalysis: {
    recurringElements: [
      { element: 'Water imagery', frequency: 4, trend: 'increasing', firstAppearance: 'Dream 1' },
      { element: 'Unknown guide figures', frequency: 3, trend: 'stable', firstAppearance: 'Dream 2' },
      { element: 'Elevated viewpoints', frequency: 5, trend: 'increasing', firstAppearance: 'Dream 1' }
    ],
    metacognitiveDevelopment: 'Subtle increase in dream awareness noted across recent entries. Two instances of near-lucid recognition in dreams 4 and 5.'
  },
  temporalCorrelations: {
    lifeEventsToDreams: [
      { event: 'Work deadline (Jan 3)', dreamContent: 'Navigation anxiety themes appeared in Dream 4', lag: '2-3 days' },
      { event: 'Family visit (Dec 28)', dreamContent: 'Family member characters in Dreams 3 and 4', lag: '1-2 days' }
    ],
    summary: 'Your dreams appear to process significant life events with a typical lag of 1-3 days. Work-related stress tends to manifest as navigation or searching themes.'
  },
  emotionalStateCorrelations: {
    moodToDreamTone: [
      { preMood: 'Anxious', dreamTone: 'Mixed with searching themes', frequency: 2 },
      { preMood: 'Calm', dreamTone: 'Positive with exploration themes', frequency: 3 }
    ],
    summary: 'Pre-sleep anxiety correlates with dreams featuring searching or navigation challenges. Calm moods tend to precede more expansive, exploratory dream content.'
  },
  sleepQualityCorrelations: {
    qualityToRecall: 'Higher sleep quality scores correlate with more vivid and detailed dream recall.',
    qualityToComplexity: 'Dreams following poor sleep tend to be more fragmented, while well-rested nights produce more coherent narratives.',
    averageQuality: 'Good',
    recallTrend: 'Improving over time'
  }
}

export default function DreamInsights() {
  // Dev mode: allow switching between different dream counts for testing
  const [devDreamCount, setDevDreamCount] = useState(0)

  // This would normally check user's dream count from the database
  // In production, this would come from the actual dream journal data
  const dreamCount = devDreamCount
  const requiredDreams = 3
  const hasEnoughDreams = dreamCount >= requiredDreams

  if (!hasEnoughDreams) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {/* Dev Mode Switcher */}
          {DEV_MODE && (
            <div className="fixed top-20 right-4 bg-dream-card border border-dream-border rounded-lg p-3 text-sm z-50">
              <p className="text-gray-400 mb-2">Dev: Dream Count</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 5].map(count => (
                  <button
                    key={count}
                    onClick={() => setDevDreamCount(count)}
                    className={`px-2 py-1 rounded ${
                      devDreamCount === count
                        ? 'bg-primary-500 text-white'
                        : 'bg-dream-darker text-gray-400 hover:bg-dream-border'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}

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
  // In production, this would fetch actual insights from the backend
  const insights = sampleInsights
  const hasAdvancedTracking = dreamCount >= 5

  return (
    <div className="flex-1 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Dream Insights</h1>
        <p className="text-gray-400 mb-8">
          Patterns emerging from your dream journal
          {hasAdvancedTracking && (
            <span className="ml-2 text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
              Advanced Tracking Unlocked
            </span>
          )}
        </p>

        {/* Insights Content - Therapist-style notes */}
        <div className="prose-dream space-y-8">
          {/* Pattern Synthesis / Thematic Evolution */}
          <section className="card">
            <h2>Pattern Synthesis</h2>
            <p>
              Based on your recent dream recordings, several themes appear to be emerging
              that may warrant gentle attention. These observations are offered as starting
              points for your own reflection, not definitive interpretations.
            </p>
            {insights.thematicEvolution.map((item, index) => (
              <div key={index} className="mt-4 pl-4 border-l-2 border-primary-500/50">
                <h3 className="text-lg font-semibold text-secondary-300 mb-2">{item.theme}</h3>
                <p className="text-gray-300 font-serif">{item.evolution}</p>
              </div>
            ))}
          </section>

          {/* Recurring Elements */}
          <section className="card">
            <h2>Recurring Elements</h2>
            <p>
              The following elements have appeared across multiple dreams, suggesting
              they may hold particular significance for your current life circumstances.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dream-darker/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-2">Characters</h4>
                <ul className="space-y-1">
                  {insights.recurringElements.characters.map((item, index) => (
                    <li key={index} className="text-gray-300 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-dream-darker/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-2">Settings</h4>
                <ul className="space-y-1">
                  {insights.recurringElements.settings.map((item, index) => (
                    <li key={index} className="text-gray-300 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-dream-darker/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-2">Emotions</h4>
                <ul className="space-y-1">
                  {insights.recurringElements.emotions.map((item, index) => (
                    <li key={index} className="text-gray-300 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Emerging Themes */}
          <section className="card">
            <h2>Emerging Themes</h2>
            <p>
              These patterns are beginning to coalesce and may become more defined
              as you continue recording dreams.
            </p>
            <ul className="mt-4 space-y-3">
              {insights.emergingThemes.map((theme, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent-400 mt-1">✦</span>
                  <span className="text-gray-300 font-serif">{theme}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Drift Resolution Progress */}
          <section className="card">
            <h2>Drift Resolution Progress</h2>
            <p>
              Cognitive drift themes—tensions between actual and ideal self, unprocessed
              emotions, life transitions—often evolve across dreams as the mind works
              toward integration.
            </p>
            <div className="mt-4 space-y-4">
              <div className="pl-4 border-l-2 border-secondary-500/50">
                <h4 className="text-sm font-semibold text-secondary-400 uppercase tracking-wide mb-1">Identity Drift</h4>
                <p className="text-gray-300 text-sm font-serif">{insights.driftAnalysis.identity}</p>
              </div>
              <div className="pl-4 border-l-2 border-secondary-500/50">
                <h4 className="text-sm font-semibold text-secondary-400 uppercase tracking-wide mb-1">Emotional Drift</h4>
                <p className="text-gray-300 text-sm font-serif">{insights.driftAnalysis.emotional}</p>
              </div>
              <div className="pl-4 border-l-2 border-secondary-500/50">
                <h4 className="text-sm font-semibold text-secondary-400 uppercase tracking-wide mb-1">Developmental Drift</h4>
                <p className="text-gray-300 text-sm font-serif">{insights.driftAnalysis.developmental}</p>
              </div>
            </div>
          </section>

          {/* Working Hypotheses */}
          <section className="card">
            <h2>Working Hypotheses</h2>
            <p className="font-serif italic text-secondary-300 mb-4">
              "These tentative observations are offered in the spirit of collaborative
              exploration. You remain the final authority on the meaning of your dreams."
            </p>
            <ul className="space-y-3">
              {insights.workingHypotheses.map((hypothesis, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent-400 font-bold">{index + 1}.</span>
                  <span className="text-gray-300 font-serif">{hypothesis}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Longitudinal Tracking (5+ dreams) */}
          {hasAdvancedTracking && (
            <>
              {/* Cross-Dream Analysis */}
              <section className="card border-l-4 border-accent-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-accent-400 text-xl">📊</span>
                  <h2 className="!mb-0">Cross-Dream Analysis</h2>
                </div>
                <p className="mb-4">
                  With {dreamCount} dreams recorded, patterns across your entire dream journal
                  are becoming clearer. Here's what the data reveals:
                </p>

                <h3 className="text-lg font-semibold text-primary-300 mb-3">Recurring Elements Frequency</h3>
                <div className="space-y-3 mb-6">
                  {longitudinalData.crossDreamAnalysis.recurringElements.map((item, index) => (
                    <div key={index} className="bg-dream-darker/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{item.element}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.trend === 'increasing'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.trend === 'increasing' ? '↑ Increasing' : '→ Stable'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-dream-border rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.frequency / dreamCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{item.frequency}/{dreamCount} dreams</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">First appeared: {item.firstAppearance}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-primary-300 mb-2">Metacognitive Development</h3>
                <p className="text-gray-300 font-serif text-sm">{longitudinalData.crossDreamAnalysis.metacognitiveDevelopment}</p>
              </section>

              {/* Temporal Correlations */}
              <section className="card border-l-4 border-secondary-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-secondary-400 text-xl">🔗</span>
                  <h2 className="!mb-0">Life Events → Dream Content</h2>
                </div>
                <p className="mb-4">{longitudinalData.temporalCorrelations.summary}</p>

                <div className="space-y-3">
                  {longitudinalData.temporalCorrelations.lifeEventsToDreams.map((item, index) => (
                    <div key={index} className="bg-dream-darker/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-secondary-500/20 rounded-full flex items-center justify-center">
                          <span className="text-secondary-400 text-sm">📅</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{item.event}</p>
                          <p className="text-gray-400 text-sm mt-1">→ {item.dreamContent}</p>
                          <p className="text-xs text-gray-500 mt-1">Lag: {item.lag}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Emotional State Correlations */}
              <section className="card border-l-4 border-pink-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-pink-400 text-xl">💭</span>
                  <h2 className="!mb-0">Emotional State → Dream Tone</h2>
                </div>
                <p className="mb-4">{longitudinalData.emotionalStateCorrelations.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {longitudinalData.emotionalStateCorrelations.moodToDreamTone.map((item, index) => (
                    <div key={index} className="bg-dream-darker/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-lg ${
                          item.preMood === 'Anxious' ? '😰' :
                          item.preMood === 'Calm' ? '😌' : '😐'
                        }`}>{
                          item.preMood === 'Anxious' ? '😰' :
                          item.preMood === 'Calm' ? '😌' : '😐'
                        }</span>
                        <span className="text-white font-medium">{item.preMood}</span>
                      </div>
                      <p className="text-gray-400 text-sm">→ {item.dreamTone}</p>
                      <p className="text-xs text-gray-500 mt-2">{item.frequency} occurrences</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sleep Quality Correlations */}
              <section className="card border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-blue-400 text-xl">😴</span>
                  <h2 className="!mb-0">Sleep Quality → Dream Patterns</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-dream-darker/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Sleep Quality</p>
                    <p className="text-xl font-bold text-blue-400">{longitudinalData.sleepQualityCorrelations.averageQuality}</p>
                  </div>
                  <div className="bg-dream-darker/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recall Trend</p>
                    <p className="text-xl font-bold text-green-400">{longitudinalData.sleepQualityCorrelations.recallTrend}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="pl-4 border-l-2 border-blue-500/50">
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">Quality → Recall</h4>
                    <p className="text-gray-300 text-sm font-serif">{longitudinalData.sleepQualityCorrelations.qualityToRecall}</p>
                  </div>
                  <div className="pl-4 border-l-2 border-blue-500/50">
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">Quality → Complexity</h4>
                    <p className="text-gray-300 text-sm font-serif">{longitudinalData.sleepQualityCorrelations.qualityToComplexity}</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Teaser for advanced tracking (3-4 dreams) */}
          {!hasAdvancedTracking && dreamCount >= 3 && (
            <section className="card bg-gradient-to-br from-dream-card to-dream-darker border-dashed border-2 border-dream-border">
              <div className="text-center py-4">
                <span className="text-4xl mb-4 block">🔮</span>
                <h3 className="text-xl font-bold text-white mb-2">Advanced Tracking Coming Soon</h3>
                <p className="text-gray-400 mb-4">
                  Record {5 - dreamCount} more {5 - dreamCount === 1 ? 'dream' : 'dreams'} to unlock:
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• Cross-dream element frequency analysis</li>
                  <li>• Life events → dream content correlations</li>
                  <li>• Emotional state → dream tone patterns</li>
                  <li>• Sleep quality impact analysis</li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
