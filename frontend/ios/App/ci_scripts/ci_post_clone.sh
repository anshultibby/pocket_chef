#!/bin/bash
set -e # Exit on error

echo "🚀 Post-clone script started..."

# Debug: Print environment
echo "CI_WORKSPACE: ${CI_WORKSPACE}"
echo "PWD: $(pwd)"

# Navigate to project root
cd "$(dirname "${BASH_SOURCE[0]}")/../../../"

# Setup Node.js using nvm or node version manager available in CI environment
echo "📦 Setting up Node.js..."
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Check if nvm is available
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm install 18
    nvm use 18
else
    # Try to use xcrun to find node
    NODE_PATH=$(xcrun --find node 2>/dev/null || echo "")
    if [ -n "$NODE_PATH" ]; then
        export PATH="$(dirname "$NODE_PATH"):$PATH"
    else
        echo "❌ Error: Node.js not found. Please ensure Node.js is installed in the CI environment."
        exit 1
    fi
fi

# Debug: Print versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set memory limit for Node
export NODE_OPTIONS="--max_old_space_size=4096"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Post-clone script completed"
