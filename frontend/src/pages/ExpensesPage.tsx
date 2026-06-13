import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { Expense } from '@/types'
import { useAuth } from '@/context/AuthContext'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const CATEGORIES = ['Gaji', 'Listrik', 'Infrastruktur', 'Kebersihan', 'Lainnya']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

interface ExpenseForm {
  category: string
  description: string
  amount: string
  expense_date: string
  notes: string
}

const emptyForm: ExpenseForm = {
  category: 'Gaji', description: '', amount: '', expense_date: '', notes: '',
}

const CAT_ICON: Record<string, string> = {
  Gaji: '👔', Listrik: '⚡', Infrastruktur: '🔧', Kebersihan: '🧹', Lainnya: '📦',
}

export default function ExpensesPage() {
  const { isSuperAdmin } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function buildQuery() {
    const p = new URLSearchParams()
    if (filterYear) p.set('year', filterYear)
    if (filterMonth) p.set('month', filterMonth)
    if (filterCat) p.set('category', filterCat)
    return p.toString()
  }

  function fetchExpenses() {
    setLoading(true)
    api.get(`/expenses?${buildQuery()}`)
      .then((res) => { setExpenses(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchExpenses() }, [filterYear, filterMonth, filterCat])

  function openAdd() {
    setEditTarget(null); setForm(emptyForm); setError(''); setShowModal(true)
  }

  function openEdit(e: Expense) {
    setEditTarget(e)
    setForm({ category: e.category, description: e.description, amount: String(e.amount), expense_date: e.expense_date, notes: e.notes ?? '' })
    setError(''); setShowModal(true)
  }

  async function handleDelete(e: Expense) {
    if (!confirm('Hapus pengeluaran ini?')) return
    try { await api.delete(`/expenses/${e.id}`); fetchExpenses() }
    catch (err: any) { alert(err.response?.data?.message ?? 'Gagal menghapus') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, amount: Number(form.amount) }
      editTarget ? await api.put(`/expenses/${editTarget.id}`, payload) : await api.post('/expenses', payload)
      setShowModal(false); fetchExpenses()
    } catch (e: any) {
      const msgs = e.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : (e.response?.data?.message ?? 'Terjadi kesalahan'))
    } finally { setSaving(false) }
  }

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-sm text-gray-400 mt-0.5">Catat semua pengeluaran kas RT</p>
        </div>
        <button onClick={openAdd}
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
          + Tambah Pengeluaran
        </button>
      </div>

      {/* Ringkasan */}
      {Object.keys(meta).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{meta.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Keluar</p>
            <p className="text-xl font-bold text-red-500 mt-1">{formatRupiah(meta.total_amount)}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Semua Tahun</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{BULAN[m]}</option>
          ))}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Tanggal</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategori</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Keterangan</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Nominal</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm font-medium text-gray-600">Belum ada pengeluaran.</p>
                <p className="text-xs text-gray-400 mt-1">Hemat sekali RT-nya!</p>
              </td></tr>
            ) : expenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{e.expense_date}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {CAT_ICON[e.category] ?? '📌'} {e.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-700">{e.description}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatRupiah(e.amount)}</td>
                <td className="px-5 py-3.5 text-right space-x-3">
                  <button onClick={() => openEdit(e)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(e)} className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{editTarget ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editTarget ? 'Ubah detail pengeluaran' : 'Catat pengeluaran kas RT'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`w-full ${inputCls}`}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Keterangan</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Misal: Bayar listrik tiang Agustus" className={`w-full ${inputCls}`} required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nominal (Rp)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={`w-full ${inputCls}`} required min="1" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal</label>
                  <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className={`w-full ${inputCls}`} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Catatan <span className="text-gray-300 font-normal">(opsional)</span></label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`w-full ${inputCls}`} />
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
        </div>
      )}
    </div>
  )
}
