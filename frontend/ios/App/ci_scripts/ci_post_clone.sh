#!/bin/bash
set -e # Exit on error

echo "🚀 Post-clone script started..."

# Debug: Print environment
echo "CI_WORKSPACE: ${CI_WORKSPACE}"
echo "PWD: $(pwd)"

# Navigate to project root
cd "$(dirname "${BASH_SOURCE[0]}")/../../../"

# Use Node.js directly (Xcode Cloud has Node pre-installed)
echo "📦 Setting up Node.js..."
export NODE_OPTIONS="--max_old_space_size=4096"

# Debug: Print versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Post-clone script completed"
