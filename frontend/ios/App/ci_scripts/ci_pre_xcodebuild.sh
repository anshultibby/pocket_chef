#!/bin/bash
set -e # Exit on error

echo "🚀 Pre-build script started..."

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to frontend directory
cd "$CI_WORKSPACE/frontend"

# Build static files
echo "🏗 Building static files..."
npm run build-static

# Sync capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# Install pods with special handling
echo "📦 Installing Pods..."
cd ios/App

# Clean existing pods
rm -rf Pods
rm -rf Podfile.lock

# Install pods with verbose logging
pod install --verbose

# Fix permissions for framework scripts
if [ -f "Pods/Target Support Files/Pods-App/Pods-App-frameworks.sh" ]; then
    chmod +x "Pods/Target Support Files/Pods-App/Pods-App-frameworks.sh"
    echo "✅ Fixed permissions for framework script"
fi

echo "✅ Pre-build script completed"
