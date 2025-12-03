param([switch]$OTA)
$PIO = "C:\Users\antonio\AppData\Local\Python\pythoncore-3.14-64\Scripts\pio.exe"
$Port = "COM4"
Write-Host "`n  PLUTO LANDER ESP32 UPLOAD TOOL`n" -ForegroundColor Cyan
if ($OTA) {
    Write-Host "  OTA Upload Mode" -ForegroundColor Green
    Write-Host "  Target: pluto-esp32.local`n" -ForegroundColor Cyan
    & $PIO run -e esp32dev_ota -t upload
} else {
    Write-Host "  USB Upload Mode - Port: $Port`n" -ForegroundColor Yellow
    Write-Host "  Put ESP32 in download mode (BOOT+RST)!" -ForegroundColor Red
    Start-Sleep 5
    & $PIO run -e esp32dev -t upload --upload-port $Port
}
Write-Host ""
