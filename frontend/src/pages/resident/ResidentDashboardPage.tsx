import { useEffect, useState } from 'react'
import api from '@/api/axios'
import type { ResidentDashboard } from '@/types'
import { useAuth } from '@/context/AuthContext'

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function ResidentDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ResidentDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/resident/dashboard')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const greeting = now.getHours() < 11 ? 'Selamat pagi' : now.getHours() < 15 ? 'Selamat siang' : 'Selamat sore'

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
      <span className="animate-spin">◌</span> Memuat data...
    </div>
  )
  if (!data) return <p className="text-red-500 text-sm">Gagal memuat data. Coba refresh halaman.</p>

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Sapaan */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Berikut info tagihan dan hunian kamu bulan {BULAN[now.getMonth()]} {now.getFullYear()}.
        </p>
      </div>

      {/* Info rumah */}
      {data.house ? (
        <div className="bg-green-700 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-medium text-green-200 uppercase tracking-wide mb-3">Rumah Kamu</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-lg font-bold">
              {data.house.block}{data.house.number}
            </div>
            <div>
              <p className="font-semibold text-base">{data.house.address}</p>
              <p className="text-xs text-green-200 mt-0.5">Masuk sejak {data.house.moved_in_at}</p>
              <span className="inline-block mt-1.5 bg-green-600 text-green-100 text-xs font-medium px-2 py-0.5 rounded-full">
                {data.resident.resident_type === 'permanent' ? 'Penghuni Tetap' : 'Kontrak'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-2xl mb-2">🏠</p>
          <p className="text-sm text-gray-600 font-medium">Kamu belum terdaftar di rumah manapun.</p>
          <p className="text-xs text-gray-400 mt-1">Hubungi admin RT untuk informasi lebih lanjut.</p>
        </div>
      )}

      {/* Ringkasan tagihan */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Tagihan</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{data.bill_summary.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Lunas</p>
          <p className="text-2xl font-bold text-green-700 mt-2">{data.bill_summary.paid}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 text-center ${data.bill_summary.unpaid > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Belum Lunas</p>
          <p className={`text-2xl font-bold mt-2 ${data.bill_summary.unpaid > 0 ? 'text-red-500' : 'text-gray-300'}`}>
            {data.bill_summary.unpaid}
          </p>
          {data.bill_summary.unpaid > 0 && (
            <p className="text-xs text-red-400 mt-1">{formatRupiah(data.bill_summary.unpaid_amount)}</p>
          )}
        </div>
      </div>

      {/* Data diri */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Data Diri</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Nama Lengkap</p>
            <p className="text-sm font-semibold text-gray-800">{data.resident.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">No. Telepon</p>
            <p className="text-sm font-semibold text-gray-800">{data.resident.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Status Menikah</p>
            <p className="text-sm font-semibold text-gray-800">{data.resident.is_married ? 'Sudah Menikah' : 'Belum Menikah'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tipe Penghuni</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${data.resident.resident_type === 'permanent' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {data.resident.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
