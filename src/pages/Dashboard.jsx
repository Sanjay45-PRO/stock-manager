import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Package, AlertTriangle, IndianRupee, Boxes, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: prods }, { data: moves }] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('quantity', { ascending: true }),
        supabase
          .from('stock_movements')
          .select('*, products(name, sku), profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(8),
      ])
      setProducts(prods || [])
      setMovements(moves || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = products.reduce((sum, p) => sum + p.quantity * Number(p.unit_price), 0)
  const lowStock = products.filter((p) => p.quantity <= p.reorder_threshold)

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Total Units in Stock', value: totalItems, icon: Boxes, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Inventory Value', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-amber-50 text-amber-600' },
    { label: 'Low Stock Items', value: lowStock.length, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ]

  function handleExport() {
    const rows = products.map((p) => {
      const low = p.quantity <= p.reorder_threshold
      return {
        SKU: p.sku,
        Name: p.name,
        Quantity: `${p.quantity} ${p.unit || 'pcs'}`,
        Price: Number(p.unit_price),
        Left: low ? `${p.quantity} left` : 'OK',
        'Total Value': Number(p.unit_price) * p.quantity,
      }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Product Summary')

    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `product-summary-${dateStr}.xlsx`)
  }

  if (loading) return <div className="p-8 text-sm text-slate-400">Loading…</div>

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">All products are sufficiently stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <span className="text-red-600 font-medium">{p.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-400">No stock movements yet.</p>
          ) : (
            <div className="space-y-3">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{m.products?.name}</p>
                    <p className="text-xs text-slate-400">
                      {m.profiles?.full_name || 'Someone'} · {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`font-medium ${m.type === 'in' ? 'text-emerald-600' : m.type === 'out' ? 'text-red-600' : 'text-amber-600'}`}>
                    {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '='}{m.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Product Summary</h2>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition"
          >
            <Download size={14} /> Export to Excel
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">SKU</th>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-right px-5 py-3 font-medium">Quantity</th>
              <th className="text-right px-5 py-3 font-medium">Price</th>
              <th className="text-right px-5 py-3 font-medium">Left</th>
              <th className="text-right px-5 py-3 font-medium">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No products yet.</td></tr>
            ) : (
              products.map((p) => {
                const low = p.quantity <= p.reorder_threshold
                return (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{p.sku}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{p.quantity} {p.unit || 'pcs'}</td>
                    <td className="px-5 py-3 text-right text-slate-700">₹{Number(p.unit_price).toLocaleString('en-IN')}</td>
                    <td className={`px-5 py-3 text-right font-medium ${low ? 'text-red-600' : 'text-emerald-600'}`}>
                      {low ? `${p.quantity} left` : 'OK'}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      ₹{(Number(p.unit_price) * p.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
