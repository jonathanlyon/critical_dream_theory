import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { useUser } from '../contexts/UserContext'

// Check if Clerk is available
const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Example dream transcript for demo
const EXAMPLE_DREAM = {
  transcript: `I was walking through a forest at twilight. The trees were impossibly tall, their branches
reaching up into a purple sky. I came to a clearing where there was an old stone well. When I looked
into the well, instead of water, I saw stars - like looking into space. A figure in a hooded cloak
approached me and handed me a golden key. They said, "The door has always been there." Then I woke up.`,
  duration: 45,
  wordCount: 82
}

// Demo analysis result
const DEMO_ANALYSIS = {
  dreamType: 'Generative',
  dreamTypeConfidence: 0.82,
  emotionalTone: 'Mysterious, curious, hopeful',
  manifestContent: {
    characters: ['Dreamer', 'Hooded figure (archetype: Wise Guide)'],
    settings: ['Twilight forest', 'Stone well/portal'],
    keySymbols: ['Golden key', 'Stars in well', 'Purple sky']
  },
  schredlScales: {
    bizarreness: 4,
    emotionalIntensity: 3,
    socialDensity: 2,
    narrativeCoherence: 4
  },
  archetypes: [
    { name: 'Threshold Guardian', confidence: 0.85 },
    { name: 'The Wise Old Man/Woman', confidence: 0.78 },
    { name: 'Call to Adventure', confidence: 0.72 }
  ],
  reflectivePrompts: [
    'What doors in your waking life feel simultaneously present and hidden?',
    'When has a guide or mentor appeared at a crossroads in your life?',
    'What might the stars in the well represent about your inner depths?'
  ]
}

// Processing steps for analysis
const PROCESSING_STEPS = [
  { name: 'Transcribing audio', duration: 800 },
  { name: 'Analyzing emotional prosody', duration: 600 },
  { name: 'Extracting manifest content', duration: 700 },
  { name: 'Applying Schredl scales', duration: 500 },
  { name: 'Detecting cognitive drift patterns', duration: 600 },
  { name: 'Identifying archetypal resonances', duration: 500 },
  { name: 'Generating reflective prompts', duration: 400 }
]

// Inspirational quotes about dreams
const DREAM_QUOTES = [
  { text: "Dreams are the royal road to the unconscious.", author: "Sigmund Freud" },
  { text: "The dream is the small hidden door in the deepest and most intimate sanctum of the soul.", author: "Carl Jung" },
  { text: "Dreams are illustrations from the book your soul is writing about you.", author: "Marsha Norman" },
  { text: "All that we see or seem is but a dream within a dream.", author: "Edgar Allan Poe" },
  { text: "Dreams are today's answers to tomorrow's questions.", author: "Edgar Cayce" }
]

// Demo Player Component
function DemoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [currentQuote, setCurrentQuote] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      // Play - simulate audio playback with timer
      setIsPlaying(true)
      intervalRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= EXAMPLE_DREAM.duration) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setIsPlaying(false)
            return EXAMPLE_DREAM.duration
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setCurrentStep(0)
    setProcessingProgress(0)
    setCurrentQuote(Math.floor(Math.random() * DREAM_QUOTES.length))

    // Simulate processing steps
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setCurrentStep(i)
      setProcessingProgress(((i + 1) / PROCESSING_STEPS.length) * 100)

      // Change quote every 2 steps
      if (i % 2 === 1) {
        setCurrentQuote(prev => (prev + 1) % DREAM_QUOTES.length)
      }

      await new Promise(resolve => setTimeout(resolve, PROCESSING_STEPS[i].duration))
    }

    setIsAnalyzing(false)
    setShowAnalysis(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (currentTime / EXAMPLE_DREAM.duration) * 100

  // Processing view
  if (isAnalyzing) {
    return (
      <div className="max-w-2xl mx-auto card">
        <h3 className="text-xl font-semibold text-center mb-6">Analyzing Your Dream</h3>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-primary-400">{Math.round(processingProgress)}%</span>
          </div>
          <div className="h-3 bg-dream-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>

        {/* Current Task */}
        <div className="bg-dream-darker rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-primary-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Task</p>
              <p className="text-white font-medium">{PROCESSING_STEPS[currentStep]?.name || 'Processing...'}</p>
            </div>
          </div>
        </div>

        {/* Processing Steps List */}
        <div className="bg-dream-darker rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Processing Steps</h4>
          <div className="space-y-2">
            {PROCESSING_STEPS.map((step, index) => (
              <div key={step.name} className="flex items-center gap-2">
                {index < currentStep ? (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                )}
                <span className={`text-sm ${index <= currentStep ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inspirational Quote */}
        <div className="text-center p-4 border border-dream-border rounded-lg">
          <p className="text-gray-300 font-serif italic mb-2">
            "{DREAM_QUOTES[currentQuote].text}"
          </p>
          <p className="text-gray-500 text-sm">— {DREAM_QUOTES[currentQuote].author}</p>
        </div>
      </div>
    )
  }

  if (showAnalysis) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Dream Analysis Demo</h3>
            <button
              onClick={() => {
                setShowAnalysis(false)
                setCurrentTime(0)
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Demo
            </button>
          </div>

          {/* Dream Type */}
          <div className="bg-dream-darker rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Dream Type</span>
              <div className="flex items-center gap-2">
                <span className="text-primary-400 font-medium">{DEMO_ANALYSIS.dreamType}</span>
                <span className="text-xs text-gray-500">({(DEMO_ANALYSIS.dreamTypeConfidence * 100).toFixed(0)}% confidence)</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-gray-400 text-sm">Emotional Tone: </span>
              <span className="text-gray-300 text-sm">{DEMO_ANALYSIS.emotionalTone}</span>
            </div>
          </div>

          {/* Manifest Content */}
          <div className="bg-dream-darker rounded-lg p-4 mb-4">
            <h4 className="text-lg font-medium mb-3">Manifest Content</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Characters: </span>
                <span className="text-gray-300">{DEMO_ANALYSIS.manifestContent.characters.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400">Settings: </span>
                <span className="text-gray-300">{DEMO_ANALYSIS.manifestContent.settings.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400">Key Symbols: </span>
                <span className="text-gray-300">{DEMO_ANALYSIS.manifestContent.keySymbols.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Schredl Scales */}
          <div className="bg-dream-darker rounded-lg p-4 mb-4">
            <h4 className="text-lg font-medium mb-3">Schredl Scales</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(DEMO_ANALYSIS.schredlScales).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-gray-300">{value}/5</span>
                  </div>
                  <div className="h-2 bg-dream-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Archetypal Resonances */}
          <div className="bg-dream-darker rounded-lg p-4 mb-4">
            <h4 className="text-lg font-medium mb-3">Archetypal Resonances</h4>
            <div className="space-y-2">
              {DEMO_ANALYSIS.archetypes.map(archetype => (
                <div key={archetype.name} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{archetype.name}</span>
                  <span className="text-secondary-400 text-sm">{(archetype.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reflective Prompts */}
          <div className="bg-dream-darker rounded-lg p-4">
            <h4 className="text-lg font-medium mb-3">Reflective Prompts</h4>
            <ul className="space-y-3">
              {DEMO_ANALYSIS.reflectivePrompts.map((prompt, i) => (
                <li key={i} className="text-gray-300 text-sm font-serif italic pl-4 border-l-2 border-accent-500/50">
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link to="/analysis">
            <button className="btn-primary text-lg px-8 py-3 touch-target">
              Record Your Own Dream
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto card">
      <p className="text-gray-400 text-center mb-6">
        Listen to an example dream recording and see how CDT analyzes it
        with psychological rigor.
      </p>

      {/* Transcript */}
      <div className="bg-dream-darker rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Dream Transcript</h4>
        <p className="text-gray-300 font-serif text-sm leading-relaxed">
          {EXAMPLE_DREAM.transcript}
        </p>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>{EXAMPLE_DREAM.wordCount} words</span>
          <span>{formatTime(EXAMPLE_DREAM.duration)} duration</span>
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-dream-darker rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center transition-colors touch-target"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            {/* Progress bar */}
            <div className="h-2 bg-dream-border rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(EXAMPLE_DREAM.duration)}</span>
            </div>
          </div>
        </div>

        {/* Voice Visualizer (simulated) */}
        <div className="flex items-center justify-center gap-1 mt-4 h-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-primary-500/50 rounded-full transition-all duration-150 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{
                height: isPlaying
                  ? `${Math.random() * 100}%`
                  : '20%',
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Analyze Button */}
      <div className="text-center">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="btn-primary touch-target px-8 py-3 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Dream...
            </span>
          ) : (
            'Analyze Dream'
          )}
        </button>
      </div>
    </div>
  )
}

// Fallback auth buttons for development
function DevAuthButtons() {
  const { signIn } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the intended destination from state (if redirected here)
  const from = (location.state as any)?.from?.pathname || '/analysis'
  const showSignInPrompt = (location.state as any)?.showSignIn

  const handleSignIn = () => {
    signIn()
    navigate(from, { replace: true })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {showSignInPrompt && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-4 max-w-md">
          <p className="text-amber-200 text-sm text-center">
            Please sign in to access that page.
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleSignIn}
          className="btn-primary text-lg px-8 py-3 touch-target"
        >
          Start Recording Dreams
        </button>
        <button
          onClick={handleSignIn}
          className="btn-ghost text-lg px-8 py-3 touch-target"
        >
          Sign In (Dev Mode)
        </button>
      </div>
    </div>
  )
}

// Production auth buttons with Clerk
function ClerkAuthButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <SignUpButton mode="modal">
        <button className="btn-primary text-lg px-8 py-3 touch-target">
          Start Recording Dreams
        </button>
      </SignUpButton>
      <SignInButton mode="modal">
        <button className="btn-ghost text-lg px-8 py-3 touch-target">
          Sign In
        </button>
      </SignInButton>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dream-dark">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/50 via-transparent to-dream-dark" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Cognitive Dream Theory</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 font-serif">
              Voice-record your dreams and receive psychologically-grounded reflections
              based on CDT, Schredl manifest content coding, and Jungian archetypal frameworks.
            </p>
            {CLERK_AVAILABLE ? <ClerkAuthButtons /> : <DevAuthButtons />}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-dream-darker/50" id="demo">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Try the Experience
          </h2>
          <DemoPlayer />
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Subscription Tiers
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto font-serif italic">
            "Dream reflection time is intentionally limited. Insight emerges through attention, not volume."
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* First Recall - Free */}
            <div className="card text-center">
              <h3 className="text-xl font-semibold mb-2">First Recall</h3>
              <p className="text-accent-400 font-medium mb-4">Free</p>
              <p className="text-3xl font-bold mb-2">1 min</p>
              <p className="text-gray-400 text-sm">one-time analysis</p>
              <p className="text-gray-500 mt-4 text-sm">Try the experience</p>
            </div>

            {/* Noticing */}
            <div className="card text-center">
              <h3 className="text-xl font-semibold mb-2">Noticing</h3>
              <p className="text-primary-400 font-medium mb-4">Tier 1</p>
              <p className="text-3xl font-bold mb-2">10 min</p>
              <p className="text-gray-400 text-sm">per month</p>
              <p className="text-gray-500 mt-4 text-sm">Brief reflections & emotional tagging</p>
            </div>

            {/* Patterning */}
            <div className="card text-center border-primary-500/50">
              <h3 className="text-xl font-semibold mb-2">Patterning</h3>
              <p className="text-secondary-400 font-medium mb-4">Tier 2</p>
              <p className="text-3xl font-bold mb-2">20 min</p>
              <p className="text-gray-400 text-sm">per month</p>
              <p className="text-gray-500 mt-4 text-sm">Recurring themes & continuity tracking</p>
            </div>

            {/* Integration */}
            <div className="card text-center">
              <h3 className="text-xl font-semibold mb-2">Integration</h3>
              <p className="text-accent-400 font-medium mb-4">Tier 3</p>
              <p className="text-3xl font-bold mb-2">30 min</p>
              <p className="text-gray-400 text-sm">per month</p>
              <p className="text-gray-500 mt-4 text-sm">Deeper narrative & emotional synthesis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-dream-border">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2024 Cognitive Dream Theory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
