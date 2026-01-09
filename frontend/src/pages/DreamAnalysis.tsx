export default function DreamAnalysis() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Voice Synthesizer Visualization */}
      <div className="voice-visualizer w-full max-w-md mb-8 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">Voice Synthesizer</p>
          <p className="text-sm">Visualization coming soon</p>
        </div>
      </div>

      {/* Record Button */}
      <button
        className="record-button record-button-pulse touch-target mb-6"
        aria-label="Record your dream"
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

      {/* Time Remaining */}
      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">Time remaining</p>
        <p className="text-2xl font-mono text-primary-400">3:00</p>
      </div>

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
