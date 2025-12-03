import React, { useState, useEffect, createContext, useContext } from 'react'
import { LoginPage } from './LoginPage'
import { DashboardPage } from './DashboardPage'
import { SettingsPage } from './SettingsPage'
import { TradesPage } from './TradesPage'

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

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('pluto_token'))
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [prevBtcPrice, setPrevBtcPrice] = useState<number>(0)
  const [isConnected, setIsConnected] = useState(false)
  const [logoError, setLogoError] = useState(false)
  
  const baseURL = ''

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
