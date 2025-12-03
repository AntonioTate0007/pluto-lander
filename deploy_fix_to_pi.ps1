# Deploy Pi Kiosk Fix Script
$piIP = "192.168.1.208"
$piUser = "admin"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING PI KIOSK FIX" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Copy fix script to Pi
Write-Host "📤 Copying fix script to Pi..." -ForegroundColor Yellow
scp fix_pi_kiosk.sh ${piUser}@${piIP}:~/fix_pi_kiosk.sh

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script copied successfully" -ForegroundColor Green
    
    # Run the fix script
    Write-Host "`n🔧 Running fix script on Pi..." -ForegroundColor Yellow
    ssh ${piUser}@${piIP} "chmod +x ~/fix_pi_kiosk.sh && ~/fix_pi_kiosk.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Fix script completed!" -ForegroundColor Green
        Write-Host "`nThe Pi should now auto-load the kiosk display on boot." -ForegroundColor Cyan
        Write-Host "To test immediately, SSH in and run:" -ForegroundColor Yellow
        Write-Host "  DISPLAY=:0 chromium-browser --kiosk http://localhost:8000/kiosk &" -ForegroundColor Gray
    } else {
        Write-Host "`n⚠️  Fix script had errors. Check output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ Failed to copy script. Check SSH connection." -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

