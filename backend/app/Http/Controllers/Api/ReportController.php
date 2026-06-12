<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Expense;
use App\Models\House;
use App\Models\Payment;
use App\Models\PaymentItem;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private const MONTH_LABELS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
        4 => 'April',   5 => 'Mei',      6 => 'Juni',
        7 => 'Juli',    8 => 'Agustus',  9 => 'September',
        10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    // GET /api/reports/dashboard
    public function dashboard(): JsonResponse
    {
        $now   = now();
        $year  = $now->year;
        $month = $now->month;

        $houses    = House::all();
        $residents = Resident::all();

        // pemasukan bulan ini: sum amount dari payment_items yang bill-nya di bulan ini
        $incomeThisMonth = PaymentItem::whereHas('bill', fn ($q) =>
            $q->where('year', $year)->where('month', $month)
        )->sum('amount');

        // pengeluaran bulan ini
        $expenseThisMonth = Expense::whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->sum('amount');

        // tagihan bulan ini
        $billsThisMonth = Bill::where('year', $year)->where('month', $month)->get();
        $totalBills  = $billsThisMonth->count();
        $paidBills   = $billsThisMonth->where('status', 'paid')->count();
        $unpaidBills = $billsThisMonth->where('status', 'unpaid')->count();

        // rumah dengan tagihan belum lunas bulan ini
        $unpaidByHouse = Bill::with(['house', 'resident'])
            ->where('year', $year)
            ->where('month', $month)
            ->where('status', 'unpaid')
            ->get()
            ->groupBy('house_id')
            ->map(function ($bills) {
                $first = $bills->first();
                return [
                    'house_id'      => $first->house->id,
                    'number'        => $first->house->number,
                    'block'         => $first->house->block,
                    'resident'      => $first->resident->full_name,
                    'unpaid_count'  => $bills->count(),
                    'unpaid_amount' => $bills->sum('amount'),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'houses' => [
                    'total'      => $houses->count(),
                    'occupied'   => $houses->where('status', 'occupied')->count(),
                    'unoccupied' => $houses->where('status', 'unoccupied')->count(),
                ],
                'residents' => [
                    'total'     => $residents->count(),
                    'permanent' => $residents->where('resident_type', 'permanent')->count(),
                    'contract'  => $residents->where('resident_type', 'contract')->count(),
                ],
                'current_month' => [
                    'label'   => self::MONTH_LABELS[$month] . ' ' . $year,
                    'income'  => $incomeThisMonth,
                    'expense' => $expenseThisMonth,
                    'balance' => $incomeThisMonth - $expenseThisMonth,
                    'bills'   => [
                        'total'           => $totalBills,
                        'paid'            => $paidBills,
                        'unpaid'          => $unpaidBills,
                        'collection_rate' => $totalBills > 0
                            ? number_format(($paidBills / $totalBills) * 100, 2) . '%'
                            : '0%',
                    ],
                ],
                'unpaid_bills_by_house' => $unpaidByHouse,
            ],
        ]);
    }

    // GET /api/reports/summary?year=2024
    public function summary(Request $request): JsonResponse
    {
        $request->validate(['year' => 'required|integer|min:2000|max:2100']);
        $year = (int) $request->year;

        $months = [];
        $totalIncome  = 0;
        $totalExpense = 0;

        for ($m = 1; $m <= 12; $m++) {
            // pemasukan: dari payment_items yang bill-nya di bulan ini
            $income = PaymentItem::whereHas('bill', fn ($q) =>
                $q->where('year', $year)->where('month', $m)
            )->sum('amount');

            // pengeluaran: dari expenses di bulan ini
            $expense = Expense::whereYear('expense_date', $year)
                ->whereMonth('expense_date', $m)
                ->sum('amount');

            $totalIncome  += $income;
            $totalExpense += $expense;

            $months[] = [
                'month'       => $m,
                'month_label' => self::MONTH_LABELS[$m],
                'income'      => $income,
                'expense'     => $expense,
                'balance'     => $income - $expense,
            ];
        }

        return response()->json([
            'data' => [
                'year'           => $year,
                'months'         => $months,
                'annual_summary' => [
                    'total_income'  => $totalIncome,
                    'total_expense' => $totalExpense,
                    'total_balance' => $totalIncome - $totalExpense,
                ],
            ],
        ]);
    }

    // GET /api/reports/monthly?year=2024&month=6
    public function monthly(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year  = (int) $request->year;
        $month = (int) $request->month;

        // pemasukan: detail per payment_item yang bill-nya di bulan ini
        $incomeItems = PaymentItem::with(['bill.feeType', 'bill.house', 'payment.resident'])
            ->whereHas('bill', fn ($q) => $q->where('year', $year)->where('month', $month))
            ->get()
            ->map(fn ($item) => [
                'payment_id' => $item->payment_id,
                'house'      => $item->bill->house->number . $item->bill->house->block,
                'resident'   => $item->payment->resident->full_name,
                'fee_type'   => $item->bill->feeType->name,
                'amount'     => $item->amount,
                'paid_at'    => $item->payment->paid_at?->toDateString(),
            ]);

        $totalIncome = $incomeItems->sum('amount');

        // pengeluaran: detail expenses di bulan ini
        $expenseItems = Expense::whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->orderBy('expense_date')
            ->get()
            ->map(fn ($e) => [
                'expense_id'   => $e->id,
                'category'     => $e->category,
                'description'  => $e->description,
                'amount'       => $e->amount,
                'expense_date' => $e->expense_date?->toDateString(),
            ]);

        $totalExpense = $expenseItems->sum('amount');

        // ringkasan tagihan bulan ini
        $bills       = Bill::where('year', $year)->where('month', $month)->get();
        $totalBills  = $bills->count();
        $paidBills   = $bills->where('status', 'paid')->count();
        $unpaidBills = $bills->where('status', 'unpaid')->count();

        return response()->json([
            'data' => [
                'year'        => $year,
                'month'       => $month,
                'month_label' => self::MONTH_LABELS[$month] . ' ' . $year,
                'income'      => [
                    'total' => $totalIncome,
                    'items' => $incomeItems,
                ],
                'expense'     => [
                    'total' => $totalExpense,
                    'items' => $expenseItems,
                ],
                'balance'      => $totalIncome - $totalExpense,
                'bill_summary' => [
                    'total_bills'     => $totalBills,
                    'paid'            => $paidBills,
                    'unpaid'          => $unpaidBills,
                    'collection_rate' => $totalBills > 0
                        ? number_format(($paidBills / $totalBills) * 100, 2) . '%'
                        : '0%',
                ],
            ],
        ]);
    }
}
