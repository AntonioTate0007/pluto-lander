# Restart ESP32 to apply firmware changes
# This script sends a restart command via OTA

$esp32IP = "pluto-esp32.local"
$port = 3232

Write-Host "`n🔄 Restarting ESP32 to apply firmware changes...`n" -ForegroundColor Cyan

try {
    # Try to connect and send restart command
    $response = Invoke-WebRequest -Uri "http://$esp32IP/restart" -Method POST -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ ESP32 restart command sent" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not send restart command (ESP32 may restart automatically after OTA)" -ForegroundColor Yellow
    Write-Host "💡 The ESP32 should restart automatically after OTA upload completes." -ForegroundColor Cyan
    Write-Host "💡 If the display doesn't update, power cycle the ESP32." -ForegroundColor Cyan
}

Write-Host ""

