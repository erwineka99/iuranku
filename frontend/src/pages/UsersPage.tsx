import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { AppUser, UserRole } from '@/types'
import { useAuth } from '@/context/AuthContext'

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  resident: 'Penghuni',
}

const ROLE_COLOR: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  resident: 'bg-green-100 text-green-700',
}

interface UserForm {
  name: string
  email: string
  password: string
  role: 'super_admin' | 'admin'
}

const emptyForm: UserForm = { name: '', email: '', password: '', role: 'admin' }

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [resetTarget, setResetTarget] = useState<AppUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  function load() {
    setLoading(true)
    api.get('/users').then((res) => setUsers(res.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleStore(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await api.post('/users', form)
      setShowModal(false); setForm(emptyForm); load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan.')
    } finally { setSaving(false) }
  }

  async function handleDelete(u: AppUser) {
    if (!confirm(`Hapus user "${u.name}"?`)) return
    await api.delete(`/users/${u.id}`); load()
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetTarget) return
    setResetting(true)
    try {
      await api.put(`/users/${resetTarget.id}`, { password: newPassword })
      setResetTarget(null); setNewPassword('')
    } finally { setResetting(false) }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} akun terdaftar</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(emptyForm); setError('') }}
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
          + Tambah Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Pengguna</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Penghuni</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-xs font-bold text-green-800 shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                      {u.id === me?.id && <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Saya</span>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLOR[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {u.resident ? u.resident.full_name : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-3">
                    {u.role !== 'resident' && (
                      <button onClick={() => { setResetTarget(u); setNewPassword('') }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium">Reset Password</button>
                    )}
                    {u.id !== me?.id && u.role !== 'resident' && (
                      <button onClick={() => handleDelete(u)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal tambah admin */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Tambah Admin</h3>
                <p className="text-xs text-gray-400 mt-0.5">Buat akun admin atau super admin baru</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleStore} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required className={inputCls} placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required className={inputCls} placeholder="budi@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required minLength={6} className={inputCls} placeholder="Min. 6 karakter" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'super_admin' | 'admin' })}
                  className={inputCls}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal reset password */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Reset Password</h3>
                <p className="text-xs text-gray-400 mt-0.5">{resetTarget.name}</p>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password Baru</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required minLength={6} className={inputCls} placeholder="Min. 6 karakter" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setResetTarget(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={resetting}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60">
                  {resetting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
