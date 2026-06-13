import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { Resident } from '@/types'
import { useAuth } from '@/context/AuthContext'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

interface ResidentForm {
  full_name: string
  phone: string
  resident_type: 'permanent' | 'contract'
  is_married: boolean
  ktp_photo: File | null
}

const emptyForm: ResidentForm = {
  full_name: '', phone: '', resident_type: 'permanent', is_married: false, ktp_photo: null,
}

export default function ResidentsPage() {
  const { isSuperAdmin } = useAuth()
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Resident | null>(null)
  const [form, setForm] = useState<ResidentForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function fetchResidents() {
    setLoading(true)
    const params = filterType ? `?resident_type=${filterType}` : ''
    api.get(`/residents${params}`)
      .then((res) => setResidents(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchResidents() }, [filterType])

  function openAdd() {
    setEditTarget(null); setForm(emptyForm); setError(''); setShowModal(true)
  }

  function openEdit(r: Resident) {
    setEditTarget(r)
    setForm({ full_name: r.full_name, phone: r.phone, resident_type: r.resident_type, is_married: r.is_married, ktp_photo: null })
    setError(''); setShowModal(true)
  }

  async function handleDelete(r: Resident) {
    if (!confirm(`Hapus penghuni ${r.full_name}?`)) return
    try { await api.delete(`/residents/${r.id}`); fetchResidents() }
    catch (e: any) { alert(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('full_name', form.full_name)
      fd.append('phone', form.phone)
      fd.append('resident_type', form.resident_type)
      fd.append('is_married', form.is_married ? '1' : '0')
      if (form.ktp_photo) fd.append('ktp_photo', form.ktp_photo)
      if (editTarget) fd.append('_method', 'PUT')
      const url = editTarget ? `/residents/${editTarget.id}` : '/residents'
      await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowModal(false); fetchResidents()
    } catch (e: any) {
      const msgs = e.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : (e.response?.data?.message ?? 'Terjadi kesalahan'))
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Data Penghuni</h1>
          <p className="text-sm text-gray-400 mt-0.5">{residents.length} penghuni terdaftar</p>
        </div>
        <button onClick={openAdd} className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
          + Tambah Penghuni
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'Semua'], ['permanent', 'Tetap'], ['contract', 'Kontrak']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterType(val)}
            className={`text-sm px-3.5 py-1.5 rounded-lg border transition-all ${filterType === val ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Penghuni</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">No. HP</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipe</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Rumah</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Tunggakan</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</td></tr>
            ) : residents.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center">
                <p className="text-2xl mb-2">🏘️</p>
                <p className="text-sm font-medium text-gray-600">Belum ada penghuni.</p>
                <p className="text-xs text-gray-400 mt-1">Tambah penghuni lewat tombol di atas ya.</p>
              </td></tr>
            ) : residents.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-xs font-bold text-green-800 shrink-0">
                      {r.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{r.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{r.phone}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    r.resident_type === 'permanent'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {r.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {r.current_house
                    ? <span className="text-sm font-semibold text-gray-700">{r.current_house.block}{r.current_house.number}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  {r.payment_summary && r.payment_summary.total_unpaid > 0
                    ? <span className="text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">{formatRupiah(r.payment_summary.total_unpaid)}</span>
                    : <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Lunas ✓</span>
                  }
                </td>
                <td className="px-5 py-3.5 text-right space-x-3">
                  <button onClick={() => openEdit(r)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(r)} className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{editTarget ? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editTarget ? `Mengubah data ${editTarget.full_name}` : 'Isi data penghuni yang akan didaftarkan'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Lengkap</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Budi Santoso" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">No. Telepon</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipe</label>
                  <select value={form.resident_type} onChange={(e) => setForm({ ...form, resident_type: e.target.value as 'permanent' | 'contract' })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="permanent">Tetap</option>
                    <option value="contract">Kontrak</option>
                  </select>
                </div>
                <div className="flex-1 flex items-end pb-2.5">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.is_married} onChange={(e) => setForm({ ...form, is_married: e.target.checked })}
                      className="w-4 h-4 rounded accent-green-600" />
                    Sudah Menikah
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Foto KTP <span className="text-gray-300 font-normal">{editTarget ? '(kosongkan jika tidak diubah)' : '(opsional)'}</span>
                </label>
                <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, ktp_photo: e.target.files?.[0] ?? null })}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200" />
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
    </div>
  )
}
