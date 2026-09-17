import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'

export default function Movements() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ product_id: '', type: 'in', quantity: '', reason: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: prods }, { data: moves }] = await Promise.all([
      supabase.from('products').select('id, name, sku, quantity').order('name'),
      supabase.from('stock_movements').select('*, products(name, sku), profiles(full_name)').order('created_at', { ascending: false }).limit(50),
    ])
    setProducts(prods || [])
    setMovements(moves || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.product_id || !form.quantity) return
    setSaving(true)
    await supabase.from('stock_movements').insert({
      product_id: form.product_id,
      type: form.type,
      quantity: Number(form.quantity),
      reason: form.reason || null,
      performed_by: user.id,
    })
    setForm({ product_id: '', type: 'in', quantity: '', reason: '' })
    setSaving(false)
    load()
  }

  const typeStyles = {
    in: { icon: ArrowDownCircle, color: 'text-emerald-600', label: 'Stock In' },
    out: { icon: ArrowUpCircle, color: 'text-red-600', label: 'Stock Out' },
    adjustment: { icon: SlidersHorizontal, color: 'text-amber-600', label: 'Adjustment' },
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Stock Movements</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Log Movement</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product</label>
              <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.quantity} in stock</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['in', 'out', 'adjustment'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`text-xs font-medium py-2 rounded-lg border transition ${
                      form.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {typeStyles[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {form.type === 'adjustment' ? 'New Quantity' : 'Quantity'}
              </label>
              <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason (optional)</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Purchase order #123"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button disabled={saving} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5">
              {saving ? 'Saving…' : 'Log Movement'}
            </button>
          </form>
        </div>

        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent History</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
            {loading ? (
              <p className="text-sm text-slate-400 p-5">Loading…</p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-slate-400 p-5">No movements logged yet.</p>
            ) : (
              movements.map((m) => {
                const { icon: Icon, color, label } = typeStyles[m.type]
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <Icon size={18} className={color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.products?.name}</p>
                      <p className="text-xs text-slate-400">
                        {label} · {m.reason || 'No reason given'} · {m.profiles?.full_name || 'Someone'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${color}`}>
                        {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '='}{m.quantity}
                      </p>
                      <p className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
