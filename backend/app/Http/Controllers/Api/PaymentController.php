<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Models\Bill;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['resident', 'items.bill.feeType', 'items.bill.house'])
            ->latest('paid_at');

        if ($request->filled('resident_id')) {
            $query->where('resident_id', $request->resident_id);
        }

        if ($request->filled('house_id')) {
            $query->whereHas('items.bill', fn ($q) => $q->where('house_id', $request->house_id));
        }

        if ($request->filled('year')) {
            $query->whereYear('paid_at', $request->year);
        }

        if ($request->filled('month')) {
            $query->whereMonth('paid_at', $request->month);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('resident', fn ($q) => $q->where('full_name', 'like', "%{$search}%"));
        }

        $payments = $query->get();

        return response()->json([
            'data' => $payments->map(fn ($p) => $this->formatPayment($p)),
            'meta' => [
                'total'        => $payments->count(),
                'total_amount' => $payments->sum('total_amount'),
            ],
        ]);
    }

    public function store(PaymentRequest $request): JsonResponse
    {
        $data = $request->validated();

        // ambil semua bill yang diminta
        $bills = Bill::whereIn('id', $data['bill_ids'])->get();

        // validasi: semua bill harus unpaid
        $paid = $bills->where('status', 'paid');
        if ($paid->isNotEmpty()) {
            return response()->json([
                'message' => 'Beberapa tagihan sudah lunas',
                'errors'  => ['bill_ids' => ['Tagihan ID ' . $paid->pluck('id')->implode(', ') . ' sudah lunas']],
            ], 422);
        }

        // validasi: semua bill harus milik resident yang sama
        $wrongResident = $bills->where('resident_id', '!=', $data['resident_id']);
        if ($wrongResident->isNotEmpty()) {
            return response()->json([
                'message' => 'Beberapa tagihan bukan milik penghuni yang dipilih',
                'errors'  => ['bill_ids' => ['Tagihan tidak sesuai dengan penghuni yang dipilih']],
            ], 422);
        }

        $totalAmount = $bills->sum('amount');

        $payment = DB::transaction(function () use ($data, $bills, $totalAmount) {
            $payment = Payment::create([
                'resident_id'  => $data['resident_id'],
                'paid_at'      => $data['paid_at'],
                'total_amount' => $totalAmount,
                'notes'        => $data['notes'] ?? null,
            ]);

            foreach ($bills as $bill) {
                $payment->items()->create([
                    'bill_id' => $bill->id,
                    'amount'  => $bill->amount,
                ]);
                $bill->update(['status' => 'paid']);
            }

            return $payment;
        });

        $payment->load(['resident', 'items.bill.feeType']);

        return response()->json([
            'message' => 'Pembayaran berhasil dicatat',
            'data'    => $this->formatPayment($payment, true),
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['resident', 'items.bill.feeType', 'items.bill.house']);

        return response()->json([
            'data' => $this->formatPayment($payment, true),
        ]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        DB::transaction(function () use ($payment) {
            // kembalikan semua bill terkait ke unpaid
            $payment->items->each(function ($item) {
                $item->bill->update(['status' => 'unpaid']);
            });

            $payment->items()->delete();
            $payment->delete();
        });

        return response()->json([
            'message' => 'Pembayaran berhasil dihapus dan tagihan terkait dikembalikan ke status belum lunas',
        ]);
    }

    private function formatPayment(Payment $payment, bool $withHouse = false): array
    {
        $items = $payment->items->map(function ($item) use ($withHouse) {
            $data = [
                'bill_id'  => $item->bill_id,
                'fee_type' => $item->bill->feeType->name ?? null,
                'year'     => $item->bill->year,
                'month'    => $item->bill->month,
                'amount'   => $item->amount,
            ];

            if ($withHouse && $item->bill->house) {
                $data['house'] = $item->bill->house->number . $item->bill->house->block;
            }

            return $data;
        });

        $result = [
            'id'           => $payment->id,
            'resident'     => [
                'id'        => $payment->resident->id,
                'full_name' => $payment->resident->full_name,
            ],
            'paid_at'      => $payment->paid_at?->toDateString(),
            'total_amount' => $payment->total_amount,
            'notes'        => $payment->notes,
            'items'        => $items,
        ];

        // tambah info house dari item pertama jika ada
        if ($withHouse && $payment->items->isNotEmpty() && $payment->items->first()->bill?->house) {
            $house = $payment->items->first()->bill->house;
            $result['house'] = [
                'id'     => $house->id,
                'number' => $house->number,
                'block'  => $house->block,
            ];
        }

        return $result;
    }
}
