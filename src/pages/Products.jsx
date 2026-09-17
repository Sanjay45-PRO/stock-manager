import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Litres (l)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'box', label: 'Box' },
]

const emptyForm = { id: null, sku: '', name: '', description: '', category_id: '', unit_price: '', unit: 'pcs', quantity: 0, reorder_threshold: 10 }

export default function Products() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  function openNew() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(p) {
    setForm({ ...p, category_id: p.category_id || '', unit: p.unit || 'pcs' })
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      category_id: form.category_id || null,
      unit_price: Number(form.unit_price) || 0,
      unit: form.unit || 'pcs',
      reorder_threshold: Number(form.reorder_threshold) || 0,
    }
    if (form.id) {
      await supabase.from('products').update(payload).eq('id', form.id)
    } else {
      payload.quantity = Number(form.quantity) || 0
      await supabase.from('products').insert(payload)
    }
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product? This also removes its movement history.')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Products</h1>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-4 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Qty</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No products found.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.categories?.name || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">₹{Number(p.unit_price).toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.quantity <= p.reorder_threshold ? 'text-red-600' : 'text-slate-700'}`}>
                    {p.quantity} <span className="text-slate-400 font-normal">{p.unit || 'pcs'}</span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-indigo-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-base font-semibold text-slate-900 mb-4">{form.id ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
                  <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price (₹)</label>
                  <input required type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit of Measure</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{form.id ? 'Qty (view only)' : 'Initial Qty'}</label>
                  <input type="number" disabled={!!form.id} value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reorder At</label>
                  <input required type="number" value={form.reorder_threshold} onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {form.id && (
                <p className="text-xs text-slate-400">To change quantity, use Stock Movements instead of editing directly.</p>
              )}
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg py-2.5 mt-2">
                {form.id ? 'Save Changes' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
