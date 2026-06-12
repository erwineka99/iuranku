<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResidentRequest;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Resident::with('currentHouse')->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('resident_type')) {
            $query->where('resident_type', $request->resident_type);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->whereHas('currentHouse');
            } elseif ($request->status === 'inactive') {
                $query->whereDoesntHave('currentHouse');
            }
        }

        $residents = $query->get();

        return response()->json([
            'data' => $residents->map(fn ($r) => $this->formatResident($r)),
            'meta' => [
                'total'     => $residents->count(),
                'permanent' => $residents->where('resident_type', 'permanent')->count(),
                'contract'  => $residents->where('resident_type', 'contract')->count(),
            ],
        ]);
    }

    public function store(ResidentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo'] = $request->file('ktp_photo')->store('ktp', 'public');
        }

        $resident = Resident::create($data);
        $resident->load('currentHouse');

        return response()->json([
            'message' => 'Penghuni berhasil ditambahkan',
            'data'    => $this->formatResident($resident, true),
        ], 201);
    }

    public function show(Resident $resident): JsonResponse
    {
        $resident->load('currentHouse', 'houseHistories');

        $currentHouseData = null;
        if ($resident->currentHouse) {
            $house = $resident->currentHouse->house;
            $currentHouseData = [
                'id'          => $house->id,
                'number'      => $house->number,
                'block'       => $house->block,
                'moved_in_at' => $resident->currentHouse->moved_in_at,
            ];
        }

        $houseHistory = $resident->houseHistories->map(fn ($hr) => [
            'house_id'      => $hr->house_id,
            'number'        => $hr->house->number,
            'block'         => $hr->house->block,
            'moved_in_at'   => $hr->moved_in_at,
            'moved_out_at'  => $hr->moved_out_at,
        ]);

        return response()->json([
            'data' => [
                'id'             => $resident->id,
                'full_name'      => $resident->full_name,
                'phone'          => $resident->phone,
                'resident_type'  => $resident->resident_type,
                'is_married'     => $resident->is_married,
                'ktp_photo_url'  => $resident->ktp_photo
                    ? Storage::disk('public')->url($resident->ktp_photo)
                    : null,
                'current_house'  => $currentHouseData,
                'house_history'  => $houseHistory,
                'payment_summary' => [
                    'total_paid'   => 0,
                    'total_unpaid' => 0,
                ],
                'created_at' => $resident->created_at,
            ],
        ]);
    }

    public function update(ResidentRequest $request, Resident $resident): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            if ($resident->ktp_photo) {
                Storage::disk('public')->delete($resident->ktp_photo);
            }
            $data['ktp_photo'] = $request->file('ktp_photo')->store('ktp', 'public');
        }

        $resident->update($data);

        return response()->json([
            'message' => 'Penghuni berhasil diperbarui',
            'data'    => [
                'id'            => $resident->id,
                'full_name'     => $resident->full_name,
                'phone'         => $resident->phone,
                'resident_type' => $resident->resident_type,
                'is_married'    => $resident->is_married,
                'ktp_photo_url' => $resident->ktp_photo
                    ? Storage::disk('public')->url($resident->ktp_photo)
                    : null,
                'updated_at'    => $resident->updated_at,
            ],
        ]);
    }

    public function destroy(Resident $resident): JsonResponse
    {
        if ($resident->currentHouse) {
            return response()->json([
                'message' => 'Penghuni tidak bisa dihapus karena masih aktif menghuni rumah.',
            ], 422);
        }

        if ($resident->ktp_photo) {
            Storage::disk('public')->delete($resident->ktp_photo);
        }

        $resident->delete();

        return response()->json(['message' => 'Penghuni berhasil dihapus.']);
    }

    private function formatResident(Resident $resident, bool $withCreatedAt = false): array
    {
        $currentHouse = null;
        if ($resident->currentHouse && $resident->currentHouse->house) {
            $house = $resident->currentHouse->house;
            $currentHouse = [
                'id'            => $house->id,
                'number'        => $house->number,
                'block'         => $house->block,
            ];
        }

        $data = [
            'id'            => $resident->id,
            'full_name'     => $resident->full_name,
            'phone'         => $resident->phone,
            'resident_type' => $resident->resident_type,
            'is_married'    => $resident->is_married,
            'ktp_photo_url' => $resident->ktp_photo
                ? Storage::disk('public')->url($resident->ktp_photo)
                : null,
            'current_house' => $currentHouse,
        ];

        if ($withCreatedAt) {
            $data['created_at'] = $resident->created_at;
        }

        return $data;
    }
}
