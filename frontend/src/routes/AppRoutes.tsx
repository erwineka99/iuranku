import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import HousesPage from '@/pages/HousesPage'
import ResidentsPage from '@/pages/ResidentsPage'
import BillsPage from '@/pages/BillsPage'
import PaymentsPage from '@/pages/PaymentsPage'
import ExpensesPage from '@/pages/ExpensesPage'
import ReportsPage from '@/pages/ReportsPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="houses" element={<HousesPage />} />
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="bills" element={<BillsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
