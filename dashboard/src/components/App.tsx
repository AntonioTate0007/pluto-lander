import React, { useState, useEffect, createContext, useContext } from 'react'
import { LoginPage } from './LoginPage'
import { DashboardPage } from './DashboardPage'
import { SettingsPage } from './SettingsPage'
import { TradesPage } from './TradesPage'
import { PiDisplayPage } from './PiDisplayPage'

interface AuthContextType {
  token: string | null
  baseURL: string
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  baseURL: '',
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

type Tab = 'dashboard' | 'settings' | 'trades'

// Check if we're in kiosk/Pi display mode
const isKioskMode = () => {
  const path = window.location.pathname.toLowerCase()
  return path.includes('/kiosk') || path.includes('/pi') || path.includes('/display')
}

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('pluto_token'))
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [prevBtcPrice, setPrevBtcPrice] = useState<number>(0)
  const [isConnected, setIsConnected] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [kioskMode, setKioskMode] = useState(isKioskMode())
  
  const baseURL = ''

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => setKioskMode(isKioskMode())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  
  // Listen for login events from child components (PiDisplayPage auto-login)
  useEffect(() => {
    const handleLogin = (e: CustomEvent) => {
      const newToken = e.detail
      if (newToken) {
        console.log('[App] Token updated from child component')
        setToken(newToken)
      }
    }
    window.addEventListener('pluto-login', handleLogin as EventListener)
    return () => window.removeEventListener('pluto-login', handleLogin as EventListener)
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('pluto_token', token)
    } else {
      localStorage.removeItem('pluto_token')
    }
  }, [token])

  // Fetch BTC price with smooth updates
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot')
        const data = await res.json()
        const newPrice = parseFloat(data.data.amount)
        setPrevBtcPrice(btcPrice)
        setBtcPrice(newPrice)
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 5000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    setToken(null)
    setActiveTab('dashboard')
  }

  const exitKioskMode = () => {
    window.history.pushState({}, '', '/')
    setKioskMode(false)
  }

  const enterKioskMode = () => {
    window.history.pushState({}, '', '/kiosk')
    setKioskMode(true)
  }

  // Auto-login for kiosk mode - retry until success (background, non-blocking)
  useEffect(() => {
    if (kioskMode && !token) {
      let attempts = 0
      const maxAttempts = 20
      let cancelled = false
      
      const autoLogin = async () => {
        if (cancelled) return
        attempts++
        console.log(`[Kiosk] Auto-login attempt ${attempts}/${maxAttempts}...`)
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
            console.log('[Kiosk] ✅ Auto-login successful!')
            localStorage.setItem('pluto_token', data.access_token)
            setToken(data.access_token)
          } else {
            const errorText = await res.text()
            console.warn(`[Kiosk] Login failed (${res.status}):`, errorText)
            if (attempts < maxAttempts && !cancelled) {
              setTimeout(autoLogin, 3000)
            }
          }
        } catch (e) {
          console.warn(`[Kiosk] Auto-login error (attempt ${attempts}):`, e)
          if (attempts < maxAttempts && !cancelled) {
            setTimeout(autoLogin, 3000)
          }
        }
      }
      
      // Start auto-login after a short delay
      const timer = setTimeout(autoLogin, 2000)
      
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }
  }, [kioskMode, baseURL])

  // Kiosk mode - show Pi display WITHOUT requiring login
  if (kioskMode) {
    // In kiosk mode, always show the display - don't require token
    return (
      <PiDisplayPage 
        token={token || null} 
        baseURL={baseURL} 
        onExitKiosk={exitKioskMode}
      />
    )
  }

  // Normal mode - require login
  if (!token) {
    return <LoginPage onLoggedIn={setToken} baseURL={baseURL} />
  }

  const priceChange = btcPrice - prevBtcPrice
  const priceDirection = priceChange >= 0 ? 'up' : 'down'

  return (
    <AuthContext.Provider value={{ token, baseURL, logout }}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        {/* Animated Background */}
        <div className="animated-bg" />
        
        {/* Header with Shimmer */}
        <header className="header-enter header-shimmer h-16 flex items-center justify-between px-6 sticky top-0 z-50" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            {/* Logo with float animation */}
            <div className="logo-float logo-hover">
              {!logoError ? (
                <img 
                  src="/branding/pluto_launcher_logo.png" 
                  alt="Pluto Lander"
                  className="w-10 h-10 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full glow-box-accent"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </div>
            <h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Pluto Lander</h1>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center h-full">
            {(['dashboard', 'settings', 'trades'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* BTC Price & Status */}
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg glow-box-accent"
              style={{ 
                border: '1px solid var(--accent)',
                background: 'rgba(255, 167, 38, 0.1)'
              }}
            >
              <span className="text-lg font-bold glow-accent" style={{ color: 'var(--accent)' }}>₿</span>
              <span 
                className={`font-medium number-update ${priceDirection === 'up' ? 'number-up' : priceDirection === 'down' ? 'number-down' : ''}`}
                style={{ 
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s ease'
                }}
              >
                {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>IP:</span>
              <span style={{ color: isConnected ? 'var(--success)' : 'var(--error)' }}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            {/* Kiosk Mode Button */}
            <button
              onClick={enterKioskMode}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                background: 'rgba(79, 195, 247, 0.1)',
                border: '1px solid rgba(79, 195, 247, 0.3)',
                color: 'var(--info)'
              }}
              title="Open Pi Display Mode"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Pi Display</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          {activeTab === 'dashboard' && <DashboardPage btcPrice={btcPrice} />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'trades' && <TradesPage />}
        </main>
      </div>
    </AuthContext.Provider>
  )
}
