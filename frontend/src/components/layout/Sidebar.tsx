import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const adminNavItems = [
  { to: '/dashboard',    label: 'Beranda',          icon: '⊞' },
  { to: '/houses',       label: 'Data Rumah',       icon: '⌂' },
  { to: '/residents',    label: 'Penghuni',         icon: '◑' },
  { to: '/bills',        label: 'Tagihan',          icon: '≡' },
  { to: '/payments',     label: 'Pembayaran',       icon: '◈' },
  { to: '/prepayments',  label: 'Bayar Dimuka',     icon: '◎' },
  { to: '/expenses',     label: 'Pengeluaran',      icon: '↗' },
  { to: '/reports',      label: 'Laporan',          icon: '▦' },
]

const superAdminNavItems = [
  { to: '/users', label: 'Kelola Pengguna', icon: '⚙' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { isSuperAdmin } = useAuth()

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
      isActive
        ? 'bg-green-50 text-green-800 font-semibold'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100 flex flex-col shadow-sm
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
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
            <p className="text-[10px] text-gray-400 leading-tight">Manajemen RT</p>
          </div>
        </div>
        {/* Tombol tutup — hanya muncul di mobile */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
          aria-label="Tutup menu"
        >
          ×
        </button>
      </div>

      {/* Nav utama */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-1 pb-2">Menu</p>
        {adminNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkCls} onClick={onClose}>
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

        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2">Admin</p>
            </div>
            {superAdminNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkCls} onClick={onClose}>
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
          </>
        )}
      </nav>

      {/* Footer sidebar */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-300 text-center">© 2026 Iuranku</p>
      </div>
    </aside>
  )
}
