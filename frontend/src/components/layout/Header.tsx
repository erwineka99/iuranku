import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Keluar
        </button>
      </div>
    </header>
  )
}
