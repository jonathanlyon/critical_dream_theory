import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isDevMode } = useUser()
  const location = useLocation()

  // In dev mode without Clerk, use our custom auth state
  if (isDevMode) {
    if (!isAuthenticated) {
      // Redirect to landing page with return URL
      return <Navigate to="/" state={{ from: location, showSignIn: true }} replace />
    }
    return <>{children}</>
  }

  // With Clerk configured, the auth is handled by Clerk
  // This component assumes Clerk is handling auth when available
  return <>{children}</>
}
