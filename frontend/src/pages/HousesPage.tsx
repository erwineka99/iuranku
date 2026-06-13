import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { House } from '@/types'
import { useAuth } from '@/context/AuthContext'

const BLOCKS = ['A', 'B', 'C', 'D']

interface HouseFormData {
  number: string; block: string; address: string; description: string
}

export default function HousesPage() {
  const { isSuperAdmin } = useAuth()
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<House | null>(null)
  const [form, setForm] = useState<HouseFormData>({ number: '', block: 'A', address: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function fetchHouses() {
    setLoading(true)
    const params = filterStatus ? `?status=${filterStatus}` : ''
    api.get(`/houses${params}`).then((res) => setHouses(res.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchHouses() }, [filterStatus])

  function openAdd() {
    setEditTarget(null); setForm({ number: '', block: 'A', address: '', description: '' }); setError(''); setShowModal(true)
  }
  function openEdit(h: House) {
    setEditTarget(h); setForm({ number: h.number, block: h.block, address: h.address, description: h.description ?? '' }); setError(''); setShowModal(true)
  }
  async function handleDelete(h: House) {
    if (!confirm(`Hapus rumah ${h.block}${h.number}?`)) return
    try { await api.delete(`/houses/${h.id}`); fetchHouses() }
    catch (e: any) { alert(e.response?.data?.message ?? 'Gagal menghapus') }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      editTarget ? await api.put(`/houses/${editTarget.id}`, form) : await api.post('/houses', form)
      setShowModal(false); fetchHouses()
    } catch (e: any) {
      const msgs = e.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : (e.response?.data?.message ?? 'Terjadi kesalahan'))
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Data Rumah</h1>
          <p className="text-sm text-gray-400 mt-0.5">{houses.length} rumah terdaftar</p>
        </div>
        <button onClick={openAdd} className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
          + Tambah Rumah
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'Semua'], ['occupied', 'Dihuni'], ['unoccupied', 'Kosong']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            className={`text-sm px-3.5 py-1.5 rounded-lg border transition-all ${filterStatus === val ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Rumah</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Alamat</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Penghuni</th>
              {isSuperAdmin && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Memuat data...</td></tr>
            ) : houses.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Belum ada rumah yang terdaftar.</td></tr>
            ) : houses.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-xs font-bold text-green-800">
                    {h.block}{h.number}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{h.address}</td>
                <td className="px-5 py-3.5">
                  {h.status === 'occupied'
                    ? <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Dihuni</span>
                    : <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">Kosong</span>
                  }
                </td>
                <td className="px-5 py-3.5 text-gray-600">{h.current_resident?.full_name ?? <span className="text-gray-300">—</span>}</td>
                {isSuperAdmin && (
                  <td className="px-5 py-3.5 text-right space-x-3">
                    <button onClick={() => openEdit(h)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                    <button onClick={() => handleDelete(h)} className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editTarget ? 'Edit Rumah' : 'Tambah Rumah Baru'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{editTarget ? `Mengubah data ${editTarget.block}${editTarget.number}` : 'Isi detail rumah yang akan didaftarkan'}</p>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Blok</label>
                  <select value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nomor</label>
                  <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="1" required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Alamat Lengkap</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Jl. Mawar No. 1 Blok A" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Keterangan <span className="text-gray-300">(opsional)</span></label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
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
