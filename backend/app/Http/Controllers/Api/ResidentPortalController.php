<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Expense;
use App\Models\Payment;
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

        $query = Payment::with('items.bill.feeType')
            ->where('resident_id', $resident->id)
            ->orderBy('paid_at', 'desc');

        if ($request->filled('year')) {
            $query->whereYear('paid_at', $request->year);
        }

        if ($request->filled('month')) {
            $query->whereMonth('paid_at', $request->month);
        }

        $payments = $query->get();

        return response()->json([
            'data' => $payments->map(fn ($p) => [
                'id'           => $p->id,
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
            ]),
            'meta' => [
                'total'        => $payments->count(),
                'total_amount' => $payments->sum('total_amount'),
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
