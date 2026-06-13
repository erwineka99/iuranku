import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// hanya role resident yang boleh masuk
export default function RequireResident() {
  const { user, loading, isResident } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isResident) return <Navigate to="/" replace />

  return <Outlet />
}
