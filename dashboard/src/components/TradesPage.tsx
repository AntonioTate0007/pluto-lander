import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from './App'

interface Trade {
  id: string
  symbol: string
  side: string
  qty: string
  filled_avg_price: string
  filled_at: string
  status: string
  type: string
}

interface TradeSignal {
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  type: 'market' | 'limit'
  limit_price?: number
}

export const TradesPage: React.FC = () => {
  const { token, baseURL } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Manual trade form
  const [symbol, setSymbol] = useState('BTCUSD')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [qty, setQty] = useState('1')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [limitPrice, setLimitPrice] = useState('')

  // Load trade history
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/alpaca/orders', {
          baseURL,
          headers: { Authorization: `Bearer ${token}` },
        })
        setTrades(res.data || [])
      } catch {
        // Ignore
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [token, baseURL])

  const submitTrade = async () => {
    setSubmitting(true)
    try {
      const signal: TradeSignal = {
        symbol,
        side,
        qty: parseFloat(qty),
        type: orderType,
      }
      if (orderType === 'limit' && limitPrice) {
        signal.limit_price = parseFloat(limitPrice)
      }

      await axios.post('/api/alpaca/order', signal, {
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Reload trades
      const res = await axios.get('/api/alpaca/orders', {
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
      })
      setTrades(res.data || [])
      
      // Reset form
      setQty('1')
      setLimitPrice('')
    } catch (err: any) {
      alert('Trade failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Trades</h1>
        <p className="text-gray-500 mt-1">Execute and view your trading history</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Manual Trade Panel */}
        <div className="col-span-1">
          <div className="bg-pluto-card rounded-xl border border-pluto-border p-6 sticky top-24">
            <h2 className="font-semibold text-white mb-4">Execute Trade</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Symbol</label>
                <select
                  className="select-field"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                >
                  <option value="BTCUSD">BTC/USD</option>
                  <option value="ETHUSD">ETH/USD</option>
                  <option value="AAPL">AAPL</option>
                  <option value="TSLA">TSLA</option>
                  <option value="SPY">SPY</option>
                  <option value="QQQ">QQQ</option>
                  <option value="NVDA">NVDA</option>
                  <option value="AMD">AMD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Side</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSide('buy')}
                    className={`py-2 rounded-lg font-semibold transition-all ${
                      side === 'buy'
                        ? 'bg-pluto-green text-white'
                        : 'bg-pluto-panel text-gray-400 hover:text-white'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setSide('sell')}
                    className={`py-2 rounded-lg font-semibold transition-all ${
                      side === 'sell'
                        ? 'bg-pluto-red text-white'
                        : 'bg-pluto-panel text-gray-400 hover:text-white'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                <input
                  type="number"
                  className="input-field font-mono"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  min="0.001"
                  step="0.001"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Order Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType('market')}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      orderType === 'market'
                        ? 'bg-pluto-accent text-black'
                        : 'bg-pluto-panel text-gray-400 hover:text-white'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    onClick={() => setOrderType('limit')}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      orderType === 'limit'
                        ? 'bg-pluto-accent text-black'
                        : 'bg-pluto-panel text-gray-400 hover:text-white'
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {orderType === 'limit' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Limit Price</label>
                  <input
                    type="number"
                    className="input-field font-mono"
                    value={limitPrice}
                    onChange={e => setLimitPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}

              <button
                onClick={submitTrade}
                disabled={submitting || !qty || parseFloat(qty) <= 0}
                className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                  side === 'buy'
                    ? 'bg-pluto-green hover:bg-pluto-green/80 text-white'
                    : 'bg-pluto-red hover:bg-pluto-red/80 text-white'
                }`}
              >
                {submitting ? 'Submitting...' : `${side.toUpperCase()} ${symbol}`}
              </button>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="col-span-2">
          <div className="bg-pluto-card rounded-xl border border-pluto-border overflow-hidden">
            <div className="p-4 border-b border-pluto-border">
              <h2 className="font-semibold text-white">Order History</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading trades...
              </div>
            ) : trades.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No trades yet</p>
                <p className="text-sm mt-1">Execute your first trade using the panel on the left</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="text-left p-4">Symbol</th>
                      <th className="text-left p-4">Side</th>
                      <th className="text-right p-4">Qty</th>
                      <th className="text-right p-4">Price</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-t border-pluto-border hover:bg-pluto-panel/50">
                        <td className="p-4">
                          <span className="font-mono font-semibold text-white">{trade.symbol}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            trade.side === 'buy'
                              ? 'bg-pluto-green/20 text-pluto-green'
                              : 'bg-pluto-red/20 text-pluto-red'
                          }`}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-white">{trade.qty}</td>
                        <td className="p-4 text-right font-mono text-white">
                          {trade.filled_avg_price ? formatCurrency(trade.filled_avg_price) : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.status === 'filled'
                              ? 'bg-pluto-green/20 text-pluto-green'
                              : trade.status === 'canceled'
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-pluto-accent/20 text-pluto-accent'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">{formatDate(trade.filled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

