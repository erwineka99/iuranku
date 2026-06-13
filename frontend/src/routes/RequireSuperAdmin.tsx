import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// hanya super_admin yang boleh masuk
export default function RequireSuperAdmin() {
  const { user, loading, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isSuperAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
