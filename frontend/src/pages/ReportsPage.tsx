import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import api from '@/api/axios'
import type { ReportSummary, ReportMonthly } from '@/types'

function formatRupiah(n: number) {
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(1) + 'jt'
  if (n >= 1_000) return 'Rp ' + (n / 1_000).toFixed(0) + 'rb'
  return 'Rp ' + n.toLocaleString('id-ID')
}

function formatRupiahFull(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

export default function ReportsPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [monthly, setMonthly] = useState<ReportMonthly | null>(null)
  const [loadingMonthly, setLoadingMonthly] = useState(false)

  useEffect(() => {
    setLoadingSummary(true); setSelectedMonth(null); setMonthly(null)
    api.get(`/reports/summary?year=${year}`)
      .then((res) => setSummary(res.data.data))
      .finally(() => setLoadingSummary(false))
  }, [year])

  async function handleBarClick(data: any) {
    const month = data?.activePayload?.[0]?.payload?.month
    if (!month) return
    if (selectedMonth === month) { setSelectedMonth(null); setMonthly(null); return }
    setSelectedMonth(month); setLoadingMonthly(true)
    const res = await api.get(`/reports/monthly?year=${year}&month=${month}`)
    setMonthly(res.data.data); setLoadingMonthly(false)
  }

  const chartData = summary?.months.map((m) => ({
    month: m.month, label: m.month_label,
    Pemasukan: m.income, Pengeluaran: m.expense,
  })) ?? []

  const annual = summary?.annual_summary

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ringkasan pemasukan & pengeluaran RT</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Ringkasan tahunan */}
      {annual && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-700 rounded-2xl p-4 text-white shadow-sm">
            <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Total Pemasukan {year}</p>
            <p className="text-lg font-bold mt-2">{formatRupiahFull(annual.total_income)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Pengeluaran {year}</p>
            <p className="text-lg font-bold text-red-500 mt-2">{formatRupiahFull(annual.total_expense)}</p>
          </div>
          <div className={`rounded-2xl border shadow-sm p-4 ${annual.total_balance >= 0 ? 'bg-white border-gray-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Saldo Bersih {year}</p>
            <p className={`text-lg font-bold mt-2 ${annual.total_balance >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>
              {formatRupiahFull(annual.total_balance)}
            </p>
          </div>
        </div>
      )}

      {/* Grafik */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-medium text-gray-600 mb-1">Grafik Bulanan</p>
        <p className="text-xs text-gray-400 mb-4">Klik bar untuk lihat detail bulan tersebut</p>
        {loadingSummary ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            <span className="animate-spin mr-2">◌</span>Memuat grafik...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 10, fill: '#9ca3af' }} width={60} />
              <Tooltip
                formatter={(value) => [formatRupiahFull(Number(value ?? 0)), '']}
                labelFormatter={(label) => `Bulan: ${label}`}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Pemasukan" fill="#15803d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detail bulan yang dipilih */}
      {selectedMonth && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Detail {monthly?.month_label} {year}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Semua transaksi bulan ini</p>
            </div>
            <button onClick={() => { setSelectedMonth(null); setMonthly(null) }}
              className="text-gray-400 hover:text-gray-600 text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">
              Tutup ✕
            </button>
          </div>

          {loadingMonthly || !monthly ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              <span className="animate-spin inline-block mr-2">◌</span>Memuat detail...
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Mini ringkasan */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Pemasukan</p>
                  <p className="font-bold text-green-700 text-sm mt-1">{formatRupiahFull(monthly.income.total)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Pengeluaran</p>
                  <p className="font-bold text-red-500 text-sm mt-1">{formatRupiahFull(monthly.expense.total)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${monthly.balance >= 0 ? 'bg-teal-50' : 'bg-orange-50'}`}>
                  <p className="text-xs text-gray-500">Saldo</p>
                  <p className={`font-bold text-sm mt-1 ${monthly.balance >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>
                    {formatRupiahFull(monthly.balance)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Tagihan Lunas</p>
                  <p className="font-bold text-gray-800 text-sm mt-1">
                    {monthly.bill_summary.paid}/{monthly.bill_summary.total_bills}
                  </p>
                  <p className="text-xs text-gray-400">{monthly.bill_summary.collection_rate}</p>
                </div>
              </div>

              {/* Tabel pemasukan */}
              {monthly.income.items.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pemasukan</h3>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Penghuni</th>
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Rumah</th>
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Jenis</th>
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Tanggal</th>
                          <th className="px-3 py-2.5 text-right text-gray-400 font-semibold uppercase tracking-wide">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {monthly.income.items.map((item) => (
                          <tr key={item.payment_id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700">{item.resident}</td>
                            <td className="px-3 py-2 text-gray-500">{item.house}</td>
                            <td className="px-3 py-2 text-gray-500">{item.fee_type}</td>
                            <td className="px-3 py-2 text-gray-500">{item.paid_at}</td>
                            <td className="px-3 py-2 text-right font-semibold text-green-700">{formatRupiahFull(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabel pengeluaran */}
              {monthly.expense.items.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pengeluaran</h3>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Kategori</th>
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Keterangan</th>
                          <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide">Tanggal</th>
                          <th className="px-3 py-2.5 text-right text-gray-400 font-semibold uppercase tracking-wide">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {monthly.expense.items.map((item) => (
                          <tr key={item.expense_id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2">
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">{item.category}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-700">{item.description}</td>
                            <td className="px-3 py-2 text-gray-500">{item.expense_date}</td>
                            <td className="px-3 py-2 text-right font-semibold text-red-500">{formatRupiahFull(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {monthly.income.items.length === 0 && monthly.expense.items.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm text-gray-500">Tidak ada transaksi bulan ini.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
