import { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import api from '@/api/axios'
import type { Bill, FeeType, House } from '@/types'
import { useAuth } from '@/context/AuthContext'

type HouseOption = { value: number; label: string }

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
  const [filterSearch, setFilterSearch] = useState('')

  const [showGenerate, setShowGenerate] = useState(false)
  const [genYear, setGenYear] = useState(CURRENT_YEAR)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState('')

  const [showManual, setShowManual] = useState(false)
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [selectedHouse, setSelectedHouse] = useState<HouseOption | null>(null)
  const [manualForm, setManualForm] = useState({ fee_type_id: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1 })
  const [prepaymentBalances, setPrepaymentBalances] = useState<Record<number, number>>({}) // fee_type_id → remaining_balance
  const [usePrepayment, setUsePrepayment] = useState(false)
  const [manualError, setManualError] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadHouseOptions(inputValue: string): Promise<HouseOption[]> {
    const res = await api.get(`/houses?status=occupied&search=${encodeURIComponent(inputValue)}&per_page=20`)
    return (res.data.data as House[]).map((h) => ({
      value: h.id,
      label: `${h.block}${h.number}${h.current_resident ? ` — ${h.current_resident.full_name}` : ''}`,
    }))
  }

  function buildQuery() {
    const p = new URLSearchParams()
    if (filterYear) p.set('year', String(filterYear))
    if (filterMonth) p.set('month', String(filterMonth))
    if (filterStatus) p.set('status', filterStatus)
    if (filterSearch.trim()) p.set('search', filterSearch.trim())
    return p.toString()
  }

  function fetchBills() {
    setLoading(true)
    api.get(`/bills?${buildQuery()}`)
      .then((res) => { setBills(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(() => fetchBills(), filterSearch ? 400 : 0)
    return () => clearTimeout(t)
  }, [filterYear, filterMonth, filterStatus, filterSearch])

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
    const feeRes = await api.get('/fee-types')
    setFeeTypes(feeRes.data.data)
    setSelectedHouse(null)
    setPrepaymentBalances({})
    setUsePrepayment(false)
    setManualForm({ fee_type_id: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1 })
    setManualError(''); setShowManual(true)
  }

  async function handleHouseChange(opt: HouseOption | null) {
    setSelectedHouse(opt)
    setUsePrepayment(false)
    setPrepaymentBalances({})
    if (!opt) return
    // ambil saldo prepayment milik penghuni di rumah ini
    const house = (await api.get(`/houses/${opt.value}`)).data.data
    const residentId = house.current_resident?.id
    if (!residentId) return
    const res = await api.get(`/prepayments?resident_id=${residentId}&has_balance=1`)
    const balances: Record<number, number> = {}
    for (const p of res.data.data) {
      // akumulasi jika ada lebih dari 1 prepayment per jenis iuran
      balances[p.fee_type.id] = (balances[p.fee_type.id] ?? 0) + p.remaining_balance
    }
    setPrepaymentBalances(balances)
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedHouse) { setManualError('Pilih rumah terlebih dahulu'); return }
    setSaving(true); setManualError('')
    try {
      const ft = feeTypes.find((f) => f.id === Number(manualForm.fee_type_id))
      const billRes = await api.post('/bills', {
        house_id: selectedHouse.value,
        fee_type_id: Number(manualForm.fee_type_id),
        year: manualForm.year, month: manualForm.month,
        amount: ft!.amount,
      })
      if (usePrepayment) {
        await api.post(`/bills/${billRes.data.data.id}/apply-prepayment`)
      }
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

  async function handleApplyPrepayment(bill: Bill) {
    if (!confirm(`Lunasi tagihan ${bill.house.block}${bill.house.number} (${bill.fee_type.name} ${BULAN[bill.month]} ${bill.year}) menggunakan saldo bayar dimuka?`)) return
    try {
      await api.post(`/bills/${bill.id}/apply-prepayment`)
      fetchBills()
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Gagal menerapkan saldo dimuka')
    }
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
        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Cari nama penghuni / blok / nomor..."
          className={`${inputCls} flex-1 min-w-48`}
        />
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
              <th className="px-5 py-3" />
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
                <td className="px-5 py-3.5 text-right">
                  {b.status === 'unpaid' && (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleApplyPrepayment(b)}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium whitespace-nowrap"
                        title="Lunasi dengan saldo bayar dimuka">
                        Pakai Saldo
                      </button>
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(b)} className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                      )}
                    </div>
                  )}
                </td>
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
                <AsyncSelect<HouseOption>
                  value={selectedHouse}
                  onChange={handleHouseChange}
                  loadOptions={loadHouseOptions}
                  defaultOptions
                  isClearable
                  placeholder="Ketik blok/nomor/nama penghuni..."
                  loadingMessage={() => 'Mencari...'}
                  noOptionsMessage={({ inputValue }) => inputValue ? 'Rumah tidak ditemukan' : 'Ketik untuk mencari'}
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Jenis Iuran</label>
                <select value={manualForm.fee_type_id}
                  onChange={(e) => { setManualForm({ ...manualForm, fee_type_id: e.target.value }); setUsePrepayment(false) }}
                  className={`w-full ${inputCls}`} required>
                  <option value="">Pilih jenis iuran...</option>
                  {feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name} — {formatRupiah(f.amount)}</option>)}
                </select>
                {(() => {
                  const ft = feeTypes.find((f) => f.id === Number(manualForm.fee_type_id))
                  if (!ft) return null
                  const saldo = prepaymentBalances[ft.id] ?? 0
                  const cukup = saldo >= ft.amount
                  return (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs text-gray-400">
                        Nominal: <span className="font-semibold text-gray-700">{formatRupiah(ft.amount)}</span>
                      </p>
                      {selectedHouse && (
                        saldo > 0 ? (
                          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cukup ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div>
                              <p className={`text-xs font-semibold ${cukup ? 'text-teal-700' : 'text-amber-700'}`}>
                                Saldo dimuka: {formatRupiah(saldo)}
                              </p>
                              <p className={`text-xs ${cukup ? 'text-teal-600' : 'text-amber-600'}`}>
                                {cukup ? 'Cukup untuk melunasi tagihan ini' : 'Saldo tidak cukup'}
                              </p>
                            </div>
                            {cukup && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={usePrepayment}
                                  onChange={(e) => setUsePrepayment(e.target.checked)}
                                  className="w-4 h-4 rounded accent-teal-600" />
                                <span className="text-xs font-medium text-teal-700">Pakai saldo</span>
                              </label>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Tidak ada saldo dimuka untuk jenis iuran ini.</p>
                        )
                      )}
                    </div>
                  )
                })()}
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
