"""
Pluto Lander Backend - FastAPI Service
Trading bot control center with Alpaca integration
Serves both API and static dashboard
"""
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from pathlib import Path
import asyncio
import httpx

from .auth import get_current_user, create_access_token, authenticate_user
from .models import UserPublic, SettingsUpdate, SettingsPublic, TradeSignal, TelemetryMessage
from .config_manager import load_settings, save_settings, ensure_default_user
from .notifier import send_trade_notification
from . import alpaca_client

app = FastAPI(title="Pluto Lander Backend", version="3.0.0")

# CORS for development
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

telemetry_clients: List[WebSocket] = []

# Path to built dashboard and branding
DASHBOARD_DIR = Path(__file__).parent.parent / "dashboard" / "dist"
BRANDING_DIR = Path(__file__).parent.parent / "branding"


# ============== STARTUP ==============
@app.on_event("startup")
async def startup():
    ensure_default_user()
    print("[Pluto] 🚀 Backend started. Default admin user ensured.")
    print("[Pluto] 📡 WebSocket telemetry ready at /ws/telemetry")
    if DASHBOARD_DIR.exists():
        print(f"[Pluto] 🖥️  Dashboard serving from {DASHBOARD_DIR}")
    else:
        print(f"[Pluto] ⚠️  Dashboard not built yet. Run 'npm run build' in dashboard/")
    
    # Start ESP32 telemetry broadcast task
    asyncio.create_task(broadcast_esp32_telemetry())
    print("[Pluto] 📊 ESP32 telemetry broadcast started")


# ============== AUTH ROUTES ==============
@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": UserPublic.from_orm(user)}


@app.get("/api/auth/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)):
    return UserPublic.from_orm(current_user)


# ============== SETTINGS ROUTES ==============
@app.get("/api/settings", response_model=SettingsPublic)
async def get_settings(current_user=Depends(get_current_user)):
    return load_settings()


@app.put("/api/settings", response_model=SettingsPublic)
async def update_settings(update: SettingsUpdate, current_user=Depends(get_current_user)):
    settings = load_settings()
    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    save_settings(settings)
    return settings


# ============== ALPACA ROUTES ==============
@app.get("/api/alpaca/account")
async def get_alpaca_account(current_user=Depends(get_current_user)):
    """Get Alpaca account information"""
    account = await alpaca_client.get_account()
    if not account:
        raise HTTPException(status_code=503, detail="Alpaca not connected or not configured")
    return account


@app.get("/api/alpaca/positions")
async def get_alpaca_positions(current_user=Depends(get_current_user)):
    """Get all open positions"""
    return await alpaca_client.get_positions()


@app.get("/api/alpaca/orders")
async def get_alpaca_orders(
    status: str = "all",
    limit: int = 50,
    current_user=Depends(get_current_user)
):
    """Get order history"""
    return await alpaca_client.get_orders(status=status, limit=limit)


class OrderRequest(BaseModel):
    symbol: str
    qty: float
    side: str  # 'buy' or 'sell'
    type: str = "market"  # 'market' or 'limit'
    time_in_force: str = "day"
    limit_price: Optional[float] = None


@app.post("/api/alpaca/order")
async def submit_alpaca_order(order: OrderRequest, current_user=Depends(get_current_user)):
    """Submit a new order to Alpaca"""
    try:
        result = await alpaca_client.submit_order(
            symbol=order.symbol,
            qty=order.qty,
            side=order.side,
            order_type=order.type,
            time_in_force=order.time_in_force,
            limit_price=order.limit_price,
        )
        
        # Broadcast to telemetry clients
        msg = TelemetryMessage(
            type="order_submitted",
            symbol=order.symbol,
            side=order.side,
            extra={"qty": order.qty, "order_type": order.type}
        )
        await broadcast_telemetry(msg)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/alpaca/order/{order_id}")
async def cancel_alpaca_order(order_id: str, current_user=Depends(get_current_user)):
    """Cancel an order"""
    success = await alpaca_client.cancel_order(order_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel order")
    return {"status": "cancelled", "order_id": order_id}


@app.get("/api/alpaca/quote/{symbol}")
async def get_quote(symbol: str, current_user=Depends(get_current_user)):
    """Get latest quote for a symbol"""
    quote = await alpaca_client.get_latest_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not available")
    return quote


@app.get("/api/alpaca/bars/{symbol}")
async def get_bars(
    symbol: str,
    timeframe: str = "1Day",
    limit: int = 100,
    current_user=Depends(get_current_user)
):
    """Get historical bars for charting"""
    return await alpaca_client.get_bars(symbol, timeframe, limit)


# ============== TRADE SIGNAL ROUTES ==============
@app.post("/api/trade-signal")
async def trade_signal(signal: TradeSignal, current_user=Depends(get_current_user)):
    """Process incoming trade signal"""
    msg = TelemetryMessage(
        type="trade_signal",
        symbol=signal.symbol,
        side=signal.side,
        confidence=signal.confidence,
        reason=signal.reason,
        price=signal.price,
        extra=signal.extra,
    )
    
    await broadcast_telemetry(msg)
    
    settings = load_settings()
    await send_trade_notification(settings, msg)
    return {"status": "ok"}


# ============== WEBSOCKET TELEMETRY ==============
async def broadcast_telemetry(msg: TelemetryMessage):
    """Broadcast message to all connected WebSocket clients"""
    dead = []
    for ws in telemetry_clients:
        try:
            await ws.send_json(msg.dict())
        except Exception:
            dead.append(ws)
    for ws in dead:
        telemetry_clients.remove(ws)


@app.websocket("/ws/telemetry")
async def telemetry_ws(ws: WebSocket):
    """WebSocket endpoint for real-time telemetry (ESP32 and other clients)"""
    await ws.accept()
    telemetry_clients.append(ws)
    print(f"[Pluto] 📡 WebSocket client connected. Total: {len(telemetry_clients)}")
    try:
        while True:
            # Keep connection alive, handle incoming messages if needed
            data = await ws.receive_text()
            # Echo or process commands from client
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if ws in telemetry_clients:
            telemetry_clients.remove(ws)
        print(f"[Pluto] 📡 WebSocket client disconnected. Total: {len(telemetry_clients)}")


async def broadcast_esp32_telemetry():
    """Periodically broadcast telemetry data for ESP32 display"""
    import asyncio
    while True:
        try:
            if telemetry_clients:
                # Fetch BTC price
                try:
                    btc_resp = await httpx.AsyncClient().get("https://api.coinbase.com/v2/prices/BTC-USD/spot", timeout=5.0)
                    btc_data = btc_resp.json()
                    btc_price = float(btc_data["data"]["amount"])
                except:
                    btc_price = 0.0
                
                # Get account data if available
                try:
                    account = await alpaca_client.get_account()
                    profit_usd = float(account.get("portfolio_value", 0)) - 100000  # Mock profit
                    profit_today = float(account.get("daytrading_buying_power", 0)) * 0.01  # Mock today
                except:
                    profit_usd = 0.0
                    profit_today = 0.0
                
                # Mock sparkline (last 20 prices)
                sparkline = [btc_price + (i * 10 - 100) for i in range(20)]
                
                # Determine mode
                mode = "standby"
                if alpaca_client.is_connected():
                    mode = "live"
                
                telemetry_msg = {
                    "type": "telemetry",
                    "btc_price": btc_price,
                    "btc_change_24h": 2.5,  # Mock for now
                    "profit_usd": profit_usd,
                    "profit_today": profit_today,
                    "mode": mode,
                    "sparkline": sparkline
                }
                
                await broadcast_telemetry(TelemetryMessage(**telemetry_msg))
        except Exception as e:
            print(f"[Pluto] Error broadcasting ESP32 telemetry: {e}")
        
        await asyncio.sleep(5)  # Update every 5 seconds


# ============== HEALTH CHECK ==============
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Pluto Lander Backend",
        "version": "3.0.0",
        "websocket_clients": len(telemetry_clients)
    }


# ============== SYSTEM STATUS ==============
@app.get("/api/system/status")
async def system_status(current_user=Depends(get_current_user)):
    """Get overall system status"""
    settings = load_settings()
    alpaca_account = await alpaca_client.get_account()
    
    return {
        "backend": "online",
        "alpaca_connected": alpaca_account is not None,
        "alpaca_paper": settings.alpaca_paper,
        "websocket_clients": len(telemetry_clients),
        "account_status": alpaca_account.get("status") if alpaca_account else None,
    }


# ============== SERVE DASHBOARD ==============
# Mount static files for dashboard assets (must be after API routes)
if DASHBOARD_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DASHBOARD_DIR / "assets"), name="assets")

# Serve branding folder
if BRANDING_DIR.exists():
    app.mount("/branding", StaticFiles(directory=BRANDING_DIR), name="branding")


# Catch-all route to serve the dashboard for any non-API route
@app.get("/{full_path:path}")
async def serve_dashboard(full_path: str):
    """Serve the React dashboard for all non-API routes"""
    # Don't serve dashboard for API routes
    if full_path.startswith("api/") or full_path.startswith("ws/"):
        raise HTTPException(status_code=404, detail="Not found")
    
    # Check if it's a static file
    file_path = DASHBOARD_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Serve index.html for all other routes (SPA routing)
    index_path = DASHBOARD_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    # Dashboard not built
    return {"message": "Dashboard not built. Run 'cd dashboard && npm install && npm run build'"}
