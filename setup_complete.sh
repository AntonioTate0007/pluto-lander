#!/bin/bash
# Pluto Lander - Complete Self-Contained Setup for Raspberry Pi
# This script sets up everything from scratch

set -e

echo "=========================================="
echo "  🚀 Pluto Lander Complete Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}[1/8] Updating system...${NC}"
sudo apt update

# Install dependencies
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
sudo apt install -y python3 python3-pip python3-venv nodejs npm git curl

# Setup directory
echo -e "${YELLOW}[3/8] Setting up project directory...${NC}"
cd ~
rm -rf ~/pluto-lander
git clone https://github.com/AntonioTate0007/pluto-lander.git ~/pluto-lander
cd ~/pluto-lander

# Setup Python environment
echo -e "${YELLOW}[4/8] Setting up Python environment...${NC}"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# Build dashboard
echo -e "${YELLOW}[5/8] Building dashboard (this may take a few minutes)...${NC}"
cd ~/pluto-lander/dashboard
npm install
npm run build
cd ~/pluto-lander

# Create systemd service
echo -e "${YELLOW}[6/8] Creating systemd service...${NC}"
sudo tee /etc/systemd/system/pluto-lander.service > /dev/null << 'EOF'
[Unit]
Description=Pluto Lander Trading Bot
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/pluto-lander
Environment=PYTHONPATH=/home/admin/pluto-lander
ExecStart=/home/admin/pluto-lander/venv/bin/python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo -e "${YELLOW}[7/8] Starting service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable pluto-lander
sudo systemctl restart pluto-lander

# Wait for startup
sleep 3

# Check status
echo -e "${YELLOW}[8/8] Checking status...${NC}"
if curl -s http://localhost:8000/api/health | grep -q "healthy"; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✅ Pluto Lander is RUNNING!"
    echo "==========================================${NC}"
    echo ""
    IP=$(hostname -I | awk '{print $1}')
    echo "  🌐 Dashboard: http://$IP:8000"
    echo "  🔐 Login: admin / pluto123"
    echo ""
    echo "  Commands:"
    echo "    sudo systemctl status pluto-lander"
    echo "    sudo systemctl restart pluto-lander"
    echo "    sudo journalctl -u pluto-lander -f"
    echo ""
else
    echo ""
    echo "❌ Service may have issues. Check logs:"
    echo "   sudo journalctl -u pluto-lander -n 50"
fi

