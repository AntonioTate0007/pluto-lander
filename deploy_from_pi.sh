#!/bin/bash
# Deploy dashboard from Pi - run this ON the Pi

set -e

echo "🚀 PLUTO LANDER - DEPLOY DASHBOARD"
echo "=================================="
echo ""

cd /home/admin/pluto-lander

echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "📦 Building dashboard..."
cd dashboard

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Build dashboard
echo "Building dashboard (this may take a minute)..."
npm run build

# Verify build
if [ -d dist ] && [ -f dist/index.html ]; then
    echo ""
    echo "✅ Dashboard built successfully!"
    echo "   Build size: $(du -sh dist | cut -f1)"
    echo "   Files: $(find dist -type f | wc -l)"
    echo ""
    
    # Restart backend
    echo "🔄 Restarting backend service..."
    if systemctl is-active --quiet pluto-backend; then
        sudo systemctl restart pluto-backend
        echo "✅ Backend restarted"
    elif systemctl is-active --quiet pluto; then
        sudo systemctl restart pluto
        echo "✅ Backend restarted"
    else
        echo "⚠️  Backend service not found. Restart manually:"
        echo "   sudo systemctl restart pluto-backend"
        echo "   OR"
        echo "   sudo systemctl restart pluto"
    fi
    
    echo ""
    echo "✨ Deployment complete!"
    echo "   Visit: http://$(hostname -I | awk '{print $1}'):8000"
    echo "   Clear browser cache (Ctrl+Shift+Delete) if changes don't appear"
    
else
    echo ""
    echo "❌ Build failed!"
    echo "   Check npm errors above"
    exit 1
fi

