#!/bin/bash
set -e # Exit on error

echo "🚀 Post-clone script started..."

# Install Node.js using custom script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Debug: Print versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Navigate to frontend directory
cd "$CI_WORKSPACE/frontend"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Post-clone script completed"
