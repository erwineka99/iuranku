import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',            label: 'Dashboard',   icon: '📊' },
  { to: '/houses',      label: 'Rumah',        icon: '🏠' },
  { to: '/residents',   label: 'Penghuni',     icon: '👥' },
  { to: '/bills',       label: 'Tagihan',      icon: '📋' },
  { to: '/payments',    label: 'Pembayaran',   icon: '💳' },
  { to: '/expenses',    label: 'Pengeluaran',  icon: '💸' },
  { to: '/reports',     label: 'Laporan',      icon: '📈' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">Iuranku</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manajemen RT</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
