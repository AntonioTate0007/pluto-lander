"""
Alpaca Trading API Client
Handles paper and live trading through Alpaca Markets API
"""
import httpx
from typing import Optional, Dict, Any, List
from .config_manager import load_settings


def get_alpaca_client():
    """Get configured Alpaca API client with headers"""
    settings = load_settings()
    
    if not settings.alpaca_api_key or not settings.alpaca_api_secret:
        return None, None
    
    # Use paper or live endpoint based on settings
    if settings.alpaca_paper:
        base_url = "https://paper-api.alpaca.markets"
        data_url = "https://data.alpaca.markets"
    else:
        base_url = "https://api.alpaca.markets"
        data_url = "https://data.alpaca.markets"
    
    headers = {
        "APCA-API-KEY-ID": settings.alpaca_api_key,
        "APCA-API-SECRET-KEY": settings.alpaca_api_secret,
        "Content-Type": "application/json"
    }
    
    return base_url, headers, data_url


async def get_account() -> Optional[Dict[str, Any]]:
    """Get Alpaca account information"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        return None
    
    base_url, headers, _ = result
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{base_url}/v2/account",
                headers=headers,
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Alpaca] Account fetch failed: {e}")
            return None


async def get_positions() -> List[Dict[str, Any]]:
    """Get all open positions"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        return []
    
    base_url, headers, _ = result
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{base_url}/v2/positions",
                headers=headers,
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Alpaca] Positions fetch failed: {e}")
            return []


async def get_orders(status: str = "all", limit: int = 50) -> List[Dict[str, Any]]:
    """Get order history"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        return []
    
    base_url, headers, _ = result
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{base_url}/v2/orders",
                headers=headers,
                params={"status": status, "limit": limit, "direction": "desc"},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Alpaca] Orders fetch failed: {e}")
            return []


async def submit_order(
    symbol: str,
    qty: float,
    side: str,
    order_type: str = "market",
    time_in_force: str = "day",
    limit_price: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    """Submit a new order"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        raise ValueError("Alpaca API not configured")
    
    base_url, headers, _ = result
    
    order_data = {
        "symbol": symbol,
        "qty": str(qty),
        "side": side,
        "type": order_type,
        "time_in_force": time_in_force,
    }
    
    if order_type == "limit" and limit_price:
        order_data["limit_price"] = str(limit_price)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{base_url}/v2/orders",
                headers=headers,
                json=order_data,
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            print(f"[Alpaca] Order submit failed: {error_detail}")
            raise ValueError(f"Order failed: {error_detail}")
        except Exception as e:
            print(f"[Alpaca] Order submit failed: {e}")
            raise ValueError(f"Order failed: {str(e)}")


async def cancel_order(order_id: str) -> bool:
    """Cancel an order by ID"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        return False
    
    base_url, headers, _ = result
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{base_url}/v2/orders/{order_id}",
                headers=headers,
                timeout=10.0
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"[Alpaca] Cancel order failed: {e}")
            return False


async def get_latest_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """Get latest quote for a symbol"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        return None
    
    _, headers, data_url = result
    
    async with httpx.AsyncClient() as client:
        try:
            # For crypto
            if symbol.endswith("USD") and len(symbol) > 4:
                response = await client.get(
                    f"{data_url}/v1beta3/crypto/us/latest/quotes",
                    headers=headers,
                    params={"symbols": symbol},
                    timeout=10.0
                )
            else:
                # For stocks
                response = await client.get(
                    f"{data_url}/v2/stocks/{symbol}/quotes/latest",
                    headers=headers,
                    timeout=10.0
                )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Alpaca] Quote fetch failed: {e}")
            return None


async def get_bars(symbol: str, timeframe: str = "1Day", limit: int = 100) -> List[Dict[str, Any]]:
    """Get historical bars for a symbol"""
    result = get_alpaca_client()
    if result is None or result[0] is None:
        return []
    
    _, headers, data_url = result
    
    async with httpx.AsyncClient() as client:
        try:
            # For crypto
            if symbol.endswith("USD") and len(symbol) > 4:
                response = await client.get(
                    f"{data_url}/v1beta3/crypto/us/bars",
                    headers=headers,
                    params={"symbols": symbol, "timeframe": timeframe, "limit": limit},
                    timeout=10.0
                )
            else:
                # For stocks
                response = await client.get(
                    f"{data_url}/v2/stocks/{symbol}/bars",
                    headers=headers,
                    params={"timeframe": timeframe, "limit": limit},
                    timeout=10.0
                )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Alpaca] Bars fetch failed: {e}")
            return []

