import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useRecordingLimit, TIER_CONFIGS, SubscriptionTier } from '../contexts/UserContext'

// Recording Preview Component
function RecordingPreview({
  duration,
  onReRecord,
  onAnalyze,
  isAnalyzing
}: {
  duration: number
  onReRecord: () => void
  onAnalyze: () => void
  isAnalyzing: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlayback = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      intervalRef.current = window.setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= duration) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const progress = (playbackTime / duration) * 100

  return (
    <div className="w-full max-w-md card mb-8">
      <h3 className="text-lg font-medium mb-4">Recording Complete</h3>

      {/* Audio Preview Player */}
      <div className="bg-dream-darker rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayback}
            className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center transition-colors touch-target"
            aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
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
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Simulated waveform */}
        <div className="flex items-center justify-center gap-0.5 mt-4 h-8">
          {Array.from({ length: 50 }).map((_, i) => {
            const isActive = (i / 50) * 100 <= progress
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isActive ? 'bg-primary-500' : 'bg-gray-700'
                }`}
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 20}%`
                }}
              />
            )
          })}
        </div>
      </div>

      <p className="text-gray-400 mb-4 text-sm">Duration: {formatTime(duration)}</p>

      <div className="flex gap-4">
        <button
          onClick={onReRecord}
          className="btn-ghost flex-1"
          disabled={isAnalyzing}
        >
          Re-record
        </button>
        <button
          onClick={onAnalyze}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Dream'
          )}
        </button>
      </div>
    </div>
  )
}

export default function DreamAnalysis() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const timerRef = useRef<number | null>(null)
  const analyzeClickedRef = useRef(false)

  // Get tier-based recording limit
  const { maxSeconds } = useRecordingLimit()
  const { tier, setTier, tierConfig, isDevMode } = useUser()
  const maxTime = maxSeconds

  // Simulated audio levels for visualization
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(32).fill(0.2))

  // Optional context state
  const [sleepQuality, setSleepQuality] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedLifeEvents, setSelectedLifeEvents] = useState<string[]>([])
  const [sleepMode, setSleepMode] = useState<'quick' | 'detailed'>('quick')
  const [detailedSleepResponses, setDetailedSleepResponses] = useState<Record<number, boolean | null>>({})

  // Groningen Sleep Quality Questionnaire - all 15 questions
  const SLEEP_QUESTIONS = [
    { id: 1, text: 'I had a deep sleep last night', reverse: false },
    { id: 2, text: 'I feel like I slept poorly last night', reverse: false },
    { id: 3, text: 'It took me more than half an hour to fall asleep last night', reverse: false },
    { id: 4, text: 'I felt tired after waking up this morning', reverse: false },
    { id: 5, text: 'I woke up several times last night', reverse: false },
    { id: 6, text: 'I feel like I didn\'t get enough sleep last night', reverse: false },
    { id: 7, text: 'I got up in the middle of the night', reverse: false },
    { id: 8, text: 'I felt rested after waking up this morning', reverse: true },
    { id: 9, text: 'I feel like I only had a couple hours of sleep last night', reverse: false },
    { id: 10, text: 'I feel I slept well last night', reverse: true },
    { id: 11, text: 'I didn\'t sleep a wink last night', reverse: false },
    { id: 12, text: 'I didn\'t have any trouble falling asleep last night', reverse: true },
    { id: 13, text: 'After I woke up last night, I had trouble falling asleep again', reverse: false },
    { id: 14, text: 'I tossed and turned all night last night', reverse: false },
    { id: 15, text: 'I didn\'t get more than 5 hours sleep last night', reverse: false }
  ]

  const toggleLifeEvent = (event: string) => {
    setSelectedLifeEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  const setSleepResponse = (questionId: number, value: boolean) => {
    setDetailedSleepResponses(prev => ({ ...prev, [questionId]: value }))
  }

  // Calculate sleep quality score (0-15, lower = better sleep)
  const calculateSleepScore = () => {
    const answeredCount = Object.keys(detailedSleepResponses).length
    if (answeredCount === 0) return null

    let score = 0
    SLEEP_QUESTIONS.forEach(q => {
      const response = detailedSleepResponses[q.id]
      if (response !== null && response !== undefined) {
        // For reverse questions, "true" = good sleep (0 points)
        // For normal questions, "true" = poor sleep (1 point)
        if (q.reverse) {
          score += response ? 0 : 1
        } else {
          score += response ? 1 : 0
        }
      }
    })
    return { score, answeredCount, total: 15 }
  }

  useEffect(() => {
    let animationFrame: number

    if (isRecording && !isPaused) {
      const animate = () => {
        setAudioLevels(prev => prev.map(() => 0.2 + Math.random() * 0.8))
        animationFrame = requestAnimationFrame(animate)
      }
      animate()
    } else {
      setAudioLevels(Array(32).fill(0.2))
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [isRecording, isPaused])

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxTime) {
            stopRecording()
            return maxTime
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording, isPaused])

  const startRecording = () => {
    setShowCountdown(true)
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowCountdown(false)
          setIsRecording(true)
          setRecordingTime(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingTime = maxTime - recordingTime

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Voice Synthesizer Visualization */}
      <div className="voice-visualizer w-full max-w-md mb-8 flex items-center justify-center relative">
        {/* Circular glow background */}
        <div className={`absolute inset-0 flex items-center justify-center ${isRecording && !isPaused ? 'animate-pulse' : ''}`}>
          <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-primary-600/20 to-secondary-600/20 blur-3xl ${isRecording ? 'opacity-100' : 'opacity-50'}`} />
        </div>

        {/* Voice bars visualization */}
        <div className="relative flex items-center justify-center gap-1 h-40">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-primary-500 to-secondary-400 rounded-full transition-all duration-75"
              style={{
                height: `${level * 100}%`,
                opacity: isRecording && !isPaused ? 1 : 0.3
              }}
            />
          ))}
        </div>

        {/* Countdown overlay */}
        {showCountdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-dream-dark/80 rounded-lg">
            <div className="text-center">
              <div className="text-7xl font-bold text-primary-400 animate-ping">{countdown}</div>
              <p className="text-gray-400 mt-4">Get ready to record...</p>
            </div>
          </div>
        )}
      </div>

      {/* Record/Stop/Pause Controls */}
      {!isRecording ? (
        <>
          <button
            onClick={startRecording}
            className="record-button record-button-pulse touch-target mb-6"
            aria-label="Record your dream"
            disabled={showCountdown}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="6" />
            </svg>
          </button>
          <p className="text-gray-400 mb-8">Record Your Dream</p>
        </>
      ) : (
        <div className="flex items-center gap-4 mb-6">
          {/* Pause/Resume Button */}
          <button
            onClick={togglePause}
            className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center transition-colors touch-target"
            aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            {isPaused ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors touch-target"
            aria-label="Stop recording"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      )}

      {/* Recording status */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-gray-300">{isPaused ? 'Paused' : 'Recording...'}</span>
        </div>
      )}

      {/* Time Display */}
      <div className="text-center mb-8">
        {isRecording ? (
          <>
            <p className="text-sm text-gray-500">Recording time</p>
            <p className="text-2xl font-mono text-red-400">{formatTime(recordingTime)}</p>
            <p className="text-sm text-gray-500 mt-2">Time remaining: {formatTime(remainingTime)}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">Time remaining</p>
            <p className="text-2xl font-mono text-primary-400">{formatTime(maxTime)}</p>
            <p className="text-xs text-gray-600 mt-1">{tierConfig.displayName} tier: {tierConfig.maxMinutes} min max</p>
          </>
        )}
      </div>

      {/* Dev Mode Tier Switcher */}
      {isDevMode && !isRecording && recordingTime === 0 && (
        <div className="w-full max-w-md mb-6">
          <p className="text-xs text-gray-500 text-center mb-2">Dev Mode: Switch subscription tier</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(TIER_CONFIGS) as SubscriptionTier[]).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  tier === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-dream-border text-gray-400 hover:bg-dream-border/80'
                }`}
              >
                {TIER_CONFIGS[t].displayName} ({TIER_CONFIGS[t].maxMinutes}m)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* After recording - show preview */}
      {!isRecording && recordingTime > 0 && (
        <RecordingPreview
          duration={recordingTime}
          onReRecord={() => {
            if (!isAnalyzing) {
              setRecordingTime(0)
              analyzeClickedRef.current = false
            }
          }}
          onAnalyze={() => {
            // Double-click protection - only process if not already analyzing
            if (analyzeClickedRef.current || isAnalyzing) {
              return
            }
            analyzeClickedRef.current = true
            setIsAnalyzing(true)
            // Navigate to analysis results
            navigate('/analysis/results', { state: { fromRecording: true } })
          }}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Optional Context (Collapsible) */}
      <details className="w-full max-w-md">
        <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors mb-4">
          Add optional context (sleep quality, mood, life events)
        </summary>
        <div className="card space-y-6">
          {/* Sleep Quality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Sleep Quality</h4>
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setSleepMode('quick')}
                  className={`px-2 py-1 rounded-l-full transition-colors ${
                    sleepMode === 'quick'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dream-border text-gray-400 hover:bg-dream-border/80'
                  }`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setSleepMode('detailed')}
                  className={`px-2 py-1 rounded-r-full transition-colors ${
                    sleepMode === 'detailed'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dream-border text-gray-400 hover:bg-dream-border/80'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>

            {sleepMode === 'quick' ? (
              <>
                <p className="text-xs text-gray-500 mb-3">Tap to answer</p>
                <div className="space-y-2">
                  {[
                    { id: 'deep', text: 'I had a deep sleep last night' },
                    { id: 'poor', text: 'I feel like I slept poorly last night' },
                    { id: 'rested', text: 'I felt rested after waking up this morning' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSleepQuality(option.id)}
                      className={`w-full text-left text-sm px-4 py-3 rounded-lg border transition-colors ${
                        sleepQuality === option.id
                          ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                          : 'border-dream-border bg-dream-darker text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Groningen Sleep Quality Questionnaire - answer Yes/No for each
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {SLEEP_QUESTIONS.map((question, index) => {
                    const response = detailedSleepResponses[question.id]
                    return (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-dream-darker border border-dream-border"
                      >
                        <span className="text-xs text-gray-500 mt-1">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 mb-2">
                            {question.text}
                            {question.reverse && (
                              <span className="ml-1 text-xs text-primary-400">(positive)</span>
                            )}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSleepResponse(question.id, true)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                response === true
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-dream-border text-gray-400 hover:bg-dream-border/80'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setSleepResponse(question.id, false)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                response === false
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-dream-border text-gray-400 hover:bg-dream-border/80'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Sleep Score Display */}
                {(() => {
                  const scoreData = calculateSleepScore()
                  if (!scoreData) return null
                  const qualityLabel =
                    scoreData.score <= 3 ? 'Excellent' :
                    scoreData.score <= 6 ? 'Good' :
                    scoreData.score <= 9 ? 'Fair' :
                    scoreData.score <= 12 ? 'Poor' : 'Very Poor'
                  const qualityColor =
                    scoreData.score <= 3 ? 'text-green-400' :
                    scoreData.score <= 6 ? 'text-blue-400' :
                    scoreData.score <= 9 ? 'text-yellow-400' :
                    scoreData.score <= 12 ? 'text-orange-400' : 'text-red-400'
                  return (
                    <div className="mt-4 p-3 rounded-lg bg-dream-darker border border-dream-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Sleep Quality Score:</span>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${qualityColor}`}>
                            {scoreData.score}/{scoreData.total}
                          </span>
                          <span className={`ml-2 text-sm ${qualityColor}`}>
                            ({qualityLabel})
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {scoreData.answeredCount}/15 questions answered
                      </p>
                    </div>
                  )
                })()}
              </>
            )}
          </div>

          {/* Mood */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Current Mood</h4>
            <div className="flex flex-wrap gap-2">
              {['Anxious', 'Sad', 'Calm', 'Happy', 'Angry', 'Neutral'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                    selectedMood === mood
                      ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                      : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Life Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Life Events</h4>
            <p className="text-xs text-gray-500 mb-3">Select any that apply</p>
            <div className="space-y-4">
              {/* Relationships */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Relationships</p>
                <div className="flex flex-wrap gap-2">
                  {['New relationship', 'Breakup', 'Marriage/Wedding', 'Conflict with loved one'].map((event) => (
                    <button
                      key={event}
                      onClick={() => toggleLifeEvent(event)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                        selectedLifeEvents.includes(event)
                          ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                          : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              {/* Family */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Family</p>
                <div className="flex flex-wrap gap-2">
                  {['Birth', 'Death', 'Illness (self/family)'].map((event) => (
                    <button
                      key={event}
                      onClick={() => toggleLifeEvent(event)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                        selectedLifeEvents.includes(event)
                          ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                          : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work/Career */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Work/Career</p>
                <div className="flex flex-wrap gap-2">
                  {['New job', 'Promotion', 'Fired/Laid off', 'Major project/deadline'].map((event) => (
                    <button
                      key={event}
                      onClick={() => toggleLifeEvent(event)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                        selectedLifeEvents.includes(event)
                          ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                          : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Financial</p>
                <div className="flex flex-wrap gap-2">
                  {['Financial stress', 'Major purchase', 'Windfall'].map((event) => (
                    <button
                      key={event}
                      onClick={() => toggleLifeEvent(event)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                        selectedLifeEvents.includes(event)
                          ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                          : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              {/* Life Transitions */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Life Transitions</p>
                <div className="flex flex-wrap gap-2">
                  {['Moving home', 'Travel', 'Graduation', 'Retirement'].map((event) => (
                    <button
                      key={event}
                      onClick={() => toggleLifeEvent(event)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                        selectedLifeEvents.includes(event)
                          ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                          : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health/Wellbeing */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Health/Wellbeing</p>
                <div className="flex flex-wrap gap-2">
                  {['Depression', 'Anxiety', 'Recovery', 'New diagnosis'].map((event) => (
                    <button
                      key={event}
                      onClick={() => toggleLifeEvent(event)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                        selectedLifeEvents.includes(event)
                          ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                          : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Other</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleLifeEvent('Other')}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors touch-target ${
                      selectedLifeEvents.includes('Other')
                        ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300'
                        : 'border-dream-border bg-dream-darker text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary of selections */}
          {(sleepQuality || selectedMood || selectedLifeEvents.length > 0) && (
            <div className="pt-4 border-t border-dream-border">
              <p className="text-xs text-gray-500 mb-2">Context saved:</p>
              <div className="flex flex-wrap gap-1">
                {sleepQuality && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-300">
                    Sleep: {sleepQuality}
                  </span>
                )}
                {selectedMood && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-300">
                    Mood: {selectedMood}
                  </span>
                )}
                {selectedLifeEvents.map(event => (
                  <span key={event} className="text-xs px-2 py-1 rounded-full bg-secondary-500/20 text-secondary-300">
                    {event}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
