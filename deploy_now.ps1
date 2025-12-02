# Pluto Lander - Deploy to Raspberry Pi
# Run this script in a separate PowerShell window

$PI_IP = "192.168.1.208"
$PI_USER = "admin"
$PI_PASS = "admin5384"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Pluto Lander - Pi Deployment" -ForegroundColor Cyan  
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target: $PI_USER@$PI_IP" -ForegroundColor Yellow
Write-Host "Password: $PI_PASS" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to start deployment..." -ForegroundColor Green
Read-Host

# Step 1: Create directory on Pi
Write-Host ""
Write-Host "[1/4] Creating directory on Pi..." -ForegroundColor Cyan
Write-Host ">>> Enter password: $PI_PASS" -ForegroundColor Yellow
ssh $PI_USER@$PI_IP "mkdir -p ~/pluto-lander"

# Step 2: Copy backend files
Write-Host ""
Write-Host "[2/4] Copying backend files..." -ForegroundColor Cyan
Write-Host ">>> Enter password: $PI_PASS" -ForegroundColor Yellow
scp -r "$PROJECT_DIR\backend" "${PI_USER}@${PI_IP}:~/pluto-lander/"

# Step 3: Copy branding files
Write-Host ""
Write-Host "[3/4] Copying branding files..." -ForegroundColor Cyan
Write-Host ">>> Enter password: $PI_PASS" -ForegroundColor Yellow
scp -r "$PROJECT_DIR\branding" "${PI_USER}@${PI_IP}:~/pluto-lander/"

# Step 4: Copy and run deploy script
Write-Host ""
Write-Host "[4/4] Copying deploy script..." -ForegroundColor Cyan
Write-Host ">>> Enter password: $PI_PASS" -ForegroundColor Yellow
scp "$PROJECT_DIR\deploy.sh" "${PI_USER}@${PI_IP}:~/pluto-lander/"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Files copied! Now run deploy script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host ">>> Enter password one more time: $PI_PASS" -ForegroundColor Yellow
Write-Host ""
ssh $PI_USER@$PI_IP "cd ~/pluto-lander && chmod +x deploy.sh && ./deploy.sh"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard: http://${PI_IP}:8000" -ForegroundColor Cyan
Write-Host "Login: admin / pluto123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host

