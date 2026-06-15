import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

import RequireAdmin from './RequireAdmin'
import RequireResident from './RequireResident'
import RequireSuperAdmin from './RequireSuperAdmin'

import AppLayout from '@/components/layout/AppLayout'
import ResidentLayout from '@/components/layout/ResidentLayout'

import LoginPage from '@/pages/LoginPage'

// halaman admin
import DashboardPage from '@/pages/DashboardPage'
import HousesPage from '@/pages/HousesPage'
import ResidentsPage from '@/pages/ResidentsPage'
import BillsPage from '@/pages/BillsPage'
import PaymentsPage from '@/pages/PaymentsPage'
import PrepaymentPage from '@/pages/PrepaymentPage'
import ExpensesPage from '@/pages/ExpensesPage'
import ReportsPage from '@/pages/ReportsPage'
import UsersPage from '@/pages/UsersPage'

// halaman penghuni
import ResidentDashboardPage from '@/pages/resident/ResidentDashboardPage'
import ResidentBillsPage from '@/pages/resident/ResidentBillsPage'
import ResidentPaymentsPage from '@/pages/resident/ResidentPaymentsPage'
import ResidentPrepaymentPage from '@/pages/resident/ResidentPrepaymentPage'
import ResidentExpensesPage from '@/pages/resident/ResidentExpensesPage'

function RootRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'resident') return <Navigate to="/resident/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* redirect root berdasarkan role */}
      <Route path="/" element={<RootRedirect />} />

      {/* area admin & super_admin */}
      <Route element={<RequireAdmin />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/houses" element={<HousesPage />} />
          <Route path="/residents" element={<ResidentsPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/payments"    element={<PaymentsPage />} />
          <Route path="/prepayments" element={<PrepaymentPage />} />
          <Route path="/expenses"    element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* hanya super_admin */}
          <Route element={<RequireSuperAdmin />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* area penghuni */}
      <Route element={<RequireResident />}>
        <Route element={<ResidentLayout />}>
          <Route path="/resident/dashboard"    element={<ResidentDashboardPage />} />
          <Route path="/resident/bills"        element={<ResidentBillsPage />} />
          <Route path="/resident/payments"     element={<ResidentPaymentsPage />} />
          <Route path="/resident/prepayments"  element={<ResidentPrepaymentPage />} />
          <Route path="/resident/expenses"     element={<ResidentExpensesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
