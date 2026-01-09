export default function DreamJournal() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search dreams..."
              className="input"
              aria-label="Search dreams"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="input w-auto" aria-label="Filter by date range">
              <option value="">Date Range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select className="input w-auto" aria-label="Filter by dream type">
              <option value="">Dream Type</option>
              <option value="resolution">Resolution</option>
              <option value="replay">Replay</option>
              <option value="residual">Residual</option>
              <option value="generative">Generative</option>
              <option value="lucid">Lucid</option>
            </select>
            <select className="input w-auto" aria-label="Filter by emotional tone">
              <option value="">Emotional Tone</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
              <option value="mixed">Mixed</option>
            </select>
            <button className="btn-ghost text-sm">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Dream Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Empty State */}
          <div className="col-span-full text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-dream-card flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No dreams recorded yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start your dream journal by recording your first dream
            </p>
            <a href="/analysis" className="btn-primary inline-block touch-target">
              Record Your First Dream
            </a>
          </div>

          {/* Example Dream Card (hidden in empty state) */}
          {/* <div className="card-hover group">
            <div className="aspect-video bg-dream-darker rounded-lg mb-4 overflow-hidden">
              <img
                src="/placeholder-dream.jpg"
                alt="Dream visualization"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                Flying Over Mountains
              </h3>
              <span className="text-xs text-secondary-400 bg-secondary-950 px-2 py-1 rounded">
                Resolution
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">January 15, 2024</p>
            <p className="text-sm text-gray-500 line-clamp-2">
              Soaring above snow-capped peaks with a profound sense of freedom...
            </p>
            <div className="mt-4 pt-4 border-t border-dream-border flex items-center justify-between">
              <span className="text-xs text-accent-400">Positive tone</span>
              <button className="btn-ghost text-xs px-2 py-1 touch-target" aria-label="Play dream audio">
                ▶ Play
              </button>
            </div>
          </div> */}
        </div>

        {/* Pagination (hidden in empty state) */}
        {/* <div className="flex justify-center mt-8">
          <nav className="flex gap-2" aria-label="Pagination">
            <button className="btn-ghost px-3 py-1 touch-target">Previous</button>
            <button className="btn-primary px-3 py-1 touch-target">1</button>
            <button className="btn-ghost px-3 py-1 touch-target">2</button>
            <button className="btn-ghost px-3 py-1 touch-target">3</button>
            <button className="btn-ghost px-3 py-1 touch-target">Next</button>
          </nav>
        </div> */}
      </div>
    </div>
  )
}
