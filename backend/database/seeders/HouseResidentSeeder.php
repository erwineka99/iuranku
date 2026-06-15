<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\HouseResident;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HouseResidentSeeder extends Seeder
{
    public function run(): void
    {
        // house_id 1–15  → resident_id 1–15 (permanent, semua aktif)
        // house_id 16–18 → resident_id 16–18 (kontrak, aktif)
        // house_id 19–20 (C4, C5) → kosong
        $assignments = [
            // Blok A (house 1–8) → resident 1–8
             1 => [ 1, '2021-03-01'],
             2 => [ 2, '2021-05-01'],
             3 => [ 3, '2020-08-01'],
             4 => [ 4, '2022-01-01'],
             5 => [ 5, '2021-11-01'],
             6 => [ 6, '2020-06-15'],
             7 => [ 7, '2022-04-01'],
             8 => [ 8, '2021-09-01'],
            // Blok B (house 9–15) → resident 9–15
             9 => [ 9, '2021-02-01'],
            10 => [10, '2020-12-01'],
            11 => [11, '2022-03-01'],
            12 => [12, '2021-07-01'],
            13 => [13, '2020-10-01'],
            14 => [14, '2022-06-01'],
            15 => [15, '2021-04-01'],
            // Blok C (house 16–18) → kontrak
            16 => [16, '2025-06-01'],
            17 => [17, '2025-08-01'],
            18 => [18, '2025-10-01'],
            // house 19 (C4) & 20 (C5) dibiarkan kosong
        ];

        foreach ($assignments as $houseId => [$residentId, $movedIn]) {
            HouseResident::create([
                'house_id'    => $houseId,
                'resident_id' => $residentId,
                'moved_in_at' => $movedIn,
                'is_active'   => true,
                'notes'       => null,
            ]);

            House::find($houseId)->update(['status' => 'occupied']);

            $resident = Resident::find($residentId);
            User::firstOrCreate(
                ['email' => $resident->phone . '@iuranku.com'],
                [
                    'name'        => $resident->full_name,
                    'password'    => Hash::make($resident->phone),
                    'role'        => 'resident',
                    'resident_id' => $resident->id,
                ]
            );
        }
    }
}
