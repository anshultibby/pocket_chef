#!/bin/bash
set -e # Exit on error

echo "🚀 Pre-build script started..."

# Navigate to project root
cd "$(dirname "${BASH_SOURCE[0]}")/../../../"

# Build static files (like in Dockerfile)
echo "🏗 Building static files..."
npm run build-static

# Sync capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# Install pods
echo "📦 Installing Pods..."
cd ios/App
pod install

echo "✅ Pre-build script completed"
