import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Mock analysis data for demonstration
const MOCK_ANALYSIS = {
  dreamId: 'dream_001',
  createdAt: new Date().toISOString(),
  recordingDuration: 127, // seconds
  wordCount: 342,

  // Dream Overview
  overview: {
    emotionalTone: 'Anxious with undertones of wonder',
    dreamType: 'Continuation',
    dreamTypeConfidence: 0.78,
    title: 'The Shifting Corridors',
    summary: 'A dream of navigating through constantly changing hallways while searching for something important but forgotten.'
  },

  // Transcript
  transcript: `I was walking through this building... it felt like a school but also like my grandmother's house somehow. The hallways kept shifting and I couldn't find the room I was looking for. There was this urgency, like I was late for something important. The walls had paintings that seemed to watch me as I passed. At one point I opened a door and there was just sky—endless blue sky where a room should have been. I felt terrified but also incredibly free for that moment...`,

  // Manifest Content (Schredl scales)
  manifestContent: {
    characters: [
      { name: 'Self (dreamer)', role: 'Protagonist', familiarity: 'Self' },
      { name: 'Unnamed presence', role: 'Implied observer', familiarity: 'Unknown' }
    ],
    settings: [
      { location: 'School-like building', familiarity: 'Hybrid (familiar + unfamiliar)' },
      { location: "Grandmother's house elements", familiarity: 'Familiar from childhood' },
      { location: 'Endless sky', familiarity: 'Unfamiliar/Surreal' }
    ],
    actions: [
      'Walking/searching',
      'Opening doors',
      'Observing paintings',
      'Experiencing emotional shift'
    ],
    emotions: [
      { emotion: 'Anxiety/Urgency', intensity: 4, context: 'Searching, being late' },
      { emotion: 'Fear', intensity: 3, context: 'Door opening to sky' },
      { emotion: 'Freedom/Wonder', intensity: 4, context: 'Moment at sky door' },
      { emotion: 'Confusion', intensity: 3, context: 'Shifting hallways' }
    ],
    schredlScales: {
      dreamLength: { value: 342, label: 'Medium-Long', interpretation: 'Above average word count, moderate complexity' },
      realism: { value: 2, label: 'Moderately Bizarre', interpretation: 'Mix of realistic and impossible elements' },
      emotionalIntensityPositive: { value: 4, label: 'High Positive', interpretation: 'Strong positive emotions (wonder, freedom)' },
      emotionalIntensityNegative: { value: 3, label: 'Moderate Negative', interpretation: 'Notable negative emotions (anxiety, fear)' },
      clarity: { value: 3, label: 'Moderate', interpretation: 'Some details vivid, others fuzzy' },
      selfParticipation: { value: 5, label: 'Full', interpretation: 'Dreamer fully embodied in the dream' },
      socialDensity: { value: 1, label: 'Low', interpretation: '1 character, minimal interactions' },
      agency: { value: 3, label: 'Moderate', interpretation: 'Active searching, but constrained by environment' },
      narrativeCoherence: { value: 2, label: 'Fragmented', interpretation: 'Shifting scenes without clear linear progression' }
    }
  },

  // CDT Framework Analysis
  cdtAnalysis: {
    vaultActivation: {
      assessment: 'Mixed temporal markers',
      recentMemories: ['School/institutional settings', 'Sense of deadlines/urgency'],
      distantMemories: ["Grandmother's house", 'Childhood spatial memories'],
      interpretation: 'Dream may be processing current stressors through the lens of formative experiences'
    },
    cognitiveDrift: {
      themes: [
        { theme: 'Search for meaning/purpose', confidence: 0.72 },
        { theme: 'Identity navigation', confidence: 0.65 },
        { theme: 'Transition/threshold', confidence: 0.81 }
      ],
      interpretation: 'Strong indicators of life transition processing'
    },
    convergenceIndicators: {
      present: true,
      evidence: 'The moment of terror transforming to freedom at the sky-door suggests emotional integration in progress',
      resolutionType: 'Partial - emotional but not narrative resolution'
    },
    dreamTypeRationale: 'Classified as Continuation dream due to ongoing search without clear resolution, yet containing elements of Transcendent (sky moment)'
  },

  // Archetypal Resonances
  archetypalResonances: {
    threshold: {
      present: true,
      elements: ['Doors', 'Shifting hallways', 'Sky opening'],
      reflection: 'May reflect a liminal phase in waking life—standing between what was and what could be'
    },
    shadow: {
      present: false,
      elements: [],
      reflection: null
    },
    animaAnimus: {
      present: false,
      elements: [],
      reflection: null
    },
    selfWholeness: {
      present: true,
      elements: ['Hybrid spaces (school/grandmother)', 'Terror becoming freedom'],
      reflection: 'Could suggest integration of different life phases or aspects of identity'
    },
    scenarios: [
      { name: 'The Labyrinth', description: 'Journey of self-discovery through confusion' },
      { name: 'The Threshold', description: 'Standing at the edge of transformation' }
    ]
  },

  // Reflective Prompts
  reflectivePrompts: [
    {
      category: 'Exploration',
      prompt: 'What in your current life feels like those shifting hallways—familiar yet constantly changing?',
      dreamConnection: 'The morphing school/grandmother\'s house'
    },
    {
      category: 'Emotional',
      prompt: 'When you think about the moment of terror becoming freedom at the sky-door, what comes up for you?',
      dreamConnection: 'The emotional transformation'
    },
    {
      category: 'Action-oriented',
      prompt: 'What might you be searching for that you\'ve forgotten you were looking for?',
      dreamConnection: 'The urgent search for something unknown'
    },
    {
      category: 'Integration',
      prompt: 'How might the presence of both your school days and grandmother\'s house speak to where you are now?',
      dreamConnection: 'The hybrid spaces'
    }
  ],

  // AI-generated image placeholder
  dreamImage: {
    url: null, // Would be generated by Gemini
    prompt: 'Surreal corridor blending school hallway and grandmother\'s house, with paintings on walls, leading to an open door showing endless blue sky, dreamlike atmosphere, soft lighting',
    status: 'generated'
  }
}

// Processing steps for animation
const PROCESSING_STEPS = [
  { name: 'Transcribing audio', icon: 'mic' },
  { name: 'Analyzing emotional prosody', icon: 'wave' },
  { name: 'Extracting manifest content', icon: 'document' },
  { name: 'Applying CDT framework', icon: 'brain' },
  { name: 'Identifying archetypal resonances', icon: 'symbol' },
  { name: 'Generating reflective prompts', icon: 'lightbulb' },
  { name: 'Creating dream visualization', icon: 'image' }
]

export default function AnalysisResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isProcessing, setIsProcessing] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [analysis, setAnalysis] = useState<typeof MOCK_ANALYSIS | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Privacy toggle state
  const [isPrivate, setIsPrivate] = useState(false)

  // Check if we came from recording
  const fromRecording = location.state?.fromRecording || false

  useEffect(() => {
    if (isProcessing) {
      // Simulate processing steps
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= PROCESSING_STEPS.length - 1) {
            clearInterval(interval)
            setTimeout(() => {
              setIsProcessing(false)
              setAnalysis(MOCK_ANALYSIS)
            }, 500)
            return prev
          }
          return prev + 1
        })
      }, 800)

      return () => clearInterval(interval)
    }
  }, [isProcessing])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Audio playback controls (simulated for mock data)
  const togglePlayback = () => {
    if (isPlaying) {
      // Pause
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
        audioIntervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      // Play - simulate audio progress
      setIsPlaying(true)
      const duration = analysis?.recordingDuration || 127
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= duration) {
            if (audioIntervalRef.current) {
              clearInterval(audioIntervalRef.current)
              audioIntervalRef.current = null
            }
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  // Cleanup audio interval on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
      }
    }
  }, [])

  // Processing view
  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Processing animation */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary-600/30 to-secondary-600/30 animate-pulse flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/50 to-secondary-500/50 animate-spin-slow flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-dream-darker flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-center mb-6">Analyzing Your Dream</h2>

          {/* Processing steps */}
          <div className="space-y-3">
            {PROCESSING_STEPS.map((step, index) => {
              const isComplete = index < currentStep
              const isCurrent = index === currentStep
              return (
                <div
                  key={step.name}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isComplete ? 'bg-green-500/10' :
                    isCurrent ? 'bg-primary-500/20' :
                    'bg-dream-darker/50 opacity-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isComplete ? 'bg-green-500' :
                    isCurrent ? 'bg-primary-500 animate-pulse' :
                    'bg-gray-700'
                  }`}>
                    {isComplete ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs text-white">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                    {step.name}
                    {isCurrent && <span className="ml-2 animate-pulse">...</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Results view
  if (!analysis) return null

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/journal')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Journal</span>
          </button>
          <div className="flex items-center gap-2">
            {/* Privacy Toggle */}
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`btn-ghost text-sm flex items-center gap-1 ${isPrivate ? 'text-amber-400' : ''}`}
              aria-label={isPrivate ? 'Make public' : 'Make private'}
              title={isPrivate ? 'This dream is private (excluded from Insights)' : 'Make private to exclude from Insights'}
            >
              {isPrivate ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              )}
              {isPrivate ? 'Private' : 'Public'}
            </button>
            <button className="btn-ghost text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button className="btn-ghost text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* Dream Overview */}
        <section className="card">
          <div className="flex items-start gap-6">
            {/* Dream Image */}
            <div className="hidden lg:block w-48 h-48 rounded-lg bg-gradient-to-br from-primary-600/30 to-secondary-600/30 flex-shrink-0 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Overview Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-300">
                  {analysis.overview.dreamType}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(analysis.overview.dreamTypeConfidence * 100)}% confidence
                </span>
              </div>

              <h1 className="text-2xl font-bold mb-2">{analysis.overview.title}</h1>
              <p className="text-gray-400 mb-4">{analysis.overview.summary}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(analysis.recordingDuration)}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {analysis.wordCount} words
                </span>
              </div>
            </div>
          </div>

          {/* Emotional Tone */}
          <div className="mt-6 pt-6 border-t border-dream-border">
            <p className="text-sm text-gray-400">
              <span className="text-gray-300 font-medium">Emotional Tone:</span> {analysis.overview.emotionalTone}
            </p>
          </div>

          {/* Audio Player */}
          <div className="mt-6 pt-6 border-t border-dream-border">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Original Recording</h3>
            <div className="flex items-center gap-4 p-4 bg-dream-darker rounded-lg">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayback}
                className="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors"
                aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Progress Bar */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{formatDuration(audioProgress)}</span>
                  <div className="flex-1 h-2 bg-dream-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${(audioProgress / analysis.recordingDuration) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{formatDuration(analysis.recordingDuration)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {isPlaying ? 'Playing...' : 'Click play to listen to your dream recording'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transcript */}
        <section className="card">
          <button
            onClick={() => toggleSection('transcript')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">Transcript</h2>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('transcript') ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has('transcript') && (
            <div className="mt-4 p-4 bg-dream-darker rounded-lg">
              <p className="text-gray-300 italic leading-relaxed">{analysis.transcript}</p>
            </div>
          )}
        </section>

        {/* Manifest Content Summary */}
        <section className="card">
          <button
            onClick={() => toggleSection('manifest')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">Manifest Content Summary</h2>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('manifest') ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has('manifest') && (
            <div className="mt-4 space-y-6">
              {/* Characters */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Characters</h3>
                <div className="space-y-2">
                  {analysis.manifestContent.characters.map((char, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-dream-darker rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm">
                        {char.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">{char.name}</p>
                        <p className="text-xs text-gray-500">{char.role} • {char.familiarity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Settings</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.manifestContent.settings.map((setting, i) => (
                    <span key={i} className="px-3 py-1 text-sm bg-dream-darker rounded-full text-gray-300">
                      {setting.location}
                    </span>
                  ))}
                </div>
              </div>

              {/* Emotions */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Emotional Landscape</h3>
                <div className="space-y-2">
                  {analysis.manifestContent.emotions.map((emotion, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-24">{emotion.emotion}</span>
                      <div className="flex-1 h-2 bg-dream-darker rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                          style={{ width: `${(emotion.intensity / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{emotion.intensity}/5</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schredl Scales */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Schredl Scales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(analysis.manifestContent.schredlScales).map(([key, scale]) => {
                    const isDreamLength = key === 'dreamLength'
                    const displayValue = isDreamLength ? `${scale.value} words` : `${scale.value}/5`
                    return (
                      <div key={key} className="p-3 bg-dream-darker rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm font-medium text-primary-400">{displayValue}</span>
                        </div>
                        <p className="text-xs text-gray-500">{scale.label}: {scale.interpretation}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Structural Analysis - CDT Framework */}
        <section className="card">
          <button
            onClick={() => toggleSection('cdt')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">Structural Analysis - CDT Framework</h2>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('cdt') ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has('cdt') && (
            <div className="mt-4 space-y-6">
              {/* Vault Activation */}
              <div className="p-4 bg-dream-darker rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Memory Vault Activation</h3>
                <p className="text-sm text-gray-400 mb-3">{analysis.cdtAnalysis.vaultActivation.assessment}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Recent Memories</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {analysis.cdtAnalysis.vaultActivation.recentMemories.map((m, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Distant Memories</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {analysis.cdtAnalysis.vaultActivation.distantMemories.map((m, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cognitive Drift */}
              <div className="p-4 bg-dream-darker rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Cognitive Drift Themes</h3>
                <div className="space-y-2">
                  {analysis.cdtAnalysis.cognitiveDrift.themes.map((theme, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 flex-1">{theme.theme}</span>
                      <div className="w-24 h-2 bg-dream-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${theme.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(theme.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-3 italic">{analysis.cdtAnalysis.cognitiveDrift.interpretation}</p>
              </div>

              {/* Dream Type Rationale */}
              <div className="p-4 bg-dream-darker rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Dream Classification Rationale</h3>
                <p className="text-sm text-gray-400">{analysis.cdtAnalysis.dreamTypeRationale}</p>
              </div>
            </div>
          )}
        </section>

        {/* Archetypal Resonances */}
        <section className="card">
          <button
            onClick={() => toggleSection('archetypal')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">Archetypal Resonances</h2>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('archetypal') ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has('archetypal') && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-500 italic">
                These archetypal patterns are offered as possible lenses for reflection, not definitive interpretations.
              </p>

              {/* Threshold */}
              {analysis.archetypalResonances.threshold.present && (
                <div className="p-4 bg-dream-darker rounded-lg border-l-4 border-primary-500">
                  <h3 className="text-sm font-medium text-primary-300 mb-2">Threshold / Transition</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {analysis.archetypalResonances.threshold.elements.map((el, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-primary-500/20 rounded text-primary-300">{el}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">{analysis.archetypalResonances.threshold.reflection}</p>
                </div>
              )}

              {/* Self/Wholeness */}
              {analysis.archetypalResonances.selfWholeness.present && (
                <div className="p-4 bg-dream-darker rounded-lg border-l-4 border-secondary-500">
                  <h3 className="text-sm font-medium text-secondary-300 mb-2">Self / Integration</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {analysis.archetypalResonances.selfWholeness.elements.map((el, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-secondary-500/20 rounded text-secondary-300">{el}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">{analysis.archetypalResonances.selfWholeness.reflection}</p>
                </div>
              )}

              {/* Archetypal Scenarios */}
              {analysis.archetypalResonances.scenarios.length > 0 && (
                <div className="p-4 bg-dream-darker rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Resonant Archetypal Scenarios</h3>
                  <div className="space-y-2">
                    {analysis.archetypalResonances.scenarios.map((scenario, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-lg">{'   '}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-300">{scenario.name}</p>
                          <p className="text-xs text-gray-500">{scenario.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Reflective Prompts */}
        <section className="card bg-gradient-to-br from-dream-card to-dream-darker border-primary-500/30">
          <h2 className="text-lg font-semibold mb-4">Reflective Prompts</h2>
          <p className="text-sm text-gray-500 mb-4">
            These questions are designed to support your personal meaning-making. You are the final authority on your dream's significance.
          </p>
          <div className="space-y-4">
            {analysis.reflectivePrompts.map((prompt, i) => (
              <div key={i} className="p-4 bg-dream-dark/50 rounded-lg">
                <span className="text-xs text-primary-400 uppercase tracking-wide">{prompt.category}</span>
                <p className="text-gray-300 mt-1 mb-2">{prompt.prompt}</p>
                <p className="text-xs text-gray-500">Related to: {prompt.dreamConnection}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4 pb-8">
          <button
            onClick={() => navigate('/analysis')}
            className="btn-primary flex-1"
          >
            Record New Dream
          </button>
          <button
            onClick={() => navigate('/journal')}
            className="btn-ghost flex-1"
          >
            View Dream Journal
          </button>
        </div>
      </div>
    </div>
  )
}
