#!/bin/bash

# Seamless HTML to Figma - Quick Start
# This script sets up and runs the handoff server

echo "=========================================="
echo "  HTML to Figma - Seamless Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Check if required packages are installed
echo "📦 Checking dependencies..."
if ! npm list express &> /dev/null || ! npm list cors &> /dev/null; then
    echo "   Installing required packages..."
    npm install express cors
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Check if builds are complete
echo "🔨 Checking builds..."
if [ ! -f "dist/code.js" ] || [ ! -f "dist/ui.html" ]; then
    echo "   Building Figma plugin..."
    npm run build > /dev/null 2>&1
    echo "✓ Figma plugin built"
else
    echo "✓ Figma plugin already built"
fi

if [ ! -f "chrome-extension/dist/js/inject.js" ]; then
    echo "   Building Chrome extension..."
    cd chrome-extension && npm run build > /dev/null 2>&1 && cd ..
    echo "✓ Chrome extension built"
else
    echo "✓ Chrome extension already built"
fi
echo ""

# Start the handoff server
echo "=========================================="
echo "  🚀 Starting Handoff Server"
echo "=========================================="
echo ""
echo "Server will run on http://localhost:4411"
echo "Press Ctrl+C to stop"
echo ""

node handoff-server.js
