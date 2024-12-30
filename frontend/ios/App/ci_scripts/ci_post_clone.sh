#!/bin/bash
set -e # Exit on error

echo "🚀 Post-clone script started..."

# Debug: Print environment
echo "CI_WORKSPACE: ${CI_WORKSPACE}"
echo "PWD: $(pwd)"

# Navigate to project root
cd "$(dirname "${BASH_SOURCE[0]}")/../../../"

# Check if Node.js is installed, if not install it
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found, installing via Homebrew..."
    
    # Check if Homebrew is installed, install if not
    if ! command -v brew &> /dev/null; then
        echo "🍺 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    # Install Node.js
    brew install node
fi

# Debug: Print versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Post-clone script completed"
