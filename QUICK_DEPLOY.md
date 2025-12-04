# Quick Deploy Guide

## Problem
Changes were made to the code but not deployed:
- ✅ ESP32 code updated (12-hour clock)
- ✅ Dashboard code updated (12-hour clock, new design)
- ❌ Dashboard not built (no `dist` folder)
- ❌ Backend serving old build

## Solution

### Option 1: Automated Script (Recommended)

Run the PowerShell script:
```powershell
.\deploy_all_changes.ps1
```

This will:
1. Build dashboard locally (if Node.js installed)
2. Deploy to Pi via SSH
3. Restart backend service
4. Verify ESP32

### Option 2: Manual Deployment

#### On Pi (via SSH):
```bash
ssh admin@192.168.1.208
cd /home/admin/pluto-lander
git pull origin main
cd dashboard
npm install
npm run build
sudo systemctl restart pluto-backend
```

#### For ESP32:
The firmware was already uploaded. If display doesn't update:
- Power cycle ESP32 (unplug/replug)
- Or wait 1-2 minutes for auto-restart

### Option 3: Build Locally Then Copy

If you have Node.js on Windows:
```powershell
cd dashboard
npm install
npm run build
# Then copy dist folder to Pi
scp -r dist admin@192.168.1.208:/home/admin/pluto-lander/dashboard/
```

## Verify Changes

1. **Pi Dashboard**: Visit `http://192.168.1.208:8000`
   - Should show 12-hour clock with AM/PM
   - Should show new glassmorphism design

2. **ESP32 Display**: 
   - Should show 12-hour time (e.g., "3:45 PM")
   - Not 24-hour (e.g., "15:45")

## Troubleshooting

- **Dashboard still shows old design**: Clear browser cache (Ctrl+Shift+Delete)
- **ESP32 not updating**: Power cycle the device
- **Build fails**: Check Node.js version (needs v16+)
- **SSH password prompt**: Set up SSH keys for passwordless access

