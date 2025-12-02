import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from './App'

interface Settings {
  alpaca_api_key?: string | null
  alpaca_api_secret?: string | null
  alpaca_api_key_masked?: string | null
  alpaca_api_secret_masked?: string | null
  alpaca_paper: boolean
  notify_email?: string | null
  notify_sms_number?: string | null
  display_theme: string
  display_layout: string
}

export const SettingsPage: React.FC = () => {
  const { token, baseURL } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [alpacaKey, setAlpacaKey] = useState('')
  const [alpacaSecret, setAlpacaSecret] = useState('')
  const [alpacaPaper, setAlpacaPaper] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySMS, setNotifySMS] = useState('')
  const [displayTheme, setDisplayTheme] = useState('dark-gold')
  const [displayLayout, setDisplayLayout] = useState('braiins-style')

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/settings', {
          baseURL,
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = res.data
        setSettings(data)
        setAlpacaPaper(data.alpaca_paper)
        setNotifyEmail(data.notify_email || '')
        setNotifySMS(data.notify_sms_number || '')
        setDisplayTheme(data.display_theme || 'dark-gold')
        setDisplayLayout(data.display_layout || 'braiins-style')
      } catch {
        setError('Failed to load settings')
      }
    }
    load()
  }, [token, baseURL])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    
    try {
      const update: Partial<Settings> = {
        alpaca_paper: alpacaPaper,
        notify_email: notifyEmail || null,
        notify_sms_number: notifySMS || null,
        display_theme: displayTheme,
        display_layout: displayLayout,
      }
      
      if (alpacaKey) update.alpaca_api_key = alpacaKey
      if (alpacaSecret) update.alpaca_api_secret = alpacaSecret

      await axios.put('/api/settings', update, {
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
      })
      
      setSaved(true)
      setAlpacaKey('')
      setAlpacaSecret('')
      
      // Reload settings
      const res = await axios.get('/api/settings', {
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
      })
      setSettings(res.data)
      
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const testAlpacaConnection = async () => {
    try {
      const res = await axios.get('/api/alpaca/account', {
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data) {
        alert('✅ Alpaca connection successful!\nAccount status: ' + res.data.status)
      }
    } catch {
      alert('❌ Alpaca connection failed. Check your API keys.')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your Pluto Lander trading bot</p>
      </div>

      {/* Alpaca API Settings */}
      <section className="bg-pluto-card rounded-xl border border-pluto-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pluto-green/20 flex items-center justify-center">
            <span className="text-lg">🦙</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">Alpaca API</h2>
            <p className="text-xs text-gray-500">Connect your Alpaca trading account</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type="text"
              className="input-field font-mono text-sm"
              value={alpacaKey}
              onChange={e => setAlpacaKey(e.target.value)}
              placeholder={settings?.alpaca_api_key_masked || 'Enter API key'}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Secret</label>
            <input
              type="password"
              className="input-field font-mono text-sm"
              value={alpacaSecret}
              onChange={e => setAlpacaSecret(e.target.value)}
              placeholder={settings?.alpaca_api_secret_masked || 'Enter API secret'}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-pluto-border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">Paper Trading Mode</span>
            <button
              onClick={() => setAlpacaPaper(!alpacaPaper)}
              className={`toggle-switch ${alpacaPaper ? 'active' : ''}`}
            />
          </div>
          <button
            onClick={testAlpacaConnection}
            className="text-sm text-pluto-accent hover:text-pluto-accent-soft transition-colors"
          >
            Test Connection
          </button>
        </div>
        
        {!alpacaPaper && (
          <div className="mt-4 p-3 bg-pluto-red/10 border border-pluto-red/20 rounded-lg">
            <div className="flex items-center gap-2 text-pluto-red text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Warning: Live trading is enabled!</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Real money will be used for trades.</p>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-pluto-card rounded-xl border border-pluto-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pluto-blue/20 flex items-center justify-center">
            <span className="text-lg">🔔</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">Notifications</h2>
            <p className="text-xs text-gray-500">Get alerts for trade signals</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              className="input-field"
              value={notifyEmail}
              onChange={e => setNotifyEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">SMS Number</label>
            <input
              type="tel"
              className="input-field"
              value={notifySMS}
              onChange={e => setNotifySMS(e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>
        </div>
      </section>

      {/* Display Settings */}
      <section className="bg-pluto-card rounded-xl border border-pluto-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pluto-purple/20 flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">Display</h2>
            <p className="text-xs text-gray-500">Customize Pi screen appearance</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Theme</label>
            <select
              className="select-field"
              value={displayTheme}
              onChange={e => setDisplayTheme(e.target.value)}
            >
              <option value="dark-gold">Dark Gold (Default)</option>
              <option value="dark-blue">Dark Blue</option>
              <option value="dark-green">Dark Green</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Layout</label>
            <select
              className="select-field"
              value={displayLayout}
              onChange={e => setDisplayLayout(e.target.value)}
            >
              <option value="braiins-style">Braiins Style</option>
              <option value="compact">Compact</option>
              <option value="chart-focus">Chart Focus</option>
              <option value="positions-focus">Positions Focus</option>
            </select>
          </div>
        </div>
      </section>

      {/* Pi Display Widgets */}
      <section className="bg-pluto-card rounded-xl border border-pluto-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pluto-accent/20 flex items-center justify-center">
            <span className="text-lg">📱</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">Pi Screen Widgets</h2>
            <p className="text-xs text-gray-500">Choose what to display on the 5" Pi screen</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'btc_price', label: 'BTC Price', icon: '₿', enabled: true },
            { id: 'portfolio', label: 'Portfolio Value', icon: '💰', enabled: true },
            { id: 'positions', label: 'Positions', icon: '📊', enabled: true },
            { id: 'pnl', label: 'Daily P&L', icon: '📈', enabled: true },
            { id: 'clock', label: 'Clock', icon: '🕐', enabled: false },
            { id: 'alerts', label: 'Trade Alerts', icon: '🔔', enabled: true },
          ].map((widget) => (
            <div
              key={widget.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                widget.enabled
                  ? 'bg-pluto-accent/10 border-pluto-accent/40 text-white'
                  : 'bg-pluto-panel border-pluto-border text-gray-500'
              }`}
            >
              <div className="text-xl mb-1">{widget.icon}</div>
              <div className="text-sm font-medium">{widget.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {error && (
            <div className="text-pluto-red text-sm">{error}</div>
          )}
          {saved && (
            <div className="text-pluto-green text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Settings saved successfully!
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}

