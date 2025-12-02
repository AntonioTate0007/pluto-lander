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
  const [isConnected, setIsConnected] = useState(false)
  
  // Use same origin for API calls (works when served from Pi)
  const baseURL = ''

  useEffect(() => {
    if (token) {
      localStorage.setItem('pluto_token', token)
    } else {
      localStorage.removeItem('pluto_token')
    }
  }, [token])

  // Fetch BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot')
        const data = await res.json()
        setBtcPrice(parseFloat(data.data.amount))
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 10000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    setToken(null)
    setActiveTab('dashboard')
  }

  if (!token) {
    return <LoginPage onLoggedIn={setToken} baseURL={baseURL} />
  }

  return (
    <AuthContext.Provider value={{ token, baseURL, logout }}>
      <div className="min-h-screen bg-pluto-bg flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-pluto-border bg-pluto-panel/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-pluto-accent animate-pulse-slow shadow-glow-accent" />
            <h1 className="text-xl font-semibold text-white">Pluto Lander</h1>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center h-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`tab ${activeTab === 'trades' ? 'active' : ''}`}
            >
              Trades
            </button>
          </nav>

          {/* Right side - BTC Price & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-pluto-accent/40 bg-pluto-accent/10">
              <span className="text-pluto-accent font-bold text-lg">₿</span>
              <span className="font-mono font-semibold text-white">
                {btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">IP:</span>
              <span className={isConnected ? 'text-pluto-green' : 'text-pluto-red'}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && <DashboardPage btcPrice={btcPrice} />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'trades' && <TradesPage />}
        </main>
      </div>
    </AuthContext.Provider>
  )
}
