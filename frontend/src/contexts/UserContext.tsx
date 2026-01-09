import { createContext, useContext, useState, ReactNode } from 'react'

// Subscription tiers based on app spec
export type SubscriptionTier = 'first_recall' | 'noticing' | 'patterning' | 'integration'

export interface TierConfig {
  name: string
  displayName: string
  maxMinutes: number // Recording time limit in minutes
  maxSeconds: number // Recording time limit in seconds
  monthlyPrice: number
  features: string[]
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  first_recall: {
    name: 'first_recall',
    displayName: 'First Recall',
    maxMinutes: 1,
    maxSeconds: 60,
    monthlyPrice: 0,
    features: ['1 min/dream', '5 dreams/mo', 'Basic analysis']
  },
  noticing: {
    name: 'noticing',
    displayName: 'Noticing',
    maxMinutes: 3,
    maxSeconds: 180,
    monthlyPrice: 9,
    features: ['3 min/dream', '30 dreams/mo', 'Symbol tracking']
  },
  patterning: {
    name: 'patterning',
    displayName: 'Patterning',
    maxMinutes: 5,
    maxSeconds: 300,
    monthlyPrice: 19,
    features: ['5 min/dream', 'Unlimited dreams', 'Pattern synthesis']
  },
  integration: {
    name: 'integration',
    displayName: 'Integration',
    maxMinutes: 10, // "Unlimited" but capped at 10 for UX
    maxSeconds: 600,
    monthlyPrice: 49,
    features: ['10 min/dream', 'Unlimited dreams', 'PDF exports', 'Voice notes']
  }
}

interface UserContextType {
  tier: SubscriptionTier
  tierConfig: TierConfig
  setTier: (tier: SubscriptionTier) => void
  isDevMode: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  // Default to 'first_recall' (free tier) for dev mode
  // In production, this would come from Clerk/Convex user data
  const [tier, setTier] = useState<SubscriptionTier>('first_recall')

  const isDevMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  const value: UserContextType = {
    tier,
    tierConfig: TIER_CONFIGS[tier],
    setTier,
    isDevMode
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Hook to get just the recording limit
export function useRecordingLimit() {
  const { tierConfig } = useUser()
  return {
    maxMinutes: tierConfig.maxMinutes,
    maxSeconds: tierConfig.maxSeconds
  }
}
