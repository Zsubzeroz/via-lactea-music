#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔨 Building frontend..."
npm run build

echo "📁 Linking audio/ and covers/ into dist/..."
cp -al audio dist/audio
cp -al covers dist/covers

echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Done!"
