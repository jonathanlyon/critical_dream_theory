import { SignInButton, SignUpButton } from '@clerk/clerk-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dream-dark">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/50 via-transparent to-dream-dark" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Cognitive Dream Theory</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 font-serif">
              Voice-record your dreams and receive psychologically-grounded reflections
              based on CDT, Schredl manifest content coding, and Jungian archetypal frameworks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <button className="btn-primary text-lg px-8 py-3 touch-target">
                  Start Recording Dreams
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="btn-ghost text-lg px-8 py-3 touch-target">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-dream-darker/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Try the Experience
          </h2>
          <div className="max-w-2xl mx-auto card">
            <p className="text-gray-400 text-center mb-6">
              Interactive demo coming soon. Experience how CDT analyzes dreams
              with psychological rigor.
            </p>
            <div className="bg-dream-darker rounded-lg p-8 text-center">
              <div className="voice-visualizer mb-6 flex items-center justify-center">
                <span className="text-gray-500">Demo Dream Player</span>
              </div>
              <button className="btn-secondary touch-target" disabled>
                Analyze Dream
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Subscription Tiers
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto font-serif italic">
            "Dream reflection time is intentionally limited. Insight emerges through attention, not volume."
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* First Recall - Free */}
            <div className="card text-center">
              <h3 className="text-xl font-semibold mb-2">First Recall</h3>
              <p className="text-accent-400 font-medium mb-4">Free</p>
              <p className="text-3xl font-bold mb-2">1 min</p>
              <p className="text-gray-400 text-sm">one-time analysis</p>
              <p className="text-gray-500 mt-4 text-sm">Try the experience</p>
            </div>

            {/* Noticing */}
            <div className="card text-center">
              <h3 className="text-xl font-semibold mb-2">Noticing</h3>
              <p className="text-primary-400 font-medium mb-4">Tier 1</p>
              <p className="text-3xl font-bold mb-2">10 min</p>
              <p className="text-gray-400 text-sm">per month</p>
              <p className="text-gray-500 mt-4 text-sm">Brief reflections & emotional tagging</p>
            </div>

            {/* Patterning */}
            <div className="card text-center border-primary-500/50">
              <h3 className="text-xl font-semibold mb-2">Patterning</h3>
              <p className="text-secondary-400 font-medium mb-4">Tier 2</p>
              <p className="text-3xl font-bold mb-2">20 min</p>
              <p className="text-gray-400 text-sm">per month</p>
              <p className="text-gray-500 mt-4 text-sm">Recurring themes & continuity tracking</p>
            </div>

            {/* Integration */}
            <div className="card text-center">
              <h3 className="text-xl font-semibold mb-2">Integration</h3>
              <p className="text-accent-400 font-medium mb-4">Tier 3</p>
              <p className="text-3xl font-bold mb-2">30 min</p>
              <p className="text-gray-400 text-sm">per month</p>
              <p className="text-gray-500 mt-4 text-sm">Deeper narrative & emotional synthesis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-dream-border">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2024 Cognitive Dream Theory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
