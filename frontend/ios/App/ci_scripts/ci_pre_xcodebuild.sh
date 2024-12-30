#!/bin/bash

# Navigate to the frontend directory
cd "$(dirname "$0")/../../../"

# Debug: Print current directory
echo "Current directory: $(pwd)"

# Install dependencies
npm install --legacy-peer-deps

# Build the static files
npm run build-static

# Sync capacitor
npx cap sync ios

# Debug: List generated files
echo "Contents of dist directory:"
ls -la dist
