import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import DreamAnalysis from './pages/DreamAnalysis'
import DreamJournal from './pages/DreamJournal'
import DreamInsights from './pages/DreamInsights'
import Settings from './pages/Settings'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import AuthenticatedLayout from './components/layout/AuthenticatedLayout'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <>
          <SignedOut>
            <LandingPage />
          </SignedOut>
          <SignedIn>
            <AuthenticatedLayout>
              <DreamAnalysis />
            </AuthenticatedLayout>
          </SignedIn>
        </>
      } />

      {/* Protected routes */}
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
