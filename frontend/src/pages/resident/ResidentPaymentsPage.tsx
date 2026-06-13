import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { ResidentPayment } from '@/types'

const BULAN = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const BULAN_PENDEK = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function ResidentPaymentsPage() {
  const [payments, setPayments] = useState<ResidentPayment[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  function load() {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterYear) params.year = filterYear
    if (filterMonth) params.month = filterMonth
    api.get('/resident/payments', { params })
      .then((res) => { setPayments(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterYear, filterMonth])

  const selectCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Pembayaran</h1>
        <p className="text-sm text-gray-400 mt-0.5">Semua transaksi pembayaran yang sudah dicatat</p>
      </div>

      {/* Ringkasan */}
      <div className="bg-green-700 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Total Pembayaran</p>
          <p className="text-sm mt-0.5 text-green-100">{meta.total ?? 0} transaksi</p>
        </div>
        <p className="text-xl font-bold">{formatRupiah(meta.total_amount ?? 0)}</p>
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

      {/* Daftar accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm"><span className="animate-spin inline-block mr-2">◌</span>Memuat data...</div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm font-medium text-gray-600">Belum ada riwayat pembayaran.</p>
            <p className="text-xs text-gray-400 mt-1">Pembayaranmu akan muncul di sini setelah dicatat admin.</p>
          </div>
        ) : payments.map((p) => (
          <div key={p.id}>
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{p.paid_at}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.items.length} tagihan dibayar</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-green-700">{formatRupiah(p.total_amount)}</span>
                <span className="text-gray-300 text-xs">{expanded === p.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {expanded === p.id && (
              <div className="border-t border-gray-50 px-5 pb-4 bg-gray-50/50">
                {p.notes && <p className="text-xs text-gray-400 pt-2 mb-2">Catatan: {p.notes}</p>}
                <table className="w-full text-xs mt-2">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide">Jenis Iuran</th>
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide">Periode</th>
                      <th className="text-right py-1.5 font-semibold uppercase tracking-wide">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {p.items.map((item) => (
                      <tr key={item.bill_id}>
                        <td className="py-1.5 text-gray-700">{item.fee_type}</td>
                        <td className="py-1.5 text-gray-500">{BULAN_PENDEK[item.month]} {item.year}</td>
                        <td className="py-1.5 text-right font-medium text-gray-700">{formatRupiah(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
