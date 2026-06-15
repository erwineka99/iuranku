import { useEffect, useState } from 'react'
import api from '@/api/axios'

const BULAN = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

interface PrepaymentItem {
  id: number
  fee_type: { id: number; name: string }
  amount: number
  remaining_balance: number
  used_amount: number
  paid_at: string
  notes: string | null
  usages: { year: number; month: number; amount_used: number }[]
}

export default function ResidentPrepaymentPage() {
  const [prepayments, setPrepayments] = useState<PrepaymentItem[]>([])
  const [meta, setMeta] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    api.get('/resident/prepayments')
      .then((res) => { setPrepayments(res.data.data); setMeta(res.data.meta ?? {}) })
      .finally(() => setLoading(false))
  }, [])

  const usedPct = (p: PrepaymentItem) =>
    p.amount > 0 ? Math.round((p.used_amount / p.amount) * 100) : 0

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bayar Dimuka</h1>
        <p className="text-sm text-gray-400 mt-0.5">Saldo kredit yang kamu setorkan di muka</p>
      </div>

      {/* Ringkasan */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-700 rounded-2xl p-4 text-white shadow-sm">
            <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Total Disetor</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(meta.total_amount ?? 0)}</p>
            <p className="text-xs text-green-300 mt-0.5">{meta.total ?? 0} transaksi</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Saldo Tersisa</p>
            <p className={`text-xl font-bold mt-1 ${(meta.total_remaining ?? 0) > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
              {formatRupiah(meta.total_remaining ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">belum terpakai</p>
          </div>
        </div>
      )}

      {/* Daftar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <span className="animate-spin inline-block mr-2">◌</span>Memuat data...
          </div>
        ) : prepayments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm font-medium text-gray-600">Belum ada pembayaran dimuka.</p>
            <p className="text-xs text-gray-400 mt-1">Hubungi admin jika ingin bayar iuran lebih awal.</p>
          </div>
        ) : prepayments.map((p) => (
          <div key={p.id}>
            <button
              className="w-full flex items-start justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors text-left"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800">{p.fee_type.name}</p>
                  {p.remaining_balance > 0
                    ? <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">Aktif</span>
                    : <span className="text-xs bg-gray-100 text-gray-400 font-semibold px-2 py-0.5 rounded-full">Habis</span>
                  }
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Disetor {p.paid_at}</p>
                <div className="mt-2 flex items-center gap-2 max-w-48">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${usedPct(p)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{usedPct(p)}% terpakai</span>
                </div>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-xs text-gray-400">Sisa saldo</p>
                <p className={`text-sm font-bold ${p.remaining_balance > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                  {formatRupiah(p.remaining_balance)}
                </p>
                <p className="text-xs text-gray-400">dari {formatRupiah(p.amount)}</p>
              </div>
            </button>

            {expanded === p.id && (
              <div className="border-t border-gray-50 px-5 pb-4 bg-gray-50/50">
                {p.notes && (
                  <p className="text-xs text-gray-500 pt-3 mb-2">Catatan: {p.notes}</p>
                )}
                {p.usages.length === 0 ? (
                  <p className="text-xs text-gray-400 italic pt-3">Belum ada tagihan yang terpotong dari saldo ini.</p>
                ) : (
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Riwayat Pemakaian</p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="text-left py-1.5 font-semibold">Periode</th>
                          <th className="text-right py-1.5 font-semibold">Dipotong</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {p.usages
                          .sort((a, b) => b.year - a.year || b.month - a.month)
                          .map((u, i) => (
                            <tr key={i}>
                              <td className="py-1.5 text-gray-600">{BULAN[u.month]} {u.year}</td>
                              <td className="py-1.5 text-right font-semibold text-teal-600">
                                {formatRupiah(u.amount_used)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
