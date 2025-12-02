@echo off
echo ===============================================
echo   Pluto Lander - Deploy to Raspberry Pi
echo ===============================================
echo.

set PI_IP=192.168.1.208
set PI_USER=admin
set PI_PASS=admin5384

echo Target: %PI_USER%@%PI_IP%
echo.
echo Step 1: Creating directory on Pi...
echo.

:: Use plink if available, otherwise prompt for manual SSH
where plink >nul 2>&1
if %errorlevel%==0 (
    echo Using PuTTY plink...
    echo y | plink -ssh %PI_USER%@%PI_IP% -pw %PI_PASS% "mkdir -p ~/pluto-lander"
    
    echo Step 2: Copying files...
    pscp -r -pw %PI_PASS% backend %PI_USER%@%PI_IP%:~/pluto-lander/
    pscp -r -pw %PI_PASS% branding %PI_USER%@%PI_IP%:~/pluto-lander/
    pscp -pw %PI_PASS% deploy.sh %PI_USER%@%PI_IP%:~/pluto-lander/
    
    echo Step 3: Running deploy script...
    plink -ssh %PI_USER%@%PI_IP% -pw %PI_PASS% "cd ~/pluto-lander && chmod +x deploy.sh && ./deploy.sh"
) else (
    echo PuTTY tools not found. Using manual method...
    echo.
    echo Please run these commands manually:
    echo.
    echo 1. Open PowerShell and run:
    echo    scp -r "%~dp0backend" %PI_USER%@%PI_IP%:~/pluto-lander/
    echo    scp -r "%~dp0branding" %PI_USER%@%PI_IP%:~/pluto-lander/
    echo    scp "%~dp0deploy.sh" %PI_USER%@%PI_IP%:~/pluto-lander/
    echo.
    echo 2. SSH into Pi:
    echo    ssh %PI_USER%@%PI_IP%
    echo.
    echo 3. Run deploy script:
    echo    cd ~/pluto-lander ^&^& chmod +x deploy.sh ^&^& ./deploy.sh
    echo.
)

echo.
pause

