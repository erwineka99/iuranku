export type UserRole = 'super_admin' | 'admin' | 'resident'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  resident_id: number | null
  created_at: string
}

export interface House {
  id: number
  number: string
  block: string
  address: string
  description: string | null
  status: 'occupied' | 'unoccupied'
  current_resident: CurrentResident | null
  created_at?: string
  updated_at?: string
}

export interface CurrentResident {
  house_resident_id: number
  id: number
  full_name: string
  phone: string
  resident_type: 'permanent' | 'contract'
  is_married?: boolean
  ktp_photo_url?: string | null
  moved_in_at?: string
}

export interface Resident {
  id: number
  full_name: string
  phone: string
  resident_type: 'permanent' | 'contract'
  is_married: boolean
  ktp_photo_url: string | null
  current_house: {
    id: number
    number: string
    block: string
    moved_in_at?: string
  } | null
  house_history?: HouseHistory[]
  payment_summary?: {
    total_paid: number
    total_unpaid: number
  }
  created_at?: string
}

export interface HouseHistory {
  house_id: number
  number: string
  block: string
  moved_in_at: string
  moved_out_at: string | null
}

export interface HouseResident {
  id: number
  house_id: number
  resident_id: number
  resident: {
    id: number
    full_name: string
    phone: string
    resident_type: 'permanent' | 'contract'
  }
  moved_in_at: string
  moved_out_at: string | null
  is_active: boolean
  notes: string | null
}

export interface FeeType {
  id: number
  name: string
  amount: number
  description: string | null
  created_at?: string
  updated_at?: string
}

export interface Bill {
  id: number
  house: { id: number; number: string; block: string; address?: string }
  resident: { id: number; full_name: string; phone?: string }
  fee_type: { id: number; name: string; amount: number }
  year: number
  month: number
  amount: number
  status: 'paid' | 'unpaid'
  paid_at: string | null
  payment_id: number | null
  notes?: string | null
  created_at?: string
}

export interface Payment {
  id: number
  house?: { id: number; number: string; block: string }
  resident: { id: number; full_name: string }
  paid_at: string
  total_amount: number
  notes: string | null
  items: PaymentItem[]
  created_at?: string
}

export interface PaymentItem {
  bill_id: number
  fee_type: string
  year: number
  month: number
  amount: number
}

export interface Expense {
  id: number
  category: string
  description: string
  amount: number
  expense_date: string
  notes: string | null
  created_at?: string
  updated_at?: string
}

export interface MonthlySummary {
  month: number
  month_label: string
  income: number
  expense: number
  balance: number
}

export interface ReportSummary {
  year: number
  months: MonthlySummary[]
  annual_summary: {
    total_income: number
    total_expense: number
    total_balance: number
  }
}

export interface ReportMonthly {
  year: number
  month: number
  month_label: string
  income: {
    total: number
    items: {
      payment_id: number
      house: string
      resident: string
      fee_type: string
      amount: number
      paid_at: string
    }[]
  }
  expense: {
    total: number
    items: {
      expense_id: number
      category: string
      description: string
      amount: number
      expense_date: string
    }[]
  }
  balance: number
  bill_summary: {
    total_bills: number
    paid: number
    unpaid: number
    collection_rate: string
  }
}

export interface DashboardData {
  houses: { total: number; occupied: number; unoccupied: number }
  residents: { total: number; permanent: number; contract: number }
  current_month: {
    label: string
    income: number
    expense: number
    balance: number
    bills: { total: number; paid: number; unpaid: number; collection_rate: string }
  }
  unpaid_bills_by_house: {
    house_id: number
    number: string
    block: string
    resident: string
    unpaid_count: number
    unpaid_amount: number
  }[]
}

// tipe untuk response list dengan meta
export interface ListResponse<T> {
  data: T[]
  meta?: Record<string, number | string>
}

// tipe untuk response single item
export interface SingleResponse<T> {
  data: T
  message?: string
}

// --- Resident Portal ---
export interface ResidentDashboard {
  resident: {
    id: number
    full_name: string
    phone: string
    resident_type: 'permanent' | 'contract'
    is_married: boolean
  }
  house: {
    id: number
    number: string
    block: string
    address: string
    moved_in_at: string
  } | null
  bill_summary: {
    total: number
    paid: number
    unpaid: number
    unpaid_amount: number
  }
}

export interface ResidentBill {
  id: number
  fee_type: { id: number; name: string }
  year: number
  month: number
  amount: number
  status: 'paid' | 'unpaid'
  paid_at: string | null
}

export interface ResidentPayment {
  id: number
  paid_at: string
  total_amount: number
  notes: string | null
  items: {
    bill_id: number
    fee_type: string
    year: number
    month: number
    amount: number
  }[]
}

export interface ResidentExpense {
  id: number
  category: string
  description: string
  amount: number
  expense_date: string
}

// --- User Management ---
export interface AppUser {
  id: number
  name: string
  email: string
  role: UserRole
  resident: { id: number; full_name: string; phone: string } | null
  created_at: string
}
