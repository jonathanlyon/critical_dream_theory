import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import * as ClerkReact from '@clerk/clerk-react'

// Check if Clerk is available
const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

interface AuthenticatedLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dream Analysis', href: '/analysis', icon: MicIcon },
  { name: 'Dream Journal', href: '/journal', icon: BookIcon },
  { name: 'Dream Insights', href: '/insights', icon: SparklesIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Account', href: '/account', icon: UserIcon },
]

// Dev mode user avatar placeholder
function DevUserAvatar() {
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
      <span className="text-white text-sm font-bold">D</span>
    </div>
  )
}

// Dev mode user menu with logout
function DevUserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut, userName } = useUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    // Sign out using context
    signOut()
    // Clear other app data
    localStorage.removeItem('cdt_user_account')
    localStorage.removeItem('cdt_user_settings')
    // Navigate to landing page
    navigate('/', { replace: true })
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className="hidden sm:block text-sm text-gray-400">{userName || 'Dreamer'}</span>
        <DevUserAvatar />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-dream-darker border border-dream-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <Link
                to="/account"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Account Settings
              </Link>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Clerk user button component (only loaded when Clerk is available)
function ClerkUserMenu() {
  const { user } = ClerkReact.useUser()

  return (
    <div className="flex items-center gap-4">
      <span className="hidden sm:block text-sm text-gray-400">
        {user?.firstName || 'Dreamer'}
      </span>
      <ClerkReact.UserButton
        appearance={{
          elements: {
            avatarBox: 'w-9 h-9',
          },
        }}
      />
    </div>
  )
}

// Auth wrapper for Clerk
function ClerkAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <ClerkReact.SignedIn>{children}</ClerkReact.SignedIn>
      <ClerkReact.SignedOut>
        <ClerkReact.RedirectToSignIn />
      </ClerkReact.SignedOut>
    </>
  )
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const layoutContent = (
    <div className="min-h-screen bg-dream-dark flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-dream-darker border-r border-dream-border
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-dream-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold">CDT</span>
            </div>
            <span className="font-semibold text-white">Dream Theory</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-target
                  ${isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <header className="h-16 bg-dream-darker/80 backdrop-blur-lg border-b border-dream-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-gray-400 hover:text-white touch-target"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          {/* Logo (mobile) */}
          <Link to="/" className="lg:hidden font-semibold text-white">
            CDT
          </Link>

          {/* Spacer */}
          <div className="hidden lg:block" />

          {/* User menu */}
          {CLERK_AVAILABLE ? (
            <ClerkUserMenu />
          ) : (
            <DevUserMenu />
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )

  // Use Clerk auth wrapper if available, otherwise render directly
  if (CLERK_AVAILABLE) {
    return <ClerkAuthWrapper>{layoutContent}</ClerkAuthWrapper>
  }

  return layoutContent
}

// Icons
function MicIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
