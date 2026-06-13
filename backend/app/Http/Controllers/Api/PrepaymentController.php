<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use App\Models\Prepayment;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrepaymentController extends Controller
{
    // GET /api/prepayments
    public function index(Request $request): JsonResponse
    {
        $query = Prepayment::with(['resident', 'feeType'])
            ->latest('paid_at');

        if ($request->filled('resident_id')) {
            $query->where('resident_id', $request->resident_id);
        }

        if ($request->filled('fee_type_id')) {
            $query->where('fee_type_id', $request->fee_type_id);
        }

        // filter: hanya yang masih punya sisa saldo
        if ($request->boolean('has_balance')) {
            $query->where('remaining_balance', '>', 0);
        }

        $prepayments = $query->get();

        return response()->json([
            'data' => $prepayments->map(fn ($p) => $this->format($p)),
            'meta' => [
                'total'             => $prepayments->count(),
                'total_amount'      => $prepayments->sum('amount'),
                'total_remaining'   => $prepayments->sum('remaining_balance'),
            ],
        ]);
    }

    // POST /api/prepayments
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resident_id' => 'required|exists:residents,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'amount'      => 'required|integer|min:1',
            'paid_at'     => 'required|date|before_or_equal:today',
            'notes'       => 'nullable|string',
        ]);

        // pastikan penghuni sedang aktif menghuni rumah
        $resident = Resident::findOrFail($data['resident_id']);
        if (!$resident->currentHouse) {
            return response()->json([
                'message' => 'Penghuni tidak sedang aktif menghuni rumah',
            ], 422);
        }

        $prepayment = Prepayment::create([
            'resident_id'       => $data['resident_id'],
            'fee_type_id'       => $data['fee_type_id'],
            'amount'            => $data['amount'],
            'remaining_balance' => $data['amount'], // saldo awal = jumlah setor
            'paid_at'           => $data['paid_at'],
            'notes'             => $data['notes'] ?? null,
        ]);

        $prepayment->load(['resident', 'feeType']);

        return response()->json([
            'message' => 'Pembayaran dimuka berhasil dicatat',
            'data'    => $this->format($prepayment),
        ], 201);
    }

    // GET /api/prepayments/{id}
    public function show(Prepayment $prepayment): JsonResponse
    {
        $prepayment->load(['resident', 'feeType', 'usages.bill']);

        return response()->json([
            'data' => $this->formatDetail($prepayment),
        ]);
    }

    // DELETE /api/prepayments/{id}
    public function destroy(Prepayment $prepayment): JsonResponse
    {
        // hanya bisa hapus jika belum ada yang terpakai
        if ($prepayment->usages()->exists()) {
            return response()->json([
                'message' => 'Pembayaran dimuka tidak bisa dihapus karena sudah sebagian terpakai untuk tagihan',
            ], 422);
        }

        $prepayment->delete();

        return response()->json(['message' => 'Pembayaran dimuka berhasil dihapus']);
    }

    // GET /api/prepayments/summary — ringkasan saldo kredit per penghuni
    public function summary(): JsonResponse
    {
        $rows = Prepayment::with(['resident', 'feeType'])
            ->where('remaining_balance', '>', 0)
            ->get()
            ->groupBy('resident_id')
            ->map(function ($group) {
                $resident = $group->first()->resident;
                return [
                    'resident_id'   => $resident->id,
                    'resident_name' => $resident->full_name,
                    'balances'      => $group->map(fn ($p) => [
                        'fee_type_id'       => $p->fee_type_id,
                        'fee_type_name'     => $p->feeType->name,
                        'remaining_balance' => $p->remaining_balance,
                    ])->values(),
                    'total_remaining' => $group->sum('remaining_balance'),
                ];
            })
            ->values();

        return response()->json(['data' => $rows]);
    }

    private function format(Prepayment $p): array
    {
        return [
            'id'                => $p->id,
            'resident'          => ['id' => $p->resident->id, 'full_name' => $p->resident->full_name],
            'fee_type'          => ['id' => $p->feeType->id, 'name' => $p->feeType->name],
            'amount'            => $p->amount,
            'remaining_balance' => $p->remaining_balance,
            'used_amount'       => $p->amount - $p->remaining_balance,
            'paid_at'           => $p->paid_at?->toDateString(),
            'notes'             => $p->notes,
            'created_at'        => $p->created_at,
        ];
    }

    private function formatDetail(Prepayment $p): array
    {
        return array_merge($this->format($p), [
            'usages' => $p->usages->map(fn ($u) => [
                'bill_id'     => $u->bill_id,
                'year'        => $u->bill->year,
                'month'       => $u->bill->month,
                'amount_used' => $u->amount_used,
            ]),
        ]);
    }
}
