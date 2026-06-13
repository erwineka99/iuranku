import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/resident/dashboard', label: 'Beranda',        icon: '⊞' },
  { to: '/resident/bills',     label: 'Tagihan Saya',   icon: '≡' },
  { to: '/resident/payments',  label: 'Riwayat Bayar',  icon: '◈' },
  { to: '/resident/expenses',  label: 'Pengeluaran RT', icon: '↗' },
]

export default function ResidentLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
      isActive
        ? 'bg-green-50 text-green-800 font-semibold'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`

  return (
    <div className="flex min-h-screen bg-gray-50/60">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100 flex flex-col shadow-sm
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:shrink-0
        `}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              RT
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Iuranku</h1>
              <p className="text-[10px] text-green-600 font-medium leading-tight">Portal Penghuni</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
            aria-label="Tutup menu"
          >
            ×
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-1 pb-2">Menu</p>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkCls} onClick={() => setSidebarOpen(false)}>
              {({ isActive }) => (
                <>
                  <span className={`text-base leading-none ${isActive ? 'text-green-700' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-700 truncate leading-tight">{user?.name}</p>
              <button
                onClick={logout}
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors leading-tight"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Konten */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden h-13 bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Buka menu"
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
          <span className="ml-3 text-sm font-semibold text-gray-700">Iuranku</span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
