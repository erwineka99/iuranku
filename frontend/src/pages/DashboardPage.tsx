import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { DashboardData } from '@/types'
import { useAuth } from '@/context/AuthContext'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const greeting = now.getHours() < 11 ? 'Selamat pagi' : now.getHours() < 15 ? 'Selamat siang' : 'Selamat sore'

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
      <span className="animate-spin">◌</span> Memuat data...
    </div>
  )
  if (!data) return <p className="text-red-500 text-sm">Gagal memuat data. Coba refresh halaman.</p>

  const { houses, residents, current_month, unpaid_bills_by_house } = data

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sapaan */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Berikut ringkasan kondisi RT bulan {BULAN[now.getMonth()]} {now.getFullYear()}.
        </p>
      </div>

      {/* Kartu utama — 4 kotak */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Rumah</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{houses.total}</p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-green-600 font-medium">{houses.occupied} dihuni</span>
            {' · '}{houses.unoccupied} kosong
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Penghuni</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{residents.total}</p>
          <p className="text-xs text-gray-400 mt-1">
            {residents.permanent} tetap · {residents.contract} kontrak
          </p>
        </div>

        <div className="bg-green-700 rounded-2xl p-5 shadow-sm text-white">
          <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Pemasukan</p>
          <p className="text-xl font-bold mt-2 leading-tight">{formatRupiah(current_month.income)}</p>
          <p className="text-xs text-green-200 mt-1">{current_month.label}</p>
          <p className="text-xs text-green-100 mt-0.5">
            {current_month.bills.paid}/{current_month.bills.total} tagihan lunas
          </p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm text-white ${current_month.balance >= 0 ? 'bg-teal-600' : 'bg-orange-500'}`}>
          <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Saldo Bersih</p>
          <p className="text-xl font-bold mt-2 leading-tight">{formatRupiah(current_month.balance)}</p>
          <p className="text-xs text-white/70 mt-1">{current_month.label}</p>
          <p className="text-xs text-white/80 mt-0.5">
            Keluar {formatRupiah(current_month.expense)}
          </p>
        </div>
      </div>

      {/* Tunggakan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Tagihan Belum Lunas</h2>
            <p className="text-xs text-gray-400 mt-0.5">{current_month.label}</p>
          </div>
          {unpaid_bills_by_house.length > 0 && (
            <span className="text-xs bg-red-50 text-red-500 font-semibold px-2.5 py-1 rounded-full border border-red-100">
              {unpaid_bills_by_house.length} rumah
            </span>
          )}
        </div>

        {unpaid_bills_by_house.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm font-medium text-gray-700">Semua sudah lunas!</p>
            <p className="text-xs text-gray-400 mt-1">Warga RT bulan ini rajin-rajin. Good job!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {unpaid_bills_by_house.map((row) => (
              <div key={row.house_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {row.block}{row.number}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{row.resident}</p>
                    <p className="text-xs text-gray-400">{row.unpaid_count} tagihan belum dibayar</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">{formatRupiah(row.unpaid_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
