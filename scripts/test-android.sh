#!/bin/bash

# Android Emulator Test Script
# This script runs comprehensive tests on Android emulator

echo "🧪 Starting Android Emulator Tests..."

# Check if emulator is running
if ! adb devices | grep -q "emulator"; then
    echo "❌ No Android emulator detected!"
    echo "Please start Android emulator first:"
    echo "1. Open Android Studio"
    echo "2. Go to AVD Manager"
    echo "3. Start your emulator"
    echo "Or run: emulator -avd Pixel_4_API_30"
    exit 1
fi

echo "✅ Android emulator detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run unit tests
echo "🧪 Running unit tests..."
npm test -- --watchAll=false --coverage

# Run integration tests
echo "🔗 Running integration tests..."
npm run test:integration

# Run E2E tests (if configured)
echo "🌐 Running E2E tests..."
npm run test:e2e

# Run performance tests
echo "⚡ Running performance tests..."
npm run test:performance

# Run security tests
echo "🔒 Running security tests..."
npm run test:security

# Generate test report
echo "📊 Generating test report..."
npm run test:report

echo "✅ All tests completed!"
echo "📱 Check emulator for app behavior"
echo "📊 Test reports available in /coverage" 