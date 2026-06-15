<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Prepayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResidentPortalController extends Controller
{
    // GET /api/resident/dashboard — ringkasan data untuk penghuni yang login
    public function dashboard(Request $request): JsonResponse
    {
        $user     = $request->user();
        $resident = $user->resident;

        $currentHouse = $resident->currentHouse;

        $bills       = Bill::where('resident_id', $resident->id)->get();
        $unpaidBills = $bills->where('status', 'unpaid');

        return response()->json([
            'data' => [
                'resident' => [
                    'id'            => $resident->id,
                    'full_name'     => $resident->full_name,
                    'phone'         => $resident->phone,
                    'resident_type' => $resident->resident_type,
                    'is_married'    => $resident->is_married,
                ],
                'house' => $currentHouse ? [
                    'id'          => $currentHouse->house->id,
                    'number'      => $currentHouse->house->number,
                    'block'       => $currentHouse->house->block,
                    'address'     => $currentHouse->house->address,
                    'moved_in_at' => $currentHouse->moved_in_at?->toDateString(),
                ] : null,
                'bill_summary' => [
                    'total'         => $bills->count(),
                    'paid'          => $bills->where('status', 'paid')->count(),
                    'unpaid'        => $unpaidBills->count(),
                    'unpaid_amount' => $unpaidBills->sum('amount'),
                ],
            ],
        ]);
    }

    // GET /api/resident/bills — daftar tagihan milik penghuni yang login
    public function bills(Request $request): JsonResponse
    {
        $resident = $request->user()->resident;

        $query = Bill::with('feeType')
            ->where('resident_id', $resident->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $bills = $query->get();

        return response()->json([
            'data' => $bills->map(fn ($b) => [
                'id'       => $b->id,
                'fee_type' => [
                    'id'   => $b->feeType->id,
                    'name' => $b->feeType->name,
                ],
                'year'     => $b->year,
                'month'    => $b->month,
                'amount'   => $b->amount,
                'status'   => $b->status,
                'paid_at'  => $b->paid_at,
            ]),
            'meta' => [
                'total'         => $bills->count(),
                'paid'          => $bills->where('status', 'paid')->count(),
                'unpaid'        => $bills->where('status', 'unpaid')->count(),
                'unpaid_amount' => $bills->where('status', 'unpaid')->sum('amount'),
            ],
        ]);
    }

    // GET /api/resident/payments — riwayat pembayaran milik penghuni yang login
    public function payments(Request $request): JsonResponse
    {
        $resident = $request->user()->resident;

        // 1. Pembayaran tunai
        $paymentQuery = Payment::with('items.bill.feeType')
            ->where('resident_id', $resident->id)
            ->orderBy('paid_at', 'desc');

        if ($request->filled('year'))  $paymentQuery->whereYear('paid_at', $request->year);
        if ($request->filled('month')) $paymentQuery->whereMonth('paid_at', $request->month);

        $payments = $paymentQuery->get();

        $cashItems = $payments->map(fn ($p) => [
            'id'           => 'pay-' . $p->id,
            'type'         => 'cash',
            'paid_at'      => $p->paid_at?->toDateString(),
            'total_amount' => $p->total_amount,
            'notes'        => $p->notes,
            'items'        => $p->items->map(fn ($item) => [
                'bill_id'  => $item->bill_id,
                'fee_type' => $item->bill->feeType->name,
                'year'     => $item->bill->year,
                'month'    => $item->bill->month,
                'amount'   => $item->amount,
            ]),
        ]);

        // 2. Pemakaian saldo dimuka
        $usageQuery = PrepaymentUsage::with(['prepayment.feeType', 'bill'])
            ->whereHas('prepayment', fn ($q) => $q->where('resident_id', $resident->id));

        if ($request->filled('year'))  $usageQuery->whereHas('bill', fn ($q) => $q->where('year', $request->year));
        if ($request->filled('month')) $usageQuery->whereHas('bill', fn ($q) => $q->where('month', $request->month));

        $usages = $usageQuery->get();

        // kelompokkan per prepayment+tanggal agar terlihat sebagai 1 entri per pemakaian
        $prepaymentItems = $usages->map(fn ($u) => [
            'id'           => 'pre-' . $u->id,
            'type'         => 'prepayment',
            'paid_at'      => $u->bill->year . '-' . str_pad($u->bill->month, 2, '0', STR_PAD_LEFT) . '-01',
            'total_amount' => $u->amount_used,
            'notes'        => 'Dipotong dari saldo bayar dimuka',
            'items'        => [[
                'bill_id'  => $u->bill_id,
                'fee_type' => $u->prepayment->feeType->name,
                'year'     => $u->bill->year,
                'month'    => $u->bill->month,
                'amount'   => $u->amount_used,
            ]],
        ]);

        // gabung dan urutkan by paid_at desc
        $all = $cashItems->concat($prepaymentItems)
            ->sortByDesc('paid_at')
            ->values();

        return response()->json([
            'data' => $all,
            'meta' => [
                'total'              => $all->count(),
                'total_amount'       => $payments->sum('total_amount'),
                'total_prepayment'   => $usages->sum('amount_used'),
            ],
        ]);
    }

    // GET /api/resident/prepayments — saldo bayar dimuka milik penghuni yang login
    public function prepayments(Request $request): JsonResponse
    {
        $resident = $request->user()->resident;

        $prepayments = Prepayment::with(['feeType', 'usages.bill'])
            ->where('resident_id', $resident->id)
            ->orderBy('paid_at', 'desc')
            ->get();

        return response()->json([
            'data' => $prepayments->map(fn ($p) => [
                'id'                => $p->id,
                'fee_type'          => ['id' => $p->feeType->id, 'name' => $p->feeType->name],
                'amount'            => $p->amount,
                'remaining_balance' => $p->remaining_balance,
                'used_amount'       => $p->amount - $p->remaining_balance,
                'paid_at'           => $p->paid_at?->toDateString(),
                'notes'             => $p->notes,
                'usages'            => $p->usages->map(fn ($u) => [
                    'year'        => $u->bill->year,
                    'month'       => $u->bill->month,
                    'amount_used' => $u->amount_used,
                ]),
            ]),
            'meta' => [
                'total'           => $prepayments->count(),
                'total_amount'    => $prepayments->sum('amount'),
                'total_remaining' => $prepayments->sum('remaining_balance'),
            ],
        ]);
    }

    // GET /api/resident/expenses — laporan pengeluaran RT (read-only)
    public function expenses(Request $request): JsonResponse
    {
        $query = Expense::orderBy('expense_date', 'desc');

        if ($request->filled('year')) {
            $query->whereYear('expense_date', $request->year);
        }

        if ($request->filled('month')) {
            $query->whereMonth('expense_date', $request->month);
        }

        $expenses = $query->get();

        return response()->json([
            'data' => $expenses->map(fn ($e) => [
                'id'           => $e->id,
                'category'     => $e->category,
                'description'  => $e->description,
                'amount'       => $e->amount,
                'expense_date' => $e->expense_date?->toDateString(),
            ]),
            'meta' => [
                'total'        => $expenses->count(),
                'total_amount' => $expenses->sum('amount'),
            ],
        ]);
    }
}
