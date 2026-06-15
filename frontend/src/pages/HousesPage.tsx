import { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import api from '@/api/axios'
import type { Bill, House, Resident } from '@/types'
import { useAuth } from '@/context/AuthContext'

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BLOCKS = ['A', 'B', 'C', 'D']

interface HouseFormData {
  number: string; block: string; address: string; description: string
}

type ResidentOption = { value: number; label: string }
type ModalMode = 'house' | 'assign' | 'checkout' | 'history'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function HousesPage() {
  const { isSuperAdmin } = useAuth()
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  // modal umum
  const [modalMode, setModalMode] = useState<ModalMode>('house')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<House | null>(null)
  const [form, setForm] = useState<HouseFormData>({ number: '', block: 'A', address: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // assign penghuni
  const [assignHouse, setAssignHouse] = useState<House | null>(null)
  const [assignResident, setAssignResident] = useState<ResidentOption | null>(null)
  const [assignMovedIn, setAssignMovedIn] = useState(new Date().toISOString().slice(0, 10))
  const [assignNotes, setAssignNotes] = useState('')

  // checkout
  const [checkoutHouse, setCheckoutHouse] = useState<House | null>(null)
  const [checkoutMovedOut, setCheckoutMovedOut] = useState(new Date().toISOString().slice(0, 10))
  const [checkoutNotes, setCheckoutNotes] = useState('')

  // history tagihan & penghuni per rumah
  const [historyHouse, setHistoryHouse] = useState<House | null>(null)
  const [historyBills, setHistoryBills] = useState<Bill[]>([])
  const [historyResidents, setHistoryResidents] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyYear, setHistoryYear] = useState<number | ''>('')
  const [expandedYear, setExpandedYear] = useState<number | null>(null)
  const [historyTab, setHistoryTab] = useState<'penghuni' | 'tagihan'>('penghuni')

  function fetchHouses() {
    setLoading(true)
    const params = filterStatus ? `?status=${filterStatus}` : ''
    api.get(`/houses${params}`).then((res) => setHouses(res.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchHouses() }, [filterStatus])

  function openAdd() {
    setEditTarget(null); setForm({ number: '', block: 'A', address: '', description: '' })
    setError(''); setModalMode('house'); setShowModal(true)
  }

  function openEdit(h: House) {
    setEditTarget(h); setForm({ number: h.number, block: h.block, address: h.address, description: h.description ?? '' })
    setError(''); setModalMode('house'); setShowModal(true)
  }

  function openAssign(h: House) {
    setAssignHouse(h); setAssignResident(null)
    setAssignMovedIn(new Date().toISOString().slice(0, 10)); setAssignNotes('')
    setError(''); setModalMode('assign'); setShowModal(true)
  }

  function openCheckout(h: House) {
    setCheckoutHouse(h)
    setCheckoutMovedOut(new Date().toISOString().slice(0, 10)); setCheckoutNotes('')
    setError(''); setModalMode('checkout'); setShowModal(true)
  }

  async function openHistory(h: House) {
    setHistoryHouse(h); setHistoryBills([]); setHistoryResidents([])
    setHistoryYear(''); setExpandedYear(null); setHistoryTab('penghuni')
    setModalMode('history'); setShowModal(true)
    setHistoryLoading(true)
    const [billsRes, residentsRes] = await Promise.all([
      api.get(`/bills?house_id=${h.id}`),
      api.get(`/houses/${h.id}/residents`),
    ])
    const bills: Bill[] = billsRes.data.data
    setHistoryBills(bills)
    setHistoryResidents(residentsRes.data.data)
    setExpandedYear(null)
    setHistoryLoading(false)
  }

  async function loadResidentOptions(inputValue: string): Promise<ResidentOption[]> {
    const res = await api.get(`/residents?search=${encodeURIComponent(inputValue)}&status=inactive&per_page=10`)
    return (res.data.data as Resident[])
      .filter((r) => !r.current_house)
      .map((r) => ({ value: r.id, label: `${r.full_name} — ${r.phone}` }))
  }

  async function handleDelete(h: House) {
    if (!confirm(`Hapus rumah ${h.block}${h.number}?`)) return
    try { await api.delete(`/houses/${h.id}`); fetchHouses() }
    catch (e: any) { alert(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  async function handleHouseSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      editTarget ? await api.put(`/houses/${editTarget.id}`, form) : await api.post('/houses', form)
      setShowModal(false); fetchHouses()
    } catch (e: any) {
      const msgs = e.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : (e.response?.data?.message ?? 'Terjadi kesalahan'))
    } finally { setSaving(false) }
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assignResident) { setError('Pilih penghuni terlebih dahulu'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/houses/${assignHouse!.id}/residents`, {
        resident_id: assignResident.value,
        moved_in_at: assignMovedIn,
        notes: assignNotes || null,
      })
      setShowModal(false); fetchHouses()
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const hrId = checkoutHouse!.current_resident!.house_resident_id
    try {
      await api.put(`/houses/${checkoutHouse!.id}/residents/${hrId}/checkout`, {
        moved_out_at: checkoutMovedOut,
        notes: checkoutNotes || null,
      })
      setShowModal(false); fetchHouses()
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  // bills yang ditampilkan — bisa difilter per tahun
  const filteredBills = historyYear
    ? historyBills.filter((b) => b.year === historyYear)
    : historyBills

  // kelompokkan per tahun, urutkan tahun terbaru dulu
  const billsByYear = filteredBills.reduce<Record<number, Bill[]>>((acc, b) => {
    if (!acc[b.year]) acc[b.year] = []
    acc[b.year].push(b)
    return acc
  }, {})
  const sortedYears = Object.keys(billsByYear).map(Number).sort((a, b) => b - a)
  const availableYears = [...new Set(historyBills.map((b) => b.year))].sort((a, b) => b - a)

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

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
              <th className="px-5 py-3" />
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
                <td className="px-5 py-3.5 text-gray-600">
                  {h.current_resident?.full_name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <button onClick={() => openHistory(h)}
                      className="text-xs text-gray-500 hover:text-gray-800 font-medium border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded-lg transition-colors">
                      Riwayat
                    </button>
                    {h.status === 'unoccupied' ? (
                      <button onClick={() => openAssign(h)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium border border-green-200 hover:border-green-400 px-2.5 py-1 rounded-lg transition-colors">
                        Assign
                      </button>
                    ) : (
                      <button onClick={() => openCheckout(h)}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium border border-amber-200 hover:border-amber-400 px-2.5 py-1 rounded-lg transition-colors">
                        Checkout
                      </button>
                    )}
                    <button onClick={() => openEdit(h)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                    {isSuperAdmin && (
                      <button onClick={() => handleDelete(h)} className="text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>
                    )}
                  </div>
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

          {/* Modal: Riwayat Rumah */}
          {modalMode === 'history' && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Rumah {historyHouse?.block}{historyHouse?.number}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {historyHouse?.address}
                    {historyHouse?.current_resident && (
                      <> · Penghuni aktif: <span className="text-green-700 font-medium">{historyHouse.current_resident.full_name}</span></>
                    )}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
              </div>

              {/* Tab switcher */}
              <div className="px-6 pt-4 flex gap-1 border-b border-gray-100">
                {(['penghuni', 'tagihan'] as const).map((tab) => (
                  <button key={tab} onClick={() => setHistoryTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                      historyTab === tab
                        ? 'text-green-700 border-green-600'
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}>
                    {tab === 'penghuni' ? 'Riwayat Penghuni' : 'Riwayat Tagihan'}
                  </button>
                ))}
              </div>

              {historyLoading ? (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">
                  <span className="animate-spin inline-block mr-2">◌</span>Memuat data...
                </div>
              ) : (
                <>
                  {/* Tab: Riwayat Penghuni */}
                  {historyTab === 'penghuni' && (
                    <div className="max-h-[55vh] overflow-y-auto">
                      {historyResidents.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-10">Belum ada riwayat penghuni.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-gray-100">
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Penghuni</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipe</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Masuk</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Keluar</th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {historyResidents.map((hr: any) => (
                              <tr key={hr.id} className="hover:bg-gray-50/60">
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-xs font-bold text-green-800 shrink-0">
                                      {hr.resident.full_name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800 text-sm">{hr.resident.full_name}</p>
                                      <p className="text-xs text-gray-400">{hr.resident.phone}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    hr.resident.resident_type === 'permanent'
                                      ? 'bg-green-50 text-green-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {hr.resident.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-600">{hr.moved_in_at ?? '—'}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{hr.moved_out_at ?? <span className="text-gray-300">—</span>}</td>
                                <td className="px-6 py-3 text-center">
                                  {hr.is_active
                                    ? <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">Aktif</span>
                                    : <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">Keluar</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Tab: Riwayat Tagihan */}
                  {historyTab === 'tagihan' && (
                    <div className="max-h-[55vh] overflow-y-auto">
                      {/* Filter tahun */}
                      <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b border-gray-50">
                        <span className="text-xs text-gray-400 font-medium">Tahun:</span>
                        <button
                          onClick={() => { setHistoryYear(''); setExpandedYear(null) }}
                          className={`text-xs px-3 py-1 rounded-lg border transition-all ${historyYear === '' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          Semua
                        </button>
                        {availableYears.map((y) => (
                          <button key={y}
                            onClick={() => { setHistoryYear(y); setExpandedYear(null) }}
                            className={`text-xs px-3 py-1 rounded-lg border transition-all ${historyYear === y ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                            {y}
                          </button>
                        ))}
                      </div>

                      <div className="px-6 py-4 space-y-3">
                        {sortedYears.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-8">Belum ada tagihan untuk rumah ini.</p>
                        ) : sortedYears.map((year) => {
                          const bills = billsByYear[year]
                          const paid   = bills.filter((b) => b.status === 'paid').length
                          const unpaid = bills.filter((b) => b.status === 'unpaid').length
                          const isExpanded = expandedYear === year

                          return (
                            <div key={year} className="border border-gray-100 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setExpandedYear(isExpanded ? null : year)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-gray-800">{year}</span>
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">{paid} lunas</span>
                                  {unpaid > 0 && (
                                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">{unpaid} belum</span>
                                  )}
                                </div>
                                <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                              </button>

                              {isExpanded && (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-100 bg-white">
                                      <th className="px-4 py-2 text-left text-gray-400 font-semibold">Penghuni</th>
                                      <th className="px-4 py-2 text-left text-gray-400 font-semibold">Jenis Iuran</th>
                                      <th className="px-4 py-2 text-left text-gray-400 font-semibold">Bulan</th>
                                      <th className="px-4 py-2 text-right text-gray-400 font-semibold">Nominal</th>
                                      <th className="px-4 py-2 text-center text-gray-400 font-semibold">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {bills
                                      .sort((a, b) => a.month - b.month || a.fee_type.id - b.fee_type.id)
                                      .map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50/60">
                                          <td className="px-4 py-2 text-gray-600">{bill.resident?.full_name ?? '—'}</td>
                                          <td className="px-4 py-2 text-gray-600">{bill.fee_type.name}</td>
                                          <td className="px-4 py-2 text-gray-500">{BULAN[bill.month]}</td>
                                          <td className="px-4 py-2 text-right text-gray-700 font-medium">{formatRupiah(bill.amount)}</td>
                                          <td className="px-4 py-2 text-center">
                                            {bill.status === 'paid'
                                              ? <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">Lunas</span>
                                              : <span className="bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded-full">Belum</span>
                                            }
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowModal(false)}
                  className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* Modal: Tambah/Edit/Assign/Checkout — semua dalam satu card max-w-md */}
          {modalMode !== 'history' && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

              {/* Modal: Tambah/Edit Rumah */}
              {modalMode === 'house' && (
                <>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">{editTarget ? 'Edit Rumah' : 'Tambah Rumah Baru'}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{editTarget ? `Mengubah data ${editTarget.block}${editTarget.number}` : 'Isi detail rumah yang akan didaftarkan'}</p>
                  </div>
                  <form onSubmit={handleHouseSubmit} className="px-6 py-5 space-y-4">
                    {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Blok</label>
                        <select value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} className={inputCls}>
                          {BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Nomor</label>
                        <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                          placeholder="1" required className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Alamat Lengkap</label>
                      <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Jl. Mawar No. 1 Blok A" required className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Keterangan <span className="text-gray-300">(opsional)</span></label>
                      <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
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
                </>
              )}

              {/* Modal: Assign Penghuni */}
              {modalMode === 'assign' && (
                <>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Assign Penghuni</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Rumah {assignHouse?.block}{assignHouse?.number} — {assignHouse?.address}</p>
                  </div>
                  <form onSubmit={handleAssignSubmit} className="px-6 py-5 space-y-4">
                    {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Penghuni</label>
                      <AsyncSelect<ResidentOption>
                        value={assignResident}
                        onChange={setAssignResident}
                        loadOptions={loadResidentOptions}
                        defaultOptions
                        isClearable
                        placeholder="Ketik nama penghuni..."
                        loadingMessage={() => 'Mencari...'}
                        noOptionsMessage={({ inputValue }) => inputValue ? 'Tidak ditemukan' : 'Ketik untuk mencari'}
                        styles={{
                          control: (base, state) => ({
                            ...base, borderRadius: '0.75rem',
                            borderColor: state.isFocused ? '#15803d' : '#e5e7eb',
                            boxShadow: state.isFocused ? '0 0 0 2px #bbf7d0' : 'none',
                            fontSize: '0.875rem', '&:hover': { borderColor: '#15803d' },
                          }),
                          option: (base, state) => ({
                            ...base, fontSize: '0.875rem',
                            backgroundColor: state.isSelected ? '#15803d' : state.isFocused ? '#f0fdf4' : 'white',
                            color: state.isSelected ? 'white' : '#374151',
                          }),
                          menu: (base) => ({ ...base, borderRadius: '0.75rem', overflow: 'hidden', zIndex: 60 }),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Masuk</label>
                      <input type="date" value={assignMovedIn} onChange={(e) => setAssignMovedIn(e.target.value)}
                        required className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Catatan <span className="text-gray-300">(opsional)</span></label>
                      <input type="text" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)}
                        placeholder="Misal: Kontrak 1 tahun" className={inputCls} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowModal(false)}
                        className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Batal</button>
                      <button type="submit" disabled={saving}
                        className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60">
                        {saving ? 'Menyimpan...' : 'Assign'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Modal: Checkout */}
              {modalMode === 'checkout' && (
                <>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Checkout Penghuni</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {checkoutHouse?.current_resident?.full_name} dari rumah {checkoutHouse?.block}{checkoutHouse?.number}
                    </p>
                  </div>
                  <form onSubmit={handleCheckoutSubmit} className="px-6 py-5 space-y-4">
                    {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Keluar</label>
                      <input type="date" value={checkoutMovedOut} onChange={(e) => setCheckoutMovedOut(e.target.value)}
                        required className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Alasan / Catatan <span className="text-gray-300">(opsional)</span></label>
                      <input type="text" value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)}
                        placeholder="Misal: Pindah domisili" className={inputCls} />
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-700">Setelah checkout, akun login penghuni ini akan dinonaktifkan otomatis.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowModal(false)}
                        className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Batal</button>
                      <button type="submit" disabled={saving}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60">
                        {saving ? 'Memproses...' : 'Checkout'}
                      </button>
                    </div>
                  </form>
                </>
              )}

            </div>
          )}

          </div>
        </div>
      )}
    </div>
  )
}
