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
        // assign 15 penghuni tetap ke 15 rumah pertama (A1–D5 kecuali 5 terakhir)
        // 5 rumah sisanya (D1–D5) dibiarkan unoccupied atau sebagian kontrak
        $assignments = [
            // house_id => resident_id, moved_in_at
            1  => [1,  '2022-01-01'],
            2  => [2,  '2022-02-01'],
            3  => [3,  '2022-01-15'],
            4  => [4,  '2022-03-01'],
            5  => [5,  '2022-01-01'],
            6  => [6,  '2022-04-01'],
            7  => [7,  '2022-05-01'],
            8  => [8,  '2022-02-15'],
            9  => [9,  '2022-06-01'],
            10 => [10, '2022-03-15'],
            11 => [11, '2022-07-01'],
            12 => [12, '2022-01-01'],
            13 => [13, '2022-08-01'],
            14 => [14, '2022-04-15'],
            15 => [15, '2022-09-01'],
            // 2 penghuni kontrak di blok D
            16 => [16, '2024-01-01'],
            17 => [17, '2024-03-01'],
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

            // buat akun user untuk penghuni
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

        // 3 rumah di blok D sisa dibiarkan unoccupied (house_id 18, 19, 20)
    }
}
