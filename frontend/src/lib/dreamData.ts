// Shared dream data for the application
// In production, this would come from Convex database

// Helper to get relative dates for mock data
function getRelativeDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(0, 0, 0, 0)
  return date
}

export interface Dream {
  id: string
  title: string
  dateObj: Date
  dreamType: string
  emotionalTone: string
  excerpt: string
  thumbnailGradient: string
  thumbnailIcon: string
  transcript?: string
  analysis?: DreamAnalysis
}

export interface DreamAnalysis {
  overview: {
    dreamTypeConfidence: number
    emotionalToneSummary: string
  }
  manifestContent: {
    characters: string[]
    settings: string[]
    actions: string[]
    emotions: string[]
    bizarreness: string
  }
  structuralAnalysis: {
    vaultActivation: string
    cognitiveDrift: string[]
    dreamTypeRationale: string
  }
  archetypalResonances: {
    symbols: string[]
    themes: string[]
    possibleMeanings: string[]
  }
  reflectivePrompts: string[]
}

// Mock dream data for development
export const MOCK_DREAMS: Dream[] = [
  {
    id: '1',
    title: 'Flying Over Mountains',
    dateObj: getRelativeDate(0),
    dreamType: 'Resolution',
    emotionalTone: 'Positive',
    excerpt: 'Soaring above snow-capped peaks with a profound sense of freedom. The air was crisp and I could see for miles...',
    thumbnailGradient: 'from-indigo-600 to-purple-700',
    thumbnailIcon: '🏔️',
    transcript: 'I was flying over these incredible mountains. Snow-capped peaks stretched as far as I could see. The air was so crisp and clean. I felt completely free, like nothing could hold me back. I could see tiny villages below, and rivers winding through valleys. It was the most peaceful feeling I\'ve ever had in a dream.',
    analysis: {
      overview: {
        dreamTypeConfidence: 0.85,
        emotionalToneSummary: 'Strongly positive with themes of liberation and transcendence'
      },
      manifestContent: {
        characters: ['Self (dreamer)'],
        settings: ['Mountain range', 'Sky', 'Villages below'],
        actions: ['Flying', 'Observing landscape', 'Feeling freedom'],
        emotions: ['Peace', 'Freedom', 'Wonder', 'Joy'],
        bizarreness: 'Moderate - flying without aid is impossible in waking life'
      },
      structuralAnalysis: {
        vaultActivation: 'Recent memories of feeling constrained may have activated this compensatory dream',
        cognitiveDrift: ['Identity drift toward idealized free self', 'Emotional processing of recent stress'],
        dreamTypeRationale: 'Resolution dream - processing feelings of limitation through wish-fulfillment imagery'
      },
      archetypalResonances: {
        symbols: ['Mountains (challenges/achievements)', 'Flying (transcendence)', 'Clear air (clarity)'],
        themes: ['Liberation', 'Mastery', 'Perspective-taking'],
        possibleMeanings: ['May reflect desire for freedom from current constraints', 'Could represent gaining new perspective on life situation']
      },
      reflectivePrompts: [
        'What in your waking life feels like those mountains - challenging but conquerable?',
        'When was the last time you felt this sense of freedom?',
        'What would it mean to have this perspective in your daily life?'
      ]
    }
  },
  {
    id: '2',
    title: 'The Morphing School',
    dateObj: getRelativeDate(3),
    dreamType: 'Continuation',
    emotionalTone: 'Mixed',
    excerpt: 'Walking through hallways that kept shifting between my old school and grandmother\'s house. Each door led somewhere unexpected...',
    thumbnailGradient: 'from-purple-600 to-pink-700',
    thumbnailIcon: '🏫',
    transcript: 'I was walking through these hallways that kept changing. One moment I was in my old elementary school, and then suddenly the walls would shift and I was in my grandmother\'s house. Every door I opened led somewhere completely different - sometimes a classroom, sometimes her kitchen. I was looking for something but I couldn\'t remember what.',
    analysis: {
      overview: {
        dreamTypeConfidence: 0.72,
        emotionalToneSummary: 'Mixed emotions of nostalgia and mild anxiety'
      },
      manifestContent: {
        characters: ['Self (dreamer)', 'Implied grandmother (absent)'],
        settings: ['Elementary school', 'Grandmother\'s house', 'Hybrid spaces'],
        actions: ['Walking', 'Opening doors', 'Searching'],
        emotions: ['Confusion', 'Nostalgia', 'Mild anxiety', 'Curiosity'],
        bizarreness: 'High - spaces morphing impossibly'
      },
      structuralAnalysis: {
        vaultActivation: 'Childhood memories blending with family connections',
        cognitiveDrift: ['Identity integration of past and present selves', 'Processing family relationships'],
        dreamTypeRationale: 'Continuation dream - ongoing processing of formative experiences and family bonds'
      },
      archetypalResonances: {
        symbols: ['School (learning/growth)', 'Grandmother\'s house (wisdom/heritage)', 'Doors (choices/transitions)'],
        themes: ['Identity formation', 'Heritage', 'The search for meaning'],
        possibleMeanings: ['May reflect integration of childhood lessons with current life', 'Could indicate processing of family legacy']
      },
      reflectivePrompts: [
        'What lessons from childhood feel relevant to your current situation?',
        'How does your grandmother\'s influence show up in your life today?',
        'What might you be searching for that connects past and present?'
      ]
    }
  },
  {
    id: '3',
    title: 'Ocean of Stars',
    dateObj: getRelativeDate(5),
    dreamType: 'Generative',
    emotionalTone: 'Positive',
    excerpt: 'Swimming through an ocean that reflected the night sky. Each wave carried constellations that told ancient stories...',
    thumbnailGradient: 'from-blue-600 to-cyan-700',
    thumbnailIcon: '🌊',
    transcript: 'I was swimming in an ocean that was somehow also the night sky. Stars were all around me, not just above. Each wave that washed over me carried different constellations, and somehow I understood the stories they were telling - ancient myths I\'d never heard before but felt I\'d always known.',
    analysis: {
      overview: {
        dreamTypeConfidence: 0.88,
        emotionalToneSummary: 'Deeply positive with mystical and transcendent qualities'
      },
      manifestContent: {
        characters: ['Self (dreamer)'],
        settings: ['Star-ocean hybrid space'],
        actions: ['Swimming', 'Receiving stories', 'Understanding'],
        emotions: ['Wonder', 'Connection', 'Ancient knowing', 'Peace'],
        bizarreness: 'Very high - impossible physics, synesthesia of space/water'
      },
      structuralAnalysis: {
        vaultActivation: 'Deep unconscious material surfacing through creative imagery',
        cognitiveDrift: ['Spiritual/meaning-seeking activation', 'Creative recombination of elemental symbols'],
        dreamTypeRationale: 'Generative dream - novel creative synthesis suggesting psychological growth'
      },
      archetypalResonances: {
        symbols: ['Ocean (unconscious/emotions)', 'Stars (guidance/destiny)', 'Constellations (patterns/stories)'],
        themes: ['Cosmic connection', 'Ancient wisdom', 'Immersion in the unconscious'],
        possibleMeanings: ['May reflect openness to deeper self-knowledge', 'Could indicate spiritual seeking or creative awakening']
      },
      reflectivePrompts: [
        'What ancient wisdom might your unconscious be trying to share with you?',
        'How do you connect with something larger than yourself?',
        'What stories are waiting to be told through you?'
      ]
    }
  },
  {
    id: '4',
    title: 'Lost in the City',
    dateObj: getRelativeDate(10),
    dreamType: 'Replay',
    emotionalTone: 'Negative',
    excerpt: 'Wandering through endless streets trying to find my way home. Every turn led to another unfamiliar neighborhood...',
    thumbnailGradient: 'from-gray-600 to-slate-700',
    thumbnailIcon: '🏙️',
    transcript: 'I was lost in this huge city. Every street looked the same but different. I kept trying to find my way home but every turn just led to another unfamiliar neighborhood. My phone was dead, and no one on the streets would help me. I felt so alone and frustrated.',
    analysis: {
      overview: {
        dreamTypeConfidence: 0.78,
        emotionalToneSummary: 'Negative emotions of frustration, isolation, and helplessness'
      },
      manifestContent: {
        characters: ['Self (dreamer)', 'Unhelpful strangers'],
        settings: ['Unfamiliar city', 'Endless streets'],
        actions: ['Walking', 'Searching', 'Asking for help (rejected)'],
        emotions: ['Frustration', 'Loneliness', 'Anxiety', 'Helplessness'],
        bizarreness: 'Low - realistic scenario with exaggerated difficulty'
      },
      structuralAnalysis: {
        vaultActivation: 'Recent experiences of feeling lost or unsupported',
        cognitiveDrift: ['Processing feelings of being directionless', 'Working through isolation experiences'],
        dreamTypeRationale: 'Replay dream - processing recent feelings of being lost or without support'
      },
      archetypalResonances: {
        symbols: ['City (complexity/society)', 'Dead phone (disconnection)', 'Home (security/identity)'],
        themes: ['Alienation', 'The search for belonging', 'Disconnection'],
        possibleMeanings: ['May reflect current feelings of being lost in life direction', 'Could indicate need for more support or connection']
      },
      reflectivePrompts: [
        'Where in your life do you feel like you\'re wandering without direction?',
        'Who could you reach out to for guidance right now?',
        'What does "home" mean to you beyond a physical place?'
      ]
    }
  },
  {
    id: '5',
    title: 'The Talking Cat',
    dateObj: getRelativeDate(20),
    dreamType: 'Residual',
    emotionalTone: 'Neutral',
    excerpt: 'A black cat appeared and started giving me advice about life decisions. Its wisdom felt both absurd and profound...',
    thumbnailGradient: 'from-amber-600 to-orange-700',
    thumbnailIcon: '🐱',
    transcript: 'There was this black cat sitting on a fence, and it started talking to me. It was giving me advice about decisions I\'ve been putting off. The advice was both completely absurd and somehow exactly what I needed to hear. I woke up feeling like I should actually listen to a cat.',
    analysis: {
      overview: {
        dreamTypeConfidence: 0.65,
        emotionalToneSummary: 'Neutral with elements of humor and insight'
      },
      manifestContent: {
        characters: ['Self (dreamer)', 'Talking cat'],
        settings: ['Outdoor scene with fence'],
        actions: ['Listening', 'Receiving advice'],
        emotions: ['Amusement', 'Surprise', 'Contemplation'],
        bizarreness: 'Moderate - talking animal, but coherent conversation'
      },
      structuralAnalysis: {
        vaultActivation: 'Day residue mixed with deeper wisdom-seeking',
        cognitiveDrift: ['Processing pending decisions', 'Accessing intuitive knowledge'],
        dreamTypeRationale: 'Residual dream with generative elements - daily concerns processed through creative imagery'
      },
      archetypalResonances: {
        symbols: ['Cat (intuition/independence)', 'Talking animal (wisdom from unconscious)', 'Fence (boundaries/transitions)'],
        themes: ['Inner wisdom', 'Trusting intuition', 'Unexpected guidance'],
        possibleMeanings: ['May reflect your intuition trying to be heard', 'Could indicate need to trust your inner knowing']
      },
      reflectivePrompts: [
        'What decisions have you been avoiding?',
        'If your intuition could speak, what would it say?',
        'What absurd wisdom might actually be true for your situation?'
      ]
    }
  },
  {
    id: '6',
    title: 'Childhood Garden',
    dateObj: getRelativeDate(45),
    dreamType: 'Resolution',
    emotionalTone: 'Positive',
    excerpt: 'Returned to the garden where I played as a child, but everything was giant-sized. Flowers towered like trees...',
    thumbnailGradient: 'from-green-600 to-emerald-700',
    thumbnailIcon: '🌸'
  },
  {
    id: '7',
    title: 'The Endless Library',
    dateObj: getRelativeDate(50),
    dreamType: 'Generative',
    emotionalTone: 'Neutral',
    excerpt: 'Wandering through a library with infinite shelves. Each book contained dreams I had forgotten...',
    thumbnailGradient: 'from-brown-600 to-amber-700',
    thumbnailIcon: '📚'
  },
  {
    id: '8',
    title: 'Dancing with Shadows',
    dateObj: getRelativeDate(55),
    dreamType: 'Resolution',
    emotionalTone: 'Mixed',
    excerpt: 'Shadow figures emerged from the walls and invited me to dance. Their movements were graceful yet unsettling...',
    thumbnailGradient: 'from-slate-600 to-gray-700',
    thumbnailIcon: '💃'
  },
  {
    id: '9',
    title: 'The Glass City',
    dateObj: getRelativeDate(60),
    dreamType: 'Lucid',
    emotionalTone: 'Positive',
    excerpt: 'A city made entirely of glass sparkled in the sunlight. I realized I was dreaming and began to fly between the towers...',
    thumbnailGradient: 'from-sky-600 to-blue-700',
    thumbnailIcon: '🏙️'
  },
  {
    id: '10',
    title: 'Underwater Kingdom',
    dateObj: getRelativeDate(65),
    dreamType: 'Continuation',
    emotionalTone: 'Positive',
    excerpt: 'I could breathe underwater and discovered an ancient kingdom ruled by wise sea creatures...',
    thumbnailGradient: 'from-teal-600 to-cyan-700',
    thumbnailIcon: '🐠'
  },
  {
    id: '11',
    title: 'The Incredibly Long Dream Title That Keeps Going and Going Until It Reaches Over One Hundred Characters to Test Truncation',
    dateObj: getRelativeDate(70),
    dreamType: 'Lucid',
    emotionalTone: 'Positive',
    excerpt: 'This dream was so complex that even its title needs to be truncated when displayed in the journal card view to ensure the layout does not break...',
    thumbnailGradient: 'from-violet-600 to-purple-700',
    thumbnailIcon: '✨'
  }
]

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Get tone color based on emotional tone
export function getToneColor(tone: string): string {
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
export function getTypeBadgeColor(type: string): string {
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
