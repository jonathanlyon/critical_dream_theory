import { Routes, Route } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import DreamAnalysis from './pages/DreamAnalysis'
import AnalysisResults from './pages/AnalysisResults'
import DreamJournal from './pages/DreamJournal'
import DreamInsights from './pages/DreamInsights'
import Settings from './pages/Settings'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import AuthenticatedLayout from './components/layout/AuthenticatedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useUser } from './contexts/UserContext'

// Check if Clerk is available
const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Wrapper for conditional auth components (used when Clerk is available)
function ConditionalAuth({ children, showWhenSignedOut, showWhenSignedIn }: {
  children: React.ReactNode,
  showWhenSignedOut?: boolean,
  showWhenSignedIn?: boolean
}) {
  if (!CLERK_AVAILABLE) {
    // Without Clerk, use our custom auth state
    return null // Handled by useUser
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

// Landing page that shows appropriate content based on auth state
function LandingOrAuth() {
  const { isAuthenticated, isDevMode } = useUser()

  if (CLERK_AVAILABLE) {
    return (
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
    )
  }

  // Dev mode: show content based on auth state
  if (isDevMode && isAuthenticated) {
    return (
      <AuthenticatedLayout>
        <DreamAnalysis />
      </AuthenticatedLayout>
    )
  }

  return <LandingPage />
}

function App() {
  return (
    <Routes>
      {/* Public route - shows landing or authenticated home */}
      <Route path="/" element={<LandingOrAuth />} />

      {/* Protected routes - require authentication */}
      <Route path="/analysis" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DreamAnalysis />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/analysis/results" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AnalysisResults />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/journal" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DreamJournal />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/insights" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DreamInsights />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Account />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
