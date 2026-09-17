import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, ArrowLeftRight, FolderTree, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/movements', label: 'Stock Movements', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: FolderTree, adminOnly: true },
]

export default function Layout() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white rounded-lg p-1.5">
              <Package size={18} />
            </div>
            <span className="font-semibold text-slate-900">Stock Manager</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-800 truncate">
            {profile?.full_name || 'User'}
          </p>
          <p className="text-xs text-slate-400 mb-3 capitalize">{profile?.role}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-600 transition"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
