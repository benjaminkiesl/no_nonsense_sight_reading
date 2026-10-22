#!/usr/bin/env bash
set -e

echo "Building production bundle..."
npm run build

echo ""
echo "Starting isolated preview server (no HMR, no reload interruptions from code changes)..."
echo "Open: http://localhost:4173"
echo "Press Ctrl+C to stop."
echo ""

npx vite preview --port 4173
