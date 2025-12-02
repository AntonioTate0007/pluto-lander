#!/bin/bash
# Pluto Lander Quick Deploy Script
# Run this after copying files to Pi

set -e

echo "🚀 Pluto Lander Quick Deploy"
echo "============================"

# Install system dependencies
echo "📦 Installing dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm git

# Setup in home directory
cd ~
PROJECT_DIR="$HOME/pluto-lander"
mkdir -p $PROJECT_DIR

# Check if files were copied
if [ ! -d "$PROJECT_DIR/backend" ]; then
    echo "❌ Backend files not found. Copy files first!"
    exit 1
fi

# Setup Python environment
echo "🐍 Setting up Python..."
cd $PROJECT_DIR
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# Create __init__.py for backend package
touch backend/__init__.py

# Create run script
cat > start.sh << 'RUNEOF'
#!/bin/bash
cd ~/pluto-lander
source venv/bin/activate
uvicorn backend.app:app --host 0.0.0.0 --port 8000
RUNEOF
chmod +x start.sh

# Create systemd service
sudo tee /etc/systemd/system/pluto-lander.service > /dev/null << 'EOF'
[Unit]
Description=Pluto Lander Trading Bot
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/pluto-lander
ExecStart=/home/admin/pluto-lander/venv/bin/uvicorn backend.app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "⚙️ Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable pluto-lander
sudo systemctl start pluto-lander

# Check status
sleep 2
if sudo systemctl is-active --quiet pluto-lander; then
    echo ""
    echo "✅ Pluto Lander is running!"
    echo ""
    echo "🌐 Access dashboard at: http://$(hostname -I | awk '{print $1}'):8000"
    echo "🔐 Default login: admin / pluto123"
    echo ""
    echo "Commands:"
    echo "  sudo systemctl status pluto-lander  - Check status"
    echo "  sudo systemctl restart pluto-lander - Restart"
    echo "  sudo journalctl -u pluto-lander -f  - View logs"
else
    echo "❌ Service failed to start. Check logs:"
    sudo journalctl -u pluto-lander -n 20
fi

