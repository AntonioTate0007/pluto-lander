#!/bin/bash
# Pluto Lander Kiosk Auto-Start Setup

echo "🚀 Setting up Pluto Lander Kiosk Mode..."

# Create autostart directory
mkdir -p ~/.config/autostart

# Create the autostart desktop entry
cat > ~/.config/autostart/pluto-kiosk.desktop << 'ENDFILE'
[Desktop Entry]
Type=Application
Name=Pluto Lander Kiosk
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://localhost:8000/kiosk
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
ENDFILE

# Disable screen blanking
mkdir -p ~/.config/lxsession/LXDE-pi
if [ -f /etc/xdg/lxsession/LXDE-pi/autostart ]; then
    cp /etc/xdg/lxsession/LXDE-pi/autostart ~/.config/lxsession/LXDE-pi/autostart
fi

# Add screen settings to autostart
cat >> ~/.config/lxsession/LXDE-pi/autostart << 'ENDFILE'
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble http://localhost:8000/kiosk
ENDFILE

# Enable pluto-lander service
sudo systemctl enable pluto-lander

echo "✅ Kiosk mode configured!"
echo "🔄 Rebooting now..."
sudo reboot

