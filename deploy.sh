#!/bin/bash

# Deployment script for Divido Backend

echo "🚀 Starting backend deployment..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found. Run this from the project root."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "🔨 Building backend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend built successfully!"
    echo "🌐 Ready for deployment!"
    echo ""
    echo "📋 Deployment Instructions:"
    echo "1. For Render: Deploy from project root with render.yaml"
    echo "2. For Railway: Deploy backend directory directly"
    echo "3. For Heroku: Deploy backend directory directly"
    echo "4. For Docker: Use the Dockerfile in project root"
    echo ""
    echo "🔧 Environment Variables Required:"
    echo "- PORT (default: 5000)"
    echo "- MONGODB_URI"
    echo "- JWT_SECRET"
    echo "- SMTP_USER"
    echo "- SMTP_PASS"
    echo "- GEMINI_API_KEY"
    echo "- ELEVEN_LABS_API_KEY"
    echo "- ELEVEN_LABS_VOICE_ID"
    echo "- BASE_URL"
else
    echo "❌ Build failed!"
    exit 1
fi
