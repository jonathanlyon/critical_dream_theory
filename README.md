# Cognitive Dream Theory (CDT)

A Progressive Web App for voice-recording dreams and receiving psychologically-grounded, non-authoritative reflections based on Cognitive Dream Theory, Schredl manifest content coding, and Jungian archetypal frameworks.

## Overview

CDT helps serious dreamers gain psychological insights from their dreams through:

- **Voice Recording**: Intuitive bedside dream recording with mobile-first design
- **Transcription**: Fast, accurate transcription via Whisper/Groq API
- **Analysis**: Comprehensive analysis using CDT structural frameworks
- **Insights**: Longitudinal pattern tracking across multiple dreams

The app prioritizes structural coherence over symbolic interpretation, tracking patterns across dreams while maintaining the dreamer's interpretive authority.

## Tech Stack

- **Frontend**: React PWA with TailwindCSS (mobile-first)
- **Backend**: Convex (real-time, serverless)
- **Authentication**: Clerk
- **APIs**:
  - Groq/Whisper: Audio transcription
  - Hume: Emotional prosody analysis
  - Gemini: AI image generation
  - OpenAI: LLM-powered dream analysis
  - Stripe: Subscription management

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- API keys for: Clerk, Convex, Groq, Hume, Gemini, OpenAI, Stripe

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd CDT_01

# Run setup script
./init.sh

# Fill in your API keys
# Edit .env.local with your credentials

# Start development servers
./init.sh start
```

### Development URLs

- Frontend: http://localhost:5173
- Convex Dashboard: Check your Convex deployment

## Features

### Subscription Tiers

| Tier | Minutes/Month | Focus |
|------|--------------|-------|
| First Recall (Free) | 1 min (one-time) | Try the experience |
| Noticing | 10 min | Brief reflections |
| Patterning | 20 min | Recurring themes |
| Integration | 30 min | Deeper synthesis |

### Core Features

1. **Landing Page & Demo**: Interactive demo with example dream analysis
2. **Recording**: Voice synthesis visualization, pause/resume, tier-based limits
3. **Pre-Analysis Context**: Sleep quality questionnaire, life events, mood
4. **Analysis**: CDT framework, Schredl scales, archetypal resonances
5. **Dream Journal**: Card grid, search, filters, audio replay
6. **Dream Insights**: Unlocks after 3 dreams, longitudinal patterns after 5
7. **Settings & Account**: Notifications, subscriptions, PDF export

## Project Structure

```
CDT_01/
├── frontend/           # React PWA application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── styles/      # TailwindCSS configuration
│   └── public/          # Static assets & PWA manifest
├── convex/             # Convex backend functions
│   ├── schema.ts       # Database schema
│   ├── dreams.ts       # Dream CRUD operations
│   ├── analysis.ts     # Analysis functions
│   └── ...
├── .env.local          # Environment variables (not committed)
├── init.sh             # Development setup script
└── README.md
```

## Database Schema

- **users**: User profiles and subscription info
- **dreams**: Dream recordings with metadata
- **dream_analyses**: Full analysis results
- **dream_context**: Sleep quality, life events, mood
- **prosody_analysis**: Hume API emotional analysis
- **user_settings**: Notification and microphone preferences

## Design System

- **Colors**: Deep indigo primary, violet secondary, gold accents
- **Mode**: Dark mode default (optimized for nighttime)
- **Typography**: Sans-serif headings, serif body, monospace data
- **Style**: Calm, meditative, dream-like aesthetic

## Contributing

This is a prototype application. For contribution guidelines, please contact the maintainers.

## License

Proprietary - All rights reserved.
