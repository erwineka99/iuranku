<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeeTypeRequest;
use App\Models\FeeType;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FeeTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $feeTypes = FeeType::latest()->get();

        return response()->json([
            'data' => $feeTypes,
        ]);
    }

    public function store(FeeTypeRequest $request): JsonResponse
    {
        $feeType = FeeType::create($request->validated());

        return response()->json([
            'message' => 'Jenis iuran berhasil ditambahkan',
            'data'    => $feeType,
        ], 201);
    }

    public function update(FeeTypeRequest $request, FeeType $feeType): JsonResponse
    {
        $feeType->update($request->validated());

        return response()->json([
            'message' => 'Jenis iuran berhasil diperbarui',
            'data'    => $feeType,
        ]);
    }

    public function destroy(FeeType $feeType): JsonResponse
    {
        // cegah hapus jika sudah pernah digunakan di tagihan
        if (Schema::hasTable('bills') && DB::table('bills')->where('fee_type_id', $feeType->id)->exists()) {
            return response()->json([
                'message' => 'Jenis iuran tidak bisa dihapus karena sudah digunakan di tagihan',
            ], 422);
        }

        $feeType->delete();

        return response()->json([
            'message' => 'Jenis iuran berhasil dihapus',
        ]);
    }
}
