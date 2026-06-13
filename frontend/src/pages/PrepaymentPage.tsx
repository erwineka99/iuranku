import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { FeeType, Resident } from '@/types'
import { useAuth } from '@/context/AuthContext'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

interface Prepayment {
  id: number
  resident: { id: number; full_name: string }
  fee_type: { id: number; name: string }
  amount: number
  remaining_balance: number
  used_amount: number
  paid_at: string
  notes: string | null
}

export default function PrepaymentPage() {
  const { isSuperAdmin } = useAuth()
  const [prepayments, setPrepayments] = useState<Prepayment[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterHasBalance, setFilterHasBalance] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [residents, setResidents] = useState<Resident[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [form, setForm] = useState({
    resident_id: '', fee_type_id: '', amount: '',
    paid_at: new Date().toISOString().slice(0, 10), notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function fetchPrepayments() {
    setLoading(true)
    const q = filterHasBalance ? '?has_balance=1' : ''
    api.get(`/prepayments${q}`)
      .then((res) => { setPrepayments(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPrepayments() }, [filterHasBalance])

  async function openModal() {
    const [rRes, fRes] = await Promise.all([api.get('/residents'), api.get('/fee-types')])
    setResidents(rRes.data.data.filter((r: Resident) => r.current_house !== null))
    setFeeTypes(fRes.data.data)
    setForm({ resident_id: '', fee_type_id: '', amount: '', paid_at: new Date().toISOString().slice(0, 10), notes: '' })
    setError(''); setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/prepayments', {
        resident_id: Number(form.resident_id),
        fee_type_id: Number(form.fee_type_id),
        amount: Number(form.amount),
        paid_at: form.paid_at,
        notes: form.notes || null,
      })
      setShowModal(false); fetchPrepayments()
    } catch (e: any) {
      const msgs = e.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : (e.response?.data?.message ?? 'Terjadi kesalahan'))
    } finally { setSaving(false) }
  }

  async function handleDelete(p: Prepayment) {
    if (!confirm(`Hapus pembayaran dimuka ${p.resident.full_name} — ${p.fee_type.name}?`)) return
    try { await api.delete(`/prepayments/${p.id}`); fetchPrepayments() }
    catch (e: any) { alert(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  const usedPct = (p: Prepayment) =>
    p.amount > 0 ? Math.round((p.used_amount / p.amount) * 100) : 0

  const selectedFeeType = feeTypes.find((f) => f.id === Number(form.fee_type_id))
  const months = selectedFeeType && form.amount ? Math.floor(Number(form.amount) / selectedFeeType.amount) : 0
  const remainder = selectedFeeType && form.amount ? Number(form.amount) % selectedFeeType.amount : 0

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bayar Dimuka</h1>
          <p className="text-sm text-gray-400 mt-0.5">Saldo kredit otomatis memotong tagihan saat di-generate</p>
        </div>
        <button onClick={openModal}
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
          + Catat Bayar Dimuka
        </button>
      </div>

      {/* Ringkasan */}
      {Object.keys(meta).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{meta.total}</p>
          </div>
          <div className="bg-green-700 rounded-2xl shadow-sm p-4 text-white">
            <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Total Disetor</p>
            <p className="text-lg font-bold mt-1">{formatRupiah(meta.total_amount)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Saldo Tersisa</p>
            <p className="text-lg font-bold text-teal-600 mt-1">{formatRupiah(meta.total_remaining)}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {[{ v: false, l: 'Semua' }, { v: true, l: 'Masih Ada Saldo' }].map(({ v, l }) => (
          <button key={String(v)} onClick={() => setFilterHasBalance(v)}
            className={`text-sm px-3.5 py-1.5 rounded-lg border transition-all ${filterHasBalance === v ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Daftar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</div>
        ) : prepayments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm font-medium text-gray-600">Belum ada pembayaran dimuka.</p>
            <p className="text-xs text-gray-400 mt-1">Catat jika ada warga yang ingin bayar di depan.</p>
          </div>
        ) : prepayments.map((p) => (
          <div key={p.id}>
            <div
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{p.resident.full_name}</p>
                  <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">{p.fee_type.name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Disetor {p.paid_at}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-48">
                    <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: `${usedPct(p)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{usedPct(p)}% terpakai</span>
                </div>
              </div>
              <div className="text-right ml-4 shrink-0 flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-400">Saldo tersisa</p>
                  <p className={`text-sm font-bold ${p.remaining_balance > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                    {formatRupiah(p.remaining_balance)}
                  </p>
                  <p className="text-xs text-gray-400">dari {formatRupiah(p.amount)}</p>
                </div>
                {isSuperAdmin && p.used_amount === 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p) }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                )}
                <span className="text-gray-300 text-xs">{expanded === p.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === p.id && (
              <PrepaymentDetail prepaymentId={p.id} />
            )}
          </div>
        ))}
      </div>

      {/* Modal tambah */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Catat Pembayaran Dimuka</h3>
                <p className="text-xs text-gray-400 mt-0.5">Saldo dipotong otomatis per jenis iuran saat generate</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Penghuni</label>
                <select value={form.resident_id} onChange={(e) => setForm({ ...form, resident_id: e.target.value })}
                  className={`w-full ${inputCls}`} required>
                  <option value="">Pilih penghuni...</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>{r.full_name} ({r.current_house!.block}{r.current_house!.number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Jenis Iuran</label>
                <select value={form.fee_type_id} onChange={(e) => setForm({ ...form, fee_type_id: e.target.value })}
                  className={`w-full ${inputCls}`} required>
                  <option value="">Pilih jenis iuran...</option>
                  {feeTypes.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} — {formatRupiah(f.amount)}/bulan</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nominal (Rp)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="1200000" className={`w-full ${inputCls}`} required min="1" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Bayar</label>
                  <input type="date" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
                    className={`w-full ${inputCls}`} required />
                </div>
              </div>
              {selectedFeeType && form.amount && months > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5 text-xs text-green-700">
                  💡 Cukup untuk <strong>{months} bulan</strong>
                  {remainder > 0 ? ` + sisa ${formatRupiah(remainder)}` : ' pas habis'}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Catatan <span className="text-gray-300 font-normal">(opsional)</span></label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Misal: Bayar dimuka 12 bulan" className={`w-full ${inputCls}`} />
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

function PrepaymentDetail({ prepaymentId }: { prepaymentId: number }) {
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => {
    api.get(`/prepayments/${prepaymentId}`).then((res) => setDetail(res.data.data))
  }, [prepaymentId])

  if (!detail) return (
    <div className="px-5 pb-4 pt-2 text-xs text-gray-400 bg-gray-50/50">
      <span className="animate-spin inline-block mr-1">◌</span> Memuat detail...
    </div>
  )

  const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

  return (
    <div className="px-5 pb-4 bg-gray-50/50">
      {detail.notes && (
        <p className="text-xs text-gray-500 mb-2 pt-2">Catatan: {detail.notes}</p>
      )}
      {detail.usages.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">Belum ada tagihan yang terpotong dari saldo ini.</p>
      ) : (
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="py-1.5 text-left font-semibold uppercase tracking-wide">Periode</th>
              <th className="py-1.5 text-right font-semibold uppercase tracking-wide">Dipotong</th>
            </tr>
          </thead>
          <tbody>
            {detail.usages.map((u: any, i: number) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-1.5 text-gray-600">{BULAN[u.month]} {u.year}</td>
                <td className="py-1.5 text-right font-semibold text-teal-600">
                  {formatRupiah(u.amount_used)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
