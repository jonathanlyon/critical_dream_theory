import { useState, useEffect } from 'react'
import { MOCK_DREAMS } from '../lib/dreamData'
import { exportDreamsToPDF } from '../lib/pdfExport'

// Dev mode toggle
const DEV_MODE = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Account storage key
const ACCOUNT_KEY = 'cdt_user_account'

interface UserAccount {
  name: string
  email: string
  tier: 'free' | 'tier1' | 'tier2' | 'tier3'
  minutesUsed: number
  minutesLimit: number
}

const defaultAccount: UserAccount = {
  name: 'Dreamer',
  email: 'dreamer@example.com',
  tier: 'free',
  minutesUsed: 0,
  minutesLimit: 1
}

const tierInfo = {
  free: { name: 'First Recall', description: 'Free tier - 1 minute one-time', limit: 1 },
  tier1: { name: 'Noticing', description: '10 minutes per month', limit: 10 },
  tier2: { name: 'Patterning', description: '20 minutes per month', limit: 20 },
  tier3: { name: 'Integration', description: '30 minutes per month', limit: 30 }
}

function loadAccount(): UserAccount {
  try {
    const saved = localStorage.getItem(ACCOUNT_KEY)
    if (saved) {
      return { ...defaultAccount, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Error loading account:', e)
  }
  return defaultAccount
}

function saveAccount(account: UserAccount): void {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  } catch (e) {
    console.error('Error saving account:', e)
  }
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function Account() {
  const [account, setAccount] = useState<UserAccount>(defaultAccount)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // Load account on mount
  useEffect(() => {
    const loaded = loadAccount()
    setAccount(loaded)
    setEditName(loaded.name)
    setEditEmail(loaded.email)
  }, [])

  const handleSave = () => {
    // Validate email before saving (in dev mode where email is editable)
    if (DEV_MODE && editEmail !== account.email) {
      if (!isValidEmail(editEmail)) {
        setEmailError('Please enter a valid email address')
        return
      }
    }

    setEmailError(null)
    setIsSaving(true)

    setTimeout(() => {
      const updatedAccount = {
        ...account,
        name: editName,
        ...(DEV_MODE && { email: editEmail })
      }
      saveAccount(updatedAccount)
      setAccount(updatedAccount)
      setIsSaving(false)
      setIsEditing(false)
      setShowSaved(true)

      setTimeout(() => setShowSaved(false), 2000)
    }, 300)
  }

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEditEmail(newEmail)

    // Clear error when user starts typing valid format
    if (emailError && isValidEmail(newEmail)) {
      setEmailError(null)
    }
  }

  const handleCancel = () => {
    setEditName(account.name)
    setEditEmail(account.email)
    setEmailError(null)
    setIsEditing(false)
  }

  const handleDeleteAccount = () => {
    // In dev mode, just clear localStorage
    localStorage.removeItem(ACCOUNT_KEY)
    localStorage.removeItem('cdt_user_settings')
    setShowDeleteConfirm(false)
    // Reset to defaults
    setAccount(defaultAccount)
    setEditName(defaultAccount.name)
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      // In dev mode, use mock dreams; in production, this would fetch from the database
      await exportDreamsToPDF(MOCK_DREAMS, {
        userName: account.name,
        includeAnalysis: true,
        includeSummary: true,
      })
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const currentTier = tierInfo[account.tier]
  const usagePercent = (account.minutesUsed / account.minutesLimit) * 100

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
        <p className="text-gray-400 mb-8">
          Manage your profile and subscription
        </p>

        {/* Dev mode indicator */}
        {DEV_MODE && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
            ⚠️ Dev Mode: Account data is stored locally. In production, this would sync with your authentication provider.
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Information */}
          <section className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Profile Information
              </h2>
              {showSaved && (
                <span className="text-green-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Saved!
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block font-medium text-gray-200 mb-2">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    aria-label="Edit name"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white text-lg">{account.name}</span>
                    <button
                      className="btn-ghost text-sm"
                      onClick={() => setIsEditing(true)}
                      aria-label="Edit profile"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <button
                    className="btn-ghost touch-target"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary touch-target"
                    onClick={handleSave}
                    disabled={
                      isSaving ||
                      !editName.trim() ||
                      (editName === account.name && editEmail === account.email)
                    }
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {!editName.trim() && editName.length > 0 && (
                    <span className="text-red-400 text-sm self-center">Name cannot be empty or whitespace only</span>
                  )}
                  {emailError && (
                    <span className="text-red-400 text-sm self-center">{emailError}</span>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block font-medium text-gray-200 mb-2">
                  Email
                </label>
                {DEV_MODE && isEditing ? (
                  <>
                    <input
                      type="email"
                      id="email"
                      className={`input ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      value={editEmail}
                      onChange={handleEmailChange}
                      placeholder="your@email.com"
                      aria-label="Email address"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'email-error' : undefined}
                    />
                    {emailError && (
                      <p id="email-error" className="text-sm text-red-400 mt-1" role="alert">
                        {emailError}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Dev Mode: Email is editable for testing
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      type="email"
                      id="email"
                      className="input bg-dream-darker/50"
                      value={account.email}
                      disabled
                      aria-label="Email address (read only)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {DEV_MODE
                        ? 'Click Edit to modify email (Dev Mode)'
                        : 'Email is managed through your authentication provider'}
                    </p>
                  </>
                )}
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
                <p className="text-2xl font-bold text-primary-400">{currentTier.name}</p>
                <p className="text-sm text-gray-500">{currentTier.description}</p>
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
                <span className="font-mono text-primary-400">
                  {account.minutesUsed}:00 / {account.minutesLimit}:00
                </span>
              </div>
              <div className="h-3 bg-dream-darker rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    usagePercent > 90 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                    usagePercent > 70 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                    'bg-gradient-to-r from-primary-600 to-primary-400'
                  }`}
                  style={{ width: `${Math.min(100, usagePercent)}%` }}
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
            <div className="flex items-center gap-4">
              <button
                className="btn-secondary touch-target flex items-center gap-2"
                onClick={handleExportPDF}
                disabled={isExporting}
                aria-label="Export dreams as PDF"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as PDF
                  </>
                )}
              </button>
              {exportSuccess && (
                <span className="text-green-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  PDF Downloaded!
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Includes {MOCK_DREAMS.length} dreams with full analyses
            </p>
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
            {showDeleteConfirm ? (
              <div className="bg-red-950/50 border border-red-900 rounded-lg p-4">
                <p className="text-red-300 mb-4">
                  Are you sure you want to delete your account? All your dreams and data will be permanently lost.
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn-ghost touch-target"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger touch-target"
                    onClick={handleDeleteAccount}
                  >
                    Yes, Delete My Account
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-danger touch-target"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
