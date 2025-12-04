#!/bin/bash
# Build dashboard on Pi via SSH

echo "🔨 Building dashboard on Pi..."
ssh admin@192.168.1.208 << 'EOF'
cd /home/admin/pluto-lander
echo "📥 Pulling latest code..."
git pull origin main
cd dashboard
echo "📦 Installing dependencies..."
npm install
echo "🔨 Building dashboard..."
npm run build
if [ -d dist ]; then
    echo "✅ Dashboard built successfully!"
    ls -la dist | head -5
else
    echo "❌ Build failed - dist folder not created"
fi
EOF

echo "✅ Done! Restart backend to serve new build."

