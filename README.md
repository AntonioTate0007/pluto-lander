# 🚀 Pluto Lander v3.0

A Braiins Deck-inspired trading bot dashboard for Raspberry Pi 4 with Alpaca Markets integration.

![Pluto Lander](branding/pluto_launcher_logo.png)

## Features

- **Real-time Trading Dashboard** - Beautiful dark UI with gold accents (inspired by [Braiins Deck](https://braiins.com/blog/braiins-deck-the-bitcoin-clock-for-traders-and-miners))
- **Alpaca Integration** - Paper and live trading through Alpaca Markets API
- **Portfolio Tracking** - View positions, P&L, and account balance
- **Trade Execution** - Execute market and limit orders directly
- **WebSocket Telemetry** - Real-time updates for ESP32 display
- **Notification System** - Email/SMS alerts for trade signals
- **5" Pi Display** - Designed for Raspberry Pi touchscreen kiosk mode

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Web Browser    │────▶│  FastAPI Backend │────▶│   Alpaca API     │
│   (Dashboard)    │     │   (Port 8000)    │     │  (Paper/Live)    │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                                  │ WebSocket
                                  ▼
                         ┌──────────────────┐
                         │   ESP32 Display  │
                         │   (Optional)     │
                         └──────────────────┘
```

## Project Structure

```
pluto_launcher_v3/
├── backend/           # FastAPI server
│   ├── app.py         # Main API endpoints
│   ├── models.py      # Pydantic data models
│   ├── auth.py        # JWT authentication
│   ├── security.py    # Password hashing
│   ├── config_manager.py  # Settings persistence
│   ├── alpaca_client.py   # Alpaca API client
│   └── notifier.py    # Email/SMS notifications
├── dashboard/         # React frontend (Vite + Tailwind)
│   └── src/
│       └── components/
│           ├── App.tsx
│           ├── LoginPage.tsx
│           ├── DashboardPage.tsx
│           ├── SettingsPage.tsx
│           └── TradesPage.tsx
├── branding/          # Logo and assets
├── deploy.sh          # Pi deployment script
└── DEPLOY_INSTRUCTIONS.md
```

## Quick Start

### Development (Windows/Mac)

1. **Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn backend.app:app --reload --port 8000
```

2. **Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```

3. Open http://localhost:5173

### Raspberry Pi Deployment

See [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md) for full setup guide.

Quick version:
```bash
# On Pi
mkdir -p ~/pluto-lander
# Copy files from Windows
# Run: ./deploy.sh
```

## Configuration

### Alpaca API
1. Get API keys from [Alpaca Markets](https://app.alpaca.markets/)
2. Login to dashboard → Settings
3. Enter API Key and Secret
4. Toggle Paper/Live trading mode

### Notifications
- Set email address for trade alerts
- Configure SMTP in `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/settings` | GET/PUT | User settings |
| `/api/alpaca/account` | GET | Alpaca account info |
| `/api/alpaca/positions` | GET | Open positions |
| `/api/alpaca/orders` | GET | Order history |
| `/api/alpaca/order` | POST | Submit order |
| `/ws/telemetry` | WS | Real-time updates |

## Default Credentials

- **Dashboard:** admin / pluto123
- **Pi SSH:** admin / admin5384

⚠️ **Change these after first login!**

## Technologies

- **Backend:** FastAPI, Python 3.11+, httpx, Pydantic
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Hardware:** Raspberry Pi 4, 5" touchscreen, ESP32 (optional)

## License

MIT License - Use freely for personal trading projects.

---

Built with ❤️ for the trading community. Inspired by [Braiins Deck](https://braiins.com/blog/braiins-deck-the-bitcoin-clock-for-traders-and-miners).
