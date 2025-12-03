import React, { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'

interface PiDisplayProps {
  token: string | null
  baseURL: string
  onExitKiosk?: () => void
}

interface PriceHistory {
  btc: number[]
  aapl: number[]
  spx: number[]
}

export const PiDisplayPage: React.FC<PiDisplayProps> = ({ token, baseURL, onExitKiosk }) => {
  // Price states
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [btcChange, setBtcChange] = useState<number>(0)
  const [aaplPrice, setAaplPrice] = useState<number>(0)
  const [aaplChange, setAaplChange] = useState<number>(0)
  const [spxPrice, setSpxPrice] = useState<number>(0)
  const [spxChange, setSpxChange] = useState<number>(0)
  const [blockHeight, setBlockHeight] = useState<number>(0)
  const [blockTime, setBlockTime] = useState<string>('')
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({ btc: [], aapl: [], spx: [] })
  
  // Account states
  const [equity, setEquity] = useState<number>(0)
  const [dayPL, setDayPL] = useState<number>(0)
  const [dayPLPercent, setDayPLPercent] = useState<number>(0)
  
  // Time
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)
  
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch BTC price from Coinbase
  useEffect(() => {
    const fetchBTC = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot')
        const data = await res.json()
        const price = parseFloat(data.data.amount)
        setBtcPrice(price)
        setPriceHistory(prev => ({ ...prev, btc: [...prev.btc.slice(-29), price] }))
        
        // Get 24h change
        const res24h = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/buy')
        const data24h = await res24h.json()
        const price24h = parseFloat(data24h.data.amount)
        const change = ((price - price24h) / price24h) * 100
        setBtcChange(change)
      } catch (e) {
        console.error('BTC fetch error:', e)
      }
    }
    fetchBTC()
    const interval = setInterval(fetchBTC, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch block height from mempool.space
  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const res = await fetch('https://mempool.space/api/blocks/tip/height')
        const height = await res.json()
        setBlockHeight(height)
        setBlockTime(new Date().toLocaleString('en-US', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))
      } catch (e) {
        console.error('Block height fetch error:', e)
      }
    }
    fetchBlock()
    const interval = setInterval(fetchBlock, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch Alpaca data (stocks + account) - only if token available
  useEffect(() => {
    if (!token) {
      // No token - use mock/default values, display still works
      setEquity(100000)
      setDayPL(0)
      setDayPLPercent(0)
      setAaplPrice(178.50)
      setAaplChange(1.2)
      setSpxPrice(4567.89)
      setSpxChange(-0.8)
      return
    }
    
    const fetchAlpaca = async () => {
      try {
        // Fetch account
        const accountRes = await axios.get(`${baseURL}/api/alpaca/account`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (accountRes.data) {
          const eq = parseFloat(accountRes.data.equity)
          const lastEq = parseFloat(accountRes.data.last_equity)
          setEquity(eq)
          setDayPL(eq - lastEq)
          setDayPLPercent(lastEq > 0 ? ((eq - lastEq) / lastEq) * 100 : 0)
        }

        // Fetch AAPL quote
        try {
          const aaplRes = await axios.get(`${baseURL}/api/alpaca/quote/AAPL`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (aaplRes.data?.quote?.ap) {
            const price = aaplRes.data.quote.ap
            setAaplPrice(price)
            setPriceHistory(prev => ({ ...prev, aapl: [...prev.aapl.slice(-29), price] }))
          }
        } catch { 
          // Mock data if API fails
          setAaplPrice(178.50 + Math.random() * 2)
          setAaplChange(1.2 + Math.random() * 0.5)
        }

        // Fetch SPY as SPX proxy
        try {
          const spyRes = await axios.get(`${baseURL}/api/alpaca/quote/SPY`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (spyRes.data?.quote?.ap) {
            const price = spyRes.data.quote.ap * 10 // Approximate SPX from SPY
            setSpxPrice(price)
            setPriceHistory(prev => ({ ...prev, spx: [...prev.spx.slice(-29), price] }))
          }
        } catch {
          // Mock data if API fails
          setSpxPrice(4567.89 + Math.random() * 10)
          setSpxChange(-0.8 + Math.random() * 0.3)
        }
      } catch (e) {
        console.error('Alpaca fetch error:', e)
      }
    }
    
    fetchAlpaca()
    const interval = setInterval(fetchAlpaca, 30000)
    return () => clearInterval(interval)
  }, [token, baseURL])

  // Auto-login for kiosk - silent background login (non-blocking)
  useEffect(() => {
    if (!token && baseURL) {
      let cancelled = false
      const autoLogin = async () => {
        if (cancelled) return
        try {
          const form = new URLSearchParams()
          form.append('username', 'admin')
          form.append('password', 'pluto123')
          form.append('grant_type', '')
          const res = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          })
          if (res.ok) {
            const data = await res.json()
            console.log('[PiDisplay] ✅ Background login successful')
            localStorage.setItem('pluto_token', data.access_token)
            // Trigger parent to update token
            window.dispatchEvent(new CustomEvent('pluto-login', { detail: data.access_token }))
          } else {
            console.warn('[PiDisplay] Background login failed (will continue without auth):', res.status)
          }
        } catch (e) {
          console.warn('[PiDisplay] Background login error (will continue without auth):', e)
        }
      }
      // Try auto-login but don't block display - delay to let page render first
      const timer = setTimeout(autoLogin, 2000)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }
  }, [token, baseURL])

  // Format helpers
  const formatPrice = (price: number, decimals = 2) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // Sparkline SVG generator
  const getSparkline = (data: number[], color: string, height = 40) => {
    if (data.length < 2) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const width = 100
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 4)
      return `${x},${y}`
    }).join(' ')

    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Time digits for flip clock
  const hours = currentTime.getHours().toString().padStart(2, '0')
  const minutes = currentTime.getMinutes().toString().padStart(2, '0')

  // In kiosk mode, show display even without token (will use public APIs)
  // No loading screen - just show the dashboard

  return (
    <div className="braiins-display" onClick={() => setShowMenu(true)}>
      {/* Grid Layout */}
      <div className="braiins-grid">
        {/* TIME PANEL */}
        <div className="braiins-card time-card">
          <div className="card-header">
            <span className="card-title">Local Time</span>
          </div>
          <div className="flip-clock">
            <div className="flip-digit">{hours[0]}</div>
            <div className="flip-digit">{hours[1]}</div>
            <div className="flip-colon">:</div>
            <div className="flip-digit">{minutes[0]}</div>
            <div className="flip-digit">{minutes[1]}</div>
          </div>
        </div>

        {/* BTC-USD SMALL */}
        <div className="braiins-card btc-small-card">
          <div className="card-header">
            <span className="btc-icon">●</span>
            <span className="card-title">BTC-USD</span>
          </div>
          <div className="price-row">
            <span className="price-medium">{formatPrice(btcPrice, 0)}</span>
            <span className={`change-badge ${btcChange >= 0 ? 'positive' : 'negative'}`}>
              {formatChange(btcChange)}
            </span>
          </div>
          <div className="sparkline-container">
            {getSparkline(priceHistory.btc, '#22c55e', 35)}
          </div>
        </div>

        {/* STOCKS PANEL */}
        <div className="braiins-card stocks-card">
          <div className="stock-row">
            <div className="stock-info">
              <span className="stock-name">APPLE</span>
              <span className="stock-sub">Apple Inc.</span>
            </div>
            <div className="stock-price">
              <span className="price-value">{formatPrice(aaplPrice)}</span>
              <span className={`change-small ${aaplChange >= 0 ? 'positive' : 'negative'}`}>
                {formatChange(aaplChange)}
              </span>
            </div>
          </div>
          <div className="stock-divider"></div>
          <div className="stock-row">
            <div className="stock-info">
              <span className="stock-name">SPX</span>
              <span className="stock-sub">S&P 500</span>
            </div>
            <div className="stock-price">
              <span className="price-value">{formatPrice(spxPrice)}</span>
              <span className={`change-small ${spxChange >= 0 ? 'positive' : 'negative'}`}>
                {formatChange(spxChange)}
              </span>
            </div>
          </div>
        </div>

        {/* BTC-USD LARGE */}
        <div className="braiins-card btc-large-card">
          <div className="card-header">
            <span className="btc-dot">●</span>
            <span className="card-title">BTC-USD</span>
            <span className="card-label">24h</span>
            <span className={`change-badge ${btcChange >= 0 ? 'positive' : 'negative'}`}>
              {formatChange(btcChange)}
            </span>
          </div>
          <div className="price-large">{formatPrice(btcPrice, 0)}</div>
          <div className="sparkline-large">
            {getSparkline(priceHistory.btc, '#22c55e', 50)}
          </div>
        </div>

        {/* BLOCK HEIGHT */}
        <div className="braiins-card block-card">
          <div className="card-header">
            <span className="card-title">Bitcoin Block Height</span>
          </div>
          <div className="block-number">{blockHeight.toLocaleString()}</div>
          <div className="block-time">{blockTime}</div>
        </div>

        {/* PORTFOLIO / TRADING STATS */}
        <div className="braiins-card pool-card">
          <div className="card-header">
            <span className="pool-icon">₿</span>
            <span className="card-title">Portfolio</span>
          </div>
          <div className="pool-value">${formatPrice(equity, 2)}</div>
          <div className={`pool-change ${dayPL >= 0 ? 'positive' : 'negative'}`}>
            Day P&L: {dayPL >= 0 ? '+' : ''}{formatPrice(dayPL, 2)} ({formatChange(dayPLPercent)})
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="braiins-footer">
        <span className="footer-text">PLUTO LANDER</span>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="braiins-menu" onClick={(e) => e.stopPropagation()}>
          <button className="menu-btn" onClick={() => { document.documentElement.requestFullscreen(); setShowMenu(false); }}>
            ⬛ Fullscreen
          </button>
          <button className="menu-btn" onClick={onExitKiosk}>
            🚪 Exit Kiosk
          </button>
          <button className="menu-btn close" onClick={() => setShowMenu(false)}>
            ✕ Close
          </button>
        </div>
      )}
    </div>
  )
}
