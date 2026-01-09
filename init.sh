#!/bin/bash

# Cognitive Dream Theory (CDT) PWA - Development Environment Setup
# =================================================================
# This script sets up and runs the development environment for the
# Cognitive Dream Theory application - a Progressive Web App for
# voice-recording dreams and receiving psychologically-grounded analysis.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Cognitive Dream Theory (CDT) - Development Setup       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for required tools
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js v18+ required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Install frontend dependencies
echo ""
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}! Frontend not yet initialized - skipping${NC}"
fi

# Install Convex (backend) dependencies
echo ""
echo -e "${YELLOW}Installing backend dependencies...${NC}"
if [ -d "convex" ] && [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Convex dependencies installed${NC}"
else
    echo -e "${YELLOW}! Convex not yet initialized - skipping${NC}"
fi

# Check for environment variables
echo ""
echo -e "${YELLOW}Checking environment configuration...${NC}"

ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env.local template...${NC}"
    cat > "$ENV_FILE" << 'EOF'
# Cognitive Dream Theory - Environment Variables
# ==============================================
# Copy this file and fill in your API keys

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Convex
CONVEX_DEPLOYMENT=your_deployment_url

# Groq API (for Whisper transcription)
GROQ_API_KEY=your_groq_api_key

# Hume API (for emotional prosody analysis)
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key

# Gemini (for image generation)
GEMINI_API_KEY=your_gemini_api_key

# OpenAI (for LLM analysis)
OPENAI_API_KEY=your_openai_api_key

# Stripe (for subscriptions)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EOF
    echo -e "${YELLOW}! Created .env.local template - please fill in your API keys${NC}"
else
    echo -e "${GREEN}✓ Environment file exists${NC}"
fi

# Function to start services
start_services() {
    echo ""
    echo -e "${BLUE}Starting development servers...${NC}"
    echo ""

    # Start Convex backend (if configured)
    if [ -f "package.json" ] && grep -q "convex" "package.json" 2>/dev/null; then
        echo -e "${YELLOW}Starting Convex backend...${NC}"
        npx convex dev &
        CONVEX_PID=$!
        echo -e "${GREEN}✓ Convex backend starting (PID: $CONVEX_PID)${NC}"
    fi

    # Start frontend
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        echo -e "${YELLOW}Starting React frontend...${NC}"
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        echo -e "${GREEN}✓ Frontend starting (PID: $FRONTEND_PID)${NC}"
    fi

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Development Servers                     ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Frontend:  http://localhost:5173                          ║${NC}"
    echo -e "${GREEN}║  Convex:    Check Convex dashboard for backend URL         ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Press Ctrl+C to stop all servers                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

    # Wait for interrupt
    trap "echo -e '\n${YELLOW}Stopping servers...${NC}'; kill $CONVEX_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
    wait
}

# Parse command line arguments
case "${1:-}" in
    "install")
        echo -e "${GREEN}Dependencies installed. Run './init.sh start' to start servers.${NC}"
        ;;
    "start")
        start_services
        ;;
    "help"|"--help"|"-h")
        echo ""
        echo "Usage: ./init.sh [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Install dependencies and show status"
        echo "  install    Install all dependencies"
        echo "  start      Start development servers"
        echo "  help       Show this help message"
        echo ""
        ;;
    *)
        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Fill in your API keys in .env.local"
        echo "  2. Run './init.sh start' to start development servers"
        echo ""
        echo "Technology Stack:"
        echo "  • Frontend: React PWA with TailwindCSS"
        echo "  • Backend: Convex (serverless, real-time)"
        echo "  • Auth: Clerk"
        echo "  • APIs: Groq/Whisper, Hume, Gemini, OpenAI, Stripe"
        echo ""
        ;;
esac
