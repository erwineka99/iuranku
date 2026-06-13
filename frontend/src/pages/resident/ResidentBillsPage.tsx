import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { ResidentBill } from '@/types'

const BULAN_PENDEK = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function ResidentBillsPage() {
  const [bills, setBills] = useState<ResidentBill[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  function load() {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterYear) params.year = filterYear
    if (filterStatus) params.status = filterStatus
    api.get('/resident/bills', { params })
      .then((res) => { setBills(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterYear, filterStatus])

  const selectCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tagihan Saya</h1>
        <p className="text-sm text-gray-400 mt-0.5">Semua tagihan iuran yang tercatat atas namamu</p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{meta.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Lunas</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{meta.paid ?? 0}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 text-center ${(meta.unpaid ?? 0) > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Belum Lunas</p>
          <p className={`text-2xl font-bold mt-1 ${(meta.unpaid ?? 0) > 0 ? 'text-red-500' : 'text-gray-300'}`}>{meta.unpaid ?? 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={selectCls}>
          <option value="">Semua Tahun</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex gap-1.5">
          {[['', 'Semua Status'], ['unpaid', 'Belum Lunas'], ['paid', 'Lunas']].map(([val, label]) => (
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Periode</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Jenis Iuran</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Nominal</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm font-medium text-gray-600">Tidak ada tagihan.</p>
                <p className="text-xs text-gray-400 mt-1">Coba ubah filter di atas.</p>
              </td></tr>
            ) : bills.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-5 py-3.5 text-gray-700 font-medium">{BULAN_PENDEK[b.month]} {b.year}</td>
                <td className="px-5 py-3.5 text-gray-600">{b.fee_type.name}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatRupiah(b.amount)}</td>
                <td className="px-5 py-3.5 text-center">
                  {b.status === 'paid'
                    ? <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Lunas</span>
                    : <span className="bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-100">Belum Lunas</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
