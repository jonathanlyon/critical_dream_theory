export default function Settings() {
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
          <div className="flex justify-end gap-4">
            <button className="btn-ghost touch-target">Cancel</button>
            <button className="btn-primary touch-target">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  )
}
