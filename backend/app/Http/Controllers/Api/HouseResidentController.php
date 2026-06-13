<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HouseResidentRequest;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class HouseResidentController extends Controller
{
    // GET /api/houses/{house}/residents — riwayat semua penghuni di satu rumah
    public function index(House $house): JsonResponse
    {
        $histories = $house->residentHistories()->get();

        return response()->json([
            'data' => $histories->map(fn ($hr) => [
                'id'           => $hr->id,
                'resident'     => [
                    'id'            => $hr->resident->id,
                    'full_name'     => $hr->resident->full_name,
                    'phone'         => $hr->resident->phone,
                    'resident_type' => $hr->resident->resident_type,
                ],
                'moved_in_at'  => $hr->moved_in_at?->toDateString(),
                'moved_out_at' => $hr->moved_out_at?->toDateString(),
                'is_active'    => $hr->is_active,
                'notes'        => $hr->notes,
            ]),
        ]);
    }

    // POST /api/houses/{house}/residents — assign penghuni ke rumah
    public function store(HouseResidentRequest $request, House $house): JsonResponse
    {
        $residentId = $request->validated()['resident_id'];

        // cegah penghuni yang sudah aktif di rumah lain
        $alreadyActive = HouseResident::where('resident_id', $residentId)
            ->where('is_active', true)
            ->exists();

        if ($alreadyActive) {
            return response()->json([
                'message' => 'Penghuni ini sudah menghuni rumah lain',
            ], 422);
        }

        $houseResident = HouseResident::create([
            'house_id'    => $house->id,
            'resident_id' => $residentId,
            'moved_in_at' => $request->validated()['moved_in_at'],
            'notes'       => $request->validated()['notes'] ?? null,
            'is_active'   => true,
        ]);

        $house->update(['status' => 'occupied']);

        // buat akun user untuk penghuni jika belum ada
        $resident = Resident::find($residentId);
        $email    = $resident->phone . '@iuranku.com';

        User::firstOrCreate(
            ['email' => $email],
            [
                'name'        => $resident->full_name,
                'password'    => Hash::make($resident->phone),
                'role'        => 'resident',
                'resident_id' => $resident->id,
            ]
        );

        return response()->json([
            'message' => 'Penghuni berhasil ditambahkan ke rumah',
            'data'    => [
                'id'          => $houseResident->id,
                'house_id'    => $houseResident->house_id,
                'resident_id' => $houseResident->resident_id,
                'moved_in_at' => $houseResident->moved_in_at?->toDateString(),
                'moved_out_at'=> null,
                'is_active'   => true,
                'notes'       => $houseResident->notes,
            ],
        ], 201);
    }

    // PUT /api/houses/{house}/residents/{houseResident}/checkout — checkout penghuni
    public function checkout(Request $request, House $house, HouseResident $houseResident): JsonResponse
    {
        if (!$houseResident->is_active || $houseResident->house_id !== $house->id) {
            return response()->json([
                'message' => 'Data riwayat penghuni tidak ditemukan atau penghuni sudah tidak aktif',
            ], 422);
        }

        $request->validate([
            'moved_out_at' => 'required|date|after_or_equal:' . $houseResident->moved_in_at->toDateString(),
            'notes'        => 'nullable|string',
        ]);

        $houseResident->update([
            'moved_out_at' => $request->moved_out_at,
            'is_active'    => false,
            'notes'        => $request->notes ?? $houseResident->notes,
        ]);

        // ubah status rumah jadi unoccupied jika tidak ada penghuni aktif lain
        $stillOccupied = HouseResident::where('house_id', $house->id)
            ->where('is_active', true)
            ->exists();

        if (!$stillOccupied) {
            $house->update(['status' => 'unoccupied']);
        }

        // cabut semua token penghuni agar tidak bisa login lagi setelah checkout
        $resident = $houseResident->resident;
        $userAccount = User::where('resident_id', $resident->id)->first();
        if ($userAccount) {
            $userAccount->tokens()->delete();
        }

        return response()->json([
            'message' => 'Penghuni berhasil di-checkout',
            'data'    => [
                'id'           => $houseResident->id,
                'house_id'     => $houseResident->house_id,
                'resident_id'  => $houseResident->resident_id,
                'moved_in_at'  => $houseResident->moved_in_at?->toDateString(),
                'moved_out_at' => $houseResident->moved_out_at?->toDateString(),
                'is_active'    => $houseResident->is_active,
                'notes'        => $houseResident->notes,
            ],
        ]);
    }
}
