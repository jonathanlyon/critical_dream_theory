import { useUser } from '@clerk/clerk-react'

export default function Account() {
  const { user } = useUser()

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
        <p className="text-gray-400 mb-8">
          Manage your profile and subscription
        </p>

        <div className="space-y-8">
          {/* Profile Information */}
          <section className="card">
            <h2 className="text-xl font-semibold text-white mb-6">
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block font-medium text-gray-200 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="input"
                  defaultValue={user?.fullName || ''}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-medium text-gray-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="input"
                  defaultValue={user?.emailAddresses[0]?.emailAddress || ''}
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email is managed through your authentication provider
                </p>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="card">
            <h2 className="text-xl font-semibold text-white mb-6">
              Subscription
            </h2>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-medium text-gray-200">Current Tier</p>
                <p className="text-2xl font-bold text-primary-400">First Recall</p>
                <p className="text-sm text-gray-500">Free tier - 1 minute one-time</p>
              </div>
              <button className="btn-primary touch-target">
                Upgrade
              </button>
            </div>
            <button className="btn-ghost w-full touch-target">
              Manage Subscription
            </button>
          </section>

          {/* Usage */}
          <section className="card">
            <h2 className="text-xl font-semibold text-white mb-6">
              Monthly Usage
            </h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Minutes Used</span>
                <span className="font-mono text-primary-400">0:00 / 1:00</span>
              </div>
              <div className="h-3 bg-dream-darker rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Usage resets on the 1st of each month
            </p>
          </section>

          {/* Data Export */}
          <section className="card">
            <h2 className="text-xl font-semibold text-white mb-6">
              Data Export
            </h2>
            <p className="text-gray-400 mb-4">
              Download all your dreams and analyses as a PDF document.
            </p>
            <button className="btn-secondary touch-target">
              Export as PDF
            </button>
          </section>

          {/* Danger Zone */}
          <section className="card border-red-900/50">
            <h2 className="text-xl font-semibold text-red-400 mb-6">
              Danger Zone
            </h2>
            <p className="text-gray-400 mb-4">
              Permanently delete your account and all associated data.
              This action cannot be undone.
            </p>
            <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 touch-target">
              Delete Account
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
