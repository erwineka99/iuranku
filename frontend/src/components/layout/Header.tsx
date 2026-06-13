import { useAuth } from '@/context/AuthContext'

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  resident: 'Penghuni',
}

interface Props {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: Props) {
  const { user, logout, role } = useAuth()

  return (
    <header className="h-13 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
      {/* Tombol hamburger — hanya muncul di mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Buka menu"
      >
        <span className="block w-5 h-0.5 bg-current mb-1" />
        <span className="block w-5 h-0.5 bg-current mb-1" />
        <span className="block w-5 h-0.5 bg-current" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
          <p className="text-[11px] text-gray-400 leading-tight">{role ? roleLabel[role] : ''}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
          title="Keluar"
        >
          ⎋ Keluar
        </button>
      </div>
    </header>
  )
}
