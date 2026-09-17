import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('categories').insert({ name: name.trim() })
    setName('')
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Products keep their data but lose this category.')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2">
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {loading ? (
          <p className="text-sm text-slate-400 p-4">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">No categories yet.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-800">{c.name}</span>
              <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
