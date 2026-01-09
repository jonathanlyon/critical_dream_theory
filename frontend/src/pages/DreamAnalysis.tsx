import { useState, useEffect, useRef } from 'react'

export default function DreamAnalysis() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const maxTime = 180 // 3 minutes in seconds
  const timerRef = useRef<number | null>(null)

  // Simulated audio levels for visualization
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(32).fill(0.2))

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
          </>
        )}
      </div>

      {/* After recording - show preview */}
      {!isRecording && recordingTime > 0 && (
        <div className="w-full max-w-md card mb-8">
          <h3 className="text-lg font-medium mb-4">Recording Complete</h3>
          <p className="text-gray-400 mb-4">Duration: {formatTime(recordingTime)}</p>
          <div className="flex gap-4">
            <button
              onClick={() => setRecordingTime(0)}
              className="btn-ghost flex-1"
            >
              Re-record
            </button>
            <button className="btn-primary flex-1">
              Analyze Dream
            </button>
          </div>
        </div>
      )}

      {/* Optional Context (Collapsible) */}
      <details className="w-full max-w-md">
        <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors mb-4">
          Add optional context (sleep quality, mood, life events)
        </summary>
        <div className="card space-y-6">
          {/* Sleep Quality Quick */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Sleep Quality (Quick)</h4>
            <p className="text-xs text-gray-500 mb-3">Tap to answer</p>
            <div className="space-y-2">
              <button className="btn-ghost w-full text-left text-sm">
                I had a deep sleep last night
              </button>
              <button className="btn-ghost w-full text-left text-sm">
                I feel like I slept poorly last night
              </button>
              <button className="btn-ghost w-full text-left text-sm">
                I felt rested after waking up this morning
              </button>
            </div>
          </div>

          {/* Mood */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Current Mood</h4>
            <div className="flex flex-wrap gap-2">
              {['Anxious', 'Sad', 'Calm', 'Happy', 'Angry', 'Neutral'].map((mood) => (
                <button
                  key={mood}
                  className="btn-ghost text-sm px-3 py-1 touch-target"
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
            <div className="flex flex-wrap gap-2">
              {['New relationship', 'Work stress', 'Family change', 'Health concern', 'Travel', 'Other'].map((event) => (
                <button
                  key={event}
                  className="btn-ghost text-sm px-3 py-1 touch-target"
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
