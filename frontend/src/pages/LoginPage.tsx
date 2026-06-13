import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role } = await login(email, password)
      navigate(role === 'resident' ? '/resident/dashboard' : '/', { replace: true })
    } catch {
      setError('Email atau password salah. Coba lagi ya.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Panel kiri — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold">
            RT
          </div>
          <span className="text-xl font-bold">Iuranku</span>
        </div>

        <div>
          <p className="text-4xl font-bold leading-snug mb-4">
            Kelola iuran RT<br />lebih mudah &<br />transparan.
          </p>
          <p className="text-green-200 text-sm leading-relaxed max-w-sm">
            Catat tagihan, rekap pembayaran, dan pantau pengeluaran RT dari satu tempat.
            Semua warga bisa cek sendiri, pengurus nggak perlu repot ditanya-tanya.
          </p>
        </div>

      </div>

      {/* Panel kanan — form login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              RT
            </div>
            <span className="text-lg font-bold text-gray-900">Iuranku</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Selamat datang!</h2>
            <p className="text-gray-500 text-sm mt-1">Masuk dulu ya, baru bisa mulai.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="contoh@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 px-4 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2 shadow-sm"
            >
              {loading ? 'Sebentar...' : 'Masuk →'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8">
            Penghuni? Login pakai email <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">nomor_hp@iuranku.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
