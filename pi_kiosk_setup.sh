#!/bin/bash
# Pluto Lander Kiosk Auto-Start Setup for Raspberry Pi

echo "🚀 Setting up Pluto Lander Kiosk Mode..."

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create the autostart desktop entry for Chromium kiosk
cat > ~/.config/autostart/pluto-kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Pluto Lander Kiosk
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://localhost:8000/kiosk
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Also add to LXDE autostart for Pi OS
mkdir -p ~/.config/lxsession/LXDE-pi
cat > ~/.config/lxsession/LXDE-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://localhost:8000/kiosk
EOF

# Disable screen blanking
sudo bash -c 'cat > /etc/lightdm/lightdm.conf.d/pluto-kiosk.conf << EOF
[SeatDefaults]
xserver-command=X -s 0 -dpms
EOF'

# Make sure pluto-lander service starts before desktop
sudo systemctl enable pluto-lander

echo "✅ Kiosk mode configured!"
echo "📺 The Pi will now auto-start Pluto Lander kiosk on boot."
echo "🔄 Reboot to test: sudo reboot"


