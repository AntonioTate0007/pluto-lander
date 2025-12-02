#!/bin/bash
# Pluto Lander Pi Setup Script
# Run this on your Raspberry Pi 4

set -e

echo "🚀 Pluto Lander Pi Setup"
echo "========================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "📦 Installing Python and Node.js..."
sudo apt install -y python3 python3-pip python3-venv nodejs npm git chromium-browser

# Create project directory
PROJECT_DIR="/opt/pluto-lander"
echo "📁 Setting up project at $PROJECT_DIR..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Copy project files (assuming they're in the current directory)
cp -r backend $PROJECT_DIR/
cp -r dashboard $PROJECT_DIR/
cp -r branding $PROJECT_DIR/

# Setup Python virtual environment
echo "🐍 Setting up Python environment..."
cd $PROJECT_DIR
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# Build dashboard
echo "⚛️ Building dashboard..."
cd $PROJECT_DIR/dashboard
npm install
npm run build

# Create systemd service for backend
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/pluto-backend.service > /dev/null << 'EOF'
[Unit]
Description=Pluto Lander Backend
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/opt/pluto-lander
Environment=PATH=/opt/pluto-lander/venv/bin
ExecStart=/opt/pluto-lander/venv/bin/uvicorn backend.app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create service for kiosk mode (Pi screen display)
sudo tee /etc/systemd/system/pluto-kiosk.service > /dev/null << 'EOF'
[Unit]
Description=Pluto Lander Kiosk Display
After=graphical.target pluto-backend.service
Wants=pluto-backend.service

[Service]
Type=simple
User=admin
Environment=DISPLAY=:0
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-translate --no-first-run --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic --disable-pinch --overscroll-history-navigation=disabled http://localhost:8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

# Enable and start services
echo "🔧 Enabling services..."
sudo systemctl daemon-reload
sudo systemctl enable pluto-backend
sudo systemctl start pluto-backend

echo ""
echo "✅ Pluto Lander setup complete!"
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:8000"
echo "  - Dashboard:   http://localhost:8000 (after nginx setup)"
echo ""
echo "To start kiosk mode on Pi display:"
echo "  sudo systemctl enable pluto-kiosk"
echo "  sudo systemctl start pluto-kiosk"
echo ""
echo "Default login: admin / pluto123"
echo "⚠️  Change this password after first login!"

