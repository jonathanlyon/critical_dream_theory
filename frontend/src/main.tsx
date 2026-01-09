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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY || ''}>
      {convex ? (
        <ConvexProvider client={convex}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConvexProvider>
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </ClerkProvider>
  </React.StrictMode>,
)
