import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dream-dark flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-32 h-32 mx-auto mb-8 relative">
          {/* Moon icon for 404 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-primary-500/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-600">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Lost in a Dream
        </h1>
        <p className="text-gray-400 mb-8 font-serif">
          The page you're looking for seems to have drifted into the realm of
          the unconscious. Perhaps it was never meant to be found.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary touch-target">
            Return Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-ghost touch-target"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
