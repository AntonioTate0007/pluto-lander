
# Pluto Launcher Backend

FastAPI service for Raspberry Pi 4.

- JWT login (default user: admin / pluto123 — CHANGE THIS in `backend/config/user.json`)
- Settings API for Alpaca keys, notifications, and display layout
- Trade signal endpoint: POST /api/trade-signal
- Telemetry WebSocket: /ws/telemetry

Run:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```
