import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Helper to get relative dates for mock data
function getRelativeDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(0, 0, 0, 0)
  return date
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Mock dream data for development - using relative dates so filters work
const MOCK_DREAMS = [
  {
    id: '1',
    title: 'Flying Over Mountains',
    dateObj: getRelativeDate(0), // Today
    dreamType: 'Resolution',
    emotionalTone: 'Positive',
    excerpt: 'Soaring above snow-capped peaks with a profound sense of freedom. The air was crisp and I could see for miles...',
    thumbnailGradient: 'from-indigo-600 to-purple-700',
    thumbnailIcon: '🏔️'
  },
  {
    id: '2',
    title: 'The Morphing School',
    dateObj: getRelativeDate(3), // 3 days ago (this week)
    dreamType: 'Continuation',
    emotionalTone: 'Mixed',
    excerpt: 'Walking through hallways that kept shifting between my old school and grandmother\'s house. Each door led somewhere unexpected...',
    thumbnailGradient: 'from-purple-600 to-pink-700',
    thumbnailIcon: '🏫'
  },
  {
    id: '3',
    title: 'Ocean of Stars',
    dateObj: getRelativeDate(5), // 5 days ago (this week)
    dreamType: 'Generative',
    emotionalTone: 'Positive',
    excerpt: 'Swimming through an ocean that reflected the night sky. Each wave carried constellations that told ancient stories...',
    thumbnailGradient: 'from-blue-600 to-cyan-700',
    thumbnailIcon: '🌊'
  },
  {
    id: '4',
    title: 'Lost in the City',
    dateObj: getRelativeDate(10), // 10 days ago (this month)
    dreamType: 'Replay',
    emotionalTone: 'Negative',
    excerpt: 'Wandering through endless streets trying to find my way home. Every turn led to another unfamiliar neighborhood...',
    thumbnailGradient: 'from-gray-600 to-slate-700',
    thumbnailIcon: '🏙️'
  },
  {
    id: '5',
    title: 'The Talking Cat',
    dateObj: getRelativeDate(20), // 20 days ago (this month)
    dreamType: 'Residual',
    emotionalTone: 'Neutral',
    excerpt: 'A black cat appeared and started giving me advice about life decisions. Its wisdom felt both absurd and profound...',
    thumbnailGradient: 'from-amber-600 to-orange-700',
    thumbnailIcon: '🐱'
  },
  {
    id: '6',
    title: 'Childhood Garden',
    dateObj: getRelativeDate(45), // 45 days ago (older)
    dreamType: 'Resolution',
    emotionalTone: 'Positive',
    excerpt: 'Returned to the garden where I played as a child, but everything was giant-sized. Flowers towered like trees...',
    thumbnailGradient: 'from-green-600 to-emerald-700',
    thumbnailIcon: '🌸'
  }
]

// Get tone color based on emotional tone
function getToneColor(tone: string) {
  switch (tone.toLowerCase()) {
    case 'positive':
      return 'text-accent-400'
    case 'negative':
      return 'text-red-400'
    case 'mixed':
      return 'text-amber-400'
    default:
      return 'text-gray-400'
  }
}

// Get type badge color based on dream type
function getTypeBadgeColor(type: string) {
  switch (type.toLowerCase()) {
    case 'resolution':
      return 'bg-secondary-950 text-secondary-400'
    case 'continuation':
      return 'bg-purple-950 text-purple-400'
    case 'generative':
      return 'bg-cyan-950 text-cyan-400'
    case 'replay':
      return 'bg-amber-950 text-amber-400'
    case 'residual':
      return 'bg-gray-800 text-gray-400'
    case 'lucid':
      return 'bg-pink-950 text-pink-400'
    default:
      return 'bg-gray-800 text-gray-400'
  }
}

export default function DreamJournal() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize filters from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [dateFilter, setDateFilter] = useState(searchParams.get('dateRange') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('dreamType') || '')
  const [toneFilter, setToneFilter] = useState(searchParams.get('tone') || '')
  const [showArchived, setShowArchived] = useState(false)
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // In dev mode, show mock dreams; in prod, this would come from the database
  const [dreams, setDreams] = useState(MOCK_DREAMS)
  const [archivedDreams, setArchivedDreams] = useState<typeof MOCK_DREAMS>([])

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (dateFilter) params.set('dateRange', dateFilter)
    if (typeFilter) params.set('dreamType', typeFilter)
    if (toneFilter) params.set('tone', toneFilter)
    setSearchParams(params, { replace: true })
  }, [searchQuery, dateFilter, typeFilter, toneFilter, setSearchParams])

  // Archive a dream (soft delete)
  const archiveDream = (dreamId: string) => {
    const dreamToArchive = dreams.find(d => d.id === dreamId)
    if (dreamToArchive) {
      setArchivedDreams(prev => [...prev, dreamToArchive])
      setDreams(prev => prev.filter(d => d.id !== dreamId))
    }
    setArchiveConfirmId(null)
  }

  // Restore a dream from archive
  const restoreDream = (dreamId: string) => {
    const dreamToRestore = archivedDreams.find(d => d.id === dreamId)
    if (dreamToRestore) {
      setDreams(prev => [...prev, dreamToRestore].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()))
      setArchivedDreams(prev => prev.filter(d => d.id !== dreamId))
    }
  }

  // Permanently delete a dream
  const permanentlyDeleteDream = (dreamId: string) => {
    setArchivedDreams(prev => prev.filter(d => d.id !== dreamId))
    setDeleteConfirmId(null)
  }

  // Helper to check if date is within range
  const isWithinDateRange = (date: Date, range: string): boolean => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (range) {
      case 'today':
        return date >= today
      case 'week': {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date >= weekAgo
      }
      case 'month': {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return date >= monthAgo
      }
      default:
        return true
    }
  }

  // Filter dreams based on current filters
  const filteredDreams = dreams.filter(dream => {
    // Search filter
    if (searchQuery && !dream.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !dream.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    // Date range filter
    if (dateFilter && !isWithinDateRange(dream.dateObj, dateFilter)) {
      return false
    }
    // Type filter
    if (typeFilter && dream.dreamType.toLowerCase() !== typeFilter.toLowerCase()) {
      return false
    }
    // Tone filter
    if (toneFilter && dream.emotionalTone.toLowerCase() !== toneFilter.toLowerCase()) {
      return false
    }
    return true
  })

  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('')
    setTypeFilter('')
    setToneFilter('')
  }

  const hasActiveFilters = searchQuery || dateFilter || typeFilter || toneFilter

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {showArchived ? 'Archived Dreams' : 'Dream Journal'}
            </h1>
            <p className="text-gray-400">
              {showArchived
                ? `${archivedDreams.length} archived dream${archivedDreams.length !== 1 ? 's' : ''}`
                : `${filteredDreams.length} dream${filteredDreams.length !== 1 ? 's' : ''} recorded`
              }
            </p>
          </div>
          {archivedDreams.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="btn-ghost text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              {showArchived ? 'View Active' : `View Archived (${archivedDreams.length})`}
            </button>
          )}
        </div>

        {/* Header with Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search dreams..."
              className="input"
              aria-label="Search dreams"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="input w-auto"
              aria-label="Filter by date range"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">Date Range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select
              className="input w-auto"
              aria-label="Filter by dream type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Dream Type</option>
              <option value="resolution">Resolution</option>
              <option value="replay">Replay</option>
              <option value="residual">Residual</option>
              <option value="generative">Generative</option>
              <option value="continuation">Continuation</option>
              <option value="lucid">Lucid</option>
            </select>
            <select
              className="input w-auto"
              aria-label="Filter by emotional tone"
              value={toneFilter}
              onChange={(e) => setToneFilter(e.target.value)}
            >
              <option value="">Emotional Tone</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
              <option value="mixed">Mixed</option>
            </select>
            {hasActiveFilters && (
              <button
                className="btn-ghost text-sm"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Dream Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show archived dreams view */}
          {showArchived ? (
            archivedDreams.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No archived dreams</h3>
                <p className="text-gray-500 mb-6">Dreams you archive will appear here</p>
                <button
                  onClick={() => setShowArchived(false)}
                  className="btn-primary inline-block touch-target"
                >
                  Back to Journal
                </button>
              </div>
            ) : (
              archivedDreams.map((dream) => (
                <div key={dream.id} className="card-hover group opacity-75 relative">
                  {/* Delete Confirmation Overlay */}
                  {deleteConfirmId === dream.id && (
                    <div className="absolute inset-0 bg-red-950/95 rounded-xl flex flex-col items-center justify-center z-10 p-4">
                      <svg className="w-8 h-8 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-white text-center mb-4">Permanently delete this dream? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg"
                          onClick={() => permanentlyDeleteDream(dream.id)}
                        >
                          Delete Forever
                        </button>
                        <button
                          className="btn-ghost text-sm px-4 py-2"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Thumbnail with gradient and icon */}
                  <div className={`aspect-video bg-gradient-to-br ${dream.thumbnailGradient} rounded-lg mb-4 overflow-hidden flex items-center justify-center grayscale`}>
                    <span className="text-5xl opacity-80">{dream.thumbnailIcon}</span>
                  </div>

                  {/* Title and Type Badge */}
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-gray-400 line-clamp-1">
                      {dream.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded whitespace-nowrap bg-gray-800 text-gray-500">
                      Archived
                    </span>
                  </div>

                  {/* Date */}
                  <p className="text-sm text-gray-500 mb-3">{formatDate(dream.dateObj)}</p>

                  {/* Footer with restore and delete buttons */}
                  <div className="mt-4 pt-4 border-t border-dream-border flex items-center justify-between">
                    <button
                      className="btn-ghost text-xs px-3 py-1 touch-target text-red-400 hover:text-red-300"
                      aria-label="Delete dream permanently"
                      onClick={() => setDeleteConfirmId(dream.id)}
                    >
                      <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    <button
                      className="btn-ghost text-xs px-3 py-1 touch-target text-primary-400"
                      aria-label="Restore dream"
                      onClick={() => restoreDream(dream.id)}
                    >
                      <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restore
                    </button>
                  </div>
                </div>
              ))
            )
          ) : filteredDreams.length === 0 ? (
            /* Empty State */
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
                {hasActiveFilters ? 'No dreams match your filters' : 'No dreams recorded yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Start your dream journal by recording your first dream'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="btn-primary inline-block touch-target"
                >
                  Clear Filters
                </button>
              ) : (
                <a href="/analysis" className="btn-primary inline-block touch-target">
                  Record Your First Dream
                </a>
              )}
            </div>
          ) : (
            /* Dream Cards */
            filteredDreams.map((dream) => (
              <div
                key={dream.id}
                className="card-hover group cursor-pointer relative"
                onClick={() => navigate('/analysis/results', { state: { dreamId: dream.id } })}
              >
                {/* Archive Confirmation Overlay */}
                {archiveConfirmId === dream.id && (
                  <div className="absolute inset-0 bg-dream-darker/95 rounded-xl flex flex-col items-center justify-center z-10 p-4">
                    <p className="text-white text-center mb-4">Archive this dream?</p>
                    <div className="flex gap-2">
                      <button
                        className="btn-primary text-sm px-4 py-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          archiveDream(dream.id)
                        }}
                      >
                        Archive
                      </button>
                      <button
                        className="btn-ghost text-sm px-4 py-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setArchiveConfirmId(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Thumbnail with gradient and icon */}
                <div className={`aspect-video bg-gradient-to-br ${dream.thumbnailGradient} rounded-lg mb-4 overflow-hidden flex items-center justify-center relative`}>
                  <span className="text-5xl opacity-80">{dream.thumbnailIcon}</span>
                  {/* Archive button on hover */}
                  <button
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Archive dream"
                    onClick={(e) => {
                      e.stopPropagation()
                      setArchiveConfirmId(dream.id)
                    }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </button>
                </div>

                {/* Title and Type Badge */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                    {dream.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getTypeBadgeColor(dream.dreamType)}`}>
                    {dream.dreamType}
                  </span>
                </div>

                {/* Date */}
                <p className="text-sm text-gray-400 mb-3">{formatDate(dream.dateObj)}</p>

                {/* Excerpt */}
                <p className="text-sm text-gray-500 line-clamp-2">
                  {dream.excerpt}
                </p>

                {/* Footer with tone and play button */}
                <div className="mt-4 pt-4 border-t border-dream-border flex items-center justify-between">
                  <span className={`text-xs ${getToneColor(dream.emotionalTone)}`}>
                    {dream.emotionalTone} tone
                  </span>
                  <button
                    className="btn-ghost text-xs px-2 py-1 touch-target"
                    aria-label="Play dream audio"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement audio playback
                    }}
                  >
                    ▶ Play
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination (shown when there are many dreams) */}
        {filteredDreams.length > 6 && (
          <div className="flex justify-center mt-8">
            <nav className="flex gap-2" aria-label="Pagination">
              <button className="btn-ghost px-3 py-1 touch-target">Previous</button>
              <button className="btn-primary px-3 py-1 touch-target">1</button>
              <button className="btn-ghost px-3 py-1 touch-target">2</button>
              <button className="btn-ghost px-3 py-1 touch-target">3</button>
              <button className="btn-ghost px-3 py-1 touch-target">Next</button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
