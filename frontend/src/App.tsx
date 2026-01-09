import { Routes, Route } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import DreamAnalysis from './pages/DreamAnalysis'
import DreamJournal from './pages/DreamJournal'
import DreamInsights from './pages/DreamInsights'
import Settings from './pages/Settings'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import AuthenticatedLayout from './components/layout/AuthenticatedLayout'

// Check if Clerk is available
const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Wrapper for conditional auth components
function ConditionalAuth({ children, showWhenSignedOut, showWhenSignedIn }: {
  children: React.ReactNode,
  showWhenSignedOut?: boolean,
  showWhenSignedIn?: boolean
}) {
  if (!CLERK_AVAILABLE) {
    // Without Clerk, show landing page content by default
    if (showWhenSignedOut) return <>{children}</>
    // Show signed-in content for development
    if (showWhenSignedIn) return <>{children}</>
    return null
  }

  // With Clerk, use the real auth state
  try {
    const { user } = useClerk()
    const isSignedIn = !!user

    if (showWhenSignedOut && !isSignedIn) return <>{children}</>
    if (showWhenSignedIn && isSignedIn) return <>{children}</>
    return null
  } catch {
    // If Clerk context is not available, default to showing content
    if (showWhenSignedOut) return <>{children}</>
    return null
  }
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        CLERK_AVAILABLE ? (
          <>
            <ConditionalAuth showWhenSignedOut>
              <LandingPage />
            </ConditionalAuth>
            <ConditionalAuth showWhenSignedIn>
              <AuthenticatedLayout>
                <DreamAnalysis />
              </AuthenticatedLayout>
            </ConditionalAuth>
          </>
        ) : (
          // Without Clerk, always show landing page at root
          <LandingPage />
        )
      } />

      {/* Protected routes - shown without auth check in dev mode */}
      <Route path="/analysis" element={
        <AuthenticatedLayout>
          <DreamAnalysis />
        </AuthenticatedLayout>
      } />
      <Route path="/journal" element={
        <AuthenticatedLayout>
          <DreamJournal />
        </AuthenticatedLayout>
      } />
      <Route path="/insights" element={
        <AuthenticatedLayout>
          <DreamInsights />
        </AuthenticatedLayout>
      } />
      <Route path="/settings" element={
        <AuthenticatedLayout>
          <Settings />
        </AuthenticatedLayout>
      } />
      <Route path="/account" element={
        <AuthenticatedLayout>
          <Account />
        </AuthenticatedLayout>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
