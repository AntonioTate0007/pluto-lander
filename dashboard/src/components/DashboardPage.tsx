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
}

interface AlpacaAccount {
  equity: string
  cash: string
  buying_power: string
}

export const DashboardPage: React.FC<Props> = ({ btcPrice }) => {
  const { token, baseURL, logout } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [alpacaConnected, setAlpacaConnected] = useState(false)
  const [account, setAccount] = useState<AlpacaAccount | null>(null)
  const [systemArmed, setSystemArmed] = useState(false)
  const [autoTrading, setAutoTrading] = useState(false)
  const [networkActive, setNetworkActive] = useState(true)
  const [standbyMode, setStandbyMode] = useState(true)
  const [tradingEngineOn, setTradingEngineOn] = useState(false)
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSettings(res.data)
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
    load()
  }, [token, baseURL])

  // Load Alpaca account
  useEffect(() => {
    const loadAlpaca = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/alpaca/account`, {
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
    loadAlpaca()
    const interval = setInterval(loadAlpaca, 30000)
    return () => clearInterval(interval)
  }, [token, baseURL])

  // Track BTC price history
  useEffect(() => {
    if (btcPrice > 0) {
      setPriceHistory(prev => [...prev.slice(-59), btcPrice])
    }
  }, [btcPrice])

  const equity = account ? parseFloat(account.equity) : 100000
  const cash = account ? parseFloat(account.cash) : 100000
  const cashPercentage = equity > 0 ? (cash / equity) * 100 : 100

  // SVG Gauge calculation
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (cashPercentage / 100) * circumference

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  // Mini chart path
  const getChartPath = () => {
    if (priceHistory.length < 2) return ''
    const min = Math.min(...priceHistory)
    const max = Math.max(...priceHistory)
    const range = max - min || 1
    const width = 200
    const height = 40
    
    return priceHistory.map((price, i) => {
      const x = (i / (priceHistory.length - 1)) * width
      const y = height - ((price - min) / range) * height
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  return (
    <div className="page-enter min-h-screen relative">
      {/* Animated Background */}
      <div className="animated-bg" />
      
      <div className="relative z-10 p-6 grid grid-cols-12 gap-6 max-w-[1800px] mx-auto">
        {/* LEFT SIDEBAR */}
        <div className="col-span-3 space-y-4" style={{ animationDelay: '0.1s' }}>
          {/* System Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`status-dot ${!standbyMode && tradingEngineOn ? 'active' : 'inactive'}`} />
            <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-secondary)' }}>
              {standbyMode ? 'SYSTEM STANDBY' : tradingEngineOn ? 'SYSTEM ACTIVE' : 'SYSTEM OFFLINE'}
            </span>
            {!standbyMode && tradingEngineOn && <span className="badge-live ml-2">LIVE</span>}
          </div>

          {/* Tagline */}
          <div className="mb-8">
            <h2 className="text-4xl font-light leading-tight" style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              Trade.<br />Monitor.<br />Profit.
            </h2>
            <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
              Advanced algorithmic trading with real-time market analysis and risk management.
            </p>
          </div>

          {/* Trading Engine Card */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 167, 38, 0.1)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Trading Engine</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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

          {/* Alpaca Connection */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: alpacaConnected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                  <svg className="w-5 h-5" fill="none" stroke={alpacaConnected ? 'var(--success)' : 'var(--error)'} strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Alpaca Connection</div>
                  <div className="text-xs" style={{ color: alpacaConnected ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {alpacaConnected ? 'Connected' : 'Not Connected'}
                  </div>
                </div>
              </div>
              <div className={`toggle-switch ${alpacaConnected ? 'active' : ''}`} style={{ pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Trading Mode */}
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79, 195, 247, 0.1)' }}>
                <svg className="w-5 h-5" fill="none" stroke="var(--info)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Trading Mode</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {settings?.alpaca_paper ? 'Paper Trading' : 'Live Trading'}
                </div>
              </div>
            </div>
            <button className="btn-primary w-full text-sm">
              {settings?.alpaca_paper ? 'SWITCH TO LIVE' : 'SWITCH TO PAPER'}
            </button>
          </div>
        </div>

        {/* CENTER - DATA CARDS */}
        <div className="col-span-6 space-y-4" style={{ animationDelay: '0.2s' }}>
          {/* Portfolio Value */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 167, 38, 0.2)' }}>
                <span className="text-xl font-bold glow-accent" style={{ color: 'var(--accent)' }}>₿</span>
              </div>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Portfolio Value</span>
            </div>
            <div className="text-5xl font-light number-update" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(0)}
            </div>
          </div>

          {/* Account Balance with Gauge */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79, 195, 247, 0.2)' }}>
                <span className="text-lg">💵</span>
              </div>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Account Balance</span>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--info)" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="gauge-arc"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-medium number-update" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(equity)}
                  </div>
                  <div className="text-xs uppercase mt-1" style={{ color: 'var(--text-secondary)' }}>EQUITY</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Cash</div>
                <div className="text-lg font-medium" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(cash)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Buying Power</div>
                <div className="text-lg font-medium" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {account ? formatCurrency(parseFloat(account.buying_power)) : '$0.00'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="col-span-3 space-y-4" style={{ animationDelay: '0.3s' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="var(--accent)" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Quick Actions</span>
            </div>
            
            <div className="space-y-3">
              {[
                { icon: '🔒', label: 'System Arm', state: systemArmed, setter: setSystemArmed },
                { icon: '🤖', label: 'Auto Trading', state: autoTrading, setter: setAutoTrading },
                { icon: '🌐', label: 'Network', state: networkActive, setter: setNetworkActive },
                { icon: '💤', label: 'Standby', state: standbyMode, setter: setStandbyMode },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <button
                    onClick={() => item.setter(!item.state)}
                    className={`toggle-switch ${item.state ? 'active' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Market Data */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="var(--info)" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Market Data</span>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-bold glow-accent" style={{ color: 'var(--accent)' }}>₿</span>
                BTC/USD
              </div>
              <div className="text-3xl font-light mt-1 number-update glow-accent" style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
              </div>
              
              {/* Mini Chart */}
              <div className="mt-4 h-12">
                <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
                  <path
                    d={getChartPath()}
                    className="chart-line"
                    stroke="var(--success)"
                  />
                </svg>
              </div>
            </div>
            
            <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Daily P&L</div>
              <div className="text-xl font-medium" style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                +$0.00
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="status-dot active" />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Connection</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Backend</span>
                <span style={{ color: 'var(--success)' }}>Online</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>ESP32 Deck</span>
                <span style={{ color: 'var(--text-secondary)' }}>Waiting...</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Alpaca API</span>
                <span style={{ color: alpacaConnected ? 'var(--success)' : 'var(--error)' }}>
                  {alpacaConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button onClick={logout} className="btn-secondary w-full text-sm" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
