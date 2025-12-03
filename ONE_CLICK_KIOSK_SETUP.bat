@echo off
echo ========================================
echo   Pluto Lander Kiosk Setup
echo   Password: admin5384
echo ========================================
echo.
echo Step 1: Copying setup script to Pi...
echo (Enter password: admin5384 when prompted)
echo.
scp setup_kiosk.sh admin@192.168.1.208:~/setup_kiosk.sh
echo.
echo Step 2: Running setup script on Pi...
echo (Enter password: admin5384 when prompted)
echo.
ssh admin@192.168.1.208 "chmod +x ~/setup_kiosk.sh && ~/setup_kiosk.sh"
echo.
echo ========================================
echo   Setup Complete! Pi will reboot.
echo   Kiosk will start automatically.
echo ========================================
pause

