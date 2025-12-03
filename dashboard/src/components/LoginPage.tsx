import React, { useState } from 'react'
import axios from 'axios'

interface Props {
  onLoggedIn: (token: string) => void
  baseURL: string
}

export const LoginPage: React.FC<Props> = ({ onLoggedIn, baseURL }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const form = new URLSearchParams()
      form.append('username', username)
      form.append('password', password)
      form.append('grant_type', '')
      const res = await axios.post(`${baseURL}/api/auth/login`, form)
      onLoggedIn(res.data.access_token)
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="animated-bg" />

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: 'rgba(255, 167, 38, 0.3)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `logoFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="page-enter relative z-10 w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="logo-float logo-hover inline-block mb-4">
            {!logoError ? (
              <img 
                src="/branding/pluto_launcher_logo.png" 
                alt="Pluto Lander"
                className="w-32 h-32 object-contain mx-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full mx-auto glow-box-accent"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </div>
          <h1 className="text-4xl font-light mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Pluto Lander
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Trading Bot Control Center</p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ background: 'rgba(26, 31, 58, 0.9)', backdropFilter: 'blur(20px)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div 
                className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ 
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  color: 'var(--error)'
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ opacity: loading || !username || !password ? 0.5 : 1 }}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Secure connection to your Pluto Lander device
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Pluto Lander Trading Bot v3.0
        </div>
      </div>
    </div>
  )
}
