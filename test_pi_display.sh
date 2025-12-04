#!/bin/bash
# Test Pi Display After Reboot

echo "Testing Pi Display..."
echo "===================="

# Wait for Pi to be ready
echo "Waiting for Pi to come online..."
sleep 30

# Test backend health
echo "Testing backend..."
curl -s http://192.168.1.208:8000/api/health && echo "✓ Backend OK" || echo "✗ Backend not responding"

# Test kiosk page
echo "Testing kiosk page..."
curl -s -o /dev/null -w "%{http_code}" http://192.168.1.208:8000/kiosk
echo " - Kiosk page status"

# Test Alpaca connection
echo "Testing Alpaca connection..."
curl -s -H "Authorization: Bearer $(curl -s -X POST http://192.168.1.208:8000/api/auth/login -d 'username=admin&password=pluto123&grant_type=' | jq -r '.access_token')" http://192.168.1.208:8000/api/alpaca/account && echo "✓ Alpaca OK" || echo "✗ Alpaca not configured"

echo "===================="
echo "Test complete!"


