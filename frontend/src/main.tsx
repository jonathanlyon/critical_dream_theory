import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App'
import './styles/globals.css'

// Import Clerk publishable key
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY - auth will not work')
}

// Import Convex URL
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null

// Wrapper component that conditionally uses Clerk
function AppWithProviders() {
  const content = convex ? (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  ) : (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )

  // Only use ClerkProvider if we have a valid key
  if (CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {content}
      </ClerkProvider>
    )
  }

  // Without Clerk, just render the app (for development)
  return content
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>,
)
