#!/bin/bash
set -e # Exit on error

echo "🚀 Post-clone script started..."

# Install Node.js using custom script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Debug: Print versions and current directory
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "CI_WORKSPACE: ${CI_WORKSPACE}"

# Navigate to frontend directory using relative path
cd "${CI_WORKSPACE}/../../../"

# Debug: Confirm we're in the right directory
echo "Directory after cd: $(pwd)"
ls -la

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Post-clone script completed"
