import { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import api from '@/api/axios'
import type { Payment, Bill, Resident } from '@/types'
import { useAuth } from '@/context/AuthContext'

type ResidentOption = { value: number; label: string }

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

export default function PaymentsPage() {
  const { isSuperAdmin } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null)
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([])
  const [selectedBills, setSelectedBills] = useState<number[]>([])
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [loadingBills, setLoadingBills] = useState(false)

  async function loadResidentOptions(inputValue: string): Promise<ResidentOption[]> {
    const res = await api.get(`/residents?search=${encodeURIComponent(inputValue)}&per_page=10`)
    return (res.data.data as Resident[])
      .filter((r) => r.current_house)
      .map((r) => ({
        value: r.id,
        label: `${r.full_name} — ${r.current_house!.block}${r.current_house!.number}`,
      }))
  }

  function buildQuery() {
    const p = new URLSearchParams()
    if (filterYear) p.set('year', filterYear)
    if (filterMonth) p.set('month', filterMonth)
    return p.toString()
  }

  function fetchPayments() {
    setLoading(true)
    api.get(`/payments?${buildQuery()}`)
      .then((res) => { setPayments(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments() }, [filterYear, filterMonth])

  function openModal() {
    setSelectedResident(null); setUnpaidBills([]); setSelectedBills([])
    setPaidAt(new Date().toISOString().slice(0, 10)); setNotes(''); setModalError('')
    setShowModal(true)
  }

  async function handleResidentChange(option: ResidentOption | null) {
    setSelectedResident(option); setSelectedBills([])
    if (!option) { setUnpaidBills([]); return }
    setLoadingBills(true)
    const res = await api.get(`/bills?resident_id=${option.value}&status=unpaid`)
    setUnpaidBills(res.data.data)
    setLoadingBills(false)
  }

  function toggleBill(id: number) {
    setSelectedBills((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const totalSelected = unpaidBills.filter((b) => selectedBills.includes(b.id)).reduce((sum, b) => sum + b.amount, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedBills.length === 0) { setModalError('Pilih minimal satu tagihan'); return }
    setSaving(true); setModalError('')
    try {
      await api.post('/payments', { resident_id: selectedResident!.value, paid_at: paidAt, bill_ids: selectedBills, notes })
      setShowModal(false); fetchPayments()
    } catch (e: any) {
      setModalError(e.response?.data?.message ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  async function handleDelete(p: Payment) {
    if (!confirm('Batalkan pembayaran ini? Tagihan terkait akan kembali ke status belum lunas.')) return
    try { await api.delete(`/payments/${p.id}`); fetchPayments() }
    catch (e: any) { alert(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-sm text-gray-400 mt-0.5">Riwayat transaksi masuk dari warga</p>
        </div>
        <button onClick={openModal}
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
          + Catat Pembayaran
        </button>
      </div>

      {/* Ringkasan */}
      {Object.keys(meta).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{meta.total}</p>
          </div>
          <div className="bg-green-700 rounded-2xl shadow-sm p-4 text-white">
            <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Total Pemasukan</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(meta.total_amount)}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={inputCls}>
          <option value="">Semua Tahun</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={inputCls}>
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{BULAN[m]}</option>
          ))}
        </select>
      </div>

      {/* Daftar accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-2xl mb-2">💸</p>
            <p className="text-sm font-medium text-gray-600">Belum ada transaksi.</p>
            <p className="text-xs text-gray-400 mt-1">Catat pembayaran pertama lewat tombol di atas.</p>
          </div>
        ) : payments.map((p) => (
          <div key={p.id}>
            <div
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-xs font-bold text-green-800 shrink-0">
                  {p.resident.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.resident.full_name}</p>
                  <p className="text-xs text-gray-400">{p.paid_at} · {p.items.length} tagihan</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-bold text-green-700">{formatRupiah(p.total_amount)}</p>
                {isSuperAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p) }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium">Batalkan</button>
                )}
                <span className="text-gray-300 text-xs">{expanded === p.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {expanded === p.id && (
              <div className="px-5 pb-4 bg-gray-50/50">
                {p.notes && <p className="text-xs text-gray-400 mb-2 pt-2">Catatan: {p.notes}</p>}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="py-2 text-left">Jenis Iuran</th>
                      <th className="py-2 text-left">Periode</th>
                      <th className="py-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 text-gray-700">{item.fee_type}</td>
                        <td className="py-1.5 text-gray-500">{BULAN[item.month]} {item.year}</td>
                        <td className="py-1.5 text-right text-gray-700">{formatRupiah(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal catat pembayaran */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">Catat Pembayaran</h3>
                <p className="text-xs text-gray-400 mt-0.5">Pilih penghuni lalu centang tagihan yang dibayar</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                {modalError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{modalError}</p>}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Penghuni</label>
                  <AsyncSelect<ResidentOption>
                    value={selectedResident}
                    onChange={handleResidentChange}
                    loadOptions={loadResidentOptions}
                    defaultOptions
                    isClearable
                    placeholder="Ketik nama penghuni..."
                    loadingMessage={() => 'Mencari...'}
                    noOptionsMessage={({ inputValue }) =>
                      inputValue ? 'Penghuni tidak ditemukan' : 'Ketik untuk mencari'
                    }
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: '0.75rem',
                        borderColor: state.isFocused ? '#15803d' : '#e5e7eb',
                        boxShadow: state.isFocused ? '0 0 0 2px #bbf7d0' : 'none',
                        fontSize: '0.875rem',
                        '&:hover': { borderColor: '#15803d' },
                      }),
                      option: (base, state) => ({
                        ...base,
                        fontSize: '0.875rem',
                        backgroundColor: state.isSelected ? '#15803d' : state.isFocused ? '#f0fdf4' : 'white',
                        color: state.isSelected ? 'white' : '#374151',
                      }),
                      menu: (base) => ({ ...base, borderRadius: '0.75rem', overflow: 'hidden', zIndex: 60 }),
                    }}
                  />
                </div>
                {selectedResident?.value && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Pilih Tagihan</label>
                    {loadingBills ? (
                      <p className="text-xs text-gray-400">Memuat tagihan...</p>
                    ) : unpaidBills.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Tidak ada tagihan yang belum lunas. 🎉</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2.5">
                        {unpaidBills.map((b) => (
                          <label key={b.id} className="flex items-center gap-2.5 text-sm cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                            <input type="checkbox" checked={selectedBills.includes(b.id)} onChange={() => toggleBill(b.id)}
                              className="w-4 h-4 rounded accent-green-600" />
                            <span className="flex-1 text-gray-700">{b.fee_type.name} — {BULAN[b.month]} {b.year}</span>
                            <span className="font-semibold text-gray-800">{formatRupiah(b.amount)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedBills.length > 0 && (
                      <div className="mt-2 px-2.5 py-2 bg-green-50 rounded-lg flex items-center justify-between">
                        <span className="text-xs text-green-700">{selectedBills.length} tagihan dipilih</span>
                        <span className="text-sm font-bold text-green-700">{formatRupiah(totalSelected)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Bayar</label>
                  <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                    className={`w-full ${inputCls}`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Catatan <span className="text-gray-300 font-normal">(opsional)</span></label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: Bayar via transfer BCA" className={`w-full ${inputCls}`} />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={saving || selectedBills.length === 0}
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
