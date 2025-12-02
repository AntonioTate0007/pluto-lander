import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useAuth } from './App'

interface Props {
  btcPrice: number
}

interface Settings {
  alpaca_api_key?: string | null
  alpaca_api_key_masked?: string | null
  alpaca_api_secret_masked?: string | null
  alpaca_paper: boolean
  notify_email?: string | null
  notify_sms_number?: string | null
  display_theme: string
  display_layout: string
}

interface AlpacaAccount {
  equity: string
  cash: string
  buying_power: string
  portfolio_value: string
  status: string
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

export const DashboardPage: React.FC<Props> = ({ btcPrice }) => {
  const { token, baseURL, logout } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [alpacaConnected, setAlpacaConnected] = useState(false)
  const [account, setAccount] = useState<AlpacaAccount | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [systemArmed, setSystemArmed] = useState(false)
  const [autoTrading, setAutoTrading] = useState(false)
  const [networkActive, setNetworkActive] = useState(true)
  const [standbyMode, setStandbyMode] = useState(true)
  const [tradingEngineOn, setTradingEngineOn] = useState(false)
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [dailyPL, setDailyPL] = useState<number>(0)
  const wsRef = useRef<WebSocket | null>(null)

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/settings', {
          baseURL,
          headers: { Authorization: `Bearer ${token}` },
        })
        setSettings(res.data)
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
    load()
  }, [token, baseURL])

  // Load Alpaca account data
  useEffect(() => {
    const loadAlpaca = async () => {
      try {
        const res = await axios.get('/api/alpaca/account', {
          baseURL,
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.data) {
          setAccount(res.data)
          setAlpacaConnected(true)
        }
      } catch {
        setAlpacaConnected(false)
      }
    }

    const loadPositions = async () => {
      try {
        const res = await axios.get('/api/alpaca/positions', {
          baseURL,
          headers: { Authorization: `Bearer ${token}` },
        })
        setPositions(res.data || [])
      } catch {
        // Ignore
      }
    }

    loadAlpaca()
    loadPositions()
    const interval = setInterval(() => {
      loadAlpaca()
      loadPositions()
    }, 30000)
    return () => clearInterval(interval)
  }, [token, baseURL])

  // WebSocket for telemetry
  useEffect(() => {
    const wsURL = baseURL.replace('http', 'ws') + '/ws/telemetry'
    const ws = new WebSocket(wsURL)
    wsRef.current = ws
    
    ws.onopen = () => console.log('[WS] Connected')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('[WS] Message:', data)
    }
    ws.onclose = () => console.log('[WS] Disconnected')
    
    return () => ws.close()
  }, [baseURL])

  // Track BTC price history
  useEffect(() => {
    if (btcPrice > 0) {
      setPriceHistory(prev => [...prev.slice(-31), btcPrice])
    }
  }, [btcPrice])

  // Calculate portfolio value
  const portfolioValue = positions.reduce((sum, p) => sum + parseFloat(p.market_value || '0'), 0)
  const totalPL = positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pl || '0'), 0)

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const formatPercent = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    const formatted = (num * 100).toFixed(2)
    return num >= 0 ? `+${formatted}%` : `${formatted}%`
  }

  // Circle gauge calculation
  const cashValue = account ? parseFloat(account.cash) : 100000
  const equity = account ? parseFloat(account.equity) : 100000
  const cashPercentage = equity > 0 ? (cashValue / equity) * 100 : 100
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (cashPercentage / 100) * circumference

  return (
    <div className="p-6 grid grid-cols-12 gap-6 max-w-[1800px] mx-auto">
      {/* LEFT COLUMN */}
      <div className="col-span-3 space-y-4">
        {/* System Status */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`status-dot ${standbyMode ? 'standby' : tradingEngineOn ? 'online' : 'offline'}`} />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
            {standbyMode ? 'SYSTEM STANDBY' : tradingEngineOn ? 'SYSTEM ACTIVE' : 'SYSTEM OFFLINE'}
          </span>
        </div>

        {/* Tagline */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Trade.<br />Monitor.<br />Profit.
          </h2>
          <p className="text-sm text-gray-500 mt-3">
            Advanced algorithmic trading with real-time market analysis and risk management.
          </p>
        </div>

        {/* Trading Engine Card */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-4 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pluto-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-pluto-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Trading Engine</div>
                <div className="text-xs text-gray-500">
                  {tradingEngineOn ? 'Running' : 'Idle'} - {tradingEngineOn ? 'Active' : 'Ready'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setTradingEngineOn(!tradingEngineOn)}
              className={`toggle-switch ${tradingEngineOn ? 'active' : ''}`}
            />
          </div>
        </div>

        {/* Alpaca Connection Card */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-4 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alpacaConnected ? 'bg-pluto-green/10' : 'bg-pluto-red/10'}`}>
                <svg className={`w-5 h-5 ${alpacaConnected ? 'text-pluto-green' : 'text-pluto-red'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Alpaca Connection</div>
                <div className={`text-xs ${alpacaConnected ? 'text-pluto-green' : 'text-gray-500'}`}>
                  {alpacaConnected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            <div className={`toggle-switch ${alpacaConnected ? 'active' : ''}`} style={{ pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Trading Mode Card */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-4 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pluto-blue/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-pluto-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Trading Mode</div>
                <div className="text-xs text-gray-500">
                  {settings?.alpaca_paper ? 'Paper Trading' : 'Live Trading'}
                </div>
              </div>
            </div>
          </div>
          <button className="mt-3 w-full btn-primary text-sm">
            {settings?.alpaca_paper ? 'SWITCH TO LIVE' : 'SWITCH TO PAPER'}
          </button>
        </div>
      </div>

      {/* CENTER COLUMN */}
      <div className="col-span-6 space-y-4">
        {/* Portfolio Value Card */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-6 card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-pluto-accent/20 flex items-center justify-center">
              <span className="text-xl font-bold text-pluto-accent">₿</span>
            </div>
            <span className="font-semibold text-gray-300">Portfolio Value</span>
          </div>
          <div className="text-4xl font-bold text-white font-mono">
            {formatCurrency(portfolioValue)}
          </div>
          {totalPL !== 0 && (
            <div className={`text-sm mt-2 ${totalPL >= 0 ? 'text-pluto-green' : 'text-pluto-red'}`}>
              {totalPL >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(totalPL))} today
            </div>
          )}
        </div>

        {/* Account Balance Card with Circular Gauge */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-6 card-hover">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-pluto-blue/20 flex items-center justify-center">
              <span className="text-lg">💵</span>
            </div>
            <span className="font-semibold text-gray-300">Account Balance</span>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="circular-gauge relative">
              <svg width="180" height="180" viewBox="0 0 180 180">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <circle className="track" cx="90" cy="90" r="70" />
                <circle
                  className="progress"
                  cx="90"
                  cy="90"
                  r="70"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {formatCurrency(equity)}
                </div>
                <div className="text-xs text-gray-500 uppercase mt-1">EQUITY</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-pluto-border">
            <div>
              <div className="text-xs text-gray-500 uppercase">Cash</div>
              <div className="text-lg font-semibold text-white font-mono">
                {formatCurrency(cashValue)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Buying Power</div>
              <div className="text-lg font-semibold text-white font-mono">
                {account ? formatCurrency(account.buying_power) : '$0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Positions */}
        {positions.length > 0 && (
          <div className="bg-pluto-card rounded-xl border border-pluto-border p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-300">Open Positions</span>
              <span className="text-xs text-gray-500">{positions.length} active</span>
            </div>
            <div className="space-y-3">
              {positions.slice(0, 5).map((pos) => (
                <div key={pos.symbol} className="flex items-center justify-between p-3 bg-pluto-panel rounded-lg">
                  <div>
                    <div className="font-semibold text-white">{pos.symbol}</div>
                    <div className="text-xs text-gray-500">{pos.qty} shares @ {formatCurrency(pos.avg_entry_price)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white">{formatCurrency(pos.market_value)}</div>
                    <div className={`text-xs ${parseFloat(pos.unrealized_pl) >= 0 ? 'text-pluto-green' : 'text-pluto-red'}`}>
                      {formatCurrency(pos.unrealized_pl)} ({formatPercent(pos.unrealized_plpc)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="col-span-3 space-y-4">
        {/* Quick Actions */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-pluto-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-white">Quick Actions</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <span className="text-sm text-gray-300">System Arm</span>
              </div>
              <button
                onClick={() => setSystemArmed(!systemArmed)}
                className={`toggle-switch ${systemArmed ? 'active' : ''}`}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm text-gray-300">Auto Trading</span>
              </div>
              <button
                onClick={() => setAutoTrading(!autoTrading)}
                className={`toggle-switch ${autoTrading ? 'active' : ''}`}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <span className="text-sm text-gray-300">Network</span>
              </div>
              <button
                onClick={() => setNetworkActive(!networkActive)}
                className={`toggle-switch ${networkActive ? 'active' : ''}`}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💤</span>
                <span className="text-sm text-gray-300">Standby</span>
              </div>
              <button
                onClick={() => setStandbyMode(!standbyMode)}
                className={`toggle-switch ${standbyMode ? 'active' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Market Data */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-pluto-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="font-semibold text-white">Market Data</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-pluto-accent font-bold">₿</span>
                BTC/USD
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
              </div>
              
              {/* Mini chart */}
              <div className="h-12 flex items-end gap-0.5 mt-3">
                {priceHistory.map((price, i) => {
                  const min = Math.min(...priceHistory)
                  const max = Math.max(...priceHistory)
                  const range = max - min || 1
                  const height = ((price - min) / range) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-pluto-accent/60 rounded-t sparkline-bar"
                      style={{ height: `${Math.max(10, height)}%` }}
                    />
                  )
                })}
              </div>
            </div>
            
            <div className="pt-4 border-t border-pluto-border">
              <div className="text-xs text-gray-500 uppercase">Daily P&L</div>
              <div className={`text-xl font-bold font-mono ${dailyPL >= 0 ? 'text-pluto-green' : 'text-pluto-red'}`}>
                {dailyPL >= 0 ? '+' : ''}{formatCurrency(dailyPL)}
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-pluto-card rounded-xl border border-pluto-border p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <div className="status-dot online" />
            <span className="font-semibold text-white">Connection</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Backend</span>
              <span className="text-pluto-green">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ESP32 Deck</span>
              <span className="text-gray-500">Waiting...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Alpaca API</span>
              <span className={alpacaConnected ? 'text-pluto-green' : 'text-pluto-red'}>
                {alpacaConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-pluto-border">
            <div className="text-xs text-gray-500 mb-1">API Key</div>
            <div className="text-xs font-mono bg-pluto-panel rounded px-2 py-1.5 text-gray-300">
              {settings?.alpaca_api_key_masked || 'Not configured'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full btn-danger text-sm"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
