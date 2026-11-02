#!/bin/bash

PROJECT="/Users/mahan/Documents/AI Projects/ledger ai"

echo "🚀 Starting RIVA..."

# Backend
# Invoke the venv interpreter directly instead of relying on `activate`, which
# silently no-ops in some shells and leaves the wrong Python (Anaconda) on PATH.
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJECT"'/backend\" && ./run-backend.sh"'

# Main
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJECT"'/frontend\" && npm run dev"'

# Web
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJECT"'/webapp\" && npm run dev"'

echo "✅ RIVA services are starting..."
echo "Backend: http://localhost:8000"
echo "Main:    http://localhost:3000"
echo "Web:     http://localhost:3001"
