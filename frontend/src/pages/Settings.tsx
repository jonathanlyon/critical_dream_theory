import { useState, useEffect } from 'react'

// Settings storage key
const SETTINGS_KEY = 'cdt_user_settings'

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

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

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
                  }}
                >
                  <option value="">Default Microphone</option>
                  {/* Microphone options would be populated dynamically */}
                </select>
              </div>

              <div>
                <p className="font-medium text-gray-200 mb-2">Microphone Test</p>
                <div className="flex items-center gap-4">
                  <button className="btn-secondary touch-target">
                    Test Microphone
                  </button>
                  <div className="flex-1 h-3 bg-dream-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Test Microphone" and speak to see audio levels
                </p>
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
