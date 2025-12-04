/**
 * Modern Crypto Dashboard
 * Redesigned to match Dribbble crypto landing page aesthetic
 * https://dribbble.com/shots/26686700-Crypto-Landing-page-powered-by-AI-Web-Design
 */

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
  const dayPL = equity - 100000 // Mock P&L
  const dayPLPercent = ((equity - 100000) / 100000) * 100

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
    <div className="modern-dashboard min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-cyan-400 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pluto Launcher</h1>
              <p className="text-xs text-gray-400">
                {standbyMode ? 'SYSTEM STANDBY' : tradingEngineOn ? 'SYSTEM ACTIVE' : 'SYSTEM OFFLINE'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* BTC Price Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <span className="text-orange-400 font-bold text-lg">₿</span>
              <span className="text-white font-semibold">
                {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---'}
              </span>
            </div>

            {/* Time Display */}
            <div className="text-white font-mono text-sm">
              {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Portfolio & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Value Card */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Portfolio Value</div>
                  <div className="text-5xl font-bold text-white mb-2">{formatCurrency(equity)}</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dayPL >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className={`text-sm font-medium ${dayPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dayPL >= 0 ? '+' : ''}{formatCurrency(dayPL)} ({dayPLPercent >= 0 ? '+' : ''}{dayPLPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="w-32 h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={dayPL >= 0 ? '#22c55e' : '#ef4444'}
                      strokeWidth="8"
                      strokeDasharray={`${(cashPercentage / 100) * 251.2} 251.2`}
                      strokeDashoffset="62.8"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Trading Cards Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Trading Engine Card */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Trading Engine</div>
                    <div className="text-2xl font-bold text-white">
                      {tradingEngineOn ? 'Active' : 'Idle'}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tradingEngineOn ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <div className={`w-3 h-3 rounded-full ${tradingEngineOn ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  </div>
                </div>
                <button
                  onClick={() => setTradingEngineOn(!tradingEngineOn)}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    tradingEngineOn 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {tradingEngineOn ? 'ENGINE ON' : 'START ENGINE'}
                </button>
              </div>

              {/* Alpaca Connection Card */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Alpaca</div>
                    <div className="text-2xl font-bold text-white">
                      {alpacaConnected ? 'Connected' : 'Offline'}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${alpacaConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className={`w-3 h-3 rounded-full ${alpacaConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {settings?.alpaca_paper ? 'Paper Trading' : 'Live Trading'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: BTC Chart & Info */}
          <div className="space-y-6">
            {/* BTC Price Card */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">BTC/USD</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {btcPrice > 0 ? formatCurrency(btcPrice) : '---'}
                  </div>
                </div>
                <div className="text-3xl">₿</div>
              </div>
              {priceHistory.length > 1 && (
                <svg viewBox="0 0 200 60" className="w-full h-16">
                  <defs>
                    <linearGradient id="btcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${getChartPath()} L 200 60 L 0 60 Z`}
                    fill="url(#btcGradient)"
                  />
                  <path
                    d={getChartPath()}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>

            {/* Stats Card */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="text-sm text-gray-400 mb-4">System Stats</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Cash</span>
                  <span className="text-white font-semibold">{formatCurrency(cash)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Buying Power</span>
                  <span className="text-white font-semibold">
                    {account ? formatCurrency(parseFloat(account.buying_power)) : formatCurrency(cash * 2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Uptime</span>
                  <span className="text-green-400 font-semibold">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Real-Time', desc: 'Live market data and instant execution' },
            { icon: '🤖', title: 'AI Powered', desc: 'Machine learning algorithms optimize trades' },
            { icon: '🛡️', title: 'Risk Managed', desc: 'Advanced stop-loss and position limits' },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-2xl hover:bg-white/10 transition-all hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
