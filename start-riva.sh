#!/bin/bash

PROJECT="/Users/mahan/Documents/AI Projects/ledger ai"

echo "🚀 Starting RIVA..."

# Backend
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJECT"'/backend\" && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"'

# Main
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJECT"'/frontend\" && npm run dev"'

# Web
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJECT"'/webapp\" && npm run dev"'

echo "✅ RIVA services are starting..."
echo "Backend: http://localhost:8000"
echo "Main:    http://localhost:3000"
echo "Web:     http://localhost:3001"
