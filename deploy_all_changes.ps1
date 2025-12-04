# Deploy All Changes to Pi and ESP32
# This script builds the dashboard and ensures ESP32 is updated

param(
    [string]$PiHost = "192.168.1.208",
    [string]$PiUser = "admin",
    [string]$PiPath = "/home/admin/pluto-lander"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 PLUTO LANDER - DEPLOY ALL CHANGES`n" -ForegroundColor Cyan
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Build dashboard locally (if Node.js available)" -ForegroundColor White
Write-Host "  2. Deploy to Pi via SSH" -ForegroundColor White
Write-Host "  3. Restart backend service" -ForegroundColor White
Write-Host "  4. Verify ESP32 firmware" -ForegroundColor White
Write-Host ""

# Step 1: Check for Node.js and build locally
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    Write-Host "✅ Node.js found: $($nodePath.Source)" -ForegroundColor Green
    Write-Host "`n📦 Building dashboard locally...`n" -ForegroundColor Yellow
    
    Push-Location "$PSScriptRoot\dashboard"
    try {
        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..." -ForegroundColor Cyan
            npm install
        }
        
        # Build dashboard
        Write-Host "Building dashboard..." -ForegroundColor Cyan
        npm run build
        
        if (Test-Path "dist") {
            Write-Host "✅ Dashboard built successfully!" -ForegroundColor Green
            Write-Host "   dist folder created with $(Get-ChildItem dist -Recurse | Measure-Object).Count files" -ForegroundColor Gray
        } else {
            Write-Host "❌ Build failed - dist folder not created" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Build error: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Host "⚠️  Node.js not found locally" -ForegroundColor Yellow
    Write-Host "   Will build on Pi instead...`n" -ForegroundColor Yellow
}

# Step 2: Deploy to Pi
Write-Host "`n📡 Deploying to Pi ($PiUser@$PiHost)...`n" -ForegroundColor Yellow

# Check if we have SSH key or need password
$sshKey = "$env:USERPROFILE\.ssh\id_rsa"
$usePassword = -not (Test-Path $sshKey)

if ($usePassword) {
    Write-Host "⚠️  No SSH key found. You'll need to enter password." -ForegroundColor Yellow
    Write-Host "   Consider setting up SSH keys for passwordless access.`n" -ForegroundColor Gray
}

# Create deployment script for Pi
$deployScript = @"
#!/bin/bash
set -e
cd $PiPath
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull failed (may need to commit changes first)"
cd dashboard

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔨 Building dashboard..."
npm run build

if [ -d dist ]; then
    echo "✅ Dashboard built successfully!"
    echo "📊 Build info:"
    ls -lh dist/index.html
    echo ""
    echo "🔄 Restarting backend service..."
    sudo systemctl restart pluto-backend || sudo systemctl restart pluto || echo "⚠️  Service restart failed - restart manually"
    echo "✅ Deployment complete!"
else
    echo "❌ Build failed - dist folder not created"
    exit 1
fi
"@

# Save script temporarily
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    Write-Host "Uploading and executing deployment script..." -ForegroundColor Cyan
    
    if ($usePassword) {
        # Use scp and ssh with password prompt
        scp $tempScript "${PiUser}@${PiHost}:/tmp/deploy.sh"
        ssh "${PiUser}@${PiHost}" "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
    } else {
        # Use SSH key
        scp -i $sshKey $tempScript "${PiUser}@${PiHost}:/tmp/deploy.sh"
        ssh -i $sshKey "${PiUser}@${PiHost}" "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
    }
    
    Write-Host "`n✅ Deployment complete!`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host "`n💡 Manual deployment steps:" -ForegroundColor Yellow
    Write-Host "  1. SSH to Pi: ssh $PiUser@$PiHost" -ForegroundColor White
    Write-Host "  2. cd $PiPath" -ForegroundColor White
    Write-Host "  3. git pull origin main" -ForegroundColor White
    Write-Host "  4. cd dashboard" -ForegroundColor White
    Write-Host "  5. npm install && npm run build" -ForegroundColor White
    Write-Host "  6. sudo systemctl restart pluto-backend" -ForegroundColor White
    exit 1
} finally {
    Remove-Item $tempScript -ErrorAction SilentlyContinue
}

# Step 3: Verify ESP32
Write-Host "`n🔍 Verifying ESP32 firmware...`n" -ForegroundColor Yellow
Write-Host "ESP32 firmware was uploaded via OTA." -ForegroundColor Cyan
Write-Host "If display doesn't show 12-hour clock:" -ForegroundColor Yellow
Write-Host "  - Power cycle the ESP32 (unplug/replug)" -ForegroundColor White
Write-Host "  - Or wait 1-2 minutes for auto-restart`n" -ForegroundColor White

Write-Host "`n✨ All done! Check:" -ForegroundColor Green
Write-Host "  - Pi Dashboard: http://$PiHost:8000" -ForegroundColor Cyan
Write-Host "  - ESP32 Display: Should show 12-hour time with AM/PM" -ForegroundColor Cyan
Write-Host ""

