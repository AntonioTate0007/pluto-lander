# Rebuild Dashboard Instructions

The dashboard has been redesigned with a modern crypto landing page aesthetic. To see the changes:

## Option 1: Build Locally (Recommended)

1. Open a terminal in the `dashboard` directory
2. Run:
   ```bash
   npm install
   npm run build
   ```
3. The built files will be in `dashboard/dist/`
4. Restart your backend server to serve the new build

## Option 2: Development Mode

1. Open a terminal in the `dashboard` directory
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. This will start a development server (usually on port 5173)
4. Access via the dev server URL

## Changes Made:

- ✅ Clock changed to 12-hour format with AM/PM
- ✅ Dashboard redesigned with glassmorphism cards
- ✅ Modern gradient backgrounds
- ✅ Updated color scheme and typography
- ✅ ESP32 display updated with 12-hour clock

## If Changes Don't Appear:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5 or Cmd+Shift+R)
3. **Check browser console** for errors
4. **Verify backend is serving** the new build files


