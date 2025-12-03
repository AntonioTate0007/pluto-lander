# Pi Test Script
$piIP = "192.168.1.208"
Write-Host "Testing Pi..." -ForegroundColor Cyan
try { $h = Invoke-RestMethod "http://$piIP:8000/api/health" -TimeoutSec 5; Write-Host "Backend: OK" -ForegroundColor Green } catch { Write-Host "Backend: FAIL" -ForegroundColor Red }
try { $k = Invoke-WebRequest "http://$piIP:8000/kiosk" -UseBasicParsing -TimeoutSec 5; Write-Host "Kiosk: HTTP $($k.StatusCode)" -ForegroundColor Green } catch { Write-Host "Kiosk: FAIL" -ForegroundColor Red }
