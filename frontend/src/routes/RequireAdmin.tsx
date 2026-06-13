import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// hanya super_admin dan admin yang boleh masuk
export default function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/resident/dashboard" replace />

  return <Outlet />
}
