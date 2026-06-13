import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { ResidentExpense } from '@/types'

const BULAN = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const CAT_ICON: Record<string, string> = {
  Gaji: '👔', Listrik: '⚡', Infrastruktur: '🔧', Kebersihan: '🧹', Lainnya: '📦',
}

export default function ResidentExpensesPage() {
  const [expenses, setExpenses] = useState<ResidentExpense[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR))
  const [filterMonth, setFilterMonth] = useState('')

  function load() {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterYear) params.year = filterYear
    if (filterMonth) params.month = filterMonth
    api.get('/resident/expenses', { params })
      .then((res) => { setExpenses(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterYear, filterMonth])

  const selectCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengeluaran RT</h1>
          <p className="text-sm text-gray-400 mt-0.5">Transparansi penggunaan kas RT</p>
        </div>
        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Baca saja</span>
      </div>

      {/* Ringkasan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Pengeluaran</p>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total ?? 0} item</p>
        </div>
        <p className="text-lg font-bold text-red-500">{formatRupiah(meta.total_amount ?? 0)}</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={selectCls}>
          <option value="">Semua Tahun</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectCls}>
          <option value="">Semua Bulan</option>
          {BULAN.slice(1).map((b, i) => (
            <option key={i+1} value={String(i+1)}>{b}</option>
          ))}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-sm font-medium text-gray-600">Tidak ada pengeluaran.</p>
                <p className="text-xs text-gray-400 mt-1">Coba pilih tahun atau bulan lain.</p>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
