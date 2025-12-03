# ESP32 Pluto Lander Upload Tool
# Supports USB and OTA (wireless) uploads

param(
    [switch]$OTA
)

$PIO = "C:\Users\antonio\AppData\Local\Python\pythoncore-3.14-64\Scripts\pio.exe"
$Port = "COM4"
$ProjectDir = $PSScriptRoot

if (-not (Test-Path $PIO)) {
    Write-Host "❌ PlatformIO not found at: $PIO" -ForegroundColor Red
    Write-Host "   Install with: python -m pip install platformio" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     PLUTO LANDER ESP32 UPLOAD TOOL        ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($OTA) {
    Write-Host "  📡 OTA (Wireless) Upload Mode" -ForegroundColor Green
    Write-Host "  Target: pluto-esp32.local (192.168.1.105)" -ForegroundColor Cyan
    Write-Host "  Building and uploading wirelessly..." -ForegroundColor Cyan
    Write-Host ""
    
    Set-Location $ProjectDir
    & $PIO run -e esp32dev_ota -t upload
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "  ✅ OTA UPLOAD SUCCESSFUL!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  ❌ OTA UPLOAD FAILED" -ForegroundColor Red
        Write-Host "  Try USB upload: .\upload.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "  🔌 USB Upload Mode" -ForegroundColor Yellow
    Write-Host "  Port: $Port" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ⚠️  PUT ESP32 INTO DOWNLOAD MODE:" -ForegroundColor Red
    Write-Host "     1. HOLD the BOOT button" -ForegroundColor Yellow
    Write-Host "     2. PRESS and RELEASE the RST button" -ForegroundColor Yellow
    Write-Host "     3. RELEASE the BOOT button" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Starting countdown..." -ForegroundColor Gray
    Write-Host ""
    
    for ($i = 8; $i -ge 1; $i--) {
        $bar = "█" * (8 - $i) + "░" * $i
        Write-Host "     [$bar] Uploading in $i..." -ForegroundColor Yellow
        Start-Sleep 1
    }
    
    Write-Host ""
    Write-Host "     [█████] 🚀 UPLOADING NOW! 🚀" -ForegroundColor Green
    Write-Host ""
    
    Set-Location $ProjectDir
    & $PIO run -e esp32dev -t upload --upload-port $Port
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "  ✅ UPLOAD SUCCESSFUL!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  📡 Next time use OTA: .\upload.ps1 -OTA" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "  ❌ UPLOAD FAILED" -ForegroundColor Red
        Write-Host "  Make sure ESP32 is in download mode!" -ForegroundColor Yellow
        Write-Host "  Try OTA upload: .\upload.ps1 -OTA" -ForegroundColor Yellow
    }
}

Write-Host ""

