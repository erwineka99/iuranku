<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HouseRequest;
use App\Models\House;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = House::with('activeResident');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('number', 'like', "%{$request->search}%")
                  ->orWhere('block', 'like', "%{$request->search}%")
                  ->orWhere('address', 'like', "%{$request->search}%");
            });
        }

        $houses = $query->orderBy('block')->orderBy('number')->get();

        return response()->json([
            'data' => $houses->map(fn ($h) => $this->formatHouse($h)),
            'meta' => [
                'total'      => $houses->count(),
                'occupied'   => $houses->where('status', 'occupied')->count(),
                'unoccupied' => $houses->where('status', 'unoccupied')->count(),
            ],
        ]);
    }

    public function store(HouseRequest $request): JsonResponse
    {
        $house = House::create($request->validated());

        return response()->json([
            'message' => 'Rumah berhasil ditambahkan',
            'data'    => $this->formatHouse($house->load('activeResident')),
        ], 201);
    }

    public function show(House $house): JsonResponse
    {
        $house->load(['activeResident', 'residentHistories']);

        return response()->json([
            'data' => $this->formatHouseDetail($house),
        ]);
    }

    public function update(HouseRequest $request, House $house): JsonResponse
    {
        $house->update($request->validated());

        return response()->json([
            'message' => 'Rumah berhasil diperbarui',
            'data'    => $this->formatHouse($house->load('activeResident')),
        ]);
    }

    public function destroy(House $house): JsonResponse
    {
        // cek apakah rumah punya riwayat penghuni — kalau ada, tidak boleh dihapus
        if ($house->residentHistories()->exists()) {
            return response()->json([
                'message' => 'Rumah tidak bisa dihapus karena memiliki riwayat penghuni.',
            ], 422);
        }

        $house->delete();

        return response()->json(['message' => 'Rumah berhasil dihapus']);
    }

    // format ringkas untuk list
    private function formatHouse(House $house): array
    {
        $active = $house->activeResident;

        return [
            'id'               => $house->id,
            'number'           => $house->number,
            'block'            => $house->block,
            'address'          => $house->address,
            'description'      => $house->description,
            'status'           => $house->status,
            'current_resident' => $active ? [
                'id'            => $active->resident->id,
                'full_name'     => $active->resident->full_name,
                'phone'         => $active->resident->phone,
                'resident_type' => $active->resident->resident_type,
            ] : null,
        ];
    }

    // format lengkap untuk halaman detail
    private function formatHouseDetail(House $house): array
    {
        $active = $house->activeResident;

        return [
            'id'          => $house->id,
            'number'      => $house->number,
            'block'       => $house->block,
            'address'     => $house->address,
            'description' => $house->description,
            'status'      => $house->status,
            'current_resident' => $active ? [
                'id'            => $active->resident->id,
                'full_name'     => $active->resident->full_name,
                'phone'         => $active->resident->phone,
                'resident_type' => $active->resident->resident_type,
                'is_married'    => $active->resident->is_married,
                'ktp_photo_url' => $active->resident->ktp_photo
                    ? asset('storage/' . $active->resident->ktp_photo)
                    : null,
                'moved_in_at'   => $active->moved_in_at,
            ] : null,
            'resident_history' => $house->residentHistories->map(fn ($h) => [
                'id'           => $h->id,
                'resident'     => [
                    'id'            => $h->resident->id,
                    'full_name'     => $h->resident->full_name,
                    'phone'         => $h->resident->phone,
                    'resident_type' => $h->resident->resident_type,
                ],
                'moved_in_at'  => $h->moved_in_at,
                'moved_out_at' => $h->moved_out_at,
                'is_active'    => $h->is_active,
                'notes'        => $h->notes,
            ]),
            'created_at'  => $house->created_at,
            'updated_at'  => $house->updated_at,
        ];
    }
}
