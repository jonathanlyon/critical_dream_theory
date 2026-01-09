import { useState, useEffect, useRef, useCallback } from 'react'

// Settings storage key
const SETTINGS_KEY = 'cdt_user_settings'

interface MicrophoneDevice {
  deviceId: string
  label: string
}

interface UserSettings {
  notifications: {
    recordingReminders: boolean
    weeklySummary: boolean
    milestones: boolean
  }
  recording: {
    preferredMicrophone: string
  }
}

const defaultSettings: UserSettings = {
  notifications: {
    recordingReminders: false,
    weeklySummary: false,
    milestones: false
  },
  recording: {
    preferredMicrophone: ''
  }
}

function loadSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Error loading settings:', e)
  }
  return defaultSettings
}

function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Error saving settings:', e)
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Microphone state
  const [microphones, setMicrophones] = useState<MicrophoneDevice[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // Enumerate available microphones
  const enumerateMicrophones = useCallback(async () => {
    try {
      // Request permission first to get labeled devices
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop())
        })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
        }))

      setMicrophones(audioInputs)
      setMicError(null)
    } catch (err) {
      console.error('Error enumerating microphones:', err)
      setMicError('Could not access microphones. Please grant permission.')
    }
  }, [])

  // Load microphones on mount
  useEffect(() => {
    enumerateMicrophones()
  }, [enumerateMicrophones])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicTest()
    }
  }, [])

  // Stop microphone test
  const stopMicTest = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    analyserRef.current = null
    setIsTesting(false)
    setAudioLevel(0)
  }, [])

  // Start microphone test
  const startMicTest = async () => {
    try {
      setMicError(null)

      // Get the selected microphone or use default
      const constraints: MediaStreamConstraints = {
        audio: settings.recording.preferredMicrophone
          ? { deviceId: { exact: settings.recording.preferredMicrophone } }
          : true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream

      // Set up audio analysis
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      setIsTesting(true)

      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const normalizedLevel = Math.min(100, (average / 128) * 100)
        setAudioLevel(normalizedLevel)

        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (isTesting) {
          stopMicTest()
        }
      }, 10000)

    } catch (err) {
      console.error('Error testing microphone:', err)
      setMicError('Could not access microphone. Please check permissions.')
      setIsTesting(false)
    }
  }

  const handleMicTest = () => {
    if (isTesting) {
      stopMicTest()
    } else {
      startMicTest()
    }
  }

  const handleNotificationChange = (key: keyof UserSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    setIsSaving(true)

    // Simulate save delay for UX
    setTimeout(() => {
      saveSettings(settings)
      setIsSaving(false)
      setHasChanges(false)
      setShowSaved(true)

      // Hide success message after 2 seconds
      setTimeout(() => setShowSaved(false), 2000)
    }, 300)
  }

  const handleCancel = () => {
    setSettings(loadSettings())
    setHasChanges(false)
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 mb-8">
          Customize your dream recording experience
        </p>

        <div className="space-y-8">
          {/* Notification Preferences */}
          <section className="card">
            <h2 className="text-xl font-semibold text-white mb-6">
              Notification Preferences
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-200">Recording Reminders</p>
                  <p className="text-sm text-gray-500">Get reminded to record your dreams</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.recordingReminders}
                  onChange={() => handleNotificationChange('recordingReminders')}
                  className="w-5 h-5 rounded border-dream-border bg-dream-darker text-primary-500 focus:ring-primary-500 touch-target"
                  aria-label="Enable recording reminders"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-200">Weekly Summary</p>
                  <p className="text-sm text-gray-500">Receive weekly dream pattern summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.weeklySummary}
                  onChange={() => handleNotificationChange('weeklySummary')}
                  className="w-5 h-5 rounded border-dream-border bg-dream-darker text-primary-500 focus:ring-primary-500 touch-target"
                  aria-label="Enable weekly summary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-200">Milestone Notifications</p>
                  <p className="text-sm text-gray-500">Get notified of dream journaling milestones</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.milestones}
                  onChange={() => handleNotificationChange('milestones')}
                  className="w-5 h-5 rounded border-dream-border bg-dream-darker text-primary-500 focus:ring-primary-500 touch-target"
                  aria-label="Enable milestone notifications"
                />
              </label>
            </div>
          </section>

          {/* Recording Setup */}
          <section className="card">
            <h2 className="text-xl font-semibold text-white mb-6">
              Recording Setup
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="microphone" className="block font-medium text-gray-200 mb-2">
                  Microphone Selection
                </label>
                <select
                  id="microphone"
                  className="input"
                  aria-label="Select microphone"
                  value={settings.recording.preferredMicrophone}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      recording: { ...prev.recording, preferredMicrophone: e.target.value }
                    }))
                    setHasChanges(true)
                    // Stop any ongoing test when changing microphone
                    if (isTesting) stopMicTest()
                  }}
                >
                  <option value="">Default Microphone</option>
                  {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </option>
                  ))}
                </select>
                {microphones.length === 0 && !micError && (
                  <p className="text-sm text-gray-500 mt-1">
                    Loading available microphones...
                  </p>
                )}
                {microphones.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {microphones.length} microphone{microphones.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              <div>
                <p className="font-medium text-gray-200 mb-2">Microphone Test</p>
                <div className="flex items-center gap-4">
                  <button
                    className={`touch-target ${isTesting ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={handleMicTest}
                    aria-label={isTesting ? 'Stop microphone test' : 'Test microphone'}
                  >
                    {isTesting ? 'Stop Test' : 'Test Microphone'}
                  </button>
                  <div className="flex-1 h-3 bg-dream-darker rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        audioLevel > 70 ? 'bg-gradient-to-r from-yellow-500 to-red-500' :
                        audioLevel > 30 ? 'bg-gradient-to-r from-green-500 to-yellow-500' :
                        'bg-gradient-to-r from-green-500 to-green-400'
                      }`}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
                {micError ? (
                  <p className="text-sm text-red-400 mt-2">{micError}</p>
                ) : isTesting ? (
                  <p className="text-sm text-green-400 mt-2">
                    🎤 Listening... Speak to see audio levels (auto-stops in 10s)
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Test Microphone" and speak to see audio levels
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            {showSaved && (
              <span className="text-green-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Settings saved!
              </span>
            )}
            <button
              className="btn-ghost touch-target"
              onClick={handleCancel}
              disabled={!hasChanges}
            >
              Cancel
            </button>
            <button
              className="btn-primary touch-target"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
