import React, { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'

interface TelemetryMessage {
  type: string
  symbol?: string
  side?: string
  confidence?: number
  reason?: string
  price?: number
  extra?: Record<string, any>
}

interface AlpacaAccount {
  equity: string
  cash: string
  buying_power: string
  portfolio_value: string
  last_equity: string
}

interface Position {
  symbol: string
  qty: string
  market_value: string
  unrealized_pl: string
  unrealized_plpc: string
  current_price: string
  avg_entry_price: string
}

interface PiDisplayProps {
  token: string | null
  baseURL: string
  onExitKiosk?: () => void
}

export const PiDisplayPage: React.FC<PiDisplayProps> = ({ token, baseURL, onExitKiosk }) => {
  const [account, setAccount] = useState<AlpacaAccount | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [prevBtcPrice, setPrevBtcPrice] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alpacaConnected, setAlpacaConnected] = useState(false)
  const [tradingMode, setTradingMode] = useState<'paper' | 'live'>('paper')
  const [systemStatus, setSystemStatus] = useState<'active' | 'standby' | 'offline'>('standby')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [currentView, setCurrentView] = useState<'main' | 'positions' | 'chart'>('main')
  const [alerts, setAlerts] = useState<TelemetryMessage[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // WebSocket connection for real-time telemetry
  useEffect(() => {
    if (!token) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}${baseURL}/ws/telemetry`
    
    const connectWs = () => {
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('[Pi Display] WebSocket connected')
          setWsConnected(true)
          // Send ping to keep alive
          ws.send('ping')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as TelemetryMessage
            if (data.type === 'pong') return
            
            // Add alert with timestamp
            setAlerts(prev => [...prev.slice(-4), { ...data, extra: { ...data.extra, timestamp: new Date().toISOString() } }])
            
            // Auto-clear old alerts
            setTimeout(() => {
              setAlerts(prev => prev.slice(1))
            }, 10000)
          } catch {
            // Ignore parse errors
          }
        }

        ws.onclose = () => {
          console.log('[Pi Display] WebSocket disconnected')
          setWsConnected(false)
          // Reconnect after 5 seconds
          setTimeout(connectWs, 5000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        setTimeout(connectWs, 5000)
      }
    }

    connectWs()

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      wsRef.current?.close()
    }
  }, [token, baseURL])

  // Hide menu after inactivity
  useEffect(() => {
    if (showMenu) {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current)
      menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 5000)
    }
    return () => {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current)
    }
  }, [showMenu])

  // Fetch BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot')
        const data = await res.json()
        const newPrice = parseFloat(data.data.amount)
        setPrevBtcPrice(btcPrice)
        setBtcPrice(newPrice)
      } catch {
        // Ignore
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 3000)
    return () => clearInterval(interval)
  }, [])

  // Fetch Alpaca data
  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        // Fetch account
        const accountRes = await axios.get(`${baseURL}/api/alpaca/account`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (accountRes.data) {
          setAccount(accountRes.data)
          setAlpacaConnected(true)
        }

        // Fetch positions
        const positionsRes = await axios.get(`${baseURL}/api/alpaca/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPositions(positionsRes.data || [])

        // Fetch settings for trading mode
        const settingsRes = await axios.get(`${baseURL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTradingMode(settingsRes.data.alpaca_paper ? 'paper' : 'live')
        
        setLastUpdate(new Date())
        setSystemStatus('active')
      } catch {
        setAlpacaConnected(false)
        setSystemStatus('offline')
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [token, baseURL])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Format helpers
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '$0.00'
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
  }

  const formatPercent = (value: string) => {
    const num = parseFloat(value) * 100
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Calculate totals
  const equity = account ? parseFloat(account.equity) : 0
  const lastEquity = account ? parseFloat(account.last_equity) : 0
  const dayPL = equity - lastEquity
  const dayPLPercent = lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0
  const totalUnrealizedPL = positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pl || '0'), 0)

  const priceDirection = btcPrice > prevBtcPrice ? 'up' : btcPrice < prevBtcPrice ? 'down' : 'neutral'

  // Render main view
  const renderMainView = () => (
    <div className="pi-grid">
      {/* Top Row - Portfolio & BTC */}
      <div className="pi-card pi-card-large">
        <div className="pi-card-header">
          <span className="pi-icon">💰</span>
          <span>Portfolio Value</span>
        </div>
        <div className="pi-value-xl">{formatCurrency(equity)}</div>
        <div className={`pi-change ${dayPL >= 0 ? 'positive' : 'negative'}`}>
          {dayPL >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(dayPL))} ({dayPLPercent >= 0 ? '+' : ''}{dayPLPercent.toFixed(2)}%)
        </div>
      </div>

      <div className="pi-card pi-card-large">
        <div className="pi-card-header">
          <span className="pi-icon-btc">₿</span>
          <span>Bitcoin</span>
        </div>
        <div className={`pi-value-xl pi-btc ${priceDirection}`}>
          ${btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---'}
        </div>
        <div className="pi-sparkline">
          <div className={`pi-trend ${priceDirection}`}>
            {priceDirection === 'up' ? '📈' : priceDirection === 'down' ? '📉' : '➡️'} Live
          </div>
        </div>
      </div>

      {/* Bottom Row - Stats */}
      <div className="pi-card">
        <div className="pi-card-header-sm">Cash Available</div>
        <div className="pi-value-lg">{formatCurrency(account?.cash || 0)}</div>
      </div>

      <div className="pi-card">
        <div className="pi-card-header-sm">Buying Power</div>
        <div className="pi-value-lg">{formatCurrency(account?.buying_power || 0)}</div>
      </div>

      <div className="pi-card">
        <div className="pi-card-header-sm">Unrealized P&L</div>
        <div className={`pi-value-lg ${totalUnrealizedPL >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(totalUnrealizedPL)}
        </div>
      </div>

      <div className="pi-card">
        <div className="pi-card-header-sm">Positions</div>
        <div className="pi-value-lg">{positions.length}</div>
      </div>
    </div>
  )

  // Render positions view
  const renderPositionsView = () => (
    <div className="pi-positions">
      <div className="pi-positions-header">
        <span className="pi-icon">📊</span>
        <span>Open Positions</span>
        <span className="pi-badge">{positions.length}</span>
      </div>
      
      {positions.length === 0 ? (
        <div className="pi-empty">
          <div className="pi-empty-icon">📭</div>
          <div>No open positions</div>
        </div>
      ) : (
        <div className="pi-positions-list">
          {positions.slice(0, 6).map((pos) => {
            const pl = parseFloat(pos.unrealized_pl || '0')
            const plPercent = parseFloat(pos.unrealized_plpc || '0') * 100
            return (
              <div key={pos.symbol} className="pi-position-row">
                <div className="pi-position-symbol">
                  <span className="symbol">{pos.symbol}</span>
                  <span className="qty">{parseFloat(pos.qty).toFixed(4)} shares</span>
                </div>
                <div className="pi-position-value">
                  <span className="value">{formatCurrency(pos.market_value)}</span>
                  <span className={`pl ${pl >= 0 ? 'positive' : 'negative'}`}>
                    {pl >= 0 ? '+' : ''}{formatCurrency(pl)} ({plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div 
      className="pi-display" 
      onClick={() => setShowMenu(true)}
    >
      {/* Status Bar */}
      <div className="pi-status-bar">
        <div className="pi-status-left">
          <div className={`pi-status-dot ${systemStatus}`} />
          <span className="pi-status-text">
            {systemStatus === 'active' ? 'SYSTEM ACTIVE' : systemStatus === 'standby' ? 'STANDBY' : 'OFFLINE'}
          </span>
          {tradingMode === 'live' && <span className="pi-live-badge">LIVE</span>}
          {tradingMode === 'paper' && <span className="pi-paper-badge">PAPER</span>}
        </div>
        
        <div className="pi-status-center">
          <div className="pi-logo">
            <span className="pi-logo-icon">🚀</span>
            <span className="pi-logo-text">PLUTO LANDER</span>
          </div>
        </div>

        <div className="pi-status-right">
          <div className={`pi-connection ${wsConnected ? 'connected' : 'disconnected'}`}>
            <span className="pi-connection-dot" />
            <span>{wsConnected ? 'WS' : 'WS OFF'}</span>
          </div>
          <div className={`pi-connection ${alpacaConnected ? 'connected' : 'disconnected'}`}>
            <span className="pi-connection-dot" />
            <span>{alpacaConnected ? 'ALPACA' : 'DISC'}</span>
          </div>
          <div className="pi-clock">
            <div className="pi-time">{formatTime(currentTime)}</div>
            <div className="pi-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pi-content">
        {currentView === 'main' && renderMainView()}
        {currentView === 'positions' && renderPositionsView()}
      </div>

      {/* Bottom Bar */}
      <div className="pi-bottom-bar">
        <div className="pi-nav-buttons">
          <button 
            className={`pi-nav-btn ${currentView === 'main' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setCurrentView('main') }}
          >
            <span>📊</span> Dashboard
          </button>
          <button 
            className={`pi-nav-btn ${currentView === 'positions' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setCurrentView('positions') }}
          >
            <span>💼</span> Positions
          </button>
        </div>
        
        <div className="pi-update-info">
          Last update: {formatTime(lastUpdate)}
        </div>
      </div>

      {/* Alerts Overlay */}
      {alerts.length > 0 && (
        <div className="pi-alerts">
          {alerts.map((alert, i) => (
            <div 
              key={`${alert.type}-${i}`} 
              className={`pi-alert ${alert.side === 'buy' ? 'buy' : alert.side === 'sell' ? 'sell' : 'info'}`}
            >
              <div className="pi-alert-icon">
                {alert.type === 'trade_signal' ? '📊' : alert.type === 'order_submitted' ? '✅' : '🔔'}
              </div>
              <div className="pi-alert-content">
                <div className="pi-alert-title">
                  {alert.type === 'trade_signal' ? 'Trade Signal' : 
                   alert.type === 'order_submitted' ? 'Order Submitted' : 'Alert'}
                </div>
                <div className="pi-alert-message">
                  {alert.symbol && <span className="symbol">{alert.symbol}</span>}
                  {alert.side && <span className={`side ${alert.side}`}>{alert.side.toUpperCase()}</span>}
                  {alert.confidence && <span className="confidence">{(alert.confidence * 100).toFixed(0)}%</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Menu */}
      {showMenu && (
        <div className="pi-menu" onClick={(e) => e.stopPropagation()}>
          <button className="pi-menu-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '⬜ Exit Fullscreen' : '⬛ Fullscreen'}
          </button>
          <button className="pi-menu-btn" onClick={onExitKiosk}>
            🚪 Exit Kiosk
          </button>
          <button className="pi-menu-btn close" onClick={() => setShowMenu(false)}>
            ✕ Close
          </button>
        </div>
      )}
    </div>
  )
}

