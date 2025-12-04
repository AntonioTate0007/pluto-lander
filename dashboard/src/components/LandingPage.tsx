/**
 * Modern Crypto Landing Page
 * Inspired by Dribbble crypto landing page designs
 * https://dribbble.com/shots/26686700-Crypto-Landing-page-powered-by-AI-Web-Design
 */

import React, { useEffect, useState } from 'react'

interface LandingPageProps {
  onLaunchDashboard: () => void
  onConfigureBot: () => void
  btcPrice: number
  btcChange: number
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLaunchDashboard, 
  onConfigureBot,
  btcPrice,
  btcChange 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="landing-page min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 167, 38, 0.3) 0%, rgba(79, 195, 247, 0.2) 50%, transparent 70%)`
        }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full floating-particle"
            style={{
              background: 'rgba(255, 167, 38, 0.5)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-cyan-400 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pluto</h1>
              <p className="text-xs text-gray-400">Launcher</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <span className="text-orange-400 font-bold">₿</span>
              <span className="text-white font-semibold">
                {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---'}
              </span>
              <span className={`text-sm ${btcChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          {/* Left: Text Content */}
          <div className="fade-in-up">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
              Trade.
              <br />
              Monitor.
              <br />
              <span className="text-white">Profit.</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Advanced algorithmic trading with real-time risk controls and AI-powered market analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLaunchDashboard}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold text-lg shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70 transition-all hover:scale-105 active:scale-95"
              >
                Launch Dashboard
              </button>
              
              <button
                onClick={onConfigureBot}
                className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              >
                Configure Bot
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-gray-400">Trading</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">AI</div>
                <div className="text-sm text-gray-400">Powered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right: Glassmorphism Cards Stack */}
          <div className="relative fade-in-right">
            {/* Card Stack */}
            <div className="relative">
              {/* Card 1: Portfolio Value */}
              <div className="absolute top-0 left-0 w-full p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl floating-card-1">
                <div className="text-sm text-gray-400 mb-2">Portfolio Value</div>
                <div className="text-4xl font-bold text-white mb-4">$100,000</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-green-400">+$1,234.56 (1.2%)</span>
                </div>
              </div>

              {/* Card 2: P&L */}
              <div className="absolute top-8 left-8 w-full p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl floating-card-2">
                <div className="text-sm text-gray-400 mb-2">Today's P&L</div>
                <div className="text-3xl font-bold text-white mb-4">+$567.89</div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-600 progress-bar" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Card 3: BTC Ticker */}
              <div className="absolute top-16 left-16 w-full p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl floating-card-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">BTC/USD</div>
                  <div className="text-sm text-green-400">+2.5%</div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---'}
                </div>
                <svg viewBox="0 0 200 40" className="w-full h-10">
                  <polyline
                    points="0,30 20,25 40,28 60,22 80,26 100,24 120,27 140,23 160,25 180,24 200,26"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: '⚡', title: 'Real-Time', desc: 'Live market data and instant execution' },
            { icon: '🤖', title: 'AI Powered', desc: 'Machine learning algorithms optimize trades' },
            { icon: '🛡️', title: 'Risk Managed', desc: 'Advanced stop-loss and position limits' },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all hover:scale-105 hover:-translate-y-1 feature-card"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

