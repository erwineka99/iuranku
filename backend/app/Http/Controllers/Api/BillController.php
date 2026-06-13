<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BillRequest;
use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bill::with(['house', 'resident', 'feeType'])
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        if ($request->filled('house_id')) {
            $query->where('house_id', $request->house_id);
        }

        if ($request->filled('fee_type_id')) {
            $query->where('fee_type_id', $request->fee_type_id);
        }

        if ($request->filled('resident_id')) {
            $query->where('resident_id', $request->resident_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $bills = $query->get();

        $totalAmount = $bills->sum('amount');
        $paidAmount  = $bills->where('status', 'paid')->sum('amount');

        return response()->json([
            'data' => $bills->map(fn ($b) => $this->formatBill($b)),
            'meta' => [
                'total'          => $bills->count(),
                'paid'           => $bills->where('status', 'paid')->count(),
                'unpaid'         => $bills->where('status', 'unpaid')->count(),
                'total_amount'   => $totalAmount,
                'paid_amount'    => $paidAmount,
                'unpaid_amount'  => $totalAmount - $paidAmount,
            ],
        ]);
    }

    // POST /api/bills/generate — generate tagihan bulanan untuk semua rumah occupied
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year  = $request->year;
        $month = $request->month;

        $feeTypes       = FeeType::all();
        $activeResidents = HouseResident::with('house')
            ->where('is_active', true)
            ->whereHas('house', fn ($q) => $q->where('status', 'occupied'))
            ->get();

        $generated = 0;
        $skipped   = 0;

        foreach ($activeResidents as $hr) {
            foreach ($feeTypes as $feeType) {
                $exists = Bill::where('house_id', $hr->house_id)
                    ->where('fee_type_id', $feeType->id)
                    ->where('year', $year)
                    ->where('month', $month)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Bill::create([
                    'house_id'    => $hr->house_id,
                    'resident_id' => $hr->resident_id,
                    'fee_type_id' => $feeType->id,
                    'year'        => $year,
                    'month'       => $month,
                    'amount'      => $feeType->amount,
                    'status'      => 'unpaid',
                ]);

                $generated++;
            }
        }

        return response()->json([
            'message' => 'Tagihan berhasil di-generate',
            'data'    => [
                'year'      => $year,
                'month'     => $month,
                'generated' => $generated,
                'skipped'   => $skipped,
            ],
        ], 201);
    }

    public function store(BillRequest $request): JsonResponse
    {
        $data = $request->validated();

        // cari resident aktif di rumah tersebut
        $activeResident = HouseResident::where('house_id', $data['house_id'])
            ->where('is_active', true)
            ->first();

        if (!$activeResident) {
            return response()->json([
                'message' => 'Rumah tidak memiliki penghuni aktif',
            ], 422);
        }

        // cek duplikat
        $exists = Bill::where('house_id', $data['house_id'])
            ->where('fee_type_id', $data['fee_type_id'])
            ->where('year', $data['year'])
            ->where('month', $data['month'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Tagihan untuk rumah, jenis iuran, dan bulan ini sudah ada',
            ], 422);
        }

        $bill = Bill::create([
            ...$data,
            'resident_id' => $activeResident->resident_id,
            'status'      => 'unpaid',
        ]);

        return response()->json([
            'message' => 'Tagihan berhasil ditambahkan',
            'data'    => $bill,
        ], 201);
    }

    public function show(Bill $bill): JsonResponse
    {
        $bill->load(['house', 'resident', 'feeType']);

        return response()->json([
            'data' => [
                'id'       => $bill->id,
                'house'    => [
                    'id'      => $bill->house->id,
                    'number'  => $bill->house->number,
                    'block'   => $bill->house->block,
                    'address' => $bill->house->address,
                ],
                'resident' => [
                    'id'       => $bill->resident->id,
                    'full_name'=> $bill->resident->full_name,
                    'phone'    => $bill->resident->phone,
                ],
                'fee_type' => [
                    'id'     => $bill->feeType->id,
                    'name'   => $bill->feeType->name,
                    'amount' => $bill->feeType->amount,
                ],
                'year'       => $bill->year,
                'month'      => $bill->month,
                'amount'     => $bill->amount,
                'status'     => $bill->status,
                'notes'      => $bill->notes,
                'paid_at'    => null,
                'payment_id' => null,
                'created_at' => $bill->created_at,
            ],
        ]);
    }

    public function destroy(Bill $bill): JsonResponse
    {
        if ($bill->status === 'paid') {
            return response()->json([
                'message' => 'Tagihan yang sudah lunas tidak bisa dihapus',
            ], 422);
        }

        $bill->delete();

        return response()->json([
            'message' => 'Tagihan berhasil dihapus',
        ]);
    }

    private function formatBill(Bill $bill): array
    {
        return [
            'id'       => $bill->id,
            'house'    => [
                'id'     => $bill->house->id,
                'number' => $bill->house->number,
                'block'  => $bill->house->block,
            ],
            'resident' => [
                'id'        => $bill->resident->id,
                'full_name' => $bill->resident->full_name,
            ],
            'fee_type' => [
                'id'     => $bill->feeType->id,
                'name'   => $bill->feeType->name,
                'amount' => $bill->feeType->amount,
            ],
            'year'       => $bill->year,
            'month'      => $bill->month,
            'amount'     => $bill->amount,
            'status'     => $bill->status,
            'paid_at'    => null,
            'payment_id' => null,
        ];
    }
}
