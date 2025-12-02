# Pluto Lander - Raspberry Pi Deployment Guide

## Prerequisites
- Raspberry Pi 4 with fresh Raspberry Pi OS installed
- SSH enabled on the Pi
- Pi connected to network at IP: 192.168.1.208

## Step 1: Connect to Your Pi

Open PowerShell or Terminal and run:
```bash
ssh admin@192.168.1.208
```
Enter password: `admin5384`

## Step 2: Create Project Directory

On the Pi, run:
```bash
mkdir -p ~/pluto-lander
exit
```

## Step 3: Copy Files to Pi

From your Windows machine (in the pluto_launcher_v3 folder):
```powershell
cd "C:\Users\antonio\Downloads\pluto_launcher_v3"
scp -r backend admin@192.168.1.208:~/pluto-lander/
scp -r branding admin@192.168.1.208:~/pluto-lander/
scp deploy.sh admin@192.168.1.208:~/pluto-lander/
```
Enter password `admin5384` for each command.

## Step 4: Run Deployment Script

SSH back into the Pi:
```bash
ssh admin@192.168.1.208
```

Run the deploy script:
```bash
cd ~/pluto-lander
chmod +x deploy.sh
./deploy.sh
```

## Step 5: Verify It's Running

After deployment completes:
```bash
sudo systemctl status pluto-lander
```

You should see "active (running)" in green.

## Step 6: Access Dashboard

Open a browser and go to:
```
http://192.168.1.208:8000
```

Login with:
- Username: `admin`
- Password: `pluto123`

## Troubleshooting

### Check logs:
```bash
sudo journalctl -u pluto-lander -f
```

### Restart service:
```bash
sudo systemctl restart pluto-lander
```

### Manual start (for testing):
```bash
cd ~/pluto-lander
source venv/bin/activate
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

## Configuring Alpaca API

1. Go to Settings page in dashboard
2. Enter your Alpaca API Key and Secret
3. Enable/disable Paper Trading mode
4. Click Save

Get API keys from: https://app.alpaca.markets/

## ESP32 Connection

The ESP32 will connect to the WebSocket endpoint:
```
ws://192.168.1.208:8000/ws/telemetry
```

I'll provide ESP32 setup instructions after the backend is confirmed working.

