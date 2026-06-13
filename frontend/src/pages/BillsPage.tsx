import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { Bill, FeeType, House } from '@/types'
import { useAuth } from '@/context/AuthContext'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function BillsPage() {
  const { isSuperAdmin } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterStatus, setFilterStatus] = useState('')

  const [showGenerate, setShowGenerate] = useState(false)
  const [genYear, setGenYear] = useState(CURRENT_YEAR)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState('')

  const [showManual, setShowManual] = useState(false)
  const [houses, setHouses] = useState<House[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [manualForm, setManualForm] = useState({ house_id: '', fee_type_id: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1, amount: '' })
  const [manualError, setManualError] = useState('')
  const [saving, setSaving] = useState(false)

  function buildQuery() {
    const p = new URLSearchParams()
    if (filterYear) p.set('year', String(filterYear))
    if (filterMonth) p.set('month', String(filterMonth))
    if (filterStatus) p.set('status', filterStatus)
    return p.toString()
  }

  function fetchBills() {
    setLoading(true)
    api.get(`/bills?${buildQuery()}`)
      .then((res) => { setBills(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBills() }, [filterYear, filterMonth, filterStatus])

  async function handleGenerate() {
    setGenerating(true); setGenResult('')
    try {
      const res = await api.post('/bills/generate', { year: genYear, month: genMonth })
      const { generated, skipped, auto_paid } = res.data.data
      setGenResult(`✓ ${generated} tagihan dibuat${auto_paid > 0 ? `, ${auto_paid} langsung lunas (saldo dimuka)` : ''}. ${skipped} dilewati.`)
      fetchBills()
    } catch (e: any) {
      setGenResult('✗ ' + (e.response?.data?.message ?? 'Gagal generate'))
    } finally { setGenerating(false) }
  }

  async function openManual() {
    const [housesRes, feeRes] = await Promise.all([api.get('/houses?status=occupied'), api.get('/fee-types')])
    setHouses(housesRes.data.data)
    setFeeTypes(feeRes.data.data)
    setManualForm({ house_id: '', fee_type_id: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1, amount: '' })
    setManualError(''); setShowManual(true)
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setManualError('')
    try {
      await api.post('/bills', {
        house_id: Number(manualForm.house_id),
        fee_type_id: Number(manualForm.fee_type_id),
        year: manualForm.year, month: manualForm.month,
        amount: Number(manualForm.amount),
      })
      setShowManual(false); fetchBills()
    } catch (e: any) {
      const msgs = e.response?.data?.errors
      setManualError(msgs ? Object.values(msgs).flat().join(' ') : (e.response?.data?.message ?? 'Terjadi kesalahan'))
    } finally { setSaving(false) }
  }

  async function handleDelete(bill: Bill) {
    if (!confirm(`Hapus tagihan ${bill.house.block}${bill.house.number} — ${BULAN[bill.month]} ${bill.year}?`)) return
    try { await api.delete(`/bills/${bill.id}`); fetchBills() }
    catch (e: any) { alert(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tagihan</h1>
          <p className="text-sm text-gray-400 mt-0.5">{BULAN[filterMonth]} {filterYear}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setGenResult(''); setShowGenerate(true) }}
            className="border border-green-700 text-green-700 hover:bg-green-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Generate Tagihan
          </button>
          <button onClick={openManual}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
            + Tambah Manual
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      {Object.keys(meta).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{meta.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Lunas</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{meta.paid}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatRupiah(meta.paid_amount)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Belum Lunas</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{meta.unpaid}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatRupiah(meta.unpaid_amount)}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
          className={inputCls}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}
          className={inputCls}>
          {MONTHS.map((m) => <option key={m} value={m}>{BULAN[m]}</option>)}
        </select>
        <div className="flex gap-1.5">
          {[['', 'Semua'], ['paid', 'Lunas'], ['unpaid', 'Belum Lunas']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${filterStatus === val ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Rumah</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Penghuni</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Jenis</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Periode</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Nominal</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              {isSuperAdmin && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center">
                <p className="text-2xl mb-2">🧾</p>
                <p className="text-sm font-medium text-gray-600">Belum ada tagihan.</p>
                <p className="text-xs text-gray-400 mt-1">Coba generate tagihan atau ubah filter.</p>
              </td></tr>
            ) : bills.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center justify-center w-9 h-9 bg-green-50 rounded-xl text-xs font-bold text-green-800">
                    {b.house.block}{b.house.number}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{b.resident.full_name}</td>
                <td className="px-5 py-3.5 text-gray-600">{b.fee_type.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{BULAN[b.month]} {b.year}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatRupiah(b.amount)}</td>
                <td className="px-5 py-3.5 text-center">
                  {b.status === 'paid'
                    ? <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Lunas</span>
                    : <span className="bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-100">Belum Lunas</span>
                  }
                </td>
                {isSuperAdmin && (
                  <td className="px-5 py-3.5 text-right">
                    {b.status === 'unpaid' && (
                      <button onClick={() => handleDelete(b)} className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal generate */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Generate Tagihan Bulanan</h3>
                <p className="text-xs text-gray-400 mt-0.5">Buat tagihan untuk semua penghuni aktif</p>
              </div>
              <button onClick={() => setShowGenerate(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {genResult && (
                <p className={`text-sm px-3 py-2 rounded-lg ${genResult.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {genResult}
                </p>
              )}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tahun</label>
                  <select value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} className={`w-full ${inputCls}`}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bulan</label>
                  <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} className={`w-full ${inputCls}`}>
                    {MONTHS.map((m) => <option key={m} value={m}>{BULAN[m]}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowGenerate(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Tutup</button>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60">
                  {generating ? 'Memproses...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Modal tambah manual */}
      {showManual && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Tambah Tagihan Manual</h3>
                <p className="text-xs text-gray-400 mt-0.5">Untuk tagihan di luar siklus normal</p>
              </div>
              <button onClick={() => setShowManual(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
            </div>
            <form onSubmit={handleManualSubmit} className="px-6 py-5 space-y-4">
              {manualError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{manualError}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rumah</label>
                <select value={manualForm.house_id} onChange={(e) => setManualForm({ ...manualForm, house_id: e.target.value })}
                  className={`w-full ${inputCls}`} required>
                  <option value="">Pilih rumah...</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>{h.block}{h.number} — {h.current_resident?.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Jenis Iuran</label>
                <select value={manualForm.fee_type_id}
                  onChange={(e) => {
                    const ft = feeTypes.find((f) => f.id === Number(e.target.value))
                    setManualForm({ ...manualForm, fee_type_id: e.target.value, amount: ft ? String(ft.amount) : '' })
                  }}
                  className={`w-full ${inputCls}`} required>
                  <option value="">Pilih jenis iuran...</option>
                  {feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name} — {formatRupiah(f.amount)}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tahun</label>
                  <select value={manualForm.year} onChange={(e) => setManualForm({ ...manualForm, year: Number(e.target.value) })} className={`w-full ${inputCls}`}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bulan</label>
                  <select value={manualForm.month} onChange={(e) => setManualForm({ ...manualForm, month: Number(e.target.value) })} className={`w-full ${inputCls}`}>
                    {MONTHS.map((m) => <option key={m} value={m}>{BULAN[m]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nominal (Rp)</label>
                <input type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  className={`w-full ${inputCls}`} required min="1" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowManual(false)}
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
