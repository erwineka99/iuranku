<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResidentRequest;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index(): JsonResponse
    {
        $residents = Resident::with('currentHouse')->latest()->get();

        return response()->json($residents);
    }

    public function store(ResidentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo'] = $request->file('ktp_photo')->store('ktp', 'public');
        }

        $resident = Resident::create($data);

        return response()->json($resident, 201);
    }

    public function show(Resident $resident): JsonResponse
    {
        $resident->load('currentHouse', 'houseHistories');

        return response()->json($resident);
    }

    public function update(ResidentRequest $request, Resident $resident): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            // hapus foto lama jika ada
            if ($resident->ktp_photo) {
                Storage::disk('public')->delete($resident->ktp_photo);
            }
            $data['ktp_photo'] = $request->file('ktp_photo')->store('ktp', 'public');
        }

        $resident->update($data);

        return response()->json($resident);
    }

    public function destroy(Resident $resident): JsonResponse
    {
        // cegah hapus penghuni yang sedang aktif menghuni rumah
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
}
