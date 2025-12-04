#!/bin/bash
# Comprehensive Pi Kiosk Fix Script
# Run this on the Raspberry Pi to fix kiosk mode

set -e

echo "🔧 Fixing Pi Kiosk Display..."
echo "================================"

# 1. Ensure backend is running
echo ""
echo "1️⃣ Checking backend service..."
if systemctl is-active --quiet pluto-lander; then
    echo "   ✅ Backend is running"
else
    echo "   ⚠️  Backend not running, starting..."
    sudo systemctl start pluto-lander
    sleep 3
fi

# 2. Test backend health
echo ""
echo "2️⃣ Testing backend health..."
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend not responding!"
    echo "   Trying to restart..."
    sudo systemctl restart pluto-lander
    sleep 5
    if curl -s http://localhost:8000/api/health > /dev/null; then
        echo "   ✅ Backend restarted successfully"
    else
        echo "   ❌ Backend still not responding - check logs: sudo journalctl -u pluto-lander"
        exit 1
    fi
fi

# 3. Test kiosk page
echo ""
echo "3️⃣ Testing kiosk page..."
if curl -s http://localhost:8000/kiosk > /dev/null; then
    echo "   ✅ Kiosk page accessible"
else
    echo "   ❌ Kiosk page not accessible!"
    exit 1
fi

# 4. Kill any existing Chromium instances
echo ""
echo "4️⃣ Cleaning up existing Chromium processes..."
pkill -f chromium || true
pkill -f chrome || true
sleep 2

# 5. Configure autologin (no password)
echo ""
echo "5️⃣ Configuring autologin..."
sudo mkdir -p /etc/lightdm/lightdm.conf.d
sudo tee /etc/lightdm/lightdm.conf.d/60-autologin.conf > /dev/null << 'EOF'
[Seat:*]
autologin-user=admin
autologin-user-timeout=0
user-session=LXDE-pi
EOF

# Add admin to autologin group
sudo usermod -aG autologin admin || true

# 6. Disable screen blanking
echo ""
echo "6️⃣ Disabling screen blanking..."
sudo tee /etc/lightdm/lightdm.conf.d/70-no-blank.conf > /dev/null << 'EOF'
[Seat:*]
xserver-command=X -s 0 -dpms
EOF

# 7. Create/update LXDE autostart
echo ""
echo "7️⃣ Configuring LXDE autostart..."
mkdir -p ~/.config/lxsession/LXDE-pi
cat > ~/.config/lxsession/LXDE-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.5 -root
@chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state --disable-translate --no-first-run --fast --fast-start --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic --disable-pinch --overscroll-history-navigation=disabled http://localhost:8000/kiosk
EOF

# 8. Create systemd user service for kiosk (more reliable)
echo ""
echo "8️⃣ Creating systemd user service..."
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/pluto-kiosk.service << 'EOF'
[Unit]
Description=Pluto Launcher Kiosk Display
After=graphical.target pluto-lander.service
Wants=pluto-lander.service

[Service]
Type=simple
Environment=DISPLAY=:0
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state --disable-translate --no-first-run --fast --fast-start --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic --disable-pinch --overscroll-history-navigation=disabled http://localhost:8000/kiosk
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

# Enable linger for user services
sudo loginctl enable-linger admin

# Enable and start the service
systemctl --user daemon-reload
systemctl --user enable pluto-kiosk.service
systemctl --user start pluto-kiosk.service || true

# 9. Install unclutter (hide mouse cursor)
echo ""
echo "9️⃣ Installing unclutter (hide mouse cursor)..."
sudo apt-get install -y unclutter || true

# 10. Test Chromium launch
echo ""
echo "🔟 Testing Chromium launch..."
sleep 3
if pgrep -f chromium > /dev/null; then
    echo "   ✅ Chromium is running"
else
    echo "   ⚠️  Chromium not running yet (may need to wait for desktop)"
    echo "   Starting manually..."
    DISPLAY=:0 chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://localhost:8000/kiosk &
    sleep 3
    if pgrep -f chromium > /dev/null; then
        echo "   ✅ Chromium started manually"
    else
        echo "   ❌ Failed to start Chromium"
    fi
fi

echo ""
echo "=================================="
echo "✅ Kiosk setup complete!"
echo ""
echo "Summary:"
echo "  - Backend: $(systemctl is-active pluto-lander && echo '✅ Running' || echo '❌ Not running')"
echo "  - Kiosk service: $(systemctl --user is-active pluto-kiosk.service 2>/dev/null && echo '✅ Running' || echo '⚠️  Will start on next login')"
echo "  - Chromium: $(pgrep -f chromium > /dev/null && echo '✅ Running' || echo '⚠️  Not running')"
echo ""
echo "To test immediately:"
echo "  DISPLAY=:0 chromium-browser --kiosk http://localhost:8000/kiosk &"
echo ""
echo "To reboot and test:"
echo "  sudo reboot"
echo ""


