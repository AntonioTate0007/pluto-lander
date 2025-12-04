# 🚀 DEPLOY CHANGES NOW

## The Problem
Your code changes are ready but **not deployed**:
- ✅ ESP32 firmware code updated (12-hour clock)
- ✅ Dashboard source code updated (12-hour clock, new design)  
- ❌ Dashboard **not built** (no `dist` folder exists)
- ❌ Backend serving **old build** from cache

## Quick Fix (Choose One)

### ⚡ Option 1: Run Deployment Script
```powershell
.\deploy_all_changes.ps1
```
This automates everything!

### ⚡ Option 2: Manual SSH to Pi
```bash
ssh admin@192.168.1.208
cd /home/admin/pluto-lander
git pull origin main
cd dashboard
npm install
npm run build
sudo systemctl restart pluto-backend
```

### ⚡ Option 3: Use Bash Script
```bash
bash build_dashboard_on_pi.sh
```
(You'll need to enter SSH password)

## After Deployment

1. **Clear browser cache** (Ctrl+Shift+Delete) or **hard refresh** (Ctrl+F5)
2. **Visit**: `http://192.168.1.208:8000`
3. **Check ESP32**: Should show 12-hour time (e.g., "3:45 PM")

## Why No Changes?

- **Pi Dashboard**: Backend serves from `dashboard/dist` folder, which doesn't exist until you run `npm run build`
- **ESP32**: Firmware uploaded, but may need power cycle to see changes

## Still Not Working?

1. Check backend logs: `ssh admin@192.168.1.208 "journalctl -u pluto-backend -n 50"`
2. Verify dist folder: `ssh admin@192.168.1.208 "ls -la /home/admin/pluto-lander/dashboard/dist"`
3. Restart ESP32: Unplug and replug power

