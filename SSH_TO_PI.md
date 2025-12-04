# SSH to Raspberry Pi - Step by Step

## Quick Command
```bash
ssh admin@192.168.1.208
```

## Detailed Steps

### Step 1: Open Terminal/PowerShell
- **Windows**: Open PowerShell or Command Prompt
- **Mac/Linux**: Open Terminal

### Step 2: Connect via SSH
```bash
ssh admin@192.168.1.208
```

### Step 3: Enter Password
When prompted, enter the password:
- Default: `pluto123`
- Press Enter (password won't show as you type)

### Step 4: First Time Connection
If this is your first time connecting, you'll see:
```
The authenticity of host '192.168.1.208' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
Type `yes` and press Enter.

### Step 5: You're In!
Once connected, you'll see the Pi command prompt:
```
admin@pluto-pi:~ $
```

## Common Commands After SSH

### Navigate to project
```bash
cd ~/pluto-lander
```

### Check backend status
```bash
sudo systemctl status pluto-lander
```

### View backend logs
```bash
sudo journalctl -u pluto-lander -f
```

### Restart backend
```bash
sudo systemctl restart pluto-lander
```

### Update project
```bash
cd ~/pluto-lander
git pull
cd dashboard
npm run build
sudo systemctl restart pluto-lander
```

### Run kiosk fix script
```bash
cd ~/pluto-lander
bash fix_pi_kiosk.sh
```

## Troubleshooting

### "Connection refused" or "Connection timed out"
- Check Pi is powered on
- Verify IP address: `ping 192.168.1.208`
- Check SSH is enabled on Pi

### "Permission denied"
- Verify username is `admin`
- Check password is correct
- Try: `ssh -v admin@192.168.1.208` for verbose output

### "Host key verification failed"
- Remove old key: `ssh-keygen -R 192.168.1.208`
- Then try connecting again

## Exit SSH
Type `exit` or press `Ctrl+D`


